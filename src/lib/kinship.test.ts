import { describe, expect, it } from 'vitest';
import { chainLevel, chainOfTitle, generationLabel, isLineal, kinOfChain, relationTitle } from './kinship';

describe('称谓', () => {
  it('后代按代数得到曾孙、玄孙等称谓，女儿一支为外孙', () => {
    expect(relationTitle('儿子的儿子的儿子', '男', false)).toBe('曾孙');
    expect(relationTitle('儿子的儿子的儿子的儿子', '男', false)).toBe('玄孙');
    expect(relationTitle('女儿的儿子', '男', false)).toBe('外孙');
  });

  it('同一条关系链有长幼两种称谓时，按对方是否比当家人年长挑选', () => {
    expect(relationTitle('爸爸的兄弟的儿子', '男', true)).toBe('堂哥');
    expect(relationTitle('爸爸的兄弟的儿子', '男', false)).toBe('堂弟');
  });

  it('不会把对方称为「自己」；算不出时用备用文字', () => {
    expect(relationTitle('爸爸的儿子', '男', true)).toBe('哥哥');
    expect(relationTitle('不存在的关系', '男', false, '亲属')).toBe('亲属');
  });

  it('由称谓反推关系链；非血缘称谓反推不出', () => {
    expect(chainOfTitle('叔叔')).toBe('爸爸的弟弟');
    expect(chainOfTitle('继母')).toBeNull();
  });
});

describe('辈分与亲属类型', () => {
  it('上一代 +1、下一代 −1，同辈与配偶不改变层级', () => {
    expect(chainLevel('爸爸的爸爸')).toBe(2);
    expect(chainLevel('爸爸的哥哥的儿子')).toBe(0);
    expect(chainLevel('儿子的女儿的儿子')).toBe(-3);
    expect(chainLevel('哥哥的老婆')).toBe(0);
  });

  it('辈分名称覆盖高祖到玄孙，更远的按代数命名', () => {
    expect(generationLabel(-3)).toBe('曾孙辈');
    expect(generationLabel(-6)).toBe('第 6 代孙辈');
    expect(generationLabel(6)).toBe('远祖辈');
  });

  it('亲属类型：父母（含继父母）、祖辈、兄弟姐妹、叔伯、堂亲、侄辈、后代', () => {
    expect(kinOfChain('妈妈')).toBe('parent');
    expect(kinOfChain('爸爸的老婆')).toBe('parent');
    expect(kinOfChain('爸爸的爸爸')).toBe('grandparent');
    expect(kinOfChain('姐姐')).toBe('sibling');
    expect(kinOfChain('爸爸的哥哥')).toBe('uncle');
    expect(kinOfChain('爸爸的兄弟的儿子')).toBe('cousin');
    expect(kinOfChain('哥哥的女儿')).toBe('nephew');
    expect(kinOfChain('儿子的儿子')).toBe('grandchild');
  });

  it('直系只往上或只往下', () => {
    expect(isLineal('爸爸的爸爸的妈妈')).toBe(true);
    expect(isLineal('爸爸的哥哥')).toBe(false);
  });
});
