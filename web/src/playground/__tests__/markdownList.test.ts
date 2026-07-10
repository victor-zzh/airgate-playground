import { describe, expect, it } from 'vitest';
import { buildListTree, parseListLine } from '../markdownList';

describe('parseListLine', () => {
  it('识别无序/有序列表项', () => {
    expect(parseListLine('- 苹果')).toEqual({ text: '苹果', ordered: false, level: 0 });
    expect(parseListLine('* 香蕉')).toEqual({ text: '香蕉', ordered: false, level: 0 });
    expect(parseListLine('2. 第二项')).toEqual({ text: '第二项', ordered: true, level: 0 });
    expect(parseListLine('3) 第三项')).toEqual({ text: '第三项', ordered: true, level: 0 });
  });

  it('按缩进计算层级（2 空格一级，tab 视作 2 空格）', () => {
    expect(parseListLine('  - 二级')?.level).toBe(1);
    expect(parseListLine('    - 三级')?.level).toBe(2);
    expect(parseListLine('\t- tab 二级')?.level).toBe(1);
  });

  it('层级封顶，超深缩进不越界', () => {
    expect(parseListLine('            - 很深')?.level).toBe(3);
  });

  it('非列表行返回 null', () => {
    expect(parseListLine('普通文本')).toBeNull();
    expect(parseListLine('-无空格不是列表')).toBeNull();
  });
});

describe('buildListTree', () => {
  it('扁平序列按层级组装成树', () => {
    const tree = buildListTree([
      { text: '一', ordered: false, level: 0 },
      { text: '一.1', ordered: false, level: 1 },
      { text: '一.2', ordered: false, level: 1 },
      { text: '二', ordered: false, level: 0 },
    ]);
    expect(tree).toHaveLength(2);
    expect(tree[0].children.map(n => n.text)).toEqual(['一.1', '一.2']);
    expect(tree[1].children).toHaveLength(0);
  });

  it('层级回落后正确归位', () => {
    const tree = buildListTree([
      { text: 'a', ordered: false, level: 0 },
      { text: 'a1', ordered: false, level: 1 },
      { text: 'a1x', ordered: false, level: 2 },
      { text: 'b', ordered: false, level: 0 },
      { text: 'b1', ordered: false, level: 1 },
    ]);
    expect(tree.map(n => n.text)).toEqual(['a', 'b']);
    expect(tree[0].children[0].children.map(n => n.text)).toEqual(['a1x']);
    expect(tree[1].children.map(n => n.text)).toEqual(['b1']);
  });

  it('首项就是深层级时不丢项', () => {
    const tree = buildListTree([
      { text: '直接二级', ordered: false, level: 1 },
      { text: '顶级', ordered: false, level: 0 },
    ]);
    expect(tree.map(n => n.text)).toEqual(['直接二级', '顶级']);
  });

  it('嵌套里无序/有序可混用', () => {
    const tree = buildListTree([
      { text: '步骤', ordered: true, level: 0 },
      { text: '要点', ordered: false, level: 1 },
    ]);
    expect(tree[0].ordered).toBe(true);
    expect(tree[0].children[0].ordered).toBe(false);
  });

  it('任务列表解析勾选态并剥掉标记', () => {
    const tree = buildListTree([
      { text: '[ ] 待办', ordered: false, level: 0 },
      { text: '[x] 已完成', ordered: false, level: 0 },
      { text: '普通项', ordered: false, level: 0 },
    ]);
    expect(tree[0].checked).toBe(false);
    expect(tree[0].text).toBe('待办');
    expect(tree[1].checked).toBe(true);
    expect(tree[1].text).toBe('已完成');
    expect(tree[2].checked).toBeNull();
  });
});
