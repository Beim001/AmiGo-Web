// Bilibili Toy SDK Integration & Local Mock Fallback Manager

export interface ToyUserProfile {
  avatar: string;
  nickname: string;
  toyOpenId?: string;
}

export interface RankItem {
  rank: number;
  score: number;
  nickname: string;
  avatar: string;
}

export interface MyRankResp {
  ranked: boolean;
  rank: number;
  score: number;
}

export interface AppUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  emailVerified: boolean;
  providerData: Array<{ providerId: string; [key: string]: any }>;
  isBilibili?: boolean;
  isMock?: boolean;
}

declare global {
  interface Window {
    toy?: {
      isSupport?: (ability: string) => Promise<boolean>;
      navigate?: (req: { type: string; id: string; extra?: Record<string, string> }) => Promise<void>;
      saveImageToAlbum?: (req: { url?: string; base64Data?: string; hintMsg?: string }) => Promise<{ localPath: string }>;
      share?: (req: { path: string }) => Promise<void>;
      getQrCode?: (req?: { path?: string; size?: number }) => Promise<{ base64: string; url: string }>;
      closeBrowser?: () => Promise<void>;
      getUserProfile?: () => Promise<ToyUserProfile>;
      getAuthorProfile?: () => Promise<any>;
      getAuthorVideos?: (req: { videos: Array<{ aid?: number; bvid?: string }> }) => Promise<any>;
      getAuthorRelation?: () => Promise<any>;
      getVideoUserActions?: (req: { aids: number[] }) => Promise<any>;
      setCloudStorage?: (items: Record<string, string>) => Promise<void>;
      getCloudStorage?: (keys?: string[]) => Promise<Record<string, string>>;
      removeCloudStorage?: (keys: string[]) => Promise<void>;
      submitScore?: (req: { board?: number; score: number }) => Promise<{ score: number }>;
      getRankList?: (req?: { board?: number; period?: 'all' | 'month' | 'week' | 'day'; limit?: number }) => Promise<RankItem[]>;
      getMyRank?: (req?: { board?: number; period?: 'all' | 'month' | 'week' | 'day' }) => Promise<MyRankResp>;
      requestCamera?: (options?: { facingMode?: 'user' | 'environment' }) => Promise<MediaStream>;
      requestMicrophone?: () => Promise<MediaStream>;
      stopMedia?: (stream: MediaStream) => Promise<void>;
    };
  }
}

// Check if running in real Bilibili Toy SDK environment
export const isRealToySdkAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.toy && typeof window.toy.getUserProfile === 'function';
};

/**
 * Get Bilibili User Profile with SDK or Fallback
 */
export const getBilibiliUserProfile = async (): Promise<{ profile: ToyUserProfile; isMock: boolean }> => {
  if (isRealToySdkAvailable()) {
    try {
      const profile = await window.toy!.getUserProfile!();
      if (profile && (profile.nickname || profile.avatar || profile.toyOpenId)) {
        return { profile, isMock: false };
      }
      throw new Error('获取B站用户信息返回为空数据');
    } catch (err) {
      console.warn('[ToySDK] getUserProfile call failed or declined:', err);
      throw new Error('获取B站授权失败，请稍后重试');
    }
  }

  throw new Error('当前不在哔哩哔哩环境，请使用其他方式登录（或在B站App内打开）');
};

/**
 * Get Leaderboard list with SDK or Mock Fallback
 */
export const getBilibiliRankList = async (board = 1, period: 'all' | 'month' | 'week' | 'day' = 'all', limit = 20): Promise<RankItem[]> => {
  if (isRealToySdkAvailable() && typeof window.toy?.getRankList === 'function') {
    try {
      const list = await window.toy.getRankList({ board, period, limit });
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch (err) {
      console.warn('[ToySDK] getRankList failed:', err);
    }
  }
  return [];
};

/**
 * Get My Rank with SDK or Mock Fallback
 */
export const getBilibiliMyRank = async (board = 1, period: 'all' | 'month' | 'week' | 'day' = 'all', currentScore = 1047650): Promise<MyRankResp> => {
  if (isRealToySdkAvailable() && typeof window.toy?.getMyRank === 'function') {
    try {
      const myRank = await window.toy.getMyRank({ board, period });
      if (myRank) return myRank;
    } catch (err) {
      console.warn('[ToySDK] getMyRank failed:', err);
    }
  }
  return {
    ranked: false,
    rank: 0,
    score: currentScore,
  };
};

/**
 * Submit score with SDK or Mock Fallback
 */
export const submitBilibiliScore = async (board = 1, score: number): Promise<{ score: number; isMock: boolean }> => {
  if (isRealToySdkAvailable() && typeof window.toy?.submitScore === 'function') {
    try {
      const res = await window.toy.submitScore({ board, score });
      return { score: res?.score ?? score, isMock: false };
    } catch (err) {
      console.warn('[ToySDK] submitScore failed:', err);
    }
  }
  return { score, isMock: true };
};
