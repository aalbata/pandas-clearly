/* Small conceptual models for Pandas, Clearly. Real pandas runs in the lesson worker. */
(() => {
  "use strict";
  let sequence = 0;
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  const spec = {
    dictionary: ["From dictionary lists to table cells", "Predict: where will the second value in the Score list appear in the table? Change the key and position to trace a value."],
    selection: ["Labels and positions are different addresses", "Predict: does 20 mean the same thing to loc and iloc? Change the method without changing the argument, then find Bilal again."],
    filter: ["Build a mask from two conditions", "Predict: will AND or OR keep more rows? Try each operator, then change one threshold and explain which rows move."],
    group: ["One result per group, or one per original row?", "Predict: will two department means produce two rows or four? Compare aggregation with transform and follow one department."],
    merge: ["Every matching pair becomes a result row", "Predict: two students share D1. How many merged rows will appear if the lookup contains D1 twice? Toggle the extra row."],
    reshape: ["Change the shape, keep the measurements", "Predict: do four scores become eight when two rows become four? Follow one score through melt and pivot."]
  };
  function table(caption, columns, rows, options = {}) {
    const wrapper = el("div", "visual-table-wrap");
    wrapper.tabIndex = 0;
    wrapper.setAttribute("aria-label", caption);
    const node = el("table", "visual-table");
    node.append(el("caption", "", caption));
    const head = el("thead"), heading = el("tr");
    columns.forEach((column, index) => {
      const cell = el("th", options.columnClass?.(index) || "", column);
      if (String(column).includes("_")) {
        const parts = String(column).split("_"); cell.textContent = parts.shift();
        for (const part of parts) cell.append(el("wbr"), document.createTextNode(`_${part}`));
      }
      cell.scope = "col"; heading.append(cell);
    });
    head.append(heading); node.append(head);
    const body = el("tbody");
    rows.forEach((row, rowIndex) => {
      const tr = el("tr", options.rowClass?.(rowIndex) || "");
      row.forEach((value, colIndex) => {
        const cell = el(colIndex === 0 ? "th" : "td", options.cellClass?.(rowIndex, colIndex) || "", value);
        if (colIndex === 0) cell.scope = "row";
        tr.append(cell);
      });
      body.append(tr);
    });
    if (!rows.length) {
      const tr = el("tr"), td = el("td", "visual-empty", options.empty || "No rows match this selection.");
      td.colSpan = columns.length; tr.append(td); body.append(tr);
    }
    node.append(body); wrapper.append(node);
    return wrapper;
  }
  function pane(title, content, note) {
    const box = el("section", "visual-pane");
    box.append(el("h3", "", title), content);
    if (note) box.append(el("p", "visual-pane-note", note));
    return box;
  }
  function codeLine(shell, code) { shell.code.textContent = code; }
  function summary(shell, text, state = "normal") { shell.summary.textContent = text; shell.summary.dataset.state = state; }
  function choose(shell, name, label, values, initial, changed) {
    const field = el("div", "visual-field");
    const id = `${shell.id}-${name}`;
    const caption = el("label", "", label); caption.htmlFor = id;
    const select = el("select"); select.id = id; select.dataset.testid = `visual-${shell.type}-${name}`;
    for (const [value, text] of values) {
      const option = el("option", "", text); option.value = value; select.append(option);
    }
    select.value = String(initial);
    select.addEventListener("change", changed);
    field.append(caption, select); shell.controls.append(field);
    return select;
  }
  function toggle(shell, name, label, changed) {
    const field = el("label", "visual-toggle");
    const input = el("input"); input.type = "checkbox"; input.id = `${shell.id}-${name}`;
    input.dataset.testid = `visual-${shell.type}-${name}`;
    input.addEventListener("change", changed);
    field.append(input, el("span", "", label)); shell.controls.append(field);
    return input;
  }
  function legend(shell, items) {
    const row = el("div", "visual-legend");
    for (const [name, label] of items) row.append(el("span", name, label));
    shell.legend.replaceChildren(row);
  }
  function makeShell(host, type) {
    const id = `pandas-visual-${++sequence}`;
    host.classList.add("visual-walkthrough"); host.dataset.visualMounted = "true";
    host.setAttribute("role", "region"); host.setAttribute("aria-labelledby", `${id}-title`);
    const heading = el("header", "visual-heading");
    heading.append(el("div", "visual-eyebrow", "Visual walkthrough"));
    const title = el("h2", "", spec[type][0]); title.id = `${id}-title`;
    heading.append(title, el("p", "visual-model-note", type === "dictionary" ? "Concept preview · DataFrame construction is introduced in Module 04." : "Concept model · run pandas in the Python cells below."));
    const question = el("p", "visual-prediction", spec[type][1]);
    const controls = el("div", "visual-controls"); controls.setAttribute("role", "group"); controls.setAttribute("aria-label", `${spec[type][0]} controls`);
    const legendBox = el("div", "visual-legend-box");
    const stage = el("div", "visual-stage"); stage.dataset.testid = `visual-${type}-stage`;
    const output = el("p", "visual-summary"); output.setAttribute("role", "status"); output.setAttribute("aria-live", "polite"); output.setAttribute("aria-atomic", "true"); output.dataset.testid = `visual-${type}-summary`;
    const codeLabel = el("p", "visual-code-label", "Related pandas expression");
    const pre = el("pre", "visual-code"); const code = el("code"); code.dataset.testid = `visual-${type}-code`; pre.append(code);
    host.append(heading, question, controls, legendBox, stage, output, codeLabel, pre);
    return { type, id, host, controls, stage, summary: output, code, legend: legendBox };
  }

  function dictionary(shell) {
    const data = { Name: ["Amira", "Bilal", "Chen"], Score: [82, 91, 74], Campus: ["RAK", "Dubai", "RAK"] };
    const keys = Object.keys(data);
    const key = choose(shell, "key", "Dictionary key → column", keys.map(k => [k, k]), "Score", render);
    const position = choose(shell, "position", "List position → row", [[0, "0 · first"], [1, "1 · second"], [2, "2 · third"]], 1, render);
    legend(shell, [["visual-key", "Chosen key / column"], ["visual-row", "Chosen position / row"], ["visual-hit", "Selected value"]]);
    function render() {
      const k = keys.indexOf(key.value), p = Number(position.value);
      const input = table("Dictionary list positions: 0, 1, 2 · equal-length lists", ["Key", "0", "1", "2"], keys.map(name => [name, ...data[name]]), {
        cellClass: (r, c) => r === k && c === p + 1 ? "visual-hit" : r === k ? "visual-key" : c === p + 1 ? "visual-row" : ""
      });
      const output = table("DataFrame with its default index", ["Index", ...keys], [0, 1, 2].map(i => [i, ...keys.map(name => data[name][i])]), {
        columnClass: c => c === k + 1 ? "visual-key" : "",
        cellClass: (r, c) => r === p && c === k + 1 ? "visual-hit" : c === k + 1 ? "visual-key" : r === p ? "visual-row" : ""
      });
      shell.stage.replaceChildren(pane("Dictionary", input), pane("DataFrame", output));
      summary(shell, `The ${key.value} key becomes a column. List position ${p} becomes index label ${p} when no index is supplied. The selected value is ${JSON.stringify(data[key.value][p])}.`);
      codeLine(shell, `df = pd.DataFrame(data)\ndata[${JSON.stringify(key.value)}][${p}]  # same value as df.loc[${p}, ${JSON.stringify(key.value)}]`);
    }
    render();
  }

  function selection(shell) {
    const rows = [[10, "Amira", 82], [20, "Bilal", 91], [30, "Chen", 74]];
    const method = choose(shell, "method", "Addressing method", [["loc", "loc · index labels"], ["iloc", "iloc · row positions"]], "loc", render);
    const argument = choose(shell, "argument", "Selector value", [0, 1, 2, 10, 20, 30].map(v => [v, String(v)]), 20, render);
    legend(shell, [["visual-hit", "Selected row"], ["visual-row", "Position is shown separately"]]);
    function render() {
      const n = Number(argument.value);
      const index = method.value === "loc" ? rows.findIndex(row => row[0] === n) : n < rows.length ? n : -1;
      const found = index >= 0;
      const input = table("Index labels are 10, 20, 30; positions are 0, 1, 2", ["Index", "Position", "Name", "Score"], rows.map((r, i) => [r[0], i, r[1], r[2]]), {
        rowClass: r => r === index ? "visual-hit" : "",
        cellClass: (r, c) => c === 1 && r !== index ? "visual-row" : ""
      });
      const output = table("A list selector keeps the DataFrame shape", ["Index", "Name", "Score"], found ? [rows[index]] : [], { empty: method.value === "loc" ? `No label ${n}: KeyError.` : `No position ${n}: IndexError.` });
      shell.stage.replaceChildren(pane("Input table", input), pane("Selected result", output));
      codeLine(shell, `df.${method.value}[[${n}]]`);
      summary(shell, found ? `${method.value} uses ${method.value === "loc" ? "index label" : "row position"} ${n}. It selects ${rows[index][1]}; the result keeps index label ${rows[index][0]}.` : `${method.value} cannot select ${n} here. ${method.value === "loc" ? "Available labels are 10, 20, and 30; pandas would raise KeyError." : "Available positions are 0, 1, and 2; pandas would raise IndexError."}`, found ? "normal" : "warning");
    }
    render();
  }

  function filter(shell) {
    const rows = [["Amira", 82, 90], ["Bilal", 91, 72], ["Chen", 74, 96], ["Dana", 68, 66]];
    const score = choose(shell, "score", "Condition A: minimum score", [70, 80, 90].map(v => [v, `Score ≥ ${v}`]), 80, render);
    const attendance = choose(shell, "attendance", "Condition B: minimum attendance", [75, 85, 95].map(v => [v, `Attendance ≥ ${v}%`]), 85, render);
    const operator = choose(shell, "operator", "Combine the conditions", [["and", "AND · both must pass"], ["or", "OR · at least one must pass"]], "and", render);
    legend(shell, [["visual-hit", "Keep: condition is True"], ["visual-drop", "Drop: condition is False"]]);
    function render() {
      const a = Number(score.value), b = Number(attendance.value), both = operator.value === "and";
      const mask = rows.map(r => both ? r[1] >= a && r[2] >= b : r[1] >= a || r[2] >= b);
      const kept = rows.filter((_, i) => mask[i]);
      const input = table("Evaluate each row before selecting it", ["Name", `Score ≥ ${a}`, `Attendance ≥ ${b}%`, "Mask"], rows.map((r, i) => [r[0], `${r[1]} · ${r[1] >= a ? "Yes" : "No"}`, `${r[2]} · ${r[2] >= b ? "Yes" : "No"}`, mask[i] ? "Keep" : "Drop"]), { rowClass: i => mask[i] ? "visual-hit" : "visual-drop" });
      const output = table("Only rows with a True mask remain", ["Name", "Score", "Attendance (%)"], kept);
      shell.stage.replaceChildren(pane("Conditions → mask", input), pane(`${kept.length} of 4 rows kept`, output));
      codeLine(shell, `df.loc[(df["Score"] >= ${a}) ${both ? "&" : "|"} (df["Attendance"] >= ${b})]`);
      summary(shell, `${both ? "AND requires both conditions" : "OR requires at least one condition"}. The mask keeps ${kept.length} of 4 rows${kept.length ? `: ${kept.map(r => r[0]).join(", ")}` : ""}. Parentheses keep each pandas condition together.`);
    }
    render();
  }

  function group(shell) {
    const rows = [["Amira", "IT", 80], ["Bilal", "IT", 90], ["Chen", "EE", 70], ["Dana", "EE", 90]];
    const means = { IT: 85, EE: 80 };
    const mode = choose(shell, "mode", "Where should the mean go?", [["agg", "agg · one row per group"], ["transform", "transform · keep all rows"]], "agg", render);
    const highlight = choose(shell, "highlight", "Follow a department", [["IT", "IT · two students"], ["EE", "EE · two students"]], "IT", render);
    legend(shell, [["visual-hit", "Chosen department and its result"]]);
    function render() {
      const aggregate = mode.value === "agg", key = highlight.value;
      const input = table("Four students in two departments", ["Name", "Department", "Score"], rows, { rowClass: i => rows[i][1] === key ? "visual-hit" : "" });
      const outputRows = aggregate ? [["EE", means.EE], ["IT", means.IT]] : rows.map(r => [...r, means[r[1]]]);
      const output = table(aggregate ? "One mean per department" : "The group mean is assigned back to each original row", aggregate ? ["Department", "Department_mean"] : ["Name", "Department", "Score", "Department_mean"], outputRows, { rowClass: i => (aggregate ? outputRows[i][0] : outputRows[i][1]) === key ? "visual-hit" : "" });
      shell.stage.replaceChildren(pane("4 input rows", input), pane(`${outputRows.length} output rows`, output));
      codeLine(shell, aggregate ? 'df.groupby("Department", as_index=False).agg(\n    Department_mean=("Score", "mean")\n)' : 'df.assign(Department_mean=\n    df.groupby("Department")["Score"].transform("mean")\n)');
      summary(shell, aggregate ? `Aggregation returns 2 rows: one per department. ${key} has mean ${means[key]}. The original student rows are summarized.` : `Transform returns one value per original row. Assigning it as a column keeps all 4 students; ${key}'s mean ${means[key]} appears on both ${key} rows.`);
    }
    render();
  }

  function merge(shell) {
    const students = [["Amira", "D1"], ["Bilal", "D1"]];
    const duplicate = toggle(shell, "duplicate", "Add a second D1 row to the department lookup", render);
    legend(shell, [["visual-hit", "D1 matches"], ["visual-duplicate", "Duplicate lookup key"]]);
    function render() {
      const lookup = [["D1", "Engineering"], ["D2", "Business"]];
      if (duplicate.checked) lookup.push(["D1", "Engineering"]);
      const output = students.flatMap(student => lookup.filter(dept => dept[0] === student[1]).map(dept => [student[0], student[1], dept[1]]));
      const left = table("Two student rows share D1", ["Name", "Dept"], students, { cellClass: (r, c) => c === 1 ? "visual-hit" : "" });
      const right = table("The lookup key should be unique", ["Dept", "Department"], lookup, { rowClass: i => lookup[i][0] === "D1" ? duplicate.checked ? "visual-duplicate" : "visual-hit" : "" });
      const result = table("Result of the left merge without validation", ["Name", "Dept", "Department"], output, { rowClass: () => duplicate.checked ? "visual-duplicate" : "visual-hit" });
      const sources = el("div", "visual-merge-inputs"); sources.append(pane("Students", left), pane("Department lookup", right));
      shell.stage.replaceChildren(sources, pane(`${output.length} result rows`, result));
      codeLine(shell, 'students.merge(departments, on="Dept", how="left")\n# Add validate="many_to_one" to require unique lookup keys.');
      summary(shell, duplicate.checked ? "2 student rows × 2 D1 matches = 4 result rows. Each student matches both lookup rows. Adding validate=\"many_to_one\" would raise MergeError and stop this expansion." : "2 student rows × 1 D1 match = 2 result rows. The lookup keys are unique, so validate=\"many_to_one\" would accept this relationship.", duplicate.checked ? "warning" : "normal");
    }
    render();
  }

  function reshape(shell) {
    const wide = [["Amira", 82, 78], ["Bilal", 91, 88]];
    const subjects = ["Math", "Science"];
    const long = subjects.flatMap((subject, j) => wide.map(row => [row[0], subject, row[j + 1]]));
    const direction = choose(shell, "direction", "Reshape direction", [["melt", "melt · wide to long"], ["pivot", "pivot · long to wide"]], "melt", render);
    const value = choose(shell, "value", "Track one measurement", long.map(row => [`${row[0]}:${row[1]}`, `${row[0]} · ${row[1]} · ${row[2]}`]), "Amira:Math", render);
    legend(shell, [["visual-hit", "The same measurement in both shapes"]]);
    function render() {
      const [name, subject] = value.value.split(":"), person = wide.findIndex(r => r[0] === name), j = subjects.indexOf(subject), selected = wide[person][j + 1];
      const melting = direction.value === "melt";
      const wideTable = table(melting ? "Two subject columns, two student rows" : "Pivot uses Name as the index", [melting ? "Name" : "Name (index)", ...subjects], wide, { cellClass: (r, c) => r === person && c === j + 1 ? "visual-hit" : "" });
      const longTable = table("One row for each student–subject measurement", ["Name", "Subject", "Score"], long, { rowClass: r => long[r][0] === name && long[r][1] === subject ? "visual-hit" : "" });
      const widePane = pane("Wide · 2 rows, 4 scores", wideTable), longPane = pane("Long · 4 rows, 4 scores", longTable);
      shell.stage.replaceChildren(...(melting ? [widePane, longPane] : [longPane, widePane]));
      codeLine(shell, melting ? 'wide.melt(id_vars="Name", var_name="Subject", value_name="Score")' : 'long.pivot(index="Name", columns="Subject", values="Score")');
      summary(shell, `${name}'s ${subject} score stays ${selected}. Both shapes contain the same 4 measurements. ${melting ? "Melt turns column names into values in Subject." : "Pivot turns Subject values into column names; Name becomes the index. Each Name–Subject pair must be unique."}`);
    }
    render();
  }

  const renderers = { dictionary, selection, filter, group, merge, reshape };
  function mount(root = document) {
    root.querySelectorAll("[data-visual]").forEach(host => {
      const type = host.dataset.visual;
      if (!renderers[type] || host.dataset.visualMounted) return;
      renderers[type](makeShell(host, type));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mount(), { once: true });
  else mount();
  window.PandasClearlyVisuals = Object.freeze({ mount });
})();
