param(
  [switch]$Apply,
  [string]$CodexHome = $(if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE ".codex" }),
  [string]$OutputDir = $(Join-Path (Get-Location) ".tmp\codex-maintenance"),
  [string]$BackupRoot = $(Join-Path (Get-Location) ".tmp\codex-maintenance\backups"),
  [int]$OldSessionDays = 10,
  [int]$LargeSessionMB = 100,
  [string[]]$ArchiveSessionId = @(),
  [switch]$AllowIndexedSessionArchive,
  [switch]$ArchiveOldNonIndexedSessions,
  [switch]$RotateLogs,
  [switch]$PruneMissingConfigProjects,
  [switch]$NormalizeMarketplacePaths,
  [int]$Top = 25
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Format-Bytes {
  param([long]$Bytes)
  if ($Bytes -ge 1GB) { return ("{0:N2} GB" -f ($Bytes / 1GB)) }
  if ($Bytes -ge 1MB) { return ("{0:N2} MB" -f ($Bytes / 1MB)) }
  if ($Bytes -ge 1KB) { return ("{0:N2} KB" -f ($Bytes / 1KB)) }
  return "$Bytes B"
}

function Get-FileItems {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return @() }
  return @(Get-ChildItem -LiteralPath $Path -Force -Recurse -File -ErrorAction SilentlyContinue)
}

function Get-SessionIdFromPath {
  param([string]$Path)
  $match = [regex]::Match($Path, 'rollout-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$', "IgnoreCase")
  if ($match.Success) { return $match.Groups[1].Value }
  return $null
}

function Get-SessionStartFromPath {
  param([string]$Path)
  $match = [regex]::Match($Path, 'rollout-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-', "IgnoreCase")
  if (-not $match.Success) { return $null }
  try {
    return [datetime]::new(
      [int]$match.Groups[1].Value,
      [int]$match.Groups[2].Value,
      [int]$match.Groups[3].Value,
      [int]$match.Groups[4].Value,
      [int]$match.Groups[5].Value,
      [int]$match.Groups[6].Value
    )
  } catch {
    return $null
  }
}

function Get-IndexedSessions {
  param([string]$IndexPath)
  $indexed = @{}
  if (-not (Test-Path -LiteralPath $IndexPath)) { return $indexed }

  Get-Content -LiteralPath $IndexPath -ErrorAction SilentlyContinue | ForEach-Object {
    if (-not $_) { return }
    try {
      $row = $_ | ConvertFrom-Json
      if ($row.id) {
        $indexed[$row.id] = [pscustomobject]@{
          id = $row.id
          threadName = $row.thread_name
          updatedAt = $row.updated_at
        }
      }
    } catch {
      # Keep going; the report will still show file-based candidates.
    }
  }

  return $indexed
}

function Get-SessionRows {
  param([string]$SessionsPath, [hashtable]$IndexedSessions)
  $files = @(Get-FileItems -Path $SessionsPath)
  return @(
    foreach ($file in $files) {
      $id = Get-SessionIdFromPath -Path $file.FullName
      $start = Get-SessionStartFromPath -Path $file.FullName
      $indexInfo = $null
      if ($id -and $IndexedSessions.ContainsKey($id)) { $indexInfo = $IndexedSessions[$id] }
      [pscustomobject]@{
        id = $id
        threadName = if ($indexInfo) { $indexInfo.threadName } else { "" }
        indexed = [bool]$indexInfo
        start = $start
        lastWrite = $file.LastWriteTime
        size = Format-Bytes $file.Length
        bytes = $file.Length
        path = $file.FullName
      }
    }
  )
}

function Assert-CodexClosed {
  $codexProcesses = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -ieq "Codex" -or $_.ProcessName -ieq "codex" })
  if ($codexProcesses.Count -gt 0) {
    $summary = ($codexProcesses | Sort-Object Id | ForEach-Object { "$($_.ProcessName):$($_.Id)" }) -join ", "
    throw "Codex appears to be running ($summary). Close Codex before running with -Apply."
  }
}

