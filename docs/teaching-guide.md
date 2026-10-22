# Teaching with Pandas, Clearly

The central teaching goal is simple: a student should be able to explain what a pandas operation does, use it for a changed requirement, and check the result. The course supplies examples and prompts; the teacher supplies pacing, discussion, and judgment about the student's understanding.

## Before the first class

Open the course on a student device, run an early cell, and confirm that the runtime starts. For local use, keep the complete downloaded repository together and serve `docs/` with the command in [START_HERE.md](../START_HERE.md). The bundled browser runtime loads from the course files. The student notebooks provide another route when a browser setting or classroom setup interferes with execution.

Ask students which ideas they already know: a variable, a list, a dictionary, a row, and a column. Use Module 00 for the first three and Modules 01–04 to connect Python data structures to tables. A student who uses spreadsheets may recognize rows and columns while still needing explicit instruction about indexes, code execution, and return values.

## Run a short learning cycle

For each selected lesson:

1. Display the input data and ask one student to describe what a row represents.
2. Ask everyone to predict the result privately before anyone runs the code.
3. Run the example and compare predictions with the output.
4. Ask for an explanation using the code's exact labels, operators, and boundaries.
5. Give the change task and allow time to attempt it.
6. Discuss a common incorrect approach and the reason it fails.
7. Finish with a new, short requirement that uses the same idea.

A useful response to an incorrect prediction is: “Which part of the output surprised you, and which line explains it?” This keeps the discussion tied to evidence. Avoid moving immediately from an incorrect answer to the full solution.

Start with a small number of lessons per session and adjust from what students can explain. Some cells introduce a single operation; others combine several earlier ideas. The module count is a navigation structure, not a prescribed teaching speed.

## Questions that reveal understanding

| Topic | A revealing question |
| --- | --- |
| Dictionaries | Which part is the key, and what changes if I repeat that key? |
| Series and DataFrames | What type and shape does this expression return? |
| Selection | Are these row labels or positions? Is the stop included? |
| Filtering | Show the Boolean mask before showing the filtered table. |
| Cleaning | Which values changed, why did they change, and what remains unknown? |
| Grouping | What does one output row represent, and what is the denominator? |
| Joining | How many rows did you expect, and which keys did not match? |
| Reshaping | Did values move, or were several values summarized? |
| Plotting | What does one mark represent, and what conclusion would go beyond the data? |
| Exporting | Does the saved file preserve the labels needed to interpret it? |

## Use mistakes deliberately

The debugging module is especially useful after students have practised the relevant operations. Ask them to name the faulty assumption before editing the code. Examples include treating an ID as a row position, using `and` between Series, expecting a chained assignment to update the original table, or treating a failed merge as a zero score.

A corrected result should be accompanied by a reason. “It works now” is incomplete; “I used `iloc` because the requirement names a position, and the stop position is excluded” shows the relevant distinction.

## Separate progress from evidence

The classroom's checks and completion indicators support practice. They are not an institutional grade or a certificate of mastery. A student can remember an answer, copy a solution, or reach a correct result by accident.

Look for three kinds of evidence together: a correct result, a clear explanation, and a correct application to a changed problem. Ask students to predict an edge case, such as a missing score, a repeated key, or a nonexistent label. The independent assessment gives an opportunity to work with less scaffolding.

## A suggested assessment rubric

This is an optional teaching rubric, not an official grading policy.

| Criterion | Points | Evidence |
| --- | ---: | --- |
| Understand the question and data | 2 | States the unit of a row, identifies relevant fields, and explains the requested result. |
| Implement the analysis | 3 | Uses correct operations and produces the intended values, labels, and structure. |
| Check the result | 3 | Checks counts, missingness, key matches, ranges, or an independent calculation appropriate to the task. |
| Interpret and communicate | 2 | Explains the result and its limits using the actual data and denominator. |
| **Total** | **10** | |

Accept different correct implementations. For example, a readable Boolean mask and an equivalent query may both answer the same question. A short explanation can reveal whether a superficially correct expression depends on an accidental row order.

## Working in pairs

Have one student predict and explain while the other types. Switch roles after a lesson. Before accepting the pair's answer, ask each student a different follow-up question. Shared keyboard time should still leave room for individual reasoning.

## Public solutions and graded work

Solutions are intentionally available as study material. For graded work, change the data or the requirement and ask for a brief explanation or demonstration. The student and solution notebooks are separate for convenience; they are not an access-control system.

Use fictional student records when demonstrating the early course. For the public-data project, read the source and provenance notes with the class. Discuss why a missing measurement, a study population, and a sampling context matter before making a general statement from a chart.

## Plan a sequence

A practical course sequence is foundations, cleaning, summaries and joins, files and time series, then projects. The [course map](course-map.md) provides checkpoints for each part. Module 10's group-based filling example can be revisited after Module 16, where grouping and transformation receive fuller treatment.

The final project can be split across sessions: source and inspection, cleaning and validation, analysis, then communication and reproducible export. Ask students to preserve their earlier decisions so the final report can be traced back to its inputs.

## Adapt and cite

The original teaching material is available under the MIT license. Keep its license notice when reusing substantial portions, and preserve separately licensed data attribution. The README includes a [course citation](../README.md#how-to-cite-this-course) and the repository provides [CITATION.cff](../CITATION.cff).

---

Dr. Ali Al Bataineh  
Computer Information Science  
Higher Colleges of Technology, Ras Al Khaimah, United Arab Emirates  
[GitHub: aalbata](https://github.com/aalbata) · [pandas-clearly](https://github.com/aalbata/pandas-clearly)
