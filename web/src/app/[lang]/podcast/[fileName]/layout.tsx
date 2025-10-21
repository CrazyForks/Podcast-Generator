import { Metadata } from 'next';
import { getTranslation } from '../../../../i18n';
import { headers } from 'next/headers';
import { getTruePathFromHeaders } from '../../../../lib/utils';
import { getAudioInfo } from '../../../../lib/podcastApi';

export type paramsType = Promise<{ lang: string, fileName: string }>;

export async function generateMetadata({ params }: { params: paramsType }): Promise<Metadata> {
  const { fileName, lang } = await params;
  const { t } = await getTranslation(lang);
  const decodedFileName = decodeURIComponent(fileName);
  
  // 获取网站主标题
  const siteName = 'Podcast Hub';
  
  // 获取音频信息以获取 overview_content
  const result = await getAudioInfo(decodedFileName, lang);
  
  let pageTitle = `${t('podcastContent.podcastDetails')} - ${decodedFileName}`;
  let description = `${t('podcastContent.listenToPodcast')} ${decodedFileName}。`;
  
  // 如果成功获取到 overview_content，使用它来生成更好的 title 和 description
  if (result.success && result.data?.overview_content) {
    const overviewContent = result.data.overview_content;
    
    // 从 overview_content 中提取前150个字符作为 description
    description = overviewContent.length > 150 
      ? overviewContent.substring(0, 150) + '...' 
      : overviewContent;
    
    // 尝试从 overview_content 的第一行或前50个字符生成 title
    const firstLine = overviewContent.split('\n')[0];
    if (firstLine && firstLine.length > 0 && firstLine.length <= 50) {
      pageTitle = firstLine;
    } else if (overviewContent.length > 0) {
      // 如果第一行太长，取前50个字符
      pageTitle = overviewContent.substring(0, 40) + (overviewContent.length > 40 ? '...' : '');
    }
  }
  
  // 组合最终的 title: 网站名称 - 页面标题
  const title = `${siteName} - ${pageTitle}`;
  
  const truePath = await getTruePathFromHeaders(await headers(), lang);
  
  return {
    title,
    description,
    alternates: {
      canonical: `${truePath}/podcast/${decodedFileName}`,
    },
  };
}

export default function PodcastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}