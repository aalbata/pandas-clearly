# Course map

**Pandas, Clearly** contains 30 modules, numbered 00–29, with four guided lessons in each module. Use the sequence below as a path through the ideas. You can revisit any module after running its setup.

## Choose a route

| Route | Start | What to concentrate on |
| --- | --- | --- |
| New to programming | 00, then 01–08 in order | Values, names, lists, dictionaries, tables, and the meaning of each bracket. |
| Coming from spreadsheets | 00–02 as needed, then 03–08 | Labeled columns, indexes, row filtering, whole-column calculations, and reproducible steps. |
| Comfortable with Python | 03 onward | pandas types, label alignment, missing values, grouping, and joins. |
| Returning pandas user | 09–24, then 25–29 | Data-quality decisions, subtle behavior, debugging, and application to unfamiliar data. |

The routes change your entry point, not the standard for understanding. Explain the result and attempt the change task before deciding that a topic is already familiar.

## Part 1: Python and table foundations

| Module | Topic | You should be able to… |
| --- | --- | --- |
| 00 | A short Python bridge | Read assignments, lists, a small function, import aliases, and an error message. |
| 01 | Start with a dictionary | Identify keys and values; retrieve, add, change, and remove a pair. |
| 02 | From one student to many | Read a dictionary of lists and a list of records; check their structure. |
| 03 | Meet the pandas Series | Distinguish values from labels and explain label-aligned arithmetic. |
| 04 | Build and inspect a DataFrame | Construct a table and inspect its shape, columns, types, and previews. |
| 05 | Select exactly what you need | Choose rows, columns, and values using labels or positions deliberately. |
| 06 | Filter with conditions | Build Boolean masks and combine rules with AND, OR, membership, and ranges. |
| 07 | Sorting and index decisions | Order records, define tie behavior, and set, reset, or reindex labels. |
| 08 | Create and update columns | Calculate fields, rename and remove columns, and update the intended object. |

**Checkpoint:** Given a small new table, select a requested set of records, calculate one new field, and explain why the selection is correct.

## Part 2: Prepare data carefully

| Module | Topic | You should be able to… |
| --- | --- | --- |
| 09 | Data types and safe conversion | Convert numbers, distinguish parsing failures from missing input, and use nullable types. |
| 10 | Missing values and honest cleaning | Detect missing values and justify retaining, excluding, or filling them. |
| 11 | Duplicates and data quality | Separate exact duplicates from repeated keys and check meaningful constraints. |
| 12 | Clean and search text | Normalize labels, search literal or patterned text, split fields, and extract components. |
| 13 | Dates, times, and durations | Parse explicit date formats, select intervals, and calculate elapsed time. |
| 14 | Map, apply, and vectorize | Map labels, read a function applied to values or rows, and use direct column operations. |

**Checkpoint:** Explain each change you make to a messy table. Show what remains unknown and how many records are affected. Module 10's group-based filling example previews an idea developed in Module 16; return to it after that module if needed.

## Part 3: Summarize, combine, and reshape

| Module | Topic | You should be able to… |
| --- | --- | --- |
| 15 | Statistics you can explain | Interpret center, spread, counts, quantiles, and correlation with appropriate limits. |
| 16 | Group, summarize, and compare | Distinguish aggregation, transformation, and group filtering; account for missing keys. |
| 17 | Merge related tables | Choose a join, validate keys, and report unmatched records and unexpected row expansion. |
| 18 | Concatenate and align | Combine row batches or labeled columns and control source priority. |
| 19 | Reshape tables | Move between long and wide forms and distinguish rearrangement from aggregation. |

**Checkpoint:** Produce a grouped result from two tables and show the keys, row counts, match status, and denominator that make the result credible.

## Part 4: Files, time, and visual interpretation

| Module | Topic | You should be able to… |
| --- | --- | --- |
| 20 | Read and write files | Read and export CSV, JSON, Excel, and a small SQLite query result. |
| 21 | Work with time series | Expose missing dates, resample, use rolling windows, and compare periods. |
| 22 | Explore richer structures | Read a MultiIndex, stack or unstack, explode lists, and encode categories. |
| 23 | Work efficiently and reproducibly | Inspect memory, restrict imports, combine chunk totals, and take a repeatable sample. |
| 24 | Plot and interpret | Choose a bar chart, histogram, scatter plot, or time plot and label its meaning. |

**Checkpoint:** Read a file, state the unit of one row, produce a useful plot, and verify a saved report by loading it again.

## Part 5: Apply the skills

| Module | Topic | You should be able to… |
| --- | --- | --- |
| 25 | Debugging clinic | Repair selection, filter, update, and merge mistakes and explain their causes. |
| 26 | End-to-end classroom project | Clean fictional records, retain an audit trail, summarize, merge, visualize, and export. |
| 27 | Import CSV and text with confidence | Handle delimiters, comments, text encoding, IDs, and missing-value tokens deliberately. |
| 28 | Work across Excel and JSON formats | Select worksheets and work with record JSON, JSON Lines, and nested records. |
| 29 | Analyze a real public dataset | Audit a source, account for missingness, report denominators, and present a reproducible analysis. |

Modules 27–29 use the [documented public-data fixtures](../data/public/README.md), including Palmer Penguins and its derived formats. A separate import exercise is explicitly fictional. The independent assessment asks you to combine skills with fewer prompts than a guided lesson.

## A practical order for study

Complete the foundations before trying to memorize many methods. Revisit missing values and indexes as you learn joins and grouping; they affect almost every analysis. After a guided project, try the independent assessment without opening the solution notebook. Use the reference guide when you forget syntax, and explain the decisions that syntax implements.

## Scope

This course gives a broad practical foundation in pandas. Specialist areas such as distributed computing, production database administration, advanced statistical inference, and the full pandas extension API need additional study. The [official pandas user guide](https://pandas.pydata.org/docs/user_guide/) and the [reference guide](reference-guide.md) provide useful next steps.

---

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
[GitHub: aalbata](https://github.com/aalbata) · [pandas-clearly](https://github.com/aalbata/pandas-clearly)
