import { describe, expect, it } from 'vitest';
import { Column, Row } from './admin.model';
import { tableWarnings } from './table-calc';

const columns: Column[] = [
  { key: 'name', label: 'รายการ', type: 'text' },
  { key: 'count', label: 'จำนวน', type: 'number' },
];

describe('tableWarnings', () => {
  it('ignores completely empty prepared rows', () => {
    expect(tableWarnings(columns, [{ name: '', count: '' }])).toEqual([]);
  });

  it('finds incomplete, invalid, negative and duplicate values', () => {
    const rows: Row[] = [
      { name: 'นักเรียน', count: '' },
      { name: 'ครู', count: 'abc' },
      { name: 'ครู', count: -2 },
    ];
    const kinds = tableWarnings(columns, rows).map((warning) => warning.kind);
    expect(kinds).toContain('incomplete');
    expect(kinds).toContain('invalid-number');
    expect(kinds).toContain('negative');
    expect(kinds).toContain('duplicate');
  });

  it('warns when a numeric value changes at least 50 percent from the previous year', () => {
    const current: Row[] = [{ name: 'นักเรียน', count: 160 }];
    const previous: Row[] = [{ name: 'นักเรียน', count: 100 }];
    expect(tableWarnings(columns, current, previous).some((warning) => warning.kind === 'large-change')).toBe(true);
  });

  it('finds an incorrect manually entered total row', () => {
    const graduationColumns: Column[] = [
      { key: 'level', label: 'ระดับชั้น', type: 'text' },
      { key: 'graduates', label: 'จำนวนผู้จบ', type: 'number' },
      { key: 'career', label: 'ประกอบอาชีพ', type: 'number' },
    ];
    const rows: Row[] = [
      { level: 'ม.3', graduates: 481, career: 90 },
      { level: 'ม.6', graduates: 372, career: 31 },
      { level: 'รวม', graduates: 853, career: 38 },
    ];
    const warnings = tableWarnings(graduationColumns, rows);
    expect(warnings.some((warning) => warning.kind === 'total-mismatch' && warning.columnKey === 'career')).toBe(true);
    expect(warnings.some((warning) => warning.kind === 'total-mismatch' && warning.columnKey === 'graduates')).toBe(false);
  });
});
