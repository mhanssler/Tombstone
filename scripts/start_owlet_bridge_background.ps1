$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$bridgeScriptPath = Join-Path $PSScriptRoot 'owlet_bridge.py'

# If an older/manual bridge is running under a different python (e.g. C:\Python\python.exe),
# stop it so we only have one active loop writing to Supabase.
$allBridgePythons = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'python.exe' -and $_.CommandLine -and $_.CommandLine -like "*$bridgeScriptPath*"
}

$venvPythonPrefix = (Join-Path $PSScriptRoot '.venv\Scripts\python.exe')
$nonVenv = $allBridgePythons | Where-Object { $_.CommandLine -notlike "*$venvPythonPrefix*" }
foreach ($p in $nonVenv) {
  try { Stop-Process -Id $p.ProcessId -Force } catch { }
}

$existing = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'python.exe' -and $_.CommandLine -and $_.CommandLine -like "*$venvPythonPrefix*" -and $_.CommandLine -like "*$bridgeScriptPath*"
}

if ($existing) {
  Write-Output "Owlet bridge already running"
  exit 0
}

Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-NoProfile',
  '-WindowStyle', 'Hidden',
  '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $PSScriptRoot 'run_owlet_bridge.ps1')
)

Write-Output "Owlet bridge started"
