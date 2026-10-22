/* Actual Python execution for Pandas, Clearly. This file is a classic Web Worker. */
"use strict";
let python = null;
let bootPromise = null;
let originalFiles = [];
let setupSource = "";
const DATA_ROOT = "/course/data";
const OUTPUT_ROOT = "/course/outputs";
const MAX_OUTPUT_FILE = 12 * 1024 * 1024;
const MAX_OUTPUT_TOTAL = 24 * 1024 * 1024;

function progress(text) { self.postMessage({ type: "progress", text }); }
function errorText(error) { return error && error.message ? error.message : String(error); }
function safeRelative(path) {
  const value = String(path || "").replace(/\\/g, "/");
  if (!value || value.startsWith("/") || value.split("/").some(p => !p || p === "." || p === "..") || /[\0\r\n]/.test(value)) {
    throw new Error("The data manifest contains an invalid file path.");
  }
  return value;
}
async function checkedFetch(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Could not load ${new URL(url).pathname} (HTTP ${response.status}).`);
  return response;
}
function removeTree(path) {
  let items;
  try { items = python.FS.readdir(path); } catch (_) { return; }
  for (const name of items) {
    if (name === "." || name === "..") continue;
    const child = `${path}/${name}`;
    const stat = python.FS.lstat(child);
    if (python.FS.isDir(stat.mode)) removeTree(child);
    else python.FS.unlink(child);
  }
  python.FS.rmdir(path);
}
function resetFiles() {
  python.FS.mkdirTree("/course");
  python.FS.chdir("/course");
  removeTree(OUTPUT_ROOT);
  python.FS.mkdirTree(OUTPUT_ROOT);
  removeTree(DATA_ROOT);
  python.FS.mkdirTree(DATA_ROOT);
  for (const file of originalFiles) {
    const path = `${DATA_ROOT}/${file.path}`;
    python.FS.mkdirTree(path.slice(0, path.lastIndexOf("/")));
    python.FS.writeFile(path, file.bytes);
  }
}
async function initialize(config) {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    const base = String(config.runtimeBase || "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/").replace(/\/?$/, "/");
    progress("Loading Python. The first run downloads the browser runtime.");
    importScripts(`${base}pyodide.js`);
    python = await loadPyodide({ indexURL: base });
    progress("Loading pandas, NumPy, plotting, and SQLite support…");
    await python.loadPackage(["numpy", "pandas", "matplotlib", "micropip", "sqlite3"]);
    python.globals.set("_pc_wheels_json", JSON.stringify(config.additionalWheels || []));
    progress("Preparing Excel support…");
    await python.runPythonAsync(`
import json as _pc_json
import importlib.util as _pc_importlib
import micropip as _pc_micropip
if _pc_importlib.find_spec("openpyxl") is None:
    _pc_wheels = _pc_json.loads(_pc_wheels_json)
    if _pc_wheels:
        for _pc_wheel in _pc_wheels:
            await _pc_micropip.install(_pc_wheel, deps=False)
    else:
        await _pc_micropip.install("openpyxl")
import openpyxl
import os as _pc_os
_pc_os.environ["MPLCONFIGDIR"] = "/tmp/pandas-clearly-mpl"
_pc_os.makedirs("/tmp/pandas-clearly-mpl", exist_ok=True)
import matplotlib as _pc_matplotlib
_pc_matplotlib.use("agg")
`);
    progress("Loading the course data…");
    const manifestURL = config.manifest;
    if (manifestURL) {
      const manifest = await (await checkedFetch(manifestURL)).json();
      const entries = Array.isArray(manifest) ? manifest : manifest.files;
      if (!Array.isArray(entries)) throw new Error("The course data manifest is not a list of files.");
      originalFiles = await Promise.all(entries.map(async entry => {
        const item = typeof entry === "string" ? { path: entry } : entry;
        const path = safeRelative(item.path || item.name);
        const url = new URL(item.url || path, manifestURL).href;
        return { path, bytes: new Uint8Array(await (await checkedFetch(url)).arrayBuffer()) };
      }));
    }
    setupSource = config.setup || (config.setupURL ? await (await checkedFetch(config.setupURL)).text() : "");
    resetFiles();
    await python.runPythonAsync(PYTHON_RUNNER);
    const versions = JSON.parse(await python.runPythonAsync('_pc_versions_json()'));
    progress(`Python ready · pandas ${versions.pandas}`);
    return versions;
  })();
  try { return await bootPromise; }
  catch (error) { bootPromise = null; throw error; }
}
function collectOutputFiles() {
  const files = [], notes = [];
  let total = 0;
  function walk(directory, prefix = "") {
    for (const name of python.FS.readdir(directory)) {
      if (name === "." || name === "..") continue;
      const path = `${directory}/${name}`;
      const relative = prefix ? `${prefix}/${name}` : name;
      const stat = python.FS.lstat(path);
      if (python.FS.isDir(stat.mode)) { walk(path, relative); continue; }
      if (!python.FS.isFile(stat.mode)) continue;
      if (files.length >= 30 || stat.size > MAX_OUTPUT_FILE || total + stat.size > MAX_OUTPUT_TOTAL) {
        notes.push(`Download omitted for ${relative}: use the local notebook for large exports.`);
        continue;
      }
      const bytes = python.FS.readFile(path).slice();
      total += bytes.byteLength;
      files.push({ name: relative, size: bytes.byteLength, bytes: bytes.buffer });
    }
  }
  walk(OUTPUT_ROOT);
  return { files, notes };
}
async function runJob(job) {
  if (!python) throw new Error("Python is not ready. Start the runtime first.");
  resetFiles();
  python.globals.set("_pc_job_json", JSON.stringify({
    setup: job.setup || setupSource,
    code: String(job.code || ""),
    tests: String(job.tests || ""),
    label: String(job.label || "classroom cell")
  }));
  const serialized = await python.runPythonAsync("_pc_execute_json(_pc_job_json)");
  const result = JSON.parse(serialized);
  const output = collectOutputFiles();
  result.files = output.files;
  result.notes = [...(result.notes || []), ...output.notes];
  return result;
}
self.onmessage = async event => {
  const message = event.data || {};
  const id = message.id;
  try {
    if (message.type === "init") {
      const versions = await initialize(message.config || {});
      self.postMessage({ id, type: "ready", versions });
    } else if (message.type === "run") {
      const result = await runJob(message.job || {});
      self.postMessage({ id, type: "result", result }, (result.files || []).map(file => file.bytes));
    } else {
      throw new Error("Unknown runtime request.");
    }
  } catch (error) {
    self.postMessage({ id, type: "error", error: errorText(error) });
  }
};

const PYTHON_RUNNER = String.raw`
import json as _pc_json
import sys as _pc_sys
import io as _pc_io
import os as _pc_os
import traceback as _pc_traceback
import contextlib as _pc_contextlib
import base64 as _pc_base64
from pathlib import Path as _pc_Path
import pandas as _pc_pd
import numpy as _pc_np
import matplotlib.pyplot as _pc_plt

class _pc_LimitedText(_pc_io.StringIO):
    def __init__(self, limit=120000):
        super().__init__()
        self.limit = limit
        self.used = 0
        self.truncated = False
    def write(self, text):
        text = str(text)
        available = max(0, self.limit - self.used)
        if len(text) > available:
            self.truncated = True
        if available:
            super().write(text[:available])
            self.used += min(available, len(text))
        return len(text)

def _pc_versions_json():
    return _pc_json.dumps({"python": _pc_sys.version.split()[0], "pandas": _pc_pd.__version__, "numpy": _pc_np.__version__})

def _pc_execute_json(payload):
    job = _pc_json.loads(payload)
    stdout, stderr, setup_output = _pc_LimitedText(), _pc_LimitedText(), _pc_LimitedText()
    scope = {"__name__": "__main__", "__file__": "/course/lesson.py"}
    result = {"ok": False, "stdout": "", "stderr": "", "error": "", "phase": "setup", "plots": [], "notes": [], "checked": bool(job["tests"]), "passed": False}
    _pc_plt.close("all")
    _pc_plt.rcdefaults()
    _pc_os.chdir("/course")
    original_show = _pc_plt.show

    def capture_plots(*args, **kwargs):
        figure_numbers = _pc_plt.get_fignums()
        for number in figure_numbers:
            figure = _pc_plt.figure(number)
            if len(result["plots"]) >= 6:
                if "Only the first six plots are displayed." not in result["notes"]:
                    result["notes"].append("Only the first six plots are displayed.")
                _pc_plt.close(figure)
                continue
            image = _pc_io.BytesIO()
            figure.savefig(image, format="png", dpi=110, bbox_inches="tight", facecolor="white")
            encoded = _pc_base64.b64encode(image.getvalue()).decode("ascii")
            result["plots"].append(encoded)
            _pc_plt.close(figure)

    try:
        with _pc_contextlib.redirect_stdout(setup_output), _pc_contextlib.redirect_stderr(stderr):
            exec(compile(job["setup"], "<course setup>", "exec"), scope, scope)
        scope["DATA_DIR"] = _pc_Path("/course/data")
        scope["OUTPUT_DIR"] = _pc_Path("/course/outputs")
        scope["OUTPUT_DIR"].mkdir(parents=True, exist_ok=True)
        _pc_plt.show = capture_plots
        result["phase"] = "code"
        with _pc_contextlib.redirect_stdout(stdout), _pc_contextlib.redirect_stderr(stderr):
            exec(compile(job["code"], "<" + job["label"] + ">", "exec"), scope, scope)
            capture_plots()
        if job["tests"]:
            result["phase"] = "check"
            with _pc_contextlib.redirect_stdout(stdout), _pc_contextlib.redirect_stderr(stderr):
                exec(compile(job["tests"], "<practice checks>", "exec"), scope, scope)
            result["passed"] = True
        result["ok"] = True
        result["phase"] = "complete"
    except BaseException as error:
        result["error"] = "".join(_pc_traceback.format_exception(type(error), error, error.__traceback__))
        if result["phase"] == "setup":
            result["error"] = setup_output.getvalue() + result["error"]
        if result["phase"] == "check" and isinstance(error, AssertionError):
            result["notes"].append("The code ran, but its result did not match the task checks. Revisit the selected rows, values, columns, and result type.")
        try:
            capture_plots()
        except Exception:
            pass
    finally:
        _pc_plt.show = original_show
        _pc_plt.close("all")
    result["stdout"] = stdout.getvalue()
    result["stderr"] = stderr.getvalue()
    if stdout.truncated or stderr.truncated:
        result["notes"].append("Long text output was shortened. Print a smaller preview or download a file.")
    return _pc_json.dumps(result)
`;
