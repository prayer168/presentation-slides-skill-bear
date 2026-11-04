// Recheck an existing acceptance run without starting model jobs or overwriting original results.
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {checkHtml,checkPptx,contactSheet} from './acceptance-checks.mjs';
const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--run')throw Error('用法：npm run acceptance:verify -- --run <既有驗收資料夾>');
const run=path.resolve(args[1]),out=path.join(run,'rechecks',new Date().toISOString().replace(/[:.]/g,'-'));await fs.mkdir(out,{recursive:true});
const report={validatorVersion:JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8')).version,checkedAtTaipei:new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}),mode:'verify-existing',modelExecuted:false,status:'running',sourceDirectory:run,results:{}};
let browser;try{browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});for(const format of ['html','pptx']){try{const file=path.join(run,format,'presentation.'+format);report.results[format]={status:'passed',checks:format==='html'?await checkHtml(browser,file,path.join(out,format),path.join(run,'inputs/reference.png')):await checkPptx(file,path.join(out,format),path.join(run,'inputs/reference.png'))};await contactSheet(browser,path.join(out,format));}catch(e){report.results[format]={status:'failed',error:e.message}}}report.status=Object.values(report.results).every(r=>r.status==='passed')?'automated-checks-passed':'failed';}finally{if(browser)await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));console.log('REPORT '+out);if(report.status!=='automated-checks-passed')process.exitCode=1;}
