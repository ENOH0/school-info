-- ประวัติการแก้ไขข้อมูล แสดงบัญชีฝ่าย หัวข้อ ปี เวลา และค่าก่อน/หลัง
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  department_id TINYINT UNSIGNED NULL,
  topic_id INT UNSIGNED NULL,
  academic_year SMALLINT UNSIGNED NULL,
  action ENUM('create','update','delete','restore') NOT NULL,
  entity_type ENUM('record','raw_document') NOT NULL,
  entity_id INT UNSIGNED NULL,
  item_label VARCHAR(255) NOT NULL,
  before_json MEDIUMTEXT NULL,
  after_json MEDIUMTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created (created_at),
  KEY idx_audit_filter (academic_year, department_id, created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
