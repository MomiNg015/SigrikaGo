param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\public\assets\voice'),
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
if (-not (Test-Path -LiteralPath $resolvedOutput -PathType Container)) {
  throw "Output directory does not exist: $resolvedOutput"
}

$lines = [ordered]@{
  'qiuyuan_match_start.ogg' = '对局开始'
  'qiuyuan_sortie.ogg' = '出战'
  'qiuyuan_byoyomi_start.ogg' = '开始读秒'
  'qiuyuan_byoyomi_remaining_2.ogg' = '还剩2次读秒'
  'qiuyuan_byoyomi_remaining_1.ogg' = '还剩1次读秒'
  'qiuyuan_countdown_10.ogg' = '10'
  'qiuyuan_countdown_9.ogg' = '9'
  'qiuyuan_countdown_8.ogg' = '8'
  'qiuyuan_countdown_7.ogg' = '7'
  'qiuyuan_countdown_6.ogg' = '6'
  'qiuyuan_countdown_5.ogg' = '5'
  'qiuyuan_countdown_4.ogg' = '4'
  'qiuyuan_countdown_3.ogg' = '3'
  'qiuyuan_countdown_2.ogg' = '2'
  'qiuyuan_countdown_1.ogg' = '1'
  'qiuyuan_result_win.ogg' = '对局胜利'
  'qiuyuan_result_loss.ogg' = '对局失败'
  'qiuyuan_result_draw.ogg' = '和棋'
}

$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $synthesizer.SelectVoice('Microsoft Kangkang')
  $synthesizer.Rate = 0
  $synthesizer.Volume = 100

  foreach ($entry in $lines.GetEnumerator()) {
    $outputPath = Join-Path $resolvedOutput $entry.Key
    $resolvedFile = [System.IO.Path]::GetFullPath($outputPath)
    if (-not $resolvedFile.StartsWith($resolvedOutput + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Generated voice path escapes output directory: $resolvedFile"
    }
    if ((Test-Path -LiteralPath $resolvedFile) -and -not $Force) {
      throw "Refusing to overwrite existing voice without -Force: $resolvedFile"
    }

    $temporaryWav = [System.IO.Path]::GetTempFileName()
    try {
      $synthesizer.SetOutputToWaveFile($temporaryWav)
      $synthesizer.Speak([string]$entry.Value)
      $synthesizer.SetOutputToNull()
      & ffmpeg -hide_banner -loglevel error -y -i $temporaryWav -ar 48000 -ac 1 -c:a libvorbis -q:a 8 $resolvedFile
      if ($LASTEXITCODE -ne 0) {
        throw "ffmpeg failed while encoding $($entry.Key)"
      }
      Write-Output "Generated $($entry.Key): $($entry.Value)"
    } finally {
      $synthesizer.SetOutputToNull()
      if (Test-Path -LiteralPath $temporaryWav) {
        Remove-Item -LiteralPath $temporaryWav -Force
      }
    }
  }
} finally {
  $synthesizer.Dispose()
}
