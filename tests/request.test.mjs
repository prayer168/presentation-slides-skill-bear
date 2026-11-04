import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateRequest,buildPrompt} from '../ui/request.mjs';
const styles=JSON.parse(await fs.readFile(new URL('../ui/styles.json',import.meta.url)));
const base={format:'pptx',purpose:'研究報告',audience:'大學',subject:'社會與歷史',topic:'城市與交通',goal:'比較資料的適用限制',style:'academic',density:'speaker',interaction:'quiz',notes:'',materials:'',pages:18,minutes:25};
test('all 30 styles provide three accessible SVG previews',async()=>{assert.equal(new Set(styles.map(s=>s.id)).size,30);for(const s of styles){assert.equal(s.previews.length,3);for(const p of s.previews){const svg=await fs.readFile(new URL('../ui/'+p,import.meta.url),'utf8');assert(svg.startsWith('<svg'));assert(svg.includes('aria-label'));}}});
test('round trip retains chosen format, level, purpose and page count',()=>{const r=validateRequest(JSON.parse(JSON.stringify(base)),styles);assert.equal(r.pages,18);assert.equal(r.audience,'大學');const prompt=buildPrompt(r,styles);assert(prompt.includes('presentation.pptx')&&prompt.includes('各 18 頁'));assert(prompt.includes('城市與交通'));assert(prompt.includes('不能預設為自然科'));});
test('reject invalid format, pages, style and overlong input',()=>{for(const patch of [{format:'exe'},{pages:0},{pages:1.2},{pages:121},{style:'unknown'},{goal:''},{notes:'x'.repeat(12001)}])assert.throws(()=>validateRequest({...base,...patch},styles));});
test('all stages and domains preserve explicitly supplied values',()=>{for(const audience of ['國小低年級','國中','高中職','大學','一般大眾'])for(const subject of ['語文','數學','藝術與設計','商業與管理']){const r=validateRequest({...base,audience,subject,format:'html',style:'auto'},styles);assert.equal(r.subject,subject);assert.equal(r.audience,audience);}});
test('dual-format requests name both deliverables and require links and paths',()=>{
 const request=validateRequest({...base,format:'both'},styles);
 assert.equal(request.format,'both');
 const prompt=buildPrompt(request,styles);
 assert(prompt.includes('presentation.html、presentation.pptx'));
 assert(prompt.includes('完整絕對路徑'));
});
