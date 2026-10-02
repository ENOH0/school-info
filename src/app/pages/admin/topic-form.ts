import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { AdminState } from '../../core/admin-state.service';
import { AuthService } from '../../core/auth.service';
import { CHAPTERS, Column, Frequency, TopicKind, chapterLabel } from '../../core/admin.model';
import { apiError } from '../../core/api-error';

// คอลัมน์สำเร็จรูป กดแล้วเติมให้ แก้ต่อได้
const PRESETS: { name: string; cols: [string, Column['type']][] }[] = [
  { name: 'แยกตามระดับชั้น', cols: [['ระดับชั้น', 'text'], ['ชาย', 'number'], ['หญิง', 'number'], ['รวม', 'number']] },
  { name: 'รายการ + จำนวน', cols: [['รายการ', 'text'], ['จำนวน', 'number']] },
  { name: 'รายการ + จำนวนเงิน', cols: [['รายการ', 'text'], ['จำนวนเงิน (บาท)', 'number']] },
  { name: 'ผลงาน/รางวัล', cols: [['ชื่อผลงาน/รางวัล', 'text'], ['ผู้ได้รับ', 'text'], ['ระดับ', 'text'], ['หน่วยงานที่มอบ', 'text']] },
];

// หน้าสร้าง/แก้ไขหัวข้อ
//   /admin/topics/new?dept=1   สร้างใหม่
//   /admin/topics/5/edit       แก้ไข
@Component({
  selector: 'app-topic-form',
  imports: [FormsModule, RouterLink],
  template: `
    <a class="back" routerLink="/admin">← กลับ</a>
    <h1 class="page-title">{{ isNew() ? 'เพิ่มหัวข้อ' : 'แก้ไขหัวข้อ' }}</h1>

    @if (loadError()) {
      <p class="alert err">{{ loadError() }}</p>
    } @else if (!loaded()) {
      <p class="muted">กำลังโหลด…</p>
    } @else {
      <form class="card form" (ngSubmit)="save()">
        <label class="field">ฝ่าย
          <select class="select" name="dept" [(ngModel)]="departmentId" [disabled]="!auth.isAdmin() || locked()">
            @for (d of state.departments(); track d.id) {
              <option [ngValue]="d.id">{{ d.name }}</option>
            }
          </select>
        </label>

        <label class="field">อยู่หมวดไหนของเล่ม
          <select class="select" name="chapter" [(ngModel)]="chapter">
            @for (c of chapters; track c.no) {
              <option [ngValue]="c.no">{{ chapterName(c.no) }}</option>
            }
          </select>
        </label>

        <label class="field">ชื่อหัวข้อ
          <input class="input" name="title" [(ngModel)]="title" maxlength="200" required
            placeholder="เช่น จำนวนนักเรียนแยกตามระดับชั้น" />
        </label>

        <fieldset [disabled]="locked()">
          <legend>รูปแบบข้อมูล</legend>
          <label class="choice"><input type="radio" name="kind" value="table" [(ngModel)]="kind" />
            <span><strong>ตาราง</strong> — ตัวเลขหรือรายการหลายแถว</span></label>
          <label class="choice"><input type="radio" name="kind" value="text" [(ngModel)]="kind" />
            <span><strong>ความเรียง</strong> — ข้อความหลายย่อหน้า</span></label>
        </fieldset>

        <fieldset [disabled]="locked()">
          <legend>กรอกบ่อยแค่ไหน</legend>
          <label class="choice"><input type="radio" name="freq" value="term" [(ngModel)]="frequency" />
            <span><strong>ทุกภาคเรียน</strong> — เช่น จำนวนนักเรียน ผลการเรียน</span></label>
          <label class="choice"><input type="radio" name="freq" value="year" [(ngModel)]="frequency" />
            <span><strong>ปีละครั้ง</strong> — เช่น งบประมาณ O-NET (แสดงในทุกเล่มของปีนั้น)</span></label>
        </fieldset>
        @if (locked()) {
          <p class="muted note">หัวข้อนี้มีข้อมูลแล้ว จึงเปลี่ยนฝ่าย รูปแบบ และความถี่ไม่ได้ (แก้ชื่อและคอลัมน์ได้)</p>
        }

        @if (kind === 'table') {
          <div class="cols">
            <div class="cols-head">
              <strong>คอลัมน์ของตาราง</strong>
              @if (isNew()) {
                <span class="presets">
                  ใช้แบบสำเร็จรูป:
                  @for (p of presets; track p.name) {
                    <button type="button" class="chip" (click)="usePreset(p.cols)">{{ p.name }}</button>
                  }
                </span>
              }
            </div>
            @for (c of columns(); track c.key; let i = $index; let first = $first; let last = $last) {
              <div class="col-row">
                <span class="num">{{ i + 1 }}</span>
                <input class="input grow" [name]="'label-' + c.key" [(ngModel)]="c.label" placeholder="ชื่อคอลัมน์" maxlength="100" />
                <select class="select" [name]="'type-' + c.key" [(ngModel)]="c.type">
                  <option value="text">ข้อความ</option>
                  <option value="number">ตัวเลข</option>
                </select>
                <button type="button" class="icon" (click)="moveCol(i, -1)" [disabled]="first" aria-label="เลื่อนซ้าย">▲</button>
                <button type="button" class="icon" (click)="moveCol(i, 1)" [disabled]="last" aria-label="เลื่อนขวา">▼</button>
                <button type="button" class="icon del" (click)="removeCol(i)" [disabled]="columns().length === 1" aria-label="ลบคอลัมน์">✕</button>
              </div>
            }
            <button type="button" class="btn ghost sm" (click)="addCol()" [disabled]="columns().length >= 20">+ เพิ่มคอลัมน์</button>
            @if (!isNew()) {
              <p class="muted note">ลบคอลัมน์แล้ว ข้อมูลในคอลัมน์นั้นจะไม่แสดงอีก เพิ่มคอลัมน์ใหม่ได้ ภาคเรียนเก่าจะว่างไว้</p>
            }
          </div>
        }

        @if (error()) {
          <p class="alert err">{{ error() }}</p>
        }

        <div class="buttons">
          <button class="btn primary" type="submit" [disabled]="busy()">{{ busy() ? 'กำลังบันทึก…' : 'บันทึกหัวข้อ' }}</button>
          <a class="btn ghost" routerLink="/admin">ยกเลิก</a>
          @if (!isNew() && recordCount() === 0) {
            @if (confirmDelete()) {
              <button type="button" class="btn danger" (click)="remove()" [disabled]="busy()">ยืนยันลบหัวข้อนี้</button>
              <button type="button" class="btn ghost" (click)="confirmDelete.set(false)">ไม่ลบ</button>
            } @else {
              <button type="button" class="btn danger right" (click)="confirmDelete.set(true)">ลบหัวข้อ</button>
            }
          }
        </div>
      </form>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 8px; text-decoration: none; font-size: 14px; }
    .form { max-width: 760px; display: flex; flex-direction: column; gap: 16px; margin-top: 12px; }
    fieldset { border: 0; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    legend { font-size: 14px; font-weight: 600; color: var(--ink-2); margin-bottom: 4px; }
    .choice { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; font-size: 15px; }
    .choice:has(input:checked) { border-color: var(--blue-600); background: var(--blue-50); }
    .choice input { margin-top: 6px; }
    fieldset:disabled .choice { cursor: default; opacity: 0.7; }
    .note { margin: -8px 0 0; font-size: 13px; }
    .cols { display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--bg-soft); border-radius: var(--radius); }
    .cols-head { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; align-items: center; }
    .presets { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; font-size: 13px; color: var(--ink-2); }
    .chip { font: inherit; font-size: 13px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--line); background: #fff; cursor: pointer; }
    .chip:hover { border-color: var(--blue-600); color: var(--blue-700); }
    .col-row { display: flex; gap: 6px; align-items: center; }
    .col-row .num { width: 20px; text-align: right; font-size: 13px; color: var(--ink-2); }
    .grow { flex: 1; }
    .icon { flex: none; width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--line); background: #fff; color: var(--ink-2); cursor: pointer; font-size: 11px; }
    .icon:disabled { opacity: 0.3; cursor: default; }
    .icon.del:hover:not(:disabled) { color: #b91c1c; border-color: #fecaca; }
    .cols .btn { align-self: flex-start; }
    .buttons { display: flex; gap: 8px; flex-wrap: wrap; }
    .right { margin-left: auto; }
    p.alert { margin: 0; }
  `,
})
export class TopicForm {
  auth = inject(AuthService);
  state = inject(AdminState);
  private api = inject(AdminApi);
  private router = inject(Router);

