// แปลงเล่มสารสนเทศเป็นไฟล์ Excel
//   แท็บแรก "สารบัญ" + ตารางละ 1 แท็บ + แท็บ "ความเรียง" (ถ้ามี)
import { Book, Section, TableBlock } from './book.model';
import { SheetData, downloadXlsx } from './xlsx';
import { SITE } from '../site.config';

/** ตาราง 1 ตาราง → 1 แท็บ: ชื่อหัวข้อ / หัวตาราง / ข้อมูล / แถวรวม */
export function tableSheet(section: Section, table: TableBlock, book?: Book): SheetData {
  const rows: SheetData['rows'] = [];
  const styles: SheetData['styles'] = {};
  styles[0] = 'title';
  rows.push([section.title]);
  rows.push([[section.group, book ? book.title : ''].filter(Boolean).join(' · ')]);
  rows.push([]);
  styles[rows.length] = 'head';
  rows.push(table.columns);
  for (const r of table.rows) rows.push(r.map((v) => (v === '' ? null : v)));
  if (table.foot) {
    styles[rows.length] = 'total';
    rows.push(table.foot.map((v) => (v === '' ? null : v)));
  }
  return { name: section.title, rows, styles };
}

export function bookSheets(book: Book): SheetData[] {
  const tables: SheetData[] = [];
  const toc: SheetData = {
    name: 'สารบัญ',
    rows: [[`${book.title} · ${SITE.schoolName}`], [], ['หมวด', 'หัวข้อ', 'อยู่ที่แท็บ']],
    styles: { 0: 'title', 2: 'head' },
  };
  const textRows: SheetData['rows'] = [];
  const textStyles: SheetData['styles'] = {};

  for (const s of book.sections) {
    const table = s.blocks.find((b): b is TableBlock => b.type === 'table');
    if (table) {
      const sheet = tableSheet(s, table, book);
      tables.push(sheet);
      toc.rows.push([s.group ?? '', s.title, `แท็บที่ ${tables.length + 1}`]);
      continue;
    }
    const paras = s.blocks.filter((b) => b.type === 'p').map((b) => (b.type === 'p' ? b.text : ''));
    if (paras.length) {
      textStyles[textRows.length] = 'head';
      textRows.push([`${s.group ? s.group + ' · ' : ''}${s.title}`]);
      for (const p of paras) textRows.push([p]);
      textRows.push([]);
      toc.rows.push([s.group ?? '', s.title, 'แท็บ "ความเรียง"']);
    }
  }

  const sheets = [toc, ...tables];
  if (textRows.length) sheets.push({ name: 'ความเรียง', rows: textRows, styles: textStyles, widths: [120] });
  return sheets;
}

/** ชื่อไฟล์ เช่น สารสนเทศ ภาคเรียนที่ 1-2569.xlsx (ห้ามมี / ในชื่อไฟล์) */
export function fileName(title: string): string {
  return title.replace(/[\\/:*?"<>|]/g, '-') + '.xlsx';
}

export function downloadBook(book: Book) {
  downloadXlsx(fileName(book.title), bookSheets(book));
}

export function downloadTable(book: Book, section: Section, table: TableBlock) {
  downloadXlsx(fileName(`${section.title} (${book.title})`), [tableSheet(section, table, book)]);
}
