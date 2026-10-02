import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SITE } from './site.config';

// โครงหลักของทุกหน้า: แถบบน + เนื้อหา (router-outlet) + ท้ายเว็บ
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  site = SITE;
  year = new Date().getFullYear() + 543; // ปี พ.ศ.
}
