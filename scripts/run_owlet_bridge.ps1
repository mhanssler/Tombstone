param(
  [string]$EnvFile = "$PSScriptRoot\.env.owlet-bridge"
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$pythonExe = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
$bridgeScript = Join-Path $PSScriptRoot 'owlet_bridge.py'
$logFile = Join-Path $PSScriptRoot 'owlet_bridge.log'

if (!(Test-Path $pythonExe)) { throw "Python venv not found at $pythonExe" }
if (!(Test-Path $bridgeScript)) { throw "Bridge script not found at $bridgeScript" }
if (!(Test-Path $EnvFile)) { throw "Bridge env file not found at $EnvFile" }

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $name, $value = $_ -split '=', 2
  $cleanName = $name.Trim()
  $cleanValue = $value.Trim()
  [Environment]::SetEnvironmentVariable($cleanName, $cleanValue, 'Process')
}

Set-Location $PSScriptRoot

# Windows PowerShell 5.1 turns native stderr into error records (NativeCommandError).
# Use cmd.exe redirection so both stdout/stderr go to the log without PowerShell error handling.
$pythonExeQuoted = '"' + $pythonExe + '"'
$bridgeScriptQuoted = '"' + $bridgeScript + '"'
$logFileQuoted = '"' + $logFile + '"'

cmd.exe /c "$pythonExeQuoted -u $bridgeScriptQuoted >> $logFileQuoted 2>&1"
