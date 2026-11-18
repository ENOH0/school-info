param(
    [ValidateSet('Inspect', 'Preview', 'Backup', 'Upload')]
    [string]$Mode = 'Preview'
)

$ErrorActionPreference = 'Stop'
$ProjectDir = $PSScriptRoot
$LocalPackage = Join-Path $ProjectDir 'deploy\school-info'
$LocalMigrationDir = Join-Path $ProjectDir 'deploy\database'
$MigrationManifest = Join-Path $ProjectDir 'deploy-migrations.txt'
$RemoteDir = '/opt/lampp/htdocs/school-info'
$RemoteBackupDir = '/opt/lampp/school-info-backups'
$LocalPhp = 'C:\xampp8.2\php\php.exe'
$LocalConfig = 'C:\xampp8.2\htdocs\school-info\api\config.php'
$LocalUploads = 'C:\xampp8.2\htdocs\school-info\uploads'
$LocalRawUploads = 'C:\xampp8.2\htdocs\school-info\raw-uploads'
$LocalSyncTool = Join-Path $ProjectDir 'server\api\deploy-data-sync.php'
$SavedSession = 'school-server'
$ServerHostKey = 'ssh-ed25519 255 DDhLH0/WI2JpE0ju2U2ICQpWrK7oetvblGujkhwlVqw'
$WinScp = 'C:\Program Files (x86)\WinSCP\WinSCP.com'
$LogDir = Join-Path $ProjectDir 'deploy-logs'

if (-not (Test-Path -LiteralPath $WinScp)) {
    throw "WinSCP.com not found: $WinScp"
}

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  SCHOOL-INFO DEPLOYMENT' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host "Mode       : $Mode"
Write-Host "Server     : 192.168.80.250"
Write-Host "Destination: $RemoteDir"
Write-Host ''

if ($Mode -eq 'Backup') {
    Write-Host 'This will create database/upload and website-code backups on the school server.' -ForegroundColor Yellow
    $Confirmation = Read-Host 'Type BACKUP to continue'
    if ($Confirmation -cne 'BACKUP') {
        Write-Host 'Cancelled. No server backup was created.' -ForegroundColor Yellow
        exit 0
    }
}

if ($Mode -eq 'Upload') {
    Write-Host 'This will overwrite changed website/API files on the school server.' -ForegroundColor Yellow
    Write-Host 'A verified server backup will be created before upload.' -ForegroundColor Yellow
    Write-Host 'The upload will NOT delete remote files and will NOT overwrite:' -ForegroundColor Yellow
    Write-Host '  api/config.php or backups'
    Write-Host 'Local images will be added to uploads without deleting existing server images.'
    Write-Host 'Local raw documents will be added without deleting existing server documents.'
    Write-Host 'Only the SQL files listed in deploy-migrations.txt will update the database.' -ForegroundColor Yellow
    Write-Host 'Local form data and referenced images will be merged without deleting server data.' -ForegroundColor Yellow
    $Confirmation = Read-Host 'Type DEPLOY to continue'
    if ($Confirmation -cne 'DEPLOY') {
        Write-Host 'Cancelled. Nothing was uploaded.' -ForegroundColor Yellow
        exit 0
    }
}

