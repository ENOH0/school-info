import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminApi } from './admin-api.service';
import { AuthService } from './auth.service';
import { Department, Term } from './admin.model';

// ฝ่ายและภาคเรียนที่เลือกอยู่ จำไว้ระหว่างเปลี่ยนหน้าในส่วนจัดการ
@Injectable({ providedIn: 'root' })
export class AdminState {
  private api = inject(AdminApi);
  private auth = inject(AuthService);

  departments = signal<Department[]>([]);
  terms = signal<Term[]>([]);
  deptId = signal<number | null>(null);
  termId = signal<number | null>(null);
  ready = signal(false);

  /** ภาคเรียนที่เลือกกรอกได้ (ไม่รวมแถวรายปี term = 0) */
  selectableTerms = computed(() => this.terms().filter((t) => t.term > 0));
  /**
   * ช่วงข้อมูลที่แสดงในหน้ากรอกข้อมูล:
   * - ภาคเรียน 1–2 ตามปกติ
   * - แถวรายปี เฉพาะปีเก่าที่ไม่มีภาคเรียนแยก (เช่น 2566–2568)
   */
  dataTerms = computed(() => {
    const terms = this.terms();
    const yearsWithSemester = new Set(terms.filter((t) => t.term > 0).map((t) => t.academicYear));
    return terms.filter((t) => t.term > 0 || !yearsWithSemester.has(t.academicYear));
  });
  term = computed(() => this.terms().find((t) => t.id === this.termId()) ?? null);
  dept = computed(() => this.departments().find((d) => d.id === this.deptId()) ?? null);

  async reload() {
    const m = await firstValueFrom(this.api.meta());
    this.departments.set(m.departments);
    this.terms.set(m.terms);

    // ฝ่าย: ผู้ใช้ประจำฝ่ายเห็นเฉพาะฝ่ายตัวเองเสมอ / แอดมินเริ่มที่ฝ่ายแรก
    const u = this.auth.user();
    if (u && u.role !== 'admin') {
      this.deptId.set(u.departmentId);
    } else if (!m.departments.some((d) => d.id === this.deptId())) {
      const mine = this.auth.user()?.departmentId;
      this.deptId.set(mine ?? m.departments[0]?.id ?? null);
    }
    // ภาคเรียน: ครั้งแรกเลือกภาคเรียนปัจจุบัน ไม่มีก็เลือกล่าสุด
    const sel = this.selectableTerms();
    if (!this.dataTerms().some((t) => t.id === this.termId())) {
      this.termId.set((sel.find((t) => t.isCurrent) ?? sel[0] ?? this.dataTerms()[0])?.id ?? null);
    }
    this.ready.set(true);
  }
}
