import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { BookService } from '../../core/book.service';
import { AuthService } from '../../core/auth.service';
import { BookCover } from '../../shared/book-cover/book-cover';
import { SITE } from '../../site.config';

@Component({
  selector: 'app-home',
  imports: [BookCover],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  site = SITE;

  constructor() {
    inject(AuthService).load(); // ถ้าล็อกอินอยู่ ปกที่รอเผยแพร่จะบอกสถานะให้
  }
  loadError = signal(false);
  private books = toSignal(
    inject(BookService)
      .getBooks()
      .pipe(
        catchError(() => {
          this.loadError.set(true);
          return of([]);
        }),
      ),
    { initialValue: null },
  );

  loading = computed(() => this.books() === null);

  // ปีการศึกษาทั้งหมด เรียงจากใหม่ไปเก่า
  years = computed(() => {
    const ys = (this.books() ?? []).map((b) => b.academicYear);
    return [...new Set(ys)].sort((a, b) => b - a);
  });

  // ปีที่เลือกในแถบกรอง (null = ทั้งหมด)
  selectedYear = signal<number | null>(null);

  // เล่มที่แสดง เรียงปีใหม่ไปเก่าในกริดเดียว
  visibleBooks = computed(() => {
    const all = this.books() ?? [];
    const sel = this.selectedYear();
    return all
      .filter((b) => sel === null || b.academicYear === sel)
      .sort((a, b) => b.academicYear - a.academicYear);
  });

  latestYear = computed(() => this.years()[0] ?? '-');
  bookCount = computed(() => this.books()?.length ?? 0);
}
