@echo off
chcp 65001 >nul
setlocal

rem ================================================================
rem  สร้างชุดไฟล์สำหรับขึ้นเซิร์ฟเวอร์โรงเรียน
rem  ผลลัพธ์: deploy\school-info  = อัปโหลดทั้งโฟลเดอร์นี้ขึ้นเซิร์ฟเวอร์
rem           deploy\database     = ไฟล์ SQL (import ใน phpMyAdmin ไม่ต้องอัปโหลด)
rem ================================================================

rem ===== ตั้งค่า: ชื่อโฟลเดอร์บนเซิร์ฟเวอร์ =====
rem  เว็บอยู่ที่ http://ชื่อเว็บ/school-info/  ให้ใส่ school-info
rem  เว็บอยู่ที่โดเมนหลักเลย เช่น http://info.โรงเรียน/  ให้ใส่ / แทน
set "APP=school-info"

cd /d "%~dp0"

if "%APP%"=="/" (
    set "BASE=/"
    set "OUT=deploy\site"
) else (
    set "BASE=/%APP%/"
    set "OUT=deploy\%APP%"
)

echo.
echo === [1/3] Build Angular (base href = %BASE%) ===
call npx ng build --base-href %BASE%
if errorlevel 1 goto fail

echo.
echo === [2/3] รวมไฟล์ไว้ที่ %OUT% ===
if exist deploy rmdir /s /q deploy
mkdir "%OUT%" || goto fail
xcopy /e /i /q /y "dist\school-info-web\browser" "%OUT%" >nul || goto fail
rem ข้อมูลจำลองเก่า ไม่ต้องขึ้นเซิร์ฟเวอร์
if exist "%OUT%\data" rmdir /s /q "%OUT%\data"
copy /y "server\.htaccess" "%OUT%\.htaccess" >nul || goto fail
xcopy /e /i /q /y "server\api" "%OUT%\api" >nul || goto fail
rem config.php มีรหัสผ่านของเครื่องนี้ ห้ามติดไปด้วย
if exist "%OUT%\api\config.php" del /q "%OUT%\api\config.php"
mkdir "%OUT%\uploads"
copy /y "server\uploads\.htaccess" "%OUT%\uploads\.htaccess" >nul || goto fail

echo.
echo === [3/3] ไฟล์ฐานข้อมูลและคู่มือ ===
mkdir "deploy\database"
copy /y "server\database\install.sql" "deploy\database\" >nul || goto fail
copy /y "server\DEPLOY.md" "deploy\DEPLOY.md" >nul

echo.
echo ===== เสร็จแล้ว =====
echo  อัปโหลดโฟลเดอร์  %OUT%  ขึ้นเซิร์ฟเวอร์ (มีไฟล์ซ่อน .htaccess ด้วย)
echo  ขั้นตอนทั้งหมดอยู่ใน deploy\DEPLOY.md
echo.
explorer deploy
pause
exit /b 0

:fail
echo.
echo !!!!! เกิดข้อผิดพลาด ดูข้อความด้านบน !!!!!
pause
exit /b 1
