"""Build the static course, student notebooks, solutions, and download packs.

Dr. Ali Al Bataineh
Computer Information Science
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates
"""
from __future__ import annotations

import ast
import base64
import html
import json
from pathlib import Path
import re
import shutil
import urllib.parse
import uuid
import zipfile

import markdown

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "docs"
AUTHOR = "Dr. Ali Al Bataineh"
DEPARTMENT = "Computer Information Science"
AFFILIATION = "Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates"
REPO = "https://github.com/aalbata/pandas-clearly"
VERSION = "1.0.0"
VISUAL_MODULES = {2: "dictionary", 5: "selection", 6: "filter", 16: "group", 17: "merge", 19: "reshape"}
SIGNATURE_MD = f"{AUTHOR}  \n{DEPARTMENT}  \n{AFFILIATION}"
SETUP = (ROOT / "course_setup.py").read_text(encoding="utf-8")
MODULES = sorted([json.loads(p.read_text(encoding="utf-8")) for p in (ROOT / "content/modules").glob("*.json")], key=lambda m: m["id"])
ASSESSMENT = json.loads((ROOT / "content/assessment.json").read_text(encoding="utf-8"))
VERIFIED = json.loads((ROOT / "content/verified-outputs.json").read_text(encoding="utf-8")) if (ROOT / "content/verified-outputs.json").exists() else {"environment": {}, "cells": {}}


def h(value):
    return html.escape(str(value), quote=True)


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def name(module):
    return f"{module['id']:02d}-{slug(module['title'])}"


def inline(text):
    safe = h(text)
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", safe)


def json_script(value):
    return json.dumps(value, ensure_ascii=False).replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def signature():
    return f'<div class="author-signature"><strong>{AUTHOR}</strong><span>{DEPARTMENT}</span><span>{AFFILIATION}</span></div>'


def sidebar(prefix, current=None):
    groups = [("Start here", 0, 2), ("Tables and selection", 3, 8), ("Clean and understand", 9, 15), ("Combine and analyze", 16, 19), ("Files and practical work", 20, 26), ("Public data workshops", 27, 29)]
    parts = [f'<aside class="course-sidebar" id="course-sidebar"><div class="sidebar-search"><label for="course-search">Find a task or pandas method</label><input id="course-search" type="search" placeholder="Try: missing, merge, Excel" autocomplete="off"><p id="search-status" class="sr-only" aria-live="polite"></p><div id="search-results" hidden></div></div><nav aria-label="Course modules">']
    for label, low, high in groups:
        parts.append(f'<div class="sidebar-group"><h2>{h(label)}</h2>')
        for module in MODULES:
            if low <= module["id"] <= high:
                active = ' aria-current="page"' if current == module["id"] else ""
                parts.append(f'<a class="module-link" href="{prefix}lessons/{name(module)}.html"{active}><span class="module-number">{module["id"]:02d}</span><span>{h(module["title"])}</span></a>')
        parts.append('</div>')
    parts.append('</nav><div class="sidebar-tools"><p data-progress aria-live="polite">Your practice progress is saved on this device.</p><div class="button-row"><button type="button" class="button small" data-action="export-work">Export my work</button><button type="button" class="button small" data-action="import-work">Import work</button></div><p class="small-print" data-save-status>Save an export to keep a backup.</p></div></aside>')
    return "".join(parts)


