-- เพิ่ม "หมวดในเล่ม" ให้หัวข้อ (1–10 ตามโครงเล่มสารสนเทศ, 0 = อื่น ๆ ต่อท้ายเล่ม)
-- import ครั้งเดียว หลังจาก topics.sql
ALTER TABLE topics ADD COLUMN chapter TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER department_id;
