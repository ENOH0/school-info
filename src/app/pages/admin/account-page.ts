import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../core/admin-api.service';
import { AuthService } from '../../core/auth.service';
import { apiError } from '../../core/api-error';

// บัญชีของฉัน: ดูข้อมูลบัญชี และเปลี่ยนรหัสผ่านเอง (ทุกบัญชี)
@Component({
  selector: 'app-account-page',
  imports: [FormsModule],
  template: `
    <h1 class="page-title">บัญชีของฉัน</h1>
    <p class="muted">
      {{ auth.user()?.displayName }} · ชื่อผู้ใช้ <strong>{{ auth.user()?.username }}</strong>
    </p>

    <form class="card form" (ngSubmit)="save()">
      <h2>เปลี่ยนรหัสผ่าน</h2>
      <label class="field">รหัสผ่านปัจจุบัน
        <input class="input" type="password" name="current" [(ngModel)]="current" autocomplete="current-password" />
      </label>
      <label class="field">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)
        <input class="input" type="password" name="next" [(ngModel)]="next" autocomplete="new-password" />
      </label>
      <label class="field">พิมพ์รหัสผ่านใหม่อีกครั้ง
        <input class="input" type="password" name="confirm" [(ngModel)]="confirm" autocomplete="new-password" />
      </label>

      @if (message()) {
        <p class="alert" [class.err]="isError()">{{ message() }}</p>
      }

      <button class="btn primary" type="submit" [disabled]="busy()">{{ busy() ? 'กำลังบันทึก…' : 'เปลี่ยนรหัสผ่าน' }}</button>
      <p class="muted hint">ลืมรหัสผ่าน? ให้ผู้ดูแลระบบตั้งรหัสใหม่ให้ที่แท็บ "ผู้ใช้"</p>
    </form>
  `,
  styles: `
    .form { max-width: 420px; display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }
    .form h2 { font-size: 18px; margin: 0; }
    .form .btn { align-self: flex-start; }
    .form p { margin: 0; }
    .hint { font-size: 13px; }
  `,
})
export class AccountPage {
  auth = inject(AuthService);
  private api = inject(AdminApi);

  current = '';
  next = '';
  confirm = '';
  busy = signal(false);
  message = signal('');
  isError = signal(false);

  save() {
    if (this.next.length < 8) return this.show('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัว', true);
    if (this.next !== this.confirm) return this.show('รหัสผ่านใหม่ทั้ง 2 ช่องไม่ตรงกัน', true);
    this.busy.set(true);
    this.api.changePassword(this.current, this.next).subscribe({
      next: () => {
        this.busy.set(false);
        this.current = this.next = this.confirm = '';
        this.show('เปลี่ยนรหัสผ่านแล้ว ครั้งต่อไปให้เข้าสู่ระบบด้วยรหัสผ่านใหม่', false);
      },
      error: (e) => {
        this.busy.set(false);
        this.show(apiError(e), true);
      },
    });
  }

  private show(text: string, error: boolean) {
    this.message.set(text);
    this.isError.set(error);
  }
}
