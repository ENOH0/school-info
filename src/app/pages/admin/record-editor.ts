import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { AdminState } from '../../core/admin-state.service';
import { Column, ImageItem, RecordResponse, Row, periodLabel } from '../../core/admin.model';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../core/api-error';
import { formatNumber, hasTotal, rowSum, totalRow } from '../../core/table-calc';

// หน้ากรอกข้อมูลของหัวข้อ ในภาคเรียนที่เลือก   /admin/topics/5/data
// ตาราง: กรอกทีละช่อง หรือคัดลอกจาก Excel มาวาง | ความเรียง: พิมพ์ข้อความ
@Component({
  selector: 'app-record-editor',
  imports: [FormsModule, RouterLink],
  template: `
    <a class="back" routerLink="/admin">← กลับไปรายการหัวข้อ</a>

    @if (loadError()) {
      <p class="alert err">{{ loadError() }}</p>
    } @else if (!res()) {
      <p class="muted">กำลังโหลด…</p>
    } @else {
      @let t = res()!.topic;
      <div class="head">
        <div>
          <h1 class="page-title">{{ t.title }}</h1>
          <p class="muted">
            {{ period() }}
            @if (t.frequency === 'year') { · หัวข้อรายปี ใช้ร่วมกันทุกภาคเรียนของปีนี้ }
          </p>
        </div>
        <label class="field">เปลี่ยนภาคเรียน
          <select class="select" (change)="changeTerm(+$any($event.target).value)">
            @for (x of state.dataTerms(); track x.id) {
              <option [value]="x.id" [selected]="x.id === state.termId()">{{ label(x.academicYear, x.term) }}</option>
            }
          </select>
        </label>
      </div>

      @if (res()!.locked) {
        <p class="alert lockmsg">🔒 เล่มที่มีข้อมูลนี้<strong>เผยแพร่แล้ว</strong> แก้ไขไม่ได้ (ให้ผู้ดูแลระบบยกเลิกเผยแพร่ก่อน)</p>
      } @else if (!t.canEdit) {
        <p class="alert info">ดูได้อย่างเดียว แก้ไขได้เฉพาะหัวข้อของฝ่ายตัวเอง</p>
      }

      @if (t.canEdit && res()!.data?.copiedFrom) {
        <p class="alert copied">
          ⚠ ข้อมูลนี้<strong>คัดลอกมาจาก{{ res()!.data!.copiedFrom }}</strong> ยังไม่ได้ตรวจ
          แก้ให้เป็นข้อมูลปัจจุบันแล้วกด "บันทึก" (ถ้าข้อมูลเหมือนเดิมก็กดบันทึกได้เลย)
        </p>
      } @else if (t.canEdit && res()!.previous && !res()!.updatedAt) {
        <div class="alert prev">
          <span>ภาคเรียนนี้ยังไม่มีข้อมูล · มีข้อมูลครั้งก่อนของ<strong>{{ prevLabel() }}</strong></span>
          <button class="btn primary sm" (click)="pullPrevious()" [disabled]="pulling()">
            {{ pulling() ? 'กำลังดึง…' : 'ดึงข้อมูลครั้งก่อนมาแก้ต่อ' }}
          </button>
        </div>
      }

      @if (t.kind === 'text') {
        <div class="entry-tip">
          <strong>วิธีกรอก</strong>
          <span>พิมพ์เนื้อหาได้ตามปกติ · กด Enter เพื่อขึ้นย่อหน้าใหม่ · เสร็จแล้วกด “บันทึกข้อมูล” ด้านล่าง</span>
        </div>
        <textarea class="textarea big" name="text" [(ngModel)]="text" [disabled]="!t.canEdit"
          (ngModelChange)="dirty.set(true)" placeholder="พิมพ์ข้อความ ขึ้นบรรทัดใหม่ = ย่อหน้าใหม่"></textarea>
      } @else {
        <div class="entry-toolbar">
          <div class="toolbar-copy">
            <strong>ข้อมูลตาราง <span class="row-count">{{ rows().length }} แถว</span></strong>
            <span class="muted">กรอกทีละช่อง หรือวางข้อมูลหลายแถวจาก Excel/Google Sheets</span>
          </div>
          @if (t.canEdit) {
            <div class="row-gap toolbar-actions">
              <button class="btn primary sm" (click)="addRows(1)">+ เพิ่มแถวใหม่</button>
              <button class="btn ghost sm" (click)="addRows(5)">+ เพิ่ม 5 แถว</button>
              <button class="btn ghost sm" (click)="showPaste.set(!showPaste())">
                {{ showPaste() ? 'ปิดช่องวาง Excel' : 'วางข้อมูลจาก Excel' }}
              </button>
              @if (res()!.previous && res()!.updatedAt) {
                <button class="btn ghost sm" (click)="pullPrevious()" [disabled]="pulling()">ดึงข้อมูล{{ prevLabel() }}</button>
              }
            </div>
          }
        </div>

        @if (t.canEdit && showPaste()) {
          <div class="paste card">
            <p><strong>วางข้อมูลหลายแถว</strong></p>
            <p class="muted">
              คัดลอกจาก Excel หรือ Google Sheets โดยเรียงคอลัมน์: <strong>{{ colNames() }}</strong>
              (ไม่ต้องคัดลอกคอลัมน์ที่มีเครื่องหมาย Σ)
            </p>
            <textarea class="textarea" #pasteBox rows="5" placeholder="คลิกที่นี่ แล้วกด Ctrl+V"></textarea>
            <div class="row-gap paste-actions">
              <button class="btn primary sm" (click)="applyPaste(pasteBox.value, true)">แทนที่ข้อมูลเดิม</button>
              <button class="btn ghost sm" (click)="applyPaste(pasteBox.value, false)">เพิ่มต่อท้ายข้อมูลเดิม</button>
            </div>
          </div>
        }

        <div class="table-wrap">
          <table class="grid">
            <thead>
              <tr>
                <th class="no">#</th>
                @for (c of t.columns; track c.key) {
                  <th [class.numcol]="c.type !== 'text'" [title]="c.type === 'sum' ? 'คำนวณอัตโนมัติ ไม่ต้องกรอก' : ''">
                    {{ c.label }}@if (c.type === 'sum') { <span class="auto">Σ</span> }
                  </th>
                }
                @if (t.canEdit) { <th class="no"></th> }
              </tr>
            </thead>
            <tbody>
              @for (r of rows(); track $index; let i = $index) {
                <tr>
                  <td class="no row-index" data-label="แถวที่">{{ i + 1 }}</td>
                  @for (c of t.columns; track c.key) {
                    @if (c.type === 'sum') {
                      <td class="calc" [attr.data-label]="c.label">{{ fmt(sumOf(c, r)) }}</td>
                    } @else {
                    <td [attr.data-label]="c.label">
                      <input class="cell" [class.numcol]="c.type === 'number'" [name]="'r' + i + c.key"
                        [(ngModel)]="r[c.key]" (ngModelChange)="dirty.set(true)" [disabled]="!t.canEdit"
                        [attr.inputmode]="c.type === 'number' ? 'decimal' : null"
                        [attr.aria-label]="c.label + ' แถวที่ ' + (i + 1)" />
                    </td>
                    }
                  }
                  @if (t.canEdit) {
                    <td class="no row-actions" data-label="จัดการ"><button class="del" (click)="removeRow(i)" [attr.aria-label]="'ลบแถวที่ ' + (i + 1)" title="ลบแถวนี้">✕</button></td>
                  }
                </tr>
              }
            </tbody>
            @if (showTotal() && rows().length) {
              @let tot = totals();
              <tfoot>
                <tr>
                  <td class="no"></td>
                  @for (c of t.columns; track c.key) {
                    <td class="calc" [class.lbl]="c.type === 'text'" [attr.data-label]="c.label">{{ fmt(tot[c.key]) }}</td>
                  }
                  @if (t.canEdit) { <td class="no"></td> }
                </tr>
              </tfoot>
            }
          </table>
        </div>

        @if (t.canEdit) {
          <div class="row-gap tools bottom-tools">
            <button class="btn ghost sm" (click)="addRows(1)">+ เพิ่มแถวท้ายตาราง</button>
          </div>
        }
      }

      <!-- ===== รูปแนบ ===== -->
      <div class="images">
        <div class="images-head">
          <strong>รูปภาพประกอบ</strong>
          <span class="muted">({{ images().length }} รูป · คลิกที่รูปเพื่อดูขนาดเต็ม)</span>
          @if (t.canEdit) {
            <label class="btn ghost sm upload" [class.busy]="uploading() > 0">
              {{ uploading() > 0 ? 'กำลังอัปโหลด ' + uploading() + ' รูป…' : '+ เพิ่มรูป' }}
              <input type="file" accept="image/jpeg,image/png" multiple hidden
                (change)="addImages($any($event.target))" [disabled]="uploading() > 0" />
            </label>
          }
        </div>
        @if (images().length) {
          <div class="img-grid">
            @for (img of images(); track img.file; let i = $index; let first = $first; let last = $last) {
              <div class="img-card">
                <a [href]="'uploads/' + img.file" target="_blank" rel="noopener">
                  <img [src]="'uploads/' + img.file" [alt]="img.caption" loading="lazy" />
                </a>
                <input class="input cap" [name]="'cap' + i" [(ngModel)]="img.caption" (ngModelChange)="dirty.set(true)"
                  placeholder="คำบรรยายใต้รูป" maxlength="300" [disabled]="!t.canEdit" />
                @if (t.canEdit) {
                  <div class="img-tools">
                    <button class="del" (click)="moveImage(i, -1)" [disabled]="first" aria-label="เลื่อนไปก่อน">◀</button>
                    <button class="del" (click)="moveImage(i, 1)" [disabled]="last" aria-label="เลื่อนไปหลัง">▶</button>
                    <button class="del" (click)="removeImage(i)" aria-label="ลบรูป">✕</button>
                  </div>
                }
              </div>
            }
          </div>
        } @else if (t.canEdit) {
          <p class="muted">ยังไม่มีรูป กด "+ เพิ่มรูป" เพื่อแนบรูปประกอบหัวข้อนี้ (เลือกหลายรูปพร้อมกันได้)</p>
        }
      </div>

      @if (message()) {
        <p class="alert" [class.err]="isError()">{{ message() }}</p>
      }

      <div class="footer" [class.has-changes]="dirty()">
        <span class="muted">
          @if (res()!.updatedAt) {
            บันทึกล่าสุด {{ res()!.updatedAt }}{{ res()!.updatedByName ? ' โดย ' + res()!.updatedByName : '' }}
          } @else {
            ยังไม่มีข้อมูลในภาคเรียนนี้
          }
          @if (dirty()) { <strong class="unsaved"> · มีการแก้ไขที่ยังไม่บันทึก</strong> }
        </span>
        @if (t.canEdit) {
          <div class="row-gap">
            @if (confirmClear()) {
              <button class="btn danger sm" (click)="clear()">ยืนยันล้างข้อมูลภาคเรียนนี้</button>
              <button class="btn ghost sm" (click)="confirmClear.set(false)">ไม่ล้าง</button>
            } @else if (res()!.updatedAt) {
              <button class="btn danger sm" (click)="confirmClear.set(true)">ล้างข้อมูล</button>
            }
            <button class="btn primary save-btn" (click)="save()" [disabled]="busy()">{{ busy() ? 'กำลังบันทึก…' : 'บันทึกข้อมูล' }}</button>
          </div>
        }
      </div>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 8px; text-decoration: none; font-size: 14px; }
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .head p { margin: 0; }
    .big { width: 100%; min-height: 360px; }
    .entry-tip { display: flex; gap: 8px 14px; flex-wrap: wrap; margin-bottom: 10px; padding: 10px 12px; border-radius: var(--radius); background: var(--blue-50); color: var(--blue-900); font-size: 14px; }
    .entry-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; padding: 12px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--bg-soft); }
    .toolbar-copy { display: flex; flex-direction: column; gap: 2px; }
    .row-count { display: inline-block; margin-left: 5px; padding: 2px 8px; border-radius: 999px; background: var(--blue-100); color: var(--blue-800); font-size: 12px; }
    .toolbar-actions { justify-content: flex-end; }
    .table-wrap { max-width: 100%; overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); }
    .grid { border-collapse: collapse; width: 100%; font-size: 15px; }
    .grid th { position: sticky; top: 0; z-index: 2; background: var(--bg-soft); color: var(--blue-900); font-weight: 600; text-align: left; padding: 8px 10px; white-space: nowrap; }
    .grid td { border-top: 1px solid var(--line); padding: 0; }
    .grid .no { width: 40px; text-align: center; color: var(--ink-2); font-size: 13px; padding: 0 6px; }
    .grid th.numcol { text-align: right; }
    .cell { width: 100%; min-width: 110px; border: 0; padding: 9px 10px; font: inherit; background: transparent; }
    .cell.numcol { text-align: right; font-variant-numeric: tabular-nums; }
    .cell:focus { outline: 2px solid var(--blue-600); outline-offset: -2px; background: #fff; }
    .cell:disabled { color: var(--ink); }
    .grid td.calc { padding: 9px 10px; text-align: right; font-variant-numeric: tabular-nums; background: #f8fafc; color: var(--blue-900); font-weight: 600; white-space: nowrap; }
    .grid td.calc.lbl { text-align: left; }
    .grid tfoot td, .grid tfoot td.calc { border-top: 2px solid var(--blue-100); background: var(--blue-50); font-weight: 700; }
    .auto { font-size: 12px; color: var(--sky-500); margin-left: 2px; }
    .del { border: 0; background: none; color: var(--ink-2); cursor: pointer; width: 28px; height: 28px; border-radius: 50%; }
    .del:hover { background: #fef2f2; color: #b91c1c; }
    .tools { margin-top: 10px; }
    .bottom-tools { justify-content: flex-end; }
    .paste { margin: 0 0 10px; display: flex; flex-direction: column; gap: 8px; background: var(--bg-soft); }
    .paste p { margin: 0; }
    .paste-actions { justify-content: flex-end; }
    .alert { margin: 12px 0 0; }
    .alert.info { background: var(--blue-50); color: var(--blue-900); margin: 0 0 12px; }
    .footer { position: sticky; bottom: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; padding: 12px; background: rgb(255 255 255 / 0.96); border: 1px solid var(--line); border-radius: var(--radius) var(--radius) 0 0; backdrop-filter: blur(8px); }
    .footer.has-changes { border-color: #f59e0b; box-shadow: 0 -6px 22px rgb(15 23 42 / 0.08); }
    .save-btn { min-width: 130px; }
    .unsaved { color: #b45309; }
    .alert.copied { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; margin: 0 0 12px; }
    .alert.prev { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; background: var(--blue-50); color: var(--blue-900); margin: 0 0 12px; }
    .alert.lockmsg { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; margin: 0 0 12px; }
    .images { margin-top: 20px; padding: 14px; border: 1px solid var(--line); border-radius: var(--radius); }
    .images-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
    .upload { margin-left: auto; cursor: pointer; }
    .upload.busy { opacity: 0.6; cursor: progress; }
    .img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
    .img-card { display: flex; flex-direction: column; gap: 6px; }
    .img-card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; border: 1px solid var(--line); background: var(--bg-soft); }
    .cap { font-size: 14px; padding: 6px 10px; }
    .img-tools { display: flex; justify-content: center; gap: 4px; }
    .images p { margin: 0; }

    @media (max-width: 720px) {
      .head { align-items: stretch; }
      .head .field { width: 100%; }
      .head .select { width: 100%; }
      .entry-toolbar { align-items: stretch; }
      .toolbar-copy, .toolbar-actions { width: 100%; }
      .toolbar-actions .btn { flex: 1 1 140px; }
      .paste-actions .btn { flex: 1 1 100%; }

      // มือถือ: เปลี่ยนแต่ละแถวเป็นการ์ด มีชื่อคอลัมน์กำกับทุกช่อง
      .table-wrap { overflow: visible; border: 0; background: transparent; }
      .grid, .grid tbody, .grid tfoot { display: block; width: 100%; }
      .grid thead { display: none; }
      .grid tbody tr, .grid tfoot tr { display: block; margin-bottom: 12px; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius); background: #fff; }
      .grid tbody td, .grid tfoot td, .grid tfoot td.calc {
        display: grid;
        grid-template-columns: minmax(105px, 42%) minmax(0, 1fr);
        align-items: center;
        min-height: 44px;
        border-top: 1px solid var(--line);
        padding: 0;
        text-align: left;
        white-space: normal;
      }
      .grid tbody td:first-child, .grid tfoot td:first-child { border-top: 0; }
      .grid tbody td::before, .grid tfoot td::before {
        content: attr(data-label);
        align-self: stretch;
        display: flex;
        align-items: center;
        padding: 9px 10px;
        background: var(--bg-soft);
        color: var(--blue-900);
        font-size: 13px;
        font-weight: 600;
      }
      .grid .row-index { width: auto; color: var(--blue-900); font-weight: 700; text-align: left; }
      .grid .row-actions { width: auto; }
      .grid .row-actions .del { margin: 5px 8px; justify-self: end; }
      .grid td.calc { padding: 0; }
      .grid td.calc:not(.lbl) { text-align: right; }
      .grid td.calc::after { content: ''; }
      .grid td.calc { column-gap: 0; }
      .grid td.calc { padding-right: 10px; }
      .grid td.calc::before { margin-right: 10px; }
      .cell { min-width: 0; padding: 11px 10px; }
      .bottom-tools .btn { width: 100%; }
      .images { padding: 12px; }
      .upload { width: 100%; margin-left: 0; text-align: center; }
      .footer { align-items: stretch; }
      .footer > span, .footer > .row-gap { width: 100%; }
      .footer > .row-gap { justify-content: stretch; }
      .footer .btn { flex: 1 1 auto; }
      .footer .save-btn { min-width: 0; }
    }
  `,
})
export class RecordEditor {
  state = inject(AdminState);
  private api = inject(AdminApi);

