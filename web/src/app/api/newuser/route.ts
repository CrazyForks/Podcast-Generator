import { NextResponse, NextRequest } from 'next/server';
import { getSessionData } from "@/lib/server-actions";
import { createPointsAccount, recordPointsTransaction, checkUserPointsAccount } from "@/lib/points"; // 导入新封装的函数
import { getTranslation } from '@/i18n';
import { fallbackLng } from '@/i18n/settings';

export async function GET(request: NextRequest) {
  const sessionData = await getSessionData();
  const pathname = request.nextUrl.searchParams.get('pathname') || '';

  // 如果没有获取到 session，直接重定向
  if (!sessionData?.user) {
    const url = new URL(request.url);
    url.pathname = pathname || '/';
    url.search = '';
    return NextResponse.redirect(url);
  }


  const lng = !pathname ? fallbackLng : pathname.replace('/','');
  const { t } = await getTranslation(lng, 'components');
  const userId = sessionData.user.id; // 获取 userId

  // 检查用户是否已存在积分账户
  const userHasPointsAccount = await checkUserPointsAccount(userId);

  // 如果不存在积分账户，则初始化
  if (!userHasPointsAccount) {
    console.log(t('newUser.noPointsAccount', { userId }));
    try {
      const pointsPerPodcastDay = parseInt(process.env.POINTS_PER_PODCAST_INIT || '100', 10);
      await createPointsAccount(userId, pointsPerPodcastDay); // 调用封装的创建积分账户函数
      await recordPointsTransaction(userId, pointsPerPodcastDay, "initial_bonus", t('newUser.initialBonusDescription')); // 调用封装的记录流水函数
    } catch (error) {
      console.error(t('newUser.initError', { userId, error }));
      // 根据错误类型，可能需要更详细的错误处理或重定向
      // 例如，如果 userId 无效，可以重定向到错误页面
    }
  } else {
    console.log(t('newUser.pointsAccountExists', { userId }));
  }

  // 构建重定向 URL
  const url = new URL(request.url);
  url.pathname = pathname ? `${pathname}/` : '/';
  url.search = '';
  
  // 返回重定向响应
  return NextResponse.redirect(url);
}