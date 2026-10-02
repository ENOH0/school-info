-- กราฟในเล่ม: เก็บการตั้งค่ากราฟของแต่ละหัวข้อ เช่น {"type":"bar","series":["c2","c3"],"trend":true}
-- import ครั้งเดียว หลังจาก publish.sql (ฐานข้อมูลที่ติดตั้งจาก install.sql รุ่นใหม่มีคอลัมน์นี้แล้ว)
ALTER TABLE topics ADD COLUMN chart_json TEXT NULL AFTER columns_json;
