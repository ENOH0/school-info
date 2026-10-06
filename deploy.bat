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

echo.
echo ================================================================
echo   IMPORTANT: CHECK THE SCHOOL SERVER BEFORE BUILDING
echo ================================================================
echo   1. Confirm the real website folder with the server administrator.
echo   2. Confirm a backup folder outside htdocs or public_html.
echo   3. Set BACKUP_DIR in api\config.php after uploading.
echo   4. Check that APP in deploy.bat matches the website URL.
echo.
type "server\SERVER-CHECKLIST.txt"
echo.
choice /c YN /n /m "Have you checked the server folders? Y = build, N = stop: "
if errorlevel 2 goto cancelled

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
echo === [2/3] Collect files into %OUT% ===
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
echo === [3/3] Copy database files and documentation ===
mkdir "deploy\database"
copy /y "server\database\install.sql" "deploy\database\" >nul || goto fail
copy /y "server\database\historical-2566-2568.sql" "deploy\database\" >nul || goto fail
copy /y "server\database\five-aspects-content-2566-2568.sql" "deploy\database\" >nul || goto fail
copy /y "server\database\cleanup-duplicate-topics.sql" "deploy\database\" >nul || goto fail
copy /y "server\DEPLOY.md" "deploy\DEPLOY.md" >nul
copy /y "server\SERVER-CHECKLIST.txt" "deploy\SERVER-CHECKLIST.txt" >nul

echo.
echo ===== BUILD COMPLETED =====
echo  Upload %OUT% to the server, including hidden .htaccess files.
echo  Instructions: deploy\DEPLOY.md
echo  Server checklist: deploy\SERVER-CHECKLIST.txt
echo.
explorer deploy
pause
exit /b 0

:cancelled
echo.
echo Build cancelled. Check the website and backup folders with the server administrator first.
pause
exit /b 0

:fail
echo.
echo !!!!! BUILD FAILED - SEE THE ERROR ABOVE !!!!!
pause
exit /b 1
