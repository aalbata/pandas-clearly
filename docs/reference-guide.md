# A practical pandas reference

Use this guide after attempting a lesson. It is a reminder of common operations, with questions to ask before trusting the result. Examples assume `import pandas as pd` and a DataFrame named `df`; substitute the actual columns in your data.

## Python and pandas objects

| Expression | Meaning |
| --- | --- |
| `{"Name": "Amira", "Age": 20}` | A dictionary containing named key-value pairs. |
| `[88, 72, 91]` | An ordered Python list. |
| `pd.Series([88, 72, 91])` | A labeled one-dimensional collection. |
| `pd.DataFrame({"Name": ["Amira", "Bilal"], "Score": [88, 72]})` | A two-dimensional labeled table built from equally long plain lists. |
| `df["Score"]` | A Series for one column. |
| `df[["Score"]]` | A one-column DataFrame. |

Ask: is this a dictionary, list, Series, or DataFrame? What do its keys, positions, or labels mean? See [Python data structures](https://docs.python.org/3/tutorial/datastructures.html) and [pandas data structures](https://pandas.pydata.org/docs/user_guide/dsintro.html).

## Inspect before analyzing

| Expression | What it shows |
| --- | --- |
| `df.head(3)` / `df.tail(3)` | First or last three rows. |
| `df.shape` | Number of rows and columns, in that order. |
| `df.columns` / `df.index` | Column labels and row labels. |
| `df.dtypes` | Column storage types. |
| `df.info()` | Structure, types, and non-missing counts. |
| `df.describe()` | A default summary of eligible columns. |
| `df["Program"].value_counts(dropna=False)` | Counts of observed values, including a missing-value entry. |

Attributes such as `shape` have no call parentheses. Methods such as `head()` do. A preview is not a check of every record. See [essential functionality](https://pandas.pydata.org/docs/user_guide/basics.html).

## Select by label or position

| Expression | Selection |
| --- | --- |
| `df.loc[row_label, "Score"]` | A row label and a column label. |
| `df.loc[[label_a, label_b], ["Name", "Score"]]` | Requested row labels and named columns. |
| `df.iloc[0:3, 1:4]` | Row positions 0–2 and column positions 1–3. |
| `df.at[row_label, "Score"]` | One value by labels when those labels identify one cell. |
| `df.iat[0, 2]` | One value by position. |
| `df.set_index("Student_ID", verify_integrity=True)` | Use Student_ID as the index and reject duplicate index labels. |
| `df.reset_index()` | Move the current index into a column. |

An `iloc` slice excludes its stop position. A `loc` label slice includes its endpoint labels when they are present and the label-slicing conditions are satisfied. Duplicate or unsorted labels need extra care. Ask whether an integer is a label or a position before choosing a selector. See [indexing and selecting data](https://pandas.pydata.org/docs/user_guide/indexing.html).

## Build and use a Boolean mask

```python
mask = (df["Score"] >= 80) & (df["Campus"] == "RAK")
result = df.loc[mask, ["Student_ID", "Score"]]
```

Use `&` for AND, `|` for OR, and `~` to reverse a mask. Put parentheses around comparisons. `isin(["AI", "IT"])` checks membership and `between(70, 90, inclusive="both")` checks an inclusive range.

Ask: what should happen when the value being compared is missing? Nullable comparisons can produce missing Boolean values. Decide the treatment explicitly when the rule requires it. The [subset tutorial](https://pandas.pydata.org/docs/getting_started/intro_tutorials/03_subset_data.html) explains masks and selection.

## Add, rename, remove, and update

```python
df["Score_Fraction"] = df["Score"] / 100
renamed = df.rename(columns={"Name": "Student_Name"})
smaller = df.drop(columns=["Join_Date"])
df.loc[df["Student_ID"] == "S004", "Score"] = 67
working = df.copy()
```

The `rename` and `drop` calls shown here return new tables. Assign their results if you want to keep them. Use one explicit `.loc` assignment to change selected values in the original table. Simple `working = df` creates another name for the same object; it is not a copy.

Ask: which object should change? Is the new column's meaning and unit clear? See [new columns](https://pandas.pydata.org/docs/getting_started/intro_tutorials/05_add_columns.html) and [Copy-on-Write](https://pandas.pydata.org/docs/user_guide/copy_on_write.html).

## Convert and clean deliberately

| Operation | Example | Decision to explain |
| --- | --- | --- |
| Detect missing values | `df["Score"].isna()` | Is an empty string also meant to count as missing? |
| Parse numeric text | `pd.to_numeric(df["Score"], errors="coerce")` | Which source values failed to parse, and why? |
| Nullable integers | `pd.Series([20, None], dtype="Int64")` | Is the quantity a whole number with possible unknown values? |
| Remove incomplete rows | `df.dropna(subset=["Score"])` | Which fields are required for this particular analysis? |
| Fill a category label | `df["Campus"].fillna("Unknown")` | Should a missingness flag also be preserved? |
| Find repeated records | `df.duplicated(keep=False)` | Are these exact repeats or legitimate repeated observations? |
| Remove exact repeats | `df.drop_duplicates()` | What evidence justifies removing them? |

Missing is not automatically zero, a failure, or an invalid observation. Preserve raw labels when a conversion would erase their meaning. See [missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html).

## Text and dates

```python
names = df["Name"].astype("string").str.strip()
matches = names.str.contains("am", case=False, regex=False, na=False)
dates = pd.to_datetime(df["Join_Date"], format="%Y-%m-%d", errors="coerce")
months = dates.dt.month
```

`.str` provides operations on text values and `.dt` provides operations on datetime-like values. Be explicit about literal text versus a regular expression and about the intended date format. Inspect parsing failures rather than assuming conversion repaired the data. See [text](https://pandas.pydata.org/docs/user_guide/text.html) and [time series](https://pandas.pydata.org/docs/user_guide/timeseries.html).

## Summaries and groups

```python
summary = (
    df.groupby("Program", as_index=False, dropna=False, observed=True)
      .agg(Rows=("Student_ID", "size"),
           Known_scores=("Score", "count"),
           Mean_score=("Score", "mean"))
)
df["Program_mean"] = df.groupby("Program")["Score"].transform("mean")
```

`size` counts rows; `count` counts non-missing values in the selected column. Aggregation reduces groups to summaries. `transform` returns a result aligned with the original rows. `dropna=False` retains missing group keys, while `observed=True` limits categorical groups to observed categories.

The default standard deviation uses `ddof=1`. Correlation describes association and does not, by itself, establish cause. Ask: what is one result row, what is the denominator, and what observations are excluded? See [grouping](https://pandas.pydata.org/docs/user_guide/groupby.html) and [descriptive statistics](https://pandas.pydata.org/docs/user_guide/basics.html#descriptive-statistics).

## Join and concatenate

```python
joined = left.merge(
    right, on="Student_ID", how="left",
    validate="one_to_one", indicator=True
)
unmatched = joined.loc[joined["_merge"] == "left_only"]
stacked = pd.concat([batch_a, batch_b], ignore_index=True)
```

Choose `inner` for shared keys, `left` to retain left-side records, `right` to retain right-side records, or `outer` to audit the union. Match cardinality matters: repeated keys can multiply rows. Missing right-side measurements do not always prove a missing match; the merge indicator identifies match status.

`concat(..., axis=0)` stacks rows. `axis=1` combines objects as columns, aligning their row labels. Ask: what keys identify records, which side must be unique, and how many output rows should exist? See [merging and concatenation](https://pandas.pydata.org/docs/user_guide/merging.html).

## Reshape

| Operation | Purpose |
| --- | --- |
| `melt(...)` | Turn selected measure columns into long-form rows. |
| `pivot(...)` | Turn distinct column-category labels into columns when each row/column pair identifies one value. |
| `pivot_table(..., aggfunc="mean")` | Summarize repeated row/column combinations with an explicit statistic. |
| `pd.crosstab(...)` | Count category combinations or report specified proportions. |
| `explode(...)` | Expand list-like values into separate rows. |

Ask whether the operation rearranges values, combines observations, or changes what one row represents. See [reshaping](https://pandas.pydata.org/docs/user_guide/reshaping.html).

## Read, write, and verify a file

```python
df = pd.read_csv("students.csv", dtype={"Student_ID": "string"})
df.to_csv("report.csv", index=False)
read_back = pd.read_csv("report.csv", dtype={"Student_ID": "string"})
```

| Format | Read | Write |
| --- | --- | --- |
| CSV or delimited text | `pd.read_csv(path, sep=...)` | `df.to_csv(path, sep=..., index=False)` |
| Excel workbook | `pd.read_excel(path, sheet_name=...)` | `df.to_excel(path, sheet_name=..., index=False)` |
| Record JSON | `pd.read_json(path, orient="records")` | `df.to_json(path, orient="records")` |
| JSON Lines | `pd.read_json(path, lines=True)` | `df.to_json(path, orient="records", lines=True)` |
| SQL query | `pd.read_sql_query(query, connection, params=...)` | `df.to_sql(name, connection, ...)` |

Use the paths supplied by each lesson instead of overwriting source files. Textual IDs, date formats, missing-value tokens, and worksheet names deserve explicit choices. CSV does not preserve every pandas dtype. Check the loaded result's labels, row count, and meaning. See the [I/O guide](https://pandas.pydata.org/docs/user_guide/io.html).

## Time series and plots

Use a sorted, suitable date index before resampling or rolling calculations. `asfreq("D")` requests a daily grid; it does not invent the measurements for missing days. `rolling(3)` counts rows, which correspond to three calendar days only on an appropriate daily grid. A time-based window has a different meaning.

Choose a chart for the question: bars for category summaries, a histogram for numeric distributions, a scatter plot for paired measurements, and a line plot for ordered change. Label the statistic and units, retain visible missingness where it matters, and support the chart with counts or a small numeric table. See [time series](https://pandas.pydata.org/docs/user_guide/timeseries.html) and [visualization](https://pandas.pydata.org/docs/user_guide/visualization.html).

## A final result check

Before accepting an answer, inspect the relevant invariants: expected row count, preserved IDs, key uniqueness, non-missing counts, permitted ranges, totals, and saved-file contents. Choose checks that follow from the question and data contract. A result that runs without an exception can still answer the wrong question.

---

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
[GitHub: aalbatai](https://github.com/aalbatai) · [pandas-clearly](https://github.com/aalbatai/pandas-clearly)
