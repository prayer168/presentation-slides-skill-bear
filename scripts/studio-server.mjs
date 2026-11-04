import {saveAttachments} from './attachments.mjs';
import {attachmentMetadata} from '../ui/attachments.mjs';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateRequest,buildPrompt} from '../ui/request.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const styles=JSON.parse(await fs.readFile(path.join(root,'ui/styles.json'),'utf8'));
const host='127.0.0.1',port=Number(process.env.BEAR_PORT||4318),origin=`http://${host}:${port}`;
const token=crypto.randomBytes(32).toString('hex'),jobs=new Map();
const outputRoot=path.resolve(process.env.BEAR_OUTPUT_DIR||path.join(root,'output'));
const codex=process.env.CODEX_BIN||'codex';
let active=null;
const mime={'.js':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
function allowed(req,url){return req.headers['x-bear-token']===token||url.searchParams.get('token')===token}
async function body(req){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>43*1024*1024)throw Error('需求資料過大');chunks.push(chunk)}return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
async function snapshot(job){let files=[];try{files=(await fs.readdir(job.dir,{withFileTypes:true})).filter(e=>e.isFile()&&!['events.jsonl','stderr.log'].includes(e.name)).map(e=>e.name)}catch{}return {id:job.id,status:job.status,error:job.error,message:job.message,outputDirectory:job.dir,files,attachments:job.attachments}}
async function startJob(r){
 const id=crypto.randomUUID(),dir=path.join(outputRoot,id);await fs.mkdir(dir,{recursive:true});
 await fs.writeFile(path.join(dir,'bear-request.json'),JSON.stringify({...r,attachments:attachmentMetadata(r.attachments)},null,2));
 const attachmentReport=await saveAttachments(dir,r.attachments);
 const prompt=buildPrompt(r,styles,path.join(root,'SKILL.md'));
 await fs.writeFile(path.join(dir,'bear-prompt.md'),prompt);
 const job={id,dir,attachments:attachmentReport.map(({text,...a})=>a),status:'running',message:'Codex 正在製作；完成後仍須查看驗收結果。'};jobs.set(id,job);active=id;
 const args=['exec','--json','--approve-for-me','--skip-git-repo-check','-C',dir,'-o',path.join(dir,'agent-result.md'),'-'];
 let turnFailed=false,finished=false,events='',stderr='';
 const child=spawn(codex,args,{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});
 job.child=child;
 child.stdout.on('data',chunk=>{events+=chunk.toString();if(events.length>2000000)events=events.slice(-2000000)});
 child.stderr.on('data',chunk=>{stderr+=chunk.toString();if(stderr.length>20000)stderr=stderr.slice(-20000)});
 async function finish(code,error){if(finished)return;finished=true;clearTimeout(timer);
  for(const line of events.split(/\r?\n/)){try{const event=JSON.parse(line);if(event.type==='turn.failed'||event.type==='error')turnFailed=true}catch{}}
  const expected=path.join(dir,'presentation.'+r.format);let exists=false;try{exists=(await fs.stat(expected)).size>0}catch{}
  let integrityError='';
  if(exists&&r.format==='pptx'){try{const {default:checker}=await import('./pptx-integrity.cjs');const report=await checker.inspectPptx(expected);await fs.writeFile(path.join(dir,'pptx-integrity.json'),JSON.stringify(report,null,2));if(!report.valid)integrityError='PPTX 結構檢查失敗：'+report.errors.join('; ');}catch(e){integrityError='PPTX 無法驗證：'+e.message;}}
  job.status=!error&&code===0&&!turnFailed&&exists&&!integrityError?'completed':'failed';
  let detail='';try{detail=(await fs.readFile(path.join(dir,'agent-result.md'),'utf8')).slice(0,1200)}catch{}
  job.error=job.status==='failed'?(error||integrityError||(!exists?'未產生 presentation.'+r.format+'。'+(detail||('Codex 結束代碼 '+code+'；請查看本機工作目錄的 stderr.log。')):'Codex 工作失敗，請查看工作紀錄。')):undefined;
  job.message=job.status==='completed'?'已產生成品，請查看 agent-result.md 的驗收範圍後下載。':undefined;
  await fs.writeFile(path.join(dir,'events.jsonl'),events);await fs.writeFile(path.join(dir,'stderr.log'),stderr);
  if(active===id)active=null;
 }
 const timer=setTimeout(()=>{child.kill();void finish(null,'工作超過 30 分鐘；已停止此程序，現有檔案保留。')},30*60*1000);
 child.on('error',e=>void finish(null,'無法啟動 Codex：'+e.message+'。請確認 codex login 與 CODEX_BIN 設定。'));
 child.on('close',code=>void finish(code));child.stdin.on('error',()=>{});
 child.stdin.end(prompt+'\n最終簡報主檔必須命名為 presentation.'+r.format+'。');
 return job;
}
const server=http.createServer(async(req,res)=>{try{
 if(req.headers.host!==`${host}:${port}`){json(res,403,{error:'Host 不允許'});return}
 const url=new URL(req.url,origin);
 if(req.headers.origin&&req.headers.origin!==origin){json(res,403,{error:'Origin 不允許'});return}
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 if(url.pathname==='/api/session'&&req.method==='GET'){json(res,200,{mode:'local-codex',approvalMode:'auto-review',token});return}
 if(url.pathname.startsWith('/api/')){
  if(!allowed(req,url)){json(res,403,{error:'本機工作憑證不正確'});return}
  if(url.pathname==='/api/jobs'&&req.method==='POST'){
   if(req.headers['content-type']!=='application/json'){json(res,415,{error:'需要 application/json'});return}
   if(active){json(res,409,{error:'已有一個工作正在執行，請等待完成。'});return}
   active='receiving';let r;try{r=validateRequest(await body(req),styles)}catch(e){active=null;json(res,400,{error:e.message});return}
   // Reserve before awaiting filesystem work so simultaneous submissions cannot both start.
   active='starting';try{const job=await startJob(r);json(res,202,{id:job.id,status:job.status})}catch(e){active=null;throw e}return;
  }
  const match=url.pathname.match(/^\/api\/jobs\/([a-f0-9-]+)(?:\/files\/(.+))?$/);
  const job=match&&jobs.get(match[1]);if(!job){json(res,404,{error:'找不到工作；伺服器重新啟動後可從本機輸出資料夾取回檔案。'});return}
  if(req.method!=='GET'){json(res,405,{error:'不支援此操作'});return}
  if(!match[2]){json(res,200,await snapshot(job));return}
  const name=decodeURIComponent(match[2]);if(name!==path.basename(name)||name.includes('..')||name.includes('\\')||['events.jsonl','stderr.log'].includes(name)){json(res,403,{error:'檔案路徑不允許'});return}
  const filename=path.join(job.dir,name);const st=await fs.lstat(filename);if(!st.isFile()||st.isSymbolicLink()){json(res,403,{error:'檔案類型不允許'});return}
  res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(name)}`});res.end(await fs.readFile(filename));return;
 }
 if(req.method!=='GET'){json(res,405,{error:'不支援此操作'});return}
 let relative=decodeURIComponent(url.pathname);if(relative==='/'||relative==='/ui/')relative='/ui/index.html';
 if(!relative.startsWith('/ui/')&&!['/references/style-sources.md'].includes(relative)){json(res,404,{error:'找不到頁面'});return}
 const file=path.resolve(root,'.'+relative);if(!file.startsWith(root+path.sep)||!(file.startsWith(path.join(root,'ui')+path.sep)||relative==='/references/style-sources.md')){json(res,403,{error:'路徑不允許'});return}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await fs.readFile(file));
 }catch(e){if(!res.headersSent)json(res,e.code==='ENOENT'?404:500,{error:e.code==='ENOENT'?'找不到檔案':'操作失敗，請檢查本機目錄權限與設定。'});else res.end()}});
server.listen(port,host,()=>console.log(`黑熊老師簡報工作室：${origin}/ui/\n輸出資料夾：${outputRoot}\n使用 CODEX_BIN 可指定 Codex 可執行檔。`));
