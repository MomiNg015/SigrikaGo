Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$taskRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $taskRoot "..\..\..")).Path
$outputRoot = Join-Path $repoRoot "artifacts\audio\corrupted-sigrika-bgm-concepts"
New-Item -ItemType Directory -Force $outputRoot | Out-Null

$sources = @(
  @{
    Id = "sigrika"
    Path = Join-Path $repoRoot "public\assets\music\sigrika_loop.ogg"
  },
  @{
    Id = "home"
    Path = Join-Path $repoRoot "public\assets\music\main_bgm.ogg"
  }
)

$profiles = @(
  @{
    Id = "light"
    Filter = "[0:a]rubberband=tempo=0.97:pitch=0.917004:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,lowpass=f=9500:p=2,aecho=0.82:0.20:95|210:0.09|0.04,tremolo=f=0.18:d=0.04,loudnorm=I=-16:LRA=10:TP=-1.5,atrim=duration=30,asetpts=N/SR/TB,afade=t=in:st=0:d=0.20,afade=t=out:st=29.55:d=0.45[out]"
  },
  @{
    Id = "recommended"
    Filter = "[0:a]rubberband=tempo=0.93:pitch=0.840896:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,lowpass=f=7600:p=2,asplit=3[base][ghost][damage];[base]volume=0.86[baseout];[ghost]rubberband=tempo=1:pitch=0.985:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,highpass=f=120,lowpass=f=4800,adelay=47|71,volume=0.16[ghostout];[damage]highpass=f=650,lowpass=f=5500,acrusher=bits=9:samples=4:mix=0.65:mode=log:aa=0.75,volume=0.09[damageout];[baseout][ghostout][damageout]amix=inputs=3:normalize=0,aecho=0.78:0.22:130|290:0.13|0.06,tremolo=f=0.29:d=0.08,loudnorm=I=-16:LRA=10:TP=-1.5,atrim=duration=30,asetpts=N/SR/TB,afade=t=in:st=0:d=0.20,afade=t=out:st=29.55:d=0.45[out]"
  },
  @{
    Id = "heavy"
    Filter = "[0:a]rubberband=tempo=0.88:pitch=0.749154:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,lowpass=f=6200:p=2,asplit=4[base][ghostlow][ghosthigh][damage];[base]volume=0.76[baseout];[ghostlow]rubberband=tempo=1:pitch=0.972:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,lowpass=f=4100,adelay=86|39,volume=0.19[ghostlowout];[ghosthigh]rubberband=tempo=1:pitch=1.028:transients=smooth:detector=soft:phase=independent:window=long:smoothing=on:pitchq=quality:channels=together,highpass=f=280,lowpass=f=5200,adelay=31|93,volume=0.12[ghosthighout];[damage]highpass=f=500,lowpass=f=5000,acrusher=bits=6:samples=12:mix=0.85:mode=log:aa=0.55:lfo=1:lforange=18:lforate=0.22,volume=0.15[damageout];[baseout][ghostlowout][ghosthighout][damageout]amix=inputs=4:normalize=0,vibrato=f=0.37:d=0.08,tremolo=f=1.70:d=0.18,aecho=0.72:0.25:170|360:0.17|0.08,loudnorm=I=-16:LRA=10:TP=-1.5,atrim=duration=30,asetpts=N/SR/TB,afade=t=in:st=0:d=0.20,afade=t=out:st=29.55:d=0.45[out]"
  }
)

foreach ($source in $sources) {
  if (-not (Test-Path -LiteralPath $source.Path)) {
    throw "Missing source audio: $($source.Path)"
  }

  foreach ($profile in $profiles) {
    $outputPath = Join-Path $outputRoot "$($source.Id)-corruption-$($profile.Id).ogg"
    $arguments = @(
      "-y",
      "-hide_banner",
      "-loglevel", "error",
      "-i", $source.Path,
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
      throw "FFmpeg failed for $($source.Id)/$($profile.Id) with exit code $LASTEXITCODE"
    }
  }
}

Write-Host "Generated previews in $outputRoot"
