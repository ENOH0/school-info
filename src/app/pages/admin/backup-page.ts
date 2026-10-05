import { Component, computed, inject, signal } from '@angular/core';
import { AdminApi } from '../../core/admin-api.service';
import { apiError } from '../../core/api-error';
import { AdminState } from '../../core/admin-state.service';

@Component({
  selector: 'app-backup-page',
  template: `
    <div class="head">
      <div>
        <h1 class="page-title">สำรองและกู้คืนข้อมูล</h1>
        <p class="muted">สำหรับผู้ดูแลระบบเท่านั้น ไฟล์สำรองมีข้อมูลผู้ใช้ หัวข้อ และข้อมูลทุกปี</p>
      </div>
    </div>

    <div class="grid">
      <section class="card">
        <div class="icon">⬇</div>
        <div>
          <h2>ดาวน์โหลดไฟล์สำรอง</h2>
          <p>เลือกสำรองทั้งระบบ หรือเลือกเฉพาะปีการศึกษาที่ต้องการ</p>
          <label class="field">ขอบเขตข้อมูล
            <select #scopeBox class="select" [value]="backupYear()" (change)="backupYear.set(+scopeBox.value)">
              <option value="0">ทุกปีและทุกภาคเรียน</option>
              @for (year of years(); track year) {
                <option [value]="year">เฉพาะปีการศึกษา {{ year }}</option>
              }
            </select>
          </label>
          <a class="btn primary" [href]="backupUrl()">
            {{ backupYear() === 0 ? 'ดาวน์โหลดข้อมูลทั้งหมด' : 'ดาวน์โหลดปีการศึกษา ' + backupYear() }}
          </a>
          <p class="note">ไฟล์มีรหัสผ่านผู้ใช้ในรูปแบบเข้ารหัส ควรเก็บไว้ในที่ปลอดภัย</p>
        </div>
      </section>

      <section class="card danger-zone">
        <div class="icon">↺</div>
        <div>
          <h2>กู้คืนจากไฟล์สำรอง</h2>
          <p>ไฟล์ทั้งระบบจะแทนที่ข้อมูลทั้งหมด ส่วนไฟล์รายปีจะแทนที่เฉพาะปีนั้นโดยไม่กระทบปีอื่น ระบบสร้างสำเนาอัตโนมัติก่อนเริ่มทุกครั้ง</p>
          <label class="field">เลือกไฟล์ .json
            <input class="input" type="file" accept="application/json,.json" (change)="choose($event)" />
          </label>
          @if (file()) {
            <div class="chosen">เลือกแล้ว: {{ file()!.name }}</div>
          }
          @if (fileScope()) {
            <div class="scope" [class.all]="fileScope()!.type === 'all'">
              {{ fileScope()!.type === 'all' ? 'ไฟล์นี้จะกู้คืนทั้งระบบ' : 'ไฟล์นี้จะกู้คืนเฉพาะปีการศึกษา ' + fileScope()!.academicYear }}
            </div>
          }
          <label class="field">พิมพ์คำว่า RESTORE เพื่อยืนยัน
            <input #confirmBox class="input" [value]="confirm()" (input)="confirm.set(confirmBox.value)" autocomplete="off" />
          </label>
          <button class="btn danger" [disabled]="busy() || !file() || !fileScope() || confirm() !== 'RESTORE'" (click)="restore()">
            {{ busy() ? 'กำลังกู้คืน…' : 'กู้คืนและแทนที่ข้อมูลปัจจุบัน' }}
          </button>
        </div>
      </section>
    </div>

    @if (message()) { <p class="alert">{{ message() }}</p> }
    @if (error()) { <p class="alert err">{{ error() }}</p> }
  `,
  styles: `
    .head { margin-bottom: 18px; }
    .head p { margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 18px; margin-bottom: 18px; }
    .card { display: grid; grid-template-columns: 48px 1fr; gap: 14px; align-items: start; }
    .card h2 { margin: 0 0 6px; font-size: 19px; color: var(--blue-900); }
    .card p { margin: 0 0 14px; }
    .icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 14px; background: var(--blue-50); color: var(--blue-700); font-size: 24px; }
    .note { margin: 10px 0 0 !important; color: var(--ink-2); font-size: 13px; }
    .danger-zone { border-color: #fecaca; }
    .danger-zone .icon { background: #fef2f2; color: #b91c1c; }
    .field { margin: 12px 0; }
    .chosen { padding: 8px 10px; border-radius: 8px; background: #f8fafc; color: var(--ink-2); font-size: 14px; overflow-wrap: anywhere; }
    .scope { margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: #eff6ff; color: #1e40af; font-size: 14px; font-weight: 600; }
    .scope.all { background: #fff7ed; color: #9a3412; }
  `,
})
export class BackupPage {
  private api = inject(AdminApi);
  private state = inject(AdminState);
  years = computed(() => [...new Set(this.state.terms().map((t) => t.academicYear))].sort((a, b) => b - a));
  backupYear = signal(0);
  backupUrl = computed(() => this.backupYear() === 0 ? 'api/database-backup.php' : `api/database-backup.php?year=${this.backupYear()}`);
  file = signal<File | null>(null);
  fileScope = signal<{ type: 'all' | 'year'; academicYear?: number } | null>(null);
  confirm = signal('');
  busy = signal(false);
  message = signal('');
  error = signal('');

  choose(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.file.set(file);
    this.fileScope.set(null);
    this.message.set('');
    this.error.set('');
    if (file) {
      file.text().then((raw) => {
        try {
          const parsed = JSON.parse(raw);
          const scope = parsed?.scope?.type === 'year'
            ? { type: 'year' as const, academicYear: Number(parsed.scope.academicYear) }
            : { type: 'all' as const };
          this.fileScope.set(scope);
        } catch {
          this.error.set('อ่านรายละเอียดไฟล์ไม่ได้ กรุณาเลือกไฟล์สำรอง .json ที่สร้างจากระบบนี้');
        }
      });
    }
  }

  restore() {
    const file = this.file();
    if (!file || this.confirm() !== 'RESTORE') return;
    this.busy.set(true);
    this.message.set('');
    this.error.set('');
    this.api.restoreDatabase(file).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.confirm.set('');
        this.file.set(null);
        this.fileScope.set(null);
        const scope = result.scope.type === 'year' ? `ปีการศึกษา ${result.scope.academicYear}` : 'ทั้งระบบ';
        this.message.set(`กู้คืน${scope}สำเร็จ: ${result.counts['records']} รายการข้อมูล · ระบบเก็บสำเนาก่อนกู้คืนไว้เป็น ${result.automaticBackup}`);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(apiError(e));
      },
    });
  }
}