if ($Mode -notin @('Backup', 'Inspect')) {
    Push-Location $ProjectDir
    try {
        & cmd.exe /d /c 'deploy.bat --automated'
        if ($LASTEXITCODE -ne 0) {
            throw "Build/package failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

if ($Mode -notin @('Backup', 'Inspect') -and -not (Test-Path -LiteralPath $LocalPackage)) {
    throw "Deployment package not found: $LocalPackage"
}

$MigrationNames = @()
if ($Mode -eq 'Upload') {
    if (-not (Test-Path -LiteralPath $MigrationManifest)) {
        throw "Migration manifest not found: $MigrationManifest"
    }
    $MigrationNames = @(Get-Content -LiteralPath $MigrationManifest | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' -and -not $_.StartsWith('#') })
    foreach ($MigrationName in $MigrationNames) {
        if ($MigrationName -notmatch '^[A-Za-z0-9._-]+\.sql$') {
            throw "Unsafe migration filename: $MigrationName"
        }
        $MigrationPath = Join-Path $LocalMigrationDir $MigrationName
        if (-not (Test-Path -LiteralPath $MigrationPath)) {
            throw "Migration file not found in deployment package: $MigrationPath"
        }
    }
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$WinScpScript = Join-Path $env:TEMP "school-info-winscp-$Timestamp.txt"
$LocalSyncFile = Join-Path $env:TEMP "school-info-local-sync-$Timestamp.json"
$WinScpLog = Join-Path $LogDir "winscp-$($Mode.ToLower())-$Timestamp.log"
$PreviewSwitch = if ($Mode -eq 'Preview') { ' -preview' } else { '' }
$RemoteCodeBackup = "$RemoteBackupDir/site-before-deploy-$Timestamp.tar.gz"
$RemoteMigrationDir = "/tmp/school-info-deploy-$Timestamp"
$RemoteSyncFile = "$RemoteMigrationDir/local-records.json"
$FiveTopicHexSql = '"E0B982E0B884E0B8A3E0B887E0B8AAE0B8A3E0B989E0B8B2E0B887E0B8ABE0B8A5E0B8B1E0B881E0B8AAE0B8B9E0B895E0B8A3E0B8AAE0B896E0B8B2E0B899E0B8A8E0B8B6E0B881E0B8A9E0B8B2E0B8A3E0B8B0E0B894E0B8B1E0B89AE0B8A1E0B8B1E0B898E0B8A2E0B8A1E0B8A8E0B8B6E0B881E0B8A9E0B8B2E0B895E0B8ADE0B899E0B895E0B989E0B899E0B981E0B8A5E0B8B0E0B895E0B8ADE0B899E0B89BE0B8A5E0B8B2E0B8A2","E0B887E0B8B2E0B899E0B8A7E0B8B4E0B888E0B8B1E0B8A2E0B983E0B899E0B88AE0B8B1E0B989E0B899E0B980E0B8A3E0B8B5E0B8A2E0B899","E0B89CE0B8A5E0B881E0B8B2E0B8A3E0B980E0B882E0B989E0B8B2E0B8A8E0B8B6E0B881E0B8A9E0B8B2E0B895E0B988E0B8ADE0B882E0B8ADE0B887E0B899E0B8B1E0B881E0B980E0B8A3E0B8B5E0B8A2E0B899E0B88AE0B8B1E0B989E0B899E0B8A1E0B8B1E0B898E0B8A2E0B8A1E0B8A8E0B8B6E0B881E0B8A9E0B8B2E0B89BE0B8B5E0B897E0B8B5E0B988203620E0B981E0B8A2E0B881E0B895E0B8B2E0B8A1E0B8A3E0B8B0E0B89AE0B89A2054434153","E0B897E0B8B8E0B899E0B881E0B8B2E0B8A3E0B8A8E0B8B6E0B881E0B8A9E0B8B2","E0B8A3E0B8B0E0B89AE0B89AE0B89AE0B8A3E0B8B4E0B8ABE0B8B2E0B8A3E0B888E0B8B1E0B894E0B881E0B8B2E0B8A3E0B894E0B8B4E0B888E0B8B4E0B897E0B8B1E0B8A5E0B882E0B8ADE0B887E0B982E0B8A3E0B887E0B980E0B8A3E0B8B5E0B8A2E0B899"'
$HealthTopicHexSql = '"E0B89CE0B8A5E0B881E0B8B2E0B8A3E0B89BE0B8A3E0B8B0E0B980E0B8A1E0B8B4E0B899E0B8AAE0B8B1E0B894E0B8AAE0B988E0B8A7E0B899E0B8A3E0B988E0B8B2E0B887E0B881E0B8B2E0B8A2E0B882E0B8ADE0B887E0B899E0B8B1E0B881E0B980E0B8A3E0B8B5E0B8A2E0B899","E0B89CE0B8A5E0B881E0B8B2E0B8A3E0B89BE0B8A3E0B8B0E0B980E0B8A1E0B8B4E0B899E0B8AAE0B8A1E0B8A3E0B8A3E0B896E0B8A0E0B8B2E0B89EE0B897E0B8B2E0B887E0B881E0B8B2E0B8A2E0B882E0B8ADE0B887E0B899E0B8B1E0B881E0B980E0B8A3E0B8B5E0B8A2E0B899","E0B89CE0B8A5E0B8AAE0B8B8E0B882E0B8A0E0B8B2E0B89EE0B888E0B8B4E0B895E0B882E0B8ADE0B887E0B899E0B8B1E0B881E0B980E0B8A3E0B8B5E0B8A2E0B899E0B981E0B8A2E0B881E0B895E0B8B2E0B8A1E0B8A3E0B8B0E0B894E0B8B1E0B89AE0B88AE0B8B1E0B989E0B899"'
$PersonnelTopicHexSql = '"E0B888E0B8B3E0B899E0B8A7E0B899E0B884E0B8A3E0B8B9E0B981E0B8A2E0B881E0B895E0B8B2E0B8A1E0B8A7E0B8B4E0B897E0B8A2E0B890E0B8B2E0B899E0B8B0","E0B888E0B8B3E0B899E0B8A7E0B899E0B884E0B8A3E0B8B9E0B981E0B8A2E0B881E0B895E0B8B2E0B8A1E0B8A7E0B8B8E0B892E0B8B4E0B881E0B8B2E0B8A3E0B8A8E0B8B6E0B881E0B8A9E0B8B2","E0B888E0B8B3E0B899E0B8A7E0B899E0B884E0B8A3E0B8B9E0B981E0B8A2E0B881E0B895E0B8B2E0B8A1E0B881E0B8A5E0B8B8E0B988E0B8A1E0B8AAE0B8B2E0B8A3E0B8B0E0B881E0B8B2E0B8A3E0B980E0B8A3E0B8B5E0B8A2E0B899E0B8A3E0B8B9E0B989","E0B881E0B8B2E0B8A3E0B8AAE0B8ADE0B899E0B895E0B8A3E0B887E0B8A7E0B8B8E0B892E0B8B4E0B981E0B8A2E0B881E0B895E0B8B2E0B8A1E0B881E0B8A5E0B8B8E0B988E0B8A1E0B8A7E0B8B4E0B88AE0B8B2"'
# These fragments are embedded inside PHP double-quoted SQL strings.
$FiveTopicHexSql = $FiveTopicHexSql.Replace('"', '\"')
$HealthTopicHexSql = $HealthTopicHexSql.Replace('"', '\"')
$PersonnelTopicHexSql = $PersonnelTopicHexSql.Replace('"', '\"')
$PhpBackupCode = 'require "/opt/lampp/htdocs/school-info/api/config.php";require "/opt/lampp/htdocs/school-info/api/database-backup-lib.php";$n=save_automatic_backup();$d=(defined("BACKUP_DIR")&&BACKUP_DIR!=="")?BACKUP_DIR:"/opt/lampp/school-info-backups";$p=rtrim($d,"/\\").DIRECTORY_SEPARATOR.$n;if(!is_file($p)||filesize($p)<100){fwrite(STDERR,"Backup verification failed\n");exit(2);}echo "DATA_BACKUP=".$p.PHP_EOL;'
$PhpInspectCode = 'require "/opt/lampp/htdocs/school-info/api/config.php";$p=db();$q=function($s)use($p){return $p->query($s)->fetchColumn();};$i=["topics"=>(int)$q("SELECT COUNT(*) FROM topics"),"records"=>(int)$q("SELECT COUNT(*) FROM records"),"chapter1"=>(int)$q("SELECT COUNT(*) FROM topics WHERE department_id=4 AND chapter=1"),"updated_by"=>(int)$q("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=\"records\" AND column_name=\"updated_by\""),"raw_documents"=>(int)$q("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=\"raw_documents\""),"new_five"=>(int)$q("SELECT COUNT(*) FROM topics WHERE HEX(title) IN (' + $FiveTopicHexSql + ')"),"health_records"=>(int)$q("SELECT COUNT(*) FROM records r JOIN topics t ON t.id=r.topic_id WHERE HEX(t.title) IN (' + $HealthTopicHexSql + ') AND r.academic_year BETWEEN 2566 AND 2568 AND r.term=0"),"personnel_records"=>(int)$q("SELECT COUNT(*) FROM records r JOIN topics t ON t.id=r.topic_id WHERE HEX(t.title) IN (' + $PersonnelTopicHexSql + ') AND r.academic_year BETWEEN 2566 AND 2569 AND r.term=0"),"years"=>(string)$q("SELECT GROUP_CONCAT(DISTINCT academic_year ORDER BY academic_year) FROM terms")];echo "PREFLIGHT=".json_encode($i).PHP_EOL;'

if ($Mode -in @('Preview', 'Upload')) {
    foreach ($RequiredPath in @($LocalPhp, $LocalConfig, $LocalUploads, $LocalRawUploads, $LocalSyncTool)) {
        if (-not (Test-Path -LiteralPath $RequiredPath)) {
            throw "Local data sync dependency not found: $RequiredPath"
        }
    }
    $PreviousConfig = $env:SCHOOL_INFO_CONFIG
    try {
        $env:SCHOOL_INFO_CONFIG = $LocalConfig
        & $LocalPhp $LocalSyncTool export $LocalSyncFile
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $LocalSyncFile)) {
            throw "Local data export failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        $env:SCHOOL_INFO_CONFIG = $PreviousConfig
    }
}

$MigrationPhpArray = ($MigrationNames | ForEach-Object { '"' + $_ + '"' }) -join ','

$Commands = @(
    'option batch abort'
    'option confirm off'
    "open `"$SavedSession`" -hostkey=`"$ServerHostKey`" -rawsettings LocalDirectory=`"$ProjectDir`" RemoteDirectory=`"$RemoteDir`""
)

if ($Mode -in @('Backup', 'Upload')) {
    $Commands += "call mkdir -p `"$RemoteBackupDir`""
    $Commands += "call /opt/lampp/bin/php -d memory_limit=-1 -d max_execution_time=0 -r '$PhpBackupCode'"
    $Commands += "call tar -czf `"$RemoteCodeBackup`" --exclude=school-info/uploads --exclude=school-info/raw-uploads --exclude=school-info/backups -C /opt/lampp/htdocs school-info"
    $Commands += "call test -s `"$RemoteCodeBackup`""
    $Commands += "call echo CODE_BACKUP=$RemoteCodeBackup"
}

if ($Mode -eq 'Upload') {
    $Commands += "call mkdir -p `"$RemoteMigrationDir`""
    $PhpMigrationBootstrapCode = 'require "/opt/lampp/htdocs/school-info/api/config.php";$p=db();$p->exec("CREATE TABLE IF NOT EXISTS deploy_migrations(name VARCHAR(190) NOT NULL PRIMARY KEY,applied_at DATETIME NOT NULL)");$tracked=(int)$p->query("SELECT COUNT(*) FROM deploy_migrations")->fetchColumn();if($tracked===0){$topics=(int)$p->query("SELECT COUNT(*) FROM topics")->fetchColumn();$records=(int)$p->query("SELECT COUNT(*) FROM records")->fetchColumn();$c1=(int)$p->query("SELECT COUNT(*) FROM topics WHERE department_id=4 AND chapter=1")->fetchColumn();$n=(int)$p->query("SELECT COUNT(*) FROM topics WHERE HEX(title) IN (' + $FiveTopicHexSql + ')")->fetchColumn();$h=(int)$p->query("SELECT COUNT(*) FROM records r JOIN topics t ON t.id=r.topic_id WHERE HEX(t.title) IN (' + $HealthTopicHexSql + ') AND r.academic_year BETWEEN 2566 AND 2568 AND r.term=0")->fetchColumn();$u=(int)$p->query("SELECT COUNT(*) FROM records r JOIN topics t ON t.id=r.topic_id WHERE HEX(t.title) IN (' + $PersonnelTopicHexSql + ') AND r.academic_year BETWEEN 2566 AND 2569 AND r.term=0")->fetchColumn();if($topics>=108&&$records>=316&&$c1>=22&&$n>=5&&$h>=9&&$u>=16){$names=[' + $MigrationPhpArray + '];$s=$p->prepare("INSERT IGNORE INTO deploy_migrations(name,applied_at) VALUES(?,NOW())");foreach($names as $name){$s->execute([$name]);}echo "MIGRATION_BASELINE tracked=".count($names).PHP_EOL;}}'
    $Commands += "call /opt/lampp/bin/php -r '$PhpMigrationBootstrapCode'"
    foreach ($MigrationName in $MigrationNames) {
        $LocalMigrationPath = Join-Path $LocalMigrationDir $MigrationName
        $RemoteMigrationPath = "$RemoteMigrationDir/$MigrationName"
        $Commands += "put `"$LocalMigrationPath`" `"$RemoteMigrationPath`""
        $PhpMigrationCode = 'require "/opt/lampp/htdocs/school-info/api/config.php";$p=db();$n="' + $MigrationName + '";$q=$p->prepare("SELECT COUNT(*) FROM deploy_migrations WHERE name=?");$q->execute([$n]);if((int)$q->fetchColumn()>0){echo "MIGRATION_SKIPPED=' + $MigrationName + '\n";}else{$f="' + $RemoteMigrationPath + '";$s=file_get_contents($f);if($s===false){fwrite(STDERR,"Cannot read migration\n");exit(2);}$p->exec($s);$q=$p->prepare("INSERT INTO deploy_migrations(name,applied_at) VALUES(?,NOW())");$q->execute([$n]);echo "MIGRATION_OK=' + $MigrationName + '\n";}'
        $Commands += "call /opt/lampp/bin/php -d memory_limit=-1 -d max_execution_time=0 -r '$PhpMigrationCode'"
    }
    $PhpVerifyMigrationCode = 'require "/opt/lampp/htdocs/school-info/api/config.php";$p=db();$q=function($s)use($p){return (int)$p->query($s)->fetchColumn();};$c1=$q("SELECT COUNT(*) FROM topics WHERE department_id=4 AND chapter=1");$n=$q("SELECT COUNT(*) FROM topics WHERE HEX(title) IN (' + $FiveTopicHexSql + ')");$h=$q("SELECT COUNT(*) FROM records r JOIN topics t ON t.id=r.topic_id WHERE HEX(t.title) IN (' + $HealthTopicHexSql + ') AND r.academic_year BETWEEN 2566 AND 2568 AND r.term=0");$u=$q("SELECT COUNT(*) FROM records r JOIN topics t ON t.id=r.topic_id WHERE HEX(t.title) IN (' + $PersonnelTopicHexSql + ') AND r.academic_year BETWEEN 2566 AND 2569 AND r.term=0");if($c1<20||$n<5||$h<9||$u<16){fwrite(STDERR,"Migration verification failed chapter1=".$c1." new_five=".$n." health_records=".$h." personnel_records=".$u."\n");exit(3);}echo "MIGRATION_VERIFY_OK chapter1=".$c1." new_five=".$n." health_records=".$h." personnel_records=".$u.PHP_EOL;'
    $Commands += "call /opt/lampp/bin/php -r '$PhpVerifyMigrationCode'"
}

if ($Mode -eq 'Inspect') {
    $Commands += "call /opt/lampp/bin/php -r '$PhpInspectCode'"
}

if ($Mode -notin @('Backup', 'Inspect')) {
    $Commands += "synchronize remote `"$LocalPackage`" `"$RemoteDir`" -criteria=either -transfer=binary -filemask=`"| /api/config.php; /uploads/; /raw-uploads/; /backups/`"$PreviewSwitch"
}

if ($Mode -eq 'Preview') {
    $Commands += "synchronize remote `"$LocalUploads`" `"$RemoteDir/uploads`" -criteria=size -transfer=binary -preview"
    $Commands += "synchronize remote `"$LocalRawUploads`" `"$RemoteDir/raw-uploads`" -criteria=size -transfer=binary -preview"
}

if ($Mode -eq 'Upload') {
    # ไม่มี -delete: ส่งเฉพาะรูปที่เพิ่ม/เปลี่ยนและไม่ลบรูปเดิมบนเซิร์ฟเวอร์
    $Commands += "synchronize remote `"$LocalUploads`" `"$RemoteDir/uploads`" -criteria=size -transfer=binary"
    $Commands += "synchronize remote `"$LocalRawUploads`" `"$RemoteDir/raw-uploads`" -criteria=size -transfer=binary"
    $Commands += "put `"$LocalSyncFile`" `"$RemoteSyncFile`""
    $Commands += "call /opt/lampp/bin/php -d memory_limit=-1 -d max_execution_time=0 `"$RemoteDir/api/deploy-data-sync.php`" import `"$RemoteSyncFile`""
    $Commands += "call rm -f `"$RemoteSyncFile`""
    foreach ($MigrationName in $MigrationNames) {
        $Commands += "call rm -f `"$RemoteMigrationDir/$MigrationName`""
    }
    $Commands += "call rmdir `"$RemoteMigrationDir`""
}

$Commands += 'exit'

try {
    Set-Content -LiteralPath $WinScpScript -Value $Commands -Encoding UTF8
    & $WinScp "/script=$WinScpScript" "/log=$WinScpLog" '/loglevel=0' '/nointeractiveinput'
    if ($LASTEXITCODE -ne 0) {
        throw "WinSCP failed with exit code $LASTEXITCODE. See log: $WinScpLog"
    }
}
finally {
    Remove-Item -LiteralPath $WinScpScript -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $LocalSyncFile -Force -ErrorAction SilentlyContinue
}

Write-Host ''
if ($Mode -eq 'Inspect') {
    Write-Host 'Server inspection completed. No server files or database rows were changed.' -ForegroundColor Green
} elseif ($Mode -eq 'Preview') {
    Write-Host 'Preview completed. No server files were changed.' -ForegroundColor Green
    Write-Host 'Review the list above before running an actual upload.'
} elseif ($Mode -eq 'Backup') {
    Write-Host 'Server backup completed and verified. No website files were uploaded.' -ForegroundColor Green
} else {
    Write-Host 'Server backup completed, then website/API upload and local data merge completed.' -ForegroundColor Green
    Write-Host 'Listed database migrations were applied and verified before the code upload.' -ForegroundColor Green
    Write-Host 'Local images were added without deleting existing server images.' -ForegroundColor Green
    Write-Host 'Local raw documents were added without deleting existing server documents.' -ForegroundColor Green
}
Write-Host "Log: $WinScpLog"