function Copy-BackupItem {
  param([string]$Source, [string]$DestinationRoot)
  if (-not (Test-Path -LiteralPath $Source)) { return $null }
  $leaf = Split-Path -Path $Source -Leaf
  $destination = Join-Path $DestinationRoot $leaf
  $item = Get-Item -LiteralPath $Source -Force
  if ($item.PSIsContainer) {
    Copy-Item -LiteralPath $Source -Destination $destination -Recurse -Force
  } else {
    Copy-Item -LiteralPath $Source -Destination $destination -Force
  }
  return $destination
}

function Move-FileWithUniqueName {
  param([string]$Source, [string]$DestinationDir)
  if (-not (Test-Path -LiteralPath $Source)) { return $null }
  New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
  $leaf = Split-Path -Path $Source -Leaf
  $target = Join-Path $DestinationDir $leaf
  if (Test-Path -LiteralPath $target) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($leaf)
    $ext = [System.IO.Path]::GetExtension($leaf)
    $target = Join-Path $DestinationDir ("$base.$((Get-Date).ToString('yyyyMMdd-HHmmss'))$ext")
  }
  Move-Item -LiteralPath $Source -Destination $target
  return $target
}

function Update-ConfigToml {
  param(
    [string]$ConfigPath,
    [switch]$PruneMissingProjects,
    [switch]$NormalizeMarketplaces
  )
  if (-not (Test-Path -LiteralPath $ConfigPath)) { return @() }

  $changes = New-Object System.Collections.Generic.List[object]
  $lines = @(Get-Content -LiteralPath $ConfigPath)
  $output = New-Object System.Collections.Generic.List[string]
  $skipProject = $false
  $skipProjectName = ""

  foreach ($line in $lines) {
    $projectMatch = [regex]::Match($line, "^\[projects\.'(.+)'\]\s*$")
    $sectionMatch = [regex]::Match($line, "^\[.+\]\s*$")

    if ($skipProject -and $sectionMatch.Success) {
      $skipProject = $false
      $skipProjectName = ""
    }

    if (-not $skipProject -and $PruneMissingProjects -and $projectMatch.Success) {
      $projectPath = $projectMatch.Groups[1].Value
      if (-not (Test-Path -LiteralPath $projectPath)) {
        $skipProject = $true
        $skipProjectName = $projectPath
        $changes.Add([pscustomobject]@{ action = "prune_missing_project"; detail = $projectPath })
        continue
      }
    }

    if ($skipProject) {
      if ($line.Trim().Length -gt 0) {
        continue
      }
      continue
    }

    $nextLine = $line
    if ($NormalizeMarketplaces -and $line -match "^source = '\\\\\?\\(.+)'$") {
      $nextLine = "source = '$($Matches[1])'"
      $changes.Add([pscustomobject]@{ action = "normalize_marketplace_path"; detail = $Matches[1] })
    }
    $output.Add($nextLine)
  }

  Set-Content -LiteralPath $ConfigPath -Value $output -Encoding UTF8
  return @($changes)
}

