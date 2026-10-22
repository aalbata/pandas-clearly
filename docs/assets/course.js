/* Progressive enhancement for the static Pandas, Clearly course. */
(() => {
  "use strict";
  const scriptURL = document.currentScript && document.currentScript.src;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const readJSON = id => { try { return JSON.parse(document.getElementById(id)?.textContent || "{}"); } catch (_) { return {}; } };
  const page = readJSON("page-data");
  const config = { ...readJSON("site-config"), ...(page.config || {}) };
  const rootURL = new URL(config.root || "./", document.baseURI);
  const absolute = value => new URL(value, document.baseURI).href;
  const assetURL = scriptURL ? new URL("./", scriptURL) : new URL("assets/", rootURL);
  const KEY = String(config.storageKey || "pandas-clearly-v1");
  const ANSWER_LIMIT = 8000, CODE_LIMIT = 30000, IMPORT_LIMIT = 32 * 1024 * 1024;
  const cells = page.module?.cells || page.cells || [];
  const isAssessment = Number(page.module?.id) < 0;
  const byID = new Map(cells.map(cell => [String(cell.id), cell]));
  const articles = $$(".lesson-cell[data-cell-id]");
  const outputURLs = new Map();
  const snapshots = new Map();
  const activeOutputs = new WeakMap();
  let saveTimer, toastTimer, searchTimer;
  let busy = false, activeArticle = null, savedOK = true;
  let searchIndexPromise = null;

  function dictionary() { return Object.create(null); }
  function freshState() { return { version: 1, answers: dictionary(), drafts: dictionary(), confidence: dictionary(), choices: dictionary(), firstChoices: dictionary(), view: "learn" }; }
  function validID(id) { return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(id) && !["constructor", "prototype", "__proto__"].includes(id); }
  function sanitize(value) {
    const out = freshState();
    if (!value || typeof value !== "object" || Array.isArray(value)) return out;
    for (const kind of ["answers", "drafts", "confidence", "choices", "firstChoices"]) {
      const record = value[kind];
      if (!record || typeof record !== "object" || Array.isArray(record)) continue;
      for (const [id, item] of Object.entries(record).slice(0, 1000)) {
        if (!validID(id)) continue;
        if (kind === "answers" && Array.isArray(item)) out.answers[id] = item.slice(0, 16).map(answer => typeof answer === "string" ? answer.slice(0, ANSWER_LIMIT) : "");
        if (kind === "drafts" && typeof item === "string") out.drafts[id] = item.slice(0, CODE_LIMIT);
        if (kind === "confidence" && Number.isInteger(item) && item >= 0 && item <= 3) out.confidence[id] = item;
        if (["choices", "firstChoices"].includes(kind) && Number.isInteger(item) && item >= 0 && item < 20) out[kind][id] = item;
      }
    }
    if (value.view === "reference") out.view = "reference";
    return out;
  }
  let state = freshState();
  try { const saved = localStorage.getItem(KEY); if (saved) state = sanitize(JSON.parse(saved)); } catch (_) { savedOK = false; }
  document.body.classList.add("js");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  const toastNode = element("div", "toast");
  toastNode.hidden = true;
  toastNode.setAttribute("role", "status");
  toastNode.setAttribute("aria-live", "polite");
  document.body.append(toastNode);
  function toast(text, duration = 4200) {
    toastNode.textContent = text;
    toastNode.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastNode.hidden = true; }, duration);
  }
  function updateProgress() {
    const learningIDs = Array.isArray(config.learningCellIds) ? new Set(config.learningCellIds) : null;
    const ready = Object.entries(state.confidence).filter(([id, value]) => value === 3 && (learningIDs ? learningIDs.has(id) : /^M\d/.test(id))).length;
    const total = Number(config.totalCells) || 0;
    $$('[data-progress]').forEach(node => { node.textContent = `${ready}${total ? ` / ${total}` : ""} cells self-rated: I can do it and explain it.`; });
    $$('[data-save-status]').forEach(node => { node.textContent = savedOK ? "Answers save in this browser. Export a copy to keep your work." : "Browser saving is unavailable or full. Export your work before leaving."; });
  }
  function persist() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(KEY, JSON.stringify(state)); savedOK = true; }
    catch (_) { savedOK = false; }
    updateProgress();
  }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 220); }
  window.addEventListener("pagehide", persist);

  function setView(view, save = true) {
    state.view = view === "reference" ? "reference" : "learn";
    document.body.dataset.view = state.view;
    $$('button[data-view]').forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === state.view)));
    if (save) persist();
  }
  function setMenu(open) {
    const sidebar = $("#course-sidebar");
    const restoreFocus = !open && document.body.classList.contains("menu-open") && sidebar?.contains(document.activeElement);
    document.body.classList.toggle("menu-open", open);
    $$('[data-action="toggle-menu"]').forEach(button => button.setAttribute("aria-expanded", String(open)));
    if (restoreFocus) $('[data-action="toggle-menu"]')?.focus();
  }
  function getCell(article) { return byID.get(String(article?.dataset.cellId || "")); }
  function starterCode(cell, draft) { return draft?.dataset.starter === "blank" ? "" : (cell.starter ?? cell.code ?? ""); }
  function restoreInputs() {
    for (const article of articles) {
      const cell = getCell(article);
      if (!cell) continue;
      $$(".question-answer", article).forEach((textarea, index) => {
        const question = Number(textarea.dataset.questionIndex ?? index);
        textarea.dataset.questionIndex = question;
        textarea.maxLength = ANSWER_LIMIT;
        textarea.value = state.answers[cell.id]?.[question] || "";
      });
      const draft = $("textarea.practice-code", article);
      if (draft) {
        draft.maxLength = CODE_LIMIT;
        draft.spellcheck = false;
        draft.autocapitalize = "off";
        draft.setAttribute("autocorrect", "off");
        draft.value = state.drafts[cell.id] ?? starterCode(cell, draft);
      }
      const confidence = $("[data-confidence]", article);
      if (confidence) confidence.value = String(state.confidence[cell.id] || 0);
      paintConcept(article);
    }
    setView(state.view, false);
    updateProgress();
  }
  function paintConcept(article) {
    const cell = getCell(article);
    if (!cell?.check) return;
    const selected = state.choices[cell.id];
    $$('[data-check-option]', article).forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.checkOption) === selected)));
    const feedback = $(".concept-feedback", article);
    if (!feedback) return;
    feedback.textContent = "";
    delete feedback.dataset.state;
    if (selected === undefined) return;
    const correct = selected === cell.check.correct;
    feedback.dataset.state = correct ? "pass" : "fail";
    feedback.textContent = `${correct ? "Correct." : "Try this one again."} ${cell.check.feedback || "Compare the options with the example."}`;
  }
  function markDraftChanged(article) {
    const cell = getCell(article);
    const snapshot = snapshots.get(`${cell?.id}:practice`);
    const value = $(".practice-code", article)?.value || "";
    if (snapshot?.mode === "practice" && snapshot.code !== value) {
      const output = $(".practice-output", article) || $(".run-output", article);
      if (output && !$(".output-stale", output)) output.prepend(element("p", "small-note output-stale", "Your draft has changed. This output belongs to the previous run."));
      const feedback = $(".practice-feedback", article);
      if (feedback) { feedback.textContent = "Draft changed. Run the check again when you are ready."; delete feedback.dataset.state; }
    }
  }
  document.addEventListener("input", event => {
    const target = event.target;
    const article = target.closest?.(".lesson-cell[data-cell-id]");
    if (!article) return;
    const cell = getCell(article);
    if (!cell) return;
    if (target.matches(".question-answer")) {
      state.answers[cell.id] ||= [];
      state.answers[cell.id][Number(target.dataset.questionIndex || 0)] = target.value.slice(0, ANSWER_LIMIT);
      scheduleSave();
    } else if (target.matches(".practice-code")) {
      state.drafts[cell.id] = target.value.slice(0, CODE_LIMIT);
      markDraftChanged(article);
      scheduleSave();
    }
  });
  document.addEventListener("change", event => {
    const target = event.target;
    if (!target.matches?.("[data-confidence]")) return;
    const cell = getCell(target.closest(".lesson-cell"));
    const value = Number(target.value);
    if (cell && [0, 1, 2, 3].includes(value)) { state.confidence[cell.id] = value; persist(); }
  });
  // Tab and Shift+Tab retain normal browser navigation; no editor keyboard trap.
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const results = $("#search-results");
      if (results) results.hidden = true;
      setMenu(false);
    }
    if (event.target.matches?.(".practice-code") && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      execute(event.target.closest(".lesson-cell"), "run-practice");
    }
  });

  function download(name, contents, type = "application/octet-stream") {
    const blob = contents instanceof Blob ? contents : new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = element("a"); link.href = url; link.download = name;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  function exportWork() {
    persist();
    const payload = { course: KEY, schema: 1, exported_at: new Date().toISOString(), state };
    download("Pandas_Clearly_My_Work.json", JSON.stringify(payload, null, 2), "application/json");
    toast("Your answers and code drafts were exported. Import that file to restore them.");
  }
  const importInput = element("input");
  importInput.type = "file"; importInput.accept = ".json,application/json"; importInput.hidden = true;
  document.body.append(importInput);
  importInput.addEventListener("change", async () => {
    const file = importInput.files[0]; importInput.value = "";
    if (!file) return;
    if (file.size > IMPORT_LIMIT) { toast("That file exceeds the 32 MB saved-work limit."); return; }
    try {
      const data = JSON.parse(await file.text());
      if (data.course !== KEY || data.schema !== 1 || !data.state || typeof data.state !== "object") throw new Error("Different course");
      if (!confirm("Replace this browser's saved answers and drafts with the imported work? Export your current work first if you need both copies.")) return;
      state = sanitize(data.state);
      persist(); restoreInputs();
      for (const article of articles) markDraftChanged(article);
      toast("Saved work imported.");
    } catch (_) { toast("Could not import this file. Choose a Pandas_Clearly_My_Work.json export."); }
  });
  function clearWork() {
    if (!confirm("Clear this course's saved answers, code drafts, and self-ratings in this browser? Export your work first if you want to keep a copy.")) return;
    state = freshState(); persist(); restoreInputs();
    for (const article of articles) {
      $$(".run-output", article).forEach(output => output.replaceChildren());
      $$(".practice-feedback,.example-feedback", article).forEach(feedback => { feedback.textContent = ""; delete feedback.dataset.state; });
    }
    for (const id of outputURLs.keys()) revokeOutputURLs(id);
    snapshots.clear();
    toast("Saved course work cleared in this browser.");
  }
  async function copy(text) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const field = element("textarea"); field.value = text; field.className = "sr-only";
        document.body.append(field); field.select();
        const copied = document.execCommand("copy"); field.remove();
        if (!copied) throw new Error("Clipboard unavailable");
      }
      toast("Code copied.");
    } catch (_) { toast("Select the code and use Ctrl+C, or Cmd+C on a Mac."); }
  }

  function runtimeStatus(text, status = "idle") {
    $$('[data-runtime-status]').forEach(node => { node.textContent = text; node.dataset.state = status; });
  }
  class PythonRuntime {
    constructor() { this.worker = null; this.ready = false; this.booting = null; this.pending = new Map(); this.sequence = 0; this.versions = null; }
    ensure() {
      if (this.ready) return Promise.resolve(this.versions);
      if (this.booting) return this.booting;
      if (location.protocol === "file:") return Promise.reject(new Error("Browser Python needs this course opened through a web address. Use the published course, serve the downloaded site locally, or open the companion notebook."));
      if (!window.Worker || !window.WebAssembly) return Promise.reject(new Error("This browser cannot start the Python worker. Open the companion notebook in a Python environment instead."));
      try {
        const workerURL = config.workerURL ? absolute(config.workerURL) : new URL("python-worker.js", assetURL).href;
        this.worker = new Worker(workerURL);
      } catch (error) { return Promise.reject(error); }
      this.worker.onmessage = event => {
        const data = event.data || {};
        if (data.type === "progress") {
          runtimeStatus(data.text, "busy");
          const line = activeArticle && $(".run-progress", activeArticle);
          if (line) line.textContent = data.text;
          return;
        }
        const request = this.pending.get(data.id);
        if (!request) return;
        clearTimeout(request.timer); this.pending.delete(data.id);
        if (data.type === "error") request.reject(new Error(data.error || "Python could not complete the request."));
        else request.resolve(data);
      };
      this.worker.onerror = event => {
        event.preventDefault();
        this.stop(new Error(event.message || "The Python worker stopped unexpectedly."));
      };
      this.booting = this.request("init", { config: {
        runtimeBase: config.runtimeBase ? absolute(config.runtimeBase) : "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
        manifest: config.manifest ? absolute(config.manifest) : new URL("data/manifest.json", rootURL).href,
        setupURL: config.setupURL ? absolute(config.setupURL) : new URL("setup.py", rootURL).href,
        setup: page.setup || "",
        additionalWheels: (config.additionalWheels || []).map(absolute)
      }}).then(message => {
        this.ready = true; this.versions = message.versions; this.booting = null;
        return this.versions;
      }).catch(error => { this.stop(error); throw error; });
      return this.booting;
    }
    request(type, data) {
      return new Promise((resolve, reject) => {
        if (!this.worker) { reject(new Error("The Python worker is not available.")); return; }
        const id = ++this.sequence;
        const limit = Math.max(10000, Math.min(120000, Number(config.timeoutMs) || 60000));
        const timer = setTimeout(() => this.stop(new Error(`Python stopped after ${Math.round(limit / 1000)} seconds. Try again, use a smaller calculation, or download the notebook.`)), limit);
        this.pending.set(id, { resolve, reject, timer });
        this.worker.postMessage({ id, type, ...data });
      });
    }
    async run(job) { await this.ensure(); return (await this.request("run", { job })).result; }
    stop(error = new Error("Execution stopped. You can run the cell again.")) {
      if (this.worker) this.worker.terminate();
      this.worker = null; this.ready = false; this.booting = null;
      for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(error); }
      this.pending.clear();
    }
  }
  const runtime = new PythonRuntime();
  function setBusy(value) {
    busy = value;
    $$('[data-action="run-example"], [data-action="run-practice"], [data-action="check-practice"]').forEach(button => { button.disabled = value; });
    $$('[data-action="stop-runtime"]').forEach(button => { button.disabled = !value; });
    if (activeArticle) activeArticle.setAttribute("aria-busy", String(value));
  }
  function outputNode(article, action) {
    if (action) activeOutputs.set(article, action === "run-example" ? "example" : "practice");
    const mode = activeOutputs.get(article) || "example";
    let output = $(`.${mode}-output`, article) || $(".run-output", article);
    if (!output) { output = element("div", "run-output"); output.setAttribute("aria-live", "polite"); article.append(output); }
    return output;
  }
  function feedbackNode(article) {
    const mode = activeOutputs.get(article) || "example";
    let node = $(`.${mode}-feedback`, article);
    if (!node) {
      node = element("div", `${mode}-feedback`);
      node.setAttribute("aria-live", "polite");
      outputNode(article).after(node);
    }
    return node;
  }
  function revokeOutputURLs(id) {
    for (const url of outputURLs.get(id) || []) URL.revokeObjectURL(url);
    outputURLs.delete(id);
  }
  function pendingOutput(article, action) {
    const cell = getCell(article);
    revokeOutputURLs(`${cell.id}:${action === "run-example" ? "example" : "practice"}`);
    const output = outputNode(article, action);
    output.replaceChildren();
    const header = element("div", "output-title");
    header.append(element("strong", "", action === "run-example" ? (isAssessment ? "Running the starter code" : "Running the example") : "Running your code"));
    const stop = element("button", "small", "Stop"); stop.type = "button"; stop.dataset.action = "stop-runtime";
    header.append(stop); output.append(header);
    const progress = element("p", "run-progress empty-output", runtime.ready ? "Executing Python in your browser…" : "Starting Python. The first run may take longer while packages load…");
    output.append(progress);
    const feedback = feedbackNode(article); feedback.textContent = ""; delete feedback.dataset.state;
  }
  function fallback(article, error) {
    const output = outputNode(article); output.replaceChildren();
    const block = element("div", "runtime-fallback");
    block.append(element("strong", "", "Python could not finish this run."));
    block.append(element("p", "", error.message || String(error)));
    const notebook = config.notebookURL || $$("a[href]").find(link => link.getAttribute("href").includes(".ipynb"))?.href;
    const note = element("p", "", "The lesson remains available. You can retry, or run the same activity in the downloadable notebook.");
    block.append(note);
    if (notebook) {
      const link = element("a", "button small", "Download the notebook"); link.href = absolute(notebook); link.download = ""; block.append(link);
    }
    output.append(block);
    const feedback = feedbackNode(article); feedback.dataset.state = "error";
    feedback.textContent = "No result was checked. Your saved answers and draft have not been removed.";
  }
  function renderResult(article, result, action) {
    const cell = getCell(article), output = outputNode(article, action), urls = [];
    output.replaceChildren();
    const title = element("div", "output-title");
    title.append(element("strong", "", action === "run-example" ? `${isAssessment ? "Starter" : "Example"} output · executed in Python` : "Your output · executed in Python"));
    if (runtime.versions) title.append(element("span", "", `pandas ${runtime.versions.pandas}`));
    output.append(title);
    if (result.stdout) output.append(element("pre", "stdout-output", result.stdout));
    if (result.stderr) output.append(element("pre", "stderr-output", result.stderr));
    if (result.error) {
      const detail = element("details", "runtime-error");
      const summary = element("summary", "", result.phase === "check" ? (action === "run-example" ? "Why the example check did not pass" : "Why the practice check did not pass") : "Read the Python error");
      detail.append(summary, element("pre", "error-output", result.error));
      detail.open = result.phase !== "check";
      output.append(detail);
    }
    if (!result.stdout && !result.stderr && !result.error && !(result.plots || []).length) output.append(element("p", "empty-output", "The code completed without printing a result. Use print(...) to inspect a value."));
    for (const [index, encoded] of (result.plots || []).entries()) {
      const figure = element("figure", "run-figure");
      const image = element("img"); image.src = `data:image/png;base64,${encoded}`; image.alt = `Plot ${index + 1} produced by ${cell.title || cell.id}. Refer to the accompanying code and text output.`;
      const caption = element("figcaption", "", `Plot ${index + 1} from this run`);
      const link = element("a", "", "Download plot"); link.href = image.src; link.download = `${cell.id}_plot_${index + 1}.png`;
      caption.append(link); figure.append(image, caption); output.append(figure);
    }
    if ((result.files || []).length) {
      const block = element("section", "output-files"); block.append(element("h4", "", "Files created by this run"));
      const list = element("ul");
      for (const file of result.files) {
        const item = element("li"), url = URL.createObjectURL(new Blob([file.bytes], { type: mimeType(file.name) }));
        urls.push(url);
        const link = element("a", "", file.name); link.href = url; link.download = file.name.split("/").pop();
        item.append(link, document.createTextNode(` (${formatBytes(file.size)})`)); list.append(item);
      }
      block.append(list, element("p", "small-note", "Download these files to keep them. A new run starts with fresh course data and a clean output folder."));
      output.append(block);
    }
    for (const note of result.notes || []) output.append(element("p", "small-note", note));
    outputURLs.set(`${cell.id}:${action === "run-example" ? "example" : "practice"}`, urls);
    const feedback = feedbackNode(article);
    if (result.ok && result.checked && result.passed) {
      feedback.dataset.state = "pass";
      feedback.textContent = action === "run-example" ? "The example ran and matched its reference checks. Now explain the result before trying the change." : "Your result passed this task's checks. Explain why it works, then try a different input. This is practice feedback, not a formal grade.";
    } else if (result.ok) {
      feedback.dataset.state = "pass";
      feedback.textContent = action === "run-example" ? (isAssessment ? "The starter code ran. Complete the task in Your turn, then use Check my code to check your result." : "The example ran. Inspect the output and explain it before trying the change.") : "Your code ran. Inspect the output, then use Check my code to compare it with the task requirements.";
    } else if (result.phase === "check") {
      feedback.dataset.state = "fail";
      feedback.textContent = action === "run-example" ? "The example ran, but its reference check did not pass. Read the error details and compare the result with the verified output." : "Your code ran, but its result did not pass the task checks. Check the requested rows, column order, values, and result type. The hint and worked answer are available below.";
    } else {
      feedback.dataset.state = "error";
      feedback.textContent = "Python found an error. Read its last line, fix one issue, and run again. Your draft is still saved.";
    }
  }
  function mimeType(name) {
    const ext = name.toLowerCase().split(".").pop();
    return ({ csv: "text/csv", txt: "text/plain", json: "application/json", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", png: "image/png", svg: "image/svg+xml", pdf: "application/pdf", html: "text/html" })[ext] || "application/octet-stream";
  }
  function formatBytes(bytes) { return bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`; }
  async function execute(article, action) {
    const cell = getCell(article);
    if (!cell) { toast("This cell has no executable lesson metadata."); return; }
    if (busy) { toast("One cell is running. Wait for it to finish, or select Stop."); return; }
    const isExample = action === "run-example";
    const draft = $(".practice-code", article);
    const code = isExample ? cell.code : draft?.value || "";
    if (!code.trim()) { toast("Write some Python before running this cell."); draft?.focus(); return; }
    if (!isExample) { state.drafts[cell.id] = code.slice(0, CODE_LIMIT); persist(); }
    const candidateTests = isExample ? cell.verify || "" : action === "check-practice" ? cell.solution_verify || "" : "";
    const tests = candidateTests.trim() === "pass" ? "" : candidateTests;
    activeArticle = article; pendingOutput(article, action); setBusy(true);
    runtimeStatus(runtime.ready ? "Python is running this cell…" : "Starting Python in your browser…", "busy");
    try {
      const result = await runtime.run({ code, tests, setup: page.setup || "", label: `${cell.id} ${isExample ? "example" : "your code"}` });
      snapshots.set(`${cell.id}:${isExample ? "example" : "practice"}`, { code, mode: isExample ? "example" : "practice" });
      renderResult(article, result, action);
      runtimeStatus(`Python ready · pandas ${runtime.versions?.pandas || ""} · every run starts fresh`, "ready");
      if (!isExample && draft && draft.value !== code) markDraftChanged(article);
    } catch (error) {
      fallback(article, error);
      runtimeStatus("Python stopped. Your draft is saved; retry or use the notebook.", "error");
    } finally {
      setBusy(false); activeArticle = null;
    }
  }

  async function loadSearchIndex() {
    if (!searchIndexPromise) searchIndexPromise = fetch(config.searchIndexURL ? absolute(config.searchIndexURL) : new URL("search-index.json", rootURL).href, { credentials: "same-origin" })
      .then(response => { if (!response.ok) throw new Error("Search unavailable"); return response.json(); })
      .then(data => Array.isArray(data) ? data : data.items || data.entries || []);
    return searchIndexPromise;
  }
  async function search(query) {
    const box = $("#search-results"); if (!box) return;
    const trimmed = query.trim();
    if (!trimmed) { box.hidden = true; box.replaceChildren(); return; }
    try {
      const index = await loadSearchIndex();
      if ($("#course-search")?.value.trim() !== trimmed) return;
      const terms = trimmed.toLowerCase().split(/\s+/);
      const hits = index.map(item => {
        const title = String(item.title || "").toLowerCase();
        const text = [item.title, item.text, item.module, item.id, item.keywords].join(" ").toLowerCase();
        const matches = terms.every(term => text.includes(term));
        return { item, score: matches ? terms.reduce((n, term) => n + (title.includes(term) ? 3 : 1), 0) : 0 };
      }).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score).slice(0, 18);
      box.replaceChildren(); box.hidden = false;
      if (!hits.length) box.append(element("p", "search-empty", "No matching lessons. Try a method such as loc, merge, or groupby."));
      for (const { item } of hits) {
        let url;
        try { url = new URL(item.url || item.path || "", rootURL); if (!["http:", "https:", "file:"].includes(url.protocol) || url.origin !== rootURL.origin) continue; } catch (_) { continue; }
        const link = element("a", "search-result"); link.href = url.href;
        link.append(element("strong", "", item.title || "Open lesson"));
        link.append(element("span", "", [item.id, item.module].filter(Boolean).join(" · ")));
        box.append(link);
      }
      const status = $("#search-status"); if (status) status.textContent = `${hits.length}${hits.length === 18 ? "+" : ""} matching lessons.`;
    } catch (_) {
      box.replaceChildren(element("p", "search-empty", "Search is unavailable here. Use the course navigation to find a module.")); box.hidden = false;
    }
  }
  $("#course-search")?.addEventListener("input", event => { clearTimeout(searchTimer); searchTimer = setTimeout(() => search(event.target.value), 180); });
  $("#course-search")?.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") { const first = $("#search-results a"); if (first) { event.preventDefault(); first.focus(); } }
  });
  document.addEventListener("click", event => {
    const searchBox = $("#search-results"), searchField = $("#course-search");
    if (searchBox && !searchBox.contains(event.target) && event.target !== searchField) searchBox.hidden = true;
    const mode = event.target.closest?.('button[data-view]');
    if (mode) { setView(mode.dataset.view); return; }
    const option = event.target.closest?.('[data-check-option]');
    if (option) {
      const article = option.closest(".lesson-cell"), cell = getCell(article), value = Number(option.dataset.checkOption);
      if (cell?.check && Number.isInteger(value) && value >= 0 && value < cell.check.options.length) {
        if (state.firstChoices[cell.id] === undefined) state.firstChoices[cell.id] = value;
        state.choices[cell.id] = value; persist(); paintConcept(article);
      }
      return;
    }
    const button = event.target.closest?.('[data-action]'); if (!button) return;
    const action = button.dataset.action;
    const article = button.closest(".lesson-cell"), cell = getCell(article);
    if (["run-example", "run-practice", "check-practice"].includes(action)) { event.preventDefault(); execute(article, action); }
    else if (action === "stop-runtime") { runtime.stop(new Error("Execution stopped by you. Run again when you are ready.")); }
    else if (action === "toggle-menu") setMenu(!document.body.classList.contains("menu-open"));
    else if (action === "export-work") exportWork();
    else if (action === "import-work") importInput.click();
    else if (action === "clear-work") clearWork();
    else if (action === "copy-example" && cell) copy(cell.code || "");
    else if (action === "copy-practice" && cell) copy($(".practice-code", article)?.value || "");
    else if (action === "reset-practice" && cell) {
      if (!confirm("Restore this activity's starting code? Your written answers will stay.")) return;
      delete state.drafts[cell.id];
      const draft = $(".practice-code", article); if (draft) draft.value = starterCode(cell, draft);
      persist(); markDraftChanged(article); toast("Starting code restored.");
    }
  });
  // Mark enhancement availability only after handlers exist.
  restoreInputs(); setBusy(false);
  runtimeStatus("Python loads on your first run. Each run starts with fresh course data.", "idle");
  window.addEventListener("beforeunload", () => { for (const id of outputURLs.keys()) revokeOutputURLs(id); if (runtime.worker) runtime.worker.terminate(); });
  // A small read-only surface makes automated browser checks straightforward.
  window.PandasClearly = Object.freeze({ runCell: (id, action = "run-example") => execute(articles.find(article => article.dataset.cellId === id), action), getVersions: () => runtime.versions, isBusy: () => busy });
})();
