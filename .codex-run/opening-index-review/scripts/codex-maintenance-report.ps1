param(
  [string]$CodexHome = $(if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE ".codex" }),
  [string]$OutputDir = $(Join-Path (Get-Location) ".tmp\codex-maintenance"),
  [int]$Top = 25,
  [int]$OldSessionDays = 10
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

function Get-DirSummary {
  param([string]$Name, [string]$Path)
  $files = @(Get-FileItems -Path $Path)
  $sum = 0
  if ($files.Count -gt 0) {
    $measure = $files | Measure-Object -Property Length -Sum
    $sum = $measure.Sum
  }
  $bytes = [long]$sum
  $newestWrite = $null
  if ($files.Count -gt 0) {
    $newestWrite = ($files | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
  }
  [pscustomobject]@{
    name = $Name
    path = $Path
    exists = Test-Path -LiteralPath $Path
    fileCount = $files.Count
    bytes = $bytes
    size = Format-Bytes $bytes
    newestWrite = $newestWrite
  }
}

function Get-TopFiles {
  param([string[]]$Paths, [int]$Limit)
  $items = foreach ($path in $Paths) {
    Get-FileItems -Path $path
  }
  return @(
    $items |
      Group-Object FullName |
      ForEach-Object { $_.Group | Select-Object -First 1 } |
      Sort-Object Length -Descending |
      Select-Object -First $Limit |
      ForEach-Object {
        [pscustomobject]@{
          size = Format-Bytes $_.Length
          bytes = $_.Length
          lastWrite = $_.LastWriteTime
          path = $_.FullName
        }
      }
  )
}

function Get-RootFiles {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return @() }
  return @(
    Get-ChildItem -LiteralPath $Path -Force -File -ErrorAction SilentlyContinue |
      Sort-Object Length -Descending |
      ForEach-Object {
        [pscustomobject]@{
          size = Format-Bytes $_.Length
          bytes = $_.Length
          lastWrite = $_.LastWriteTime
          name = $_.Name
          path = $_.FullName
        }
      }
  )
}

function Get-ProcessSnapshot {
  $interesting = "codex|node|npm|vite|tsx|webpack|electron"
  return @(
    Get-Process -ErrorAction SilentlyContinue |
      Where-Object { $_.ProcessName -match $interesting } |
      Sort-Object ProcessName, Id |
      ForEach-Object {
        [pscustomobject]@{
          name = $_.ProcessName
          id = $_.Id
          cpu = $_.CPU
          workingSet = Format-Bytes $_.WorkingSet64
          workingSetBytes = $_.WorkingSet64
          startTime = try { $_.StartTime } catch { $null }
        }
      }
  )
}

