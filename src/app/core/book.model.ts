// รูปแบบข้อมูลเล่มสารสนเทศ (PHP: books.php และ book.php ส่งข้อมูลรูปแบบนี้มา)

/** ข้อมูลย่อของเล่ม ใช้แสดงปกบนหน้าแรก */
export interface BookSummary {
  id: number;
  academicYear: number; // ปีการศึกษา เช่น 2569
  term: number; // 0 = รายปี, 1 หรือ 2 = ภาคเรียน
  title: string;
  hasData?: boolean; // false = ยังไม่มีฝ่ายใดกรอกข้อมูล
  coverImage?: string; // รูปปก (ถ้ามี) ถ้าไม่มีจะวาดปกให้อัตโนมัติ
  pdfUrl?: string; // ไฟล์ PDF ให้ดาวน์โหลด (ถ้ามี)
  sample?: boolean; // true = ข้อมูลตัวอย่าง
}

/** เล่มฉบับเต็ม มีเนื้อหาแยกเป็นหัวข้อ */
export interface Book extends BookSummary {
  sections: Section[];
}

export interface Section {
  id: string;
  group?: string; // ชื่อฝ่ายที่เป็นเจ้าของหัวข้อ
  title: string;
  blocks: Block[];
}

/** เนื้อหาในหัวข้อ: ย่อหน้า ตาราง หรือรูป */
export type Block = ParagraphBlock | TableBlock | ImageBlock;

export interface ImageBlock {
  type: 'img';
  src: string;
  caption: string;
}

export interface ParagraphBlock {
  type: 'p';
  text: string;
}

export interface TableBlock {
  type: 'table';
  caption?: string;
  columns: string[];
  rows: (string | number)[][];
}

/** ข้อความบอกว่าเป็นเล่มรายปีหรือรายภาคเรียน */
export function termLabel(term: number): string {
  return term === 0 ? 'รายปี' : `ภาคเรียนที่ ${term}`;
}
