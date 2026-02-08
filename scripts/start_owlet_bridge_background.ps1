$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$bridgeScriptPath = Join-Path $PSScriptRoot 'owlet_bridge.py'

$existing = Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and $_.CommandLine -like "*$bridgeScriptPath*"
}

if ($existing) {
  Write-Output "Owlet bridge already running"
  exit 0
}

Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $PSScriptRoot 'run_owlet_bridge.ps1')
) -WindowStyle Hidden

Write-Output "Owlet bridge started"
