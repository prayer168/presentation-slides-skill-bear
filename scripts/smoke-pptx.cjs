const path = require('node:path');
const fs = require('node:fs');
const PptxGenJS = require('pptxgenjs');
async function main() {
 const out = path.resolve(process.argv[2] || 'bear-smoke.pptx');
 fs.mkdirSync(path.dirname(out), {recursive:true});
 const pptx = new PptxGenJS();
 pptx.layout = 'LAYOUT_WIDE'; pptx.author = '黑熊老師'; pptx.title = '黑熊老師簡報工具驗證'; pptx.lang = 'zh-TW';
 pptx.theme = {headFontFace:'Microsoft JhengHei',bodyFontFace:'Microsoft JhengHei',lang:'zh-TW'};
 const s = pptx.addSlide(); s.background = {color:'FAF8F2'};
 s.addText('杯壁上的水珠從哪裡來？',{x:0.7,y:0.6,w:11.9,h:0.8,fontSize:34,bold:true,color:'202A25'});
 s.addShape(pptx.ShapeType.rect,{x:0.7,y:1.8,w:0.12,h:3.5,fill:{color:'245C43'},line:{color:'245C43'}});
 s.addText('先觀察，再提出你的解釋。',{x:1.1,y:2.1,w:10.9,h:1,fontSize:28,color:'245C43'});
 s.addText('黑熊老師的自然教室',{x:0.7,y:6.5,w:11,h:0.4,fontSize:16,color:'202A25'});
 s.addNotes('工具驗證頁，非完整教材。文字與圖形應可個別編輯。');
 await pptx.writeFile({fileName:out}); console.log(out);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
