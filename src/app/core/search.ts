// ===== ระบบค้นหาแบบ Ctrl+F =====
// หลักการ: ตัดข้อความเป็นชิ้น ๆ ชิ้นไหนตรงกับคำค้น ให้เลขลำดับไว้ (0, 1, 2, ...)
// หน้าเว็บจะเอาชิ้นที่มีเลขไปทำไฮไลต์ และกระโดดไปทีละอันได้

import { Book, Block } from './book.model';

/** ชิ้นข้อความ: i = -1 คือข้อความธรรมดา, i >= 0 คือคำที่ค้นเจอลำดับที่ i */
export interface Seg {
  t: string;
  i: number;
}

export type BlockView =
  | { type: 'p'; segs: Seg[] }
  | { type: 'img'; src: string; caption: Seg[]; alt: string }
  | { type: 'table'; caption: Seg[] | null; head: { segs: Seg[]; num: boolean }[]; rows: { segs: Seg[]; num: boolean }[][] };

export interface SectionView {
  id: string;
  group: string;
  title: Seg[];
  titleText: string;
  blocks: BlockView[];
  hits: number; // จำนวนที่เจอในหัวข้อนี้
}

export interface BookView {
  sections: SectionView[];
  total: number; // จำนวนที่เจอทั้งเล่ม
}

/** ตัวนับลำดับคำที่เจอ ใช้ร่วมกันทั้งเล่ม */
class Counter {
  n = 0;
}

/** ตัดข้อความเป็นชิ้น ตามคำค้น (ไม่สนตัวพิมพ์เล็กใหญ่) */
function split(text: string, q: string, c: Counter): Seg[] {
  if (!q) return [{ t: text, i: -1 }];

  const lower = text.toLocaleLowerCase();
  const out: Seg[] = [];
  let pos = 0;

  while (true) {
    const k = lower.indexOf(q, pos);
    if (k < 0) break;
    if (k > pos) out.push({ t: text.slice(pos, k), i: -1 });
    out.push({ t: text.slice(k, k + q.length), i: c.n++ });
    pos = k + q.length;
  }
  if (pos < text.length) out.push({ t: text.slice(pos), i: -1 });
  return out;
}

function cellText(v: string | number): string {
  return typeof v === 'number' ? v.toLocaleString('th-TH') : v;
}

function blockView(b: Block, q: string, c: Counter): BlockView {
  if (b.type === 'p') return { type: 'p', segs: split(b.text, q, c) };
  if (b.type === 'img') return { type: 'img', src: b.src, caption: split(b.caption, q, c), alt: b.caption };
  return {
    type: 'table',
    caption: b.caption ? split(b.caption, q, c) : null,
    // คอลัมน์ไหนเป็นตัวเลขทุกแถว หัวตารางชิดขวาตามข้อมูล
    head: b.columns.map((h, col) => ({
      segs: split(h, q, c),
      num:
        b.rows.some((r) => typeof r[col] === 'number') &&
        b.rows.every((r) => typeof r[col] === 'number' || r[col] === ''),
    })),
    rows: b.rows.map((r) => r.map((v) => ({ segs: split(cellText(v), q, c), num: typeof v === 'number' }))),
  };
}

/** สร้างข้อมูลสำหรับแสดงผลทั้งเล่ม พร้อมไฮไลต์คำค้น */
export function buildView(book: Book, query: string): BookView {
  const q = query.trim().toLocaleLowerCase();
  const c = new Counter();

  const sections = book.sections.map((s) => {
    const start = c.n;
    const title = split(s.title, q, c);
    const blocks = s.blocks.map((b) => blockView(b, q, c));
    return { id: s.id, group: s.group ?? '', title, titleText: s.title, blocks, hits: c.n - start };
  });

  return { sections, total: c.n };
}
