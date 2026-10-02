import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookSummary, termLabel } from '../../core/book.model';
import { SITE } from '../../site.config';

// ปกเล่ม: ถ้ามีรูปปกจะใช้รูป ถ้าไม่มีจะวาดปกให้อัตโนมัติ
@Component({
  selector: 'app-book-cover',
  imports: [RouterLink],
  templateUrl: './book-cover.html',
  styleUrl: './book-cover.scss',
})
export class BookCover {
  book = input.required<BookSummary>();
  label = computed(() => termLabel(this.book().term));
  site = SITE;
}