function Get-PathFindings {
  param([string[]]$Files)

  $findings = New-Object System.Collections.Generic.List[object]
  $pathRegex = '(\\\\\?\\[A-Za-z]:\\[^"''\s,;\]\)]+)|([A-Za-z]:\\[^"''\s,;\]\)]+)'

  foreach ($file in $Files) {
    if (-not (Test-Path -LiteralPath $file)) { continue }
    $text = Get-Content -LiteralPath $file -Raw -ErrorAction SilentlyContinue
    if (-not $text) { continue }

    if ($text -match '\\\\\?\\[A-Za-z]:\\') {
      $findings.Add([pscustomobject]@{
        kind = "extended_path_prefix"
        file = $file
        detail = "Contains Windows extended path prefix \\?\."
      })
    }

    foreach ($match in [regex]::Matches($text, $pathRegex)) {
      $rawPath = $match.Value.TrimEnd(".", ":", "`"", "'", ">", "<")
      $normalPath = $rawPath -replace '^\\\\\?\\', ''
      $pathExists = $false
      try {
        $pathExists = Test-Path -LiteralPath $normalPath
      } catch {
        $pathExists = $false
      }
      if ($normalPath -match '^[A-Za-z]:\\' -and -not $pathExists) {
        $findings.Add([pscustomobject]@{
          kind = "missing_path_reference"
          file = $file
          detail = $rawPath
        })
      }
    }
  }

  return @($findings | Sort-Object kind, file, detail -Unique)
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
$worktreesPath = Join-Path $codexHomeFull "worktrees"
$archivedWorktreesPath = Join-Path $codexHomeFull "archived_worktrees"
$pluginsPath = Join-Path $codexHomeFull "plugins"
$skillsPath = Join-Path $codexHomeFull "skills"
$memoriesPath = Join-Path $codexHomeFull "memories"
$automationsPath = Join-Path $codexHomeFull "automations"

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$dirSummaries = @(
  Get-DirSummary "sessions" $sessionsPath
  Get-DirSummary "archived_sessions" $archivedSessionsPath
  Get-DirSummary "worktrees" $worktreesPath
  Get-DirSummary "archived_worktrees" $archivedWorktreesPath
  Get-DirSummary "plugins" $pluginsPath
  Get-DirSummary "skills" $skillsPath
  Get-DirSummary "memories" $memoriesPath
  Get-DirSummary "automations" $automationsPath
)

$sessionFiles = Get-FileItems -Path $sessionsPath
$oldSessionCutoff = $now.AddDays(-1 * $OldSessionDays)
$oldActiveSessions = @(
  $sessionFiles |
    Where-Object { $_.LastWriteTime -lt $oldSessionCutoff } |
    Sort-Object LastWriteTime |
    Select-Object -First $Top |
    ForEach-Object {
      [pscustomobject]@{
        size = Format-Bytes $_.Length
        lastWrite = $_.LastWriteTime
        path = $_.FullName
      }
    }
)

$rootFiles = Get-RootFiles -Path $codexHomeFull
$topFiles = Get-TopFiles -Paths @(
  $codexHomeFull
) -Limit $Top

$configFiles = @(
  Join-Path $codexHomeFull "config.toml"
  Join-Path $codexHomeFull ".codex-global-state.json"
  Join-Path $codexHomeFull "session_index.jsonl"
) | Where-Object { Test-Path -LiteralPath $_ }

$pathFindings = Get-PathFindings -Files $configFiles
$processes = Get-ProcessSnapshot

$report = [pscustomobject]@{
  generatedAt = $now
  codexHome = $codexHomeFull
  outputDir = (Resolve-Path -LiteralPath $OutputDir).Path
  mode = "report-only"
  notes = @(
    "This script does not delete, move, archive, rotate, or modify Codex state.",
    "If Codex is running, keep cleanup actions disabled and use this report only."
  )
  directories = $dirSummaries
  rootFiles = $rootFiles
  topFiles = $topFiles
  oldActiveSessions = $oldActiveSessions
  pathFindings = $pathFindings
  processes = $processes
}

$jsonPath = Join-Path $OutputDir "codex-maintenance-report-$stamp.json"
$mdPath = Join-Path $OutputDir "codex-maintenance-report-$stamp.md"
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

$md = [System.Text.StringBuilder]::new()
[void]$md.AppendLine("# Codex Maintenance Report")
[void]$md.AppendLine("")
[void]$md.AppendLine("- Generated: $now")
[void]$md.AppendLine("- Codex home: ``$codexHomeFull``")
[void]$md.AppendLine("- Mode: report-only")
[void]$md.AppendLine("- Old active session threshold: $OldSessionDays days")
[void]$md.AppendLine("")
[void]$md.AppendLine("## Directory Summary")
Add-MarkdownTable $md $dirSummaries @("name", "size", "fileCount", "newestWrite", "path")
[void]$md.AppendLine("")
[void]$md.AppendLine("## Largest Codex Files")
Add-MarkdownTable $md $topFiles @("size", "lastWrite", "path")
[void]$md.AppendLine("")
[void]$md.AppendLine("## Root Files")
Add-MarkdownTable $md $rootFiles @("size", "lastWrite", "name", "path")
[void]$md.AppendLine("")
[void]$md.AppendLine("## Old Active Sessions")
Add-MarkdownTable $md $oldActiveSessions @("size", "lastWrite", "path")
[void]$md.AppendLine("")
[void]$md.AppendLine("## Path Findings")
Add-MarkdownTable $md $pathFindings @("kind", "file", "detail")
[void]$md.AppendLine("")
[void]$md.AppendLine("## Interesting Processes")
Add-MarkdownTable $md $processes @("name", "id", "workingSet", "cpu", "startTime")
[void]$md.AppendLine("")
[void]$md.AppendLine("## Recommended Next Step")
[void]$md.AppendLine("")
[void]$md.AppendLine("Keep this as a baseline. Close Codex before any backup, archive, worktree move, log rotation, or local database maintenance.")

Set-Content -LiteralPath $mdPath -Value $md.ToString() -Encoding UTF8

Write-Output "Report written:"
Write-Output $mdPath
Write-Output $jsonPath