def page(title, body, prefix="", current=None, page_type="reading", module=None, setup=None):
    wheels = [prefix + "runtime/et_xmlfile-2.0.0-py3-none-any.whl", prefix + "runtime/openpyxl-3.1.5-py2.py3-none-any.whl"]
    config = {"root": prefix or "./", "runtimeBase": prefix + "runtime/", "manifest": prefix + "data/manifest.json", "setupURL": prefix + "setup.py", "pageType": page_type, "storageKey": "pandas-clearly-v1", "additionalWheels": wheels, "timeoutMs": 60000, "totalCells": sum(len(m['cells']) for m in MODULES)}
    config["learningCellIds"] = [cell["id"] for item in MODULES for cell in item["cells"]]
    if module:
        config["notebookURL"] = prefix + "downloads/notebooks/student/" + name(module) + ".ipynb" if module["id"] >= 0 else prefix + "downloads/notebooks/Independent_Assessment_Student.ipynb"
    data = {"module": module, "setup": setup or SETUP} if module else {}
    visual_assets = f'<link rel="stylesheet" href="{prefix}assets/visuals.css"><script src="{prefix}assets/visuals.js" defer></script>' if module and module["id"] in VISUAL_MODULES else ""
    footer = f'<footer class="page-footer">{signature()}<div class="footer-links"><a href="{prefix}about.html">About &amp; citation</a><a href="{prefix}sources.html">Sources &amp; licenses</a><a href="{prefix}versions.html">Tested environments</a><a href="{REPO}">GitHub repository</a></div><p class="small-print">Pandas, Clearly · Version {VERSION} · Original course material © 2026 Ali Al Bataineh</p></footer>'
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="author" content="Ali Al Bataineh"><meta name="description" content="Pandas, Clearly: a free practical pandas course and reference by Dr. Ali Al Bataineh. Learn through prediction, code, questions, and independent practice."><title>{h(title)} | Pandas, Clearly</title><link rel="stylesheet" href="{prefix}assets/course.css"><script src="{prefix}assets/course.js" defer></script>{visual_assets}</head>
<body data-view="learn"><a class="skip-link" href="#main-content">Skip to main content</a>
<header class="site-header"><a class="brand" href="{prefix}index.html"><span class="brand-title">Pandas, Clearly</span><span class="brand-subtitle">Pandas for Data Science</span></a><nav class="header-nav" aria-label="Main navigation"><a href="{prefix}index.html#paths">Learn</a><a href="{prefix}reference.html">Reference</a><a href="{prefix}datasets.html">Datasets</a><a href="{prefix}downloads.html">Downloads</a></nav><div class="header-actions"><button type="button" class="button small" data-action="toggle-menu" aria-controls="course-sidebar" aria-expanded="false">Modules &amp; search</button></div></header>
<div class="course-shell">{sidebar(prefix, current)}<main id="main-content" class="course-main"><noscript><p class="notice">All explanations, questions, and verified outputs can be read here. Enable JavaScript for search, saved answers, and browser Python, or use the downloadable notebooks.</p></noscript>{body}{footer}</main></div>
<script type="application/json" id="site-config">{json_script(config)}</script><script type="application/json" id="page-data">{json_script(data)}</script></body></html>'''


def expected_variables(cell):
    try:
        stored = {n.id for n in ast.walk(ast.parse(cell["solution"])) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store)}
        used = {n.id for n in ast.walk(ast.parse(cell["solution_verify"])) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load)}
        return sorted(stored & used)
    except SyntaxError:
        return []


def output_html(cell, prefix):
    output = VERIFIED["cells"].get(cell["id"])
    if not output:
        return ""
    version = VERIFIED["environment"].get("pandas", "")
    pictures = "".join(f'<img class="output-plot" src="{prefix}assets/plots/{h(filename)}" alt="Verified example figure for {h(cell["title"])}">' for filename in output["plots"])
    return f'<details class="reference-output"><summary>Verified example output · pandas {h(version)}</summary><pre>{h(output["stdout"])}</pre>{pictures}</details>'


def cell_html(cell, prefix="../", independent=False):
    cid = cell["id"]
    questions = []
    for index, question in enumerate(cell["questions"]):
        qid = f"{cid}-q{index}"
        questions.append(f'<div class="question"><label for="{qid}"><span class="question-tag">{h(question["kind"])}</span>{inline(question["prompt"])}</label><textarea class="question-answer" id="{qid}" data-question-index="{index}" rows="2" placeholder="Explain in your own words…"></textarea></div>')
    question_answers = "".join(f'<li><strong>{h(q["kind"])}.</strong> {inline(q["answer"])}</li>' for q in cell["questions"])
    options = "".join(f'<button type="button" class="button concept-option" data-check-option="{i}">{h(text)}</button>' for i, text in enumerate(cell["check"]["options"]))
    variables = expected_variables(cell)
    names_note = '<p class="small-print">For the code check, keep these result variable names: ' + ", ".join(f'<code>{h(v)}</code>' for v in variables) + ". Different valid approaches are welcome.</p>" if variables else ""
    starter = cell.get("starter", cell["code"])
    return f'''<article class="lesson-cell" id="{cid}" data-cell-id="{cid}">
