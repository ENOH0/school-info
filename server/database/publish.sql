-- ระบบ ร่าง / เผยแพร่: เล่ม (ภาคเรียน) จะขึ้นหน้าสาธารณะเมื่อผู้ดูแลระบบกดเผยแพร่
-- เผยแพร่แล้วจะล็อก แก้ข้อมูลของภาคเรียนนั้นไม่ได้ จนกว่าจะยกเลิกเผยแพร่
-- import ครั้งเดียว หลังจาก chapters.sql
ALTER TABLE terms
  ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 0 AFTER is_current,
  ADD COLUMN published_at DATETIME NULL AFTER is_published;
