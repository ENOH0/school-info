-- ===================================================================
-- ระบบสารสนเทศโรงเรียน: ติดตั้งฐานข้อมูลใหม่ทั้งหมดในไฟล์เดียว
-- ใช้ตอนติดตั้งครั้งแรก (เครื่องใหม่ / เซิร์ฟเวอร์โรงเรียน)
--   = core.sql + topics.sql + chapters.sql + publish.sql + charts.sql + security.sql รวมกันแล้ว
--   ฐานข้อมูลที่มีตารางอยู่แล้ว ห้าม import ไฟล์นี้ซ้ำ
-- วิธีใช้: phpMyAdmin สร้างฐานข้อมูล (utf8mb4_unicode_ci) → เลือกฐานข้อมูลนั้น → Import ไฟล์นี้
-- ใช้ได้กับ MySQL 5.6.5+ / MariaDB 10.1+
-- ===================================================================

SET NAMES utf8mb4;

-- ฝ่าย
CREATE TABLE departments (
  id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(20)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO departments (code, name, sort_order) VALUES
  ('academic',  'ฝ่ายบริหารวิชาการ',    1),
  ('budget',    'ฝ่ายบริหารงบประมาณ',  2),
  ('personnel', 'ฝ่ายบริหารงานบุคคล',  3),
  ('general',   'ฝ่ายบริหารทั่วไป',     4);

-- ปีการศึกษา (term คงไว้เป็น 0 เพื่อรองรับข้อมูลเดิม)
-- is_published = 1 คือเล่มของปีนี้เผยแพร่แล้ว (ล็อกข้อมูล)
CREATE TABLE terms (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  academic_year  SMALLINT UNSIGNED NOT NULL,
  term           TINYINT UNSIGNED NOT NULL,
  is_current     TINYINT(1) NOT NULL DEFAULT 0,
  is_published   TINYINT(1) NOT NULL DEFAULT 0,
  published_at   DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_terms_year_term (academic_year, term)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO terms (academic_year, term, is_current) VALUES
  (2569, 0, 1);

-- ผู้ใช้
-- role: admin = จัดการทุกอย่าง, editor = แก้ได้เฉพาะฝ่ายตัวเอง
CREATE TABLE users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username       VARCHAR(50)  NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  display_name   VARCHAR(100) NOT NULL,
  role           ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  department_id  TINYINT UNSIGNED NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at  DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_department (department_id),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id)
    REFERENCES departments (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- หัวข้อ เช่น "จำนวนนักเรียนแยกตามระดับชั้น" ของฝ่ายวิชาการ
-- chapter:   หมวดในเล่ม 1–10, 0 = อื่น ๆ ต่อท้ายเล่ม
-- kind:      table = ตาราง, text = ความเรียง
-- frequency คงไว้เป็น year เพื่อรองรับฐานข้อมูลเดิม
-- columns_json: คอลัมน์ของตาราง เช่น [{"key":"c1","label":"ระดับชั้น","type":"text"}, ...]
-- chart_json:   กราฟในเล่ม เช่น {"type":"bar","series":["c2","c3"],"trend":true} (NULL = ไม่มีกราฟ)
CREATE TABLE topics (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id  TINYINT UNSIGNED NOT NULL,
  chapter        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  title          VARCHAR(200) NOT NULL,
  kind           ENUM('table','text') NOT NULL,
  frequency      ENUM('term','year') NOT NULL DEFAULT 'year',
  columns_json   TEXT NULL,
  chart_json     TEXT NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_topics_department (department_id, sort_order),
  CONSTRAINT fk_topics_department FOREIGN KEY (department_id)
    REFERENCES departments (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ข้อมูลที่กรอกในหัวข้อ 1 แถว = 1 หัวข้อของ 1 ปี (term = 0)
-- data_json: ตาราง = {"rows":[...]}  ความเรียง = {"text":"..."}  รูป = "images":[...]
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

-- เอกสารข้อมูลดิบของฝ่าย (ไฟล์จริงอยู่ในโฟลเดอร์ raw-uploads)
CREATE TABLE raw_documents (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id TINYINT UNSIGNED NOT NULL,
  academic_year SMALLINT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(100) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  sender_name VARCHAR(150) NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  deleted_by INT UNSIGNED NULL,
  PRIMARY KEY (id), UNIQUE KEY uq_raw_stored_name(stored_name),
  KEY idx_raw_lookup(department_id,academic_year,deleted_at), KEY idx_raw_purge(deleted_at),
  CONSTRAINT fk_raw_department FOREIGN KEY(department_id) REFERENCES departments(id),
  CONSTRAINT fk_raw_uploaded_by FOREIGN KEY(uploaded_by) REFERENCES users(id),
  CONSTRAINT fk_raw_deleted_by FOREIGN KEY(deleted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ประวัติการใส่รหัสผ่านผิด (กันการเดารหัสผ่าน) ลบของเก่าเกิน 1 วันอัตโนมัติ
CREATE TABLE login_attempts (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(100) NOT NULL,
  ip            VARCHAR(45)  NOT NULL,
  attempted_at  DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_login_user (username, ip, attempted_at),
  KEY idx_login_ip (ip, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
