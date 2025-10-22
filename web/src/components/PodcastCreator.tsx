'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  AiFillPlayCircle,
  AiOutlineLink,
  AiOutlineCopy,
  AiOutlineUpload,
  AiOutlineGlobal,
  AiOutlineDown,
  AiOutlineLoading3Quarters,
  AiOutlineStar
 } from 'react-icons/ai';
 import {
  Wand2,
 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfigSelector from './ConfigSelector';
import VoicesModal from './VoicesModal'; // 引入 VoicesModal
import LoginModal from './LoginModal'; // 引入 LoginModal
import ConfirmModal from './ConfirmModal'; // 引入 ConfirmModal
import { useToast, ToastContainer } from './Toast'; // 引入 Toast Hook 和 Container
import { setItem, getItem } from '@/lib/storage'; // 引入 localStorage 工具
import { useSession } from '@/lib/auth-client'; // 引入 useSession
import type { PodcastGenerationRequest, TTSConfig, Voice, SettingsFormData } from '@/types';
import { Satisfy } from 'next/font/google'; // 导入艺术字体 Satisfy
import { useTranslation } from '../i18n/client'; // 导入 useTranslation

// 定义艺术字体，预加载并设置 fallback
const satisfy = Satisfy({
  weight: '400', // Satisfy 只有 400 权重
  subsets: ['latin'], // 根据需要选择子集，这里选择拉丁字符集
  display: 'swap', // 字体加载策略
});

interface PodcastCreatorProps {
  onGenerate: (request: PodcastGenerationRequest) => Promise<void>; // 修改为返回 Promise<void>
  isGenerating?: boolean;
  credits: number;
  settings: SettingsFormData | null; // 新增 settings 属性
  onSignInSuccess: () => void; // 新增 onSignInSuccess 属性
  enableTTSConfigPage: boolean; // 新增 enableTTSConfigPage 属性
  lang: string; // 新增 lang 属性
}

const PodcastCreator: React.FC<PodcastCreatorProps> = ({
  onGenerate,
  isGenerating = false,
  credits,
  settings, // 解构 settings 属性
  onSignInSuccess, // 解构 onSignInSuccess 属性
  enableTTSConfigPage, // 解构 enableTTSConfigPage 属性
  lang
}) => {
  const { t } = useTranslation(lang, 'components'); // 初始化 useTranslation 并指定命名空间

  const languageOptions = [
    { value: 'Chinese', label: t('podcastCreator.chinese') },
    { value: 'English', label: t('podcastCreator.english') },
    // { value: 'Japanese', label: t('podcastCreator.japanese') },
  ];

  const durationOptions = [
    { value: 'Under 5 minutes', label: t('podcastCreator.under5Minutes') },
    { value: '8-15 minutes', label: t('podcastCreator.between8And15Minutes') },
  ];

   const [topic, setTopic] = useState('');
   const [customInstructions, setCustomInstructions] = useState('');
   const [selectedMode, setSelectedMode] = useState<'ai-podcast' | 'ai-story'>('ai-podcast');
   
   // 字符数限制常量
   const MAX_CHARS_AI_PODCAST = 20000;
   const MAX_CHARS_AI_STORY = 30000;
   
   // 获取当前模式的字符数限制
   const maxChars = selectedMode === 'ai-podcast' ? MAX_CHARS_AI_PODCAST : MAX_CHARS_AI_STORY;

   // 监听模式切换，如果文本超过新模式的限制，则截断
   useEffect(() => {
     if (topic.length > maxChars) {
       const truncatedTopic = topic.substring(0, maxChars);
       setTopic(truncatedTopic);
       setItem('podcast-topic', truncatedTopic);
       error(
         t('podcastCreator.textTruncated'),
         t('podcastCreator.textTruncatedMessage', { maxChars })
       );
     }
   }, [selectedMode, maxChars]); // 只在模式切换时触发

   // 初始化时从 localStorage 加载 topic 和 customInstructions
   useEffect(() => {
     const cachedTopic = getItem<string>('podcast-topic');
     if (cachedTopic) {
       setTopic(cachedTopic);
     }
     const cachedCustomInstructions = getItem<string>('podcast-custom-instructions');
     if (cachedCustomInstructions) {
       setCustomInstructions(cachedCustomInstructions);
     }
   }, []);

   // 监听重试事件以回填输入框内容
   useEffect(() => {
     const handleRetryEvent = (e: Event) => {
       const customEvent = e as CustomEvent;
       const content = customEvent.detail.input_txt_content;

       // 如果内容包含自定义指令的标记，将其分离
       if (content.includes('```custom-begin') && content.includes('```custom-end')) {
         const customBeginIndex = content.indexOf('```custom-begin');
         const customEndIndex = content.indexOf('```custom-end') + 13; // 13 is the length of '```custom-end'

         const customInstruction = content.substring(customBeginIndex + 15, customEndIndex - 13); // 15 is the length of '```custom-begin'
         const topicContent = content.substring(customEndIndex + 1).trim(); // +1 to remove the newline after custom-end

         setTopic(topicContent);
         setCustomInstructions(customInstruction);
       } else {
         // 如果没有自定义指令标记，整个内容都是主题
         setTopic(content);
       }
     };

     window.addEventListener('retryWithContent', handleRetryEvent);

     return () => {
       window.removeEventListener('retryWithContent', handleRetryEvent);
     };
   }, []);

   const getInitialLanguage = (currentLang: string) => {
     if (currentLang.startsWith('zh')) {
       return 'Chinese';
     }
     if (currentLang.startsWith('en')) {
       return 'English';
     }
     if (currentLang.startsWith('ja')) {
       return 'Japanese';
     }
     return languageOptions[0].value; // 默认选中第一个选项
   };

   const [language, setLanguage] = useState(getInitialLanguage(lang));
   const [duration, setDuration] = useState(durationOptions[0].value);
   const [showVoicesModal, setShowVoicesModal] = useState(false); // 新增状态
   const [showLoginModal, setShowLoginModal] = useState(false); // 控制登录模态框的显示
   const [showConfirmModal, setShowConfirmModal] = useState(false); // 控制确认模态框的显示
   const [voices, setVoices] = useState<Voice[]>([]); // 从 ConfigSelector 获取 voices
   const [selectedPodcastVoices, setSelectedPodcastVoices] = useState<{[key: string]: Voice[]}>({}); // 初始为空对象，避免水合错误
   const [isVoicesLoaded, setIsVoicesLoaded] = useState(false);

   // 组件挂载后从 localStorage 加载说话人配置
   useEffect(() => {
     const cachedVoices = getItem<{[key: string]: Voice[]}>('podcast-selected-voices');
     if (cachedVoices) {
       setSelectedPodcastVoices(cachedVoices);
     }
     setIsVoicesLoaded(true);
   }, []);
   const [selectedConfig, setSelectedConfig] = useState<TTSConfig | null>(null);
   const [selectedConfigName, setSelectedConfigName] = useState<string>(''); // 新增状态来存储配置文件的名称
   const fileInputRef = useRef<HTMLInputElement>(null);

   const { toasts, error, success, removeToast } = useToast(); // 使用 useToast hook, 引入 success
   const { data: session, isPending, error: sessionError } = useSession(); // 获取 session 及其状态
   
   // 处理 session 错误
   useEffect(() => {
     if (sessionError) {
       console.error('Session error:', sessionError);
     }
   }, [sessionError]);

   const handleSubmit = async () => { // 修改为 async 函数
     if (!session?.user) { // 判断是否登录
       setShowLoginModal(true); // 未登录则显示登录模态框
       return;
     }
     if (!topic.trim()) {
         error(t('podcastCreator.topicCannotBeEmpty'), t('podcastCreator.pleaseEnterPodcastTopic'));
         return;
     }
     if (!selectedConfig) {
         error(t('podcastCreator.ttsConfigNotSelected'), t('podcastCreator.pleaseSelectTTSConfig'));
         return;
     }
 
     if (!selectedPodcastVoices[selectedConfigName] || selectedPodcastVoices[selectedConfigName].length === 0) {
         error(t('podcastCreator.pleaseSelectSpeaker'), t('podcastCreator.pleaseSelectAtLeastOneSpeaker'));
         return;
     }

    // 显示确认对话框
    setShowConfirmModal(true);
  };

  const handleConfirmGenerate = async () => {
    let inputTxtContent = topic.trim();
    
    // 只在 AI 播客模式下添加自定义指令
    if (selectedMode === 'ai-podcast' && customInstructions.trim()) {
        inputTxtContent = "```custom-begin"+`\n${customInstructions.trim()}\n`+"```custom-end"+`\n${inputTxtContent}`;
    }

    // 根据模式构建不同的请求参数
    const baseRequest = {
        tts_provider: selectedConfigName.replace('.json', ''),
        input_txt_content: inputTxtContent,
        podUsers_json_content: JSON.stringify(selectedPodcastVoices[selectedConfigName] || []),
        mode: selectedMode, // 添加模式标识
        ...(enableTTSConfigPage ? {
          tts_providers_config_content: JSON.stringify(settings),
          api_key: settings?.apikey,
          base_url: settings?.baseurl,
          model: settings?.model,
        } : {})
    };

    // 只在 AI 播客模式下添加语言和时长参数
    const request: PodcastGenerationRequest = selectedMode === 'ai-podcast'
      ? {
          ...baseRequest,
          usetime: duration,
          output_language: language,
        }
      : baseRequest;

    try {
        await onGenerate(request); // 等待 API 调用完成
        // 清空 topic 和 customInstructions，并更新 localStorage
        setTopic('');
        setItem('podcast-topic', '');
        setCustomInstructions('');
        setItem('podcast-custom-instructions', '');
    } catch (err) {
        console.error(t('podcastCreator.podcastGenerationFailed'), err);
    }
  };

  const handleSignIn = async () => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-next-locale': lang,
        },
      });

      const data = await response.json();

      if (data.success) {
        success(t('podcastCreator.checkInSuccess'), data.message);
        onSignInSuccess(); // 签到成功后调用回调
      } else {
        error(t('podcastCreator.checkInFailed'), data.error);
      }
    } catch (err) {
      console.error("签到请求失败:", err);
      error(t('podcastCreator.checkInFailed'), t('podcastCreator.networkError'));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTopic(prev => prev + (prev ? '\n\n' : '') + content);
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTopic(prev => prev + (prev ? '\n\n' : '') + text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* 品牌标题区域 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg className="h-[80px] w-[300px] sm:h-[100px] sm:w-[600px]" viewBox="0 0 600 150" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D869E5">
                    <animate attributeName="stop-color" values="#D069E6;#FB866C;#FA6F7E;#E968E2;" dur="5s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="1" stopColor="#D069E6">
                    <animate attributeName="stop-color" values="#FB866C;#FA6F7E;#E968E2;#D869E5;" dur="5s" repeatCount="indefinite"/>
                  </stop>
                </linearGradient>

                <linearGradient id="textGradient" x1="600" y1="0" x2="150" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#C75AD4">
                    <animate attributeName="stop-color" values="#C75AD4;#D85AD1;#F85F6F;#F9765B;#C15ED5;#C75AD4" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.1818" stopColor="#D85AD1">
                    <animate attributeName="stop-color" values="#D85AD1;#F85F6F;#F9765B;#C15ED5;#C75AD4;#D85AD1" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.3636" stopColor="#F85F6F">
                    <animate attributeName="stop-color" values="#F85F6F;#F9765B;#C15ED5;#C75AD4;#D85AD1;#F85F6F" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.5455" stopColor="#F9765B">
                    <animate attributeName="stop-color" values="#F9765B;#C15ED5;#C75AD4;#D85AD1;#F85F6F;#F9765B" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.7273" stopColor="#C15ED5">
                    <animate attributeName="stop-color" values="#C15ED5;#C75AD4;#D85AD1;#F85F6F;#F9765B;#C15ED5" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="0.9091" stopColor="#C75AD4">
                    <animate attributeName="stop-color" values="#C75AD4;#D85AD1;#F85F6F;#F9765B;#C15ED5;#C75AD4" dur="10s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
              </defs>

              <g>
                <path 
                  d="M49 98.5 C 56 56.5, 65 56.5, 73 90.5 C 79 120.5, 85 125.5, 91 100.5 C 96 80.5, 100 75.5, 106 95.5 C 112 115.5, 118 108.5, 125 98.5"
                  className="fill-none stroke-[10] stroke-round stroke-join-round" // 调整描边宽度为 7
                  stroke="url(#waveGradient)"
                />

                <text
                  x="140"
                  y="125"
                  className={`${satisfy.className} text-[95px]`} // 应用艺术字体
                  fill="url(#textGradient)"
                >
                  PodcastHub
                </text>
              </g>
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl text-black mb-6 break-words">
            {t('podcastCreator.giveVoiceToCreativity')}
          </h1>
          
          {/* 模式切换按钮 todo */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 flex-wrap">
            <button
              onClick={() => setSelectedMode('ai-podcast')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium transition-all duration-200",
                selectedMode === 'ai-podcast'
                  ? "btn-primary"
                  : "btn-secondary"
              )}
            >
              <AiFillPlayCircle className="w-4 h-4" />
              {t('podcastCreator.aiPodcast')}
            </button>
            <button
              onClick={() => setSelectedMode('ai-story')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full font-medium transition-all duration-200",
                selectedMode === 'ai-story'
                  ? "btn-primary"
                  : "btn-secondary"
              )}
            >
              <AiOutlineStar className="w-4 h-4" />
              {t('podcastCreator.immersiveStory')}
            </button>
          </div> 
        </div>

        {/* 主要创作区域 */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-soft">
          {/* 输入区域 */}
          <div className="p-6">
            <textarea
              value={topic}
              onChange={(e) => {
                const newValue = e.target.value;
                // 如果超过字符数限制，截取到最大长度
                const finalValue = newValue.length > maxChars ? newValue.substring(0, maxChars) : newValue;
                setTopic(finalValue);
                setItem('podcast-topic', finalValue); // 实时保存到 localStorage
              }}
              placeholder={t('podcastCreator.enterTextPlaceholder')}
              className="w-full h-48 resize-none border-none outline-none text-lg placeholder-neutral-400 bg-white"
              disabled={isGenerating}
            />
            
            {/* 字符数统计 */}
            <div className="flex justify-end mt-2">
              <span className={cn(
                "text-sm",
                topic.length > maxChars * 0.9 ? "text-red-500 font-medium" : "text-neutral-400"
              )}>
                {topic.length} / {maxChars}
              </span>
            </div>
            
            {/* 自定义指令 */}
            {customInstructions !== undefined && selectedMode === 'ai-podcast' && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <textarea
                  value={customInstructions}
                  onChange={(e) => {
                    setCustomInstructions(e.target.value);
                    setItem('podcast-custom-instructions', e.target.value); // 实时保存到 localStorage
                  }}
                  placeholder={t('podcastCreator.addCustomInstructions')}
                  className="w-full h-16 resize-none border-none outline-none text-sm placeholder-neutral-400 bg-white"
                  disabled={isGenerating}
                />
              </div>
            )}
          </div>

          {/* 工具栏 */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between px-4 sm:px-6 py-4 border-t border-neutral-100 bg-gradient-to-br from-neutral-50 to-white gap-4">
            {/* 隐藏的 TTS 配置选择器 */}
            <div className="hidden">
              <ConfigSelector
                onConfigChange={(config, name, newVoices) => {
                  setSelectedConfig(config);
                  setSelectedConfigName(name);
                  setVoices(newVoices);
                }}
                className="w-full"
                lang={lang}
              />
            </div>

            {/* 左侧配置选项 */}
            <div className="flex flex-wrap gap-2 lg:gap-3 justify-center lg:justify-start items-center">
              {/* 说话人按钮 */}
              <button
                onClick={() => setShowVoicesModal(true)}
                className={cn(
                  "w-[120px] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md",
                  selectedPodcastVoices[selectedConfigName] && selectedPodcastVoices[selectedConfigName].length > 0
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                    : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
                  (isGenerating || !selectedConfig) && "opacity-50 cursor-not-allowed"
                )}
                disabled={isGenerating || !selectedConfig}
              >
                {t('podcastCreator.speaker')}
              </button>

              {/* 语言选择 */}
              {selectedMode === 'ai-podcast' && (
                <div className="relative w-[120px]">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="appearance-none w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isGenerating}
                  >
                    {languageOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <AiOutlineDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              )}

              {/* 时长选择 */}
              {selectedMode === 'ai-podcast' && (
                <div className="relative w-[120px]">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="appearance-none w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isGenerating}
                  >
                    {durationOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <AiOutlineDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              )}

              {/* 积分显示 */}
              <div className="w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 rounded-lg shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 flex-shrink-0">
                  <path d="M6 3v18l6-4 6 4V3z"/>
                  <path d="M12 3L20 9L12 15L4 9L12 3Z"/>
                </svg>
                <span className="text-sm font-semibold text-neutral-700">{credits}</span>
              </div>
            </div>

            {/* 右侧操作按钮 */}
            <div className="flex items-center justify-center lg:justify-end gap-2 lg:gap-3 flex-shrink-0">
              {/* 文件上传 */}
              {/* <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1 sm:p-2 text-neutral-500 hover:text-black transition-colors"
                title={t('podcastCreator.fileUpload')}
                disabled={isGenerating}
              >
                <AiOutlineUpload className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              /> */}

              {/* 粘贴链接 */}
              {/* <button
                onClick={handlePaste}
                className="p-1 sm:p-2 text-neutral-500 hover:text-black transition-colors"
                title={t('podcastCreator.pasteContent')}
                disabled={isGenerating}
              >
                <AiOutlineLink className="w-4 h-4 sm:w-5 sm:h-5" />
              </button> */}

              {/* 复制 */}
              {/* <button
                onClick={() => navigator.clipboard.writeText(topic)}
                className="p-1 sm:p-2 text-neutral-500 hover:text-black transition-colors"
                title={t('podcastCreator.copyContent')}
                disabled={isGenerating || !topic}
              >
                <AiOutlineCopy className="w-4 h-4 sm:w-5 sm:h-5" />
              </button> */}
              {/* 签到按钮 */}
              
              <button
                onClick={handleSignIn}
                disabled={isGenerating}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md",
                  "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
                  isGenerating && "opacity-50 cursor-not-allowed"
                )}
              >
                {t('podcastCreator.checkIn')}
              </button>

              {/* 创作按钮 */}
              <button
                onClick={handleSubmit}
                disabled={!topic.trim() || isGenerating}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg",
                  "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700",
                  (!topic.trim() || isGenerating) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                    <span>{t('podcastCreator.biu')}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>{t('podcastCreator.create')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      {/* Voices Modal */}
      {selectedConfig && (
        <VoicesModal
          isOpen={showVoicesModal}
          onClose={() => setShowVoicesModal(false)}
          voices={voices}
          onSelectVoices={(selectedVoices) => {
            setSelectedPodcastVoices(prev => {
              const newState = {...prev, [selectedConfigName]: selectedVoices};
              setItem('podcast-selected-voices', newState); // 缓存选中的说话人
              return newState;
            }); // 更新选中的说话人状态
            setShowVoicesModal(false); // 选中后关闭模态框
          }}
          initialSelectedVoices={selectedPodcastVoices[selectedConfigName] || []} // 传递选中的说话人作为初始值
          currentSelectedVoiceIds={selectedPodcastVoices[selectedConfigName]?.map(v => v.code!) || []} // 更新 currentSelectedVoiceIds
          onRemoveVoice={(voiceCodeToRemove) => {
            setSelectedPodcastVoices(prev => {
              const newVoices = (prev[selectedConfigName] || []).filter(v => v.code !== voiceCodeToRemove);
              const newState = {
                ...prev,
                [selectedConfigName]: newVoices
              };
              setItem('podcast-selected-voices', newState); // 更新缓存
              return newState;
            });
          }}
          lang={lang}
        />
      )}
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        lang={lang}
      />

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmGenerate}
        title={t('podcastCreator.confirmGeneration')}
        message={t('podcastCreator.confirmGenerationMessage')}
        points={selectedMode === 'ai-story'
          ? 30
          : (duration === '8-15 minutes'
            ? parseInt(process.env.POINTS_PER_PODCAST || '20', 10) * 2
            : parseInt(process.env.POINTS_PER_PODCAST || '20', 10))}
        lang={lang}
      />
    </div>
  );
};

export default PodcastCreator;