  id = input<string>(); // จาก /admin/topics/:id/edit
  dept = input<string>(); // จาก ?dept=

  presets = PRESETS;
  chapters = CHAPTERS;
  chapterName = chapterLabel;
  isNew = computed(() => !this.id());
  loaded = signal(false);
  loadError = signal('');
  busy = signal(false);
  error = signal('');
  confirmDelete = signal(false);
  recordCount = signal(0);
  locked = computed(() => this.recordCount() > 0);

  // ค่าในฟอร์ม
  departmentId = 0;
  chapter = 0;
  title = '';
  kind: TopicKind = 'table';
  frequency: Frequency = 'term';
  columns = signal<Column[]>([]);

  ngOnInit() {
    if (this.isNew()) {
      const u = this.auth.user();
      this.departmentId = u?.role === 'admin' ? Number(this.dept()) || this.state.deptId() || 1 : u?.departmentId ?? 0;
      this.columns.set([{ key: 'c1', label: '', type: 'text' }]);
      this.loaded.set(true);
      return;
    }
    this.api.topic(Number(this.id())).subscribe({
      next: (t) => {
        if (!t.canEdit) {
          this.loadError.set('แก้ไขได้เฉพาะหัวข้อของฝ่ายตัวเอง');
          return;
        }
        this.departmentId = t.departmentId;
        this.chapter = t.chapter;
        this.title = t.title;
        this.kind = t.kind;
        this.frequency = t.frequency;
        this.columns.set(t.columns.length ? t.columns.map((c) => ({ ...c })) : [{ key: 'c1', label: '', type: 'text' }]);
        this.recordCount.set(t.recordCount);
        this.loaded.set(true);
      },
      error: (e) => this.loadError.set(apiError(e)),
    });
  }

