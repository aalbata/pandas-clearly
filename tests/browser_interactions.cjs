/* Bounded UI interaction checks; does not rerun or replace browser_verify.cjs.
 * Run: PANDAS_CHROMIUM_PATH=/path/to/chromium node tests/browser_interactions.cjs
 * Set PANDAS_PYTHON_PATH when the native lesson environment needs an explicit path.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const assert = require('assert');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const site = path.join(root, 'docs');
const reportPath = path.join(root, 'validation/browser-interactions.json');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'pandas-clearly-interactions-'));
const modules = fs.readdirSync(path.join(root, 'content/modules'))
  .filter(file => file.endsWith('.json'))
  .map(file => JSON.parse(fs.readFileSync(path.join(root, 'content/modules', file), 'utf8')));
const moduleByID = id => modules.find(module => module.id === id);
const slug = title => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fileFor = module => `${String(module.id).padStart(2, '0')}-${slug(module.title)}.html`;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
  '.json': 'application/json', '.css': 'text/css', '.wasm': 'application/wasm',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.py': 'text/plain', '.txt': 'text/plain' };
const report = {
  checked_at_utc: new Date().toISOString(), mode: 'ui-interactions',
  project_subpath: '/pandas-clearly/', checks: [],
  external_requests: [], javascript_errors: [], confirmation_dialogs: []
};
let browser, server;

async function check(name, action) {
  const started = Date.now();
  try {
    const details = await action();
    report.checks.push({ name, passed: true, duration_ms: Date.now() - started, ...details });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, passed: false, duration_ms: Date.now() - started, error: error.stack || String(error) });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function captureDownload(page, action, label) {
  const pending = page.waitForEvent('download', { timeout: 15000 });
  await action();
  const download = await pending;
  assert.equal(await download.failure(), null, 'Browser download failed');
  const destination = path.join(temporary, `${label}-${path.basename(download.suggestedFilename())}`);
  await download.saveAs(destination);
  const bytes = fs.readFileSync(destination);
  assert(bytes.length > 0, 'Browser downloaded an empty file');
  return { destination, bytes, filename: download.suggestedFilename() };
}

async function runUI(page, article, action, outputClass) {
  await article.locator(`[data-action="${action}"]`).click();
  await page.waitForFunction(() => window.PandasClearly && !window.PandasClearly.isBusy(), null, { timeout: 90000 });
  assert.equal(await article.locator(`.${outputClass}-feedback`).getAttribute('data-state'), 'pass',
    await article.locator(`.${outputClass}-output`).innerText());
  report.versions = await page.evaluate(() => window.PandasClearly.getVersions());
}

(async () => {
  server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/pandas-clearly/')) { response.writeHead(404); response.end('Not found'); return; }
    let relative = pathname.slice('/pandas-clearly/'.length);
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = path.resolve(site, relative);
    if (!file.startsWith(site + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end('Not found'); return;
    }
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}/pandas-clearly/`;
  const launch = { headless: true };
  if (process.env.PANDAS_CHROMIUM_PATH) {
    launch.executablePath = process.env.PANDAS_CHROMIUM_PATH;
    launch.args = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];
  }
  browser = await chromium.launch(launch);
  report.browser = await browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(base) || url.startsWith('blob:') || url.startsWith('data:')) return route.continue();
    report.external_requests.push(url);
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => report.javascript_errors.push(error.message));
  page.on('dialog', async dialog => {
    report.confirmation_dialogs.push({ type: dialog.type(), message: dialog.message() });
    await dialog.accept();
  });

  await check('export_import_work_roundtrip', async () => {
    const module = moduleByID(1), cell = module.cells[0];
    await page.goto(base + 'lessons/' + fileFor(module));
    const article = page.locator('#' + cell.id);
    const answers = ['The Name key contains a text value.', 'I predict a changed age after assignment.', 'A dictionary retrieves values by their keys.'];
    for (let i = 0; i < answers.length; i++) await article.locator('.question-answer').nth(i).fill(answers[i]);
    const draft = cell.solution + '\n# Saved round-trip practice draft.\n';
    await article.locator('.practice-code').fill(draft);
    await article.locator('[data-confidence]').selectOption('3');
    await article.locator(`[data-check-option="${cell.check.correct}"]`).click();
    const exported = await captureDownload(page, () => page.locator('[data-action="export-work"]').click(), 'work-original');
    const payload = JSON.parse(exported.bytes.toString('utf8'));
    assert.equal(payload.schema, 1);
    assert.deepEqual(payload.state.answers[cell.id], answers);
    assert.equal(payload.state.drafts[cell.id], draft);
    assert.equal(payload.state.confidence[cell.id], 3);
    assert.equal(payload.state.choices[cell.id], cell.check.correct);

    // Change the visible work, then restore through the real file chooser.
    await article.locator('.question-answer').first().fill('Temporary replacement answer.');
    await article.locator('.practice-code').fill('print("Temporary draft")');
    await article.locator('[data-confidence]').selectOption('1');
    await article.locator(`[data-check-option="${(cell.check.correct + 1) % cell.check.options.length}"]`).click();
    const chooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-action="import-work"]').click();
    await (await chooserPromise).setFiles(exported.destination);
    await page.waitForFunction(() => document.querySelector('.toast')?.textContent === 'Saved work imported.');
    for (let i = 0; i < answers.length; i++) assert.equal(await article.locator('.question-answer').nth(i).inputValue(), answers[i]);
    assert.equal(await article.locator('.practice-code').inputValue(), draft);
    assert.equal(await article.locator('[data-confidence]').inputValue(), '3');
    assert.equal(await article.locator(`[data-check-option="${cell.check.correct}"]`).getAttribute('aria-pressed'), 'true');
    await page.reload();
    const restored = await captureDownload(page, () => page.locator('[data-action="export-work"]').click(), 'work-restored');
    assert.deepEqual(JSON.parse(restored.bytes.toString('utf8')).state, payload.state);
    return { filename: exported.filename, bytes: exported.bytes.length, answers: answers.length,
      code_confidence_and_choice_restored: true, state_preserved_after_reload: true };
  });

  await check('reset_practice_draft', async () => {
    const module = moduleByID(1), cell = module.cells[0];
    await page.goto(base + 'lessons/' + fileFor(module));
    const article = page.locator('#' + cell.id);
    const answer = 'Keep this explanation when resetting only the code.';
    await article.locator('.question-answer').first().fill(answer);
    await article.locator('.practice-code').fill('print("A draft to replace")');
    await article.locator('[data-confidence]').selectOption('2');
    await article.locator('[data-action="reset-practice"]').click();
    assert.equal(await article.locator('.practice-code').inputValue(), cell.starter ?? cell.code);
    assert.equal(await article.locator('.question-answer').first().inputValue(), answer);
    assert.equal(await article.locator('[data-confidence]').inputValue(), '2');
    await page.reload();
    assert.equal(await article.locator('.practice-code').inputValue(), cell.starter ?? cell.code);
    assert.equal(await article.locator('.question-answer').first().inputValue(), answer);
    return { cell: cell.id, starting_code_restored: true, written_answer_retained: true,
      confidence_retained: true, reset_persisted_after_reload: true };
  });

  await check('excel_export_download', async () => {
    await page.goto(base + 'lessons/' + fileFor(moduleByID(20)));
    const article = page.locator('#M20C03');
    await runUI(page, article, 'run-example', 'example');
    const downloaded = await captureDownload(page,
      () => article.locator('.example-output .output-files a[download="campus_report.xlsx"]').click(), 'excel');
    assert.equal(downloaded.filename, 'campus_report.xlsx');
    assert.equal(downloaded.bytes.subarray(0, 4).toString('hex'), '504b0304', 'Excel download is not a ZIP workbook');
    const python = process.env.PANDAS_PYTHON_PATH || 'python';
    const validation = spawnSync(python, ['-c', `
import csv, json, math, sys, zipfile
from collections import defaultdict
from openpyxl import load_workbook
with zipfile.ZipFile(sys.argv[1]) as archive:
    assert archive.testzip() is None
    assert {'[Content_Types].xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml'} <= set(archive.namelist())
book = load_workbook(sys.argv[1], read_only=True, data_only=True)
assert book.sheetnames == ['Summary']
rows = list(book['Summary'].iter_rows(values_only=True))
assert rows[0] == ('Campus', 'Score')
groups = defaultdict(list)
with open(sys.argv[2], newline='', encoding='utf-8') as fixture:
    for row in csv.DictReader(fixture):
        if row['Score']:
            groups[row['Campus']].append(float(row['Score']))
expected = [(key, sum(values) / len(values)) for key, values in sorted(groups.items())]
assert len(rows) == len(expected) + 1
for actual, wanted in zip(rows[1:], expected):
    assert len(actual) == 2 and actual[0] == wanted[0]
    assert math.isclose(actual[1], wanted[1], rel_tol=1e-12, abs_tol=1e-12)
book.close()
print(json.dumps({'sheet': 'Summary', 'headers': rows[0], 'data_rows': rows[1:]}))
`, downloaded.destination, path.join(root, 'data/students.csv')], { encoding: 'utf8', timeout: 20000 });
    assert.equal(validation.status, 0, validation.stderr || validation.error?.message || 'Could not validate workbook');
    return { filename: downloaded.filename, bytes: downloaded.bytes.length, sha256: sha256(downloaded.bytes),
      workbook: JSON.parse(validation.stdout) };
  });

  await check('plot_image_and_download', async () => {
    await page.goto(base + 'lessons/' + fileFor(moduleByID(24)));
    const article = page.locator('#M24C01');
    await runUI(page, article, 'run-example', 'example');
    const picture = article.locator('.example-output .run-figure img').first();
    await picture.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const image = document.querySelector('#M24C01 .example-output .run-figure img');
      return image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    });
    const rendered = await picture.evaluate(image => ({ src: image.src, width: image.naturalWidth, height: image.naturalHeight, alt: image.alt }));
    assert.match(rendered.src, /^data:image\/png;base64,/);
    assert(rendered.alt.length > 0, 'Rendered plot needs alternative text');
    const downloaded = await captureDownload(page,
      () => article.locator('.example-output .run-figure a[download]').first().click(), 'plot');
    assert.equal(downloaded.filename, 'M24C01_plot_1.png');
    assert.equal(downloaded.bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert(downloaded.bytes.equals(Buffer.from(rendered.src.split(',')[1], 'base64')),
      'Downloaded PNG differs from the plot actually displayed');
    assert.equal(downloaded.bytes.readUInt32BE(16), rendered.width);
    assert.equal(downloaded.bytes.readUInt32BE(20), rendered.height);
    return { filename: downloaded.filename, bytes: downloaded.bytes.length, sha256: sha256(downloaded.bytes),
      width: rendered.width, height: rendered.height, displayed_and_downloaded_bytes_match: true };
  });

  await check('stop_infinite_loop_and_recover', async () => {
    // Warm up a normal run so Stop is tested during execution, not initialization.
    await page.goto(base + 'lessons/' + fileFor(moduleByID(24)));
    const article = page.locator('#M24C01');
    const answer = 'The Python worker can be stopped without removing my written explanation.';
    await article.locator('.question-answer').first().fill(answer);
    await article.locator('.practice-code').fill('print("Ready for an interruption check")');
    await runUI(page, article, 'run-practice', 'practice');
    const oldWorker = page.workers().find(worker => worker.url().endsWith('/assets/python-worker.js'));
    assert(oldWorker, 'A live Python worker should exist after warm-up');
    const infiniteCode = 'while True:\n    pass\n';
    await article.locator('.practice-code').fill(infiniteCode);
    await article.locator('[data-action="run-practice"]').click();
    await page.waitForFunction(() => window.PandasClearly.isBusy());
    // A short, bounded interval gives the initialized worker time to enter the loop.
    await page.waitForTimeout(350);
    assert(await page.evaluate(() => window.PandasClearly.isBusy()));
    assert(await article.locator('[data-action="run-practice"]').isDisabled());
    const stopStarted = Date.now();
    await article.locator('.practice-output [data-action="stop-runtime"]').click();
    await page.waitForFunction(() => !window.PandasClearly.isBusy(), null, { timeout: 5000 });
    assert.match(await article.locator('.practice-output').innerText(), /Execution stopped by you/);
    assert.equal(await article.locator('.practice-code').inputValue(), infiniteCode);
    assert.equal(await article.locator('.question-answer').first().inputValue(), answer);
    assert(await article.locator('[data-action="run-practice"]').isEnabled());
    const stoppedIn = Date.now() - stopStarted;
    await article.locator('.practice-code').fill('result = pd.Series([2, 3, 5]).sum()\nassert result == 10\nprint("Recovered:", result)');
    await runUI(page, article, 'run-practice', 'practice');
    assert.match(await article.locator('.practice-output .stdout-output').innerText(), /Recovered: 10/);
    const newWorker = page.workers().find(worker => worker.url().endsWith('/assets/python-worker.js'));
    assert(newWorker && newWorker !== oldWorker, 'Recovery should create a new Python worker');
    assert(!page.workers().includes(oldWorker), 'The interrupted worker should be terminated');
    assert.equal(await article.locator('.question-answer').first().inputValue(), answer);
    return { stop_completed_in_ms: stoppedIn, interrupted_draft_retained: true,
      written_answer_retained: true, new_worker_started: true, recovery_output: 'Recovered: 10' };
  });

  assert.equal(report.javascript_errors.length, 0, 'Unexpected browser JavaScript errors');
  assert.equal(report.external_requests.length, 0, 'Unexpected external runtime dependency');
})().catch(error => {
  report.fatal_error = error.stack || String(error);
  console.error(error);
}).finally(async () => {
  if (browser) await browser.close();
  if (server?.listening) await new Promise(resolve => server.close(resolve));
  report.interactions = report.checks.length;
  report.passed = report.checks.filter(check => check.passed).length;
  report.failed = report.checks.length - report.passed;
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  fs.rmSync(temporary, { recursive: true, force: true });
  console.log(JSON.stringify({ report: path.relative(root, reportPath), passed: report.passed,
    failed: report.failed, fatal_error: report.fatal_error || null }, null, 2));
  if (report.failed || report.fatal_error) process.exitCode = 1;
});