<header class="cell-heading"><div class="cell-kicker">{h(cid)} · {'Independent task' if independent else 'Explore · predict · practice'}</div><h2>{h(cell['title'])}</h2></header>
<p class="cell-explanation">{inline(cell['explanation'])}</p>
<section class="questions learn-only" aria-label="Questions before running">{''.join(questions)}</section>
<section class="example-area"><h3>{'Starter code' if independent else 'Read the example'}</h3><pre class="example-code"><code>{h(cell['code'])}</code></pre><div class="cell-actions button-row"><button type="button" class="button primary" data-action="run-example" disabled>{'Run starter' if independent else 'Run example'}</button><button type="button" class="button small" data-action="copy-example">Copy code</button></div><div class="run-output example-output" aria-live="polite"></div>{output_html(cell,prefix) if not independent else ''}</section>
<p class="watch"><strong>Watch for this.</strong> {inline(cell['watch'])}</p>
<section class="practice-area learn-only"><h3>Your turn</h3><p>{inline(cell['task'])}</p>{names_note}<label for="{cid}-code" class="editor-label">Your Python code</label><textarea id="{cid}-code" class="practice-code" rows="{min(16,max(6,starter.count(chr(10))+2))}" spellcheck="false" autocapitalize="off" autocomplete="off">{h(starter)}</textarea><div class="cell-actions button-row"><button type="button" class="button primary" data-action="run-practice" disabled>Run my code</button><button type="button" class="button" data-action="check-practice" disabled>Check my code</button><button type="button" class="button small" data-action="reset-practice">Reset code</button><button type="button" class="button small" data-action="copy-practice">Copy my code</button></div><div class="run-output practice-output" aria-live="polite"></div><div class="practice-feedback" aria-live="polite"></div><details class="hint"><summary>Show a hint</summary><p>{inline(cell['hint'])}</p></details><details class="solution"><summary>Show one worked solution</summary><pre><code>{h(cell['solution'])}</code></pre><p>{inline(cell['solution_note'])}</p></details><details><summary>Compare your explanations</summary><ol>{question_answers}</ol></details></section>
<section class="concept-check learn-only"><h3>One quick check</h3><p>{inline(cell['check']['prompt'])}</p><div class="concept-options">{options}</div><p class="concept-feedback" aria-live="polite"></p></section>
<p class="takeaway"><strong>What you should be able to explain.</strong> {inline(cell['takeaway'])}</p><label class="confidence-label learn-only" for="{cid}-confidence">Your own assessment, separate from code checks<select id="{cid}-confidence" data-confidence><option value="0">Not rated yet</option><option value="1">I need help</option><option value="2">I can do it with support</option><option value="3">I can do it and explain it</option></select></label></article>'''


def module_page(module, index):
    base = name(module)
    previous = MODULES[index-1] if index else None
    following = MODULES[index+1] if index+1 < len(MODULES) else None
    links = "".join(f'<a href="#{c["id"]}">{i+1}. {h(c["title"])}</a>' for i,c in enumerate(module["cells"]))
    body = f'''<div class="eyebrow">Module {module['id']:02d} · {h(module['level'])}</div><header class="module-heading"><h1 class="page-title">{h(module['title'])}</h1><p class="lead">{h(module['goal'])}</p><p class="prerequisite"><strong>Before you start:</strong> {h(module['prerequisites'])}</p></header><div class="module-toolbar"><div class="button-row" role="group" aria-label="Lesson view"><button type="button" class="button" data-view="learn" aria-pressed="true">Learn</button><button type="button" class="button" data-view="reference" aria-pressed="false">Quick reference</button></div><div class="button-row"><a class="button small" href="../downloads/notebooks/student/{base}.ipynb" download>Student notebook</a><a class="button small" href="../downloads/notebooks/solutions/{base}.ipynb" download>Solutions notebook</a></div></div><div class="runtime-note"><span data-runtime-status>Python loads from this site on your first run.</span><button type="button" class="button small" data-action="stop-runtime">Stop Python</button><p class="small-print">Each run starts with fresh data. Download any exported files before another run. Your written answers and code drafts are saved on this device; export your work to keep a backup.</p></div><nav class="cell-toc" aria-label="In this module">{links}</nav>'''
    if module["id"] in VISUAL_MODULES:
        body += f'<div data-visual="{VISUAL_MODULES[module["id"]]}"></div>'
    body += "".join(cell_html(cell) for cell in module["cells"])
    body += '<div class="lesson-nav">'
    if previous:
        body += f'<a class="button" href="{name(previous)}.html">Previous: {h(previous["title"])}</a>'
    if following:
        body += f'<a class="button primary" href="{name(following)}.html">Next: {h(following["title"])}</a>'
    body += f'</div><p class="small-print">Further detail: <a href="{h(module["reference"])}">official documentation for this topic</a>.</p>'
    return page(module["title"], body, "../", module["id"], "lesson", module)


def nb_cell(kind, text, role, unique):
    cell = {"cell_type": kind, "id": uuid.uuid5(uuid.NAMESPACE_URL, unique).hex[:12], "metadata": {"role": role}, "source": text.splitlines(keepends=True)}
    if kind == "code":
        cell.update({"execution_count": None, "outputs": []})
    return cell


def notebook(title, cells):
    return {"nbformat": 4, "nbformat_minor": 5, "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}, "language_info": {"name": "python", "version": "3.12"}, "authors": [{"name": "Ali Al Bataineh"}], "pandas_clearly": {"version": VERSION, "affiliation": AFFILIATION, "title": title}}, "cells": cells}


def module_notebook_cells(module, solutions=False):
    mode = "solutions" if solutions else "student"
    result = [nb_cell("markdown", f"## Module {module['id']:02d}. {module['title']}\n\n{module['goal']}\n\nBefore you start: {module['prerequisites']}\n\nOfficial reference: {module['reference']}", "module", f"{mode}-{module['id']}-header")]
    for cell in module["cells"]:
        cid = cell["id"]
        text = f"### {cid}. {cell['title']}\n\n{cell['explanation']}\n\n"
        for q in cell["questions"]:
            text += f"**{q['kind']}:** {q['prompt']}\n\n"
            text += f"Answer: {q['answer']}\n\n" if solutions else "Your explanation: _write here_.\n\n"
        result.append(nb_cell("markdown", text, "questions", f"{mode}-{cid}-questions"))
        result.append(nb_cell("code", f"# Predict before running: {cell['questions'][1]['prompt']}\n{cell['code']}", "example", f"{mode}-{cid}-example"))
        variables = expected_variables(cell)
        variable_note = "\n\nFor the check, keep these result names: " + ", ".join(f"`{v}`" for v in variables) + "." if variables else ""
        task = f"**Your turn:** {cell['task']}{variable_note}\n\n**Hint:** {cell['hint']}\n\n**Watch for this:** {cell['watch']}"
        result.append(nb_cell("markdown", task, "task", f"{mode}-{cid}-task"))
        practice = cell["solution"] if solutions else cell["code"]
        result.append(nb_cell("code", f"# Change this code to complete the task.\n# Question: {cell['task']}\n{practice}", "solution" if solutions else "practice", f"{mode}-{cid}-practice"))
        if solutions:
            result.append(nb_cell("code", "# Check the required result. Can you explain why each condition matters?\n" + cell["solution_verify"] + '\nprint("Code checks passed. Review the written explanation as well.")', "checks", f"{mode}-{cid}-checks"))
            result.append(nb_cell("markdown", cell["solution_note"], "solution_note", f"{mode}-{cid}-note"))
        quick = "**Quick check:** " + cell["check"]["prompt"] + "\n\n"
        quick += "\n".join(f"{i+1}. {option}" for i,option in enumerate(cell["check"]["options"]))
        if solutions:
            quick += f"\n\nAnswer: {cell['check']['correct']+1}. {cell['check']['feedback']}"
        quick += f"\n\n**Explain what you learned:** {cell['takeaway']}"
        result.append(nb_cell("markdown", quick, "reflection", f"{mode}-{cid}-quick"))
    return result


def notebook_opening(title, key):
    intro = f"# {title}\n\nPandas, Clearly · Pandas for Data Science · Version {VERSION}\n\n{SIGNATURE_MD}\n\nRead, predict, run, change, and explain. Every worked example starts from fresh teaching data. The original student/café tables are fictional; the public Penguins files retain their documented source.\n\nRun the setup cell first. Keep this notebook inside the downloaded course folder so its `data/` folder can be found. Exports go to `outputs/`. For public-data lessons, extract the full notebook practice pack.\n\nQuestions: What does one row represent? Which files are inputs, and where will your outputs be written?"
    return [nb_cell("markdown", intro, "introduction", key+"-intro"), nb_cell("code", SETUP, "setup", key+"-setup")]


def write_notebooks():
    for solutions in [False, True]:
        mode = "solutions" if solutions else "student"
        label = "Solutions" if solutions else "Student"
        full = notebook_opening(f"Pandas, Clearly: {label} Workbook", mode)
        for module in MODULES:
            title = f"{module['title']} · {label}"
            cells = notebook_opening(title, mode+name(module)) + module_notebook_cells(module, solutions)
            cells.append(nb_cell("markdown", f"## Keep practicing\n\nCan you apply this idea to a different table without copying the example?\n\n{SIGNATURE_MD}", "author", mode+name(module)+"-footer"))
            write(ROOT / "notebooks" / mode / (name(module)+".ipynb"), json.dumps(notebook(title, cells), ensure_ascii=False, indent=1)+"\n")
            full.extend(module_notebook_cells(module, solutions))
        full.append(nb_cell("markdown", f"## Independent practice\n\nComplete the separate Campus Café assessment on unfamiliar data, then review its explanation rubric.\n\n{SIGNATURE_MD}", "author", mode+"-footer"))
        write(ROOT / "notebooks" / f"Pandas_Clearly_{label}.ipynb", json.dumps(notebook(label+" Workbook", full), ensure_ascii=False, indent=1)+"\n")
        title = "Independent assessment: Campus Café · " + label
        cells = notebook_opening(title, "assessment-"+mode)
        cells.append(nb_cell("markdown", ASSESSMENT["intro"]+"\n\nCode checks do not grade the written explanations. Use the supplied rubric for the complete 40-point assessment.", "instructions", "assessment-"+mode+"-instructions"))
        cells.append(nb_cell("code", "# What does one row in the café data represent?\n"+ASSESSMENT["setup_code"], "assessment_setup", "assessment-"+mode+"-cafe-setup"))
        for task in ASSESSMENT["tasks"]:
            text = f"## {task['id']}. {task['title']} ({task['points']} points)\n\n{task['prompt']}\n\n" + "\n\n".join(f"- {q}" for q in task["questions"])
            text += "\n\nYour explanation: _write here_."
            cells.append(nb_cell("markdown", text, "task", "assessment-"+mode+task["id"]))
            cells.append(nb_cell("code", "# Complete the task above. What result do you expect?\n"+(task["solution"] if solutions else task["starter"]), mode, "assessment-code-"+mode+task["id"]))
            if solutions:
                cells.append(nb_cell("code", "# Can you explain what these checks establish?\n"+task["verify"], "checks", "assessment-check-"+task["id"]))
                rubric = "\n".join(f"- {item['criterion']}: {item['points']} point(s)" for item in task["rubric"])
                cells.append(nb_cell("markdown", f"{task['explanation']}\n\n### Rubric\n\n{rubric}", "rubric", "assessment-rubric-"+task["id"]))
        cells.append(nb_cell("markdown", SIGNATURE_MD, "author", "assessment-"+mode+"-footer"))
        write(ROOT / "notebooks" / f"Independent_Assessment_{label}.ipynb", json.dumps(notebook(title,cells), ensure_ascii=False, indent=1)+"\n")


def home():
    by_id = {m["id"]: m for m in MODULES}
    routes = [("New to Python", "Begin with variables, lists, and dictionaries. Build your first table one step at a time.", 0, "Start from the beginning"), ("Coming from spreadsheets", "Start with tables and familiar operations, then explore indexes, grouping, and files.", 4, "Start with DataFrames"), ("Already using Python", "Explore pandas behavior: labels, selection, missing data, joins, and grouped calculations.", 3, "Start with Series"), ("Solving a problem today", "Find a short example, a common mistake, and a link to the full explanation.", None, "Open the reference")]
    cards = ""
    for title, description, mid, button in routes:
        url = f"lessons/{name(by_id[mid])}.html" if mid is not None else "reference.html"
        cards += f'<article class="card"><h3>{title}</h3><p>{description}</p><a class="button" href="{url}">{button}</a></article>'
    modules = "".join(f'<a class="module-card" href="lessons/{name(m)}.html"><span class="eyebrow">{m["id"]:02d} · {h(m["level"])}</span><h3>{h(m["title"])}</h3><p>{h(m["goal"])}</p><span class="small-print">4 learning cells · questions, practice &amp; solutions</span></a>' for m in MODULES)
    return f'''<section class="hero"><div class="eyebrow">Free course · Practical reference · Real Python</div><h1>Understand your data.<br>Explain your code.</h1><p class="lead">Learn pandas from Python dictionaries to complete data analysis. Predict a result, run the code, change something, and explain what happened.</p><div class="button-row"><a class="button primary" href="lessons/{name(by_id[0])}.html">Start learning</a><a class="button" href="reference.html">Find an answer</a><a class="button" href="start.html">How to use this course</a></div><div class="hero-author">{signature()}</div></section>
