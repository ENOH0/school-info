-- ระบบสารสนเทศโรงเรียน: ตารางหัวข้อและข้อมูลที่แต่ละฝ่ายกรอก
-- ต้อง import core.sql ก่อน แล้วค่อย import ไฟล์นี้ (ในฐานข้อมูล school_info)
-- ใช้ได้กับ MySQL 5.6.5+ / MariaDB 10.1+ (เก็บ JSON เป็นข้อความ ไม่ใช้ชนิด JSON)

SET NAMES utf8mb4;

-- หัวข้อ เช่น "จำนวนนักเรียนแยกตามระดับชั้น" ของฝ่ายวิชาการ
-- kind:      table = ตาราง, text = ความเรียง
-- frequency: term = กรอกทุกภาคเรียน, year = กรอกปีละครั้ง
-- columns_json: คอลัมน์ของตาราง เช่น [{"key":"c1","label":"ระดับชั้น","type":"text"}, ...]
CREATE TABLE topics (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id  TINYINT UNSIGNED NOT NULL,
  title          VARCHAR(200) NOT NULL,
  kind           ENUM('table','text') NOT NULL,
  frequency      ENUM('term','year') NOT NULL DEFAULT 'term',
  columns_json   TEXT NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_topics_department (department_id, sort_order),
  CONSTRAINT fk_topics_department FOREIGN KEY (department_id)
    REFERENCES departments (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ข้อมูลที่กรอกในหัวข้อ 1 แถว = 1 หัวข้อ ของ 1 ภาคเรียน (หรือ 1 ปี ถ้า term = 0)
-- data_json: ตาราง = {"rows":[{"c1":"ม.1","c2":150}, ...]}  ความเรียง = {"text":"..."}
CREATE TABLE records (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic_id       INT UNSIGNED NOT NULL,
  academic_year  SMALLINT UNSIGNED NOT NULL,
  term           TINYINT UNSIGNED NOT NULL,
  data_json      MEDIUMTEXT NOT NULL,
  updated_by     INT UNSIGNED NULL,
  updated_at     DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_records_topic_period (topic_id, academic_year, term),
  KEY idx_records_period (academic_year, term),
  CONSTRAINT fk_records_topic FOREIGN KEY (topic_id)
    REFERENCES topics (id) ON DELETE CASCADE,
  CONSTRAINT fk_records_user FOREIGN KEY (updated_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
