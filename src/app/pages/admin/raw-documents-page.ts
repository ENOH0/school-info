import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../core/admin-api.service';
import { AdminState } from '../../core/admin-state.service';
import { AuthService } from '../../core/auth.service';
import { RawDocument } from '../../core/admin.model';
import { apiError } from '../../core/api-error';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-raw-documents-page',
  imports: [FormsModule],
  template: `
    <div class="head">
      <div>
        <h1 class="page-title">ข้อมูลดิบของฝ่าย</h1>
        <p class="muted">เก็บเอกสารต้นฉบับแยกตามฝ่ายและปีการศึกษา · PDF เปิดดูได้ ส่วน Word/Excel ดาวน์โหลดลงเครื่อง</p>
      </div>
      <div class="filters">
        <label class="field">ปีการศึกษา
          <select class="select" [(ngModel)]="year" (ngModelChange)="load()">@for (y of years(); track y) { <option [ngValue]="y">{{ y }}</option> }</select>
        </label>
        <label class="field">ฝ่าย
          <select class="select" [(ngModel)]="departmentId" (ngModelChange)="load()">@for (d of state.departments(); track d.id) { <option [ngValue]="d.id">{{ d.name }}</option> }</select>
        </label>
      </div>
    </div>

    @if (canEdit()) {
      <form class="card upload" (ngSubmit)="upload()">
        <div><strong>เพิ่มเอกสาร</strong><div class="muted small">PDF, Word หรือ Excel · ไม่เกิน 20 MB ต่อไฟล์ · เลือกได้หลายไฟล์</div></div>
        <label class="field">ไฟล์เอกสาร <input class="input" type="file" multiple required accept=".pdf,.doc,.docx,.xls,.xlsx" (change)="files.set($any($event.target).files)" /></label>
        <label class="field wide">คำอธิบาย <input class="input" name="description" [(ngModel)]="description" maxlength="1000" placeholder="เช่น แบบสรุปผลการดำเนินงานประจำปี" /></label>
        <label class="field">ชื่อผู้ส่งเอกสาร (ไม่บังคับ) <input class="input" name="sender" [(ngModel)]="senderName" maxlength="150" placeholder="ชื่อ–สกุล หรือหน่วยงาน" /></label>
        <button class="btn primary" type="submit" [disabled]="busy() || !files()?.length">{{ busy() ? 'กำลังอัปโหลด…' : 'อัปโหลดเอกสาร' }}</button>
      </form>
    } @else {
      <p class="alert info">คุณดูเอกสารของฝ่ายนี้ได้ แต่เพิ่ม/แก้ไข/ลบได้เฉพาะเอกสารของฝ่ายตัวเอง</p>
    }

    <div class="toolbar">
      <strong>{{ trash() ? 'ถังขยะ' : 'เอกสารทั้งหมด' }}</strong>
      @if (canEdit()) { <button class="btn ghost sm" (click)="trash.set(!trash()); load()">{{ trash() ? 'กลับรายการเอกสาร' : 'ดูถังขยะ' }}</button> }
    </div>
    @if (message()) { <p class="alert" [class.err]="isError()">{{ message() }}</p> }
    @if (loading()) { <p class="muted">กำลังโหลด…</p> }
    @else {
      <div class="list">
        @for (d of documents(); track d.id) {
          <article class="card doc">
            <div class="file-icon">{{ ext(d.originalName) }}</div>
            <div class="info">
              <a class="name" [href]="fileUrl(d)" target="_blank" rel="noopener">{{ d.originalName }}</a>
              @if (d.description) { <p>{{ d.description }}</p> }
              <div class="meta">ฝ่าย {{ d.departmentName }} · ปีการศึกษา {{ d.academicYear }} · {{ size(d.fileSize) }}</div>
              <div class="meta">อัปโหลด {{ d.uploadedAt }} โดย {{ d.uploadedByName }} @if (d.senderName) { · ผู้ส่งเอกสาร: {{ d.senderName }} }</div>
              @if (d.deletedAt) { <div class="deleted">ย้ายเข้าถังขยะ {{ d.deletedAt }} · ระบบจะลบถาวรเมื่อครบ 30 วัน</div> }
            </div>
            <div class="actions">
              <a class="btn ghost sm" [href]="fileUrl(d)" target="_blank" rel="noopener">{{ d.openMode === 'inline' ? 'เปิดดู' : 'ดาวน์โหลด' }}</a>
              @if (d.canEdit && !d.deletedAt) { <button class="btn ghost sm" (click)="edit(d)">แก้รายละเอียด</button><button class="btn danger sm" (click)="remove(d)">ย้ายเข้าถังขยะ</button> }
              @if (d.canEdit && d.deletedAt) { <button class="btn primary sm" (click)="restore(d)">กู้คืน</button> }
            </div>
          </article>
        } @empty { <p class="empty">{{ trash() ? 'ไม่มีเอกสารในถังขยะ' : 'ยังไม่มีเอกสารของฝ่ายและปีนี้' }}</p> }
      </div>
    }
  `,
  styles: `
    .head,.filters,.toolbar,.doc,.actions { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
    .head { justify-content:space-between; align-items:flex-end; margin-bottom:16px; } .head p { margin:0; }
    .filters { align-items:flex-end; } .upload { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:12px; align-items:end; margin-bottom:18px; }
    .wide { grid-column:span 2; } .small,.meta { font-size:13px; } .toolbar { justify-content:space-between; margin:18px 0 10px; }
    .list { display:flex; flex-direction:column; gap:10px; } .doc { padding:14px; } .file-icon { font-weight:800; color:var(--blue-700); background:var(--blue-50); padding:9px; border-radius:8px; }
    .info { flex:1; min-width:220px; } .name { font-weight:700; word-break:break-word; } .info p { margin:5px 0; white-space:pre-wrap; } .meta { color:var(--ink-2); }
    .deleted { color:#b45309; font-size:13px; margin-top:4px; } .empty { padding:28px; text-align:center; border:1px dashed var(--line); border-radius:var(--radius); color:var(--ink-2); }
    @media(max-width:640px){ .wide{grid-column:auto}.actions{width:100%}.actions .btn{flex:1}.filters{width:100%}.filters .field{flex:1} }
  `,
})
export class RawDocumentsPage {
  api = inject(AdminApi); state = inject(AdminState); auth = inject(AuthService);
  year = 0; departmentId = 0; description = ''; senderName = '';
  files = signal<FileList | null>(null); documents = signal<RawDocument[]>([]); trash = signal(false);
  busy = signal(false); loading = signal(false); message = signal(''); isError = signal(false);
  years = computed(() => this.state.terms().map(x => x.academicYear));
  canEdit(){ const u=this.auth.user(); return !!u && (u.role==='admin' || u.departmentId===this.departmentId); }
  constructor(){ effect(() => { const ys=this.years(); if(!this.year&&ys.length)this.year=ys[0]; if(!this.departmentId&&this.state.departments().length)this.departmentId=this.auth.user()?.departmentId ?? this.state.departments()[0].id; if(this.year&&this.departmentId)this.load(); }); }
  load(){ if(!this.year||!this.departmentId)return; this.loading.set(true); this.api.rawDocuments(this.year,this.departmentId,this.trash()).subscribe({next:r=>{this.documents.set(r);this.loading.set(false)},error:e=>{this.show(apiError(e),true);this.loading.set(false)}}); }
  async upload(){ const list=Array.from(this.files()??[]); if(!list.length)return; this.busy.set(true); for(const f of list){ try{ await firstValueFrom(this.api.uploadRawDocument(f,this.year,this.departmentId,this.description,this.senderName)); }catch(e){this.show(`${f.name}: ${apiError(e)}`,true);this.busy.set(false);return;} } this.busy.set(false);this.files.set(null);this.description='';this.senderName='';this.show(`อัปโหลดแล้ว ${list.length} ไฟล์`,false);this.load(); }
  remove(d:RawDocument){ if(!confirm(`ย้าย ${d.originalName} เข้าถังขยะ?`))return; this.api.deleteRawDocument(d.id).subscribe({next:()=>{this.show('ย้ายเข้าถังขยะแล้ว',false);this.load()},error:e=>this.show(apiError(e),true)}); }
  edit(d:RawDocument){ const description=prompt('คำอธิบายเอกสาร',d.description); if(description===null)return; const sender=prompt('ชื่อผู้ส่งเอกสาร (เว้นว่างได้)',d.senderName??''); if(sender===null)return; this.api.updateRawDocument(d.id,description,sender).subscribe({next:()=>{this.show('แก้รายละเอียดแล้ว',false);this.load()},error:e=>this.show(apiError(e),true)}); }
  restore(d:RawDocument){ this.api.restoreRawDocument(d.id).subscribe({next:()=>{this.show('กู้คืนเอกสารแล้ว',false);this.load()},error:e=>this.show(apiError(e),true)}); }
  fileUrl(d:RawDocument){ return `api/raw-document-file.php?id=${d.id}`; }
  ext(n:string){ return (n.split('.').pop()||'FILE').toUpperCase(); } size(n:number){ return n<1048576?`${Math.ceil(n/1024)} KB`:`${(n/1048576).toFixed(1)} MB`; }
  private show(s:string,err:boolean){this.message.set(s);this.isError.set(err);}
}
