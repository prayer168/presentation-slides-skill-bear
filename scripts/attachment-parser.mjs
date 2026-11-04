import fs from 'node:fs/promises';
import JSZip from 'jszip';
import {XMLParser} from 'fast-xml-parser';
const parser=new XMLParser({ignoreAttributes:false,parseTagValue:false,processEntities:true});
const arr=x=>x===undefined?[]:Array.isArray(x)?x:[x];
function text(x){if(x==null)return '';if(typeof x!=='object')return String(x);return Object.entries(x).filter(([k])=>!k.startsWith('@_')).map(([,v])=>arr(v).map(text).join(' ')).join(' ')}
function collect(x,key){if(!x||typeof x!=='object')return [];return Object.entries(x).flatMap(([k,v])=>k===key?arr(v):arr(v).flatMap(item=>collect(item,key)))}
function paragraphs(x,p,t){return collect(x,p).map(row=>collect(row,t).map(text).join('')).join('\n')}
function xml(s){if(/<!DOCTYPE|<!ENTITY/i.test(s))throw Error('不接受自訂 XML 實體');return parser.parse(s)}
export async function parseAttachment(buffer,ext){
 if(['png','jpg','jpeg','webp'].includes(ext)){
  const ok=ext==='png'?buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):ext==='webp'?buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP':buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
  if(!ok)throw Error('圖片格式與內容不符');return {status:'visual-pending',text:'圖片原檔已保存，需由 agent 查看；尚未執行 OCR 或視覺驗收。'};
 }
 if(['txt','md','csv'].includes(ext))return {status:'parsed',text:buffer.toString('utf8')};
 if(ext==='pdf'){if(buffer.toString('ascii',0,5)!=='%PDF-')throw Error('PDF 標頭不正確');const {PDFParse}=await import('pdf-parse');const reader=new PDFParse({data:new Uint8Array(buffer),isEvalSupported:false});try{const result=await reader.getText({first:100});const content=result.pages.map(p=>p.text).join('\n\n');return {status:content.trim()?'parsed':'needs-ocr',pages:result.total,text:content||'沒有可擷取文字；需要 OCR 或頁面影像分析。',warning:result.total>100?'僅解析前 100 頁':undefined};}finally{await reader.destroy();}}
 const zip=await JSZip.loadAsync(buffer);const entries=Object.values(zip.files);if(entries.length>3000||entries.reduce((n,e)=>n+(e._data?.uncompressedSize||0),0)>60*1024*1024)throw Error('Office 壓縮內容過大');
 const read=async name=>{if(!zip.file(name))throw Error('缺少 Office 必要部分 '+name);return xml(await zip.file(name).async('string'))};
 if(ext==='docx')return {status:'parsed',text:paragraphs(await read('word/document.xml'),'w:p','w:t'),warning:'文字摘要未保留原始版面；表格、圖片與樣式請另查原檔。'};
 if(ext==='pptx'){await read('ppt/presentation.xml');const slides=entries.filter(e=>/^ppt\/slides\/slide\d+\.xml$/.test(e.name)).sort((a,b)=>Number(a.name.match(/(\d+)\.xml/)[1])-Number(b.name.match(/(\d+)\.xml/)[1]));const out=[];for(const [i,e] of slides.entries())out.push(`第 ${i+1} 頁\n`+paragraphs(xml(await e.async('string')),'a:p','a:t'));return {status:'parsed',text:out.join('\n\n'),warning:'僅擷取投影片文字，圖表、圖片與版面請另查原檔。'};}
 if(ext==='xlsx'){await read('xl/workbook.xml');let shared=[];if(zip.file('xl/sharedStrings.xml'))shared=arr((await read('xl/sharedStrings.xml')).sst?.si).map(text);const out=[];
 for(const e of entries.filter(e=>/^xl\/worksheets\/sheet\d+\.xml$/.test(e.name))){out.push(e.name);const sheet=xml(await e.async('string'));for(const row of arr(sheet.worksheet?.sheetData?.row))out.push(arr(row.c).map(c=>{const v=c['@_t']==='s'?shared[Number(c.v)]??'':c['@_t']==='inlineStr'?text(c.is):c.v??'';return `${c['@_r']||''}=${v}${c.f?' [公式='+text(c.f)+'；使用快取值]':''}`}).join(' | '));}
 return {status:'parsed',text:out.join('\n'),warning:'不執行公式或巨集；公式為檔案快取值，未重新計算。圖表與版面請另查原檔。'};}
 throw Error('不支援的檔案');
}
if(process.argv[2]){try{const file=process.argv[2],ext=file.split('.').pop();const result=await parseAttachment(await fs.readFile(file),ext);if(result.text.length>50000){result.text=result.text.slice(0,50000);result.warning=(result.warning||'')+'；摘要截至 50,000 字，請另查完整原檔。';}process.stdout.write(JSON.stringify(result));}catch(e){process.stdout.write(JSON.stringify({status:'failed',text:'',error:e.message}));process.exitCode=0;}}
