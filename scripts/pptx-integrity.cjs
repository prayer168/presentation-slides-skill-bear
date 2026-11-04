const fs=require('node:fs/promises');
const path=require('node:path');
const JSZip=require('jszip');
function attrs(text){const out={};for(const m of text.matchAll(/([\w:.-]+)\s*=\s*["']([^"']*)["']/g))out[m[1]]=m[2];return out;}
function decode(s){return s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');}
async function inspectPptx(filename){
 const zip=await JSZip.loadAsync(await fs.readFile(filename));const errors=[];
 for(const required of ['[Content_Types].xml','ppt/presentation.xml'])if(!zip.file(required))errors.push('Missing '+required);
 const slides=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n));
 if(!slides.length)errors.push('No slide XML');let nativeObjects=0;
 for(const name of slides){const xml=await zip.file(name).async('string');nativeObjects+=(xml.match(/<p:sp\b/g)||[]).length;
  for(const m of xml.matchAll(/<(?:[\w.-]+:)?ext\b([^>]*)>/g)){const a=attrs(m[1]);for(const k of ['cx','cy'])if(a[k]!==undefined&&Number(a[k])<0)errors.push(`${name}: negative ${k}=${a[k]}`);}
 }
 for(const name of Object.keys(zip.files).filter(n=>n.endsWith('.rels'))){const xml=await zip.file(name).async('string');const base=name==='_rels/.rels'?'':name.slice(0,name.lastIndexOf('/_rels/'));
  for(const m of xml.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)){const a=attrs(m[1]);if(a.TargetMode==='External'||!a.Target)continue;const target=decode(a.Target);const resolved=path.posix.normalize(target.startsWith('/')?target.slice(1):path.posix.join(base,target));if(!zip.file(resolved))errors.push(`${name}: missing target ${resolved}`);}
 }
 return {valid:errors.length===0,slides:slides.length,nativeObjects,errors,scope:'ZIP parts, slide objects, nonnegative extents and internal relationship targets; visual rendering still required.'};
}
module.exports={inspectPptx};
if(require.main===module)inspectPptx(process.argv[2]).then(async r=>{console.log(JSON.stringify(r,null,2));if(process.argv[3])await fs.writeFile(process.argv[3],JSON.stringify(r,null,2));if(!r.valid)process.exitCode=1}).catch(e=>{console.error(e.message);process.exitCode=1});
