import { Component, effect, inject, signal, untracked } from '@angular/core';
import { AdminApi } from '../../core/admin-api.service';
import { AdminState } from '../../core/admin-state.service';
import { AuditLog } from '../../core/admin.model';
import { apiError } from '../../core/api-error';

@Component({
  selector: 'app-audit-log-page',
  template: `
    <div class="head">
      <div><h1 class="page-title">ประวัติการแก้ไขข้อมูล</h1><p class="muted">แสดงบัญชีที่แก้ หัวข้อ ปี เวลา และค่าก่อน–หลัง (ล่าสุดไม่เกิน 500 รายการ)</p></div>
      <div class="filters">
        <label class="field">ปีการศึกษา
          <select class="select" (change)="state.termId.set(+$any($event.target).value)">
            @for(t of state.dataTerms();track t.id){<option [value]="t.id" [selected]="t.id===state.termId()">{{t.academicYear}}</option>}
          </select>
        </label>
        <label class="field">ฝ่าย
          <select class="select" (change)="departmentId.set(+$any($event.target).value)">
            <option value="0">ทุกฝ่าย</option>
            @for(d of state.departments();track d.id){<option [value]="d.id">{{d.name}}</option>}
          </select>
        </label>
      </div>
    </div>
    @if(error()){<p class="alert err">{{error()}}</p>}
    @else if(loading()){<p class="muted">กำลังโหลด…</p>}
    @else if(!rows().length){<div class="card empty">ยังไม่มีประวัติการแก้ไขในปีและฝ่ายที่เลือก</div>}
    @else{
      <div class="list">
        @for(row of rows();track row.id){
          <article class="card item">
            <div class="top"><div><span class="badge" [class.del]="row.action==='delete'" [class.restore]="row.action==='restore'">{{actionLabel(row.action)}}</span><strong>{{row.itemLabel}}</strong></div><time>{{row.createdAt}}</time></div>
            <div class="meta">{{row.departmentName || 'ไม่ระบุฝ่าย'}} · {{row.academicYear ? 'ปีการศึกษา '+row.academicYear : 'ไม่ระบุปี'}} · โดย <strong>{{row.userName}}</strong></div>
            @if(row.action==='update'){
              <div class="compare"><details><summary>ค่าก่อนแก้ไข</summary><pre>{{pretty(row.before)}}</pre></details><details><summary>ค่าหลังแก้ไข</summary><pre>{{pretty(row.after)}}</pre></details></div>
            } @else {
              <details><summary>{{row.action==='delete'?'ข้อมูลก่อนลบ':'รายละเอียดรายการ'}}</summary><pre>{{pretty(row.after ?? row.before)}}</pre></details>
            }
          </article>
        }
      </div>
    }
  `,
  styles: `
    .head,.filters,.top{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap}.head{margin-bottom:20px}.head p{margin:0}.list{display:grid;gap:12px}.item{padding:16px}.top{align-items:center}.top>div{display:flex;align-items:center;gap:9px}.meta{color:var(--ink-2);font-size:14px;margin:8px 0}.badge{background:#dbeafe;color:#1e40af}.badge.del{background:#fee2e2;color:#991b1b}.badge.restore{background:#dcfce7;color:#166534}.compare{display:grid;grid-template-columns:1fr 1fr;gap:10px}summary{cursor:pointer;color:var(--blue-700);font-weight:600}pre{white-space:pre-wrap;word-break:break-word;background:var(--blue-50);border:1px solid var(--line);border-radius:7px;padding:10px;max-height:280px;overflow:auto;font-family:inherit;font-size:13px}.empty{padding:24px;text-align:center}@media(max-width:700px){.compare{grid-template-columns:1fr}.filters{width:100%}.filters .field{flex:1;min-width:140px}}
  `,
})
export class AuditLogPage {
  state=inject(AdminState); private api=inject(AdminApi);
  departmentId=signal(0); rows=signal<AuditLog[]>([]); loading=signal(true); error=signal('');
  constructor(){effect(()=>{const t=this.state.term();const d=this.departmentId();if(t)untracked(()=>this.load(t.academicYear,d));});}
  private load(year:number,dept:number){this.loading.set(true);this.error.set('');this.api.auditLogs(year,dept).subscribe({next:r=>{this.rows.set(r);this.loading.set(false);},error:e=>{this.error.set(apiError(e));this.loading.set(false);}});}
  actionLabel(a:AuditLog['action']){return({create:'เพิ่ม',update:'แก้ไข',delete:'ลบ',restore:'กู้คืน'})[a];}
  pretty(value:unknown){return value===null||value===undefined?'—':JSON.stringify(value,null,2);}
}
