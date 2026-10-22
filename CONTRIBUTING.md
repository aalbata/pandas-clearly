# Contributing to Pandas, Clearly

Useful contributions include a clearer question, a corrected output, a reproducible bug report, an accessibility improvement, or a carefully sourced dataset example. A small, well-explained correction is welcome.

## Report a problem

Use the relevant issue template and include the module and cell ID, such as `M05C02`. Show the smallest example that demonstrates the problem, the expected result, and the actual result. For runtime problems, include the browser or Python version and the package versions involved.

Use course data or a small invented example in your report. A screenshot can help with a layout problem; a text copy of the error helps others reproduce a code problem.

## Work on the course locally

1. Fork or clone the repository and create a branch for the change.
2. Create a Python environment and install `requirements-dev.txt`. The [start guide](START_HERE.md) includes Windows commands that do not require environment activation.
3. Edit the source material and update its explanation and checks together.
4. Run validation and rebuild the outputs.
5. Review the changed lesson in the browser and its student/solution notebook forms.
6. Submit a pull request describing the learner-facing change and the checks you ran.

From the repository root:

```bash
python scripts/validate.py --write-outputs
python scripts/build.py
python scripts/check_site.py
python -m http.server 8000 --directory docs
```

Use the Python executable inside your virtual environment when several Python installations are present. The `--write-outputs` flag refreshes the verified example outputs and plots consumed by the build. Run `python scripts/validate.py` without that flag when you only need to check execution. Runtime maintenance uses `python scripts/vendor_runtime.py` to retrieve the pinned browser packages; the bundled runtime is already included for normal learning and local builds.

For changes to notebook setup or generated notebook structure, run `python scripts/check_notebooks.py`. It validates every notebook and executes the complete solutions workbook, assessment solutions, and representative individual notebooks in a temporary course folder.

For changes to the browser interface or runtime, install the separate verification tools and run the browser checks:

```bash
npm ci
npx playwright install chromium
npm run test:browser
npm run test:interactions
npm run test:visuals
```

The default browser run checks a representative selection of modules and every independent assessment task. Use `npm run test:browser:full` when changing the runtime or shared setup to execute all 248 example, solution, and assessment cases. Browser tests serve the course under a project subpath, block external requests, and save reports in `validation/`.

## Source and generated files

| Location | Role |
| --- | --- |
| `content/modules/` | Authored lesson JSON, including example code, questions, change tasks, and solutions. |
| `data/` | Course fixtures and separately documented public data. |
| `assets/` | Browser interface source. |
| `scripts/` | Build, runtime preparation, and validation tools. |
| `docs/` | Published static site, runtime, downloads, and written guides. |
| `notebooks/` | Generated student and solution notebooks. |
| `tests/` | Additional course checks. |

Edit lesson content in `content/modules/` and rebuild its generated forms. The written Markdown guides in `docs/` are authored documentation; preserve them when working on the generated site. Keep the generated site and notebook changes in the same pull request as the source change so the checked-in learning materials stay consistent.

## Lesson conventions

The current format uses four lessons per module. Each lesson has a stable ID, a short explanation, runnable example code, Read/Predict/Explain questions, a concrete change task, a hint, a runnable solution, a quick check, and a takeaway.

- Teach one manageable idea at a time and name prerequisites when an example uses a later concept.
- Explain symbols and return types when they first appear. Do not assume that a beginner knows what an index, mask, or method is.
- Make each example and solution independently runnable after the shared setup. Use fresh data instead of relying on an earlier cell's edits.
- Check actual results: values, labels, shape, missingness, or invariants. A correct alternative implementation should not fail merely because its code looks different.
- Keep expected errors intentional and caught, or show the broken line as a comment, so a full course run can finish.
- Use one explicit `.loc` assignment for selected updates and avoid outdated pandas APIs.
- Keep explanations, predictions, displayed output, and verification assertions consistent when data or code change.
- Write outputs to the lesson's designated output directory. Preserve source fixtures.
- Distinguish fictional practice data from real observations and cite public sources beside their data.

## Review the learning experience

A successful build does not prove that a lesson is clear. Read the lesson as a beginner: can you tell what the code is supposed to do, predict a meaningful result, and understand why your answer differs? Check a narrow screen and keyboard navigation when changing the interface. See the [accessibility notes](docs/accessibility.md).

The course does not award mastery from page completion alone. Avoid wording that treats a quiz score, a green check, or a copied solution as proof of broad competence.

## Pull request description

Explain the problem first, then the changed behavior. Include the module/cell IDs, validation commands and outcomes, and any remaining limitation. For a new dataset, provide its authoritative source, license, retrieval information, and transformations.

## Attribution and license

Original contributions are distributed under the repository's [MIT license](LICENSE). Keep existing attribution and document any separately licensed material. Source links are for readers and verification; they are not permission to copy a book or website wholesale. Use your own explanations and respect the terms of each contribution's source material.

Please follow the [code of conduct](CODE_OF_CONDUCT.md) in issues, reviews, and discussions.

---

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
[GitHub: aalbata](https://github.com/aalbata) · [pandas-clearly](https://github.com/aalbata/pandas-clearly)