  id = input.required<string>(); // จาก /admin/topics/:id/data

  res = signal<RecordResponse | null>(null);
  rows = signal<Row[]>([]);
  images = signal<ImageItem[]>([]);
  uploading = signal(0);
  text = '';
  loadError = signal('');
  message = signal('');
  isError = signal(false);
  busy = signal(false);
  dirty = signal(false);
  showPaste = signal(false);
  confirmClear = signal(false);
  pulling = signal(false);
  label = periodLabel;

  prevLabel = computed(() => {
    const p = this.res()?.previous;
    return p ? (p.term === 0 ? `ปีการศึกษา ${p.academicYear}` : `ภาคเรียนที่ ${p.term}/${p.academicYear}`) : '';
  });

  period = computed(() => {
    const r = this.res();
    return r ? periodLabel(r.academicYear, r.term) : '';
  });
  sumOf = rowSum;
  fmt = formatNumber;
  showTotal = computed(() => hasTotal(this.res()?.topic.columns ?? []));
  /** เรียกจาก template ทุกครั้งที่หน้าจอวาดใหม่ (ค่าในช่องเปลี่ยนผ่าน ngModel ไม่ใช่ signal) */
  totals() {
    return totalRow(this.res()!.topic.columns, this.rows());
  }
  colNames = computed(() => (this.res()?.topic.columns ?? []).filter((c) => c.type !== 'sum').map((c) => c.label).join(', '));

