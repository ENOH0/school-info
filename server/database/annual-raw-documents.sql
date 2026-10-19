-- อัปเกรดระบบเป็นหนึ่งเล่มต่อหนึ่งปี และเพิ่มคลังข้อมูลดิบของฝ่าย
USE school_info;

INSERT IGNORE INTO terms (academic_year, term, is_current, is_published, published_at)
SELECT academic_year, 0, 0, 0, NULL FROM terms GROUP BY academic_year;

UPDATE terms annual
JOIN (
  SELECT academic_year, MAX(is_current) is_current, MAX(is_published) is_published, MAX(published_at) published_at
  FROM terms GROUP BY academic_year
) summary ON summary.academic_year=annual.academic_year
SET annual.is_current=summary.is_current, annual.is_published=summary.is_published, annual.published_at=summary.published_at
WHERE annual.term=0;

UPDATE records SET term=0 WHERE term<>0;
UPDATE topics SET frequency='year';
DELETE FROM terms WHERE term<>0;

CREATE TABLE IF NOT EXISTS raw_documents (
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
