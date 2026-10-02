import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiError } from '../../core/api-error';

// หน้าเข้าสู่ระบบ
// ถ้ายังไม่มีผู้ใช้ในระบบเลย จะเปลี่ยนเป็นหน้าสร้างผู้ดูแลระบบคนแรกให้อัตโนมัติ
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="wrap">
      <form class="card box" (ngSubmit)="submit()">
        @if (!ready()) {
          <p class="muted">กำลังโหลด…</p>
        } @else {
          @if (auth.needsSetup()) {
            <h1 class="page-title">ตั้งค่าครั้งแรก</h1>
            <p class="muted">ยังไม่มีผู้ใช้ในระบบ สร้างบัญชีผู้ดูแลระบบคนแรกได้เลย</p>
            <label class="field">ชื่อที่แสดง
              <input class="input" name="displayName" [(ngModel)]="displayName" placeholder="เช่น งานสารสนเทศ" />
            </label>
          } @else {
            <h1 class="page-title">เข้าสู่ระบบ</h1>
            <p class="muted">สำหรับครูและเจ้าหน้าที่ที่กรอกข้อมูลสารสนเทศ</p>
          }

          <label class="field">ชื่อผู้ใช้
            <input class="input" name="username" [(ngModel)]="username" autocomplete="username" required />
          </label>
          <label class="field">รหัสผ่าน
            <input class="input" type="password" name="password" [(ngModel)]="password"
              [attr.autocomplete]="auth.needsSetup() ? 'new-password' : 'current-password'" required />
          </label>
          @if (auth.needsSetup()) {
            <p class="muted hint">ชื่อผู้ใช้เป็นภาษาอังกฤษหรือตัวเลข รหัสผ่านอย่างน้อย 8 ตัว</p>
          }

          @if (error()) {
            <p class="alert err">{{ error() }}</p>
          }

          <button class="btn primary" type="submit" [disabled]="busy()">
            {{ busy() ? 'กำลังดำเนินการ…' : auth.needsSetup() ? 'สร้างบัญชีและเข้าสู่ระบบ' : 'เข้าสู่ระบบ' }}
          </button>
        }
      </form>
    </div>
  `,
  styles: `
    .wrap { min-height: calc(100vh - 160px); display: grid; place-items: center; padding: 32px 16px; background: var(--bg-soft); }
    .box { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow-md); }
    .box .btn { justify-content: center; margin-top: 4px; }
    .hint { margin: -6px 0 0; font-size: 13px; }
    p { margin: 0; }
  `,
})
export class Login {
  auth = inject(AuthService);
  private router = inject(Router);

  returnUrl = input<string>(); // มาจาก ?returnUrl=

  ready = signal(false);
  busy = signal(false);
  error = signal('');
  username = '';
  password = '';
  displayName = '';

  constructor() {
    this.auth.load(true).then(() => {
      if (this.auth.user()) this.go();
      this.ready.set(true);
    });
  }

  async submit() {
    this.error.set('');
    this.busy.set(true);
    try {
      if (this.auth.needsSetup()) {
        await this.auth.setup(this.username.trim(), this.password, this.displayName.trim());
      } else {
        await this.auth.login(this.username.trim(), this.password);
      }
      this.go();
    } catch (e) {
      this.error.set(apiError(e));
    } finally {
      this.busy.set(false);
    }
  }

  private go() {
    const url = this.returnUrl();
    // รับเฉพาะลิงก์ภายในเว็บ กันการพาไปเว็บอื่น
    this.router.navigateByUrl(url && url.startsWith('/') && !url.startsWith('//') ? url : '/admin');
  }
}
