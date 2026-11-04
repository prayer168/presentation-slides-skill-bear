export const MAX_FILE=10*1024*1024,MAX_TOTAL=30*1024*1024,MAX_COUNT=10;
export const TYPES=['txt','md','csv','png','jpg','jpeg','webp','pdf','docx','pptx','xlsx'];
export const USES={content:'內容來源',direct:'直接使用',style:'風格參考',supplement:'補充資料'};
export function validateAttachments(raw=[]){
 if(!Array.isArray(raw)||raw.length>MAX_COUNT)throw Error('附件最多 10 個');
 let total=0;
 return raw.map((a,i)=>{
  if(!a||typeof a.name!=='string'||a.name.length>180||/[\\/\x00-\x1f]/.test(a.name)||a.name==='.'||a.name==='..')throw Error('附件檔名不合法');
  const ext=a.name.split('.').pop().toLowerCase();if(!TYPES.includes(ext))throw Error('不支援附件類型：'+a.name);
  if(!Object.hasOwn(USES,a.use))throw Error('附件用途不正確');
  if(!Number.isInteger(a.size)||a.size<1||a.size>MAX_FILE)throw Error('每個附件須介於 1 byte 與 10 MB');
  total+=a.size;if(total>MAX_TOTAL)throw Error('附件總量最多 30 MB');
  if(typeof a.data!=='string'||a.data.length!==4*Math.ceil(a.size/3)||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(a.data))throw Error('附件內容編碼不正確');
  const size=a.data.length/4*3-(a.data.endsWith('==')?2:a.data.endsWith('=')?1:0);if(size!==a.size)throw Error('附件大小不符');
  return {name:a.name,size:a.size,use:a.use,data:a.data,path:`attachments/${String(i+1).padStart(2,'0')}.${ext}`};
 });
}
export function attachmentMetadata(list=[]){return list.map(({data,...a})=>a)}
