# Browser Python runtime

This folder contains Pyodide 0.27.7 and the packages used by Pandas, Clearly. The browser loads these files from the course site when you first run code. No PyPI or CDN request is needed by the bundled lessons. A locally served copy works without internet access after the repository has been downloaded.

Recreate this folder with `python scripts/vendor_runtime.py` from the repository root. That maintenance command requires internet access. Package wheels are checked against their upstream SHA256 digests. The manifest records each source URL and file hash.

## Third-party licenses

Pyodide is distributed under its included MPL 2.0 license. CPython's license is also included. The wheels retain their upstream licenses in their package metadata. These third-party files are not relicensed by the course's MIT license.

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates
