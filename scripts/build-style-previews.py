from pathlib import Path
import json,html
R=Path(__file__).resolve().parents[1]
def w(n,t):
 p=R/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(t.strip()+"\n",encoding="utf-8")
rows=[
('minimal','極簡留白','清楚專業','#faf9f5','#222c35','#24735b','split','sans','留白與單一視覺焦點'),
('swiss','瑞士網格','清楚專業','#f8f5ed','#17212b','#df3b31','grid','sans','明確網格、大字與紅色節點'),
('corporate','企業報告','清楚專業','#f4f7fb','#182d4a','#3164bd','band','sans','清楚章節與比較圖表'),
('academic','學術研究','清楚專業','#fffffb','#283546','#7f395c','editorial','serif','論點、證據與來源分層'),
('consulting','顧問提案','清楚專業','#f6f8fa','#163140','#009b8d','dashboard','sans','結論式標題與分析圖'),
('monochrome','黑白高對比','清楚專業','#ffffff','#121212','#555555','poster','sans','文字比例形成層級'),
('editorial','雜誌編排','編輯敘事','#f5eee2','#2c2522','#b74b35','editorial','serif','欄線、引言與不對稱版面'),
('poster','大字海報','編輯敘事','#f6e54b','#1a1a1a','#b92e35','poster','sans','以一句核心訊息佔據畫面'),
('photo','影像敘事','編輯敘事','#15252c','#f5f6f2','#e5b660','photo','sans','大圖與簡短註解；預覽為原創示意'),
('timeline','歷史時間軸','編輯敘事','#f5efe2','#45362b','#a55736','timeline','serif','事件節點與脈絡比較'),
('newspaper','報紙專題','編輯敘事','#f3f0e7','#242321','#974938','editorial','serif','多欄結構與資料註解'),
('museum','博物館展覽','編輯敘事','#ede7db','#273a38','#98723f','gallery','serif','作品留白與策展標籤'),
('infographic','圖解教材','教育學習','#f4faf7','#203d45','#168872','diagram','sans','視覺關係、編號與箭頭'),
('whiteboard','白板手繪','教育學習','#fffef9','#293e4a','#bc5838','sketch','sans','手繪線條協助推理'),
('notebook','筆記手帳','教育學習','#fffbed','#34414b','#426eb5','notebook','sans','橫線、註記與重點框'),
('math','數學方格','教育學習','#f4f7fc','#253b60','#ce5d32','grid','sans','方格、座標與結構化推導'),
('language','語文閱讀','教育學習','#f8f2e9','#493637','#92574b','editorial','serif','重點句、語意關係與文本比較'),
('workshop','工作坊便利貼','教育學習','#f2f1e9','#293c39','#b7712b','sticky','sans','任務步驟與可操作提問'),
('storybook','繪本插畫','溫暖趣味','#fff3de','#473c37','#bc6549','organic','serif','角色與場景式敘事'),
('collage','紙張拼貼','溫暖趣味','#eee2d0','#303d36','#bc5436','collage','sans','紙張層次與不規則構圖'),
('pastel','柔和粉彩','溫暖趣味','#fff6f4','#493d52','#925389','organic','sans','柔和色塊、清楚文字對比'),
('retro','復古印刷','溫暖趣味','#f4dfae','#3d352d','#ac4630','band','serif','套色效果與復古比例'),
('nature','自然質感','溫暖趣味','#f7f5e9','#293c31','#477a51','organic','sans','自然曲線與暖白空間'),
('technology','深色科技','科技數據','#101e32','#edf6ff','#4dc6dc','grid','sans','清楚的系統架構與節點'),
('blueprint','工程藍圖','科技數據','#173657','#f1f8ff','#9ad6e6','blueprint','mono','尺寸線與流程結構'),
('dashboard','數據儀表板','科技數據','#f2f5fb','#26344b','#526cc5','dashboard','sans','指標、趨勢與比較圖'),
('terminal','終端機','科技數據','#14251e','#e2efdf','#83c48c','terminal','mono','命令、步驟與程式碼'),
('geometric','幾何構成','藝術表現','#eeeae5','#1f303e','#c95235','geometric','sans','圓、線與留白的比例'),
('brutalist','粗獷排版','藝術表現','#f6f248','#171717','#df4035','brutalist','sans','粗框、硬邊與高對比'),
('pixel','像素復古','藝術表現','#23263e','#faf3d8','#efae5a','pixel','mono','方塊網格與遊戲式節點')]
styles=[]
for i,(id,name,group,bg,ink,accent,layout,font,desc) in enumerate(rows):
 styles.append(dict(id=id,name=name,group=group,background=bg,ink=ink,accent=accent,layout=layout,font=font,description=desc,density='中' if layout in ['dashboard','editorial','grid','terminal'] else '低',motion='輕量',formats=['html','pptx'],previews=[f'previews/{id}-{k}.svg' for k in ['cover','content','diagram']]))
