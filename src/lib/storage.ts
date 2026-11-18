// localStorage 读写工具：读取失败或无存档时返回默认值，写入失败时忽略（例如隐私模式下存储不可用）
export const loadStored = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? (JSON.parse(saved) as T) : fallback;
  } catch (e) {
    return fallback;
  }
};
export const saveStored = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};
