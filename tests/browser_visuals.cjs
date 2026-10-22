/* Six conceptual walkthroughs: 53 control states, semantic markup, narrow layouts.
 * Run: node tests/browser_visuals.cjs
 * Optional: PANDAS_CHROMIUM_PATH=/path/to/chromium
 * Optional screenshots: PANDAS_SCREENSHOT_DIR=/path/to/output
 * This test never starts Python or downloads runtime packages.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'docs');
const reportPath = path.join(root, 'validation/browser-visuals.json');
const visualModules = { dictionary: 2, selection: 5, filter: 6, group: 16, merge: 17, reshape: 19 };
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const report = { checked_at_utc: new Date().toISOString(), mode: 'conceptual-visuals', project_subpath: '/pandas-clearly/', checks: [], layouts: [], external_requests: [], javascript_errors: [], failed_requests: [], runtime_requests: [] };
let browser, server;
async function check(name, action) {
  const started = Date.now();
  try { const details = await action(); report.checks.push({ name, passed: true, duration_ms: Date.now() - started, ...details }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, passed: false, duration_ms: Date.now() - started, error: error.stack || String(error) }); console.error(`FAIL ${name}: ${error.message}`); }
}
async function select(page, type, control, value) { await page.getByTestId(`visual-${type}-${control}`).selectOption(String(value)); }
async function summary(page, type, expected) { assert((await page.getByTestId(`visual-${type}-summary`).innerText()).includes(expected), `${type} summary should contain ${expected}`); }
async function rows(page, type, number) { return page.locator(`[data-visual="${type}"] table`).nth(number).locator('tbody tr').allTextContents(); }
async function exercise(page, type) {
  let count = 0;
  if (type === 'dictionary') {
    const values = { Name: ['Amira', 'Bilal', 'Chen'], Score: [82, 91, 74], Campus: ['RAK', 'Dubai', 'RAK'] };
    for (const key of Object.keys(values)) for (let position = 0; position < 3; position++) {
      await select(page, type, 'key', key); await select(page, type, 'position', position);
      await summary(page, type, `selected value is ${JSON.stringify(values[key][position])}`);
      assert.equal(await page.locator('[data-visual="dictionary"] td.visual-hit').count(), 2);
      count++;
    }
  } else if (type === 'selection') {
    for (const method of ['loc', 'iloc']) for (const argument of [0, 1, 2, 10, 20, 30]) {
      await select(page, type, 'method', method); await select(page, type, 'argument', argument);
      const position = method === 'loc' ? [10, 20, 30].indexOf(argument) : argument < 3 ? argument : -1;
      if (position >= 0) {
        await summary(page, type, ['Amira', 'Bilal', 'Chen'][position]);
        await summary(page, type, `keeps index label ${[10, 20, 30][position]}`);
        assert.equal((await rows(page, type, 1)).length, 1);
      } else await summary(page, type, method === 'loc' ? 'KeyError' : 'IndexError');
      count++;
    }
  } else if (type === 'filter') {
    const fixture = [['Amira', 82, 90], ['Bilal', 91, 72], ['Chen', 74, 96], ['Dana', 68, 66]];
    for (const score of [70, 80, 90]) for (const attendance of [75, 85, 95]) for (const operator of ['and', 'or']) {
      await select(page, type, 'score', score); await select(page, type, 'attendance', attendance); await select(page, type, 'operator', operator);
      const expected = fixture.filter(r => operator === 'and' ? r[1] >= score && r[2] >= attendance : r[1] >= score || r[2] >= attendance).map(r => r[0]);
      await summary(page, type, `keeps ${expected.length} of 4 rows`);
      const displayed = await rows(page, type, 1);
      if (expected.length) { assert.equal(displayed.length, expected.length); expected.forEach((name, i) => assert(displayed[i].includes(name))); }
      else assert(displayed[0].includes('No rows match'));
      count++;
    }
  } else if (type === 'group') {
    for (const mode of ['agg', 'transform']) for (const department of ['IT', 'EE']) {
      await select(page, type, 'mode', mode); await select(page, type, 'highlight', department);
      assert.equal((await rows(page, type, 1)).length, mode === 'agg' ? 2 : 4);
      await summary(page, type, department); await summary(page, type, department === 'IT' ? '85' : '80');
      count++;
    }
  } else if (type === 'merge') {
    for (const duplicate of [false, true]) {
      await page.getByTestId('visual-merge-duplicate').setChecked(duplicate);
      assert.equal((await rows(page, type, 2)).length, duplicate ? 4 : 2);
      await summary(page, type, duplicate ? 'raise MergeError' : 'keys are unique');
      const names = await page.locator('[data-visual="merge"] table').nth(2).locator('tbody th').allTextContents();
      assert.deepEqual(names, duplicate ? ['Amira', 'Amira', 'Bilal', 'Bilal'] : ['Amira', 'Bilal']);
      count++;
    }
  } else if (type === 'reshape') {
    const values = { 'Amira:Math': 82, 'Bilal:Math': 91, 'Amira:Science': 78, 'Bilal:Science': 88 };
    for (const direction of ['melt', 'pivot']) for (const [value, score] of Object.entries(values)) {
      await select(page, type, 'direction', direction); await select(page, type, 'value', value);
      await summary(page, type, `stays ${score}`); await summary(page, type, 'same 4 measurements');
      assert.equal((await rows(page, type, 0)).length, direction === 'melt' ? 2 : 4);
      assert.equal((await rows(page, type, 1)).length, direction === 'melt' ? 4 : 2);
      assert((await page.getByTestId('visual-reshape-code').innerText()).includes(`.${direction}(`));
      count++;
    }
  }
  return count;
}
async function layout(page, type, width, colorScheme) {
  await page.setViewportSize({ width, height: 950 }); await page.emulateMedia({ colorScheme });
  return page.locator(`[data-visual="${type}"]`).evaluate((host, settings) => {
    const rgb = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const luminance = values => values.map(x => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }).reduce((sum, x, i) => sum + x * [0.2126, 0.7152, 0.0722][i], 0);
    const background = node => {
      for (let current = node; current; current = current.parentElement) {
        const color = getComputedStyle(current).backgroundColor;
        if (color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') return rgb(color);
      }
      return [255, 255, 255];
    };
    const ratios = Array.from(host.querySelectorAll('select, caption, th, td, .visual-summary')).filter(node => node.textContent.trim()).map(node => {
      const a = luminance(rgb(getComputedStyle(node).color)), b = luminance(background(node));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    return { type: host.dataset.visual, ...settings, page_overflow: document.documentElement.scrollWidth > innerWidth + 1,
      min_text_contrast: Number(Math.min(...ratios).toFixed(2)),
      controls_labeled: Array.from(host.querySelectorAll('select,input')).every(node => node.labels.length > 0),
      tables_captioned: Array.from(host.querySelectorAll('table')).every(node => !!node.caption),
      column_headers_scoped: Array.from(host.querySelectorAll('thead th')).every(node => node.scope === 'col'),
      max_fixture_rows: Math.max(...Array.from(host.querySelectorAll('table')).map(node => node.tBodies[0].rows.length)),
      effective_color_scheme: getComputedStyle(document.documentElement).colorScheme };
  }, { width, color_scheme_preference: colorScheme });
}
(async () => {
  server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/pandas-clearly/')) { response.writeHead(404); response.end('Not found'); return; }
    const file = path.resolve(site, pathname.slice('/pandas-clearly/'.length));
    if (!file.startsWith(site + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end('Not found'); return; }
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}/pandas-clearly/`;
  const launch = { headless: true };
  if (process.env.PANDAS_CHROMIUM_PATH) { launch.executablePath = process.env.PANDAS_CHROMIUM_PATH; launch.args = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']; }
  browser = await chromium.launch(launch); report.browser = await browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, colorScheme: 'light' });
  await context.route('**/*', route => {
    const url = route.request().url();
    if (/\/(runtime|python-worker)/.test(url)) report.runtime_requests.push(url);
    if (url.startsWith(base) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    report.external_requests.push(url); return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => report.javascript_errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) report.failed_requests.push({ url: response.url(), status: response.status() }); });
  const screenshots = process.env.PANDAS_SCREENSHOT_DIR;
  if (screenshots) fs.mkdirSync(screenshots, { recursive: true });
  for (const [type, moduleID] of Object.entries(visualModules)) {
    await check(type, async () => {
      const file = fs.readdirSync(path.join(site, 'lessons')).find(name => name.startsWith(`${String(moduleID).padStart(2, '0')}-`) && name.endsWith('.html'));
      assert(file, `Missing generated module ${moduleID}`);
      await page.goto(base + 'lessons/' + file);
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
      const host = page.locator(`[data-visual="${type}"]`);
      assert.equal(await host.getAttribute('data-visual-mounted'), 'true');
      assert.equal(await page.locator('[data-visual-mounted="true"]').count(), 1);
      assert((await host.innerText()).includes(type === 'dictionary' ? 'Concept preview' : 'Concept model'));
      assert.equal(await host.locator('button[data-action^="run"]').count(), 0);
      await page.setViewportSize({ width: 1440, height: 950 }); await page.emulateMedia({ colorScheme: 'light' });
      if (screenshots) await host.screenshot({ path: path.join(screenshots, `visual-${type}-desktop.png`) });
      const states = await exercise(page, type);
      for (const colorScheme of ['light', 'dark']) for (const width of [1440, 390, 320]) {
        const result = await layout(page, type, width, colorScheme); report.layouts.push(result);
        assert(!result.page_overflow, `${type} overflows at ${width}px`);
        assert(result.min_text_contrast >= 4.5, `${type} text contrast ${result.min_text_contrast} below 4.5`);
        assert(result.controls_labeled && result.tables_captioned && result.column_headers_scoped, `${type} semantic markup missing`);
        assert(result.max_fixture_rows <= 4, `${type} fixture exceeds four rows`);
        if (screenshots && width === 320 && colorScheme === 'dark') await host.screenshot({ path: path.join(screenshots, `visual-${type}-320-dark-preference.png`) });
      }
      const first = host.locator('select,input').first(); await first.focus(); await page.keyboard.press('Tab');
      assert(!(await first.evaluate(node => node === document.activeElement)), 'Tab should leave the control');
      return { module: moduleID, states_checked: states, layouts_checked: 6, keyboard_tab_exits_control: true };
    });
  }
  await check('no_runtime_network_or_script_errors', async () => {
    assert.deepEqual(report.external_requests, []); assert.deepEqual(report.javascript_errors, []);
    assert.deepEqual(report.failed_requests, []); assert.deepEqual(report.runtime_requests, []);
    return { python_started: false };
  });
})().catch(error => { report.fatal_error = error.stack || String(error); console.error(error); }).finally(async () => {
  if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve));
  report.passed = !report.fatal_error && report.checks.length === 7 && report.checks.every(check => check.passed);
  report.control_states_checked = report.checks.reduce((sum, check) => sum + (check.states_checked || 0), 0);
  report.note = 'Both OS color-scheme preferences were tested. The current course deliberately retains its light palette; this is not a claim of a separate dark theme.';
  fs.mkdirSync(path.dirname(reportPath), { recursive: true }); fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`Saved ${reportPath}`); if (!report.passed) process.exitCode = 1;
});
