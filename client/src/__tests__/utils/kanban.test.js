import { describe, it, expect } from 'vitest';
import {
  groupTasksByStatus,
  computeDragPosition,
  applyOptimisticMove,
  COLUMN_IDS,
} from '../../utils/kanban.js';

const tasks = [
  { id: '1', status: 'TODO', position: 0, title: 'A' },
  { id: '2', status: 'TODO', position: 1, title: 'B' },
  { id: '3', status: 'IN_PROGRESS', position: 0, title: 'C' },
];

describe('kanban utils', () => {
  it('groups tasks by status in position order', () => {
    const grouped = groupTasksByStatus(tasks);
    expect(grouped.TODO.map((task) => task.id)).toEqual(['1', '2']);
    expect(grouped.IN_PROGRESS.map((task) => task.id)).toEqual(['3']);
    expect(grouped.DONE).toEqual([]);
  });

  it('computes drag position when dropping on column', () => {
    const result = computeDragPosition(tasks, '1', 'DONE');
    expect(result).toEqual({ status: 'DONE', position: 0 });
  });

  it('computes drag position when dropping on another task', () => {
    const result = computeDragPosition(tasks, '1', '2');
    expect(result).toEqual({ status: 'TODO', position: 0 });
  });

  it('applies optimistic move and reindexes positions', () => {
    const next = applyOptimisticMove(tasks, '1', { status: 'IN_PROGRESS', position: 1 });
    const grouped = groupTasksByStatus(next);

    expect(grouped.TODO.map((task) => task.id)).toEqual(['2']);
    expect(grouped.IN_PROGRESS.map((task) => task.id)).toEqual(['3', '1']);
    expect(COLUMN_IDS.every((id) => grouped[id].every((task, index) => task.position === index))).toBe(
      true,
    );
  });
});
