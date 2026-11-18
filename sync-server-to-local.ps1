param(
    [ValidateSet('Preview', 'Import')]
    [string]$Mode = 'Preview',
    [switch]$ConfirmPull
)

$ErrorActionPreference = 'Stop'
$ProjectDir = $PSScriptRoot
$WinScp = 'C:\Program Files (x86)\WinSCP\WinSCP.com'
$SavedSession = 'school-server'
$ServerHostKey = 'ssh-ed25519 255 DDhLH0/WI2JpE0ju2U2ICQpWrK7oetvblGujkhwlVqw'
$RemoteRoot = '/opt/lampp/htdocs/school-info'
$RemoteConfig = "$RemoteRoot/api/config.php"
$RemoteUploads = "$RemoteRoot/uploads"
$RemoteRawUploads = "$RemoteRoot/raw-uploads"
$LocalPhp = 'C:\xampp8.2\php\php.exe'
$LocalConfig = 'C:\xampp8.2\htdocs\school-info\api\config.php'
$LocalBackupLib = 'C:\xampp8.2\htdocs\school-info\api\database-backup-lib.php'
$LocalUploads = 'C:\xampp8.2\htdocs\school-info\uploads'
$LocalRawUploads = 'C:\xampp8.2\htdocs\school-info\raw-uploads'
$SyncTool = Join-Path $ProjectDir 'server\api\deploy-data-sync.php'
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LocalSnapshot = Join-Path $env:TEMP "school-info-server-snapshot-$Timestamp.json"
$RemoteTool = "/tmp/school-info-sync-tool-$Timestamp.php"
$RemoteSnapshot = "/tmp/school-info-server-snapshot-$Timestamp.json"
$LogDir = Join-Path $ProjectDir 'deploy-logs'

foreach ($RequiredPath in @($WinScp, $LocalPhp, $LocalConfig, $LocalBackupLib, $LocalUploads, $LocalRawUploads, $SyncTool)) {
    if (-not (Test-Path -LiteralPath $RequiredPath)) {
        throw "Required file or folder not found: $RequiredPath"
    }
}
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Invoke-SyncWinScp([string[]]$Commands, [string]$LogName) {
    $ScriptPath = Join-Path $env:TEMP "school-info-winscp-$LogName-$Timestamp.txt"
    $LogPath = Join-Path $LogDir "winscp-$LogName-$Timestamp.log"
    try {
        Set-Content -LiteralPath $ScriptPath -Value $Commands -Encoding UTF8
        & $WinScp "/script=$ScriptPath" "/log=$LogPath" '/loglevel=0' '/nointeractiveinput'
        if ($LASTEXITCODE -ne 0) {
            throw "WinSCP failed with exit code $LASTEXITCODE. See log: $LogPath"
        }
    }
    finally {
        Remove-Item -LiteralPath $ScriptPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  SERVER -> LOCAL DATA SYNC' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host "Mode: $Mode"
Write-Host 'Server data will never be changed by this script.' -ForegroundColor Green
Write-Host ''

try {
    $FetchCommands = @(
        'option batch abort'
        'option confirm off'
        "open `"$SavedSession`" -hostkey=`"$ServerHostKey`""
        "put `"$SyncTool`" `"$RemoteTool`""
        "call env SCHOOL_INFO_CONFIG=`"$RemoteConfig`" /opt/lampp/bin/php -d memory_limit=-1 -d max_execution_time=0 `"$RemoteTool`" export `"$RemoteSnapshot`""
        "get `"$RemoteSnapshot`" `"$LocalSnapshot`""
        "synchronize local `"$LocalUploads`" `"$RemoteUploads`" -criteria=size -transfer=binary -preview"
        "synchronize local `"$LocalRawUploads`" `"$RemoteRawUploads`" -criteria=size -transfer=binary -preview"
        "call rm -f `"$RemoteTool`" `"$RemoteSnapshot`""
        'exit'
    )
    Invoke-SyncWinScp $FetchCommands 'pull-preview'

    $PreviousConfig = $env:SCHOOL_INFO_CONFIG
    try {
        $env:SCHOOL_INFO_CONFIG = $LocalConfig
        & $LocalPhp $SyncTool compare $LocalSnapshot
        if ($LASTEXITCODE -ne 0) { throw "Server/local comparison failed with exit code $LASTEXITCODE" }
    }
    finally {
        $env:SCHOOL_INFO_CONFIG = $PreviousConfig
    }

    if ($Mode -eq 'Preview') {
        Write-Host ''
        Write-Host 'Preview completed. Local database and files were not changed.' -ForegroundColor Green
        exit 0
    }

    Write-Host ''
    Write-Host 'This will back up Local, download server images, and merge server records into Local.' -ForegroundColor Yellow
    Write-Host 'No Local records or images will be deleted.' -ForegroundColor Yellow
    $Confirmation = if ($ConfirmPull) { 'PULL' } else { Read-Host 'Type PULL to continue' }
    if ($Confirmation -cne 'PULL') {
        Write-Host 'Cancelled. Local data was not changed.' -ForegroundColor Yellow
        exit 0
    }

    $BackupPhpCode = @'
require 'C:/xampp8.2/htdocs/school-info/api/config.php';
require 'C:/xampp8.2/htdocs/school-info/api/database-backup-lib.php';
$n=save_automatic_backup();
echo 'LOCAL_BACKUP='.$n.PHP_EOL;
'@
    & $LocalPhp -d memory_limit=-1 -d max_execution_time=0 -r $BackupPhpCode
    if ($LASTEXITCODE -ne 0) { throw "Local backup failed with exit code $LASTEXITCODE" }

    $ImageCommands = @(
        'option batch abort'
        'option confirm off'
        "open `"$SavedSession`" -hostkey=`"$ServerHostKey`""
        "synchronize local `"$LocalUploads`" `"$RemoteUploads`" -criteria=size -transfer=binary"
        "synchronize local `"$LocalRawUploads`" `"$RemoteRawUploads`" -criteria=size -transfer=binary"
        'exit'
    )
    Invoke-SyncWinScp $ImageCommands 'pull-images'

    $PreviousConfig = $env:SCHOOL_INFO_CONFIG
    $PreviousUploads = $env:SCHOOL_INFO_UPLOADS_DIR
    $PreviousRawUploads = $env:SCHOOL_INFO_RAW_UPLOADS_DIR
    try {
        $env:SCHOOL_INFO_CONFIG = $LocalConfig
        $env:SCHOOL_INFO_UPLOADS_DIR = $LocalUploads
        $env:SCHOOL_INFO_RAW_UPLOADS_DIR = $LocalRawUploads
        & $LocalPhp $SyncTool import $LocalSnapshot
        if ($LASTEXITCODE -ne 0) { throw "Server data import failed with exit code $LASTEXITCODE" }
    }
    finally {
        $env:SCHOOL_INFO_CONFIG = $PreviousConfig
        $env:SCHOOL_INFO_UPLOADS_DIR = $PreviousUploads
        $env:SCHOOL_INFO_RAW_UPLOADS_DIR = $PreviousRawUploads
    }

    Write-Host ''
    Write-Host 'Server records and images were merged into Local successfully.' -ForegroundColor Green
    Write-Host 'Server data was not changed.' -ForegroundColor Green
}
finally {
    Remove-Item -LiteralPath $LocalSnapshot -Force -ErrorAction SilentlyContinue
}

