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
    Write-Host '  api/config.php, uploads, raw-uploads, or backups'
    Write-Host 'Only the SQL files listed in deploy-migrations.txt will update the database.' -ForegroundColor Yellow
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
$WinScpLog = Join-Path $LogDir "winscp-$($Mode.ToLower())-$Timestamp.log"
$PreviewSwitch = if ($Mode -eq 'Preview') { ' -preview' } else { '' }
$RemoteCodeBackup = "$RemoteBackupDir/site-before-deploy-$Timestamp.tar.gz"
$RemoteMigrationDir = "/tmp/school-info-deploy-$Timestamp"
$PhpBackupCode = 'require "/opt/lampp/htdocs/school-info/api/config.php";require "/opt/lampp/htdocs/school-info/api/database-backup-lib.php";$n=save_automatic_backup();$d=(defined("BACKUP_DIR")&&BACKUP_DIR!=="")?BACKUP_DIR:"/opt/lampp/school-info-backups";$p=rtrim($d,"/\\").DIRECTORY_SEPARATOR.$n;if(!is_file($p)||filesize($p)<100){fwrite(STDERR,"Backup verification failed\n");exit(2);}echo "DATA_BACKUP=".$p.PHP_EOL;'
$PhpInspectCode = 'require "/opt/lampp/htdocs/school-info/api/config.php";$p=db();$q=function($s)use($p){return $p->query($s)->fetchColumn();};$i=["topics"=>(int)$q("SELECT COUNT(*) FROM topics"),"records"=>(int)$q("SELECT COUNT(*) FROM records"),"chapter1"=>(int)$q("SELECT COUNT(*) FROM topics WHERE department_id=4 AND chapter=1"),"updated_by"=>(int)$q("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=\"records\" AND column_name=\"updated_by\""),"raw_documents"=>(int)$q("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=\"raw_documents\""),"new_five_slots"=>(int)$q("SELECT COUNT(*) FROM topics WHERE (department_id=1 AND chapter=6 AND sort_order IN (53,54)) OR (department_id=1 AND chapter=9 AND sort_order=77) OR (department_id=4 AND chapter=5 AND sort_order=45) OR (department_id=4 AND chapter=3 AND sort_order=23)"),"years"=>(string)$q("SELECT GROUP_CONCAT(DISTINCT academic_year ORDER BY academic_year) FROM terms")];echo "PREFLIGHT=".json_encode($i).PHP_EOL;'

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
    foreach ($MigrationName in $MigrationNames) {
        $LocalMigrationPath = Join-Path $LocalMigrationDir $MigrationName
        $RemoteMigrationPath = "$RemoteMigrationDir/$MigrationName"
        $Commands += "put `"$LocalMigrationPath`" `"$RemoteMigrationPath`""
        $PhpMigrationCode = 'require "/opt/lampp/htdocs/school-info/api/config.php";$f="' + $RemoteMigrationPath + '";$s=file_get_contents($f);if($s===false){fwrite(STDERR,"Cannot read migration\n");exit(2);}db()->exec($s);echo "MIGRATION_OK=' + $MigrationName + '\n";'
        $Commands += "call /opt/lampp/bin/php -d memory_limit=-1 -d max_execution_time=0 -r '$PhpMigrationCode'"
    }
    $PhpVerifyMigrationCode = 'require "/opt/lampp/htdocs/school-info/api/config.php";$p=db();$c1=(int)$p->query("SELECT COUNT(*) FROM topics WHERE department_id=4 AND chapter=1")->fetchColumn();$n=(int)$p->query("SELECT COUNT(*) FROM topics WHERE (department_id=1 AND chapter=6 AND sort_order IN (53,54)) OR (department_id=1 AND chapter=9 AND sort_order=77) OR (department_id=4 AND chapter=5 AND sort_order=45) OR (department_id=4 AND chapter=3 AND sort_order=23)")->fetchColumn();if($c1<20||$n<5){fwrite(STDERR,"Migration verification failed\n");exit(3);}echo "MIGRATION_VERIFY_OK chapter1=".$c1." new_five=".$n.PHP_EOL;'
    $Commands += "call /opt/lampp/bin/php -r '$PhpVerifyMigrationCode'"
}

if ($Mode -eq 'Inspect') {
    $Commands += "call /opt/lampp/bin/php -r '$PhpInspectCode'"
}

if ($Mode -notin @('Backup', 'Inspect')) {
    $Commands += "synchronize remote `"$LocalPackage`" `"$RemoteDir`" -criteria=either -transfer=binary -filemask=`"| /api/config.php; /uploads/; /raw-uploads/; /backups/`"$PreviewSwitch"
}

if ($Mode -eq 'Upload') {
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
    Write-Host 'Server backup completed, then website/API upload completed.' -ForegroundColor Green
    Write-Host 'Listed database migrations were applied and verified before the code upload.' -ForegroundColor Green
}
Write-Host "Log: $WinScpLog"

