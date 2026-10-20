// ผลรวมอัตโนมัติในตาราง (ต้องคำนวณแบบเดียวกับ compute_table() ใน api/lib.php)
//   คอลัมน์ชนิด sum = บวกคอลัมน์ตัวเลขใน of ของแถวเดียวกัน
//   คอลัมน์ที่ติ๊ก total = รวมไว้ในแถว "รวม" ท้ายตาราง
import { Column, Row } from './admin.model';

/** แปลงค่าที่กรอก (อาจมี , หรือช่องว่าง) เป็นตัวเลข ไม่ใช่ตัวเลขคืน null */
export function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const s = v.replace(/[,\s]/g, '');
  if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return Number(s);
}

function decimals(n: number): number {
  const s = String(n);
  const p = s.indexOf('.');
  return p < 0 ? 0 : Math.min(4, s.length - p - 1);
}

/** บวกตัวเลข ปัดทศนิยมเท่าตัวที่ละเอียดที่สุด (0.1 + 0.2 = 0.3) ไม่มีตัวเลขเลยคืน null */
export function addNumbers(values: unknown[]): number | null {
  let sum = 0;
  let dec = 0;
  let any = false;
  for (const v of values) {
    const n = toNumber(v);
    if (n === null) continue;
    sum += n;
    dec = Math.max(dec, decimals(n));
    any = true;
  }
  if (!any) return null;
  const f = 10 ** dec;
  return Math.round(sum * f) / f;
}

/** ค่าของคอลัมน์ผลรวมในแถวนี้ */
export function rowSum(col: Column, row: Row): number | null {
  return addNumbers((col.of ?? []).map((k) => row[k]));
}

/** มีคอลัมน์ไหนติ๊กให้รวมท้ายตารางไหม */
export function hasTotal(cols: Column[]): boolean {
  return cols.some((c) => c.total && c.type !== 'text');
}

/** แถว "รวม" ท้ายตาราง: key → ค่า (คอลัมน์ข้อความแรกเป็นคำว่า "รวม") */
export function totalRow(cols: Column[], rows: Row[]): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  let labelDone = false;
  for (const c of cols) {
    if (c.total && c.type !== 'text') {
      const vals = rows.map((r) => (c.type === 'sum' ? rowSum(c, r) : r[c.key]));
      out[c.key] = addNumbers(vals) ?? 0;
    } else if (!labelDone && c.type === 'text') {
      out[c.key] = 'รวม';
      labelDone = true;
    } else {
      out[c.key] = '';
    }
  }
  return out;
}

export function formatNumber(n: number | null | string): string {
  return typeof n === 'number' ? n.toLocaleString('th-TH') : (n ?? '');
}

export type TableWarningKind = 'incomplete' | 'invalid-number' | 'negative' | 'duplicate' | 'total-mismatch' | 'large-change';

export interface TableWarning {
  kind: TableWarningKind;
  message: string;
  row: number;
  columnKey?: string;
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

/**
 * ตรวจข้อมูลที่น่าสงสัยโดยไม่ตัดสินแทนผู้ใช้ คำเตือนทั้งหมดจึงสามารถยืนยันแล้วบันทึกต่อได้
 * แถวว่างทั้งแถวไม่นับเป็นข้อผิดปกติ เพราะหน้ากรอกข้อมูลเตรียมแถวว่างไว้ให้ล่วงหน้า
 */
export function tableWarnings(cols: Column[], rows: Row[], previousRows: Row[] = []): TableWarning[] {
  const warnings: TableWarning[] = [];
  const editable = cols.filter((c) => c.type !== 'sum');
  const numeric = editable.filter((c) => c.type === 'number');
  const labelCol = editable.find((c) => c.type === 'text');
  const filledRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => editable.some((c) => hasValue(row[c.key])));

