// 零花与俸禄（undefined.md 第 36 题，用户 2026-11-14 决定）
// - 在职（正式工作或童工）的月份发俸禄（BASE_STIPEND）；不在职的月份改由父母给零花
// - 零花 = 每位在世且好感度 > 30% 的父母：月收入 × 年龄比例 × 好感度 × 关系系数
//   - 年龄比例：8–11 岁 3%、12–15 岁 5%、16 岁起 8%
//   - 继父 / 继母只给一半；私生子女（继承上来的）再减半
// - 失业补贴：阿米诺斯维基中卡罗尼亚帝国时期没有失业救济的设定（失业救济是联邦时代工党的主张），暂不发放

import type { ClassId } from './lineage';
import { buildFamilyMembers, FamilyState, FamilyViewParams } from './family';

/** 父母好感度需高于此值才会给零花 */
export const ALLOWANCE_MIN_AFFINITY = 30;
export const STEP_PARENT_FACTOR = 0.5;
export const ILLEGITIMATE_FACTOR = 0.5;

/** 零花占父母月收入的比例（随年龄增长） */
export const allowanceRate = (age: number): number => (age < 12 ? 0.03 : age < 16 ? 0.05 : 0.08);

/** 父母职业 → 月收入（₽）。正式岗位月薪约 1.4 万–7 万 ₽（日薪 × 22），以此为参照 */
export const PARENT_INCOME: Record<string, number> = {
  // 乞丐
  街头乞讨: 300, 码头零工: 2000, 拾荒: 600, 流浪卖艺: 900, 洗衣帮工: 1200,
  // 平民
  纺织厂工人: 14000, 纺织厂女工: 12000, 佃农: 9000, 农妇: 6000, 搬运工: 11000, 洗衣妇: 7000, 矿工: 16000, 帮佣: 8000, 铁路工人: 15000,
  // 小康
  杂货铺店主: 22000, 裁缝: 18000, 木匠师傅: 20000, 小学教员: 17000, 邮局书记员: 19000, 织布作坊主: 26000,
  小店主: 22000, 工匠: 20000, 书记员: 19000, 教员: 17000,
  // 中产
  医生: 55000, 学堂教师: 30000, 工程师: 50000, 药剂师: 38000, 律政士: 60000, 商行账房: 32000, 教师: 30000,
  // 富商
  商行东家: 180000, 商行女掌柜: 120000, 银行家: 300000, 慈善会董事: 80000, 船运公司老板: 250000, 珠宝店东家: 150000,
  银行经理: 150000, 船运商: 220000,
  // 贵族
  世袭男爵: 350000, 男爵夫人: 120000, 宫廷侍从官: 250000, 伯爵夫人: 150000, 将军: 300000, 贵族沙龙女主人: 100000,
  宫廷官员: 250000, 军官: 120000, 庄园主: 300000,
  // 皇族
  '亲王（纳海王朝宗室）': 2000000, 王妃: 800000, 亲王: 2000000, 公主: 600000, 宗室大臣: 1200000,
  // 瓦伦丁家族
  帝国前皇家首席工匠: 300000, 高级机械总工程师: 120000, 帝国医学院讲师: 60000, 远洋商队船长: 80000,
  // 配偶候选人的职业（继承后成为继承人的父母）
  裁缝铺店主: 22000, 医院护理员: 15000, 钟表匠: 24000, 画师: 20000, 纺织厂工头: 22000, 报社编辑: 28000,
};

/** 职业不在表中时按家族阶层估算 */
export const CLASS_PARENT_INCOME: Record<ClassId, number> = {
  beggar: 800,
  commoner: 11000,
  modest: 20000,
  middle: 45000,
  merchant: 180000,
  noble: 250000,
  royal: 1500000,
};

export const parentIncome = (occupation: string, classId: string): number =>
  PARENT_INCOME[occupation] ?? CLASS_PARENT_INCOME[classId as ClassId] ?? CLASS_PARENT_INCOME.commoner;

export interface ParentInfo {
  name: string;
  relation: string;
  occupation: string;
  affinity: number;
  status: '在世' | '已故' | '远游';
}

export interface AllowancePart {
  name: string;
  relation: string;
  amount: number;
  /** 没给零花的原因 */
  reason?: string;
}

const isStepParent = (relation: string) => relation === '继母' || relation === '继父';

/** 计算本月父母给的零花 */
export const computeAllowance = (
  parents: ParentInfo[],
  age: number,
  classId: string,
  illegitimate = false,
): { total: number; parts: AllowancePart[] } => {
  const parts: AllowancePart[] = parents
    .filter((p) => p.status !== '已故')
    .map((p) => {
      if (p.affinity <= ALLOWANCE_MIN_AFFINITY) {
        return { name: p.name, relation: p.relation, amount: 0, reason: `好感度 ${p.affinity}% 不足 ${ALLOWANCE_MIN_AFFINITY}%` };
      }
      const amount = Math.round(
        parentIncome(p.occupation, classId) *
          allowanceRate(age) *
          (p.affinity / 100) *
          (isStepParent(p.relation) ? STEP_PARENT_FACTOR : 1) *
          (illegitimate ? ILLEGITIMATE_FACTOR : 1),
      );
      return { name: p.name, relation: p.relation, amount };
    });
  return { total: parts.reduce((s, p) => s + p.amount, 0), parts };
};

/** 按族谱中的父母（职业收入、好感度、是否在世）计算本月零花 */
export const familyAllowance = (family: FamilyState, view: FamilyViewParams, age: number, classId: string) => {
  const parents = buildFamilyMembers(family, view)
    .filter((m) => m.kin === 'parent' && !m.isPlayer)
    .map((m) => ({ name: m.name, relation: m.relation, occupation: m.occupation, affinity: m.affinity, status: m.status }));
  return computeAllowance(parents, age, classId, !!family.playerIllegitimate);
};
