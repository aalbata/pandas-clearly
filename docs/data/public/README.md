# Public data for Pandas, Clearly

## What this dataset contains

These files contain the real, publicly available **Palmer Penguins** dataset distributed by the `palmerpenguins` project. The upstream simplified `penguins.csv` contains **344 observations and 8 variables** from study years **2007–2009**. One row describes an observed penguin. It is not a current census of all penguins and is not a causal experiment.

The data were collected and made available by **Dr. Kristen Gorman and the Palmer Station Antarctica Long Term Ecological Research program**. The teaching conversions preserve the observations. No penguin records have been generated, sampled, imputed, rounded, removed, reordered, or duplicated.

The unmodified source is the package's simplified eight-column `penguins` table. It is different from the package's seventeen-column dataset named `penguins_raw`, which is not included here.

## Provenance and citation

- [Official project](https://allisonhorst.github.io/palmerpenguins/)
- [Official field definitions and underlying data citations](https://allisonhorst.github.io/palmerpenguins/reference/penguins.html)
- [Official authors and citation](https://allisonhorst.github.io/palmerpenguins/authors.html)
- [Pinned upstream revision](https://github.com/allisonhorst/palmerpenguins/commit/8957207b78d6ccd1b4654a9dd9c9041b657478ab)
- [Exact downloaded CSV](https://raw.githubusercontent.com/allisonhorst/palmerpenguins/8957207b78d6ccd1b4654a9dd9c9041b657478ab/inst/extdata/penguins.csv)
- Retrieved **2026-10-22 UTC**. The precise timestamp, upstream paths, transformations, and checksums are recorded in [provenance.json](provenance.json).

**Dataset/package citation:** Horst AM, Hill AP, Gorman KB (2020). *palmerpenguins: Palmer Archipelago (Antarctica) penguin data*. [doi:10.5281/zenodo.3960218](https://doi.org/10.5281/zenodo.3960218). The official citation names package version 0.1.0; the pinned repository's DESCRIPTION identifies version 0.1.1. Both upstream texts are preserved locally.

**Original research:** Gorman KB, Williams TD, Fraser WR (2014). Ecological Sexual Dimorphism and Environmental Variability within a Community of Antarctic Penguins (Genus Pygoscelis). *PLoS ONE*, 9(3), e90081. [doi:10.1371/journal.pone.0090081](https://doi.org/10.1371/journal.pone.0090081).

**Underlying public data:** [Adélie](https://doi.org/10.6073/pasta/98b16d7d563f265cb52372c8ca99e60f), [Gentoo](https://doi.org/10.6073/pasta/7fca67fb28d56ee2ffa3d9370ebda689), and [Chinstrap](https://doi.org/10.6073/pasta/c14dfcfada8ea13a17536e73eb6fbe9e) datasets, attributed by the upstream project to Palmer Station Antarctica LTER and K. Gorman.

## License

The upstream repository distributes these data under **CC0 1.0 Universal**. [LICENSE_DATA.txt](LICENSE_DATA.txt) is a byte-for-byte copy of the pinned upstream license, with only its local filename changed. Consult that complete license for its terms. The course's own content license does not replace the dataset's license. Dataset authors and the course author have different roles; preserve both attributions when reusing this folder.

## Files and exact transformations

| File | Contents and transformation |
| --- | --- |
| `penguins.csv` | Original downloaded CSV bytes, unchanged. The source missing-value token is `NA`. |
| `penguins.tsv` | Identical header and record text written with tab separators and LF line endings. Original `NA` tokens remain. |
| `penguins.txt` | Identical header and record text written with semicolon separators after two `#` comment lines. Read with `sep=";", comment="#"`. |
| `penguins.xlsx` | `Penguins` has the same 344 records in A1:H345, including its one header row. Numbers are numeric cells and source `NA` values are blank cells. `Data_Dictionary!A1:D9` contains field definitions, units, and missing counts; source notes are outside that table in column F. No formulas or index column are added. |
| `penguins.records.json` | An array of 344 objects. Source `NA` becomes JSON `null`. Bill measurements are JSON numbers; flipper length, body mass, and year are integer numbers when known. Categories retain their original spelling. |
| `penguins.jsonl` | The same typed objects, one per line, with no enclosing array. Read with `lines=True`. |
| `penguins.nested.json` | The same records with the four measurements moved into a `measurements` object. This nesting was made for teaching `json_normalize`; it is not an upstream API response. |
| `penguins.data_dictionary.json` | Descriptions and units adapted from the official field definitions; missing counts computed from the source CSV. |
| `UPSTREAM_CITATION.txt` / `UPSTREAM_DESCRIPTION.txt` | Exact upstream text bytes, preserved for attribution and version context. |
| `source_retrieval.json` | Retrieval timestamp, immutable commit, download URLs, and downloaded byte counts. |
| `import_practice_semicolon.csv` | A separate **original fictional** three-record parsing exercise, described below. It is not research data. |

All public-data representations retain the same row order, values, categories, and missingness. JSON and Excel express missing values differently from CSV, and readers may infer different pandas dtypes. Compare parsed values and missingness after choosing consistent dtypes; identical file bytes are not expected across different formats.

## Field dictionary

| Field | Meaning | Unit | Missing records |
| --- | --- | --- | ---: |
| `species` | Adelie, Chinstrap, or Gentoo | Category | 0 |
| `island` | Biscoe, Dream, or Torgersen | Category | 0 |
| `bill_length_mm` | Bill length | mm | 2 |
| `bill_depth_mm` | Bill depth | mm | 2 |
| `flipper_length_mm` | Flipper length | mm | 2 |
| `body_mass_g` | Body mass | g | 2 |
| `sex` | Recorded female or male | Category | 11 |
| `year` | Study year, 2007–2009 | Year | 0 |

There are **342 known body masses** and **333 complete records across all eight fields**. These are different denominators. For a body-mass-only summary, missing sex is not automatically a reason to exclude an otherwise usable measurement. State the required fields and report how many observations support each summary. Missingness is not proof of a zero value or of random omission.

The simplified table has no animal identifier. A row position is a trace to the source file, not evidence of individual identity. Group averages describe the sampled observations and do not establish causes or a universal species/island population average.

## Separate fictional import exercise

`import_practice_semicolon.csv` is original course material. It contains three invented records with leading-zero IDs `001`, `010`, and `100`. Within this exercise, `NA` is a literal code for **North Area**, `EU` means **East Unit**, and `MISSING` marks one unavailable amount. The numeric amounts are 12.50 EUR, missing, and a recorded 0.00 EUR.

The file uses UTF-8 with a byte-order mark, two `#` comment lines, semicolon delimiters, comma decimal separators, and CSV quoting around an embedded semicolon. These choices are intentional parsing challenges. Do not describe this fixture as Palmer Penguins data or as real transactions.

## Checksums

SHA-256 hashes below identify the supplied bytes. Per-file transformations and hashes are also machine-readable in `provenance.json`. That manifest does not attempt to hash itself.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `penguins.csv` | 15,241 | `f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93` |
| `penguins.tsv` | 15,241 | `cda75e6d5943231ef1c59bb6829013e4925941e65e6e77b08c5cc7a36e5b698c` |
| `penguins.txt` | 15,365 | `23d79c843a611f80d5c6b6bd108818806f0239eaef8cd4d7f7fba4e105a08b31` |
| `penguins.records.json` | 70,725 | `f21d9654d95494c26e4fa72c112a6f9e593c368a01984cfb629a1a7ab5a0222d` |
| `penguins.jsonl` | 52,146 | `a675b15c29f3b4a9ba1f4dd2c1c42abf1acdfcf35c98723e8d669d16863e81c1` |
| `penguins.nested.json` | 83,109 | `a3e462b5cf6aed72d9c91c529ded78ba88d347ffe330628d43659f389faab5e3` |
| `penguins.xlsx` | 17,509 | `4f5515305590f36151bd58b2d01ca45fbcfa5534a09a58cb8b46871a6a5c62c5` |
| `penguins.data_dictionary.json` | 1,071 | `2b69a01ae0154f9d48c0797850deee6abe59de73cd060ada9b9dbad6c67e45c0` |
| `import_practice_semicolon.csv` | 280 | `6204c0374b32b751489254f89105f13867f2d851986d19b7ac1e022a03f76876` |
| `LICENSE_DATA.txt` | 6,966 | `8e2c443dd9aea6fcd6c293dbf66935bd5ef502fc0ca9b466c773cf9316d5e04c` |
| `UPSTREAM_CITATION.txt` | 638 | `5d408831f180a3cd1e4b5ca19f5614ebf3a59386650bcfd7c3b8fc4054dbdc01` |
| `UPSTREAM_DESCRIPTION.txt` | 1,454 | `71ffb68cb47285e2ea534da56b2e9af4532148542a063868c38646bd8c990a31` |
| `source_retrieval.json` | 1,343 | `1bdd45e16272dc68350dd6cbec4334e967536fb94ec4222ea88f5625c24dd036` |

## Course attribution

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
GitHub: [aalbatai](https://github.com/aalbatai)