function Write-Report {
  param(
    [string]$Path,
    [object[]]$Actions,
    [object[]]$LargeIndexed,
    [object[]]$OldNonIndexed,
    [object[]]$ExplicitArchive,
    [object[]]$LogFiles,
    [object[]]$ConfigFindings
  )

  $md = [System.Text.StringBuilder]::new()
  [void]$md.AppendLine("# Codex Offline Maintenance")
  [void]$md.AppendLine("")
  [void]$md.AppendLine("- Generated: $(Get-Date)")
  [void]$md.AppendLine("- Mode: $(if ($Apply) { 'apply' } else { 'dry-run' })")
  [void]$md.AppendLine("- Codex home: ``$codexHomeFull``")
  if ($Apply -and $backupDirForReport) {
    [void]$md.AppendLine("- Backup: ``$backupDirForReport``")
  }
  [void]$md.AppendLine("")

  [void]$md.AppendLine("## Actions")
  Add-MarkdownTable $md $Actions @("status", "action", "detail")
  [void]$md.AppendLine("")
  [void]$md.AppendLine("## Large Indexed Sessions")
  Add-MarkdownTable $md $LargeIndexed @("size", "threadName", "lastWrite", "id", "path")
  [void]$md.AppendLine("")
  [void]$md.AppendLine("## Old Non-Indexed Session Candidates")
  Add-MarkdownTable $md $OldNonIndexed @("size", "start", "lastWrite", "id", "path")
  [void]$md.AppendLine("")
  [void]$md.AppendLine("## Explicit Archive Targets")
  Add-MarkdownTable $md $ExplicitArchive @("size", "threadName", "indexed", "lastWrite", "id", "path")
  [void]$md.AppendLine("")
  [void]$md.AppendLine("## Log Rotation Targets")
  Add-MarkdownTable $md $LogFiles @("size", "lastWrite", "path")
  [void]$md.AppendLine("")
  [void]$md.AppendLine("## Config Findings")
  Add-MarkdownTable $md $ConfigFindings @("action", "detail")
  [void]$md.AppendLine("")
  [void]$md.AppendLine("## Restore Note")
  [void]$md.AppendLine("")
  [void]$md.AppendLine("This script moves files instead of deleting them. If something looks wrong after restart, close Codex again and move the archived files back from the backup or archive path shown above.")

  Set-Content -LiteralPath $Path -Value $md.ToString() -Encoding UTF8
}

function Add-MarkdownTable {
  param(
    [System.Text.StringBuilder]$Builder,
    [object[]]$Rows,
    [string[]]$Columns
  )
  if (-not $Rows -or $Rows.Count -eq 0) {
    [void]$Builder.AppendLine("_No rows._")
    return
  }
  [void]$Builder.AppendLine("| " + ($Columns -join " | ") + " |")
  [void]$Builder.AppendLine("| " + (($Columns | ForEach-Object { "---" }) -join " | ") + " |")
  foreach ($row in $Rows) {
    $values = foreach ($column in $Columns) {
      $value = $row.$column
      if ($null -eq $value) { "" } else { ($value.ToString() -replace '\|', '\|') }
    }
    [void]$Builder.AppendLine("| " + ($values -join " | ") + " |")
  }
}

$codexHomeFull = (Resolve-Path -LiteralPath $CodexHome).Path
$now = Get-Date
$stamp = $now.ToString("yyyyMMdd-HHmmss")
$sessionsPath = Join-Path $codexHomeFull "sessions"
$archivedSessionsPath = Join-Path $codexHomeFull "archived_sessions"
$sessionIndexPath = Join-Path $codexHomeFull "session_index.jsonl"
$configPath = Join-Path $codexHomeFull "config.toml"
$archiveRoot = Join-Path $codexHomeFull "maintenance_archives"
$logArchiveDir = Join-Path $archiveRoot "logs\$stamp"
$backupDir = Join-Path $BackupRoot $stamp

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$indexed = Get-IndexedSessions -IndexPath $sessionIndexPath
$sessions = @(Get-SessionRows -SessionsPath $sessionsPath -IndexedSessions $indexed)
$oldCutoff = $now.AddDays(-1 * $OldSessionDays)
$largeBytes = [int64]$LargeSessionMB * 1MB
$largeIndexed = @($sessions | Where-Object { $_.indexed -and $_.bytes -ge $largeBytes } | Sort-Object bytes -Descending | Select-Object -First $Top)
$oldNonIndexed = @($sessions | Where-Object { -not $_.indexed -and $_.start -and $_.start -lt $oldCutoff } | Sort-Object start | Select-Object -First $Top)
$explicitArchiveTargets = @(
  foreach ($id in $ArchiveSessionId) {
    $sessions | Where-Object { $_.id -eq $id }
  }
)
$missingArchiveIds = @(
  foreach ($id in $ArchiveSessionId) {
    if (-not ($sessions | Where-Object { $_.id -eq $id })) { $id }
  }
)

