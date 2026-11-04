import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {checkHtml} from './acceptance-checks.mjs';
const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--run')throw Error('用法：npm run acceptance:negative -- --run <驗收資料夾>');
const run=path.resolve(args[1]);const out=path.join(run,'negative-controls',new Date().toISOString().replace(/[:.]/g,'-'));await fs.mkdir(out,{recursive:true});const original=await fs.readFile(path.join(run,'html/presentation.html'),'utf8');const image=path.join(run,'inputs/reference.png');
const cases=[{name:'missing-slide',html:original.replace('data-qa-slide="6"','data-disabled-slide="6"'),expect:'頁數'},{name:'invisible-slides',html:original+'<style>[data-qa-slide]{opacity:0!important}</style>',expect:'Timeout'}];
const report={modelExecuted:false,results:[]};const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
try{for(const c of cases){const dir=path.join(out,c.name);await fs.mkdir(dir);const file=path.join(dir,'presentation.html');await fs.writeFile(file,c.html);try{await checkHtml(browser,file,path.join(dir,'render'),image);report.results.push({name:c.name,status:'failed',error:'損壞產物被錯誤判定通過'});}catch(e){report.results.push({name:c.name,status:e.message.includes(c.expect)?'passed':'failed',caught:e.message});}}}finally{await browser.close();report.status=report.results.every(r=>r.status==='passed')?'passed':'failed';await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));console.log('REPORT '+out);if(report.status!=='passed')process.exitCode=1;}
