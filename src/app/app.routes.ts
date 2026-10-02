import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth.guard';

// เส้นทางของเว็บ
//   /                       หน้าแรก (ชั้นวางเล่ม) — สาธารณะ
//   /book/2                 หน้าเล่ม — สาธารณะ
//   /login                  เข้าสู่ระบบ (ครั้งแรกจะเป็นหน้าสร้างผู้ดูแลระบบ)
//   /admin                  ส่วนจัดการ — ต้องล็อกอิน
const page = (title: string) => `${title} · ระบบสารสนเทศโรงเรียน`;

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home), title: 'ระบบสารสนเทศโรงเรียน' },
  { path: 'book/:id', loadComponent: () => import('./pages/book/book').then((m) => m.BookPage), title: page('เล่มสารสนเทศ') },
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login), title: page('เข้าสู่ระบบ') },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', loadComponent: () => import('./pages/admin/topics-page').then((m) => m.TopicsPage), title: page('ข้อมูลรายฝ่าย') },
      { path: 'topics/new', loadComponent: () => import('./pages/admin/topic-form').then((m) => m.TopicForm), title: page('เพิ่มหัวข้อ') },
      { path: 'topics/:id/edit', loadComponent: () => import('./pages/admin/topic-form').then((m) => m.TopicForm), title: page('แก้ไขหัวข้อ') },
      { path: 'topics/:id/data', loadComponent: () => import('./pages/admin/record-editor').then((m) => m.RecordEditor), title: page('กรอกข้อมูล') },
      { path: 'terms', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/terms-page').then((m) => m.TermsPage), title: page('ปีการศึกษา') },
      { path: 'users', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/users-page').then((m) => m.UsersPage), title: page('ผู้ใช้') },
    ],
  },
  { path: '**', redirectTo: '' },
];
