import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChartConfig, Column, CopyResult, Department, ImageItem, ProgressResponse, RawDocument, RecordResponse, Row, Term, Topic, TopicDetail, TopicKind, UserRow } from './admin.model';

type Ok = { ok: true; id?: number };

// รวมทุก API ของส่วนจัดการไว้ที่เดียว
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private http = inject(HttpClient);

  meta() {
    return this.http.get<{ departments: Department[]; terms: Term[] }>('api/meta.php');
  }

  // ----- ปีการศึกษา -----
  addTerm(academicYear: number) {
    return this.http.post<Ok>('api/term-save.php', { academicYear });
  }
  publishTerm(id: number, publish: boolean) {
    return this.http.post<Ok>('api/term-save.php', { id, publish });
  }
  setCurrentTerm(id: number) {
    return this.http.post<Ok>('api/term-save.php', { id, setCurrent: true });
  }

  progress(year: number) {
    return this.http.get<ProgressResponse>('api/progress.php', { params: { year } });
  }

  // ----- หัวข้อ -----
  topics(departmentId: number, year: number) {
    return this.http.get<Topic[]>('api/topics.php', {
      params: { department_id: departmentId, year },
    });
  }
  topic(id: number) {
    return this.http.get<TopicDetail>('api/topic-get.php', { params: { id } });
  }
  saveTopic(t: {
    id?: number;
    departmentId: number;
    chapter: number;
    title: string;
    kind: TopicKind;
    columns: Column[];
    chart: ChartConfig | { type: 'none' };
  }) {
    return this.http.post<Ok>('api/topic-save.php', t);
  }
  deleteTopic(id: number) {
    return this.http.post<Ok>('api/topic-delete.php', { id });
  }
  moveTopic(id: number, direction: 'up' | 'down') {
    return this.http.post<Ok>('api/topic-move.php', { id, direction });
  }

  // ----- ข้อมูลที่กรอก -----
  record(topicId: number, year: number) {
    return this.http.get<RecordResponse>('api/record-get.php', { params: { topic_id: topicId, year } });
  }
  uploadImage(topicId: number, year: number, file: Blob, name: string) {
    const form = new FormData();
    form.append('topic_id', String(topicId));
    form.append('year', String(year));
    form.append('file', file, name);
    return this.http.post<{ ok: true; file: string; url: string }>('api/image-upload.php', form);
  }
  saveRecord(body: {
    topicId: number;
    academicYear: number;
    rows?: Row[];
    text?: string;
    images?: ImageItem[];
  }) {
    return this.http.post<{ ok: true; deleted: boolean; updatedAt?: string }>('api/record-save.php', body);
  }

  /** คัดลอกข้อมูลครั้งก่อนมาใส่หัวข้อที่ยังว่างของฝ่าย (ไม่แทนที่หัวข้อที่กรอกแล้ว) */
  copyPrevious(departmentId: number, academicYear: number) {
    return this.http.post<CopyResult & { ok: true }>('api/record-copy.php', { departmentId, academicYear });
  }

  // ----- ข้อมูลดิบของฝ่าย -----
  rawDocuments(year: number, departmentId: number, trash = false) {
    return this.http.get<RawDocument[]>('api/raw-documents.php', { params: { year, department_id: departmentId, trash: trash ? 1 : 0 } });
  }
  uploadRawDocument(file: File, academicYear: number, departmentId: number, description: string, senderName: string) {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('academic_year', String(academicYear));
    form.append('department_id', String(departmentId));
    form.append('description', description);
    form.append('sender_name', senderName);
    return this.http.post<Ok>('api/raw-document-upload.php', form);
  }
  updateRawDocument(id: number, description: string, senderName: string) {
    return this.http.post<Ok>('api/raw-document-update.php', { id, description, senderName });
  }
  deleteRawDocument(id: number) { return this.http.post<Ok>('api/raw-document-delete.php', { id }); }
  restoreRawDocument(id: number) { return this.http.post<Ok>('api/raw-document-restore.php', { id }); }

  // ----- ผู้ใช้ -----
  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<Ok>('api/password-change.php', { currentPassword, newPassword });
  }
  users() {
    return this.http.get<UserRow[]>('api/users.php');
  }
  saveUser(u: {
    id?: number;
    username: string;
    displayName: string;
    role: 'admin' | 'editor';
    departmentId: number | null;
    isActive: boolean;
    password?: string;
  }) {
    return this.http.post<Ok>('api/user-save.php', u);
  }

  restoreDatabase(file: File) {
    const form = new FormData();
    form.append('backup', file, file.name);
    form.append('confirm', 'RESTORE');
    return this.http.post<{
      ok: true;
      automaticBackup: string;
      counts: Record<string, number>;
      scope: { type: 'all' | 'year'; academicYear?: number };
    }>('api/database-restore.php', form);
  }
}
