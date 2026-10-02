// รูปแบบข้อมูลของส่วนจัดการ (ต้องตรงกับที่ PHP ส่งมา)

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'editor';
  departmentId: number | null;
}

export interface UserRow extends User {
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface Department {
  id: number;
  name: string;
}

export interface Term {
  id: number;
  academicYear: number;
  term: number; // 0 = แถวรายปี
  isCurrent: boolean;
}

export interface Column {
  key: string; // รหัสคงที่ เช่น c1 (ไม่เปลี่ยนแม้แก้ชื่อคอลัมน์)
  label: string;
  type: 'text' | 'number';
}

export type TopicKind = 'table' | 'text';
export type Frequency = 'term' | 'year';

/** หมวดของเล่มสารสนเทศ (ต้องตรงกับ chapters() ใน api/lib.php) */
export const CHAPTERS: { no: number; name: string }[] = [
  { no: 1, name: 'ข้อมูลทั่วไป' },
  { no: 2, name: 'ทิศทางการจัดการศึกษา' },
  { no: 3, name: 'การบริหารจัดการ' },
  { no: 4, name: 'ข้อมูลบุคลากร' },
  { no: 5, name: 'ข้อมูลนักเรียน' },
  { no: 6, name: 'หลักสูตรและแหล่งเรียนรู้' },
  { no: 7, name: 'อาคารสถานที่' },
  { no: 8, name: 'งบประมาณ' },
  { no: 9, name: 'ผลการดำเนินงาน' },
  { no: 10, name: 'ผลงานและรางวัล' },
  { no: 0, name: 'อื่น ๆ' },
];

export function chapterLabel(no: number): string {
  const c = CHAPTERS.find((x) => x.no === no) ?? CHAPTERS[CHAPTERS.length - 1];
  return c.no > 0 ? `${c.no}. ${c.name}` : c.name;
}

export interface Topic {
  id: number;
  departmentId: number;
  chapter: number;
  title: string;
  kind: TopicKind;
  frequency: Frequency;
  columns: Column[];
  hasData: boolean;
  updatedAt: string | null;
  updatedByName: string | null;
  canEdit: boolean;
}

export interface TopicDetail {
  id: number;
  departmentId: number;
  chapter: number;
  title: string;
  kind: TopicKind;
  frequency: Frequency;
  columns: Column[];
  recordCount: number;
  canEdit: boolean;
}

export type Row = Record<string, string | number | null>;

/** รูปแนบในหัวข้อ (file = ชื่อไฟล์ในโฟลเดอร์ uploads) */
export interface ImageItem {
  file: string;
  caption: string;
}

export interface RecordResponse {
  topic: Omit<TopicDetail, 'recordCount'>;
  academicYear: number;
  term: number;
  data: { rows?: Row[]; text?: string; images?: ImageItem[] } | null;
  updatedAt: string | null;
  updatedByName: string | null;
}

/** ชื่อภาคเรียนสำหรับแสดงผล */
export function periodLabel(year: number, term: number): string {
  return term === 0 ? `ปีการศึกษา ${year} (รายปี)` : `ภาคเรียนที่ ${term}/${year}`;
}
