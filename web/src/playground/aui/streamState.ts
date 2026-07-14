// 流式输出的 parts 累积器：替代原先 streamContent/streamReasoning 两根独立字符串。
// 按到达顺序维护有序 part 列表；连续同类增量合并进最后一个 part，交错时开新 part。
// kind 联合类型为 Phase 4 的工具调用 part（如 'tool-call'）预留扩展位。

export type StreamPartKind = 'reasoning' | 'text';

export type StreamPart = {
  kind: StreamPartKind;
  text: string;
};

// 纯函数 reducer：不可变更新（React state 直接可用）。空增量原样返回旧数组，
// 保持引用不变以跳过无意义的重渲染。
export function appendStreamPart(
  parts: readonly StreamPart[],
  kind: StreamPartKind,
  text: string,
): readonly StreamPart[] {
  if (!text) return parts;
  const last = parts[parts.length - 1];
  if (last && last.kind === kind) {
    return [...parts.slice(0, -1), { kind, text: last.text + text }];
  }
  return [...parts, { kind, text }];
}

export function streamPartsText(parts: readonly StreamPart[], kind: StreamPartKind): string {
  return parts.filter(part => part.kind === kind).map(part => part.text).join('');
}
