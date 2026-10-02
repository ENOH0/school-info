import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../core/admin-api.service';
import { AdminState } from '../../core/admin-state.service';
import { periodLabel } from '../../core/admin.model';
import { apiError } from '../../core/api-error';

// จัดการปีการศึกษา/ภาคเรียน (เฉพาะผู้ดูแลระบบ)
@Component({
  selector: 'app-terms-page',
  imports: [FormsModule],
  template: `
    <h1 class="page-title">ปีการศึกษาและภาคเรียน</h1>
    <p class="muted">เพิ่มภาคเรียนใหม่ก่อนเปิดให้ฝ่ายต่าง ๆ กรอกข้อมูล ภาคเรียน "ปัจจุบัน" จะถูกเลือกไว้ให้อัตโนมัติ</p>

    <form class="card add row-gap" (ngSubmit)="add()">
      <label class="field">ปีการศึกษา
        <input class="input" type="number" name="year" [(ngModel)]="year" min="2500" max="2700" />
      </label>
      <label class="field">ภาคเรียน
        <select class="select" name="term" [(ngModel)]="term">
          <option [ngValue]="1">1</option>
          <option [ngValue]="2">2</option>
        </select>
      </label>
      <button class="btn primary" type="submit" [disabled]="busy()">+ เพิ่มภาคเรียน</button>
    </form>

    @if (message()) {
      <p class="alert" [class.err]="isError()">{{ message() }}</p>
    }

    <ul class="list">
      @for (t of terms(); track t.id) {
        <li class="item">
          <span>{{ label(t.academicYear, t.term) }}</span>
          @if (t.isCurrent) {
            <span class="badge">ภาคเรียนปัจจุบัน</span>
          } @else {
            <button class="btn ghost sm" (click)="setCurrent(t.id)" [disabled]="busy()">ตั้งเป็นปัจจุบัน</button>
          }
        </li>
      } @empty {
        <li class="item muted">ยังไม่มีภาคเรียน</li>
      }
    </ul>
  `,
  styles: `
    .add { margin: 16px 0; max-width: 560px; }
    .add .input { width: 140px; }
    .list { list-style: none; padding: 0; margin: 16px 0 0; max-width: 560px; }
    .item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--line); }
    p.alert { max-width: 560px; }
  `,
})
export class TermsPage {
  state = inject(AdminState);
  private api = inject(AdminApi);

  terms = computed(() => this.state.selectableTerms());
  label = periodLabel;
  busy = signal(false);
  message = signal('');
  isError = signal(false);

  year = new Date().getFullYear() + 543;
  term = 1;

  add() {
    this.run(this.api.addTerm(Number(this.year), this.term), `เพิ่มภาคเรียน ${this.term}/${this.year} แล้ว`);
  }

  setCurrent(id: number) {
    this.run(this.api.setCurrentTerm(id), 'ตั้งภาคเรียนปัจจุบันแล้ว');
  }

  private run(req: ReturnType<AdminApi['addTerm']>, okText: string) {
    this.busy.set(true);
    this.message.set('');
    req.subscribe({
      next: async () => {
        await this.state.reload();
        this.busy.set(false);
        this.message.set(okText);
        this.isError.set(false);
      },
      error: (e) => {
        this.busy.set(false);
        this.message.set(apiError(e));
        this.isError.set(true);
      },
    });
  }
}
