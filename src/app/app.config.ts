import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(), // ส่งค่าใน URL (เช่น :id) เข้า input() ของหน้าอัตโนมัติ
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }), // เปลี่ยนหน้าแล้วเลื่อนขึ้นบนสุด
    ),
    provideHttpClient(),
  ],
};
