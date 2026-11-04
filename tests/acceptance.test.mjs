import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pptxgen from 'pptxgenjs';
import {checkPptx,EXPECTED} from '../scripts/acceptance-checks.mjs';
async function deck(options={}){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bear-acceptance-negative-'));const ppt=new pptxgen();for(let i=0;i<6;i++){const s=ppt.addSlide();s.addText(options.missingContent?'沒有使用指定素材':(options.chart?EXPECTED.filter(t=>!['A組','B組','12','18'].includes(t)):EXPECTED).join(' '),{x:.5,y:.5,w:8,h:2});if(options.chart&&i===2)s.addChart(ppt.ChartType.bar,[{name:'人數',labels:['A組','B組'],values:[12,18]}],{x:1,y:2,w:6,h:2});if(options.links)s.addText('下一頁',{x:1,y:4,w:2,h:.5,hyperlink:{slide:i===5?1:i+2}});}const file=path.join(dir,'presentation.pptx');await ppt.writeFile({fileName:file});const image=path.join(dir,'expected.png');await fs.writeFile(image,Buffer.from('expected-original-image'));return {dir,file,image};}
test('acceptance rejects a valid six-slide PPTX missing supplied content before renderer launch',async()=>{const d=await deck({missingContent:true});await assert.rejects(()=>checkPptx(d.file,path.join(d.dir,'render'),d.image),/缺少附件指定內容/)});
test('acceptance rejects editable slides without internal navigation',async()=>{const d=await deck();await assert.rejects(()=>checkPptx(d.file,path.join(d.dir,'render'),d.image),/缺少內部投影片連結/)});
test('acceptance rejects a deck that drops the original reference image',async()=>{const d=await deck({links:true});await assert.rejects(()=>checkPptx(d.file,path.join(d.dir,'render'),d.image),/未包含原始參考圖/)});

test('acceptance reads required labels and numbers from a native chart relationship',async()=>{const d=await deck({links:true,chart:true});await assert.rejects(()=>checkPptx(d.file,path.join(d.dir,'render'),d.image),/未包含原始參考圖/)});