<div class="course-facts"><span><strong>{len(MODULES)}</strong> modules</span><span><strong>{sum(len(m['cells']) for m in MODULES)}</strong> worked examples &amp; tasks</span><span><strong>8</strong> independent assessment tasks</span><span><strong>6</strong> data file formats</span></div>
<section id="paths"><h2>Choose your starting point</h2><div class="card-grid">{cards}</div></section>
<section class="panel"><h2>Make understanding visible</h2><p>Each lesson includes a small example, three questions, a change to make, a hint, a worked solution, and a code check. Follow the guided path or switch a lesson to Quick reference.</p><p>Written explanations matter. A successful code check shows that the programmed requirements passed; use the independent assessment and its rubric to examine understanding on unfamiliar data.</p><div class="button-row"><a class="button" href="assessment.html">Independent assessment</a><a class="button" href="teaching.html">For instructors</a><a class="button" href="datasets.html">Meet the datasets</a></div></section>
<section id="curriculum"><h2>The complete learning path</h2><p>Move in order or use a module's prerequisites to choose where to begin.</p><div class="module-grid">{modules}</div></section>'''


def assessment_module():
    cells = []
    for task in ASSESSMENT["tasks"]:
        cells.append({"id":task["id"],"title":task["title"],"explanation":task["prompt"],"code":task["starter"],"starter":task["starter"],"questions":[{"kind":["Read","Predict","Explain"][i],"prompt":q,"answer":"Review your explanation using the rubric and worked solution."} for i,q in enumerate(task["questions"])],"task":task["prompt"],"hint":"Inspect the input columns, decide what one row represents, and state the result you expect before coding.","solution":task["solution"],"solution_note":task["explanation"],"verify":"pass", "solution_verify":task["verify"],"watch":"A code check covers programmed requirements. The explanation and rubric still need review.","takeaway":"I can explain my choices and apply the operation to unfamiliar café data.","check":{"prompt":"What should you do after a code check passes?","options":["Explain the result and check the task rubric.","Assume every data-quality issue is fixed.","Skip checking what one row represents."],"correct":0,"feedback":"Programmed checks and a reasoned explanation provide different evidence."}})
    return {"id":-1,"title":"Independent assessment: Campus Café","cells":cells}