  /** รหัสคอลัมน์ใหม่ = เลขมากสุด + 1 (c1, c2, ...) รหัสเดิมไม่เปลี่ยน ข้อมูลเก่าจึงไม่หลุด */
  private nextKey(cols: Column[]) {
    const max = cols.reduce((m, c) => Math.max(m, Number(c.key.slice(1)) || 0), 0);
    return 'c' + (max + 1);
  }

  addCol() {
    this.columns.update((cols) => [...cols, { key: this.nextKey(cols), label: '', type: 'text' }]);
  }

  removeCol(i: number) {
    this.columns.update((cols) => cols.filter((_, j) => j !== i));
  }

  moveCol(i: number, d: number) {
    this.columns.update((cols) => {
      const next = [...cols];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  }

  usePreset(cols: [string, Column['type']][]) {
    this.columns.set(cols.map(([label, type], i) => ({ key: 'c' + (i + 1), label, type })));
  }

  save() {
    this.error.set('');
    if (!this.title.trim()) {
      this.error.set('กรุณากรอกชื่อหัวข้อ');
      return;
    }
    if (this.kind === 'table' && this.columns().some((c) => !c.label.trim())) {
      this.error.set('กรุณาตั้งชื่อทุกคอลัมน์');
      return;
    }
    this.busy.set(true);
    this.api
      .saveTopic({
        id: this.isNew() ? undefined : Number(this.id()),
        departmentId: this.departmentId,
        chapter: this.chapter,
        title: this.title.trim(),
        kind: this.kind,
        frequency: this.frequency,
        columns: this.kind === 'table' ? this.columns().map((c) => ({ ...c, label: c.label.trim() })) : [],
      })
      .subscribe({
        next: () => {
          this.state.deptId.set(this.departmentId);
          this.router.navigateByUrl('/admin');
        },
        error: (e) => {
          this.error.set(apiError(e));
          this.busy.set(false);
        },
      });
  }

  remove() {
    this.busy.set(true);
    this.api.deleteTopic(Number(this.id())).subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (e) => {
        this.error.set(apiError(e));
        this.busy.set(false);
      },
    });
  }
}
