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