def reference_page():
    choices = [
        ("Build a table from a dictionary",4,0,"dictionary columns rows DataFrame"),
        ("Select columns and keep a table",5,0,"brackets Series DataFrame"),
        ("Select rows by label or position",5,1,"loc iloc index row number"),
        ("Filter with two conditions",6,1,"and or boolean mask"),
        ("Check membership or a range",6,2,"isin between not"),
        ("Sort and choose a tie rule",7,1,"sort_values latest duplicates"),
        ("Update matching rows safely",8,2,"assignment chained Copy-on-Write"),
        ("Convert messy numbers",9,1,"to_numeric errors coerce invalid"),
        ("Understand missing, empty, and zero",10,0,"isna fillna dropna"),
        ("Find repeated IDs",11,1,"duplicated drop_duplicates unique"),
        ("Clean whitespace and text",12,0,"str strip case strings"),
        ("Parse dates deliberately",13,0,"to_datetime format errors"),
        ("Map labels from a dictionary",14,0,"map replace mapping"),
        ("Summarize each group",16,0,"groupby agg mean count"),
        ("Return a group result to each row",16,2,"transform groupby"),
        ("Audit a join",17,2,"merge indicator unmatched"),
        ("Prevent a join from multiplying rows",17,3,"merge validate cardinality"),
        ("Stack batches of rows",18,0,"concat ignore_index append"),
        ("Change wide data to long",19,0,"melt reshape tidy"),
        ("Read and export CSV",20,0,"read_csv to_csv index"),
        ("Select an Excel sheet",20,2,"xlsx read_excel sheet_name"),
        ("Query a SQLite table",20,3,"SQL read_sql sqlite3"),
        ("Expose missing calendar dates",21,0,"date_range asfreq reindex"),
        ("Calculate a rolling average",21,2,"rolling time series window"),
        ("Flatten nested JSON",28,3,"json_normalize nested records"),
    ]
    by_id = {m["id"]:m for m in MODULES}
    cards = []
    recipes = []
    for title, mid, ci, keywords in choices:
        if mid not in by_id: continue
        module = by_id[mid]
        cell = module["cells"][ci]
        url = f"lessons/{name(module)}.html#{cell['id']}"
        cards.append(f'<article class="card recipe"><h2>{h(title)}</h2><p>{inline(cell["takeaway"])}</p><details><summary>Show the tested example</summary><pre><code>{h(cell["code"])}</code></pre><p><strong>Watch for this:</strong> {inline(cell["watch"])}</p></details><a href="{url}">Open the explanation and practice</a></article>')
        recipes.append({"title":title,"text":keywords+" "+cell["takeaway"],"url":url,"module":module["title"],"id":cell["id"]})
    write(ROOT / "content/recipes.json", json.dumps(recipes,ensure_ascii=False,indent=2)+"\n")
    return '<div class="eyebrow">Keep this page nearby</div><h1 class="page-title">Pandas quick reference</h1><p class="lead">Start with the problem you want to solve. Each recipe uses a tested course example and links to its full explanation.</p><p>Use the sidebar search for ordinary language or a method name. <a href="glossary.html">Open the glossary</a> for unfamiliar terms.</p><div class="card-grid reference-grid">'+"".join(cards)+'</div>', recipes


def glossary_page():
    terms = [
        ("Aggregation", "Combining several values into a summary, such as one total per group."),
        ("Alignment", "Matching values by labels when pandas combines or calculates with labeled objects."),
        ("Axis", "A direction in a table: rows or columns. Read each method's documentation to see what its axis parameter controls."),
        ("Boolean mask", "A sequence of True/False values used to select rows or values."),
        ("Category", "A value drawn from a defined set of labels, optionally with a meaningful order."),
        ("Column", "A named series of values describing the same field across rows."),
        ("Copy-on-Write", "A pandas behavior that separates changes to derived objects from their parent. Use one explicit assignment to the object you intend to change."),
        ("DataFrame", "A two-dimensional table with labeled rows and columns."),
        ("Data type (dtype)", "The representation and supported operations for values in a column or array."),
        ("Dictionary", "A Python mapping from keys to values. A dictionary of equal-length lists can describe table columns."),
        ("Duplicate", "A repeated row or repeated combination of selected fields. Define what counts as a duplicate before removing one."),
        ("Group", "Rows that share selected key values and are analyzed together."),
        ("Index", "The labels used to identify rows or Series entries; these labels do not have to be consecutive integers."),
        ("Join key", "The field or fields used to match records between tables."),
        ("JSON", "A text format for structured values such as objects, lists, numbers, strings, and null."),
        ("Missing value", "A recorded absence of a value. It does not automatically mean zero or an empty string."),
        ("Nullable type", "A dtype that can represent missing data alongside its ordinary values, such as pandas Int64."),
        ("Observation", "The entity or event represented by a row. State this explicitly before analysis."),
        ("Resampling", "Grouping time-indexed observations into time bins to calculate summaries or change frequency."),
        ("Schema", "The expected fields, data types, and structural rules of a dataset."),
        ("Series", "A one-dimensional sequence of values with an index."),
        ("Shape", "The number of rows and columns in a table."),
        ("Transformation", "A calculation that changes values or returns group calculations aligned with original rows."),
        ("Validation", "Checking that data and outputs meet explicit expectations."),
        ("Vectorized operation", "An operation expressed over an entire Series or array, rather than a Python loop over individual rows."),
    ]
    rows = "".join(f'<tr><th scope="row">{h(term)}</th><td>{h(definition)}</td></tr>' for term,definition in terms)
    return '<h1 class="page-title">A plain-language pandas glossary</h1><p class="lead">Short definitions to help you read the lessons and official documentation.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Term</th><th>Meaning</th></tr></thead><tbody>'+rows+'</tbody></table></div><p>Continue with the <a href="reference.html">task reference</a> or <a href="https://pandas.pydata.org/docs/user_guide/index.html">official pandas user guide</a>.</p>'


