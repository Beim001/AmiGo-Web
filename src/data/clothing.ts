// 服装目录（第 61 题）：保留原有 3 套，新增 12 套 19 世纪风格服装。商城与限定宝箱都从这里取。
// style 决定绘制方式（见 CharacterAvatar.tsx）；hat 为帽子样式。

import type { Rarity } from '../lib/gacha';

export type ClothingStyle = 'tunic' | 'armor' | 'robe' | 'hoodie' | 'jacket' | 'vest' | 'tailcoat' | 'dress' | 'uniform' | 'gown' | 'coat' | 'apron' | 'padded' | 'shawl';
export type HatStyle = 'none' | 'helmet' | 'wizard' | 'hood' | 'cap' | 'tophat' | 'bonnet' | 'kepi' | 'crown' | 'headscarf';

export interface ClothingItem {
  id: string;
  name: string;
  /** 简短描述（商城卡片上显示） */
  effect: string;
  price: number;
  rarity: Rarity;
  style: ClothingStyle;
  /** 主色、点缀色 */
  color: string;
  accent: string;
  hat: HatStyle;
}

export const CLOTHING: ClothingItem[] = [
  // 原有服装
  { id: 'knight', name: '骑士盔甲', effect: '防御力+10', price: 2000, rarity: 'advanced', style: 'armor', color: '#cbd5e1', accent: '#475569', hat: 'helmet' },
  { id: 'casual', name: '休闲卫衣', effect: '魅力+5', price: 8000, rarity: 'rare', style: 'hoodie', color: '#facc15', accent: '#ca8a04', hat: 'hood' },
  { id: 'mage', name: '法师长袍', effect: '魔力+15', price: 50000, rarity: 'limited', style: 'robe', color: '#c084fc', accent: '#7e22ce', hat: 'wizard' },
  // 19 世纪 · 高级
  { id: 'worker', name: '粗布工装', effect: '工厂与码头的日常', price: 2500, rarity: 'advanced', style: 'jacket', color: '#64748b', accent: '#334155', hat: 'cap' },
  { id: 'student', name: '学堂制服', effect: '立领黑呢学生装', price: 3000, rarity: 'advanced', style: 'uniform', color: '#1f2937', accent: '#d4af37', hat: 'cap' },
  { id: 'padded', name: '农家棉袄', effect: '厚实暖和过寒冬', price: 2200, rarity: 'advanced', style: 'padded', color: '#9a3412', accent: '#fdba74', hat: 'headscarf' },
  { id: 'maid', name: '女佣围裙', effect: '大宅里的帮佣装', price: 2600, rarity: 'advanced', style: 'apron', color: '#1e293b', accent: '#f8fafc', hat: 'bonnet' },
  // 19 世纪 · 稀有
  { id: 'vest', name: '商人马甲', effect: '怀表链与呢绒马甲', price: 9000, rarity: 'rare', style: 'vest', color: '#78350f', accent: '#fbbf24', hat: 'none' },
  { id: 'tailcoat', name: '燕尾礼服', effect: '出入沙龙的正装', price: 12000, rarity: 'rare', style: 'tailcoat', color: '#111827', accent: '#f9fafb', hat: 'tophat' },
  { id: 'chapan', name: '民族长袍', effect: '中亚条纹长袍', price: 10000, rarity: 'rare', style: 'gown', color: '#0f766e', accent: '#fcd34d', hat: 'cap' },
  { id: 'military', name: '帝国军装', effect: '肩章与铜扣', price: 15000, rarity: 'rare', style: 'uniform', color: '#3f6212', accent: '#facc15', hat: 'kepi' },
  { id: 'victorian', name: '维多利亚长裙', effect: '蕾丝高领与裙撑', price: 14000, rarity: 'rare', style: 'dress', color: '#9d174d', accent: '#fbcfe8', hat: 'bonnet' },
  { id: 'shawl', name: '流苏披肩', effect: '绣花披肩配长裙', price: 9500, rarity: 'rare', style: 'shawl', color: '#b45309', accent: '#fde68a', hat: 'headscarf' },
  // 19 世纪 · 限定
  { id: 'court', name: '宫廷礼服', effect: '觐见皇室的盛装', price: 60000, rarity: 'limited', style: 'dress', color: '#1e3a8a', accent: '#fde047', hat: 'crown' },
  { id: 'noblecoat', name: '贵族大衣', effect: '毛领双排扣大衣', price: 55000, rarity: 'limited', style: 'coat', color: '#4c1d95', accent: '#e5e7eb', hat: 'tophat' },
];

export const clothingById = (id: string) => CLOTHING.find((c) => c.id === id);

/** 家人的日常穿着：按家族阶层与性别挑选（按 id 稳定选择）；16 岁以下穿学堂制服或初始服装 */
const CLASS_OUTFITS: Record<string, { 男: string[]; 女: string[] }> = {
  beggar: { 男: ['padded', 'worker'], 女: ['padded', 'maid'] },
  commoner: { 男: ['worker', 'padded', 'chapan'], 女: ['maid', 'shawl', 'padded'] },
  modest: { 男: ['vest', 'worker', 'chapan'], 女: ['shawl', 'maid'] },
  middle: { 男: ['vest', 'tailcoat'], 女: ['victorian', 'shawl'] },
  merchant: { 男: ['tailcoat', 'vest'], 女: ['victorian', 'shawl'] },
  noble: { 男: ['noblecoat', 'tailcoat', 'military'], 女: ['victorian', 'court'] },
  royal: { 男: ['noblecoat', 'military'], 女: ['court', 'victorian'] },
};

export const outfitFor = (classId: string, gender: string | null, age: number, id: string): string => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  if (age < 16) return ['beggar', 'commoner'].includes(classId) ? 'default' : 'student';
  const set = CLASS_OUTFITS[classId] ?? CLASS_OUTFITS.commoner;
  const list = gender === '女' ? set.女 : set.男;
  return list[h % list.length];
};
