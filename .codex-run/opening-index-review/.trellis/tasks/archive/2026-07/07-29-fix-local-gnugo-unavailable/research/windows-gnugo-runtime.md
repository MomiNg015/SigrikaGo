# Windows GNU Go runtime research

## Current machine

- `Get-Command gnugo.exe` returns no executable.
- `winget` is installed, but `winget search gnugo` returns no package.
- Chocolatey and Scoop are not installed.
- WSL reports that virtualization is disabled, so the Ubuntu package cannot be used locally.
- CMake, Visual Studio compiler, MinGW, GCC, Clang, and Make are not available for a local source build.

## Sources

- GNU Go official download page: https://www.gnu.org/software/gnugo/download.html
  - Publishes the GNU Go 3.8 source tarball.
  - Directs Windows users to Ben Lambrechts' builds.
- GNU Go official Windows build documentation: https://www.gnu.org/software/gnugo/gnugo_2.html
  - Documents CMake/Visual Studio, NMake, MinGW, MSYS, and Cygwin source builds.
- GNU-endorsed Windows build site: http://gnugo.baduk.org/
  - Publishes `gnugo2/gnugo-3.8.zip`.

## Inspected Windows archive

- URL: `http://gnugo.baduk.org/gnugo2/gnugo-3.8.zip`
- Size: 2,642,753 bytes
- SHA-256: `6E9EF11623CDD5D8D581F6433337D93B1BC60435EA4F04A1F58D6DF35308281E`
- Expected entries:
  - `gnugo-3.8/gnugo.exe`
  - `gnugo-3.8/cyggcc_s-1.dll`
  - `gnugo-3.8/cygncurses-10.dll`
  - `gnugo-3.8/cygwin1.dll`
  - `gnugo-3.8/COPYING`
  - `gnugo-3.8/README`

The endpoint is HTTP and the archive does not publish an independent signed checksum. A project setup command can reduce repeat-download risk by pinning the observed SHA-256, validating the exact archive entries, extracting only inside a user-local application directory, and probing `gnugo.exe --version`. This still requires explicit user acceptance before first execution.

## Considered approaches

### A. Explicit project setup command with pinned Windows archive (recommended)

- Add a Windows-only setup script and `npm run setup:practice-engine`.
- Download to a temporary file, require the pinned SHA-256, verify the archive entry allowlist, extract under `%LOCALAPPDATA%\SigrikaGo\practice-engine\gnugo-3.8`, and probe `--version`.
- Runtime resolution order: explicit `PRACTICE_ENGINE_PATH`, user-local managed install, common `%ProgramFiles%\GNUGo\bin\gnugo.exe`, then `gnugo.exe` on PATH.
- Keeps the binary out of Git and makes installation repeatable.

Trade-off: the original binary is third-party and distributed over HTTP; hash pinning detects future tampering but cannot independently authenticate the first observed artifact.

### B. One-off manual installation and `.env` path

- Install the same ZIP by hand and set `PRACTICE_ENGINE_PATH`.

Trade-off: quickest for one machine, but the next clone/developer hits the same failure and there is no tested safety contract.

### C. Build GNU Go 3.8 from official source

- Install a supported compiler toolchain, CMake, and build from GNU source.

Trade-off: strongest source provenance, but requires a large Windows toolchain and is disproportionate for this low-resource local dependency.

### Rejected: `gnugo.js`

The npm package is an Emscripten wrapper of GNU Go 3.8, but it exposes only initialize/move/gen-next-step style calls. It does not preserve the project's current GTP `restricted_genmove` whitelist or public level 1/5/10 contract, so adopting it would be a different engine adapter rather than a local runtime fix.
