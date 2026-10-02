-- ระบบสารสนเทศโรงเรียน: ตารางส่วนแกน
-- ใช้ได้กับ MySQL 5.6+ / MariaDB 10.1+ (ยังไม่ใช้ชนิด JSON)
-- วิธีใช้: สร้างฐานข้อมูล school_info (utf8mb4_unicode_ci) ใน phpMyAdmin ก่อน แล้ว import ไฟล์นี้

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

-- ปีการศึกษาและเทอม (term = 0 หมายถึงข้อมูลรายปี)
CREATE TABLE terms (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  academic_year  SMALLINT UNSIGNED NOT NULL,
  term           TINYINT UNSIGNED NOT NULL,
  is_current     TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_terms_year_term (academic_year, term)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO terms (academic_year, term, is_current) VALUES
  (2569, 0, 0),
  (2569, 1, 1),
  (2569, 2, 0);

-- ผู้ใช้
-- role: admin = จัดการทุกอย่าง, editor = แก้ได้เฉพาะฝ่ายตัวเอง (ดูได้ทุกฝ่าย)
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