w('ui/styles.json',json.dumps(styles,ensure_ascii=False,indent=2))

def svg(s,kind):
 bg,ink,a=s['background'],s['ink'],s['accent']; l=s['layout']; ff={'sans':'Microsoft JhengHei, Noto Sans TC, sans-serif','serif':'Noto Serif TC, PMingLiU, serif','mono':'Consolas, Microsoft JhengHei, monospace'}[s['font']]
 def text(x,y,t,size=22,fill=ink,weight='normal'):return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}">{html.escape(t)}</text>'
 def rect(x,y,w,h,c,extra=''):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" {extra}/>'
 shapes=''
 if l in ['grid','blueprint','pixel']:
  step=32 if l!='pixel' else 24
  shapes+=''.join(f'<path d="M{x} 0V360" stroke="{a}" opacity=".16"/>' for x in range(0,641,step))
  shapes+=''.join(f'<path d="M0 {y}H640" stroke="{a}" opacity=".16"/>' for y in range(0,361,step))
 if l in ['band','terminal']:shapes+=rect(0,0,640,50,a)+text(30,33,'BEAR / '+s['name'],18,bg)
 if l=='notebook':shapes+=''.join(f'<path d="M20 {y}H620" stroke="{a}" opacity=".2"/>' for y in range(65,330,30))+f'<path d="M65 0V360" stroke="{a}" opacity=".4"/>'
 if l in ['brutalist','sketch']:shapes+=f'<rect x="12" y="12" width="616" height="336" fill="none" stroke="{ink}" stroke-width="{6 if l=="brutalist" else 2}" '+('stroke-dasharray="8 3"' if l=='sketch' else '')+'/>'
 if kind=='cover':
  custom={
   'swiss':rect(0,0,18,360,a)+text(35,92,'01',70,a,'bold')+text(35,180,'看見想法',42,ink,'bold')+text(35,240,'之間的關係',38)+rect(430,40,165,250,ink)+text(451,210,'Aa',65,bg,'bold'),
   'consulting':text(34,95,'讓證據支持你的判斷',32,ink,'bold')+rect(34,112,570,5,a)+text(34,162,'看見想法之間的關係',20)+''.join(rect(45+j*95,290-v,55,v,a) for j,v in enumerate([60,95,120,85]))+text(455,215,'依據',26,a,'bold')+text(455,260,'選擇',26),
   'timeline':text(35,90,'看見想法之間的關係',34,ink,'bold')+f'<path d="M55 220H585" stroke="{a}" stroke-width="4"/>'+''.join(f'<circle cx="{85+j*150}" cy="220" r="12" fill="{a}"/>'+text(65+j*150,180,t,22) for j,t in enumerate(['起點','轉折','發展','今天'])),
   'notebook':text(80,108,'看見想法',39,ink,'bold')+text(80,168,'之間的關係',36)+f'<path d="M80 185Q210 170 345 184" stroke="{a}" stroke-width="6" fill="none"/>'+text(95,246,'記錄 → 連結 → 表達',24,a),
   'math':text(35,95,'看見想法之間的關係',31,ink,'bold')+f'<path d="M360 280V130M345 265H580M370 250Q460 230 550 145" fill="none" stroke="{a}" stroke-width="4"/>'+text(45,190,'從結構出發',29)+text(45,240,'用圖像推理',29),
   'workshop':text(35,95,'看見想法之間的關係',33,ink,'bold')+''.join(f'<g transform="rotate({angle} {x+70} 215)">'+rect(x,145,150,145,c)+text(x+30,222,t,26,ink,'bold')+'</g>' for x,angle,c,t in [(40,-5,'#f5d67c','想一想'),(240,4,'#cbe2bf','畫一畫'),(440,-3,'#efc9b1','說清楚')]),
   'storybook':text(35,100,'看見想法',39,ink,'bold')+text(35,157,'之間的關係',35)+f'<path d="M345 265Q410 230 470 265Q530 230 595 265V140Q530 110 470 145Q410 110 345 140Z" fill="{bg}" stroke="{a}" stroke-width="5"/><path d="M470 145V265" stroke="{a}" stroke-width="4"/><circle cx="390" cy="179" r="20" fill="{a}"/><path d="M365 230Q390 190 415 230" fill="{a}"/>',
   'collage':f'<path d="M325 25L610 46L590 295L350 310L335 275L345 240L329 200Z" fill="{a}" opacity=".35"/>'+f'<g transform="rotate(-7 455 185)">'+rect(360,70,200,210,bg)+text(390,170,'IDEA',36,a,'bold')+text(390,220,'↗',50,a)+'</g>'+text(35,122,'看見想法',40,ink,'bold')+text(35,180,'之間的關係',35),
   'nature':text(35,120,'看見想法',41,ink,'bold')+text(35,185,'之間的關係',36)+f'<path d="M420 280Q330 80 570 65Q580 270 420 280Z" fill="{a}" opacity=".25"/><path d="M410 305L540 95M470 210L415 160M495 175L550 175" stroke="{a}" stroke-width="4" fill="none"/>',
   'blueprint':text(35,98,'看見想法之間的關係',33,ink,'bold')+f'<rect x="65" y="155" width="185" height="110" fill="none" stroke="{a}" stroke-width="3"/><circle cx="452" cy="210" r="60" fill="none" stroke="{a}" stroke-width="3"/><path d="M250 210H392M65 285H250M65 275V295M250 275V295" stroke="{a}" stroke-width="2"/>'+text(98,218,'結構',26)+text(426,218,'連結',26),
   'terminal':text(35,110,'> 看見想法之間的關係',29,ink,'bold')+text(35,168,'01  define the question',22,a)+text(35,213,'02  connect the evidence',22,a)+text(35,258,'03  explain the choice_',22,a),
   'pixel':text(35,110,'看見想法',40,ink,'bold')+text(35,172,'之間的關係',36)+''.join(rect(420+x*24,100+y*24,22,22,a) for x,y in [(1,0),(2,0),(0,1),(3,1),(0,2),(3,2),(1,3),(2,3)])+rect(430,240,120,22,a),
  }
  if s['id'] in custom:shapes+=custom[s['id']]
  elif l in ['poster','brutalist']:
   shapes+=text(36,130,'讓想法',64,ink,'bold')+text(36,215,'被看見',64,ink,'bold')+rect(450,70,135,190,a)
  elif l in ['editorial','gallery']:
   shapes+=f'<path d="M350 60V310M30 290H610" stroke="{ink}"/>'+text(32,119,'看見想法',42,ink,'bold')+text(32,177,'之間的關係',36)+rect(385,70,205,180,a)+text(32,265,'從提問、比較到清楚表達',17)
  elif l=='photo':
   shapes+=f'<path d="M270 285L400 80L500 190L580 110L640 285Z" fill="{a}" opacity=".6"/>'+rect(330,275,310,85,a)+text(30,120,'看見想法',45,ink,'bold')+text(30,180,'之間的關係',40)
  elif l in ['organic','collage','geometric']:
   shapes+=f'<circle cx="500" cy="125" r="95" fill="{a}" opacity=".3"/><path d="M360 300Q480 90 610 280Z" fill="{a}"/>'+text(34,120,'看見想法',42,ink,'bold')+text(34,182,'之間的關係',38)
  else:
   shapes+=rect(380,90,195,155,a, 'opacity=".18"')+f'<circle cx="475" cy="165" r="53" fill="none" stroke="{a}" stroke-width="7"/>'+text(35,133,'看見想法',42,ink,'bold')+text(35,195,'之間的關係',36)
 elif kind=='content':
  shapes+=text(36,94,'比較兩種解決方法',32,ink,'bold')
  if l in ['timeline','notebook','terminal','editorial']:
   for j,t in enumerate(['先描述問題','再比較證據','最後提出選擇']):shapes+=text(45,155+j*58,str(j+1).zfill(2),24,a,'bold')+text(110,155+j*58,t,24)
  elif l in ['dashboard','grid','blueprint']:
   for j,v in enumerate([72,115,95,155]):shapes+=rect(65+j*85,285-v,45,v,a)
   shapes+=text(435,180,'比較條件',22)+text(435,220,'觀察差異',22)
  else:
   for j,t in enumerate(['方法 A','方法 B']):
    x=36+j*290; shapes+=rect(x,130,265,155,a,'opacity=".13"')+text(x+20,170,t,27,a,'bold')+text(x+20,216,'適用條件與限制',20)+text(x+20,253,'以證據支持判斷',20)
 else:
  shapes+=text(36,94,'把推理過程畫出來',32,ink,'bold')
  if l in ['organic','geometric','sketch','gallery']:
   for x,y,t in [(140,210,'觀察'),(325,175,'推論'),(510,210,'驗證')]:shapes+=f'<circle cx="{x}" cy="{y}" r="55" fill="{a}" opacity=".2"/>'+text(x-24,y+8,t,24)
   shapes+=f'<path d="M198 200L265 183M383 183L451 200" stroke="{a}" stroke-width="4"/>'
  else:
   for j,t in enumerate(['觀察','推論','驗證']):
    x=36+j*202;shapes+=rect(x,160,165,105,a,'opacity=".18"')+text(x+55,222,t,25,ink,'bold')
    if j<2:shapes+=text(x+173,223,'→',27,a)
 shapes+=text(36,335,s['name']+' · '+{'cover':'封面','content':'內容','diagram':'圖解'}[kind],13,a)
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="{s["name"]}樣板"><rect width="640" height="360" fill="{bg}"/><g font-family="{ff}">{shapes}</g></svg>'
for s in styles:
 for kind in ['cover','content','diagram']:w('ui/previews/'+s['id']+'-'+kind+'.svg',svg(s,kind))
