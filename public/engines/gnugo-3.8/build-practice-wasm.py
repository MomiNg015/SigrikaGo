"""Build GNU Go 3.8 with Emscripten 4.0.10, including pattern generators.

Usage: python scripts/build-practice-wasm.py --emsdk /path/to/emsdk
No host C compiler is required: build-time generators run as WASM under Node.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / ".codex-run/practice-local"
OUT = ROOT / "public/engines/gnugo-3.8"
SOURCE_URL = "https://ftp.gnu.org/gnu/gnugo/gnugo-3.8.tar.gz"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--emsdk", required=True)
    args = parser.parse_args()
    sdk = Path(args.emsdk).resolve()
    emcc = [sys.executable, str(sdk / "upstream/emscripten/emcc.py")]
    toolchain_version = subprocess.check_output(emcc + ["--version"], text=True)
    if not re.search(r"\b4\.0\.10\b", toolchain_version):
        raise RuntimeError("This artifact requires Emscripten 4.0.10")
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js is required")
    WORK.mkdir(parents=True, exist_ok=True)
    archive = WORK / "gnugo-3.8.tar.gz"
    if not archive.exists():
        urllib.request.urlretrieve(SOURCE_URL, archive)
    if hashlib.sha256(archive.read_bytes()).hexdigest() != "da68d7a65f44dcf6ce6e4e630b6f6dd9897249d34425920bfdd4e07ff1866a72":
        raise RuntimeError("GNU Go source checksum mismatch")
    source = WORK / "gnugo-3.8"
    if not source.exists():
        with tarfile.open(archive) as tar:
            tar.extractall(WORK, filter="data")
    # Match upstream defaults; WASM is a 32-bit POSIX target, without terminal/TCP.
    config = (source / "config.vc").read_text()
    config = re.sub(r"^#define HAVE_(CRTDBG_H|WINSOCK_IO_H|_VSNPRINTF) 1$", "", config, flags=re.M)
    config = config.replace("#define ENABLE_SOCKET_SUPPORT 1", "#define ENABLE_SOCKET_SUPPORT 0")
    config = re.sub(r"^#pragma.*$", "", config, flags=re.M)
    for flag in ["HAVE_GETTIMEOFDAY", "HAVE_SYS_TIME_H", "HAVE_UNISTD_H", "HAVE_VSNPRINTF", "HAVE_STDINT_H", "HAVE_STRING_H", "HAVE_STDLIB_H", "STDC_HEADERS", "TIME_WITH_SYS_TIME"]:
        config += f"\n#define {flag} 1\n"
    (source / "config.h").write_text(config)
    # Old GCC treated tentative header definitions as common symbols. Modern
    # WASM needs one definition and extern declarations (no search change).
    header = source / "engine/liberty.h"
    header_text = header.read_text()
    definitions = ""
    for color in ["black", "white"]:
        definition = f"int meaningless_{color}_moves[BOARDMAX];"
        header_text = re.sub(rf"(?m)^{re.escape(definition)}$", "extern " + definition, header_text)
        definitions += definition + "\n"
    header.write_text(header_text)
    implementation = source / "engine/unconditional.c"
    if definitions.strip() not in implementation.read_text():
        implementation.write_text(implementation.read_text() + "\n" + definitions)
    # Upstream computes a pointer before the array for nel=0. LLVM exploits
    # that undefined behavior on WASM, so make empty/singleton sorting explicit.
    utility = source / "utils/gg_utils.c"
    if "  if (nel < 2) return;" not in utility.read_text():
        utility.write_text(utility.read_text().replace("  int gap = nel;", "  if (nel < 2) return;\n  int gap = nel;"))
    includes = [f"-I{source / name}" for name in [".", "engine", "patterns", "sgf", "utils", "interface"]]
    common = ["-O2", f"-ffile-prefix-map={source}=gnugo-3.8", "-DHAVE_CONFIG_H", "-Wno-error=implicit-function-declaration", "-Wno-error=incompatible-pointer-types", *includes]

    def sources(folder, variable):
        text = (source / folder / "Makefile.am").read_text().replace("\\\n", " ")
        match = re.search(rf"^{variable}\s*=([^\n]+)", text, re.M)
        return [str(source / folder / name) for name in match[1].split() if name.endswith(".c")]

    utils = sources("utils", "libutils_a_SOURCES")
    sgf = sources("sgf", "libsgf_a_SOURCES")
    board = sources("engine", "libboard_a_SOURCES")
    patterns = source / "patterns"
    generators = {
        "mkpat": [str(patterns / n) for n in ["mkpat.c", "transform.c", "dfa.c"]] + utils,
        "mkeyes": [str(patterns / "mkeyes.c")] + utils,
        "joseki": [str(patterns / "joseki.c")] + board + sgf + utils,
        "uncompress_fuseki": [str(patterns / "uncompress_fuseki.c")] + board + sgf + utils,
        "mkmcpat": [str(patterns / "mkmcpat.c"), str(source / "engine/globals.c"), str(source / "engine/montecarlo.c")] + board + sgf + utils,
    }
    for name, files in generators.items():
        output = WORK / f"{name}.cjs"
        print(f"Compiling generator {name}", flush=True)
        subprocess.run(emcc + common + files + ["-sNODERAWFS=1", "-sEXIT_RUNTIME=1", "-sENVIRONMENT=node", "-sALLOW_MEMORY_GROWTH=1", "-sSTACK_SIZE=8388608", "-o", str(output)], check=True)

    def generate(name, arguments, output=None, input_file=None):
        with open(output, "wb") if output else open(os.devnull, "wb") as stdout:
            with open(input_file, "rb") if input_file else open(os.devnull, "rb") as stdin:
                subprocess.run([node, str(WORK / f"{name}.cjs"), *arguments], cwd=patterns, stdout=stdout, stdin=stdin, check=True)

    josekis = {"gogo": "JG", "hoshi_keima": "JHK", "hoshi_other": "JHO", "komoku": "JK", "sansan": "JS", "mokuhazushi": "JM", "takamoku": "JT"}
    for name, prefix in josekis.items():
        generate("joseki", [prefix, f"{name}.sgf"], patterns / f"{name}.db")
    recipes = {
        "patterns": ["-b", "pat", "-i", "patterns.db", "-i", "patterns2.db"],
        "josekidb": ["-C", "joseki", *[a for name in josekis for a in ["-i", f"{name}.db"]]],
        "apatterns": ["-X", "attpat", "-i", "attack.db"],
        "dpatterns": ["defpat", "-i", "defense.db"],
        "conn": ["-c", "conn", "-i", "conn.db"],
        "endgame": ["-b", "endpat", "-i", "endgame.db"],
        "influence": ["-c", "influencepat", "-i", "influence.db"],
        "barriers": ["-c", "-b", "barrierspat", "-i", "barriers.db"],
        "oraclepat": ["-b", "oracle", "-i", "oracle.db"],
        "fusekipat": ["-b", "fusekipat", "-i", "fuseki.db"],
        "handipat": ["-b", "handipat", "-i", "handicap.db"],
    }
    for outname, db in [("aa_attackpat", "aa_attackpats"), ("owl_attackpat", "owl_attackpats"), ("owl_vital_apat", "owl_vital_apats"), ("owl_defendpat", "owl_defendpats")]:
        recipes[outname] = ["-D", "-m", "-b", "-t", f"{db}.dtr", outname, "-i", f"{db}.db"]
    for name, argv in recipes.items():
        generate("mkpat", argv + ["-o", f"{name}.c"])
    generate("mkeyes", [], patterns / "eyes.c", patterns / "eyes.db")
    for size in [9, 13, 19]:
        generate("uncompress_fuseki", [str(size), f"fuseki{size}.dbz", "c"], patterns / f"fuseki{size}.c")
    generate("mkmcpat", ["mc_montegnu_classic.db", "mc_mogo_classic.db", "mc_uniform.db"], patterns / "mcpat.c")
    pattern_files = [*recipes, "eyes", "fuseki9", "fuseki13", "fuseki19", "mcpat", "connections", "helpers", "transform"]
    files = sources("engine", "libengine_a_SOURCES") + sources("interface", "gnugo_SOURCES") + sgf + utils + [str(patterns / f"{name}.c") for name in pattern_files]
    OUT.mkdir(parents=True, exist_ok=True)
    print("Compiling GNU Go browser engine", flush=True)
    subprocess.run(emcc + common + files + ["-g2", "-sDYNAMIC_EXECUTION=0", "-sMODULARIZE=1", "-sEXPORT_ES6=1", "-sINVOKE_RUN=0", "-sEXIT_RUNTIME=1", "-sENVIRONMENT=web,worker,node", "-sALLOW_MEMORY_GROWTH=1", "-sINITIAL_MEMORY=67108864", "-sMAXIMUM_MEMORY=268435456", "-sSTACK_SIZE=8388608", "-sEXPORTED_RUNTIME_METHODS=FS,callMain", "-o", str(OUT / "gnugo.js")], check=True)
    generated_js = OUT / "gnugo.js"
    generated_js.write_text("\n".join(line.rstrip() for line in generated_js.read_text(encoding="utf-8").splitlines()) + "\n", encoding="utf-8", newline="\n")
    shutil.copy2(archive, OUT / archive.name)
    shutil.copy2(source / "COPYING", OUT / "COPYING.txt")
    shutil.copy2(__file__, OUT / "build-practice-wasm.py")
    metadata = {"version": "3.8", "emscripten": "4.0.10", "source": SOURCE_URL, "sha256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in [archive, OUT / "gnugo.js", OUT / "gnugo.wasm"]}}
    (OUT / "manifest.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps(metadata, indent=2), flush=True)


if __name__ == "__main__":
    main()
