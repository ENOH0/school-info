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
  isPublished: boolean; // เผยแพร่แล้ว = ล็อก แก้ไม่ได้
  publishedAt: string | null;
}

export interface Column {
  key: string; // รหัสคงที่ เช่น c1 (ไม่เปลี่ยนแม้แก้ชื่อคอลัมน์)
  label: string;
  type: 'text' | 'number' | 'sum'; // sum = ผลรวมอัตโนมัติ ไม่ต้องกรอก
  of?: string[]; // sum: บวกคอลัมน์ไหนบ้าง เช่น ['c2', 'c3']
  total?: boolean; // รวมคอลัมน์นี้ในแถว "รวม" ท้ายตาราง
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
  locked: boolean; // ข้อมูลภาคเรียนนี้ล็อกแล้ว (เล่มเผยแพร่แล้ว)
  structureLocked: boolean; // หัวข้ออยู่ในเล่มที่เผยแพร่แล้ว แก้ชื่อ/คอลัมน์/ลำดับไม่ได้
  copiedFrom: string | null; // คัดลอกจากครั้งก่อนแล้วยังไม่ได้ตรวจ เช่น "ภาคเรียนที่ 1/2569"
}

/** กราฟในเล่มของหัวข้อแบบตาราง */
export interface ChartConfig {
  type: 'bar' | 'line' | 'pie';
  series: string[]; // คอลัมน์ตัวเลขที่จะแสดง (วงกลมใช้คอลัมน์แรก)
  trend: boolean; // แสดงกราฟเทียบภาคเรียน/ปีก่อน ๆ ด้วย
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
  structureLocked: boolean;
  chart: ChartConfig | null;
}

export type Row = Record<string, string | number | null>;

/** รูปแนบในหัวข้อ (file = ชื่อไฟล์ในโฟลเดอร์ uploads) */
export interface ImageItem {
  file: string;
  caption: string;
}

export interface RecordResponse {
  topic: Omit<TopicDetail, 'recordCount' | 'structureLocked' | 'chart'>;
  academicYear: number;
  term: number;
  locked: boolean;
  data: { rows?: Row[]; text?: string; images?: ImageItem[]; copiedFrom?: string } | null;
  updatedAt: string | null;
  updatedByName: string | null;
  previous: { academicYear: number; term: number } | null; // ครั้งล่าสุดก่อนหน้านี้ที่มีข้อมูล
}

/** ผลการคัดลอกจากครั้งก่อน */
export interface CopyResult {
  copied: number;
  titles: string[];
  noPrevious: number;
  locked: number;
  filled: number;
}

/** ความคืบหน้าการกรอกข้อมูลของแต่ละฝ่าย (หน้าภาพรวม) */
export interface DeptProgress {
  id: number;
  name: string;
  total: number;
  filled: number;
  lastUpdatedAt: string | null;
  lastUpdatedBy: string | null;
  missing: { id: number; title: string; chapter: string; frequency: Frequency }[];
  unchecked: { id: number; title: string; chapter: string; copiedFrom: string }[];
}

export interface ProgressResponse {
  academicYear: number;
  term: number;
  published: boolean;
  departments: DeptProgress[];
}

/** ชื่อภาคเรียนสำหรับแสดงผล */
export function periodLabel(year: number, term: number): string {
  return term === 0 ? `ปีการศึกษา ${year} (รายปี)` : `ภาคเรียนที่ ${term}/${year}`;
}