def datasets_page():
    files = sorted(p for p in (ROOT / "data").rglob("*") if p.is_file())
    rows = "".join(f'<tr><td><a href="data/{h(p.relative_to(ROOT/"data").as_posix())}" download>{h(p.relative_to(ROOT/"data").as_posix())}</a></td><td>{h(p.suffix.lstrip(".") or "text")}</td><td>{p.stat().st_size:,} bytes</td></tr>' for p in files)
    return f'''<div class="eyebrow">Small enough to inspect · Documented sources</div><h1 class="page-title">Meet the datasets</h1><p class="lead">Use the included files directly. Lesson cells read from <code>DATA_DIR</code> and write exports to <code>OUTPUT_DIR</code>.</p><div class="card-grid"><article class="card"><h2>Fictional classroom records</h2><p>Student, department, assessment, attendance, and café tables were created for teaching. They include deliberate missing values, unmatched IDs, and other data-quality problems. They do not describe real students.</p></article><article class="card"><h2>Palmer Penguins</h2><p>Public observations with documented provenance and CC0 licensing. The original CSV is preserved, and the derived Excel, text, and JSON files contain the same observations.</p><a href="public-data.html">Source, citation, transformations, and data dictionary</a></article></div><h2>Choose a format</h2><p>CSV and tab-delimited text introduce separators and data types. Excel adds worksheets. JSON, JSON Lines, and nested JSON introduce record structure. The public-data workshops explain how to read and compare them.</p><div class="button-row"><a class="button primary" href="downloads/Pandas_Clearly_Data.zip" download>Download all data</a><a class="button" href="lessons/{name(next(m for m in MODULES if m['id']==27))}.html">Start the file-format workshops</a></div><h2>Included files</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>File</th><th>Format</th><th>Size</th></tr></thead><tbody>{rows}</tbody></table></div>'''


def downloads_page():
    rows = "".join(f'<tr><th scope="row">{m["id"]:02d}. {h(m["title"])}</th><td><a href="downloads/notebooks/student/{name(m)}.ipynb" download>Student</a></td><td><a href="downloads/notebooks/solutions/{name(m)}.ipynb" download>Solutions</a></td></tr>' for m in MODULES)
    return f'''<h1 class="page-title">Download and keep learning</h1><p class="lead">Choose the full notebook practice pack for local study. It includes the notebooks, data, setup helper, and dependency file.</p><div class="card-grid"><article class="card"><h2>Notebook practice pack</h2><p>All modules, full workbooks, independent assessment, and datasets in one download.</p><a class="button primary" href="downloads/Pandas_Clearly_Notebook_Pack.zip" download>Download the notebook pack</a></article><article class="card"><h2>Datasets only</h2><p>Original teaching fixtures and the documented public Penguins data in several formats.</p><a class="button" href="downloads/Pandas_Clearly_Data.zip" download>Download datasets</a></article></div><h2>Complete workbooks</h2><ul><li><a href="downloads/notebooks/Pandas_Clearly_Student.ipynb" download>Complete student workbook</a></li><li><a href="downloads/notebooks/Pandas_Clearly_Solutions.ipynb" download>Complete solutions workbook</a></li><li><a href="downloads/notebooks/Independent_Assessment_Student.ipynb" download>Independent assessment</a></li><li><a href="downloads/notebooks/Independent_Assessment_Solutions.ipynb" download>Assessment solutions and rubric</a></li></ul><p>A notebook downloaded by itself still needs the data folder. The practice pack includes it. <a href="start.html">Read the setup instructions</a>.</p><h2>One module at a time</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>Module</th><th>Student notebook</th><th>Worked solutions</th></tr></thead><tbody>{rows}</tbody></table></div>'''


def markdown_page(path):
    text = path.read_text(encoding="utf-8")
    # The common page footer supplies the affiliation once on the generated page.
    text = text.replace(SIGNATURE_MD, "")
    rendered = markdown.markdown(text, extensions=["fenced_code", "tables", "sane_lists", "toc"])
    mapping = {
        "README.md": "about.html", "START_HERE.md": "start.html",
        "docs/course-map.md": "course-map.html", "docs/teaching-guide.md": "teaching.html",
        "docs/accessibility.md": "accessibility.html", "docs/reference-guide.md": "reference-guide.html",
        "docs/index.html": "index.html", "docs": "index.html",
        "data/public/README.md": "public-data.html", "data/public": "public-data.html",
        "CITATION.cff": "downloads/CITATION.cff", "LICENSE": "downloads/LICENSE",
        "requirements.txt": "downloads/requirements.txt", "requirements-dev.txt": "downloads/requirements-dev.txt",
        "notebooks": "downloads.html", "notebooks/student": "downloads.html", "notebooks/solutions": "downloads.html",
    }
    def rewrite(match):
        href = html.unescape(match.group(1))
        parsed = urllib.parse.urlsplit(href)
        if parsed.scheme or parsed.netloc or not parsed.path:
            return match.group(0)
        target = (path.parent / urllib.parse.unquote(parsed.path)).resolve()
        try: relative = target.relative_to(ROOT).as_posix()
        except ValueError: return match.group(0)
        url = mapping.get(relative)
        if url is None:
            if relative.startswith("notebooks/") and relative.endswith(".ipynb"):
                url = "downloads/" + relative
            elif relative.startswith("data/"):
                url = relative
            elif relative.startswith("docs/") and relative.endswith(".html"):
                url = relative[5:]
            else:
                url = REPO + "/blob/main/" + relative
        if parsed.fragment:
            url += "#" + parsed.fragment
        return 'href="' + h(url) + '"'
    return re.sub(r'href="([^"]+)"', rewrite, rendered)


