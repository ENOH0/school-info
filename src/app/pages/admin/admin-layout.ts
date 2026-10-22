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
          <a routerLink="/admin/raw-documents" routerLinkActive="on">ข้อมูลดิบของฝ่าย</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin/terms" routerLinkActive="on">ปีการศึกษา</a>
            <a routerLink="/admin/users" routerLinkActive="on">ผู้ใช้</a>
            <a routerLink="/admin/backup" routerLinkActive="on">สำรองข้อมูล</a>
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
    .bar { position: relative; background: #fff; border-bottom: 1px solid #ccd7e3; box-shadow: 0 3px 12px rgb(18 52 90 / .045); }
    .bar::after { content: ''; position: absolute; left: 0; bottom: -1px; width: 90px; height: 2px; background: var(--gold-500); }
    .bar-inner { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding-top: 9px; padding-bottom: 9px; }
    .tabs { display: flex; gap: 3px; flex-wrap: wrap; }
    .tabs a { position: relative; padding: 8px 13px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; color: var(--ink-2); }
    .tabs a:hover { background: var(--blue-50); color: var(--blue-900); }
    .tabs a.on { background: var(--blue-900); color: #fff; box-shadow: 0 2px 6px rgb(18 52 90 / .16); }
    .me { display: flex; align-items: center; gap: 12px; }
    .me .acct { display: flex; flex-direction: column; line-height: 1.3; text-align: right; font-size: 14px; color: var(--ink); text-decoration: none; padding: 4px 10px; border-right: 2px solid var(--gold-500); border-radius: 4px 0 0 4px; }
    .me .acct:hover { background: var(--blue-50); color: var(--blue-900); }
    .me small { color: var(--ink-2); }
    .page { padding-top: 30px; padding-bottom: 72px; }
    @media (max-width: 760px) {
      .bar-inner { align-items: stretch; }
      .tabs { width: 100%; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 3px; }
      .tabs a { white-space: nowrap; }
      .me { width: 100%; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 8px; }
      .me .acct { text-align: left; border-right: 0; border-left: 2px solid var(--gold-500); border-radius: 0 4px 4px 0; }
      .page { padding-top: 22px; }
    }
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
