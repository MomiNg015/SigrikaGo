import hashlib
import json
from pathlib import Path
import zipfile

BASE = Path(r"C:\Users\Moming\.codex\visualizations\2026\10\02\01a0fb2f-41c4-7373-aade-6f8b09c8f56d")
ROOT = BASE / "sigrika-sprite-expressions"
TASK = Path(__file__).resolve().parent
assert ROOT.parent == BASE and ROOT.is_dir()
baseline = json.loads((TASK / "binary-baseline.json").read_text(encoding="utf-8-sig"))

def renamed(relative):
    if relative.startswith("exports/native/"):
        return "exports/native/sigrika-" + Path(relative).name
    return {
        "masters/character-native.psd": "masters/sigrika-expressions.psd",
        "preview/expressions-overview.png": "preview/sigrika-expressions-overview.png",
        "preview/fullbody-overview.png": "preview/sigrika-fullbody-overview.png",
    }.get(relative, relative)

def sha256(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

checks = []
for item in baseline:
    after = renamed(item["relative_path"])
    file = ROOT / after
    checks.append({
        "before": item["relative_path"],
        "after": after,
        "sha256": sha256(file),
        "binary_unchanged": sha256(file) == item["sha256"],
    })
assert all(item["binary_unchanged"] for item in checks)
expected_binaries = {item["after"] for item in checks}
actual_binaries = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in (".png", ".psd")}
assert expected_binaries == actual_binaries
assert len(list((ROOT / "exports/native").glob("sigrika-*.png"))) == 9

manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
rig = json.loads((ROOT / "rig.json").read_text(encoding="utf-8"))
assert manifest["base_id"] == rig["base_id"] == "sigrika"
assert manifest["character_name"] == rig["character_name"] == "西格莉卡"
for expression_id, expression in manifest["expressions"].items():
    assert expression["output"] == f"exports/native/sigrika-{expression_id}.png"
    assert sha256(ROOT / expression["output"]) == expression["sha256"]
assert manifest["psd"]["path"] == "masters/sigrika-expressions.psd"
assert sha256(ROOT / manifest["psd"]["path"]) == manifest["psd"]["sha256"]
psd_report = json.loads((ROOT / "qa/psd-render-verification.json").read_text(encoding="utf-8"))
assert Path(psd_report["actualPSDmetadata"]["path"]).resolve() == (ROOT / manifest["psd"]["path"]).resolve()
for relative in ("rig.json", "manifest.json", "generation-prompts.json", "qa/visual-review.json", "qa/psd-render-verification.json"):
    text = (ROOT / relative).read_text(encoding="utf-8")
    assert "/sprite-expressions/" not in text, relative
    assert "orange_braid_character" not in text, relative

report = {
    "character_id": "sigrika",
    "character_name": "西格莉卡",
    "operation": "rename only; no image or PSD rewrite",
    "binary_count": len(checks),
    "all_binary_hashes_unchanged": True,
    "manifest_paths_and_hashes_valid": True,
    "delivery_png_count": 9,
    "checks": checks,
    "passed": True,
}
(ROOT / "qa/rename-verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

legacy_zip = BASE / "sprite-expressions.zip"
new_zip = BASE / "sigrika-sprite-expressions.zip"
assert not new_zip.exists(), "Destination ZIP already exists"
prefix = ""
if legacy_zip.exists():
    with zipfile.ZipFile(legacy_zip) as old:
        if any(name.startswith("sprite-expressions/") for name in old.namelist()):
            prefix = "sigrika-sprite-expressions/"
files = sorted(p for p in ROOT.rglob("*") if p.is_file())
with zipfile.ZipFile(new_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for file in files:
        archive.write(file, prefix + file.relative_to(ROOT).as_posix())
with zipfile.ZipFile(new_zip) as archive:
    assert archive.testzip() is None
    expected_entries = {prefix + p.relative_to(ROOT).as_posix() for p in files}
    assert set(archive.namelist()) == expected_entries
    for file in files:
        member = prefix + file.relative_to(ROOT).as_posix()
        assert hashlib.sha256(archive.read(member)).hexdigest() == sha256(file), member
zip_report = {
    "archive": str(new_zip),
    "entries": len(files),
    "all_entries_match_working_package": True,
    "sha256": sha256(new_zip),
    "size_bytes": new_zip.stat().st_size,
    "passed": True,
}
(TASK / "zip-verification.json").write_text(json.dumps(zip_report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"binary_files_unchanged": len(checks), "delivery_pngs": 9, "zip_entries": len(files), "zip_size_bytes": new_zip.stat().st_size, "passed": True}, ensure_ascii=False))
