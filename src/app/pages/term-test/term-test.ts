import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// หน้าทดสอบ: เพิ่มเทอมลงฐานข้อมูลผ่าน PHP แล้วดึงรายการกลับมาแสดง
// เปิดที่ http://localhost:4200/test  (ต้องรัน ng serve --proxy-config proxy.conf.json และเปิด XAMPP)

interface Term {
  id: number;
  academic_year: number;
  term: number;
}

@Component({
  selector: 'app-term-test',
  template: `
    <div class="container box">
      <h1>ทดสอบเพิ่มข้อมูลลงฐานข้อมูล</h1>

      <form (submit)="add($event, +year.value, +term.value)">
        <label>ปีการศึกษา <input #year type="number" value="2570" /></label>
        <label>เทอม
          <select #term>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="0">0 (รายปี)</option>
          </select>
        </label>
        <button class="btn primary" type="submit" [disabled]="saving()">
          {{ saving() ? 'กำลังบันทึก…' : 'เพิ่มเทอม' }}
        </button>
      </form>

      @if (message()) {
        <p class="msg" [class.err]="isError()">{{ message() }}</p>
      }

      <h2>เทอมในฐานข้อมูล ({{ terms().length }})</h2>
      <ul>
        @for (t of terms(); track t.id) {
          <li>ปีการศึกษา {{ t.academic_year }} เทอม {{ t.term === 0 ? 'รายปี' : t.term }}</li>
        }
      </ul>
    </div>
  `,
  styles: `
    .box { padding-top: 32px; padding-bottom: 64px; max-width: 640px; }
    form { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; margin-bottom: 16px; }
    label { display: flex; flex-direction: column; font-size: 14px; color: var(--ink-2); }
    input, select { font: inherit; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; width: 140px; }
    .msg { padding: 10px 14px; border-radius: 8px; background: #ecfdf5; color: #065f46; }
    .msg.err { background: #fef2f2; color: #991b1b; }
  `,
})
export class TermTest {
  private http = inject(HttpClient);

  terms = signal<Term[]>([]);
  saving = signal(false);
  message = signal('');
  isError = signal(false);

  constructor() {
    this.load();
  }

  // ดึงรายการเทอม (ใช้ terms.php ที่เขียนไว้ในบทที่ 2)
  load() {
    this.http.get<Term[]>('/api/terms.php').subscribe((data) => this.terms.set(data));
  }

  // ส่งข้อมูลไปให้ term-add.php บันทึก
  add(e: Event, year: number, term: number) {
    e.preventDefault(); // ไม่ให้ฟอร์มรีโหลดหน้า
    this.saving.set(true);
    this.http.post<{ ok: boolean; id: number }>('/api/term-add.php', {
      academic_year: year,
      term: term,
    }).subscribe({
      next: (res) => {
        this.show(`บันทึกแล้ว (id = ${res.id})`, false);
        this.load(); // ดึงรายการใหม่ จะเห็นเทอมที่เพิ่งเพิ่ม
      },
      error: (err) => this.show(err.error?.error ?? 'เชื่อมต่อ API ไม่ได้ (เปิด XAMPP และใช้ --proxy-config หรือยัง?)', true),
    });
  }

  private show(text: string, error: boolean) {
    this.message.set(text);
    this.isError.set(error);
    this.saving.set(false);
  }
}
