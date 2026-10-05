import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { AdminState } from '../../core/admin-state.service';
import { AuthService } from '../../core/auth.service';
import { Topic, chapterLabel, periodLabel } from '../../core/admin.model';
import { apiError } from '../../core/api-error';

// หน้าแรกของส่วนจัดการ: เลือกภาคเรียน + ฝ่าย แล้วดูว่าหัวข้อไหนกรอกแล้ว/ยังไม่กรอก
@Component({
  selector: 'app-topics-page',
  imports: [RouterLink],
  template: `
    <div class="head">
      <div>
        @if (auth.isAdmin()) {
          <h1 class="page-title">ข้อมูลรายฝ่าย</h1>
          <p class="muted">เลือกภาคเรียนและฝ่าย แล้วกรอกข้อมูลในแต่ละหัวข้อ</p>
        } @else {
          <h1 class="page-title">{{ state.dept()?.name }}</h1>
          <p class="muted">เลือกภาคเรียน แล้วกรอกข้อมูลในแต่ละหัวข้อของฝ่าย</p>
        }
      </div>
      <div class="row-gap">
        <label class="field">ภาคเรียน
          <select class="select" (change)="state.termId.set(+$any($event.target).value)">
            @for (t of state.dataTerms(); track t.id) {
              <option [value]="t.id" [selected]="t.id === state.termId()">
                {{ label(t.academicYear, t.term) }}{{ t.isCurrent ? ' (ปัจจุบัน)' : '' }}
              </option>
            }
          </select>
        </label>
        @if (auth.isAdmin()) {
        <label class="field">ฝ่าย
          <select class="select" (change)="state.deptId.set(+$any($event.target).value)">
            @for (d of state.departments(); track d.id) {
              <option [value]="d.id" [selected]="d.id === state.deptId()">
                {{ d.name }}
              </option>
            }
          </select>
        </label>
        }
      </div>
    </div>

    @if (!state.term()) {
      <p class="alert err">
        ยังไม่มีภาคเรียนในระบบ
        @if (auth.isAdmin()) { <a routerLink="/admin/terms">เพิ่มภาคเรียน</a> } @else { กรุณาติดต่อผู้ดูแลระบบ }
      </p>
    } @else {
      @if (state.term()!.isPublished) {
        <p class="alert lock">
          🔒 เล่มภาคเรียนนี้<strong>เผยแพร่แล้ว</strong> ข้อมูลถูกล็อก แก้ไขไม่ได้
          {{ auth.isAdmin() ? '(ยกเลิกเผยแพร่ได้ที่แท็บ "ปีการศึกษา")' : '(ถ้าต้องแก้ ติดต่อผู้ดูแลระบบให้ยกเลิกเผยแพร่)' }}
        </p>
      }
      <div class="summary">
        <div>
          <strong>{{ state.dept()?.name }}</strong>
          <span class="muted"> · {{ label(state.term()!.academicYear, state.term()!.term) }}</span>
          @if (topics().length) {
            <div class="progress" [attr.aria-label]="'กรอกแล้ว ' + filled() + ' จาก ' + topics().length">
              <div class="progress-bar" [style.width.%]="(filled() / topics().length) * 100"></div>
            </div>
            <span class="muted">กรอกแล้ว {{ filled() }} / {{ topics().length }} หัวข้อ</span>
          }
        </div>
        @if (canEdit()) {
          <div class="row-gap">
            @if (emptyCount() > 0 && !loading()) {
              <button class="btn ghost" (click)="confirmCopy.set(true)" [disabled]="busy() || confirmCopy()">⧉ คัดลอกจากครั้งก่อน</button>
            }
            <a class="btn primary" routerLink="/admin/topics/new" [queryParams]="{ dept: state.deptId() }">+ เพิ่มหัวข้อ</a>
          </div>
        } @else {
          <span class="muted">ดูได้อย่างเดียว (แก้ไขได้เฉพาะฝ่ายของตัวเอง)</span>
        }
      </div>

      @if (confirmCopy()) {
        <div class="copybox">
          <p>
            คัดลอกข้อมูล<strong>ครั้งล่าสุดก่อนหน้านี้</strong>มาใส่หัวข้อที่ยังว่าง {{ emptyCount() }} หัวข้อ
            (รายภาคเรียนจะเอาจากภาคเรียนก่อน · รายปีจะเอาจากปีการศึกษาก่อน)
          </p>
          <p class="muted small">หัวข้อที่กรอกแล้วจะไม่ถูกแทนที่ · หลังคัดลอกต้องเปิดแต่ละหัวข้อเพื่อแก้ตัวเลขให้เป็นปัจจุบันแล้วกด "บันทึก"</p>
          <div class="row-gap">
            <button class="btn primary sm" (click)="copyPrevious()" [disabled]="busy()">{{ busy() ? 'กำลังคัดลอก…' : 'ยืนยันคัดลอก' }}</button>
            <button class="btn ghost sm" (click)="confirmCopy.set(false)" [disabled]="busy()">ยกเลิก</button>
          </div>
        </div>
      }

      @if (notice()) {
        <p class="alert ok">{{ notice() }}</p>
      }
      @if (uncheckedCount() > 0) {
        <p class="alert warn">
          ⚠ มี {{ uncheckedCount() }} หัวข้อที่<strong>คัดลอกมาจากครั้งก่อน ยังไม่ได้ตรวจ</strong>
          เปิดหัวข้อที่มีป้ายสีส้ม แก้ข้อมูลให้เป็นปัจจุบัน แล้วกด "บันทึก" ป้ายจะหายไป
        </p>
      }

      @if (error()) {
        <p class="alert err">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="muted">กำลังโหลด…</p>
      } @else {
        <ul class="list">
          @for (t of topics(); track t.id; let first = $first; let last = $last) {
            <li class="item">
              <span class="dot" [class.done]="t.hasData && !t.copiedFrom" [class.copied]="!!t.copiedFrom" aria-hidden="true">{{ t.copiedFrom ? '!' : t.hasData ? '✓' : '' }}</span>
              <div class="info">
                <a class="title" [routerLink]="['/admin/topics', t.id, 'data']">{{ t.title }}</a>
                <div class="meta">
                  <span class="badge chap">{{ chapterName(t.chapter) }}</span>
                  <span class="badge">{{ t.kind === 'table' ? 'ตาราง' : 'ความเรียง' }}</span>
                  <span class="badge">{{ t.frequency === 'year' ? 'รายปี' : 'รายภาคเรียน' }}</span>
                  @if (t.copiedFrom) {
                    <span class="badge copied">คัดลอกจาก{{ t.copiedFrom }} · ยังไม่ตรวจ</span>
                  } @else if (t.hasData) {
                    <span class="muted">แก้ไขล่าสุด {{ t.updatedAt }}{{ t.updatedByName ? ' โดย ' + t.updatedByName : '' }}</span>
                  } @else {
                    <span class="muted">ยังไม่กรอก</span>
                  }
                </div>
              </div>
              <div class="actions">
                @if (t.locked) {
                  <span class="lockbadge" title="เล่มที่มีข้อมูลนี้เผยแพร่แล้ว">🔒 ล็อก</span>
                }
                @if (t.canEdit && !t.structureLocked) {
                  <button class="icon" (click)="move(t, 'up')" [disabled]="first || busy()" aria-label="เลื่อนขึ้น">▲</button>
                  <button class="icon" (click)="move(t, 'down')" [disabled]="last || busy()" aria-label="เลื่อนลง">▼</button>
                  <a class="btn ghost sm" [routerLink]="['/admin/topics', t.id, 'edit']">แก้หัวข้อ</a>
                }
                <a class="btn primary sm" [routerLink]="['/admin/topics', t.id, 'data']">
                  {{ t.canEdit && !t.locked ? 'กรอกข้อมูล' : 'ดูข้อมูล' }}
                </a>
              </div>
            </li>
          } @empty {
            <li class="empty">
              ฝ่ายนี้ยังไม่มีหัวข้อ
              @if (canEdit()) { กด "+ เพิ่มหัวข้อ" เพื่อเริ่ม เช่น "จำนวนนักเรียนแยกตามระดับชั้น" }
            </li>
          }
        </ul>
      }
    }
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .head p { margin: 0; }
    .summary { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 14px 18px; background: var(--bg-soft); border-radius: var(--radius); margin-bottom: 16px; }
    .progress { width: 220px; height: 6px; border-radius: 999px; background: var(--blue-100); margin: 6px 0 2px; overflow: hidden; }
    .progress-bar { height: 100%; background: var(--sky-500); transition: width 0.3s; }
    .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius); background: #fff; }
    .item:hover { border-color: var(--blue-100); box-shadow: var(--shadow-sm); }
    .dot { flex: none; width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--line); display: grid; place-items: center; font-size: 14px; color: #fff; }
    .dot.done { background: #10b981; border-color: #10b981; }
    .dot.copied { background: #f59e0b; border-color: #f59e0b; font-weight: 700; }
    .badge.copied { background: #fef3c7; color: #92400e; }
    .copybox { padding: 14px 18px; border: 1px solid var(--blue-100); background: var(--blue-50); border-radius: var(--radius); margin-bottom: 16px; }
    .copybox p { margin: 0 0 8px; }
    .small { font-size: 13px; }
    .alert.ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .alert.warn { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .info { flex: 1; min-width: 0; }
    .title { font-weight: 600; color: var(--ink); text-decoration: none; }
    .title:hover { color: var(--blue-700); }
    .meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 4px; }
    .meta .muted { font-size: 13px; }
    .badge.chap { background: var(--blue-700); color: #fff; }
    .alert.lock { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .lockbadge { font-size: 12px; font-weight: 600; color: #92400e; background: #fffbeb; border-radius: 999px; padding: 2px 8px; }
    .actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .icon { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--line); background: #fff; color: var(--ink-2); cursor: pointer; font-size: 11px; }
    .icon:disabled { opacity: 0.3; cursor: default; }
    .empty { padding: 32px; text-align: center; color: var(--ink-2); border: 1.5px dashed var(--line); border-radius: var(--radius); }
    .alert { margin: 0 0 16px; }
    @media (max-width: 640px) { .item { flex-wrap: wrap; } .actions { width: 100%; } }
  `,
})
export class TopicsPage {
  state = inject(AdminState);
  auth = inject(AuthService);
  private api = inject(AdminApi);

