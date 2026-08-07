Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$taskRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $taskRoot "..\..\..")).Path
$musicRoot = Join-Path $repoRoot "public\assets\music"
$homeSource = Join-Path $musicRoot "main_bgm.ogg"
$duelIntroSource = Join-Path $musicRoot "sigrika_intro_once.ogg"
$duelLoopSource = Join-Path $musicRoot "sigrika_loop.ogg"
$homeOutput = Join-Path $musicRoot "sigrika_corruption_home_loop.ogg"
$duelIntroOutput = Join-Path $musicRoot "sigrika_corruption_duel_once.ogg"
$duelLoopOutput = Join-Path $musicRoot "sigrika_corruption_duel_loop.ogg"
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("sigrika-corruption-bgm-" + [Guid]::NewGuid().ToString("N"))

function Format-Number([double]$value) {
  return $value.ToString("0.000000", [System.Globalization.CultureInfo]::InvariantCulture)
}

function Get-AudioDuration([string]$path) {
  $raw = (& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $path).Trim()
  if ($LASTEXITCODE -ne 0) {
    throw "FFprobe failed for $path"
  }
  return [double]::Parse($raw, [System.Globalization.CultureInfo]::InvariantCulture)
}

function Get-StaticGainDb([string]$path, [double]$targetIntegrated = -16, [double]$targetPeak = -1.5) {
  $analysis = (& ffmpeg -hide_banner -nostats -i $path -af "loudnorm=I=$targetIntegrated`:LRA=10`:TP=$targetPeak`:print_format=json" -f null NUL 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) {
    throw "Loudness analysis failed for $path"
  }
  $matches = [regex]::Matches($analysis, "(?s)\{\s*`"input_i`".*?\}")
  if ($matches.Count -eq 0) {
    throw "Loudness analysis returned no JSON for $path"
  }
  $metrics = $matches[$matches.Count - 1].Value | ConvertFrom-Json
  $inputIntegrated = [double]::Parse([string]$metrics.input_i, [System.Globalization.CultureInfo]::InvariantCulture)
  $inputPeak = [double]::Parse([string]$metrics.input_tp, [System.Globalization.CultureInfo]::InvariantCulture)
  return [Math]::Min($targetIntegrated - $inputIntegrated, $targetPeak - $inputPeak)
}

function Encode-Ogg([string]$inputPath, [string]$outputPath, [double]$gainDb) {
  $gain = Format-Number $gainDb
  & ffmpeg -y -hide_banner -loglevel error -i $inputPath -af "volume=$gain`dB" -ar 48000 -ac 2 -c:a libvorbis -q:a 7 $outputPath
  if ($LASTEXITCODE -ne 0) {
    throw "OGG encoding failed for $outputPath"
  }
}

foreach ($source in @($homeSource, $duelIntroSource, $duelLoopSource)) {
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing source audio: $source"
  }
}

New-Item -ItemType Directory -Force $temporaryRoot | Out-Null
$homeWave = Join-Path $temporaryRoot "home-loop.wav"
$duelIntroWave = Join-Path $temporaryRoot "duel-intro.wav"
$duelLoopWave = Join-Path $temporaryRoot "duel-loop.wav"

