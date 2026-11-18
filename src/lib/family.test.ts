import { describe, expect, it } from 'vitest';
import {
  Child,
  FamilyState,
  INITIAL_FAMILY_STATE,
  LEGACY_ORIGIN,
  Spouse,
  buildFamilyMembers,
  listHeirs,
  monthlyFamilyLife,
  succeed,
  CHILD_MARRY_MIN_AGE,
  CHILD_MARRY_MAX_AGE,
  canArrangeMarriage,
  arrangeMarriage,
  monthlyFamilyDrift,
  MATCHMAKING_AFFINITY_PENALTY,
  ARRANGED_CONTENT_CHANCE,
  ARRANGED_DIVORCE_CHANCE,
  ARRANGED_ESTRANGE_CHANCE,
  ESTRANGED_AFFINITY_DECAY,
  SPLIT_AFTER_MONTHS,
  heirStartHealth,
  FOUNDER_START_HEALTH,
} from './family';

const YEAR = 1950;
const MONTH = 6;
/** 永远返回 0：所有概率判定都成功（成家、生育） */
const ALWAYS = () => 0;

const spouse = (name: string, gender: '男' | '女', age: number): Spouse => ({
  name,
  gender,
  birthYear: YEAR - age,
  occupation: '教师',
  marriedYear: YEAR - 1,
  marriedMonth: 1,
  lifespan: 85,
});
const person = (id: string, gender: '男' | '女', age: number, extra: Partial<Child> = {}): Child => ({
  id,
  name: `成员${id}`,
  gender,
  birthYear: YEAR - age,
  birthMonth: 1,
  lifespan: 85,
  ...extra,
});
const view = (state: FamilyState, playerAge = 70, playerGender = '男') =>
  buildFamilyMembers(state, { playerName: '当家人', playerGender, playerAge, playerOccupation: '待业', gameYear: YEAR, gameMonth: MONTH });
const byId = (members: ReturnType<typeof view>, id: string) => members.find((m) => m.id === id)!;

/** 主角（70 岁）→ 儿子 a（45）、女儿 b（40）；a → 孙子 a1（20，单身）、孙女 a2（18）；a1 → 曾孙 a11（2） */
const family = (): FamilyState => ({
  ...INITIAL_FAMILY_STATE,
  origin: { ...LEGACY_ORIGIN, isValentine: false, members: [] },
  children: [
    person('a', '男', 45, {
      spouse: spouse('儿媳', '女', 43),
      kids: [person('a1', '男', 20, { kids: [person('a11', '女', 2)] }), person('a2', '女', 18)],
    }),
    person('b', '女', 40, { kids: [person('b1', '男', 15)] }),
  ],
});

describe('后代一直延续', () => {
  it('孙辈及以后各代成年后也会成家', () => {
    const r = monthlyFamilyLife(family(), YEAR, MONTH, ALWAYS);
    const a1 = r.state.children[0].kids![0];
    expect(a1.spouse).toBeDefined();
  });

  it('成家年龄为 16 岁（含）到 36 岁（不含）', () => {
    const base = { ...INITIAL_FAMILY_STATE, children: [person('y', '男', CHILD_MARRY_MIN_AGE), person('o', '女', CHILD_MARRY_MAX_AGE), person('t', '男', CHILD_MARRY_MIN_AGE - 1)] };
    const r = monthlyFamilyLife(base, YEAR, MONTH, ALWAYS);
    expect(r.state.children.map((c) => !!c.spouse)).toEqual([true, false, false]);
  });

  it('已婚的孙辈会生育下一代，新生儿出现在族谱的曾孙辈', () => {
    const state = family();
    state.children[0].kids![1] = person('a2', '女', 25, { spouse: spouse('孙女婿', '男', 26) });
    const r = monthlyFamilyLife(state, YEAR, MONTH, ALWAYS);
    const born = r.state.children[0].kids![1].kids ?? [];
    expect(born.length).toBeGreaterThan(0);
    const members = view(r.state);
    expect(born.every((k) => byId(members, k.id).generation === '曾孙辈')).toBe(true);
  });
});

