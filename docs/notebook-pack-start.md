# Start the Pandas, Clearly notebook course

This notebook pack contains **30 modules and 120 guided lessons**, worked solutions, an independent assessment, and the data needed by the course. Keep the extracted folder together: notebook setup uses `course_setup.py` and `data/` from this folder.

## Install and open Jupyter

Python 3.12 is the recommended starting point. The first dependency installation needs an internet connection. Open a terminal in the extracted folder that contains `requirements-dev.txt` and `notebooks/`.

On **Windows**, use PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m jupyterlab
```

These commands use the environment's Python directly; activation is unnecessary. If Python 3.12 is installed on your path without the `py` launcher, replace the first command with `python -m venv .venv`.

On **macOS or Linux**, using an installed Python 3.12:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m jupyterlab
```

## Choose a notebook

In the JupyterLab file browser, open one of these:

| What you need | Location |
| --- | --- |
| A short lesson module | `notebooks/student/` |
| The complete student course | `notebooks/Pandas_Clearly_Student.ipynb` |
| Worked module solutions | `notebooks/solutions/` |
| The complete solution course | `notebooks/Pandas_Clearly_Solutions.ipynb` |
| Independent practice | `notebooks/Independent_Assessment_Student.ipynb` |
| Independent practice solutions | `notebooks/Independent_Assessment_Solutions.ipynb` |

Begin at **Module 00** if Python is new to you. If you already know Python values, lists, dictionaries, functions, and imports, try the questions in Modules 00–02 and continue to Module 03 on Series.

Run the **setup cell first**. Setup imports the tools and locates the course data; you do not need to understand all its helper code before starting. **Shift+Enter** runs the selected cell. Run setup again after restarting the kernel.

## Learn through the questions

For each lesson, read the example, write a prediction, run it, and explain the result. Then attempt the change task in a code cell. Use the hint if you need it, and compare your work with the solution after making an attempt. A useful final check is to explain why the code works and solve a similar task with changed data.

Save your notebook regularly. Keep an original copy so you can return to an example's starting point. The solution files are learning resources; the independent assessment gives you practice without a worked answer immediately beside each question.

## If something goes wrong

| Symptom | First check |
| --- | --- |
| `NameError` for `pd` or a setup helper | Run the setup cell in the current kernel. |
| `ModuleNotFoundError` | Launch Jupyter using the environment command above and confirm the dependency installation completed. |
| `FileNotFoundError` | Keep `notebooks/`, `data/`, and `course_setup.py` together in the extracted folder. |
| An unexpected result after edits | Restart the kernel, rerun setup, and run the example from its original starting point. |

Read the final error type and message and find the indicated line. When requesting help, include the module/cell ID, the error text, and the package versions involved.

## Data and credit

Early classroom records are fictional. Later modules use Palmer Penguins public data; source details, transformations, and dataset license terms are in [data/public/README.md](data/public/README.md). The original course material uses the [MIT license](LICENSE). Citation metadata is in [CITATION.cff](CITATION.cff).

If you use or adapt the course in teaching, research, or training, please cite: Al Bataineh, A. (2026). *Pandas, Clearly: Pandas for Data Science* (Version 1.0.0). https://github.com/aalbata/pandas-clearly

---

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
[GitHub: aalbata](https://github.com/aalbata) · [pandas-clearly](https://github.com/aalbata/pandas-clearly)