try {
  $crossfadeSeconds = 0.25

  $homeTempo = 0.97
  $homePeriod = (Get-AudioDuration $homeSource) / $homeTempo
  $homePeriodEnd = $homePeriod * 2
  $homePrefixEnd = $homePeriod - $crossfadeSeconds
  $homeTremolo = 7 / $homePeriod
  $homePeriodText = Format-Number $homePeriod
  $homePeriodEndText = Format-Number $homePeriodEnd
  $homePrefixEndText = Format-Number $homePrefixEnd
  $homeCrossfadeText = Format-Number $crossfadeSeconds
  $homeTremoloText = Format-Number $homeTremolo
  $homeFilter = "[0:a]rubberband=tempo=0.97:pitch=0.917004:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,lowpass=f=9500:p=2,aecho=0.82:0.20:95|210:0.09|0.04,tremolo=f=$homeTremoloText`:d=0.04[processed];[processed]atrim=start=$homePeriodText`:end=$homePeriodEndText,asetpts=N/SR/TB,asplit=3[prefixsrc][tailsrc][headsrc];[prefixsrc]atrim=start=$homeCrossfadeText`:end=$homePrefixEndText,asetpts=N/SR/TB[prefix];[tailsrc]atrim=start=$homePrefixEndText`:end=$homePeriodText,asetpts=N/SR/TB[tail];[headsrc]atrim=start=0`:end=$homeCrossfadeText,asetpts=N/SR/TB[head];[tail][head]acrossfade=d=$homeCrossfadeText`:c1=tri`:c2=tri[seam];[prefix][seam]concat=n=2`:v=0`:a=1[loopout]"

  & ffmpeg -y -hide_banner -loglevel error -stream_loop 2 -i $homeSource -filter_complex $homeFilter -map "[loopout]" -ar 48000 -ac 2 -c:a pcm_f32le $homeWave
  if ($LASTEXITCODE -ne 0) {
    throw "Home corruption loop generation failed"
  }

  $duelTempo = 0.94
  $duelIntroDuration = (Get-AudioDuration $duelIntroSource) / $duelTempo
  $duelLoopPeriod = (Get-AudioDuration $duelLoopSource) / $duelTempo
  $duelSteadyStart = $duelIntroDuration + $duelLoopPeriod
  $duelSteadyEnd = $duelIntroDuration + ($duelLoopPeriod * 2)
  $duelIntroPrefixEnd = $duelIntroDuration - $crossfadeSeconds
  $duelLoopPrefixEnd = $duelLoopPeriod - $crossfadeSeconds
  $duelTremolo = 18 / $duelLoopPeriod
  $duelIntroDurationText = Format-Number $duelIntroDuration
  $duelLoopPeriodText = Format-Number $duelLoopPeriod
  $duelSteadyStartText = Format-Number $duelSteadyStart
  $duelSteadyEndText = Format-Number $duelSteadyEnd
  $duelIntroPrefixEndText = Format-Number $duelIntroPrefixEnd
  $duelLoopPrefixEndText = Format-Number $duelLoopPrefixEnd
  $duelCrossfadeText = Format-Number $crossfadeSeconds
  $duelTremoloText = Format-Number $duelTremolo
  $duelFilter = "[0:a][1:a]concat=n=2`:v=0`:a=1[combined];[combined]rubberband=tempo=0.94:pitch=0.865537:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,lowpass=f=7600:p=2,asplit=2[base][shadow];[base]volume=0.88[baseout];[shadow]rubberband=tempo=1:pitch=1.02043:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,highpass=f=150,lowpass=f=4600,adelay=53|79,volume=0.19[shadowout];[baseout][shadowout]amix=inputs=2`:normalize=0,aecho=0.78:0.22:145|320:0.14|0.07,tremolo=f=$duelTremoloText`:d=0.07[processed];[processed]asplit=2[introregion][steadyregion];[introregion]atrim=start=0`:end=$duelIntroDurationText,asetpts=N/SR/TB,asplit=2[introprefixsrc][introtailsrc];[introprefixsrc]atrim=start=0`:end=$duelIntroPrefixEndText,asetpts=N/SR/TB[introprefix];[introtailsrc]atrim=start=$duelIntroPrefixEndText`:end=$duelIntroDurationText,asetpts=N/SR/TB[introtail];[steadyregion]atrim=start=$duelSteadyStartText`:end=$duelSteadyEndText,asetpts=N/SR/TB,asplit=4[introheadsrc][loopprefixsrc][looptailsrc][loopheadsrc];[introheadsrc]atrim=start=0`:end=$duelCrossfadeText,asetpts=N/SR/TB[introhead];[introtail][introhead]acrossfade=d=$duelCrossfadeText`:c1=tri`:c2=tri[introseam];[introprefix][introseam]concat=n=2`:v=0`:a=1,afade=t=in`:st=0`:d=0.20[introout];[loopprefixsrc]atrim=start=$duelCrossfadeText`:end=$duelLoopPrefixEndText,asetpts=N/SR/TB[loopprefix];[looptailsrc]atrim=start=$duelLoopPrefixEndText`:end=$duelLoopPeriodText,asetpts=N/SR/TB[looptail];[loopheadsrc]atrim=start=0`:end=$duelCrossfadeText,asetpts=N/SR/TB[loophead];[looptail][loophead]acrossfade=d=$duelCrossfadeText`:c1=tri`:c2=tri[loopseam];[loopprefix][loopseam]concat=n=2`:v=0`:a=1[loopout]"

  & ffmpeg -y -hide_banner -loglevel error -i $duelIntroSource -stream_loop 2 -i $duelLoopSource -filter_complex $duelFilter -map "[introout]" -ar 48000 -ac 2 -c:a pcm_f32le $duelIntroWave -map "[loopout]" -ar 48000 -ac 2 -c:a pcm_f32le $duelLoopWave
  if ($LASTEXITCODE -ne 0) {
    throw "Duel corruption intro/loop generation failed"
  }

  $homeGain = Get-StaticGainDb $homeWave
  $duelGain = Get-StaticGainDb $duelLoopWave
  Encode-Ogg $homeWave $homeOutput $homeGain
  Encode-Ogg $duelIntroWave $duelIntroOutput $duelGain
  Encode-Ogg $duelLoopWave $duelLoopOutput $duelGain

  Write-Host "Generated formal corruption BGM assets:"
  Write-Host "  $homeOutput"
  Write-Host "  $duelIntroOutput"
  Write-Host "  $duelLoopOutput"
} finally {
  foreach ($temporaryFile in @($homeWave, $duelIntroWave, $duelLoopWave)) {
    if (Test-Path -LiteralPath $temporaryFile) {
      Remove-Item -LiteralPath $temporaryFile
    }
  }
  if (Test-Path -LiteralPath $temporaryRoot) {
    Remove-Item -LiteralPath $temporaryRoot
  }
}
