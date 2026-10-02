import { Component, ElementRef, afterRenderEffect, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book, termLabel } from '../../core/book.model';
import { BookService } from '../../core/book.service';
import { SectionView, buildView } from '../../core/search';
import { Hl } from '../../shared/hl/hl';

@Component({
  selector: 'app-book',
  imports: [RouterLink, Hl],
  templateUrl: './book.html',
  styleUrl: './book.scss',
  // กด Ctrl+F ที่ไหนก็ได้ในหน้านี้ จะมาที่ช่องค้นหาของเรา
  host: { '(window:keydown)': 'onWindowKey($event)' },
})
export class BookPage {
  // id มาจาก URL /book/:id (เปิดใช้ด้วย withComponentInputBinding ใน app.config.ts)
  id = input.required<string>();

  private service = inject(BookService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  book = signal<Book | null>(null);
  error = signal(false);

  query = signal(''); // คำค้น
  current = signal(0); // ตอนนี้อยู่ที่คำที่เจอลำดับไหน

  // ข้อมูลพร้อมแสดงผล คำนวณใหม่อัตโนมัติเมื่อ book หรือ query เปลี่ยน
  view = computed(() => {
    const b = this.book();
    return b ? buildView(b, this.query()) : null;
  });
  total = computed(() => this.view()?.total ?? 0);
  hasQuery = computed(() => this.query().trim().length > 0);
  label = computed(() => {
    const b = this.book();
    return b ? termLabel(b.term) : '';
  });

  constructor() {
    // โหลดเล่มใหม่ทุกครั้งที่ id เปลี่ยน
    effect((onCleanup) => {
      const id = Number(this.id());
      this.book.set(null);
      this.error.set(false);
      this.query.set('');
      const sub = this.service.getBook(id).subscribe({
        next: (b) => this.book.set(b),
        error: () => this.error.set(true),
      });
      onCleanup(() => sub.unsubscribe());
    });

    // หลังหน้าจอวาดเสร็จ เลื่อนไปที่คำที่เลือกอยู่
    afterRenderEffect(() => {
      const i = this.current();
      if (!this.hasQuery() || this.total() === 0) return;
      const el = this.host.nativeElement.querySelector(`mark[data-hit="${i}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  onQuery(value: string) {
    this.query.set(value);
    this.current.set(0);
  }

  next() {
    const t = this.total();
    if (t) this.current.update((i) => (i + 1) % t);
  }

  prev() {
    const t = this.total();
    if (t) this.current.update((i) => (i - 1 + t) % t);
  }

  clear() {
    this.onQuery('');
    this.searchBox()?.nativeElement.focus();
  }

  // คลิกสารบัญ: ถ้ากำลังค้นหาและหัวข้อนี้มีคำที่เจอ ให้ไปที่คำแรกของหัวข้อ ไม่อย่างนั้นไปที่หัวข้อ
  goSection(s: SectionView) {
    const sections = this.view()?.sections ?? [];
    if (this.hasQuery() && s.hits > 0) {
      let start = 0;
      for (const x of sections) {
        if (x.id === s.id) break;
        start += x.hits;
      }
      this.current.set(start);
    } else {
      document.getElementById('sec-' + s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onWindowKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      const box = this.searchBox()?.nativeElement;
      if (!box) return;
      e.preventDefault();
      box.focus();
      box.select();
    }
  }
}
