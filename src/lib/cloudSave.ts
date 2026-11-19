// 云端存档：把本地 localStorage 中的游戏存档（amigo_* / aminoac_*）整体同步到 Worker（/api/save）
//
// - 仅邮箱密码账号、且邮箱已验证时启用；B 站账号与开发测试账号仍只用本地存档
// - 服务器按版本号防止多设备互相覆盖：上传时带上「基于的版本」，不一致返回 409（冲突）
// - 本地额外记录 amigo_cloud_owner / amigo_cloud_version / amigo_cloud_hash，用于判断本地存档属于谁、是否已同步

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppUser } from './bilibiliToy';
import { isPasswordUser } from './authClient';
import { SETTINGS_KEY } from './settings';

const GAME_KEY_PREFIXES = ['amigo_', 'aminoac_'];
const CLOUD_META_PREFIX = 'amigo_cloud_';
/** 不属于游戏进度、不上传的键 */
// 系统设置（音量、减少动画等）只属于这台设备，不随云存档同步
const NON_SAVE_KEYS = new Set(['amigo_active_user', 'amigo_local_uid', SETTINGS_KEY]);

const OWNER_KEY = 'amigo_cloud_owner';
const VERSION_KEY = 'amigo_cloud_version';
const HASH_KEY = 'amigo_cloud_hash';

export const AUTO_SAVE_INTERVAL_MS = 30_000;

const isSaveKey = (key: string) =>
  GAME_KEY_PREFIXES.some((p) => key.startsWith(p)) && !key.startsWith(CLOUD_META_PREFIX) && !NON_SAVE_KEYS.has(key);

const allKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) keys.push(k);
  }
  return keys;
};

/** 当前本地存档快照（键排序后序列化，内容相同则字符串相同） */
export const collectSnapshot = (): string => {
  const data: Record<string, string> = {};
  allKeys()
    .filter(isSaveKey)
    .sort()
    .forEach((k) => {
      data[k] = localStorage.getItem(k) ?? '';
    });
  return JSON.stringify(data);
};

/** 用快照替换本地存档 */
export const applySnapshot = (snapshot: string) => {
  const data = JSON.parse(snapshot) as Record<string, string>;
  allKeys().filter(isSaveKey).forEach((k) => localStorage.removeItem(k));
  Object.entries(data).forEach(([k, v]) => {
    if (isSaveKey(k)) localStorage.setItem(k, v);
  });
};

/** 退出登录时清除本地游戏数据与登录缓存（保留本机编号） */
export const clearLocalGameData = () => {
  allKeys()
    .filter((k) => GAME_KEY_PREFIXES.some((p) => k.startsWith(p)) && k !== 'amigo_local_uid')
    .forEach((k) => localStorage.removeItem(k));
};