  constructor() {
    // โหลดใหม่เมื่อเปลี่ยนหัวข้อหรือภาคเรียน
    effect(() => {
      const id = Number(this.id());
      const term = this.state.term();
      if (term) untracked(() => this.load(id, term.academicYear, term.term));
    });
  }

  /** quiet = โหลดใหม่หลังบันทึก ไม่ล้างหน้าจอ */
  private load(id: number, year: number, term: number, quiet = false) {
    if (!quiet) {
      this.res.set(null);
      this.message.set('');
    }
    this.confirmClear.set(false);
    this.api.record(id, year, term).subscribe({
      next: (r) => {
        this.text = r.data?.text ?? '';
        this.images.set((r.data?.images ?? []).map((x) => ({ ...x })));
        const rows = (r.data?.rows ?? []).map((row) => this.blankRow(r.topic.columns, row));
        // ตารางว่าง: เตรียมแถวว่างให้ 3 แถว
        this.rows.set(rows.length || !r.topic.canEdit ? rows : [1, 2, 3].map(() => this.blankRow(r.topic.columns)));
        this.dirty.set(false);
        // เล่มเผยแพร่แล้ว = ดูได้อย่างเดียว
        this.res.set(r.locked ? { ...r, topic: { ...r.topic, canEdit: false } } : r);
      },
      error: (e) => this.loadError.set(apiError(e)),
    });
  }

