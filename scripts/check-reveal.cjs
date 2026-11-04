const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
async function main() {
 const input = process.argv[2];
 if (!input) throw new Error('Usage: node check-reveal.cjs <deck.html> [output-dir]');
 const out = path.resolve(process.argv[3] || 'reveal-check');
 await fs.mkdir(out,{recursive:true});
 const browser = await chromium.launch({channel:process.env.BEAR_BROWSER_CHANNEL || 'msedge',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1280,height:720}});
  const errors = [];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
  await page.goto(pathToFileURL(path.resolve(input)).href);
  await page.waitForFunction(()=>window.Reveal?.isReady());
  await page.evaluate(()=>document.fonts.ready);
  const count = await page.evaluate(()=>Reveal.getSlides().length);
  const results=[];
  for(let i=0;i<count;i++) {
   await page.evaluate(i=>{const slide=Reveal.getSlides()[i]; const pos=Reveal.getIndices(slide); Reveal.slide(pos.h,pos.v); slide.querySelectorAll('.fragment').forEach(f=>f.classList.add('visible'));},i);
   await page.waitForTimeout(350);
   const result=await page.evaluate(()=>{
    const s=Reveal.getCurrentSlide();
    return {title:s.querySelector('h1,h2')?.textContent,overflow:s.scrollWidth>s.clientWidth+2 || s.scrollHeight>s.clientHeight+2,brokenImages:[...s.querySelectorAll('img')].filter(i=>!i.complete || !i.naturalWidth).map(i=>i.src)};
   });
   await page.screenshot({path:path.join(out,`slide-${i+1}.png`)});
   results.push({slide:i+1,...result});
  }
  const report={slides:count,errors,results,passed:count>0 && errors.length===0 && results.every(r=>!r.overflow && !r.brokenImages.length),visualReview:'Screenshots still require human/agent inspection; this check does not prove visual quality.'};
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(!report.passed) process.exitCode=1;
 } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

