import {MAX_FILE,MAX_TOTAL,MAX_COUNT,TYPES,USES,attachmentMetadata} from './attachments.mjs';
import {validateRequest,buildPrompt,FORMAT_LABELS} from './request.mjs';
const form=document.querySelector('form'),error=document.querySelector('#error');
const styles=await fetch('styles.json').then(r=>{if(!r.ok)throw Error('無法讀取風格圖庫');return r.json()});
let step=0,bridge=null,pollTimer,attachments=[],readingFiles=false;
const labels=['格式','目的與受眾','風格','製作細節','確認送出'];
const nav=document.querySelector('#steps');
labels.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${i+1} ${name}`;b.onclick=()=>{if(i<=step||validStep()){show(i)}};nav.append(b)});
const group=document.querySelector('#style-group');[...new Set(styles.map(s=>s.group))].forEach(g=>group.add(new Option(g,g)));
function drawStyles(){
 const g=group.value,q=document.querySelector('#style-search').value.trim().toLowerCase(),selected=form.elements.style.value;
 const list=styles.filter(s=>(g==='all'||s.group===g)&&`${s.name}${s.description}`.toLowerCase().includes(q));
 document.querySelector('#style-count').textContent=`顯示 ${list.length} / ${styles.length} 種風格`;
 const grid=document.querySelector('#styles');grid.replaceChildren();
 list.forEach(s=>{const card=document.createElement('article');card.className='style-card';
 const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='style';radio.value=s.id;radio.required=true;radio.checked=selected===s.id;
 const img=document.createElement('img');img.src=s.previews[0];img.alt=s.name+'封面預覽';img.loading='lazy';
 const h=document.createElement('h3');h.textContent=s.name;const p=document.createElement('p');p.textContent=s.description;
 const meta=document.createElement('p');meta.className='meta';meta.textContent=`${s.group} · ${s.density}密度 · HTML / PPTX`;
 label.append(img,radio,h,p,meta);const preview=document.createElement('button');preview.type='button';preview.textContent='查看三頁樣板';preview.onclick=()=>{document.querySelector('#preview-title').textContent=s.name;document.querySelector('#preview-images').replaceChildren(...s.previews.map((src,i)=>{const img=document.createElement('img');img.src=src;img.alt=s.name+['封面','內容','圖解'][i];return img}));document.querySelector('#preview').showModal()};card.append(label,preview);grid.append(card)});
 // Keep a selected style when its card is filtered out.
 if(selected&&selected!=='auto'&&!list.some(s=>s.id===selected)){const hidden=document.createElement('input');hidden.type='radio';hidden.name='style';hidden.value=selected;hidden.checked=true;hidden.hidden=true;grid.append(hidden)}
}
group.onchange=drawStyles;document.querySelector('#style-search').oninput=drawStyles;document.querySelector('#close-preview').onclick=()=>document.querySelector('#preview').close();
function validStep(){for(const el of form.querySelector(`[data-step="${step}"]`).querySelectorAll('input,select,textarea')){if(!el.checkValidity()){el.reportValidity();return false}}return true}
function request(){if(readingFiles)throw Error('附件讀取中，請稍候');return validateRequest({...Object.fromEntries(new FormData(form)),attachments:attachments.map(({preview,...a})=>a)},styles)}
function show(n){step=n;error.textContent='';form.querySelectorAll('[data-step]').forEach((s,i)=>s.hidden=i!==n);[...nav.children].forEach((b,i)=>{b.disabled=i>n+1;if(i===n)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});document.querySelector('#prev').disabled=n===0;document.querySelector('#next').hidden=n===4;if(n===4){try{const r=request();const summary=document.querySelector('#summary');summary.replaceChildren();const values={格式:FORMAT_LABELS[r.format],目的:r.purpose,受眾:r.audience,領域:r.subject,主題:r.topic,目標:r.goal,風格:r.style==='auto'?'AI 建議':styles.find(s=>s.id===r.style).name,頁數:r.pages+' 頁',時間:r.minutes+' 分鐘',密度:r.density==='speaker'?'現場講解':'獨立閱讀',互動:r.interaction,補充說明:r.notes||'無',參考素材:r.materials||'無',附件:r.attachments.map(a=>a.name+'（'+USES[a.use]+'）').join('、')||'無'};for(const [k,v]of Object.entries(values)){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;summary.append(dt,dd)}}catch(e){error.textContent=e.message}}}
document.querySelector('#next').onclick=()=>{if(validStep())show(step+1)};document.querySelector('#prev').onclick=()=>show(step-1);form.onsubmit=e=>e.preventDefault();
function renderAttachments(){
 const list=document.querySelector('#attachment-list');list.replaceChildren();
 for(const a of attachments){const row=document.createElement('div');row.className='attachment-row';
 const label=document.createElement('p');label.textContent=`${a.name} · ${(a.size/1024).toFixed(1)} KB · 已讀取，送出後解析`;
 const use=document.createElement('select');use.setAttribute('aria-label',a.name+' 的用途');for(const [v,t] of Object.entries(USES))use.add(new Option(t,v));use.value=a.use;use.onchange=()=>a.use=use.value;
 const remove=document.createElement('button');remove.type='button';remove.textContent='移出待送清單';remove.onclick=()=>{attachments=attachments.filter(item=>item!==a);renderAttachments();document.querySelector('#attachment-status').textContent=`待送附件 ${attachments.length} 個（原始檔未刪除）`};row.append(label,use,remove);if(a.preview){const img=document.createElement('img');img.src=a.preview;img.alt=a.name+' 預覽';img.style.cssText='max-width:180px;max-height:120px;display:block';row.append(img)}
 list.append(row);}
}
async function addFiles(files){if(readingFiles)return;readingFiles=true;const status=document.querySelector('#attachment-status');status.textContent='正在讀取附件…';try{
 if(attachments.length+files.length>MAX_COUNT)throw Error('附件最多 10 個');let total=attachments.reduce((n,a)=>n+a.size,0);const added=[];
 for(const f of files){const ext=f.name.split('.').pop().toLowerCase();if(!TYPES.includes(ext))throw Error('不支援附件：'+f.name);if(!f.size||f.size>MAX_FILE)throw Error('附件不得為空且每個最多 10 MB');total+=f.size;if(total>MAX_TOTAL)throw Error('附件總量最多 30 MB');
 const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('讀取失敗：'+f.name));reader.readAsDataURL(f)});
 added.push({name:f.name,size:f.size,use:'content',data:url.slice(url.indexOf(',')+1),preview:['png','jpg','jpeg','webp'].includes(ext)?url:null});}
 attachments.push(...added);renderAttachments();status.textContent=`已加入 ${attachments.length} 個附件。原始檔將隨需求交給 agent。`;error.textContent='';
 }catch(e){error.textContent=e.message;status.textContent='本批附件未加入，請重新選擇。'}finally{readingFiles=false;document.querySelector('#material-file').value='';}}
document.querySelector('#material-file').onchange=e=>addFiles([...e.target.files]);
const drop=document.querySelector('#attachment-drop');drop.ondragover=e=>{e.preventDefault();drop.style.outline='2px dashed currentColor'};drop.ondragleave=()=>drop.style.outline='';drop.ondrop=e=>{e.preventDefault();drop.style.outline='';void addFiles([...e.dataTransfer.files])};
async function bundle(r,prompt){if(!globalThis.JSZip)throw Error('附件打包工具未載入');const zip=new JSZip();zip.file('bear-request.json',JSON.stringify({...r,attachments:attachmentMetadata(r.attachments)},null,2));zip.file('bear-prompt.md',prompt);for(const a of r.attachments)zip.file(a.path,a.data,{base64:true});zip.file('README.txt','請先解壓縮整個資料夾，再請 AI agent 讀 bear-prompt.md 與 attachments/。靜態匯出尚未解析附件；不可僅傳送 JSON。');return zip.generateAsync({type:'blob'});}
function download(text,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.textContent='下載 '+name;return a}
async function poll(id){try{const res=await fetch('/api/jobs/'+id,{headers:{'X-Bear-Token':bridge.token}});const job=await res.json();if(!res.ok)throw Error(job.error);document.querySelector('#job-status').textContent=`工作 ${id}：${job.status}
${job.error||job.message||''}\n${(job.attachments||[]).map(a=>a.name+'：'+a.status+(a.error?'（'+a.error+'）':'')+(a.warning?'（'+a.warning+'）':'')).join('\n')}`;if(job.status==='running')pollTimer=setTimeout(()=>poll(id),2000);else{const target=document.querySelector('#job-status');if(job.outputDirectory)target.append(document.createTextNode('\n輸出資料夾：'+job.outputDirectory));for(const file of job.files||[]){const a=document.createElement('a');a.href='/api/jobs/'+id+'/files/'+encodeURIComponent(file)+'?token='+encodeURIComponent(bridge.token);a.textContent='下載 '+file;target.append(document.createElement('br'),a);
const presentation=job.presentations?.find(item=>item.file===file);
if(presentation){
 const localPath=document.createElement('code');
 localPath.textContent=presentation.path;
 target.append(document.createElement('br'),localPath);
}}}}catch(e){document.querySelector('#job-status').textContent=e.message}}
document.querySelector('#submit-brief').onclick=async()=>{const button=document.querySelector('#submit-brief');try{error.textContent='';const r=request(),prompt=buildPrompt(r,styles),result=document.querySelector('#result');clearTimeout(pollTimer);result.replaceChildren();if(document.querySelector('#run-agent').checked){if(!bridge)throw Error('本機連線不可用，請重新啟動 npm start');button.disabled=true;const res=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json','X-Bear-Token':bridge.token},body:JSON.stringify(r)});const job=await res.json();if(!res.ok)throw Error(job.error);const status=document.createElement('p');status.id='job-status';result.append(status);await poll(job.id)}else{const p=document.createElement('p');p.textContent='需求已整理完成。下載 JSON 與製作指令，交給你的 AI agent。';const pre=document.createElement('details');const title=document.createElement('summary');title.textContent='查看完整製作指令';const code=document.createElement('pre');code.style.whiteSpace='pre-wrap';code.textContent=prompt;pre.append(title,code);result.append(p,download(JSON.stringify({...r,attachments:attachmentMetadata(r.attachments)},null,2),'bear-request.json','application/json'),download(prompt,'bear-prompt.md','text/markdown'),pre);if(r.attachments.length){const blob=await bundle(r,prompt);const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bear-materials.zip';a.textContent='下載完整需求與附件 ZIP（請使用此包）';result.prepend(a);p.textContent='附件已打包。請下載完整 ZIP 並解壓縮後交給 AI agent；JSON 單檔不含附件。'}}}catch(e){error.textContent=e.message}finally{button.disabled=false}};
try{const res=await fetch('/api/session');if(res.ok){const data=await res.json();if(data.mode==='local-codex'){bridge=data;document.querySelector('#run-choice').hidden=false}}}catch{}
document.querySelector('#connection').textContent=bridge?'本機連接已就緒（Codex 自動審核）。可選擇直接送給 Codex。':'通用模式：送出後匯出需求檔與製作指令。如需直接製作，請在已安裝的技能目錄執行 npm start。';drawStyles();show(0);
