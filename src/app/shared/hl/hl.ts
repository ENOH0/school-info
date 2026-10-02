import { Component, input } from '@angular/core';
import { Seg } from '../../core/search';

// แสดงข้อความพร้อมไฮไลต์คำที่ค้นเจอ
// ใช้: <app-hl [segs]="..." [current]="..." />
// (เขียน template ติดกันบรรทัดเดียว เพื่อไม่ให้มีช่องว่างแทรกในข้อความภาษาไทย)
@Component({
  selector: 'app-hl',
  template: `@for (s of segs(); track $index) {@if (s.i < 0) {<ng-container>{{ s.t }}</ng-container>} @else {<mark [attr.data-hit]="s.i" [class.current]="s.i === current()">{{ s.t }}</mark>}}`,
  styles: `
    :host { display: inline; }
    mark {
      background: var(--hit);
      color: inherit;
      border-radius: 3px;
      padding: 0 1px;
      transition: background 0.15s;
    }
    mark.current {
      background: var(--hit-current);
      color: #fff;
      box-shadow: 0 0 0 2px var(--hit-current);
    }
  `,
})
export class Hl {
  segs = input.required<Seg[]>();
  current = input(-1);
}