describe('族谱', () => {
  it('列出任意代的后代，称谓与辈分按关系链计算', () => {
    const members = view(family());
    expect(byId(members, 'a1')).toMatchObject({ relation: '孙子', generation: '孙辈', level: -2, depth: 2 });
    expect(byId(members, 'a11')).toMatchObject({ relation: '曾孙女', generation: '曾孙辈', level: -3, depth: 3 });
    expect(byId(members, 'b1').relation).toBe('外孙');
  });
});

describe('继承人', () => {
  it('子女与孙辈都可以继承（可跳过子辈），曾孙辈只在没有在世子女、孙辈时继承', () => {
    expect(listHeirs(view(family())).map((h) => h.id).sort()).toEqual(['a', 'a1', 'a2', 'b', 'b1']);
    const onlyGreat = family();
    onlyGreat.children = onlyGreat.children.map((c) => ({ ...c, lifespan: 10, kids: (c.kids ?? []).map((k) => ({ ...k, lifespan: 10 })) }));
    expect(listHeirs(view(onlyGreat)).map((h) => h.id)).toEqual(['a11']);
  });

  it('子辈在世时也可以直接由孙辈继承', () => {
    const r = succeed(family(), view(family()), 'a2', { name: '当家人', gender: '男', age: 70, occupation: '族长' }, YEAR, MONTH);
    expect(view(r.state, 18, '女').find((m) => m.id === 'a')!.relation).toBe('爸爸');
  });
});

describe('传承', () => {
  const predecessor = { name: '当家人', gender: '男' as const, age: 70, occupation: '族长' };
  const heirOf = (state: FamilyState, id: string) => succeed(state, view(state), id, predecessor, YEAR, MONTH);

  it('孙辈继承：自己的孩子成为子女，父亲、祖父、小姑、兄弟姐妹的称谓相对继承人重算', () => {
    const state = family();
    state.children = state.children.map((c) => ({ ...c, lifespan: c.id === 'a' ? 44 : 39 }));
    const r = heirOf(state, 'a1');
    expect(r.state.children.map((c) => c.id)).toEqual(['a11']);
    const members = view(r.state, 20);
    expect(byId(members, 'a').relation).toBe('爸爸');
    expect(byId(members, `late_${YEAR}_${MONTH}`).relation).toBe('爷爷');
    expect(byId(members, 'b').relation).toBe('小姑');
    expect(byId(members, 'a2').relation).toBe('妹妹');
    expect(byId(members, 'b1').relation).toBe('姑表弟');
  });

  it('子女继承：兄弟姐妹的孩子成为侄辈，自己的孩子成为子女', () => {
    const r = heirOf(family(), 'b');
    expect(r.state.children.map((c) => c.id)).toEqual(['b1']);
    const members = view(r.state, 40, '女');
    expect(byId(members, 'a').relation).toBe('哥哥');
    expect(byId(members, 'a1').relation).toBe('侄子');
    expect(byId(members, 'a11').generation).toBe('孙辈');
  });

  it('清理已故的远房旁支，保留直系祖先与在世的人', () => {
    const state = family();
    state.origin = {
      ...state.origin!,
      members: [
        { id: 'gg', name: '曾祖父', gender: '男', kin: 'grandparent', chain: '爸爸的爸爸', relation: '爷爷', generation: '祖辈', ageOffset: 60, lifespan: 80, occupationByAge: [[0, '农夫']], defaultAffinity: 80, avatarBg: '#000', desc: '', traits: [] },
        { id: 'fu', name: '堂叔祖', gender: '男', kin: 'granduncle', chain: '爸爸的爸爸的弟弟', relation: '叔公', generation: '祖辈', ageOffset: 55, lifespan: 80, occupationByAge: [[0, '农夫']], defaultAffinity: 80, avatarBg: '#000', desc: '', traits: [] },
      ],
    };
    const ids = heirOf(state, 'a').state.origin!.members.map((d) => d.id);
    expect(ids).toContain('gg');
    expect(ids).not.toContain('fu');
  });
});

