Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$taskRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $taskRoot "..\..\..")).Path
$sourcePath = Join-Path $repoRoot "public\assets\music\sigrika_intro_once.ogg"
$outputRoot = Join-Path $repoRoot "artifacts\audio\corrupted-sigrika-bgm-concepts"
New-Item -ItemType Directory -Force $outputRoot | Out-Null

if (-not (Test-Path -LiteralPath $sourcePath)) {
  throw "Missing source audio: $sourcePath"
}

$profiles = @(
  @{
    Id = "a-off-key"
    Filter = "[0:a]rubberband=tempo=0.97:pitch=0.917004:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,lowpass=f=8800:p=2,aecho=0.82:0.20:120|270:0.11|0.05,tremolo=f=0.16:d=0.04,loudnorm=I=-16:LRA=10:TP=-1.5,afade=t=in:st=0:d=0.20,areverse,afade=t=in:st=0:d=0.50,areverse[out]"
  },
  @{
    Id = "b-detuned-shadow"
    Filter = "[0:a]rubberband=tempo=0.94:pitch=0.865537:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,lowpass=f=7600:p=2,asplit=2[base][shadow];[base]volume=0.88[baseout];[shadow]rubberband=tempo=1:pitch=1.02043:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,highpass=f=150,lowpass=f=4600,adelay=53|79,volume=0.19[shadowout];[baseout][shadowout]amix=inputs=2:normalize=0,aecho=0.78:0.22:145|320:0.14|0.07,tremolo=f=0.23:d=0.07,loudnorm=I=-16:LRA=10:TP=-1.5,afade=t=in:st=0:d=0.20,areverse,afade=t=in:st=0:d=0.55,areverse[out]"
  },
  @{
    Id = "c-tritone-haunt"
    Filter = "[0:a]asplit=3[basein][upperin][lowerin];[basein]rubberband=tempo=0.95:pitch=0.917004:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,lowpass=f=7600:p=2,volume=0.78[baseout];[upperin]rubberband=tempo=0.95:pitch=1.296840:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,highpass=f=700,lowpass=f=6200,adelay=67|109,volume=0.10[upperout];[lowerin]rubberband=tempo=0.95:pitch=0.648420:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,highpass=f=55,lowpass=f=3000,adelay=101|43,volume=0.14[lowerout];[baseout][upperout][lowerout]amix=inputs=3:normalize=0,vibrato=f=0.31:d=0.055,aecho=0.74:0.24:180|390:0.17|0.08,loudnorm=I=-16:LRA=10:TP=-1.5,afade=t=in:st=0:d=0.20,areverse,afade=t=in:st=0:d=0.60,areverse[out]"
  }
)

foreach ($profile in $profiles) {
  $outputPath = Join-Path $outputRoot "sigrika-once-corruption-$($profile.Id).ogg"
  $arguments = @(
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", $sourcePath,
    "-filter_complex", $profile.Filter,
    "-map", "[out]",
    "-vn",
    "-ar", "48000",
    "-ac", "2",
    "-c:a", "libvorbis",
    "-q:a", "6",
    $outputPath
  )

  Write-Host "Generating $outputPath"
  & ffmpeg @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "FFmpeg failed for $($profile.Id) with exit code $LASTEXITCODE"
  }
}

Write-Host "Generated Sigrika once previews in $outputRoot"
