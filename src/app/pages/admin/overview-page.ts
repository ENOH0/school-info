import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { AdminState } from '../../core/admin-state.service';
import { DeptProgress, ProgressResponse, periodLabel } from '../../core/admin.model';
import { apiError } from '../../core/api-error';

// ภาพรวมความคืบหน้า: ภาคเรียนนี้แต่ละฝ่ายกรอกไปกี่หัวข้อ (เฉพาะผู้ดูแลระบบ)
@Component({
  selector: 'app-overview-page',
  imports: [RouterLink],
  template: `
    <div class="head">
      <div>
        <h1 class="page-title">ภาพรวมการกรอกข้อมูล</h1>
        <p class="muted">ดูว่าแต่ละฝ่ายกรอกข้อมูลของภาคเรียนนี้ไปแล้วกี่หัวข้อ จะได้รู้ว่าต้องตามฝ่ายไหน</p>
      </div>
      <label class="field">ภาคเรียน
        <select class="select" (change)="state.termId.set(+$any($event.target).value)">
          @for (t of state.selectableTerms(); track t.id) {
            <option [value]="t.id" [selected]="t.id === state.termId()">
              {{ label(t.academicYear, t.term) }}{{ t.isCurrent ? ' (ปัจจุบัน)' : '' }}{{ t.isPublished ? ' · เผยแพร่แล้ว' : '' }}
            </option>
          }
        </select>
      </label>
    </div>

    @if (error()) {
      <p class="alert err">{{ error() }}</p>
    } @else if (!data()) {
      <p class="muted">กำลังโหลด…</p>
    } @else {
      <div class="total card">
        <div class="ring" [style.--p]="percent(totalFilled(), totalTopics())">
          <span>{{ percent(totalFilled(), totalTopics()) }}%</span>
        </div>
        <div>
          <div class="total-title">{{ label(data()!.academicYear, data()!.term) }}</div>
          <div class="muted">กรอกแล้ว {{ totalFilled() }} จาก {{ totalTopics() }} หัวข้อ · ครบแล้ว {{ doneDepts() }} จาก {{ data()!.departments.length }} ฝ่าย</div>
          @if (data()!.published) {
            <span class="badge pub">🔒 เผยแพร่แล้ว</span>
          } @else if (totalTopics() > 0 && totalFilled() === totalTopics()) {
            <span class="badge ready">ครบทุกฝ่ายแล้ว พร้อมเผยแพร่</span>
            <a class="go" routerLink="/admin/terms">ไปหน้าเผยแพร่ →</a>
          }
        </div>
      </div>

      <div class="grid">
        @for (d of data()!.departments; track d.id) {
          <div class="card dept" [class.done]="d.total > 0 && d.filled === d.total">
            <div class="dept-head">
              <strong>{{ d.name }}</strong>
              <span class="count">{{ d.filled }}/{{ d.total }}</span>
            </div>
            <div class="bar"><div class="bar-fill" [style.width.%]="percent(d.filled, d.total)"></div></div>
            <div class="muted small">
              @if (d.total === 0) {
                ยังไม่มีหัวข้อ
              } @else if (d.filled === d.total) {
                ✓ กรอกครบแล้ว
              } @else {
                เหลือ {{ d.total - d.filled }} หัวข้อ
              }
              @if (d.lastUpdatedAt) {
                · แก้ไขล่าสุด {{ d.lastUpdatedAt }}{{ d.lastUpdatedBy ? ' โดย ' + d.lastUpdatedBy : '' }}
              }
            </div>

            @if (d.missing.length) {
              <details>
                <summary>หัวข้อที่ยังไม่กรอก ({{ d.missing.length }})</summary>
                <ul>
                  @for (m of d.missing; track m.id) {
                    <li>
                      <a [routerLink]="['/admin/topics', m.id, 'data']">{{ m.title }}</a>
                      <span class="muted small"> · {{ m.chapter }}{{ m.frequency === 'year' ? ' · รายปี' : '' }}</span>
                    </li>
                  }
                </ul>
              </details>
            }
            @if (d.unchecked.length) {
              <details class="unchecked">
                <summary>⚠ คัดลอกมา ยังไม่ตรวจ ({{ d.unchecked.length }})</summary>
                <ul>
                  @for (m of d.unchecked; track m.id) {
                    <li>
                      <a [routerLink]="['/admin/topics', m.id, 'data']">{{ m.title }}</a>
                      <span class="muted small"> · จาก{{ m.copiedFrom }}</span>
                    </li>
                  }
                </ul>
              </details>
            }
            <button class="btn ghost sm" (click)="openDept(d)">ดูหัวข้อของฝ่ายนี้</button>
          </div>
        }
      </div>
    }
  `,
  styles: `
    .unchecked summary { color: #b45309; }
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .head p { margin: 0; }
    .total { display: flex; gap: 20px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
    .ring { --p: 0; width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; flex: none;
      background: conic-gradient(var(--sky-500) calc(var(--p) * 1%), var(--blue-100) 0); }
    .ring span { width: 64px; height: 64px; border-radius: 50%; background: #fff; display: grid; place-items: center; font-weight: 700; color: var(--blue-900); }
    .total-title { font-size: 18px; font-weight: 700; color: var(--blue-900); }
    .badge.pub { background: #fffbeb; color: #92400e; margin-top: 6px; }
    .badge.ready { background: #ecfdf5; color: #065f46; margin-top: 6px; }
    .go { margin-left: 8px; font-size: 14px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .dept { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
    .dept.done { border-color: #a7f3d0; background: #f7fefb; }
    .dept-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .count { font-size: 20px; font-weight: 700; color: var(--blue-800); font-variant-numeric: tabular-nums; }
    .bar { height: 8px; border-radius: 999px; background: var(--blue-100); overflow: hidden; }
    .bar-fill { height: 100%; background: var(--sky-500); transition: width 0.4s; }
    .dept.done .bar-fill { background: #10b981; }
    .small { font-size: 13px; }
    details { font-size: 14px; }
    summary { cursor: pointer; color: var(--blue-700); font-weight: 600; }
    details ul { margin: 6px 0 0; padding-left: 18px; }
    details li { margin: 2px 0; }
    .dept .btn { align-self: flex-start; margin-top: auto; }
  `,
})
export class OverviewPage {
  state = inject(AdminState);
  private api = inject(AdminApi);
  private router = inject(Router);

  data = signal<ProgressResponse | null>(null);
  error = signal('');
  label = periodLabel;

  totalTopics = computed(() => (this.data()?.departments ?? []).reduce((s, d) => s + d.total, 0));
  totalFilled = computed(() => (this.data()?.departments ?? []).reduce((s, d) => s + d.filled, 0));
  doneDepts = computed(() => (this.data()?.departments ?? []).filter((d) => d.total > 0 && d.filled === d.total).length);

  constructor() {
    effect(() => {
      const t = this.state.term();
      if (t) untracked(() => this.load(t.academicYear, t.term));
    });
  }

  private load(year: number, term: number) {
    this.data.set(null);
    this.error.set('');
    this.api.progress(year, term).subscribe({
      next: (r) => this.data.set(r),
      error: (e) => this.error.set(apiError(e)),
    });
  }

  percent(a: number, b: number) {
    return b ? Math.round((a / b) * 100) : 0;
  }

  openDept(d: DeptProgress) {
    this.state.deptId.set(d.id);
    this.router.navigateByUrl('/admin');
  }
}
