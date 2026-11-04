import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import {validateAttachments} from '../ui/attachments.mjs';
import {parseAttachment} from '../scripts/attachment-parser.mjs';
import {saveAttachments} from '../scripts/attachments.mjs';
const attachment=(name,buffer,use='content')=>({name,size:buffer.length,data:buffer.toString('base64'),use});
test('attachment validation rejects traversal, unsupported files, spoofed sizes and excess count',()=>{
 const a=attachment('教材.txt',Buffer.from('教材'));assert.equal(validateAttachments([a])[0].path,'attachments/01.txt');
 for(const patch of [{name:'../a.txt'},{name:'a.exe'},{size:999},{data:'?'.repeat(a.data.length)},{use:'execute'},{size:11*1024*1024}])assert.throws(()=>validateAttachments([{...a,...patch}]));assert.throws(()=>validateAttachments(Array(11).fill(a)));
});
test('DOCX, PPTX and XLSX retain paragraph or cell content without shape coordinates',async()=>{
 const doc=new JSZip();doc.file('word/document.xml','<w:document><w:body><w:p><w:r><w:t>教師教材</w:t></w:r></w:p></w:body></w:document>');
 const d=await parseAttachment(await doc.generateAsync({type:'nodebuffer'}),'docx');assert.equal(d.text,'教師教材');
 const ppt=new JSZip();ppt.file('ppt/presentation.xml','<p:presentation/>');ppt.file('ppt/slides/slide1.xml','<p:sld><a:off x="999"/><a:p><a:r><a:t>投影片</a:t></a:r></a:p></p:sld>');
 const p=await parseAttachment(await ppt.generateAsync({type:'nodebuffer'}),'pptx');assert(p.text.includes('投影片'));assert(!p.text.includes('999'));
 const x=new JSZip();x.file('xl/workbook.xml','<workbook/>');x.file('xl/sharedStrings.xml','<sst><si><t>人數</t></si></sst>');x.file('xl/worksheets/sheet1.xml','<worksheet><sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1"><f>1+2</f><v>3</v></c></row></sheetData></worksheet>');
 const e=await parseAttachment(await x.generateAsync({type:'nodebuffer'}),'xlsx');assert(e.text.includes('A1=人數'));assert(e.text.includes('B1=3'));assert(e.text.includes('1+2'));
});
test('PDF errors are explicit; image signature and XML entity checks reject invalid content',async()=>{
 await assert.rejects(()=>parseAttachment(Buffer.from('bad'),'pdf'));await assert.rejects(()=>parseAttachment(Buffer.from('bad'),'png'));
 const z=new JSZip();z.file('word/document.xml','<!DOCTYPE doc [<!ENTITY bomb "test">]><w:document/>');
 const data=await z.generateAsync({type:'nodebuffer'});await assert.rejects(()=>parseAttachment(data,'docx'));
});
test('local saving preserves original bytes and reports a broken attachment without dropping good files',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bear-materials-'));const bytes=Buffer.from('教學內容');
 const report=await saveAttachments(dir,validateAttachments([attachment('教材.txt',bytes),attachment('broken.pdf',Buffer.from('%PDF-broken'))]));
 assert.equal(report[0].status,'parsed');assert.equal(report[1].status,'failed');assert.deepEqual(await fs.readFile(path.join(dir,'attachments/01.txt')),bytes);
 const saved=JSON.parse(await fs.readFile(path.join(dir,'attachment-report.json')));assert(!('data' in saved[0]));assert((await fs.readFile(path.join(dir,'attachment-text.md'),'utf8')).includes('教學內容'));
});

test('real PDF text is extracted and textless PDF explicitly needs OCR',async()=>{
 const text=await parseAttachment(await fs.readFile(new URL('./fixtures/attachment-text.pdf',import.meta.url)),'pdf');assert.equal(text.status,'parsed');assert(text.text.includes('Teacher material test'));
 const empty=await parseAttachment(await fs.readFile(new URL('./fixtures/attachment-empty.pdf',import.meta.url)),'pdf');assert.equal(empty.status,'needs-ocr');
});
