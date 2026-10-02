import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../core/admin-api.service';
import { AdminState } from '../../core/admin-state.service';
import { AuthService } from '../../core/auth.service';
import { UserRow } from '../../core/admin.model';
import { apiError } from '../../core/api-error';

interface UserForm {
  id?: number;
  username: string;
  displayName: string;
  role: 'admin' | 'editor';
  departmentId: number | null;
  isActive: boolean;
  password: string;
}

const EMPTY: UserForm = { username: '', displayName: '', role: 'editor', departmentId: null, isActive: true, password: '' };

// จัดการผู้ใช้ (เฉพาะผู้ดูแลระบบ): สร้างบัญชีให้แต่ละฝ่าย รีเซ็ตรหัสผ่าน ปิดบัญชี
@Component({
  selector: 'app-users-page',
  imports: [FormsModule],
  template: `
    <div class="head">
      <div>
        <h1 class="page-title">ผู้ใช้</h1>
        <p class="muted">ผู้ใช้ประจำฝ่ายแก้ไขได้เฉพาะฝ่ายของตัวเอง ดูข้อมูลฝ่ายอื่นได้</p>
      </div>
      @if (!form()) {
        <button class="btn primary" (click)="edit()">+ เพิ่มผู้ใช้</button>
      }
    </div>

    @if (form(); as f) {
      <form class="card form" (ngSubmit)="save()">
        <h2>{{ f.id ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้' }}</h2>
        <div class="grid">
          <label class="field">ชื่อผู้ใช้ (ภาษาอังกฤษ)
            <input class="input" name="username" [(ngModel)]="f.username" autocomplete="off" />
          </label>
          <label class="field">ชื่อที่แสดง
            <input class="input" name="displayName" [(ngModel)]="f.displayName" placeholder="เช่น ครูสมศรี (วิชาการ)" />
          </label>
          <label class="field">สิทธิ์
            <select class="select" name="role" [(ngModel)]="f.role">
              <option value="editor">ผู้ใช้ประจำฝ่าย</option>
              <option value="admin">ผู้ดูแลระบบ (แก้ได้ทุกฝ่าย)</option>
            </select>
          </label>
          @if (f.role === 'editor') {
            <label class="field">ฝ่าย
              <select class="select" name="dept" [(ngModel)]="f.departmentId">
                <option [ngValue]="null" disabled>เลือกฝ่าย</option>
                @for (d of state.departments(); track d.id) {
                  <option [ngValue]="d.id">{{ d.name }}</option>
                }
              </select>
            </label>
          }
          <label class="field">{{ f.id ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน (อย่างน้อย 8 ตัว)' }}
            <input class="input" type="password" name="password" [(ngModel)]="f.password" autocomplete="new-password" />
          </label>
          <label class="check">
            <input type="checkbox" name="active" [(ngModel)]="f.isActive" /> เปิดใช้งาน
          </label>
        </div>
        @if (error()) {
          <p class="alert err">{{ error() }}</p>
        }
        <div class="row-gap">
          <button class="btn primary" type="submit" [disabled]="busy()">บันทึก</button>
          <button class="btn ghost" type="button" (click)="form.set(null)">ยกเลิก</button>
        </div>
      </form>
    }

    @if (message()) {
      <p class="alert">{{ message() }}</p>
    }

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>ชื่อที่แสดง</th><th>ชื่อผู้ใช้</th><th>สิทธิ์ / ฝ่าย</th><th>เข้าระบบล่าสุด</th><th></th></tr>
        </thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr [class.off]="!u.isActive">
              <td>{{ u.displayName }}{{ u.id === auth.user()?.id ? ' (คุณ)' : '' }}</td>
              <td>{{ u.username }}</td>
              <td>{{ u.role === 'admin' ? 'ผู้ดูแลระบบ' : deptName(u.departmentId) }}{{ u.isActive ? '' : ' · ปิดใช้งาน' }}</td>
              <td class="muted">{{ u.lastLoginAt ?? '-' }}</td>
              <td><button class="btn ghost sm" (click)="edit(u)">แก้ไข</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .head p { margin: 0; }
    .form { margin-bottom: 20px; display: flex; flex-direction: column; gap: 14px; }
    .form h2 { font-size: 18px; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .check { display: flex; gap: 8px; align-items: center; font-size: 15px; align-self: end; padding-bottom: 8px; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); }
    tr.off td { color: var(--ink-2); }
    p.alert { margin: 0 0 16px; }
    .form p.alert { margin: 0; }
  `,
})
export class UsersPage {
  auth = inject(AuthService);
  state = inject(AdminState);
  private api = inject(AdminApi);

  users = signal<UserRow[]>([]);
  form = signal<UserForm | null>(null);
  busy = signal(false);
  error = signal('');
  message = signal('');

  deptName = (id: number | null) => this.state.departments().find((d) => d.id === id)?.name ?? '-';

  constructor() {
    this.load();
  }

  private load() {
    this.api.users().subscribe({
      next: (u) => this.users.set(u),
      error: (e) => this.message.set(apiError(e)),
    });
  }

  edit(u?: UserRow) {
    this.error.set('');
    this.message.set('');
    this.form.set(u ? { ...u, password: '' } : { ...EMPTY });
  }

  save() {
    const f = this.form()!;
    this.busy.set(true);
    this.error.set('');
    this.api
      .saveUser({
        id: f.id,
        username: f.username.trim(),
        displayName: f.displayName.trim(),
        role: f.role,
        departmentId: f.role === 'editor' ? f.departmentId : null,
        isActive: f.isActive,
        password: f.password || undefined,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.form.set(null);
          this.message.set(`บันทึกผู้ใช้ ${f.username} แล้ว`);
          this.load();
        },
        error: (e) => {
          this.busy.set(false);
          this.error.set(apiError(e));
        },
      });
  }
}
