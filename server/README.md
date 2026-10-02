# ฝั่งหลังบ้าน (PHP + MySQL)

โฟลเดอร์นี้คือต้นฉบับของไฟล์ที่ใช้งานจริงใน `C:\xampp7.4\htdocs\school-info`

| โฟลเดอร์ | เนื้อหา |
|---|---|
| `api/` | ไฟล์ PHP ทั้งหมด (PHP 7.4 ขึ้นไป) |
| `database/` | ไฟล์ SQL สำหรับ import ใน phpMyAdmin |
| `uploads/` | ที่เก็บรูปที่อัปโหลด (ใน git มีแค่ `.htaccess`) |

## ติดตั้งในเครื่องใหม่

1. คัดลอก `api/` และ `uploads/` ไปไว้ที่ `htdocs/school-info/`
2. คัดลอก `api/config.example.php` เป็น `api/config.php` แล้วแก้ชื่อฐานข้อมูล ผู้ใช้ และรหัสผ่าน
3. phpMyAdmin: สร้างฐานข้อมูล `school_info` (utf8mb4_unicode_ci) แล้ว import ตามลำดับ
   1. `database/core.sql`
   2. `database/topics.sql`
   3. `database/chapters.sql`
   4. `database/sample-data-full.sql` (ข้อมูลตัวอย่าง ไม่บังคับ)
4. เปิดหน้าเว็บ แล้วสร้างบัญชีผู้ดูแลระบบในหน้า "ตั้งค่าครั้งแรก"