  changeTerm(termId: number) {
    if (this.dirty() && !confirm('มีการแก้ไขที่ยังไม่บันทึก ต้องการเปลี่ยนภาคเรียนหรือไม่?')) {
      return;
    }
    this.state.termId.set(termId);
  }

  private blankRow(cols: Column[], from: Row = {}): Row {
    const row: Row = {};
    for (const c of cols) row[c.key] = from[c.key] ?? '';
    return row;
  }

  addRows(n: number) {
    const cols = this.res()!.topic.columns;
    this.rows.update((rows) => [...rows, ...Array.from({ length: n }, () => this.blankRow(cols))]);
    this.dirty.set(true);
  }

  removeRow(i: number) {
    const row = this.rows()[i];
    const hasData = Object.values(row).some((v) => v !== '' && v !== null);
    if (hasData && !confirm(`ลบแถวที่ ${i + 1}? ข้อมูลในแถวนี้จะถูกนำออกเมื่อกดบันทึก`)) return;
    this.rows.update((rows) => rows.filter((_, j) => j !== i));
    this.dirty.set(true);
  }

  /** แปลงข้อความที่คัดลอกจาก Excel (คั่นด้วย Tab) เป็นแถวของตาราง */
  applyPaste(raw: string, replace: boolean) {
    const cols = this.res()!.topic.columns;
    const editableCols = cols.filter((c) => c.type !== 'sum');
    const pasted = raw
      .replace(/\r/g, '')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const cells = line.split('\t');
        const row = this.blankRow(cols);
        editableCols.forEach((c, i) => (row[c.key] = (cells[i] ?? '').trim()));
        return row;
      });
    if (!pasted.length) return;
    // ตัดแถวว่างท้ายตารางเดิมออกก่อนต่อท้าย
    const keep = replace ? [] : this.rows().filter((r) => Object.values(r).some((v) => v !== '' && v !== null));
    this.rows.set([...keep, ...pasted]);
    this.showPaste.set(false);
    this.dirty.set(true);
    this.show(`วางข้อมูล ${pasted.length} แถวแล้ว ตรวจสอบแล้วกดบันทึก`, false);
  }

  save(clear = false) {
    const r = this.res()!;
    this.busy.set(true);
    this.message.set('');
    const images = clear ? [] : this.images().map((x) => ({ file: x.file, caption: x.caption.trim() }));
    const body =
      r.topic.kind === 'text'
        ? { text: clear ? '' : this.text, images }
        : { rows: clear ? [] : this.rows(), images };
    this.api
      .saveRecord({ topicId: r.topic.id, academicYear: r.academicYear, term: r.term, ...body })
      .subscribe({
        next: (out) => {
          this.busy.set(false);
          this.dirty.set(false);
          this.show(out.deleted ? 'ล้างข้อมูลแล้ว' : 'บันทึกแล้ว', false);
          const term = this.state.term()!;
          this.load(r.topic.id, term.academicYear, term.term, true); // โหลดใหม่ เวลาบันทึกล่าสุดจะอัปเดต
        },
        error: (e) => {
          this.busy.set(false);
          this.show(apiError(e), true);
        },
      });
  }

  /** ดึงข้อมูลครั้งก่อนมาใส่ในฟอร์ม (ยังไม่บันทึก จนกว่าจะกด "บันทึก") */
  async pullPrevious() {
    const r = this.res()!;
    const p = r.previous;
    if (!p) return;
    const hasContent =
      this.dirty() ||
      this.text.trim() !== '' ||
      this.images().length > 0 ||
      this.rows().some((row) => Object.values(row).some((v) => v !== '' && v !== null));
    if (hasContent && !confirm(`แทนที่ข้อมูลในหน้านี้ด้วยข้อมูลของ${this.prevLabel()}?`)) {
      return;
    }
    this.pulling.set(true);
    this.message.set('');
    try {
      const old = await firstValueFrom(this.api.record(r.topic.id, p.academicYear, p.term));
      const cols = r.topic.columns;
      this.text = old.data?.text ?? '';
      this.rows.set((old.data?.rows ?? []).map((row) => this.blankRow(cols, row)));
      if (!this.rows().length && r.topic.kind === 'table') this.addRows(3);
      this.images.set((old.data?.images ?? []).map((x) => ({ ...x })));
      this.dirty.set(true);
      this.show(`ดึงข้อมูลของ${this.prevLabel()}มาแล้ว แก้ให้เป็นข้อมูลปัจจุบันแล้วกด "บันทึก"`, false);
    } catch (e) {
      this.show(apiError(e), true);
    } finally {
      this.pulling.set(false);
    }
  }

  // ===== รูปแนบ =====

  /** เลือกรูปแล้วย่อในเบราว์เซอร์ก่อนส่ง (ด้านยาวไม่เกิน 1600px) จะได้อัปโหลดเร็วและไม่ติดขนาดไฟล์ของเซิร์ฟเวอร์ */
  async addImages(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    input.value = '';
    const r = this.res()!;
    const topicId = r.topic.id;
    this.message.set('');
    this.isError.set(false);
    for (const f of files) {
      this.uploading.update((n) => n + 1);
      try {
        const blob = await shrinkImage(f, 1600);
        const out = await firstValueFrom(this.api.uploadImage(topicId, r.academicYear, r.term, blob, f.name.replace(/\.\w+$/, '') + '.jpg'));
        this.images.update((list) => [...list, { file: out.file, caption: '' }]);
        this.dirty.set(true);
      } catch (e) {
        this.show(`อัปโหลด ${f.name} ไม่สำเร็จ: ${apiError(e)}`, true);
      } finally {
        this.uploading.update((n) => n - 1);
      }
    }
    if (files.length && !this.isError()) this.show('อัปโหลดรูปแล้ว ใส่คำบรรยายแล้วกด "บันทึก"', false);
  }

  removeImage(i: number) {
    this.images.update((list) => list.filter((_, j) => j !== i));
    this.dirty.set(true);
  }

  moveImage(i: number, d: number) {
    this.images.update((list) => {
      const next = [...list];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
    this.dirty.set(true);
  }

  clear() {
    this.confirmClear.set(false);
    this.save(true);
  }

  private show(text: string, error: boolean) {
    this.message.set(text);
    this.isError.set(error);
  }
}

/** ย่อรูปให้ด้านยาวไม่เกิน max px แล้วแปลงเป็น JPEG (พื้นหลังโปร่งใสจะกลายเป็นสีขาว) */
async function shrinkImage(file: File, max: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('อ่านไฟล์รูปไม่ได้'));
      el.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('แปลงรูปไม่สำเร็จ'))), 'image/jpeg', 0.85),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