def make_zip(target, paths):
    target.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(target,"w",zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
        for path, arcname in sorted(paths,key=lambda pair:pair[1]):
            if path.is_file(): archive.write(path,arcname)


def main():
    if not VERIFIED["cells"]:
        raise SystemExit("Run python scripts/validate.py --write-outputs before building the site.")
    if len(VERIFIED["cells"]) != sum(len(m["cells"]) for m in MODULES):
        raise SystemExit("Verified output is incomplete. Run python scripts/validate.py --write-outputs.")
    SITE.mkdir(exist_ok=True)
    for folder in ["assets", "data", "downloads/notebooks"]:
        target = SITE / folder
        if target.exists(): shutil.rmtree(target)
    shutil.copytree(ROOT / "assets", SITE / "assets")
    if (ROOT/"content/verified-plots").exists(): shutil.copytree(ROOT/"content/verified-plots",SITE/"assets/plots")
    shutil.copytree(ROOT / "data", SITE / "data")
    files = [{"path":p.relative_to(ROOT/"data").as_posix(),"url":p.relative_to(ROOT/"data").as_posix()} for p in sorted((ROOT/"data").rglob("*")) if p.is_file() and p.suffix.lower() in {".csv",".tsv",".txt",".xlsx",".json",".jsonl"}]
    write(SITE/"data/manifest.json",json.dumps({"files":files},indent=2)+"\n")
    write(SITE/"setup.py",SETUP)
    write(SITE/".nojekyll","")
    write_notebooks()
    shutil.copytree(ROOT/"notebooks",SITE/"downloads/notebooks")
    pack_paths = [(p,p.relative_to(ROOT).as_posix()) for directory in [ROOT/"notebooks",ROOT/"data"] for p in directory.rglob("*") if p.is_file()]
    pack_paths += [(ROOT/p,p) for p in ["course_setup.py","requirements.txt","requirements-dev.txt","LICENSE","CITATION.cff"] if (ROOT/p).exists()]
    pack_start = ROOT/"docs/notebook-pack-start.md"
    if pack_start.exists(): pack_paths.append((pack_start,"START_HERE.md"))
    make_zip(SITE/"downloads/Pandas_Clearly_Notebook_Pack.zip",pack_paths)
    make_zip(SITE/"downloads/Pandas_Clearly_Data.zip",[(p,p.relative_to(ROOT).as_posix()) for p in (ROOT/"data").rglob("*") if p.is_file()])
    write(SITE/"index.html",page("Learn pandas with understanding",home(),page_type="home"))
    search = []
    for index,module in enumerate(MODULES):
        write(SITE/"lessons"/(name(module)+".html"),module_page(module,index))
        for cell in module["cells"]:
            search.append({"title":cell["title"],"text":" ".join([module["title"],cell["explanation"],cell["code"],cell["task"],cell["watch"]]),"url":f"lessons/{name(module)}.html#{cell['id']}","module":module["title"],"id":cell["id"]})
    reference,recipes = reference_page()
    write(SITE/"reference.html",page("Quick reference",reference))
    write(SITE/"search-index.json",json.dumps(search+recipes,ensure_ascii=False)+"\n")
    write(SITE/"glossary.html",page("Glossary",glossary_page()))
    write(SITE/"datasets.html",page("Datasets",datasets_page()))
    write(SITE/"downloads.html",page("Downloads",downloads_page()))
    assessment = assessment_module()
    body = '<div class="eyebrow">Use unfamiliar data</div><h1 class="page-title">Independent assessment: Campus Café</h1><p class="lead">'+h(ASSESSMENT["intro"])+'</p><p class="notice">Eight tasks, 40 points. Code checks cover programmed requirements; review written explanations with the rubric. Worked answers are available for self-study, so this is not a secure examination system.</p><div class="button-row"><a class="button" href="assessment-rubric.html">Open the complete rubric</a><a class="button" href="downloads/notebooks/Independent_Assessment_Student.ipynb" download>Download assessment notebook</a></div><p class="runtime-note" data-runtime-status>Python loads on your first run. Each task starts with fresh café data.</p>'
    body += "".join(cell_html(cell,"",True) for cell in assessment["cells"])
    write(SITE/"assessment.html",page("Independent assessment",body,page_type="lesson",module=assessment,setup=SETUP+"\n"+ASSESSMENT["setup_code"]))
    rubric = '<h1 class="page-title">Assessment rubric and explanations</h1><p class="lead">Review code, interpretation, and the reasoning behind each choice.</p>'
    for task in ASSESSMENT["tasks"]:
        rows = "".join(f'<tr><td>{h(item["criterion"])}</td><td>{item["points"]}</td></tr>' for item in task["rubric"])
        rubric += f'<section class="panel"><h2>{task["id"]}. {h(task["title"])} · {task["points"]} points</h2><p>{h(task["explanation"])}</p><table class="data-table"><thead><tr><th>Criterion</th><th>Points</th></tr></thead><tbody>{rows}</tbody></table></section>'
    rubric += '<h2>Questions for a short discussion</h2>' + ''.join('<details><summary>'+h(item['prompt'])+'</summary><p>'+h(item['answer'])+'</p></details>' for item in ASSESSMENT['oral_checks'])
    write(SITE/"assessment-rubric.html",page("Assessment rubric",rubric))
    conversions = [
        (ROOT/"START_HERE.md","start.html","Getting started"),
        (ROOT/"docs/teaching-guide.md","teaching.html","For instructors"),
        (ROOT/"docs/course-map.md","course-map.html","Course map"),
        (ROOT/"docs/accessibility.md","accessibility.html","Accessibility"),
        (ROOT/"docs/reference-guide.md","reference-guide.html","Reference guide"),
        (ROOT/"data/public/README.md","public-data.html","Public data provenance"),
    ]
    for source,target,title in conversions:
        if source.exists(): write(SITE/target,page(title,markdown_page(source)))
    about = f'<div class="eyebrow">Open learning, with careful explanations</div><h1 class="page-title">About Pandas, Clearly</h1><p class="lead">A free course and practical reference, developed by {AUTHOR}.</p>{signature()}<h2>How to cite this course</h2><p>If you use or adapt this course in teaching, research, or training, please cite:</p><blockquote>Al Bataineh, A. (2026). <em>Pandas, Clearly: Pandas for Data Science</em> (Version {VERSION}). GitHub. <a href="{REPO}">{REPO}</a>.</blockquote><pre><code>@misc{{albataineh2026pandasclearly,\n  author = {{Al Bataineh, Ali}},\n  title = {{Pandas, Clearly: Pandas for Data Science}},\n  year = {{2026}},\n  version = {{{VERSION}}},\n  url = {{{REPO}}}\n}}</code></pre><p><a href="downloads/CITATION.cff" download>Download CITATION.cff</a> · <a href="{REPO}/issues">Report a correction</a> · <a href="https://orcid.org/0000-0001-9530-7950">Author ORCID</a></p><h2>What progress means</h2><p>Exploring a page, answering a concept question, passing a guided code check, and solving an independent task are different achievements. The course uses questions and an assessment rubric to help you examine understanding, without claiming that completion proves mastery of every pandas feature.</p><h2>Use and adaptation</h2><p>Original course code and teaching material are provided under the MIT license. Public datasets and bundled runtime files retain their own licenses. See <a href="sources.html">sources and licenses</a>.</p>'
    about = about.replace('<h2>How to cite this course</h2>', '<h2 id="how-to-cite-this-course">How to cite this course</h2>')
    write(SITE/"about.html",page("About and citation",about))
    for file in ["LICENSE","CITATION.cff","requirements.txt","requirements-dev.txt"]:
        if (ROOT/file).exists(): shutil.copy2(ROOT/file,SITE/"downloads"/file)
    sources = '<h1 class="page-title">Sources and licenses</h1><p class="lead">Teaching examples are original course material. Technical references point to the official documentation, and public data retains its upstream attribution.</p><h2>Original teaching material</h2><p><a href="downloads/LICENSE">MIT license</a>. The student and café tables are fictional teaching fixtures.</p><h2>Public dataset</h2><p><a href="public-data.html">Palmer Penguins source, authors, citation, CC0 license, and transformations</a>.</p><h2>Technical references</h2><ul>'
    for module in MODULES:
        sources += f'<li>{h(module["title"])}: <a href="{h(module["reference"])}">official documentation</a></li>'
    sources += '</ul><h2>Browser runtime</h2><p>Pyodide 0.27.7 and its package dependencies are bundled under their original licenses. <a href="runtime/LICENSE-PYODIDE">Pyodide license</a>, <a href="runtime/LICENSE-CPYTHON">CPython license</a>, and <a href="runtime/vendor-manifest.json">source and checksum manifest</a>. Package wheels retain upstream license files in their metadata.</p>'
    write(SITE/"sources.html",page("Sources and licenses",sources))
    reports = []
    for path in sorted((ROOT/"validation").glob("*.json")):
        if path.name.startswith("native-pandas-"):
            report=json.loads(path.read_text(encoding="utf-8"))
            reports.append(f'<tr><td>Native Python {h(report["python"])}</td><td>{h(report["pandas"])}</td><td>{report["passed"]} / {report["executed_cases"]} cases passed</td></tr>')
        elif path.name == "browser.json":
            report=json.loads(path.read_text(encoding="utf-8"))
            reports.append(f'<tr><td>Browser Python {h(report["versions"]["python"])} · Chromium {h(report["browser"].split(".")[0])}</td><td>{h(report["versions"]["pandas"])}</td><td>{report["passed"]} / {report["browser_cases"]} cases passed</td></tr>')
    versions = '<h1 class="page-title">Tested environments</h1><p class="lead">The course states exact tested versions so that examples and dependencies can be reproduced.</p><table class="data-table"><thead><tr><th>Environment</th><th>pandas</th><th>Validation</th></tr></thead><tbody>'+"".join(reports)+'</tbody></table><h2>Bundled browser environment</h2><p>Pyodide 0.27.7 · Python 3.12.7 · pandas 2.2.3 · NumPy 2.0.2 · matplotlib 3.8.4 · openpyxl 3.1.5. This runtime is separate from the native requirements file.</p><p>The browser loads runtime assets from this course site. A downloaded repository served locally can run the bundled lessons without internet access. Browser storage is local to the current browser; export your work and download generated files to keep a backup.</p><p>Native validation reports and browser verification details are included in the repository under <code>validation/</code>. New pandas versions should be tested before updating these claims.</p>'
    write(SITE/"versions.html",page("Tested environments",versions))
    write(SITE/"404.html",page("Page not found",'<h1 class="page-title">This page could not be found</h1><p>Open the <a href="index.html">course homepage</a> or use the module search to find the lesson.</p>'))
    print(json.dumps({"modules":len(MODULES),"learning_cells":sum(len(m["cells"]) for m in MODULES),"html_pages":len(list(SITE.rglob("*.html"))),"notebooks":len(list((ROOT/"notebooks").rglob("*.ipynb"))),"site":str(SITE)}))


if __name__ == "__main__":
    main()
