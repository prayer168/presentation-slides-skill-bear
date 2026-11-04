import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import crypto from 'node:crypto';
import JSZip from 'jszip';
import checker from './pptx-integrity.cjs';
export const EXPECTED=['先定目的，再選證據','示例資料','A組','B組','12','18','30','Teacher material test'];
export const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function requireCheck(ok,message){if(!ok)throw Error(message)}
function verifyText(text){const compact=text.replace(/\s/g,'');for(const word of EXPECTED)requireCheck(compact.includes(word.replace(/\s/g,'')),'缺少附件指定內容：'+word)}
export async function waitForSlide(page,number){await page.waitForFunction(number=>{
 const e=document.querySelector(`[data-qa-slide="${number}"]`);if(!e)return false;const r=e.getBoundingClientRect();let opacity=1;for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden')return false;opacity*=Number(s.opacity)}return opacity>.99&&r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight;
 },number,{timeout:8000});}
export async function checkHtml(browser,file,out,imageFile){
 await fs.mkdir(out,{recursive:true});const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();const errors=[],requests=[];page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort()});
 try{await page.goto(pathToFileURL(file).href);await page.waitForTimeout(400);const slides=page.locator('[data-qa-slide]');requireCheck(await slides.count()===6,'HTML 頁數不是 6 或缺少驗收標記');verifyText(await slides.allTextContents().then(a=>a.join(' ')));
 const imageHash=sha(await fs.readFile(imageFile));const imageSources=await page.locator('[data-qa-slide="2"] img').evaluateAll(nodes=>nodes.map(n=>n.src));requireCheck(imageSources.some(src=>/^data:image\/png;base64,/.test(src)&&sha(Buffer.from(src.split(',')[1],'base64'))===imageHash),'HTML 第2頁未內嵌原始參考圖');
 const screenshots=[],layoutWarnings=[];
 for(let i=1;i<=6;i++){
  const slide=page.locator(`[data-qa-slide="${i}"]`);await waitForSlide(page,i);requireCheck(await slide.isVisible(),'無法導覽至 HTML 第 '+i+' 頁');await page.screenshot({animations:'disabled',path:path.join(out,`slide-${String(i).padStart(2,'0')}.png`)});screenshots.push(`slide-${String(i).padStart(2,'0')}.png`);
  requireCheck(await page.evaluate(()=>[...document.images].filter(e=>e.getBoundingClientRect().width>0).every(e=>e.complete&&e.naturalWidth>0)),'HTML 有圖片載入失敗');
  const overflow=await slide.evaluate(e=>[...e.querySelectorAll('h1,h2,h3,p,li')].filter(n=>n.getBoundingClientRect().width>0&&((n.clientWidth>0&&n.scrollWidth>n.clientWidth+3)||(n.clientHeight>0&&n.scrollHeight>n.clientHeight+3))).map(n=>n.textContent.slice(0,100)));if(overflow.length)layoutWarnings.push({slide:i,textOverflow:overflow});
  if(i===2)requireCheck(await page.locator('[data-qa-slide="2"] img').first().isVisible(),'第2頁參考圖未顯示');
  if(i===4){const feedback=page.locator('[data-qa-feedback]');requireCheck(!(await feedback.isVisible()),'答案在作答前已顯示');await page.click('[data-qa-answer]');requireCheck(await feedback.isVisible(),'作答後未出現回饋');requireCheck((await feedback.innerText()).includes('先確認教學目的'),'測驗回饋內容不正確');await page.screenshot({animations:'disabled',path:path.join(out,'quiz-feedback.png')});}
  if(i<6)await page.click('[data-qa-next]');
 }
 await page.click('[data-qa-prev]');await waitForSlide(page,5);requireCheck(await page.locator('[data-qa-slide="5"]').isVisible(),'上一頁操作失敗');await page.keyboard.press('ArrowRight');await waitForSlide(page,6);requireCheck(await page.locator('[data-qa-slide="6"]').isVisible(),'鍵盤下一頁操作失敗');await page.keyboard.press('ArrowLeft');await waitForSlide(page,5);requireCheck(await page.locator('[data-qa-slide="5"]').isVisible(),'鍵盤上一頁操作失敗');
 await page.setViewportSize({width:390,height:844});for(let i=5;i>=1;i--){await waitForSlide(page,i);requireCheck(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'手機版有水平溢出');await page.screenshot({animations:'disabled',path:path.join(out,`mobile-${i}.png`)});if(i>1)await page.click('[data-qa-prev]');}
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({media:'print'});requireCheck(await slides.evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden'&&Number(getComputedStyle(n).opacity)>.99)),'列印模式未顯示全部投影片');await page.pdf({path:path.join(out,'print.pdf'),printBackground:true,preferCSSPageSize:true});
 requireCheck(!errors.length,'HTML JavaScript 錯誤：'+errors.join('; '));requireCheck(!requests.length,'離線簡報仍依賴外部網路資源：'+requests.join('; '));
 return {slides:6,screenshots,offline:true,quiz:true,keyboard:true,mobile:true,printAllSlides:true,layoutWarnings,limitations:['截圖與幾何檢查不能證明中文字形及美感合格','指定文字存在不代表所有論述皆正確']};
 }finally{await context.close()}
}
export async function checkPptx(file,out,imageFile){
 await fs.mkdir(out,{recursive:true});const integrity=await checker.inspectPptx(file);await fs.writeFile(path.join(out,'integrity.json'),JSON.stringify(integrity,null,2));requireCheck(integrity.valid,'PPTX 結構不合法：'+integrity.errors.join('; '));requireCheck(integrity.slides===6,'PPTX 頁數不是 6');
 const zip=await JSZip.loadAsync(await fs.readFile(file));let text='',links=0;const nativePerSlide=[],chartParts=new Set();
 for(const [name,entry] of Object.entries(zip.files)){
  if(/^ppt\/slides\/slide\d+\.xml$/.test(name)){const xml=await entry.async('string');text+=' '+[...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(m=>m[1].replaceAll('&amp;','&')).join(' ');nativePerSlide.push({name,objects:(xml.match(/<p:sp\b/g)||[]).length});const rel=zip.file(name.replace('/slides/','/slides/_rels/')+'.rels');if(rel){const relations=await rel.async('string');for(const m of relations.matchAll(/<Relationship\b([^>]*)/g)){const a=Object.fromEntries([...m[1].matchAll(/([\w:]+)="([^"]*)"/g)].map(v=>[v[1],v[2]]));if(a.Type?.endsWith('/chart')&&xml.includes('r:id="'+a.Id+'"'))chartParts.add(path.posix.normalize(a.Target.startsWith('/')?a.Target.slice(1):path.posix.join('ppt/slides',a.Target)));}}links+=(xml.match(/<a:hlinkClick\b[^>]*action="ppaction:\/\/hlinksldjump"/g)||[]).length;}
 }
 for(const name of chartParts){const xml=await zip.file(name).async('string');text+=' '+[...xml.matchAll(/<(?:a:t|c:v)(?:\s[^>]*)?>([\s\S]*?)<\/(?:a:t|c:v)>/g)].map(m=>m[1].replaceAll('&amp;','&')).join(' ');}
 verifyText(text);requireCheck(nativePerSlide.every(s=>s.objects>0),'有投影片缺少原生可編輯物件');requireCheck(links>0,'PPTX 缺少內部投影片連結');const expectedHash=sha(await fs.readFile(imageFile));let imagePreserved=false;for(const e of Object.values(zip.files).filter(e=>/^ppt\/media\//.test(e.name)&&!e.dir)){if(sha(await e.async('nodebuffer'))===expectedHash)imagePreserved=true;}requireCheck(imagePreserved,'PPTX 未包含原始參考圖');
 let render;
 if(process.platform==='win32'){
  const script=fileURLToPath(new URL('./render-pptx.ps1',import.meta.url));const psQuote=s=>"'"+s.replaceAll("'","''")+"'";const command='[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; & {\n'+await fs.readFile(script,'utf8')+'\n} -InputFile '+psQuote(file)+' -OutputDir '+psQuote(out);await new Promise((resolve,reject)=>execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{timeout:120000,maxBuffer:1024*1024,windowsHide:true},(error,stdout,stderr)=>error?reject(Error('PowerPoint 渲染失敗：'+stderr)):resolve()));render=JSON.parse((await fs.readFile(path.join(out,'render-report.json'),'utf8')).replace(/^\uFEFF/,''));requireCheck(render.slides.length===6,'PowerPoint 渲染頁數不符');for(const s of render.slides)requireCheck((await fs.stat(path.join(out,s.file))).size>1000,'PowerPoint 渲染圖片不存在或為空');
 }else{throw Error('此流程需 Windows Microsoft PowerPoint 逐頁渲染；目前平台未配置其他渲染引擎。')}
 return {integrity,nativePerSlide,chartParts:[...chartParts],internalLinks:links,imagePreserved,render,limitations:['PPTX 連結已檢查結構，未實際點擊播放模式的連結','截圖與框線檢查不能證明沒有所有文字重疊、缺字或內容錯誤']};
}

export async function contactSheet(browser,dir){
 const context=await browser.newContext({viewport:{width:1600,height:1000}});const page=await context.newPage();try{const images=[];for(let i=1;i<=6;i++){const name=`slide-${String(i).padStart(2,'0')}.png`;images.push(`<figure><figcaption>第 ${i} 頁</figcaption><img src="data:image/png;base64,${(await fs.readFile(path.join(dir,name))).toString('base64')}"></figure>`);}await page.setContent('<meta charset="utf-8"><style>body{background:#e9e9e3;font:18px system-ui;margin:20px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}figure{margin:0}img{width:100%;display:block;border:1px solid #aaa}figcaption{padding:6px}</style><main class="grid">'+images.join('')+'</main>');await page.screenshot({path:path.join(dir,'contact-sheet.png'),fullPage:true});}finally{await context.close()}
}
