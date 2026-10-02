import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { AdminState } from '../../core/admin-state.service';
import { apiError } from '../../core/api-error';

// กรอบของส่วนจัดการ: แถบเมนู + ชื่อผู้ใช้ + ปุ่มออกจากระบบ
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="bar">
      <div class="container bar-inner">
        <nav class="tabs">
          @if (auth.isAdmin()) {
            <a routerLink="/admin/overview" routerLinkActive="on">ภาพรวม</a>
          }
          <a routerLink="/admin" [class.on]="isDataPage()">{{ auth.isAdmin() ? 'ข้อมูลรายฝ่าย' : 'ข้อมูลของฝ่าย' }}</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin/terms" routerLinkActive="on">ปีการศึกษา</a>
            <a routerLink="/admin/users" routerLinkActive="on">ผู้ใช้</a>
          }
        </nav>
        <div class="me">
          <a class="acct" routerLink="/admin/account" title="บัญชีของฉัน / เปลี่ยนรหัสผ่าน">
            <strong>{{ auth.user()?.displayName }}</strong>
            <small>{{ auth.isAdmin() ? 'ผู้ดูแลระบบ' : myDept() }}</small>
          </a>
          <button class="btn ghost sm" (click)="logout()">ออกจากระบบ</button>
        </div>
      </div>
    </div>

    <div class="container page">
      @if (error()) {
        <p class="alert err">{{ error() }}</p>
      } @else if (state.ready()) {
        <router-outlet />
      } @else {
        <p class="muted">กำลังโหลด…</p>
      }
    </div>
  `,
  styles: `
    .bar { background: var(--bg-soft); border-bottom: 1px solid var(--line); }
    .bar-inner { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding-top: 8px; padding-bottom: 8px; }
    .tabs { display: flex; gap: 4px; flex-wrap: wrap; }
    .tabs a { padding: 8px 14px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px; color: var(--ink-2); }
    .tabs a:hover { background: #fff; color: var(--blue-700); }
    .tabs a.on { background: var(--blue-700); color: #fff; }
    .me { display: flex; align-items: center; gap: 12px; }
    .me .acct { display: flex; flex-direction: column; line-height: 1.3; text-align: right; font-size: 14px; color: var(--ink); text-decoration: none; padding: 4px 10px; border-radius: 8px; }
    .me .acct:hover { background: #fff; color: var(--blue-700); }
    .me small { color: var(--ink-2); }
    .page { padding-top: 24px; padding-bottom: 64px; }
  `,
})
export class AdminLayout {
  auth = inject(AuthService);
  state = inject(AdminState);
  private router = inject(Router);
  error = signal('');

  myDept = computed(() => {
    const id = this.auth.user()?.departmentId;
    return this.state.departments().find((d) => d.id === id)?.name ?? '';
  });

  constructor() {
    this.state.reload().catch((e) => this.error.set(apiError(e)));
  }

  // แท็บ "ข้อมูลรายฝ่าย" ติดสีตอนอยู่หน้า /admin และ /admin/topics/...
  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  isDataPage = computed(() => {
    const u = this.url();
    return u === '/admin' || u.startsWith('/admin?') || u.startsWith('/admin/topics');
  });

  async logout() {
    await this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
