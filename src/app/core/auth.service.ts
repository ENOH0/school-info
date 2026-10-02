import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from './admin.model';

interface MeResponse {
  user: User | null;
  needsSetup: boolean;
}

// เก็บว่าใครล็อกอินอยู่ ใช้ร่วมกันทุกหน้า
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private loading: Promise<void> | null = null;

  user = signal<User | null>(null);
  needsSetup = signal(false);
  isAdmin = computed(() => this.user()?.role === 'admin');

  /** ถามเซิร์ฟเวอร์ว่าล็อกอินอยู่ไหม (ถามครั้งเดียว ใช้ซ้ำ) */
  load(force = false): Promise<void> {
    if (!this.loading || force) {
      this.loading = firstValueFrom(this.http.get<MeResponse>('api/auth-me.php'))
        .then((r) => {
          this.user.set(r.user);
          this.needsSetup.set(r.needsSetup);
        })
        .catch(() => this.user.set(null));
    }
    return this.loading;
  }

  async login(username: string, password: string) {
    const r = await firstValueFrom(this.http.post<{ user: User }>('api/auth-login.php', { username, password }));
    this.user.set(r.user);
  }

  async setup(username: string, password: string, displayName: string) {
    const r = await firstValueFrom(
      this.http.post<{ user: User }>('api/setup.php', { username, password, displayName }),
    );
    this.user.set(r.user);
    this.needsSetup.set(false);
  }

  async logout() {
    await firstValueFrom(this.http.post('api/auth-logout.php', {})).catch(() => null);
    this.user.set(null);
  }
}
