param(
    [ValidateSet('Preview', 'Upload')]
    [string]$Mode = 'Preview'
)

$ErrorActionPreference = 'Stop'
$ProjectDir = $PSScriptRoot
$LocalPackage = Join-Path $ProjectDir 'deploy\school-info'
$RemoteDir = '/opt/lampp/htdocs/school-info'
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

if ($Mode -eq 'Upload') {
    Write-Host 'This will overwrite changed website/API files on the school server.' -ForegroundColor Yellow
    Write-Host 'It will NOT delete remote files and will NOT touch:' -ForegroundColor Yellow
    Write-Host '  api/config.php, uploads, raw-uploads, backups, or the database'
    $Confirmation = Read-Host 'Type DEPLOY to continue'
    if ($Confirmation -cne 'DEPLOY') {
        Write-Host 'Cancelled. Nothing was uploaded.' -ForegroundColor Yellow
        exit 0
    }
}

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

if (-not (Test-Path -LiteralPath $LocalPackage)) {
    throw "Deployment package not found: $LocalPackage"
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$WinScpScript = Join-Path $env:TEMP "school-info-winscp-$Timestamp.txt"
$WinScpLog = Join-Path $LogDir "winscp-$($Mode.ToLower())-$Timestamp.log"
$PreviewSwitch = if ($Mode -eq 'Preview') { ' -preview' } else { '' }

$Commands = @(
    'option batch abort'
    'option confirm off'
    "open `"$SavedSession`" -hostkey=`"$ServerHostKey`""
    "synchronize remote `"$LocalPackage`" `"$RemoteDir`" -criteria=either -transfer=binary -filemask=`"| /api/config.php; /uploads/; /raw-uploads/; /backups/`"$PreviewSwitch"
    'exit'
)

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
if ($Mode -eq 'Preview') {
    Write-Host 'Preview completed. No server files were changed.' -ForegroundColor Green
    Write-Host 'Review the list above before running an actual upload.'
} else {
    Write-Host 'Website/API upload completed.' -ForegroundColor Green
    Write-Host 'Database SQL files were packaged locally only and were not imported.' -ForegroundColor Yellow
}
Write-Host "Log: $WinScpLog"

