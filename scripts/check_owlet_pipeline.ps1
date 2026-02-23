param(
  [string]$EnvFile = "$PSScriptRoot\.env.owlet-bridge",
  [int]$StaleMinutes = 5
)

$ErrorActionPreference = 'Stop'

function Load-EnvFile {
  param([string]$Path)

  if (!(Test-Path $Path)) {
    throw "Bridge env file not found: $Path"
  }

  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $name, $value = $_ -split '=', 2
    if (-not $name -or $null -eq $value) { return }
    [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
  }
}

function Require-Env {
  param([string]$Name)
  $v = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ([string]::IsNullOrWhiteSpace($v)) {
    throw "Missing required env var: $Name"
  }
  return $v
}

Load-EnvFile -Path $EnvFile

$supabaseUrl = (Require-Env -Name 'SUPABASE_URL').TrimEnd('/')
$serviceRoleKey = Require-Env -Name 'SUPABASE_SERVICE_ROLE_KEY'
$childId = [Environment]::GetEnvironmentVariable('TOMBSTONE_CHILD_ID', 'Process')

$headers = @{
  apikey        = $serviceRoleKey
  Authorization = "Bearer $serviceRoleKey"
}

$latestUri = "$supabaseUrl/rest/v1/owlet_readings?select=id,childId,recordedAt,updatedAt,sleepState,sockConnected,heartRateBpm,oxygenSaturationPct&order=recordedAt.desc&limit=1"
if (-not [string]::IsNullOrWhiteSpace($childId)) {
  $latestUri += "&childId=eq.$childId"
}

try {
  $latest = Invoke-RestMethod -Uri $latestUri -Method Get -Headers $headers
} catch {
  Write-Host "FAIL: Could not reach Supabase REST endpoint."
  Write-Host ("URL: {0}" -f $supabaseUrl)
  Write-Host ("Error: {0}" -f $_.Exception.Message)
  exit 3
}
if (-not $latest -or $latest.Count -eq 0) {
  Write-Host "FAIL: No owlet_readings rows found."
  if (-not [string]::IsNullOrWhiteSpace($childId)) {
    Write-Host "Checked childId: $childId"
  }
  exit 2
}

$row = $latest[0]
$nowUtc = [DateTimeOffset]::UtcNow
$recordedUtc = [DateTimeOffset]::FromUnixTimeMilliseconds([int64]$row.recordedAt)
$age = $nowUtc - $recordedUtc
$isFresh = $age.TotalMinutes -le $StaleMinutes

$windowStartMs = [int64]($nowUtc.AddMinutes(-$StaleMinutes).ToUnixTimeMilliseconds())
$recentUri = "$supabaseUrl/rest/v1/owlet_readings?select=id&recordedAt=gte.$windowStartMs&order=recordedAt.desc&limit=200"
if (-not [string]::IsNullOrWhiteSpace($childId)) {
  $recentUri += "&childId=eq.$childId"
}
try {
  $recent = Invoke-RestMethod -Uri $recentUri -Method Get -Headers $headers
} catch {
  Write-Host "WARN: Could not query recent window; continuing with latest row only."
  Write-Host ("Error: {0}" -f $_.Exception.Message)
  $recent = @()
}
$recentCount = if ($recent) { $recent.Count } else { 0 }

$status = if ($isFresh) { 'PASS' } else { 'FAIL' }
Write-Host ("{0}: Owlet -> Supabase health check" -f $status)
Write-Host ("Latest recordedAt (UTC): {0}" -f $recordedUtc.ToString('yyyy-MM-dd HH:mm:ss'))
Write-Host ("Age: {0:N1} minutes (threshold: {1} minutes)" -f $age.TotalMinutes, $StaleMinutes)
Write-Host ("Rows in last {0} minutes: {1}" -f $StaleMinutes, $recentCount)
Write-Host ("Latest sleepState: {0}" -f ($(if ($row.sleepState) { $row.sleepState } else { 'unknown' })))
Write-Host ("Latest sockConnected: {0}" -f ($(if ($null -ne $row.sockConnected) { [string]$row.sockConnected } else { 'unknown' })))
if ($null -ne $row.heartRateBpm) { Write-Host ("Latest HR: {0} bpm" -f $row.heartRateBpm) }
if ($null -ne $row.oxygenSaturationPct) { Write-Host ("Latest SpO2: {0}%" -f $row.oxygenSaturationPct) }
if (-not [string]::IsNullOrWhiteSpace($childId)) { Write-Host ("childId filter: {0}" -f $childId) }

if ($isFresh) {
  exit 0
}

exit 1