$logFiles = @(
  "logs_2.sqlite",
  "logs_2.sqlite-wal",
  "logs_2.sqlite-shm"
) | ForEach-Object {
  $path = Join-Path $codexHomeFull $_
  if (Test-Path -LiteralPath $path) {
    $file = Get-Item -LiteralPath $path -Force
    [pscustomobject]@{
      size = Format-Bytes $file.Length
      bytes = $file.Length
      lastWrite = $file.LastWriteTime
      path = $file.FullName
    }
  }
}

$actions = New-Object System.Collections.Generic.List[object]
$configFindings = New-Object System.Collections.Generic.List[object]

if ($Apply) {
  Assert-CodexClosed
  if ($missingArchiveIds.Count -gt 0) {
    throw "ArchiveSessionId not found: $($missingArchiveIds -join ', ')"
  }
  $indexedArchiveTargets = @($explicitArchiveTargets | Where-Object { $_.indexed })
  if ($indexedArchiveTargets.Count -gt 0 -and -not $AllowIndexedSessionArchive) {
    $ids = ($indexedArchiveTargets | ForEach-Object { "$($_.id) [$($_.threadName)]" }) -join ", "
    throw "Refusing to archive indexed active sessions by default: $ids. Use Codex UI to archive these when possible, or rerun with -AllowIndexedSessionArchive only after accepting that the sidebar/index may need recovery from backup."
  }
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

  $backupSources = @(
    "config.toml",
    ".codex-global-state.json",
    ".codex-global-state.json.bak",
    "session_index.jsonl",
    "state_5.sqlite",
    "state_5.sqlite-wal",
    "state_5.sqlite-shm",
    "goals_1.sqlite",
    "goals_1.sqlite-wal",
    "goals_1.sqlite-shm",
    "memories",
    "skills",
    "plugins",
    "automations"
  )

  foreach ($sourceName in $backupSources) {
    $source = Join-Path $codexHomeFull $sourceName
    $destination = Copy-BackupItem -Source $source -DestinationRoot $backupDir
    if ($destination) {
      $actions.Add([pscustomobject]@{ status = "done"; action = "backup"; detail = "$source -> $destination" })
    }
  }

  foreach ($target in $explicitArchiveTargets) {
    $sessionBackupDir = Join-Path $backupDir "targeted-sessions"
    New-Item -ItemType Directory -Path $sessionBackupDir -Force | Out-Null
    Copy-Item -LiteralPath $target.path -Destination (Join-Path $sessionBackupDir (Split-Path -Path $target.path -Leaf)) -Force
    $movedTo = Move-FileWithUniqueName -Source $target.path -DestinationDir $archivedSessionsPath
    $actions.Add([pscustomobject]@{ status = "done"; action = "archive_explicit_session"; detail = "$($target.id) -> $movedTo" })
  }

  if ($ArchiveOldNonIndexedSessions) {
    foreach ($target in $oldNonIndexed) {
      $sessionBackupDir = Join-Path $backupDir "old-non-indexed-sessions"
      New-Item -ItemType Directory -Path $sessionBackupDir -Force | Out-Null
      Copy-Item -LiteralPath $target.path -Destination (Join-Path $sessionBackupDir (Split-Path -Path $target.path -Leaf)) -Force
      $movedTo = Move-FileWithUniqueName -Source $target.path -DestinationDir $archivedSessionsPath
      $actions.Add([pscustomobject]@{ status = "done"; action = "archive_old_non_indexed_session"; detail = "$($target.id) -> $movedTo" })
    }
  }

  if ($RotateLogs) {
    foreach ($log in $logFiles) {
      $movedTo = Move-FileWithUniqueName -Source $log.path -DestinationDir $logArchiveDir
      $actions.Add([pscustomobject]@{ status = "done"; action = "rotate_log"; detail = "$($log.path) -> $movedTo" })
    }
  }

  if ($PruneMissingConfigProjects -or $NormalizeMarketplacePaths) {
    $changes = Update-ConfigToml -ConfigPath $configPath -PruneMissingProjects:$PruneMissingConfigProjects -NormalizeMarketplaces:$NormalizeMarketplacePaths
    foreach ($change in $changes) {
      $configFindings.Add($change)
      $actions.Add([pscustomobject]@{ status = "done"; action = $change.action; detail = $change.detail })
    }
  }

  if ($actions.Count -eq 0) {
    $actions.Add([pscustomobject]@{ status = "noop"; action = "apply"; detail = "No apply actions were selected." })
  }
} else {
  $actions.Add([pscustomobject]@{ status = "dry-run"; action = "backup"; detail = "Would back up config, state DBs, index, memories, skills, plugins, and automations." })
  foreach ($target in $explicitArchiveTargets) {
    $risk = if ($target.indexed) { "indexed active session; apply requires -AllowIndexedSessionArchive" } else { "non-indexed session" }
    $actions.Add([pscustomobject]@{ status = "dry-run"; action = "archive_explicit_session"; detail = "$($target.id) ($risk)" })
  }
  foreach ($id in $missingArchiveIds) {
    $actions.Add([pscustomobject]@{ status = "warning"; action = "archive_explicit_session"; detail = "ID not found: $id" })
  }
  if ($ArchiveOldNonIndexedSessions) {
    foreach ($target in $oldNonIndexed) {
      $actions.Add([pscustomobject]@{ status = "dry-run"; action = "archive_old_non_indexed_session"; detail = $target.id })
    }
  }
  if ($RotateLogs) {
    foreach ($log in $logFiles) {
      $actions.Add([pscustomobject]@{ status = "dry-run"; action = "rotate_log"; detail = $log.path })
    }
  }
  if ($PruneMissingConfigProjects) {
    $actions.Add([pscustomobject]@{ status = "dry-run"; action = "prune_missing_config_projects"; detail = "Would remove config project sections whose paths do not exist." })
  }
  if ($NormalizeMarketplacePaths) {
    $actions.Add([pscustomobject]@{ status = "dry-run"; action = "normalize_marketplace_paths"; detail = "Would rewrite marketplace source paths from \\?\C:\... to C:\..." })
  }
}

