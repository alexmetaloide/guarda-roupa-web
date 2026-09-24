const CUT_FIELDS=['sheet-l','sheet-w','kerf','margin','mat-body','mat-front','mat-back','grain'];
const THICKNESSES=[6,9,15,18,25];
let cutPlan=null,overrides={},currentParts=[],hardware=[];
const el=id=>document.getElementById(id),fmt=n=>Number(n.toFixed(2)).toLocaleString('pt-BR'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readCutSettings(){return {fields:Object.fromEntries(CUT_FIELDS.map(id=>[id,el(id).value])),overrides};}
function applyCutSettings(s){if(s.fields)for(const id of CUT_FIELDS){const v=s.fields[id];if(typeof v==='string'&&v.length<=40)el(id).value=v;}overrides={};if(s.overrides&&typeof s.overrides==='object')for(const [key,v] of Object.entries(s.overrides)){if(THICKNESSES.includes(v.t)&&typeof v.rotate==='boolean')overrides[key]={t:v.t,rotate:v.rotate};}invalidateCut();}
function invalidateCut(){if(!el('download-pdf'))return;cutPlan=null;el('download-pdf').disabled=true;el('download-csv').disabled=true;if(el('cut-result').innerHTML){el('cut-result').replaceChildren();el('cut-stale').textContent='Configuração alterada. Gere novamente o plano de corte.';}}
function pieceList(d){
 const n=k=>Number(d[k])*10,e=n('esp_estrutura'),W=n('largura')/2,H=n('altura'),B=n('altura_base_integrada_guarda'),I=n('altura_interna_inferior'),F=n('esp_fundo'),D=n('profundidade')-F,R=D-n('diferenca_profundidade_laterais'),S=n('esp_prateleira'),T=n('esp_frente'),parts=[],ferragens=[];
 const add=(name,l,w,t,group='body',note='')=>{if(![l,w,t].every(v=>Number.isFinite(v)&&v>0))throw Error('Dimensão inválida na peça '+name+'. Revise o móvel.');parts.push({id:'P'+String(parts.length+1).padStart(3,'0'),name,l:Math.round(l*100)/100,w:Math.round(w*100)/100,t,group,note,rotate:true});};
 for(const side of ['esquerda','direita']){
  const label=side==='esquerda'?'E':'D';
  if(B>0){for(let j=1;j<=2;j++){add(label+' Base / longarina '+j,W-50,B,e);add(label+' Base / travessa '+j,n('profundidade')-50-2*e,B,e);}}
  for(const [level,h] of [['Inferior',I+2*e],['Maleiro',H-B-I-2*e]]){
   const up=level==='Maleiro';add(label+' '+level+' / base',up?W-2*e:W,up?R:D,e);add(label+' '+level+' / lateral externa',h-e,D,e);add(label+' '+level+' / lateral central',h-e,R,e);add(label+' '+level+' / tampo',up?W:W-2*e,up?D:R,e);add(label+' '+level+' / fundo',h,W,F,'back');
  }
  const drawers=Number(d['quantidade_gavetas_'+side]),shoes=Number(d['quantidade_sapateiras_'+side]),has=drawers+shoes>0,C=has?n('altura_gaveteiro_'+side):0;
  const shelves=Number(d['quantidade_prateleiras_'+side]);
  for(let j=0;j<shelves;j++)add(label+' Prateleira '+(j+1),W-2*e,R,S);
  if(d['criar_colmeia_'+side]==='Sim'){
   const cols=Number(d['vaos_colmeia_'+side]),height=(I-C-shelves*S)/(shelves+1);
   for(let a=0;a<=shelves;a++)for(let b=1;b<cols;b++)add(label+' Colmeia / montante '+(a+1)+'.'+b,height,R,S);
  }
  const mode=d['modo_cabideiro_'+side],rods=mode==='Dois varões'?2:mode==='Superior'?1:0;
  if(rods)ferragens.push({name:label+' Varão Ø '+fmt(n('diametro_cabideiro'))+' mm',qty:rods,length:W-2*e});
  if(has){
   const width=n('largura_gaveteiro_'+side)||W-2*e,thick=n('esp_engrosso_gaveteiro_'+side),left=d['engrosso_gaveteiro_'+side+'_lateral_esquerda']==='Sim'?thick:0,right=d['engrosso_gaveteiro_'+side+'_lateral_direita']==='Sim'?thick:0,cap=left||right?n('esp_tamponamento_gaveteiro_'+side):0,bodyH=C-cap,bodyW=width-left-right,depth=R-T;
   add(label+' Gaveteiro / base',bodyW,depth,e);add(label+' Gaveteiro / tampo',bodyW,depth,e);
   for(let j=1;j<=2;j++)add(label+' Gaveteiro / lateral '+j,bodyH-2*e,depth,e);
   if(cap)add(label+' Gaveteiro / tamponamento',width,R,cap);
   [left,right].forEach((t,index)=>{if(t)for(let j=1;j<=2;j++)add(label+' Engrosso '+(index+1)+' / tira '+j,bodyH,60,t);});
   const hidden=d.tipo_corredica_gavetas.startsWith('Oculta'),dw=bodyW-2*e-(hidden?10:27),length=[250,300,350,400,450,600].filter(v=>v<=depth-(hidden?15:20)).pop();
   if(!length)throw Error('O gaveteiro '+side+' não comporta uma corrediça de 250 mm.');
   ferragens.push({name:label+' Corrediça '+(hidden?'oculta':'telescópica')+' (par)',qty:drawers+shoes,length});
   const fronts=(d['alturas_frentes_'+side]||[]).map(v=>Number(v)*10);
   const makeDrawer=(name,h,shoe)=>{
    const boxH=shoe?h-5:h-2*e-10,bottom=shoe?n('esp_fundo_sapateira'):6,contra=boxH-(shoe?5:10)-12-bottom;
    const note='Rasgo lateral: 10 mm de profundidade; início 12 mm acima da base; largura '+fmt(bottom)+' mm.';
    add(label+' '+name+' / frente',h,width-(left||n('recuo_gavetas_esquerda'))-(right||n('recuo_gavetas_direita')),T,'front');
    for(let j=1;j<=2;j++)add(label+' '+name+' / lateral '+j,length,boxH,15,'body',note);
    add(label+' '+name+' / fundo',dw-30+20,length,bottom,'back');
    add(label+' '+name+' / contra frente',dw-30,contra,15);add(label+' '+name+' / contra fundo',dw-30,contra,15);
   };
   for(let j=0;j<shoes;j++)makeDrawer('Sapateira '+(j+1),n('altura_frente_sapateira'),true);
   for(let j=0;j<drawers;j++)makeDrawer('Gaveta '+(j+1),fronts[j],false);
  }
 }
 if(d.criar_portas_correr==='Sim'){
  for(let j=1;j<=2;j++)add('Porta de correr '+j,H-B-2*e-30,(n('largura')-2*e+n('sobreposicao_portas_correr'))/2,T,'front');
  ferragens.push({name:'Trilho superior 58 x 25 mm',qty:1,length:n('largura')-2*e},{name:'Trilho inferior 46,5 x 5,2 mm',qty:1,length:n('largura')-2*e});
 }
 return {parts,hardware:ferragens};
}
function prepareParts(){
 const issue=el('error').textContent;if(issue)throw Error(issue);
 const result=pieceList(window.getConfiguration());hardware=result.hardware;
 currentParts=result.parts.map(p=>({...p,...(overrides[p.name]||{}),material:el('mat-'+p.group).value.trim()||'MDF'}));
 el('parts-editor').innerHTML='<table><thead><tr><th>ID</th><th>Peça</th><th>Compr. × larg. (mm)</th><th>Material</th><th>MDF (mm)</th><th>Girar 90°</th></tr></thead><tbody>'+currentParts.map(p=>'<tr><td>'+p.id+'</td><td>'+esc(p.name)+'</td><td>'+fmt(p.l)+' × '+fmt(p.w)+'</td><td>'+esc(p.material)+'</td><td><select aria-label="Espessura '+esc(p.name)+'" data-part="'+p.id+'">'+(THICKNESSES.includes(p.t)?'':'<option value="'+p.t+'">'+fmt(p.t)+' (módulo)</option>')+THICKNESSES.map(t=>'<option value="'+t+'" '+(t===p.t?'selected':'')+'>'+t+' mm</option>').join('')+'</select></td><td><input type="checkbox" aria-label="Permitir girar '+esc(p.name)+'" data-rotate="'+p.id+'" '+(p.rotate?'checked':'')+'></td></tr>').join('')+'</tbody></table>';
 el('parts-editor').querySelectorAll('[data-part],[data-rotate]').forEach(input=>input.onchange=()=>{const p=currentParts.find(p=>p.id===(input.dataset.part||input.dataset.rotate));if(input.dataset.part)p.t=Number(input.value);else p.rotate=input.checked;overrides[p.name]={t:p.t,rotate:p.rotate};invalidateCut();});
 return currentParts;
}
function packParts(parts,settings){
 const {L,W,kerf,margin,grain}=settings,uw=L-2*margin,uh=W-2*margin;
 if(![L,W,kerf,margin].every(Number.isFinite)||L<100||W<100||L>10000||W>10000||kerf<0||kerf>20||margin<0||uw<=0||uh<=0)throw Error('Revise as dimensões, serra e refilo da chapa.');
 const sheets=[],unplaced=[];
 const orders=[(a,b)=>b.l*b.w-a.l*a.w,(a,b)=>Math.max(b.l,b.w)-Math.max(a.l,a.w)];
 const groups=new Map();for(const p of parts){const key=JSON.stringify([p.material,p.t]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 for(const group of groups.values()){
  let best=null;
  for(const order of orders){
   const boards=[],failed=[];
   for(const p of [...group].sort(order)){
    const orientations=[{w:p.l,h:p.w,rotated:false}];if(grain==='free'&&p.rotate)orientations.push({w:p.w,h:p.l,rotated:true});
    if(!orientations.some(o=>o.w<=uw+1e-7&&o.h<=uh+1e-7)){failed.push(p);continue;}
    let chosen=null;
    const find=()=>{boards.forEach((board,bi)=>board.free.forEach((r,ri)=>orientations.forEach(o=>{if(o.w<=r.w+1e-7&&o.h<=r.h+1e-7){const score=r.w*r.h-o.w*o.h;if(!chosen||score<chosen.score)chosen={bi,ri,o,score};}})));};
    find();if(!chosen){boards.push({material:p.material,t:p.t,free:[{x:margin,y:margin,w:uw,h:uh}],items:[]});find();}
    const board=boards[chosen.bi],r=board.free.splice(chosen.ri,1)[0],o=chosen.o;
    board.items.push({...p,x:r.x,y:r.y,pw:o.w,ph:o.h,rotated:o.rotated});
    // First cut spans the free rectangle horizontally; then crosscut its top strip.
    const right={x:r.x+o.w+kerf,y:r.y,w:r.w-o.w-kerf,h:o.h};
    const bottom={x:r.x,y:r.y+o.h+kerf,w:r.w,h:r.h-o.h-kerf};
    if(right.w>0.01&&right.h>0.01)board.free.push(right);if(bottom.w>0.01&&bottom.h>0.01)board.free.push(bottom);
   }
   if(!best||boards.length<best.boards.length)best={boards,failed};
  }
  sheets.push(...best.boards);unplaced.push(...best.failed);
 }
 return {sheets,unplaced,settings,parts,hardware,created:new Date().toLocaleString('pt-BR')};
}
function getPackSettings(){for(const id of ['sheet-l','sheet-w','kerf','margin'])if(!el(id).checkValidity()||!el(id).value)throw Error('Revise as medidas da chapa.');return {L:Number(el('sheet-l').value),W:Number(el('sheet-w').value),kerf:Number(el('kerf').value),margin:Number(el('margin').value),grain:el('grain').value};}
// Layout uses the displayed axes, so both dimensions follow a rotated piece.
function dimensionLabels(item,w,h,measure,target=8){
 const horizontal=fmt(item.pw),vertical=fmt(item.ph),pad=2;
 const size=Math.max(.05,Math.min(target,(h-2*pad)/Math.max(measure(vertical,1),1),(w-4*pad)/Math.max(measure(horizontal,1)+measure(item.id,1),1),h/3,w/4));
 const tight=h<target*4;
 return {size,horizontal,vertical,verticalX:pad+size*.75,verticalY:h/2,
  horizontalX:tight?w*.43:w/2,horizontalY:tight?h/2:h-pad-size/2,
  idX:tight?w*.79:w/2,idY:tight?h/2:h*.42};
}
function sheetSVG(sheet,settings){
 const {L,W}=settings,scale=Math.min(770/L,430/W);
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -40 '+(L+80)+' '+(W+80)+'" role="img" aria-label="Mapa de corte da chapa com medidas em milímetros"><rect width="'+L+'" height="'+W+'" fill="#f4f6f8" stroke="#17324a" stroke-width="4"/>'+sheet.items.map(p=>{
  const a=dimensionLabels(p,p.pw*scale,p.ph*scale,(s,z)=>s.length*z*.58),f=a.size/scale;
  const tx=(value,x,y,rotate=false,bold=false)=>'<text x="'+x+'" y="'+y+'" '+(rotate?'transform="rotate(-90 '+x+' '+y+')" ':'')+'text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="'+f+'" font-weight="'+(bold?'700':'400')+'" fill="#17324a">'+value+'</text>';
  return '<g><title>'+p.id+' · '+esc(p.name)+' · horizontal '+fmt(p.pw)+' mm · vertical '+fmt(p.ph)+' mm</title><rect x="'+p.x+'" y="'+p.y+'" width="'+p.pw+'" height="'+p.ph+'" fill="#d6e6f0" stroke="#385c74" stroke-width="2"/>'+tx(p.id,p.x+a.idX/scale,p.y+a.idY/scale,false,true)+tx(a.horizontal,p.x+a.horizontalX/scale,p.y+a.horizontalY/scale)+tx(a.vertical,p.x+a.verticalX/scale,p.y+a.verticalY/scale,true)+'</g>';
 }).join('')+'</svg>';
}
function renderPlan(plan){
 const {L,W}=plan.settings,area=plan.parts.reduce((s,p)=>s+p.l*p.w,0),util=plan.sheets.length?area/(plan.sheets.length*L*W)*100:0;
 el('cut-result').innerHTML='<div class="cut-summary"><strong>'+plan.parts.length+' peças · '+plan.sheets.length+' chapas · '+fmt(util)+'% de aproveitamento bruto</strong><br>Serra: '+fmt(plan.settings.kerf)+' mm · Refilo: '+fmt(plan.settings.margin)+' mm por borda</div>'+plan.sheets.map((s,i)=>'<section class="sheet-card"><h3>Chapa '+(i+1)+' · '+esc(s.material)+' · '+fmt(s.t)+' mm</h3>'+sheetSVG(s,plan.settings)+'<p class="hint">'+fmt(L)+' × '+fmt(W)+' mm · '+s.items.length+' peças · Cotas horizontal e vertical em mm · Cinza: sobras, serra e refilo</p><div class="table-wrap"><table><thead><tr><th>ID</th><th>Peça</th><th>C × L (mm)</th><th>X / Y (mm)</th><th>Girada</th></tr></thead><tbody>'+s.items.map(p=>'<tr><td>'+p.id+'</td><td>'+esc(p.name)+'</td><td>'+fmt(p.l)+' × '+fmt(p.w)+'</td><td>'+fmt(p.x)+' / '+fmt(p.y)+'</td><td>'+(p.rotated?'Sim':'Não')+'</td></tr>').join('')+'</tbody></table></div></section>').join('')+'<h3>Ferragens (fora das chapas)</h3><ul>'+hardware.map(h=>'<li>'+h.qty+' × '+esc(h.name)+' · '+fmt(h.length)+' mm</li>').join('')+'</ul>';
 if(plan.unplaced.length)throw Error('Peças que não cabem na chapa: '+plan.unplaced.map(p=>p.id+' '+p.name+' ('+fmt(p.l)+' × '+fmt(p.w)+' mm)').join('; ')+'. Aumente a chapa ou revise o veio. PDF bloqueado até resolver.');
}
async function buildPDF(plan){
 const {PDFDocument,StandardFonts,rgb,degrees}=PDFLib,doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),ink=rgb(.09,.19,.28),blue=rgb(.84,.90,.95);
 const clean=s=>String(s).replace(/[\u2010-\u2015]/g,'-').replace(/[^\x20-\x7E\xA0-\xFF]/g,'?');
 const text=(page,s,x,y,size=10,b=false)=>page.drawText(clean(s),{x,y,size,font:b?bold:font,color:ink});
 const drawPiece=(page,item,x,y,w,h,target=8)=>{
  page.drawRectangle({x,y,width:w,height:h,color:blue,borderWidth:.4,borderColor:ink});
  const a=dimensionLabels(item,w,h,(s,z)=>font.widthOfTextAtSize(clean(s),z),target),size=a.size;
  const centered=(s,cx,cy,b=false)=>{const face=b?bold:font;page.drawText(clean(s),{x:cx-face.widthOfTextAtSize(clean(s),size)/2,y:cy-size*.35,size,font:face,color:ink});};
  centered(item.id,x+a.idX,y+h-a.idY,true);centered(a.horizontal,x+a.horizontalX,y+h-a.horizontalY);
  page.drawText(a.vertical,{x:x+a.verticalX+size*.35,y:y+h-a.verticalY-font.widthOfTextAtSize(a.vertical,size)/2,size,font,color:ink,rotate:degrees(90)});
  return size;
 };
 const page=title=>{const p=doc.addPage([841.89,595.28]);text(p,'METALLOIDE | PLANO DE CORTE',30,560,17,true);text(p,title,30,537,11);return p;};
 const wrap=(s,max=95)=>{const words=clean(s).split(' '),out=[];let line='';for(const word of words){if((line+' '+word).length>max){out.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)out.push(line);return out;};
 const sheetLetter=i=>{let s='';do{s=String.fromCharCode(65+(i%26))+s;i=Math.floor(i/26)-1;}while(i>=0);return s;};
 const labels=new Map();plan.sheets.forEach((sheet,si)=>sheet.items.forEach((item,pi)=>labels.set(item.id,sheetLetter(si)+String.fromCharCode(65+(pi%26)))));
 let p=page('Guarda-roupa com portas de correr - plugin 2.9.38'),y=506;
 const {L,W,kerf,margin,grain}=plan.settings,area=plan.parts.reduce((s,p)=>s+p.l*p.w,0);
 for(const line of ['Gerado em '+plan.created,plan.parts.length+' peças / '+plan.sheets.length+' chapas / aproveitamento bruto '+fmt(area/(plan.sheets.length*L*W)*100)+'%', 'Chapa: '+fmt(L)+' x '+fmt(W)+' mm | Serra: '+fmt(kerf)+' mm | Refilo por borda: '+fmt(margin)+' mm','Veio: '+(grain==='locked'?'comprimento da peça alinhado ao comprimento da chapa':'rotação autorizada individualmente'),'Todas as cotas estão em milímetros. Mapas fora de escala para impressão.','Dimensões nominais, sem desconto de fita. Confira encaixes após alterar espessuras por peça.','Cortes guilhotinados; distribuição heurística, sem garantia de aproveitamento ótimo.','Gavetas: lateral 15 mm, fundo 6 mm; rasgo lateral 10 mm; início do rasgo 12 mm acima da base.','Sapateiras: fundo conforme configuração. Rasgos e furações não são executados pelo plano.']){text(p,line,30,y,10);y-=22;}
 y-=12;text(p,'CHAPAS POR MATERIAL E ESPESSURA',30,y,12,true);y-=22;
 const groups=new Map();for(const s of plan.sheets){const key=s.material+' / '+fmt(s.t)+' mm';groups.set(key,(groups.get(key)||0)+1);}
 for(const [name,qty] of groups){if(y<65){p=page('Resumo de chapas - continuação');y=500;}text(p,qty+' chapa(s) - '+name,30,y);y-=18;}
 // Reference layout: a printable piece list comes before the cutting maps.
 const byMaterial=new Map();for(const item of plan.parts){const key=(item.material||'Sem material')+' / '+fmt(item.t)+' mm';if(!byMaterial.has(key))byMaterial.set(key,[]);byMaterial.get(key).push(item);}
 for(const [material,items] of byMaterial){let row=0;while(row<items.length){p=page(row?'Lista de peças - continuação':'Lista de peças');text(p,'PROJETO: GUARDA-ROUPA COM PORTAS DE CORRER',30,510,10,true);text(p,material,30,491,11,true);text(p,'Nº',30,468,9,true);text(p,'Designação',62,468,9,true);text(p,'Qtd.',545,468,9,true);text(p,'Comprimento',620,468,9,true);text(p,'Largura',720,468,9,true);text(p,'Esp.',782,468,9,true);let yy=448;for(let j=0;j<18&&row<items.length;j++,row++){const item=items[row];text(p,labels.get(item.id)||item.id,30,yy,8,true);text(p,clean(item.name),62,yy,8);text(p,'1',550,yy,8);text(p,fmt(item.l),620,yy,8);text(p,fmt(item.w),720,yy,8);text(p,fmt(item.t),782,yy,8);yy-=21;}}
 }
 p=page('Plano de corte | resumo');y=506;text(p,'CONFIGURAÇÕES',30,y,12,true);y-=24;
 for(const line of ['Chapa padrão: '+fmt(L)+' x '+fmt(W)+' mm','Quantidade de chapas: '+plan.sheets.length,'Quantidade de peças: '+plan.parts.length,'Serra: '+fmt(kerf)+' mm','Refilo: '+fmt(margin)+' mm por borda','Sentido do veio: '+(grain==='locked'?'respeitado':'rotação permitida'),'Eficiência bruta: '+fmt(area/(plan.sheets.length*L*W)*100)+'%']){text(p,line,42,y,10);y-=20;}
 y-=10;text(p,'CHAPAS',30,y,12,true);y-=22;for(let i=0;i<plan.sheets.length;i++){const s=plan.sheets[i];text(p,'Chapa '+(i+1)+' · '+s.material+' / '+fmt(s.t)+' mm · '+s.items.length+' peças',42,y,10);y-=19;if(y<70){p=page('Plano de corte | resumo - continuação');y=506;}}
 const smallDetails=[];
 for(let i=0;i<plan.sheets.length;i++){
  const s=plan.sheets[i];p=page('Chapa '+(i+1)+' / '+s.material+' / '+fmt(s.t)+' mm / '+fmt(L)+' x '+fmt(W)+' mm');
  const scale=Math.min(770/L,430/W),ox=30,oy=75;
  p.drawRectangle({x:ox,y:oy,width:L*scale,height:W*scale,borderColor:ink,borderWidth:.8,color:rgb(.97,.97,.97)});
  for(const item of s.items){const x=ox+item.x*scale,y=oy+(W-item.y-item.ph)*scale,w=item.pw*scale,h=item.ph*scale;if(drawPiece(p,{...item,id:labels.get(item.id)||item.id},x,y,w,h)<6)smallDetails.push({item,sheet:i+1,label:labels.get(item.id)||item.id});}
  text(p,'Cotas em mm: horizontal e vertical acompanham a peça. Peças pequenas têm detalhes ampliados ao final.',30,49,9);
  text(p,'Origem X/Y: canto superior esquerdo da chapa. Lista de peças na página seguinte.',30,36,9);
  let row=0;
  while(row<s.items.length){p=page('Lista da chapa '+(i+1)+' - '+s.material+' / '+fmt(s.t)+' mm');y=505;text(p,'Nº    PEÇA',30,y,10,true);text(p,'C x L (mm)',470,y,10,true);text(p,'X / Y (mm)',600,y,10,true);text(p,'GIRADA',735,y,10,true);y-=23;
   for(let j=0;j<19&&row<s.items.length;j++,row++){const item=s.items[row];text(p,labels.get(item.id)||item.id,30,y,9,true);text(p,item.name,65,y,9);text(p,fmt(item.l)+' x '+fmt(item.w),470,y,9);text(p,fmt(item.x)+' / '+fmt(item.y),600,y,9);text(p,item.rotated?'Sim':'Não',735,y,9);y-=22;}
  }
 }
 for(let i=0;i<smallDetails.length;i++){
  if(i%6===0)p=page('Peças pequenas - detalhes cotados, sem escala');
  const {item,sheet}=smallDetails[i],col=i%2,row=Math.floor((i%6)/2),x=30+col*395,top=506-row*150;
  text(p,(item.label||item.id)+' / Chapa '+sheet+' / '+item.name,x,top,9,true);
  // Enlarged schematic preserves the orientation, while making thin strips legible.
  const factor=Math.min(350/item.pw,98/item.ph),w=Math.max(70,item.pw*factor),h=Math.max(55,item.ph*factor);
  drawPiece(p,{...item,id:item.label||item.id},x+8,top-18-h,w,h,10);
 }
 p=page('Ferragens e observações de usinagem');y=505;
 for(const h of plan.hardware){if(y<70){p=page('Ferragens - continuação');y=505;}text(p,h.qty+' x '+h.name+' - '+fmt(h.length)+' mm',30,y);y-=20;}
 y-=15;
 for(const item of plan.parts.filter(p=>p.note)){for(const line of wrap(item.id+' '+item.name+': '+item.note,125)){if(y<70){p=page('Usinagem - continuação');y=505;}text(p,line,30,y,9);y-=16;}}
 const pages=doc.getPages();pages.forEach((p,i)=>text(p,'Metalloide - '+(i+1)+' / '+pages.length,700,24,9));
 return doc.save();
}
function setupCut(){
 el('abrir-corte').onclick=()=>{el('cut-dialog').showModal();el('cut-error').textContent='';try{prepareParts();}catch(e){el('cut-error').textContent=e.message;el('parts-editor').replaceChildren();}};
 el('close-cut').onclick=()=>el('cut-dialog').close();
 CUT_FIELDS.forEach(id=>el(id).addEventListener('input',()=>{invalidateCut();if(id.startsWith('mat-'))try{prepareParts();}catch(e){el('cut-error').textContent=e.message;}}));
 el('generate-cut').onclick=()=>{el('cut-error').textContent='';el('cut-stale').textContent='';invalidateCut();try{prepareParts();const plan=packParts(currentParts,getPackSettings());renderPlan(plan);cutPlan=plan;el('download-pdf').disabled=false;el('download-csv').disabled=false;el('cut-stale').textContent='Plano atualizado.';}catch(e){el('cut-error').textContent=e.message;}};
 el('download-pdf').onclick=async()=>{if(!cutPlan)return;const snapshot=cutPlan;el('download-pdf').disabled=true;try{const bytes=await buildPDF(snapshot);saveBlob(new Blob([bytes],{type:'application/pdf'}),'plano-de-corte-guarda-roupa.pdf');}catch(e){el('cut-error').textContent='Não foi possível gerar o PDF: '+e.message;}finally{el('download-pdf').disabled=!cutPlan;}};
 el('download-csv').onclick=()=>{if(!cutPlan)return;const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';const rows=[['Chapa','ID','Peça','Comprimento mm','Largura mm','Espessura mm','Material','Girada','X mm','Y mm']];cutPlan.sheets.forEach((s,i)=>s.items.forEach(p=>rows.push([i+1,p.id,p.name,p.l,p.w,p.t,p.material,p.rotated?'Sim':'Não',p.x,p.y])));saveBlob(new Blob(['\uFEFF'+rows.map(r=>r.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'lista-de-corte.csv');};
}

