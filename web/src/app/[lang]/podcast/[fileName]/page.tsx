import PodcastContent from '@/components/PodcastContent';

export type paramsType = Promise<{ lang: string, fileName: string }>;

const PodcastDetailPage: React.FC<{ params: paramsType}> = async ({ params }) => {
  const { fileName, lang } = await params; // 解构 lang
  return (
    <div className="bg-white text-gray-800 font-sans">
      <PodcastContent fileName={decodeURIComponent(fileName)} lang={lang} />
    </div>
  );
}

export default PodcastDetailPage;