/** 简单字符串哈希（只用于判断存档是否变化） */
const hashOf = (text: string): string => {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${text.length}:${h >>> 0}`;
};

const readMeta = () => ({
  owner: localStorage.getItem(OWNER_KEY),
  version: Number(localStorage.getItem(VERSION_KEY) || 0),
  hash: localStorage.getItem(HASH_KEY),
});

const writeMeta = (owner: string, version: number, snapshot: string) => {
  localStorage.setItem(OWNER_KEY, owner);
  localStorage.setItem(VERSION_KEY, String(version));
  localStorage.setItem(HASH_KEY, hashOf(snapshot));
};

/** 本地是否有一份值得保留的存档（已办理出生登记即视为有进度） */
const hasMeaningfulLocalSave = () => localStorage.getItem('amigo_is_registered') === 'true';

// ---------- 接口 ----------

class SaveConflictError extends Error {
  constructor(public remoteVersion: number) {
    super('SAVE_CONFLICT');
  }
}

interface RemoteSave {
  data: string | null;
  version: number;
  updatedAt: number | null;
}

const fetchRemote = async (): Promise<RemoteSave> => {
  const res = await fetch('/api/save', { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.json();
};

const uploadRemote = async (data: string, baseVersion: number): Promise<number> => {
  const res = await fetch('/api/save', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, baseVersion }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 409) throw new SaveConflictError(body.version ?? 0);
  if (!res.ok) throw new Error(body.code || `HTTP_${res.status}`);
  return body.version;
};

// ---------- React Hook ----------

export type CloudSyncStatus = 'disabled' | 'syncing' | 'synced' | 'offline' | 'conflict';

export interface CloudConflict {
  remoteData: string;
  remoteVersion: number;
  remoteUpdatedAt: number | null;
}

export const useCloudSave = (user: AppUser | null) => {
  const enabled = isPasswordUser(user) && !!user?.emailVerified;
  const uid = enabled ? user!.uid : null;
  const [status, setStatus] = useState<CloudSyncStatus>(enabled ? 'syncing' : 'disabled');
  const [conflict, setConflict] = useState<CloudConflict | null>(null);
  const busy = useRef(false);

  const reloadWith = (snapshot: string, version: number) => {
    applySnapshot(snapshot);
    writeMeta(uid!, version, snapshot);
    window.location.reload();
  };

  const openConflict = async () => {
    const remote = await fetchRemote();
    if (remote.data === null) return false;
    setConflict({ remoteData: remote.data, remoteVersion: remote.version, remoteUpdatedAt: remote.updatedAt });
    setStatus('conflict');
    return true;
  };

  /** 立即上传；返回 true 表示云端已是最新 */
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!uid || busy.current) return false;
    const meta = readMeta();
    if (meta.owner !== uid) return false;
    const snapshot = collectSnapshot();
    if (meta.hash === hashOf(snapshot)) {
      setStatus('synced');
      return true;
    }
    busy.current = true;
    try {
      const version = await uploadRemote(snapshot, meta.version);
      writeMeta(uid, version, snapshot);
      setStatus('synced');
      return true;
    } catch (err) {
      if (err instanceof SaveConflictError) await openConflict().catch(() => setStatus('offline'));
      else setStatus('offline');
      return false;
    } finally {
      busy.current = false;
    }
  }, [uid]);

  // 登录后首次同步
  useEffect(() => {
    if (!uid) {
      setStatus('disabled');
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus('syncing');
      try {
        const remote = await fetchRemote();
        if (cancelled) return;
        const meta = readMeta();
        const local = collectSnapshot();
        const localIsMine = meta.owner === null || meta.owner === uid;
        const localMeaningful = hasMeaningfulLocalSave() && localIsMine;

        if (remote.data === null) {
          // 云端还没有存档：上传本机进度（如果有）
          if (localMeaningful) {
            const version = await uploadRemote(local, 0);
            writeMeta(uid, version, local);
          } else {
            if (!localIsMine) {
              clearLocalGameData();
              writeMeta(uid, 0, '');
              window.location.reload();
              return;
            }
            writeMeta(uid, 0, '');
          }
          setStatus('synced');
          return;
        }

        if (!localMeaningful) return reloadWith(remote.data, remote.version);
        if (local === remote.data) {
          writeMeta(uid, remote.version, local);
          setStatus('synced');
          return;
        }
        if (meta.owner === uid && meta.version === remote.version) {
          // 云端没有新变化，本机有未上传的进度
          setStatus('synced');
          void saveNow();
          return;
        }
        if (meta.owner === uid && meta.hash === hashOf(local)) {
          // 本机自上次同步后没改动，云端更新 → 直接使用云端
          return reloadWith(remote.data, remote.version);
        }
        setConflict({ remoteData: remote.data, remoteVersion: remote.version, remoteUpdatedAt: remote.updatedAt });
        setStatus('conflict');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // 定时自动保存（只在已同步/离线重试时）
  useEffect(() => {
    if (!uid) return;
    const timer = setInterval(() => {
      if (status === 'synced' || status === 'offline') void saveNow();
    }, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [uid, status, saveNow]);

  const resolveConflict = useCallback(
    async (choice: 'cloud' | 'local') => {
      if (!uid || !conflict) return;
      if (choice === 'cloud') return reloadWith(conflict.remoteData, conflict.remoteVersion);
      const local = collectSnapshot();
      try {
        const version = await uploadRemote(local, conflict.remoteVersion);
        writeMeta(uid, version, local);
        setConflict(null);
        setStatus('synced');
      } catch (err) {
        if (err instanceof SaveConflictError) await openConflict().catch(() => setStatus('offline'));
        else setStatus('offline');
      }
    },
    [uid, conflict],
  );

  return { enabled, status, conflict, saveNow, resolveConflict };
};
