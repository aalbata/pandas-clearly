/* Real browser checks for Pandas, Clearly. No external services are required. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'docs');
const full = process.argv.includes('--full');
const modules = fs.readdirSync(path.join(root, 'content/modules')).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(root, 'content/modules', f)))).sort((a,b) => a.id-b.id);
const assessment = JSON.parse(fs.readFileSync(path.join(root, 'content/assessment.json')));
const setup = fs.readFileSync(path.join(root, 'course_setup.py'), 'utf8');
const slug = title => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fileFor = m => `${String(m.id).padStart(2,'0')}-${slug(m.title)}.html`;
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css','.wasm':'application/wasm','.png':'image/png','.svg':'image/svg+xml','.py':'text/plain','.txt':'text/plain'};
let browser, server;
const errors = [];

(async () => {
  server = http.createServer((req,res) => {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (!pathname.startsWith('/pandas-clearly/')) {res.writeHead(404);res.end('Not found');return;}
    let relative = pathname.slice('/pandas-clearly/'.length);
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const file = path.resolve(site, relative);
    if (!file.startsWith(site+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end('Not found');return;}
    res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}/pandas-clearly/`;
  const launch = {headless:true};
  if(process.env.PANDAS_CHROMIUM_PATH) {launch.executablePath=process.env.PANDAS_CHROMIUM_PATH;launch.args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'];}
  browser = await chromium.launch(launch);
  const context = await browser.newContext({viewport:{width:1440,height:950},acceptDownloads:true,colorScheme:'light'});
  const externalRequests=[];
  await context.route('**/*',route => {
    const url=route.request().url();
    if(url.startsWith(base) || url.startsWith('blob:') || url.startsWith('data:')) return route.continue();
    externalRequests.push(url); return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  const screenshots=process.env.PANDAS_SCREENSHOT_DIR;
  if(screenshots) fs.mkdirSync(screenshots,{recursive:true});
  await page.goto(base);
  assert.equal(await page.locator('.module-card').count(),30);
  assert.match(await page.locator('.page-footer').innerText(),/Ras Al Khaimah/);
  if(screenshots) await page.screenshot({path:path.join(screenshots,'home-desktop.png'),fullPage:false});
  await page.locator('#course-search').fill('nested JSON');
  await page.waitForFunction(()=>document.querySelectorAll('#search-results a').length>0);
  assert((await page.locator('#search-results a').first().getAttribute('href')).startsWith(base));
  const dictionary=modules.find(m=>m.id===1);
  await page.goto(base+'lessons/'+fileFor(dictionary));
  const cell=page.locator('#M01C01');
  await cell.locator('[data-action="run-example"]').click();
  await page.waitForFunction(()=>window.PandasClearly?.getVersions() && !window.PandasClearly.isBusy(),null,{timeout:90000});
  assert.match(await cell.locator('.example-output').innerText(),/Amira/);
  const version=await page.evaluate(()=>window.PandasClearly.getVersions());
  assert.equal(version.pandas,'2.2.3');
  await cell.locator('.question-answer').first().fill('Age is the key; 20 is its integer value.');
  await cell.locator('.practice-code').fill(dictionary.cells[0].solution);
  await cell.locator('[data-action="check-practice"]').click();
  await page.waitForFunction(()=>!window.PandasClearly.isBusy());
  assert.match(await cell.locator('.practice-feedback').innerText(),/passed/i);
  await cell.locator('.practice-code').fill('student = {}');
  await cell.locator('[data-action="check-practice"]').click();
  await page.waitForFunction(()=>!window.PandasClearly.isBusy());
  assert(!/checks passed/i.test(await cell.locator('.practice-feedback').innerText()));
  await cell.locator('.practice-code').fill(dictionary.cells[0].solution);
  await cell.locator('[data-confidence]').selectOption('3');
  await cell.locator('[data-check-option="1"]').click();
  await cell.locator('.practice-code').focus();
  await page.keyboard.press('Tab');
  assert.notEqual(await page.evaluate(()=>document.activeElement.id),'M01C01-code');
  let downloadPromise=page.waitForEvent('download');
  await page.locator('[data-action="export-work"]').click();
  let download=await downloadPromise;
  const exportPath=await download.path();
  const exported=JSON.parse(fs.readFileSync(exportPath,'utf8'));
  assert(JSON.stringify(exported).includes('Age is the key'));
  await page.reload();
  assert.match(await cell.locator('.question-answer').first().inputValue(),/Age is the key/);
  await page.getByRole('button',{name:'Quick reference',exact:true}).click();
  assert(!(await cell.locator('.practice-area').isVisible()));
  await page.getByRole('button',{name:'Learn',exact:true}).click();
  assert(await cell.locator('.practice-area').isVisible());
  if(screenshots) await page.screenshot({path:path.join(screenshots,'lesson-desktop.png'),fullPage:false});
  for(const width of [1024,736,390,320]) {
    await page.setViewportSize({width,height:850});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Layout overflow at '+width);
  }
  if(screenshots) await page.screenshot({path:path.join(screenshots,'lesson-mobile.png'),fullPage:false});
  await page.locator('[data-action="toggle-menu"]').click();
  assert.equal(await page.locator('[data-action="toggle-menu"]').getAttribute('aria-expanded'),'true');
  await page.locator('[data-action="toggle-menu"]').click();
  await page.setViewportSize({width:1440,height:950});
  await page.emulateMedia({colorScheme:'dark'});
  if(screenshots) await page.screenshot({path:path.join(screenshots,'lesson-dark.png'),fullPage:false});
  await page.emulateMedia({colorScheme:'light'});

  // A separate worker executes the complete learning contract using fresh namespaces.
  const selected=full?modules:modules.filter(m=>[0,1,6,17,20,24,27,28,29].includes(m.id));
  const jobs=[];
  for(const m of selected)for(const c of m.cells) {
    jobs.push({label:c.id+' example',setup,code:c.code,tests:c.verify});
    jobs.push({label:c.id+' solution',setup,code:c.solution,tests:c.solution_verify});
  }
  for(const task of assessment.tasks)jobs.push({label:task.id,setup:setup+'\n'+assessment.setup_code,code:task.solution,tests:task.verify});
  const results=await page.evaluate(async({base,jobs})=>{
    const worker=new Worker(base+'assets/python-worker.js');
    let sequence=0;
    const pending=new Map();
    worker.onmessage=event=>{
      const m=event.data;if(!pending.has(m.id))return;
      const {resolve,reject,timer}=pending.get(m.id);
      clearTimeout(timer);pending.delete(m.id);
      if(m.type==='error')reject(new Error(m.error));else resolve(m);
    };
    const request=message=>new Promise((resolve,reject)=>{
      const id=++sequence;
      const timer=setTimeout(()=>{worker.terminate();reject(new Error('Worker timed out'));},90000);
      pending.set(id,{resolve,reject,timer});worker.postMessage({...message,id});
    });
    await request({type:'init',config:{runtimeBase:base+'runtime/',manifest:base+'data/manifest.json',setupURL:base+'setup.py',additionalWheels:[base+'runtime/et_xmlfile-2.0.0-py3-none-any.whl',base+'runtime/openpyxl-3.1.5-py2.py3-none-any.whl']}});
    const results=[];
    for(const job of jobs){
      const {result}=await request({type:'run',job});
      results.push({label:job.label,ok:result.ok,passed:result.passed,error:result.error||'',plots:result.plots?.length||0,files:(result.files||[]).map(file=>({name:file.name,bytes:file.size})),stderr:result.stderr});
    }
    worker.terminate();return results;
  },{base,jobs});
  const failures=results.filter(r=>!r.ok||!r.passed);
  const report={mode:full?'full':'smoke',browser:await browser.version(),versions:version,browser_cases:results.length,passed:results.length-failures.length,failed:failures.length,failures,plots_rendered:results.reduce((a,r)=>a+r.plots,0),output_files_created:results.reduce((a,r)=>a+r.files.length,0),saved_answers_and_code:true,export_work:true,search_under_project_subpath:true,learn_and_reference_views:true,keyboard_tab_exit:true,mobile_widths:[1024,736,390,320],external_requests:externalRequests,javascript_errors:errors};
  fs.mkdirSync(path.join(root,'validation'),{recursive:true});
  fs.writeFileSync(path.join(root,'validation/browser.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  assert.equal(failures.length,0,'Python cases failed');
  assert.equal(errors.length,0,'Browser JavaScript errors');
  assert.equal(externalRequests.length,0,'Unexpected external runtime dependency');
  await browser.close();await new Promise(resolve=>server.close(resolve));
})().catch(async error=>{console.error(error);if(browser)await browser.close();if(server)server.close();process.exitCode=1;});
