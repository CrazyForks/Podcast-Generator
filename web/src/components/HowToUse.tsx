'use client';

import React from 'react';
import { useTranslation } from '../i18n/client';

interface HowToUseProps {
  lang: string;
}

export default function HowToUse({ lang }: HowToUseProps) {
  const { t } = useTranslation(lang, 'home');

  const steps = [
    {
      key: 'step1',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      key: 'step2',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      key: 'step3',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      key: 'step4',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
          {t('howToUse')}
        </h2>
        <p className="text-lg text-neutral-600">
          {t('howToUseSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step) => (
          <div
            key={step.key}
            className="flex flex-col items-center text-center p-6 bg-white border border-neutral-200 rounded-xl hover:shadow-lg hover:border-purple-300 transition-all duration-300"
          >
            <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full mb-4 shadow-md">
              {step.icon}
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">
              {t(`howToUseSteps.${step.key}.title`)}
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {t(`howToUseSteps.${step.key}.description`)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
          <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-medium text-purple-900">
            {lang === 'zh-CN' && '使用 PodcastHub 的AI播客生成器和沉浸故事功能创建更专业的播客'}
            {lang === 'en' && 'Use PodcastHub\'s podcast generator and story generator to create more professional podcasts'}
            {lang === 'ja' && 'PodcastHubのpodcast generatorとstory generatorでより専門的なポッドキャストを作成'}
          </span>
        </div>
      </div>
    </section>
  );
}