  for (const { row, index } of filledRows) {
    const missing = editable.filter((c) => !hasValue(row[c.key]));
    if (missing.length) {
      warnings.push({
        kind: 'incomplete',
        row: index,
        message: `แถวที่ ${index + 1} ยังว่าง: ${missing.map((c) => c.label).join(', ')}`,
      });
    }

    for (const col of numeric) {
      const raw = row[col.key];
      if (!hasValue(raw)) continue;
      const value = toNumber(raw);
      if (value === null) {
        warnings.push({
          kind: 'invalid-number',
          row: index,
          columnKey: col.key,
          message: `แถวที่ ${index + 1} · ${col.label} ไม่ใช่ตัวเลข`,
        });
      } else if (value < 0) {
        warnings.push({
          kind: 'negative',
          row: index,
          columnKey: col.key,
          message: `แถวที่ ${index + 1} · ${col.label} เป็นค่าติดลบ (${formatNumber(value)})`,
        });
      }
    }
  }

  // ตรวจชื่อรายการซ้ำจากคอลัมน์ข้อความคอลัมน์แรก (ถ้ามี)
  if (labelCol) {
    const seen = new Map<string, number>();
    for (const { row, index } of filledRows) {
      const label = String(row[labelCol.key] ?? '').trim();
      if (!label) continue;
      const key = label.toLocaleLowerCase('th-TH');
      const first = seen.get(key);
      if (first !== undefined) {
        warnings.push({
          kind: 'duplicate',
          row: index,
          columnKey: labelCol.key,
          message: `แถวที่ ${index + 1} · ${labelCol.label} ซ้ำกับแถวที่ ${first + 1} (“${label}”)`,
        });
      } else {
        seen.set(key, index);
      }
    }
  }

  // ตารางเก่าบางหัวข้อสร้างแถว "รวม" เป็นช่องกรอกธรรมดา ไม่ได้ใช้คอลัมน์ผลรวมอัตโนมัติ
  // จึงรวมแถวรายละเอียดที่อยู่หลังแถวรวมก่อนหน้า แล้วเทียบกับแถวรวมปัจจุบัน
  if (labelCol && numeric.length) {
    const isTotalRow = (row: Row) => /^(รวม|รวมทั้งสิ้น|ผลรวม|รวมทั้งหมด)$/.test(String(row[labelCol.key] ?? '').trim());
    let previousTotalIndex = -1;
    for (const { row, index } of filledRows) {
      if (!isTotalRow(row)) continue;
      const detailRows = filledRows
        .filter((item) => item.index > previousTotalIndex && item.index < index && !isTotalRow(item.row))
        .map((item) => item.row);
      if (detailRows.length) {
        for (const col of numeric) {
          const entered = toNumber(row[col.key]);
          const expected = addNumbers(detailRows.map((detail) => detail[col.key]));
          if (entered === null || expected === null || Math.abs(entered - expected) < 1e-9) continue;
          warnings.push({
            kind: 'total-mismatch',
            row: index,
            columnKey: col.key,
            message: `แถวที่ ${index + 1} · ${col.label} รวมไม่ตรง (ควรเป็น ${formatNumber(expected)} แต่กรอก ${formatNumber(entered)})`,
          });
        }
      }
      previousTotalIndex = index;
    }
  }

  // เทียบปีก่อน: จับคู่ด้วยชื่อรายการ ถ้าไม่มีคอลัมน์ชื่อจึงเทียบตามลำดับแถว
  if (previousRows.length && numeric.length) {
    const oldByLabel = new Map<string, Row>();
    if (labelCol) {
      for (const row of previousRows) {
        const label = String(row[labelCol.key] ?? '').trim().toLocaleLowerCase('th-TH');
        if (label) oldByLabel.set(label, row);
      }
    }
    for (const { row, index } of filledRows) {
      const label = labelCol ? String(row[labelCol.key] ?? '').trim().toLocaleLowerCase('th-TH') : '';
      const old = (label && oldByLabel.get(label)) || previousRows[index];
      if (!old) continue;
      for (const col of numeric) {
        const current = toNumber(row[col.key]);
        const before = toNumber(old[col.key]);
        if (current === null || before === null || before === 0 || current < 0 || before < 0) continue;
        const percent = Math.abs((current - before) / before) * 100;
        if (percent < 50) continue;
        warnings.push({
          kind: 'large-change',
          row: index,
          columnKey: col.key,
          message: `แถวที่ ${index + 1} · ${col.label} เปลี่ยนจากปีก่อน ${Math.round(percent).toLocaleString('th-TH')}% (${formatNumber(before)} → ${formatNumber(current)})`,
        });
      }
    }
  }

  return warnings;
}