describe('强制相亲与包办婚姻', () => {
  /** 依次返回给定的值，之后一直返回 0.99（不再触发其他概率事件） */
  const seq = (...values: number[]) => () => (values.length ? values.shift()! : 0.99);
  const single = (age: number) => ({ ...INITIAL_FAMILY_STATE, children: [person('s', '女', age)] });
  const arranged = (status: 'pending' | 'estranged') => ({
    ...INITIAL_FAMILY_STATE,
    children: [person('s', '女', 32, { spouse: spouse('女婿', '男', 33), arranged: status })],
  });

  it('只能为 30 岁以上、未婚、在世的子女与孙辈安排', () => {
    const members = view(family());
    expect(canArrangeMarriage(byId(view(single(30)), 's'))).toBeNull();
    expect(canArrangeMarriage(byId(view(single(29)), 's'))).not.toBeNull();
    expect(canArrangeMarriage(byId(members, 'a'))).not.toBeNull();
    const great = family();
    great.children[0].kids![0].kids![0] = person('a11', '女', 31);
    expect(canArrangeMarriage(byId(view(great), 'a11'))).not.toBeNull();
  });

  it('包办婚事当场成婚，被安排者好感下降', () => {
    const r = arrangeMarriage(single(31), 's', YEAR, MONTH)!;
    const s = r.state.children[0];
    expect(s.spouse?.name).toBe(r.spouse.name);
    expect(s.arranged).toBe('pending');
    expect(r.state.affinity.s).toBe(90 - MATCHMAKING_AFFINITY_PENALTY);
  });

  it('磨合中的婚姻每月判定：和睦、离婚或与家族生分', () => {
    const content = monthlyFamilyLife(arranged('pending'), YEAR, MONTH, seq(ARRANGED_CONTENT_CHANCE / 2)).state;
    const divorced = monthlyFamilyLife(arranged('pending'), YEAR, MONTH, seq(ARRANGED_CONTENT_CHANCE + ARRANGED_DIVORCE_CHANCE / 2)).state;
    const estranged = monthlyFamilyLife(arranged('pending'), YEAR, MONTH, seq(ARRANGED_CONTENT_CHANCE + ARRANGED_DIVORCE_CHANCE + ARRANGED_ESTRANGE_CHANCE / 2)).state;
    expect(content.children[0].arranged).toBe('content');
    expect(divorced.children[0].spouse).toBeUndefined();
    expect(estranged.children[0].arranged).toBe('estranged');
    expect(content.affinity.s).toBeGreaterThan(divorced.affinity.s);
  });

  it('与家族生分后好感每月持续下降', () => {
    const r = monthlyFamilyLife(arranged('estranged'), YEAR, MONTH, seq());
    expect(r.state.affinity.s).toBe(90 - ESTRANGED_AFFINITY_DECAY);
  });

  it('生分的孙辈长期不满时带着自己这一支独立', () => {
    const state = family();
    state.children[0].kids![0] = { ...state.children[0].kids![0], spouse: spouse('孙媳', '女', 20), arranged: 'estranged' };
    state.affinity = { a1: 30 };
    state.discontent = { a1: SPLIT_AFTER_MONTHS - 1 };
    const r = monthlyFamilyDrift(state, view(state), YEAR, MONTH);
    expect(r.splits.map((b) => b.name)).toContain('成员a1');
    const ids = view(r.state).map((m) => m.id);
    expect(ids).not.toContain('a1');
    expect(ids).not.toContain('a11');
  });
});

describe('当家人的起始健康', () => {
  it('初代 50，每传一代 +10，最高 100', () => {
    expect(heirStartHealth(undefined, 1, false)).toBe(FOUNDER_START_HEALTH + 10);
    expect(heirStartHealth(60, 1, false)).toBe(70);
    expect(heirStartHealth(95, 1, false)).toBe(100);
  });

  it('继承人出生在历史大事件期间的这一代只 +5', () => {
    expect(heirStartHealth(60, 1, true)).toBe(65);
  });

  it('跳过子辈由孙辈继承时按相差的代数叠加；兄弟姐妹继承不叠加', () => {
    expect(heirStartHealth(60, 2, false)).toBe(80);
    expect(heirStartHealth(60, 0, false)).toBe(60);
  });
});
