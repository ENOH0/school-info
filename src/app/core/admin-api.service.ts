import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChartConfig, Column, CopyResult, Department, Frequency, ImageItem, ProgressResponse, RecordResponse, Row, Term, Topic, TopicDetail, TopicKind, UserRow } from './admin.model';

type Ok = { ok: true; id?: number };

// รวมทุก API ของส่วนจัดการไว้ที่เดียว
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private http = inject(HttpClient);

  meta() {
    return this.http.get<{ departments: Department[]; terms: Term[] }>('api/meta.php');
  }

  // ----- ปีการศึกษา/ภาคเรียน -----
  addTerm(academicYear: number, term: number) {
    return this.http.post<Ok>('api/term-save.php', { academicYear, term });
  }
  publishTerm(id: number, publish: boolean) {
    return this.http.post<Ok>('api/term-save.php', { id, publish });
  }
  setCurrentTerm(id: number) {
    return this.http.post<Ok>('api/term-save.php', { id, setCurrent: true });
  }

  progress(year: number, term: number) {
    return this.http.get<ProgressResponse>('api/progress.php', { params: { year, term } });
  }

  // ----- หัวข้อ -----
  topics(departmentId: number, year: number, term: number) {
    return this.http.get<Topic[]>('api/topics.php', {
      params: { department_id: departmentId, year, term },
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
    frequency: Frequency;
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
  record(topicId: number, year: number, term: number) {
    return this.http.get<RecordResponse>('api/record-get.php', { params: { topic_id: topicId, year, term } });
  }
  uploadImage(topicId: number, year: number, term: number, file: Blob, name: string) {
    const form = new FormData();
    form.append('topic_id', String(topicId));
    form.append('year', String(year));
    form.append('term', String(term));
    form.append('file', file, name);
    return this.http.post<{ ok: true; file: string; url: string }>('api/image-upload.php', form);
  }
  saveRecord(body: {
    topicId: number;
    academicYear: number;
    term: number;
    rows?: Row[];
    text?: string;
    images?: ImageItem[];
  }) {
    return this.http.post<{ ok: true; deleted: boolean; updatedAt?: string }>('api/record-save.php', body);
  }

  /** คัดลอกข้อมูลครั้งก่อนมาใส่หัวข้อที่ยังว่างของฝ่าย (ไม่แทนที่หัวข้อที่กรอกแล้ว) */
  copyPrevious(departmentId: number, academicYear: number, term: number) {
    return this.http.post<CopyResult & { ok: true }>('api/record-copy.php', { departmentId, academicYear, term });
  }

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
}
