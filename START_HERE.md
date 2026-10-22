# Start here

Welcome to **Pandas, Clearly**. Begin with one small example, predict what it will print, and run it. Then change the code and explain the new result in your own words.

## Choose your starting point

| Your background | Suggested route |
| --- | --- |
| I have never written Python | Start at Module 00, then follow Modules 01–08 in order. |
| I know spreadsheets but little Python | Start at Module 00. Pay particular attention to dictionary keys, indexes, and the difference between a Series and a table. |
| I already use Python | Try the Module 00 questions, then start at Module 03. Review Modules 01–02 if nested dictionaries or lists are unfamiliar. |
| I have used pandas before | Use the [course map](docs/course-map.md), attempt the change tasks, and revisit the lessons where your explanation breaks down. |

You can move between routes. A route is a starting suggestion, not a test of your background or ability.

## Option 1: learn in the browser

When the course has been published, open [Pandas, Clearly](https://aalbatai.github.io/pandas-clearly/). Choose a module, read the first example, and write a prediction before selecting Run. The first run loads the bundled Python runtime and packages from the course site. A loading message is different from a code error; you can read a lesson before starting the runtime.

If you received a downloaded repository folder, preview the included website from that folder:

```powershell
py -m http.server 8000 --directory docs
```

Then open [http://localhost:8000/](http://localhost:8000/). On macOS or Linux, use `python3` instead of `py`. Keep the server terminal open. The complete downloaded folder contains the runtime and data for local offline study. Opening `docs/index.html` directly is not the recommended way to run browser Python.

## Option 2: learn with Jupyter on Windows

Install Python 3.12 if it is not already available. Extract the complete course folder, open PowerShell in that folder, and run:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m jupyterlab
```

These commands use the environment's Python directly, so PowerShell activation is unnecessary. If the `py` launcher is unavailable but Python 3.12 is on your path, use `python -m venv .venv` for the first command.

In JupyterLab, open a notebook from `notebooks/student/`. The combined course is `notebooks/Pandas_Clearly_Student.ipynb`. Run the setup cell first; its job is to load the packages and prepare data paths. You do not need to understand every helper function before beginning the dictionary lessons.

## Option 3: learn with Jupyter on macOS or Linux

From the extracted repository folder, using an installed Python 3.12:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m jupyterlab
```

Open a student notebook and run its setup cell. Keep your `.venv` environment separate from other projects so a package change in another project does not unexpectedly alter these lessons.

## Working through one lesson

1. Read the small table and the code. Identify each unfamiliar name.
2. Answer the prediction question before running the example.
3. Run it and compare the output with your prediction.
4. Explain why the output has that value, shape, order, or type.
5. Attempt the change task in your own code cell or editor.
6. Use a hint if needed. Open the full solution after making an attempt.
7. Try the quick check, then solve a similar task without looking at the example.

In Jupyter, **Shift+Enter** runs the selected cell and moves to the next one. Edit code in a code cell, not inside the surrounding explanation. Run only code you intend to execute; an example line beginning with `#` is a comment.

## When an error appears

Read the final error type and message, then find the line involved. Common clues include a misspelled name, a missing column, an unexpected type, or a setup cell that has not run.

| What happened | First useful check |
| --- | --- |
| `NameError: name 'pd' is not defined` | Run the setup cell in the current kernel. |
| `ModuleNotFoundError` | Confirm that Jupyter uses the environment where the requirements were installed. |
| `KeyError` for a column or ID | Compare the exact label, including case and spaces, with the table's columns or index. |
| `FileNotFoundError` | Keep the complete course folder together and inspect the path printed by setup. |
| The output differs after several edits | Restart the kernel, rerun setup, and run the single example from its original starting point. |
| Browser Python does not finish loading | Check the classroom status and whether the complete runtime files are being served over HTTP or HTTPS. If using the published site, check the connection. The local notebooks are an alternative. |

An error is useful information about an operation or input. Fix the cause you can identify, then rerun and inspect the result.

## Your work and the solution files

Save a copy of your notebook with your name or a date. Keep exported reports in the output location stated by the lesson. If you use browser controls to save or download your work, open the downloaded file to check what it contains.

The solution notebooks are learning resources. Reading a solution can explain an idea, but it is not the same as writing and explaining your own solution to a changed problem. The independent assessment is a useful next step after you have practised the core modules.

## Further help

Use the [reference guide](docs/reference-guide.md) for common operations and the [official pandas tutorials](https://pandas.pydata.org/docs/getting_started/intro_tutorials/) for another explanation. If you report a problem in this course, include the module and cell ID, your environment, and a small example of the behavior.

---

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
[GitHub: aalbatai](https://github.com/aalbatai) · [pandas-clearly](https://github.com/aalbatai/pandas-clearly)
