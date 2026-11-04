import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const require=createRequire(import.meta.url),JSZip=require('jszip');
const {inspectPptx}=require('../scripts/pptx-integrity.cjs');
async function fixture({height=100,missingLink=false}={}){const z=new JSZip();z.file('[Content_Types].xml','<Types/>');z.file('ppt/presentation.xml','<presentation/>');z.file('ppt/slides/slide1.xml',`<p:sp><a:ext cx="100" cy="${height}"/></p:sp>`);if(missingLink)z.file('ppt/slides/_rels/slide1.xml.rels','<Relationships><Relationship Target="slide2.xml"/></Relationships>');const dir=await mkdtemp(path.join(os.tmpdir(),'bear-pptx-test-'));const file=path.join(dir,'fixture.pptx');await writeFile(file,await z.generateAsync({type:'nodebuffer'}));return file;}
test('PPTX integrity rejects negative line extents that break PowerPoint',async()=>{const report=await inspectPptx(await fixture({height:-1097280}));assert.equal(report.valid,false);assert(report.errors.some(e=>e.includes('negative cy')));});
test('PPTX integrity accepts nonnegative extents and checks internal links',async()=>{assert.equal((await inspectPptx(await fixture())).valid,true);const bad=await inspectPptx(await fixture({missingLink:true}));assert.equal(bad.valid,false);assert(bad.errors.some(e=>e.includes('missing target')));});
