# Pandas, Clearly

**Learn pandas by reading, predicting, changing, and explaining code.**

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates

Pandas, Clearly is a free, hands-on course in Python data analysis. It starts with a short Python bridge and ordinary dictionaries, then builds toward cleaning, grouping, joining, visualizing, and investigating data. Each lesson asks you to do something with the idea you just learned.

The course contains **30 modules and 120 guided lessons**, with a student notebook collection, worked solutions, a browser classroom, and independent practice. Small fictional tables make the early steps easy to inspect; later projects introduce a public dataset with its own source and license information.

## Start here

| Your goal | Open |
| --- | --- |
| Learn the course | [Start here](START_HERE.md) |
| Choose a route through the material | [Course map](docs/course-map.md) |
| Use Jupyter notebooks | [Student notebooks](notebooks/student/) or the [combined student notebook](notebooks/Pandas_Clearly_Student.ipynb) |
| Check a worked solution | [Solution notebooks](notebooks/solutions/) |
| Practise without a worked example beside you | [Independent assessment](notebooks/Independent_Assessment_Student.ipynb) |
| Teach a class | [Teaching guide](docs/teaching-guide.md) |
| Find a familiar operation quickly | [Reference guide](docs/reference-guide.md) |
| Put this repository on GitHub | [Push and publishing instructions](PUSH_TO_GITHUB.md) |

The intended repository is [aalbata/pandas-clearly](https://github.com/aalbata/pandas-clearly). After GitHub Pages is enabled, its course address will be [aalbata.github.io/pandas-clearly](https://aalbata.github.io/pandas-clearly/). A downloaded copy can be previewed locally using the instructions below.

## How a lesson works

1. **Read:** identify what the code and data mean.
2. **Predict:** write down what you expect before running it.
3. **Run:** inspect the real Python output.
4. **Explain:** connect the result to the code, including its labels, types, and shape.
5. **Change:** solve a slightly different problem, using a hint only when needed.
6. **Check:** compare the result and reasoning with the worked explanation.

Quick checks help you notice misunderstandings. Independent tasks ask you to use the same ideas in a different setting. Completing a page is a progress marker; explaining and transferring an idea provide stronger evidence that you understand it.

Six interactive visual walkthroughs make the table operations easier to trace: dictionary-to-table mapping, label and position selection, Boolean masks, grouped aggregation and transformation, duplicate-key joins, and wide/long reshaping. Change a control, predict the result, then try the corresponding operation in a Python cell.

## What you will practise

- Python values, lists, functions, errors, and dictionaries.
- Series, DataFrames, indexes, selection, masks, sorting, and safe updates.
- Types, missing values, duplicates, text, dates, and explicit cleaning decisions.
- Descriptive statistics, grouped summaries, transformations, joins, and reshaping.
- CSV, JSON, Excel, SQL, time series, memory use, sampling, and plots.
- Debugging, a complete classroom analysis, and public-data projects.

The [course map](docs/course-map.md) lists each module and its purpose. The course covers a broad practical foundation; the [official pandas documentation](https://pandas.pydata.org/docs/) remains the reference for the full API and specialist topics.

## Use the browser classroom

The generated website is in `docs/`. Its code cells execute Python in a browser worker using the bundled Pyodide runtime. The first run loads Python and its packages from the course website itself. Reading a lesson does not require starting Python.

To preview the supplied site locally, run this command from the repository folder:

```bash
python -m http.server 8000 --directory docs
```

On Windows, `py` can replace `python` when using the Python launcher. Open [localhost:8000](http://localhost:8000/) in your browser. Keep the terminal open while studying. The complete downloaded repository includes the runtime and lesson data, so this local-server route can work offline. Use a local web server or the published website for the runtime; opening the HTML directly from a file manager can block browser requests.

## Use the notebooks

Python 3.12 is the recommended local starting point. The lesson dependencies in `requirements.txt` pin pandas 2.2.3, NumPy 2.3.5, Matplotlib 3.10.8, and openpyxl 3.1.5. The browser uses its separately bundled environment: Pyodide 0.27.7 with Python 3.12.7, pandas 2.2.3, NumPy 2.0.2, Matplotlib 3.8.4, and openpyxl 3.1.5. Use the validation output to identify the environment tested for a particular build.

Release validation on 22 October 2026 passed all **248 example, solution, and independent-task execution checks** in each of two native environments: [pandas 2.2.3](validation/native-pandas-2.2.3.json) and [pandas 3.0.6](validation/native-pandas-3.0.6.json). These reports record the Python and package versions used.

The same **248 checks also passed in the bundled browser environment**, with all external requests blocked during the test. The [browser report](validation/browser.json) records real Python execution, plots, generated files, saved work, search, keyboard navigation, and responsive layout checks. The [notebook report](validation/notebooks.json) records schema checks for all 64 notebooks and successful sequential execution of the full solutions workbook, assessment solutions, and two representative module notebooks.

Create an environment and install the course dependencies. For Jupyter and development tools, use `requirements-dev.txt`, which includes the lesson requirements. [START_HERE.md](START_HERE.md) provides complete Windows, macOS, and Linux commands.

The notebook collections separate exercises from answers. Every module begins with setup and each example creates fresh data, so changing one exercise does not intentionally change the inputs of the next. Run setup again after restarting a kernel.

## Build and validate

Course content lives in `content/modules/`. Run these commands from the repository root after installing the development requirements:

```bash
python scripts/validate.py --write-outputs
python scripts/build.py
python scripts/check_site.py
python -m http.server 8000 --directory docs
```

Validation checks the examples and solutions; `--write-outputs` also refreshes the verified outputs used by the site. The build creates the static site and notebook downloads from the course source. Commit the generated `docs/` files when publishing from the `main` branch and `/docs` folder. See [CONTRIBUTING.md](CONTRIBUTING.md) for the editing workflow.

## Data, reuse, and contributions

Early student records are fictional teaching data. Modules 27–29 use the public Palmer Penguins data alongside a clearly labeled fictional import exercise. Consult the [public-data notes](data/public/README.md) for sources, derived formats, provenance, and license terms. The MIT license covers the original course material and code, not a change to any third-party dataset's terms.

Corrections, clearer explanations, and reproducible bug reports are welcome. Please include a module or cell ID, the expected behavior, and what actually happened. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [accessibility notes](docs/accessibility.md).

## How to cite this course

If you use or adapt this course in teaching, research, or training, please cite it as follows:

> Al Bataineh, A. (2026). *Pandas, Clearly: Pandas for Data Science* (Version 1.0.0). https://github.com/aalbata/pandas-clearly

```bibtex
@misc{albataineh2026pandasclearly,
  author = {Al Bataineh, Ali},
  title = {Pandas, Clearly: Pandas for Data Science},
  year = {2026},
  version = {1.0.0},
  howpublished = {GitHub repository},
  url = {https://github.com/aalbata/pandas-clearly}
}
```

[CITATION.cff](CITATION.cff) supplies machine-readable citation metadata. The citation request is a request for scholarly credit; reuse is governed by the [MIT license](LICENSE) and the separately identified terms of included third-party material.

---

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
[GitHub: aalbata](https://github.com/aalbata) · [pandas-clearly](https://github.com/aalbata/pandas-clearly)
