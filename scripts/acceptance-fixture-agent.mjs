// Deterministic subprocess fixture. This is not an AI model and must be reported as fixture mode.
import fs from 'node:fs/promises';
import path from 'node:path';
import pptxgen from 'pptxgenjs';
const cwdIndex=process.argv.indexOf('-C');if(cwdIndex>=0)process.chdir(process.argv[cwdIndex+1]);
let prompt='';for await(const c of process.stdin)prompt+=c;
const r=JSON.parse(await fs.readFile('bear-request.json','utf8'));
const image=r.attachments.find(a=>a.name.endsWith('.png'));
const titles=['先定目的，再選證據','用附件交代需求','把示例資料畫成圖','讓觀眾做一次選擇','先檢查，再交付','素材與格式的限制'];
const body=['教師如何用 AI 製作視覺化簡報','附件原檔會隨工作保存','示例資料：A組 12 人、B組 18 人，合計 30 人','正確答案：先確認教學目的','逐頁檢查內容、圖像與互動','PDF 素材：Teacher material test'];
if(r.format==='html'){
 const img=await fs.readFile(image.path);const slides=titles.map((t,i)=>`<section data-qa-slide="${i+1}" ${i?'hidden':''}><p>BEAR / ACCEPTANCE · ${i+1} / 6</p><h1>${t}</h1><p>${body[i]}</p>${i===1?`<img alt="參考流程圖" src="data:image/png;base64,${img.toString('base64')}">`:''}${i===3?'<button data-qa-answer>查看答案</button><p data-qa-feedback hidden>正確答案：先確認教學目的</p>':''}</section>`).join('');
 await fs.writeFile('presentation.html',`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>教師簡報驗收</title><style>body{margin:0;background:#f5f3eb;color:#193d35;font:26px system-ui}section{box-sizing:border-box;min-height:85vh;padding:6vh 7vw}h1{font-size:clamp(30px,4vw,64px)}img{max-width:80%;max-height:35vh}button{padding:12px;font-size:22px}nav{padding:12px 7vw}section[hidden],[hidden]{display:none}@media print{section[hidden]{display:block}nav,button{display:none}section{break-after:page;min-height:0;height:90vh}}</style>${slides}<nav><button data-qa-prev>上一頁</button><button data-qa-next>下一頁</button></nav><script>let i=0;const s=[...document.querySelectorAll('[data-qa-slide]')];function show(n){i=Math.max(0,Math.min(5,n));s.forEach((e,j)=>e.hidden=j!==i)}document.querySelector('[data-qa-next]').onclick=()=>show(i+1);document.querySelector('[data-qa-prev]').onclick=()=>show(i-1);document.querySelector('[data-qa-answer]').onclick=()=>document.querySelector('[data-qa-feedback]').hidden=false;document.onkeydown=e=>{if(e.key==='ArrowRight')show(i+1);if(e.key==='ArrowLeft')show(i-1)}</script></html>`);
}else{
 const ppt=new pptxgen();ppt.layout='LAYOUT_WIDE';ppt.lang='zh-TW';ppt.author='BEAR acceptance fixture';
 for(let i=0;i<6;i++){const s=ppt.addSlide();s.background={color:'F5F3EB'};s.addText(`BEAR / ACCEPTANCE · ${i+1} / 6`,{x:.7,y:.4,w:11.8,h:.4,fontSize:14,color:'326456'});s.addText(titles[i],{x:.7,y:1.1,w:11.8,h:1.1,fontSize:34,fontFace:'Microsoft JhengHei',color:'193D35'});s.addText(body[i],{x:.7,y:2.5,w:11.8,h:1,fontSize:24,fontFace:'Microsoft JhengHei',color:'193D35'});if(i===1)s.addImage({path:image.path,x:1,y:3.7,w:8,h:2});s.addText(i===5?'返回首頁':'下一頁',{x:10,y:6.7,w:2,h:.4,fontSize:16,hyperlink:{slide:i===5?1:i+2}});s.addNotes('驗收固定範例；示例資料，不是教學成效實測。附件：brief.md、counts.csv、reference.png、reference.pdf。');}
 await ppt.writeFile({fileName:'presentation.pptx'});
}
await fs.writeFile('agent-result.md','固定測試驅動程式產物；沒有呼叫 AI 模型，內容不代表 AI 輸出品質。');
console.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:0,output_tokens:0}}));
