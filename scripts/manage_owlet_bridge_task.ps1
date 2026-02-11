param(
  [ValidateSet("start", "stop", "status", "remove", "logs")]
  [string]$Action = "status",
  [string]$TaskName = "Tombstone Owlet Bridge",
  [int]$Tail = 100
)

$ErrorActionPreference = "Stop"

function Get-TaskIfExists {
  param([string]$Name)
  try {
    return Get-ScheduledTask -TaskName $Name -ErrorAction Stop
  } catch {
    return $null
  }
}

switch ($Action) {
  "start" {
    $task = Get-TaskIfExists -Name $TaskName
    if (-not $task) { throw "Task not found: $TaskName" }
    Start-ScheduledTask -TaskName $TaskName
    Write-Output "Started: $TaskName"
  }
  "stop" {
    $task = Get-TaskIfExists -Name $TaskName
    if (-not $task) { throw "Task not found: $TaskName" }
    Stop-ScheduledTask -TaskName $TaskName
    Write-Output "Stopped: $TaskName"
  }
  "status" {
    $task = Get-TaskIfExists -Name $TaskName
    if (-not $task) {
      Write-Output "Task not found: $TaskName"
      exit 0
    }
    $info = Get-ScheduledTaskInfo -TaskName $TaskName
    [pscustomobject]@{
      TaskName        = $task.TaskName
      State           = $task.State
      LastRunTime     = $info.LastRunTime
      LastTaskResult  = $info.LastTaskResult
      NextRunTime     = $info.NextRunTime
      NumberOfMissedRuns = $info.NumberOfMissedRuns
    } | Format-List
  }
  "remove" {
    $task = Get-TaskIfExists -Name $TaskName
    if (-not $task) {
      Write-Output "Task not found: $TaskName"
      exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Output "Removed: $TaskName"
  }
  "logs" {
    $logFile = Join-Path $PSScriptRoot "owlet_bridge.log"
    if (!(Test-Path $logFile)) {
      throw "Log file not found: $logFile"
    }
    Get-Content $logFile -Tail $Tail
  }
}
