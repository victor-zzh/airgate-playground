import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNodeData, NodeResult, ExecutionContext } from './types';
import { EXECUTORS } from './executors';

/**
 * Topological sort using Kahn's algorithm (BFS).
 * Returns node IDs in an order where every dependency comes before its dependents.
 * Throws if a cycle is detected.
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): string[] {
  const nodeIds = new Set(nodes.map(n => n.id));

  // Build adjacency list (source → targets) and in-degree map
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialise every node with 0 in-degree
  for (const id of nodeIds) {
    adjList.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of edges) {
    // Only consider edges whose both endpoints are in the node set
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;

    adjList.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Queue starts with all nodes that have no incoming edges
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const neighbour of adjList.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbour) ?? 1) - 1;
      inDegree.set(neighbour, newDegree);
      if (newDegree === 0) {
        queue.push(neighbour);
      }
    }
  }

  if (sorted.length !== nodeIds.size) {
    throw new Error('Workflow contains a cycle');
  }

  return sorted;
}

/**
 * Determine which node IDs are downstream of a given starting node,
 * traversing only edges whose sourceHandle matches the given handle.
 * Used to mark the inactive branch of a conditional node as skipped.
 */
function collectDownstreamNodes(
  startNodeId: string,
  sourceHandle: string,
  edges: Edge[],
  allNodeIds: Set<string>,
): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [];

  // First step: find direct targets connected via the given handle
  for (const edge of edges) {
    if (edge.source === startNodeId && edge.sourceHandle === sourceHandle) {
      if (allNodeIds.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    // Continue traversal through all outgoing edges of downstream nodes
    for (const edge of edges) {
      if (edge.source === current && allNodeIds.has(edge.target) && !visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  return visited;
}

/**
 * Execute a workflow graph.
 *
 * Nodes are executed in topological order.  For each node the executor
 * receives the outputs of all upstream nodes that are directly connected
 * to one of its input handles.
 *
 * When a conditional node finishes, the nodes that belong to the inactive
 * branch are marked as 'idle' (skipped) so the UI can reflect that they
 * were not executed.
 *
 * @returns A map of nodeId → NodeResult for every node that completed
 *          successfully.
 */
export async function executeWorkflow(
  nodes: Node[],
  edges: Edge[],
  context: ExecutionContext,
): Promise<Map<string, NodeResult>> {
  const order = topologicalSort(nodes, edges);
  const results = new Map<string, NodeResult>();

  // Track which nodes should be skipped because they belong to an inactive
  // conditional branch.
  const skippedNodes = new Set<string>();

  const allNodeIds = new Set(nodes.map(n => n.id));

  for (const nodeId of order) {
    if (context.signal.aborted) break;

    // Skip nodes that are on an inactive conditional branch
    if (skippedNodes.has(nodeId)) {
      // Leave status as 'idle' — caller initialised it that way
      continue;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;

    const data = node.data as WorkflowNodeData;
    const executor = EXECUTORS[data.nodeType];
    if (!executor) continue;

    // Gather inputs: for every edge whose target is this node, copy the
    // source node's result into inputs keyed by targetHandle.
    const inputs: Record<string, NodeResult> = {};
    for (const edge of edges) {
      if (edge.target === nodeId && edge.sourceHandle && edge.targetHandle) {
        const sourceResult = results.get(edge.source);
        if (sourceResult) {
          inputs[edge.targetHandle] = sourceResult;
        }
      }
    }

    context.onNodeStatusChange(nodeId, 'running');

    try {
      const result = await executor(inputs, data, context);
      results.set(nodeId, result);
      context.onNodeStatusChange(nodeId, 'completed', result);

      // Handle conditional branching: mark the inactive branch as skipped
      if (data.nodeType === 'conditional') {
        const tookTrue = result.boolean === true;

        // The branch we did NOT take should be skipped
        const inactiveBranchHandle = tookTrue ? 'false_out' : 'true_out';
        const downstream = collectDownstreamNodes(
          nodeId,
          inactiveBranchHandle,
          edges,
          allNodeIds,
        );
        for (const downstreamId of downstream) {
          skippedNodes.add(downstreamId);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Execution failed';
      context.onNodeStatusChange(nodeId, 'error', undefined, message);
      // A single node failure does not abort the entire workflow; downstream
      // nodes that depend on this one will simply receive no input for the
      // missing handle and may fail on their own if the input was required.
    }
  }

  return results;
}
