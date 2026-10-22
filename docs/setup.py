# Pandas, Clearly
# Dr. Ali Al Bataineh
# Computer Information Science
# Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates
# Run once before the lessons. It prepares explicitly fictional practice data.
# Questions: What does 'as pd' mean? Where will exported files be saved?
# Try: print(pd.__version__) and print(OUTPUT_DIR.resolve()).
# Explain: Why should source data and analysis outputs use different folders?
import os
import tempfile
from pathlib import Path
os.environ.setdefault("MPLCONFIGDIR", str(Path(tempfile.gettempdir()) / "pandas-clearly-mpl"))
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json
import sqlite3
from pathlib import Path
from io import StringIO

# Find data from the repository root or either notebook subdirectory.
# Browser workers mount the same data tree at /course/data.
COURSE_ROOT = next(
    (parent for parent in [Path.cwd(), *Path.cwd().parents]
     if (parent / "data" / "students.csv").is_file()),
    Path.cwd(),
)
DATA_DIR = COURSE_ROOT / "data"
OUTPUT_DIR = COURSE_ROOT / "outputs"
DATA_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

_STUDENT_ROWS = [
    ["S001", "Amira", "RAK", "AI", 20, 8, 88, 95, "2026-09-01"],
    ["S002", "Bilal", "Dubai", "IT", 21, 5, 72, 85, "2026-09-02"],
    ["S003", "Chloe", "RAK", "AI", 19, 9, 91, 98, "2026-09-03"],
    ["S004", "Dana", "Dubai", "IT", 22, 4, 65, 78, "2026-09-04"],
    ["S005", "Ethan", "RAK", "IT", 20, 6, 79, 90, "2026-09-05"],
    ["S006", "Fatima", "Dubai", "AI", 21, 10, 95, 99, "2026-09-06"],
    ["S007", "Grace", "RAK", "AI", 23, 7, 84, 92, "2026-09-07"],
    ["S008", "Hassan", "Dubai", "IT", 20, 3, 58, 70, "2026-09-08"],
    ["S009", "Ivy", "RAK", "IT", 22, 6, 76, 88, "2026-09-09"],
    ["S010", "Jamal", "Dubai", "AI", 19, 8, 89, 96, "2026-09-10"],
    ["S011", "Khalid", "RAK", "AI", 24, 5, 68, 82, "2026-09-11"],
    ["S012", "Lina", "Dubai", "IT", 21, 7, 82, 94, "2026-09-12"],
]
_STUDENT_COLUMNS = ["Student_ID", "Name", "Campus", "Program", "Age",
                    "Study_Hours", "Score", "Attendance", "Join_Date"]

def students():
    """Return a new, clean practice DataFrame, never real student records."""
    return pd.DataFrame(_STUDENT_ROWS, columns=_STUDENT_COLUMNS)

def records():
    """Return the same practice records as a list of dictionaries."""
    return students().to_dict(orient="records")

def raw_students():
    """Return a fresh table with deliberate data-quality problems."""
    df = students()
    df["Score"] = df["Score"].astype(object)
    df["Study_Hours"] = df["Study_Hours"].astype(object)
    df.loc[0, "Name"] = " Amira "
    df.loc[1, "Campus"] = "dubai"
    df.loc[3, "Score"] = None
    df.loc[5, "Study_Hours"] = None
    df.loc[7, "Score"] = "absent"
    df.loc[10, "Attendance"] = 105
    return pd.concat([df, df.iloc[[2]]], ignore_index=True)

def departments():
    return pd.DataFrame({
        "Program": ["AI", "IT"],
        "Department": ["Computing", "Information Systems"],
        "Advisor": ["Dr. Noor", "Dr. Sami"],
    })

def assessment():
    return pd.DataFrame({
        "Student_ID": ["S001", "S002", "S003", "S004", "S005", "S006",
                       "S007", "S008", "S009", "S010", "S011", "S013"],
        "Quiz": [17, 14, 19, 13, 16, 19, 17, 11, 15, 18, 14, 16],
        "Project": [44, 36, 46, 34, 40, 47, 42, 30, 38, 45, 35, 41],
    })

def attendance():
    return pd.DataFrame({
        "Date": ["2026-10-01", "2026-10-02", "2026-10-03",
                 "2026-10-05", "2026-10-06", "2026-10-07"],
        "Visitors": [20, 24, 18, 30, 28, 32],
        "Campus": ["RAK"] * 6,
    })

# Create missing practice files. Existing files are preserved.
for _name, _frame in [
    ("students.csv", students()), ("raw_students.csv", raw_students()),
    ("departments.csv", departments()), ("assessment.csv", assessment()),
    ("attendance.csv", attendance()),
]:
    if not (DATA_DIR / _name).exists():
        _frame.to_csv(DATA_DIR / _name, index=False)
if not (DATA_DIR / "students.json").exists():
    students().to_json(DATA_DIR / "students.json", orient="records", indent=2)
if not (DATA_DIR / "students.xlsx").exists():
    try:
        students().to_excel(DATA_DIR / "students.xlsx", sheet_name="Students", index=False)
    except ImportError:
        print("Excel needs openpyxl. Install it before Module 20's Excel cell.")

pd.set_option("display.max_rows", 15)
pd.set_option("display.max_columns", 12)
pd.set_option("display.width", 110)
plt.rcParams.update({"figure.figsize": (7, 4), "axes.spines.top": False,
                     "axes.spines.right": False, "figure.dpi": 110})
print("Ready. pandas", pd.__version__)
print("Practice data: 12 fictional students. Every helper returns a fresh table.")
print("Exports go to:", OUTPUT_DIR.resolve())