$jsonPath = Join-Path $OutputDir "codex-offline-maintenance-$stamp.json"
$mdPath = Join-Path $OutputDir "codex-offline-maintenance-$stamp.md"
$modeName = "dry-run"
if ($Apply) { $modeName = "apply" }
$backupDirForReport = $null
if ($Apply) { $backupDirForReport = $backupDir }
$actionsForReport = @($actions | ForEach-Object { $_ })
$configFindingsForReport = @($configFindings | ForEach-Object { $_ })

$result = [ordered]@{
  generatedAt = $now
  mode = $modeName
  codexHome = $codexHomeFull
  backupDir = $backupDirForReport
  largeIndexedSessions = $largeIndexed
  oldNonIndexedSessionCandidates = $oldNonIndexed
  explicitArchiveTargets = $explicitArchiveTargets
  logRotationTargets = $logFiles
  configFindings = $configFindingsForReport
  actions = $actionsForReport
}

$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
Write-Report -Path $mdPath -Actions $actionsForReport -LargeIndexed $largeIndexed -OldNonIndexed $oldNonIndexed -ExplicitArchive $explicitArchiveTargets -LogFiles $logFiles -ConfigFindings $configFindingsForReport

Write-Output "Offline maintenance report written:"
Write-Output $mdPath
Write-Output $jsonPath
if (-not $Apply) {
  Write-Output "Dry-run only. Add -Apply after closing Codex to make changes."
}
