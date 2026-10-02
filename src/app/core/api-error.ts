import { HttpErrorResponse } from '@angular/common/http';

/** ดึงข้อความ error ภาษาไทยที่ PHP ส่งมา */
export function apiError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (เปิด XAMPP แล้วหรือยัง?)';
    if (e.error && typeof e.error.error === 'string') return e.error.error;
    if (e.status === 404) return 'ไม่พบไฟล์ API (วางไฟล์ PHP ครบแล้วหรือยัง?)';
    return `เกิดข้อผิดพลาด (${e.status})`;
  }
  return 'เกิดข้อผิดพลาด';
}
