import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** หน้าที่ต้องล็อกอินก่อน ถ้ายังไม่ล็อกอินจะพาไปหน้า /login */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.load();
  return auth.user() ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** หน้าเฉพาะผู้ดูแลระบบ */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.load();
  return auth.isAdmin() ? true : router.createUrlTree(['/admin']);
};