  topics = signal<Topic[]>([]);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  notice = signal('');
  confirmCopy = signal(false);

  filled = computed(() => this.topics().filter((t) => t.hasData).length);
  emptyCount = computed(() => this.topics().filter((t) => !t.hasData && !t.locked).length);
  uncheckedCount = computed(() => this.topics().filter((t) => t.copiedFrom).length);
  canEdit = computed(() => {
    const u = this.auth.user();
    return !!u && (u.role === 'admin' || u.departmentId === this.state.deptId());
  });
  label = periodLabel;
  chapterName = chapterLabel;

  constructor() {
    // โหลดรายการใหม่ทุกครั้งที่เปลี่ยนฝ่ายหรือภาคเรียน
    effect(() => {
      const dept = this.state.deptId();
      const term = this.state.term();
      this.notice.set('');
      this.confirmCopy.set(false);
      if (dept && term) this.load(dept, term.academicYear, term.term);
    });
  }

  private load(dept: number, year: number, term: number) {
    this.loading.set(true);
    this.error.set('');
    this.api.topics(dept, year, term).subscribe({
      next: (list) => {
        this.topics.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiError(e));
        this.loading.set(false);
      },
    });
  }

  copyPrevious() {
    const term = this.state.term()!;
    const dept = this.state.deptId()!;
    this.busy.set(true);
    this.error.set('');
    this.api.copyPrevious(dept, term.academicYear, term.term).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.confirmCopy.set(false);
        const extra = r.noPrevious ? ` · ${r.noPrevious} หัวข้อไม่มีข้อมูลครั้งก่อน ต้องกรอกเอง` : '';
        this.notice.set(r.copied ? `คัดลอกแล้ว ${r.copied} หัวข้อ${extra}` : `ไม่มีข้อมูลครั้งก่อนให้คัดลอก${extra}`);
        this.load(dept, term.academicYear, term.term);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(apiError(e));
      },
    });
  }

  move(t: Topic, direction: 'up' | 'down') {
    this.busy.set(true);
    this.api.moveTopic(t.id, direction).subscribe({
      next: () => {
        this.busy.set(false);
        const term = this.state.term()!;
        this.load(this.state.deptId()!, term.academicYear, term.term);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(apiError(e));
      },
    });
  }
}
