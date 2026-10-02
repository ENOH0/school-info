import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../core/admin-api.service';
import { AdminState } from '../../core/admin-state.service';
import { Column, ImageItem, RecordResponse, Row, periodLabel } from '../../core/admin.model';
import { firstValueFrom } from 'rxjs';
import { apiError } from '../../core/api-error';

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
            @for (x of state.selectableTerms(); track x.id) {
              <option [value]="x.id" [selected]="x.id === state.termId()">{{ label(x.academicYear, x.term) }}</option>
            }
          </select>
        </label>
      </div>

      @if (!t.canEdit) {
        <p class="alert info">ดูได้อย่างเดียว แก้ไขได้เฉพาะหัวข้อของฝ่ายตัวเอง</p>
      }

      @if (t.kind === 'text') {
        <textarea class="textarea big" name="text" [(ngModel)]="text" [disabled]="!t.canEdit"
          (ngModelChange)="dirty.set(true)" placeholder="พิมพ์ข้อความ ขึ้นบรรทัดใหม่ = ย่อหน้าใหม่"></textarea>
      } @else {
        <div class="table-wrap">
          <table class="grid">
            <thead>
              <tr>
                <th class="no">#</th>
                @for (c of t.columns; track c.key) {
                  <th [class.numcol]="c.type === 'number'">{{ c.label }}</th>
                }
                @if (t.canEdit) { <th class="no"></th> }
              </tr>
            </thead>
            <tbody>
              @for (r of rows(); track $index; let i = $index) {
                <tr>
                  <td class="no">{{ i + 1 }}</td>
                  @for (c of t.columns; track c.key) {
                    <td>
                      <input class="cell" [class.numcol]="c.type === 'number'" [name]="'r' + i + c.key"
                        [(ngModel)]="r[c.key]" (ngModelChange)="dirty.set(true)" [disabled]="!t.canEdit"
                        [attr.inputmode]="c.type === 'number' ? 'decimal' : null"
                        [attr.aria-label]="c.label + ' แถวที่ ' + (i + 1)" />
                    </td>
                  }
                  @if (t.canEdit) {
                    <td class="no"><button class="del" (click)="removeRow(i)" aria-label="ลบแถว">✕</button></td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (t.canEdit) {
          <div class="row-gap tools">
            <button class="btn ghost sm" (click)="addRows(1)">+ เพิ่มแถว</button>
            <button class="btn ghost sm" (click)="addRows(5)">+ 5 แถว</button>
            <button class="btn ghost sm" (click)="showPaste.set(!showPaste())">วางข้อมูลจาก Excel</button>
          </div>
          @if (showPaste()) {
            <div class="paste card">
              <p class="muted">
                คัดลอกช่องจาก Excel หรือ Google Sheets (เรียงคอลัมน์ให้ตรงกับตาราง: {{ colNames() }}) แล้ววางในช่องนี้
              </p>
              <textarea class="textarea" #pasteBox rows="5"></textarea>
              <div class="row-gap">
                <button class="btn primary sm" (click)="applyPaste(pasteBox.value, true)">แทนที่ข้อมูลทั้งหมด</button>
                <button class="btn ghost sm" (click)="applyPaste(pasteBox.value, false)">ต่อท้ายข้อมูลเดิม</button>
              </div>
            </div>
          }
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

      <div class="footer">
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
            <button class="btn primary" (click)="save()" [disabled]="busy()">{{ busy() ? 'กำลังบันทึก…' : 'บันทึก' }}</button>
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
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); }
    .grid { border-collapse: collapse; width: 100%; font-size: 15px; }
    .grid th { background: var(--bg-soft); color: var(--blue-900); font-weight: 600; text-align: left; padding: 8px 10px; white-space: nowrap; }
    .grid td { border-top: 1px solid var(--line); padding: 0; }
    .grid .no { width: 40px; text-align: center; color: var(--ink-2); font-size: 13px; padding: 0 6px; }
    .grid th.numcol { text-align: right; }
    .cell { width: 100%; min-width: 110px; border: 0; padding: 9px 10px; font: inherit; background: transparent; }
    .cell.numcol { text-align: right; font-variant-numeric: tabular-nums; }
    .cell:focus { outline: 2px solid var(--blue-600); outline-offset: -2px; background: #fff; }
    .cell:disabled { color: var(--ink); }
    .del { border: 0; background: none; color: var(--ink-2); cursor: pointer; width: 28px; height: 28px; border-radius: 50%; }
    .del:hover { background: #fef2f2; color: #b91c1c; }
    .tools { margin-top: 10px; }
    .paste { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; background: var(--bg-soft); }
    .paste p { margin: 0; }
    .alert { margin: 12px 0 0; }
    .alert.info { background: var(--blue-50); color: var(--blue-900); margin: 0 0 12px; }
    .footer { position: sticky; bottom: 0; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; padding: 12px 0; background: rgb(255 255 255 / 0.95); border-top: 1px solid var(--line); }
    .unsaved { color: #b45309; }
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
  label = periodLabel;

  period = computed(() => {
    const r = this.res();
    return r ? periodLabel(r.academicYear, r.term) : '';
  });
  colNames = computed(() => (this.res()?.topic.columns ?? []).map((c) => c.label).join(', '));

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
        this.res.set(r);
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
  }

  removeRow(i: number) {
    this.rows.update((rows) => rows.filter((_, j) => j !== i));
    this.dirty.set(true);
  }

  /** แปลงข้อความที่คัดลอกจาก Excel (คั่นด้วย Tab) เป็นแถวของตาราง */
  applyPaste(raw: string, replace: boolean) {
    const cols = this.res()!.topic.columns;
    const pasted = raw
      .replace(/\r/g, '')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const cells = line.split('\t');
        const row: Row = {};
        cols.forEach((c, i) => (row[c.key] = (cells[i] ?? '').trim()));
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

  // ===== รูปแนบ =====

  /** เลือกรูปแล้วย่อในเบราว์เซอร์ก่อนส่ง (ด้านยาวไม่เกิน 1600px) จะได้อัปโหลดเร็วและไม่ติดขนาดไฟล์ของเซิร์ฟเวอร์ */
  async addImages(input: HTMLInputElement) {
    const files = Array.from(input.files ?? []);
    input.value = '';
    const topicId = this.res()!.topic.id;
    this.message.set('');
    this.isError.set(false);
    for (const f of files) {
      this.uploading.update((n) => n + 1);
      try {
        const blob = await shrinkImage(f, 1600);
        const out = await firstValueFrom(this.api.uploadImage(topicId, blob, f.name.replace(/\.\w+$/, '') + '.jpg'));
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
