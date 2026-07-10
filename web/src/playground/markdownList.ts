// 列表解析：与渲染层解耦的纯函数，支持缩进嵌套与任务列表（- [ ] / - [x]）。

export interface ListItemToken {
  text: string;
  ordered: boolean;
  level: number;
}

export interface ListNode extends ListItemToken {
  checked: boolean | null; // 任务列表勾选态；非任务项为 null
  children: ListNode[];
}

const LIST_LINE_RE = /^(\s*)([-*+]|\d+[.)])\s+(.+)$/;
const TASK_ITEM_RE = /^\[([ xX])\]\s+(.+)$/;
const MAX_LIST_LEVEL = 3;

// 解析单行列表项；非列表行返回 null。缩进 2 空格为一级（tab 视作 2 空格）。
export function parseListLine(line: string): ListItemToken | null {
  const match = LIST_LINE_RE.exec(line);
  if (!match) return null;
  const indentWidth = match[1].replace(/\t/g, '  ').length;
  return {
    text: match[3].trim(),
    ordered: /^\d/.test(match[2]),
    level: Math.min(MAX_LIST_LEVEL, Math.floor(indentWidth / 2)),
  };
}

// 把扁平的列表项序列按 level 组装成树，供递归渲染嵌套 ul/ol。
export function buildListTree(items: ListItemToken[]): ListNode[] {
  const roots: ListNode[] = [];
  const stack: ListNode[] = [];
  for (const item of items) {
    const task = TASK_ITEM_RE.exec(item.text);
    const node: ListNode = {
      ...item,
      text: task ? task[2] : item.text,
      checked: task ? task[1] !== ' ' : null,
      children: [],
    };
    while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
    if (!stack.length) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  }
  return roots;
}
