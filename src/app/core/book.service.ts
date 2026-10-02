import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, BookSummary } from './book.model';

// ตัวกลางดึงข้อมูลเล่ม ทุกหน้าเรียกผ่านที่นี่
// ข้อมูลมาจากฐานข้อมูลผ่าน PHP (ตอนพัฒนาต้องรัน ng serve --proxy-config proxy.conf.json)
@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);

  getBooks() {
    return this.http.get<BookSummary[]>('api/books.php');
  }

  getBook(id: number) {
    return this.http.get<Book>('api/book.php', { params: { id } });
  }
}
