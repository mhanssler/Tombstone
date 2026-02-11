param(
  [string]$TaskName = "Tombstone Owlet Bridge",
  [string]$EnvFile = "$PSScriptRoot\.env.owlet-bridge",
  [switch]$RunNow,
  [switch]$UseSystemAccount
)

$ErrorActionPreference = "Stop"

$runner = Join-Path $PSScriptRoot "run_owlet_bridge.ps1"
if (!(Test-Path $runner)) { throw "Missing runner script: $runner" }
if (!(Test-Path $EnvFile)) { throw "Missing env file: $EnvFile" }

$pwsh = (Get-Command powershell.exe).Source
$action = New-ScheduledTaskAction -Execute $pwsh -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -EnvFile `"$EnvFile`""

$triggers = @(
  (New-ScheduledTaskTrigger -AtStartup),
  (New-ScheduledTaskTrigger -AtLogOn)
)

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Days 3650) `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1)

if ($UseSystemAccount) {
  $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
} else {
  $currentUser = "$env:USERDOMAIN\$env:USERNAME"
  $principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
}

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $triggers `
  -Settings $settings `
  -Principal $principal `
  -Description "Runs Tombstone Owlet bridge continuously and restarts on failure." `
  -Force | Out-Null

if ($RunNow) {
  Start-ScheduledTask -TaskName $TaskName
}

Write-Output "Installed scheduled task: $TaskName"
if ($UseSystemAccount) {
  Write-Output "Account: SYSTEM"
} else {
  Write-Output "Account: $env:USERDOMAIN\$env:USERNAME"
}
