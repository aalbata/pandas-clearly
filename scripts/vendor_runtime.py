"""Download the pinned browser Python runtime and verify package hashes.

Dr. Ali Al Bataineh
Computer Information Science
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "docs" / "runtime"
VERSION = "0.27.7"
BASE = f"https://cdn.jsdelivr.net/pyodide/v{VERSION}/full/"
REQUIRED = ["numpy", "pandas", "matplotlib", "micropip", "sqlite3"]


def read_url(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Pandas-Clearly-course-build/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    lock_bytes = read_url(BASE + "pyodide-lock.json")
    lock = json.loads(lock_bytes)
    (DEST / "pyodide-lock.json").write_bytes(lock_bytes)
    packages = lock["packages"]
    names: set[str] = set()

    def add(name: str) -> None:
        if name in names:
            return
        names.add(name)
        for dependency in packages[name]["depends"]:
            add(dependency)

    for name in REQUIRED:
        add(name)
    jobs = [
        (name, BASE + name, None)
        for name in ["pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip"]
    ]
    for name in sorted(names):
        pkg = packages[name]
        jobs.append((pkg["file_name"], BASE + pkg["file_name"], pkg["sha256"]))
    wheels = []
    for package, version in [("et_xmlfile", "2.0.0"), ("openpyxl", "3.1.5")]:
        metadata = json.loads(read_url(f"https://pypi.org/pypi/{package}/{version}/json"))
        wheel = next(item for item in metadata["urls"] if item["filename"].endswith("py3-none-any.whl"))
        jobs.append((wheel["filename"], wheel["url"], wheel["digests"]["sha256"]))
        wheels.append(wheel["filename"])
    jobs.extend([
        ("LICENSE-PYODIDE", "https://raw.githubusercontent.com/pyodide/pyodide/0.27.7/LICENSE", None),
        ("LICENSE-CPYTHON", "https://raw.githubusercontent.com/python/cpython/v3.12.7/LICENSE", None),
    ])

    def download(job):
        filename, url, expected = job
        target = DEST / filename
        data = target.read_bytes() if target.exists() else b""
        if not data or (expected and sha(data) != expected):
            data = read_url(url)
            if expected and sha(data) != expected:
                raise ValueError(f"Checksum failed: {filename}")
            target.write_bytes(data)
        return {"path": filename, "url": url, "sha256": sha(data), "bytes": len(data)}

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(download, jobs))
    results.append({"path": "pyodide-lock.json", "url": BASE + "pyodide-lock.json", "sha256": sha(lock_bytes), "bytes": len(lock_bytes)})
    manifest = {
        "pyodide": VERSION,
        "python": lock["info"]["python"],
        "packages": {name: packages[name]["version"] for name in sorted(names)},
        "additional_wheels": wheels,
        "files": sorted(results, key=lambda item: item["path"]),
    }
    (DEST / "vendor-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (DEST / "README.md").write_text(
        "# Browser Python runtime\n\n"
        "This folder contains Pyodide 0.27.7 and the packages used by Pandas, Clearly. "
        "The browser loads these files from the course site when you first run code. "
        "No PyPI or CDN request is needed by the bundled lessons. "
        "A locally served copy works without internet access after the repository has been downloaded.\n\n"
        "Recreate this folder with `python scripts/vendor_runtime.py` from the repository root. "
        "That maintenance command requires internet access. Package wheels are checked against "
        "their upstream SHA256 digests. The manifest records each source URL and file hash.\n\n"
        "## Third-party licenses\n\n"
        "Pyodide is distributed under its included MPL 2.0 license. CPython's license is also included. "
        "The wheels retain their upstream licenses in their package metadata. These third-party files "
        "are not relicensed by the course's MIT license.\n\n"
        "Dr. Ali Al Bataineh  \nComputer Information Science  \n"
        "Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates\n",
        encoding="utf-8",
    )
    print(json.dumps({"files": len(results), "bytes": sum(r["bytes"] for r in results), "additional_wheels": wheels, "packages": manifest["packages"]}))


if __name__ == "__main__":
    main()
