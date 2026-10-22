"""Validate course source and independently execute every worked example/task.

Dr. Ali Al Bataineh
Computer Information Science
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates
"""
from __future__ import annotations

import argparse
import contextlib
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import tempfile
import traceback
import warnings

os.environ.setdefault("MPLCONFIGDIR", str(Path(tempfile.gettempdir()) / "pandas-clearly-mpl"))
os.environ.setdefault("MPLBACKEND", "Agg")
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import openpyxl

ROOT = Path(__file__).resolve().parents[1]


def modules():
    return sorted([json.loads(path.read_text(encoding="utf-8")) for path in (ROOT / "content/modules").glob("*.json")], key=lambda m: m["id"])


def validate_source(items):
    ids = set()
    for module in items:
        for key in ["id", "title", "goal", "level", "prerequisites", "reference", "cells"]:
            assert key in module, f"Module missing {key}"
        assert len(module["cells"]) == 4, f"Module {module['id']} needs four learning cells"
        for cell in module["cells"]:
            for key in ["id", "title", "explanation", "code", "questions", "task", "hint", "solution", "solution_note", "check", "verify", "solution_verify", "watch", "takeaway"]:
                assert key in cell, f"{module['title']}: cell missing {key}"
            assert cell["id"] not in ids, f"Duplicate cell ID {cell['id']}"
            ids.add(cell["id"])
            assert len(cell["questions"]) == 3
            assert all(q.get("prompt") and q.get("answer") for q in cell["questions"])
            assert len(cell["check"]["options"]) == 3 and 0 <= cell["check"]["correct"] < 3
            for field in ["code", "solution", "verify", "solution_verify"]:
                compile(cell[field], f"{cell['id']}:{field}", "exec")
    return ids


def run_case(setup, code, assertions, case_id, workdir, capture=False):
    namespace = {"__name__": "__main__"}
    output = io.StringIO()
    figures = []
    original_show = plt.show
    def collect(*args, **kwargs):
        for number in plt.get_fignums():
            image = io.BytesIO()
            plt.figure(number).savefig(image, format="png", bbox_inches="tight", dpi=125)
            figures.append(image.getvalue())
        plt.close("all")
    try:
        plt.close("all")
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            exec(compile(setup, "course_setup.py", "exec"), namespace)
        plt.show = collect
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                exec(compile(code, case_id, "exec"), namespace)
                exec(compile(assertions, case_id + ":checks", "exec"), namespace)
            if plt.get_fignums():
                collect()
        actionable = [f"{w.category.__name__}: {w.message}" for w in caught if issubclass(w.category, (FutureWarning, DeprecationWarning))]
        if actionable:
            raise AssertionError("Version-sensitive warnings: " + "; ".join(actionable))
        result = {"ok": True, "stdout": output.getvalue(), "warnings": [str(w.message) for w in caught], "plots": []}
        if capture:
            folder = ROOT / "content/verified-plots"
            folder.mkdir(exist_ok=True)
            for number, data in enumerate(figures, 1):
                filename = f"{case_id}-{number}.png"
                (folder / filename).write_bytes(data)
                result["plots"].append(filename)
        return result
    finally:
        plt.show = original_show
        plt.close("all")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-outputs", action="store_true", help="Refresh verified example output used by the website")
    parser.add_argument("--report", default="", help="Optional JSON report path")
    args = parser.parse_args()
    items = modules()
    ids = validate_source(items)
    setup = (ROOT / "course_setup.py").read_text(encoding="utf-8")
    assessment = json.loads((ROOT / "content/assessment.json").read_text(encoding="utf-8"))
    failures = []
    outputs = {}
    cases = 0
    previous = Path.cwd()
    with tempfile.TemporaryDirectory(prefix="pandas-clearly-check-") as temporary:
        workdir = Path(temporary)
        shutil.copytree(ROOT / "data", workdir / "data")
        os.chdir(workdir)
        try:
            for module in items:
                for cell in module["cells"]:
                    for kind, code_field, checks_field in [("example", "code", "verify"), ("solution", "solution", "solution_verify")]:
                        case_id = cell["id"] + "-" + kind
                        cases += 1
                        try:
                            result = run_case(setup, cell[code_field], cell[checks_field], case_id, workdir, args.write_outputs and kind == "example")
                            if kind == "example":
                                outputs[cell["id"]] = result
                        except Exception:
                            failures.append({"case": case_id, "traceback": traceback.format_exc()})
            for task in assessment["tasks"]:
                cases += 1
                try:
                    run_case(setup + "\n" + assessment["setup_code"], task["solution"], task["verify"], task["id"], workdir)
                except Exception:
                    failures.append({"case": task["id"], "traceback": traceback.format_exc()})
        finally:
            os.chdir(previous)
    report = {
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "python": __import__("sys").version.split()[0],
        "pandas": pd.__version__, "numpy": np.__version__, "matplotlib": matplotlib.__version__, "openpyxl": openpyxl.__version__,
        "modules": len(items), "learning_cells": len(ids), "independent_tasks": len(assessment["tasks"]),
        "executed_cases": cases, "passed": cases - len(failures), "failed": len(failures), "failures": failures,
    }
    if args.write_outputs and not failures:
        (ROOT / "content/verified-outputs.json").write_text(json.dumps({"environment": {k: report[k] for k in ["python", "pandas", "numpy", "matplotlib", "openpyxl"]}, "cells": outputs}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_path = Path(args.report).resolve() if args.report else ROOT / "validation" / f"native-pandas-{pd.__version__}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "failures"}, indent=2))
    for failure in failures:
        print(failure["case"] + "\n" + failure["traceback"])
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
