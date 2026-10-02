from pathlib import Path
import json
import hashlib
import shutil

root = Path("public/engines/gnugo-3.8")
js = root / "gnugo.js"
js.write_text("\n".join(line.rstrip() for line in js.read_text(encoding="utf-8").splitlines()) + "\n", encoding="utf-8", newline="\n")
manifest = root / "manifest.json"
data = json.loads(manifest.read_text(encoding="utf-8"))
data["sha256"]["gnugo.js"] = hashlib.sha256(js.read_bytes()).hexdigest()
manifest.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="\n")
shutil.copy2("scripts/build-practice-wasm.py", root / "build-practice-wasm.py")
