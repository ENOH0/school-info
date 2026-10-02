import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { BookService } from '../../core/book.service';
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

  // จัดกลุ่มเล่มตามปี
  groups = computed(() => {
    const all = this.books() ?? [];
    const sel = this.selectedYear();
    return this.years()
      .filter((y) => sel === null || y === sel)
      .map((y) => ({
        year: y,
        books: all.filter((b) => b.academicYear === y).sort((a, b) => b.term - a.term),
      }));
  });

  latestYear = computed(() => this.years()[0] ?? '-');
  bookCount = computed(() => this.books()?.length ?? 0);
}
