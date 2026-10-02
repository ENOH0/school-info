import { Component, computed, inject, input } from '@angular/core';
import { AuthService } from '../../core/auth.service';
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
  private auth = inject(AuthService);

  // ยังไม่เผยแพร่ = ปกจาง
  pending = computed(() => this.book().published === false || this.book().hasData === false);
  // คนที่ล็อกอินจะเห็นว่าเล่มไหนมีข้อมูลแล้วแต่รอเผยแพร่
  ribbon = computed(() =>
    this.auth.user() && this.book().hasData && this.book().published === false ? 'รอเผยแพร่' : 'กำลังรวบรวมข้อมูล',
  );
}
