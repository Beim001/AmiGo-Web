// relationship.js（https://github.com/mumuy/relationship，MIT）没有自带类型声明，这里只声明项目用到的选项模式
declare module 'relationship.js' {
  interface RelationshipOptions {
    /** 目标对象的关系链或称谓，用「的」连接，例如「爸爸的哥哥的儿子」 */
    text: string;
    /** 相对对象，留空表示自己 */
    target?: string;
    /** 本人性别：0 女，1 男 */
    sex?: 0 | 1 | -1;
    /** default 计算称谓，chain 由称谓反推关系链，pair 计算关系合称 */
    type?: 'default' | 'chain' | 'pair';
    /** true 为对方如何称呼我 */
    reverse?: boolean;
    /** true 时只取最短关系 */
    optimal?: boolean;
  }
  const relationship: (options: RelationshipOptions | string) => string[];
  export default relationship;
}
