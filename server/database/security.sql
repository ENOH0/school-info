-- กันการเดารหัสผ่าน: เก็บประวัติการใส่รหัสผิด (ลบของเก่าเกิน 1 วันอัตโนมัติ)
-- import ครั้งเดียว หลังจาก charts.sql (ฐานข้อมูลที่ติดตั้งจาก install.sql รุ่นใหม่มีตารางนี้แล้ว)
CREATE TABLE login_attempts (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(100) NOT NULL,
  ip            VARCHAR(45)  NOT NULL,
  attempted_at  DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_login_user (username, ip, attempted_at),
  KEY idx_login_ip (ip, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
