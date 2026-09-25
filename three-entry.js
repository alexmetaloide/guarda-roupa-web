try{globalThis.THREE=await import("./three.module.js");// Dimensions follow the Ruby module. Web scene axes: X right, Y up, Z front; units cm.
function wardrobeModel(d){
 const n=k=>Number(d[k]),L=n('largura'),H=n('altura'),D=n('profundidade'),e=n('esp_estrutura'),f=n('esp_fundo'),t=n('esp_frente'),s=n('esp_prateleira'),B=n('altura_base_integrada_guarda'),I=n('altura_interna_inferior'),bodyD=D-f,shortD=bodyD-n('diferenca_profundidade_laterais'),W=L/2;
 const parts=[],actions=[];
 const box=(name,x,y,z,w,h,depth,material='body',action=null)=>{
  if(![x,y,z,w,h,depth].every(Number.isFinite)||Math.min(w,h,depth)<=0)throw Error('Revise as medidas de '+name+'.');
  parts.push({name,x,y,z,w,h,depth,material,action});
 };
 for(const [index,side] of ['esquerda','direita'].entries()){
  const x=-L/2+index*W,sideLabel=index?'direito':'esquerdo',openWidth=W-2*e;
  if(B>0){const bx=x+(index?0:5),bw=W-5,bd=D-5;box('Base frontal '+sideLabel,bx,0,bd-e,bw,B,e);box('Base traseira '+sideLabel,bx,0,0,bw,B,e);box('Travessa '+sideLabel+' 1',bx,0,e,e,B,bd-2*e);box('Travessa '+sideLabel+' 2',bx+bw-e,0,e,e,B,bd-2*e);}
  for(const [level,y,h] of [['inferior',B,I+2*e],['maleiro',B+I+2*e,H-B-I-2*e]]){
   const up=level==='maleiro',leftD=index?shortD:bodyD,rightD=index?bodyD:shortD;
   box('Base '+level+' '+sideLabel,x+(up?e:0),y,0,up?W-2*e:W,e,up?shortD:bodyD);
   box('Lateral esquerda '+level+' '+sideLabel,x,y+(up?0:e),0,e,h-e,leftD);
   box('Lateral direita '+level+' '+sideLabel,x+W-e,y+(up?0:e),0,e,h-e,rightD);
   box('Tampo '+level+' '+sideLabel,x+(up?0:e),y+h-e,0,up?W:W-2*e,e,up?bodyD:shortD);
   box('Fundo '+level+' '+sideLabel,x,y,-f,W,h,f,'back');
  }
  const drawers=Number(d['quantidade_gavetas_'+side]),shoes=Number(d['quantidade_sapateiras_'+side]),C=drawers+shoes?n('altura_gaveteiro_'+side):0,freeBase=B+e+C,freeH=I-C;
  for(const [i,height] of (d['alturas_prateleiras_'+side]||[]).entries())box('Prateleira '+(i+1)+' '+sideLabel,x+e,freeBase+Number(height),0,openWidth,s,shortD);
  if(d['criar_colmeia_'+side]==='Sim'){
   const rows=Number(d['quantidade_prateleiras_'+side]),cols=Number(d['vaos_colmeia_'+side]),cellH=(freeH-rows*s)/(rows+1),cellW=(openWidth-(cols-1)*s)/cols;
   for(let row=0;row<=rows;row++)for(let col=1;col<cols;col++)box('Colmeia '+sideLabel+' '+row+'-'+col,x+e+col*cellW+(col-1)*s,freeBase+row*(cellH+s),0,s,cellH,shortD);
  }
  const mode=d['modo_cabideiro_'+side];if(mode!=='Nenhum'){
   const levels=[B+e+I-n('recuo_varao_superior_'+side)];if(mode==='Dois varões')levels.push(freeBase+n('altura_varao_inferior_'+side));
   levels.forEach((y,i)=>parts.push({name:'Varão '+(i+1)+' '+sideLabel,shape:'rod',x:x+e,y,z:shortD/2,length:openWidth,diameter:n('diametro_cabideiro'),material:'metal'}));
  }
  if(drawers+shoes){
   const width=n('largura_gaveteiro_'+side)||openWidth,thick=n('esp_engrosso_gaveteiro_'+side),left=d['engrosso_gaveteiro_'+side+'_lateral_esquerda']==='Sim'?thick:0,right=d['engrosso_gaveteiro_'+side+'_lateral_direita']==='Sim'?thick:0,cap=left||right?n('esp_tamponamento_gaveteiro_'+side):0,bodyH=C-cap,cw=width-left-right,depth=shortD-t,cx=x+e+(openWidth-width)/2,cy=B+e;
   box('Base gaveteiro '+sideLabel,cx+left,cy,0,cw,e,depth);box('Tampo gaveteiro '+sideLabel,cx+left,cy+bodyH-e,0,cw,e,depth);
   box('Lateral gaveteiro E '+sideLabel,cx+left,cy+e,0,e,bodyH-2*e,depth);box('Lateral gaveteiro D '+sideLabel,cx+width-right-e,cy+e,0,e,bodyH-2*e,depth);
   if(cap)box('Tamponamento '+sideLabel,cx,cy+bodyH,0,width,cap,shortD);
   for(const [i,th] of [left,right].entries())if(th)for(const z of [0,depth-6])box('Engrosso '+sideLabel+' '+i+' '+z,cx+(i?width-right:0),cy,z,th,bodyH,6);
   const hidden=d.tipo_corredica_gavetas.startsWith('Oculta'),dw=cw-2*e-(hidden?1:2.7),len=[25,30,35,40,45,60].filter(v=>v<=depth-(hidden?1.5:2)).pop();
   if(!len)throw Error('Gaveteiro sem profundidade para corrediça.');
   const addDrawer=(kind,i,height,y)=>{
    const shoe=kind==='sapateira',id=kind+'-'+side+'-'+i,name=(shoe?'Sapateira ':'Gaveta ')+(i+1)+' - lado '+sideLabel;
    actions.push({id,name,kind,side,axis:'z',travel:Math.min(len*.82,30)});
    const boxH=shoe?height-.5:height-2*e-1,bottom=shoe?n('esp_fundo_sapateira'):.6,contra=boxH-(shoe?.5:1)-1.2-bottom,bx=cx+left+e+(hidden?.5:1.35),by=cy+y+(shoe?0:e+.5),bz=depth-len;
    box(name+' / frente',cx+(left||n('recuo_gavetas_esquerda')),cy+y,depth,width-(left||n('recuo_gavetas_esquerda'))-(right||n('recuo_gavetas_direita')),height,t,'front',id);
    box(name+' / lateral E',bx,by,bz,1.5,boxH,len,'drawer',id);box(name+' / lateral D',bx+dw-1.5,by,bz,1.5,boxH,len,'drawer',id);
    box(name+' / fundo',bx+.5,by+1.2,bz,dw-1,bottom,len,'back',id);
    box(name+' / contra fundo',bx+1.5,by+1.2+bottom,bz,dw-3,contra,1.5,'drawer',id);box(name+' / contra frente',bx+1.5,by+1.2+bottom,depth-1.5,dw-3,contra,1.5,'drawer',id);
   };
   const gap=drawers?n('espacamento_sapateira'):(bodyH-2*e-n('recuo_gavetas_inferior')-shoes*n('altura_frente_sapateira'))/shoes;
   for(let i=0;i<shoes;i++)addDrawer('sapateira',i,n('altura_frente_sapateira'),n('recuo_gavetas_inferior')+i*(n('altura_frente_sapateira')+gap));
   let top=bodyH-n('recuo_gavetas_superior')-(cap?.4:0);
   for(const [i,h] of (d['alturas_frentes_'+side]||[]).entries()){top-=Number(h);addDrawer('gaveta',i,Number(h),top);top-=n('folga_entre_frentes_gavetas');}
  }
 }
 if(d.criar_portas_correr==='Sim'){
  const span=L-2*e,dw=(span+n('sobreposicao_portas_correr'))/2,height=H-B-2*e-3,travel=span-dw,zBack=bodyD-5.8;
  for(const [i,side] of ['esquerda','direita'].entries()){
   const id='porta-'+side,x=i?L/2-e-dw:-L/2+e,z=zBack+(i?1.4875:4.3125)-t/2;
   actions.push({id,name:'Porta '+side,kind:'porta',side,axis:'x',travel:i?-travel:travel});
   box('Porta '+side,x,B+e+.52+n('folga_portas_correr'),z,dw,height,t,'door',id);
  }
  // Simplified double tracks, as in the source module.
  box('Trilho inferior',-L/2+e,B+e,bodyD-5.65,span,.52,4.65,'metal');
  box('Trilho superior',-L/2+e,H-e-2.5,bodyD-5.8,span,2.5,5.8,'metal');
 }
 return {parts,actions,L,H,D,bodyD};
}
globalThis.wardrobeModel=wardrobeModel;
;const THREE=globalThis.THREE;
const modelFactory=globalThis.wardrobeModel;

let state={parts:[],actions:[],groups:new Map(),doorVisible:true,ghost:false,exporting4k:false};
const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x171b1f);scene.fog=new THREE.Fog(0x171b1f,1100,2200);
const camera=new THREE.PerspectiveCamera(35,1,.1,10000);camera.position.set(350,270,430);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
// Start in a true front elevation so the height/width proportions are readable.
// Perspective remains available through the dedicated camera button.
const controls={target:new THREE.Vector3(0,120,0),theta:0,phi:1.45,radius:620,update(){const s=Math.sin(this.phi);camera.position.set(this.target.x+this.radius*s*Math.sin(this.theta),this.target.y+this.radius*Math.cos(this.phi),this.target.z+this.radius*s*Math.cos(this.theta));camera.lookAt(this.target);},reset(){this.theta=0;this.phi=1.45;this.radius=620;this.update();}};
const root=new THREE.Group();scene.add(root);
const ambient=new THREE.HemisphereLight(0xffffff,0x697078,1.55);scene.add(ambient);
const key=new THREE.DirectionalLight(0xfffbf2,2.75);key.position.set(300,520,360);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.near=20;key.shadow.camera.far=1800;key.shadow.camera.left=-520;key.shadow.camera.right=520;key.shadow.camera.top=520;key.shadow.camera.bottom=-520;key.shadow.bias=-0.00035;scene.add(key);
const fill=new THREE.DirectionalLight(0xe7f0f8,1.15);fill.position.set(-360,260,160);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,.6);rim.position.set(160,330,-360);scene.add(rim);
const raycaster=new THREE.Raycaster(),pointerNdc=new THREE.Vector2();
function makeNoiseTexture(base='#ffffff',variation=10,size=384,grain=false){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,size,size);
 const image=ctx.getImageData(0,0,size,size),data=image.data;let seed=937451;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;const band=grain?Math.sin(y*.37+x*.012)*2.3:0;const n=(rnd()-.5)*variation+band;data[i]=Math.max(0,Math.min(255,data[i]+n));data[i+1]=Math.max(0,Math.min(255,data[i+1]+n));data[i+2]=Math.max(0,Math.min(255,data[i+2]+n));}
 ctx.putImageData(image,0,0);const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(4,4);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tex;
}
const textures={
 mdf:makeNoiseTexture('#e6e6e2',5,512,false),
 back:makeNoiseTexture('#ddddda',5,512,false),
 front:makeNoiseTexture('#ecece8',4,512,false),
 door:makeNoiseTexture('#ecece8',4,512,false),
 drawer:makeNoiseTexture('#e3e3df',5,512,false),
 shoe:makeNoiseTexture('#e0e0dc',5,512,false),
 shelf:makeNoiseTexture('#e8e8e4',5,512,false),
 surface:makeNoiseTexture('#808080',18,512,false),
 floor:makeNoiseTexture('#2a3036',9,512,false)
};
textures.surface.colorSpace=THREE.NoColorSpace;
const floor=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800),new THREE.MeshPhysicalMaterial({color:0x2a3036,map:textures.floor,roughness:.92,metalness:0,clearcoat:0}));floor.rotation.x=-Math.PI/2;floor.position.y=-.7;floor.receiveShadow=true;scene.add(floor);
const palette={body:0xf5f5f2,back:0xefefec,front:0xf7f7f4,door:0xf7f7f4,drawer:0xf2f2ef,shoe:0xefefec,shelf:0xf5f5f2,metal:0xb9bec2};
function materialKind(p){if(p.shape==='rod'||p.material==='metal')return'metal';if(p.action?.startsWith('gaveta'))return'drawer';if(p.action?.startsWith('sapateira'))return'shoe';if(/Prateleira|Colmeia/i.test(p.name||''))return'shelf';if(p.material==='back')return'back';if(p.material==='door')return'door';if(p.material==='front')return'front';return'mdf';}
function materialFor(p){const kind=materialKind(p);if(kind==='metal')return new THREE.MeshPhysicalMaterial({color:palette.metal,metalness:.92,roughness:.2,clearcoat:.2,clearcoatRoughness:.14});const map=textures[kind]||textures.mdf;const color=kind==='mdf'?palette.body:palette[kind]||palette.body;const front=/^(front|door)$/.test(kind);return new THREE.MeshPhysicalMaterial({color,map,bumpMap:textures.surface,bumpScale:.045,metalness:0,roughness:front?.62:.72,clearcoat:front?.045:.015,clearcoatRoughness:.5,ior:1.46,sheen:.01,sheenRoughness:.86});}
function resize(){const box=$('scene3d').getBoundingClientRect();if(!box.width)return;renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();}function colorFor(p){if(p.action?.startsWith('gaveta'))return palette.drawer;if(p.action?.startsWith('sapateira'))return palette.shoe;if(/Prateleira|Colmeia/i.test(p.name||''))return palette.shelf;return palette[p.material]||palette.body;}
function makePart(p){if(p.shape==='rod'){const geo=new THREE.CylinderGeometry(p.diameter/2,p.diameter/2,p.length,36);const mesh=new THREE.Mesh(geo,materialFor(p));mesh.rotation.z=Math.PI/2;mesh.position.set(p.x+p.length/2,p.y,p.z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}const geo=new THREE.BoxGeometry(p.w,p.h,p.depth);const mat=materialFor(p);mat.transparent=p.material==='back';mat.opacity=1;const mesh=new THREE.Mesh(geo,mat);mesh.position.set(p.x+p.w/2,p.y+p.h/2,p.z+p.depth/2);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
function clear(){while(root.children.length)root.remove(root.children[0]);state.groups.clear();}
function renderModel(data){clear();root.position.set(0,0,0);let model;try{model=modelFactory(data);}catch(e){$('scene3d-status').textContent=e.message;return;}state.parts=model.parts;state.actions=model.actions;for(const p of model.parts){const mesh=makePart(p);mesh.userData={action:p.action,base:mesh.position.clone(),p};root.add(mesh);if(p.action){if(!state.groups.has(p.action))state.groups.set(p.action,[]);state.groups.get(p.action).push(mesh);}}
 const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 // Keep the lowest part on the floor. Centering around the bounding-box
 // midpoint made the fixed floor plane cover the integrated base.
 root.position.set(-center.x,-box.min.y,-center.z);
 controls.target.set(0,size.y*.45,0);camera.position.set(size.x*1.1,size.y*.72,size.z*1.35);controls.update();buildActions();$('scene3d-status').textContent=model.parts.length+' componentes · clique em portas, gavetas ou sapateiras para abrir.';}
function setOpen(id,open){const arr=state.groups.get(id)||[];arr.forEach(mesh=>{const base=mesh.userData.base;const p=mesh.userData.p,travel=(state.actions.find(a=>a.id===id)||{}).travel||0;const t=open?travel:0;if((p.action||'').startsWith('porta'))mesh.position.x=base.x+t;else mesh.position.z=base.z+t;mesh.userData.open=open;});const btn=document.querySelector('[data-action="'+id+'"]');if(btn)btn.textContent=open?'Fechar':'Abrir';}
function buildActions(){const box=$('actions3d');box.innerHTML='';for(const a of state.actions){const row=document.createElement('div');row.className='movement-row';const label=document.createElement('label');label.textContent=a.name;const input=document.createElement('input');input.type='range';input.min=0;input.max=100;input.value=0;input.dataset.actionRange=a.id;input.setAttribute('aria-label','Abertura '+a.name);input.oninput=()=>{const arr=state.groups.get(a.id)||[];const ratio=Number(input.value)/100;arr.forEach(mesh=>{const base=mesh.userData.base,t=a.travel*ratio;mesh.position[(a.kind==='porta'?'x':'z')]=base[(a.kind==='porta'?'x':'z')]+t;mesh.userData.open=ratio>0;});};const button=document.createElement('button');button.className='secondary';button.dataset.action=a.id;button.textContent='Abrir';button.onclick=()=>{const open=button.textContent==='Abrir';input.value=open?'100':'0';input.dispatchEvent(new Event('input'));button.textContent=open?'Fechar':'Abrir';};row.append(label,input,button);box.append(row);}}
function setDoors(hidden){root.children.forEach(mesh=>{if(mesh.userData.p?.material==='door')mesh.visible=!hidden;});}
function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,camera);}
function export4K(){if(state.exporting4k)return;state.exporting4k=true;const btn=$('export4k');const oldText=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Gerando 4K…';}const box=$('scene3d').getBoundingClientRect(),oldPixel=renderer.getPixelRatio(),oldAspect=camera.aspect;renderer.setPixelRatio(1);renderer.setSize(3840,2160,false);camera.aspect=3840/2160;camera.updateProjectionMatrix();controls.update();renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='guarda-roupa-3d-4k.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));renderer.setSize(box.width,box.height,false);camera.aspect=oldAspect;camera.updateProjectionMatrix();state.exporting4k=false;if(btn){btn.disabled=false;btn.textContent=oldText||'Salvar imagem 4K';}},'image/png',1);}
function pickAction(e){const rect=renderer.domElement.getBoundingClientRect();pointerNdc.x=((e.clientX-rect.left)/rect.width)*2-1;pointerNdc.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointerNdc,camera);const hit=raycaster.intersectObjects(root.children,true).find(h=>h.object.userData?.action);if(!hit)return;const id=hit.object.userData.action,button=document.querySelector('[data-action="'+id+'"]'),input=document.querySelector('[data-action-range="'+id+'"]');const open=!(button&&button.textContent==='Fechar');if(input){input.value=open?'100':'0';input.dispatchEvent(new Event('input'));}if(button)button.textContent=open?'Fechar':'Abrir';}
function setupPointer(host){let down=null,last=null,moved=false;host.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};last=down;moved=false;host.setPointerCapture(e.pointerId);});host.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-last.x,dy=e.clientY-last.y;if(Math.abs(e.clientX-down.x)+Math.abs(e.clientY-down.y)>6)moved=true;controls.theta-=dx*.008;controls.phi=Math.max(.35,Math.min(1.48,controls.phi+dy*.008));last={x:e.clientX,y:e.clientY};});host.addEventListener('pointerup',e=>{if(down&&!moved)pickAction(e);down=null;});host.addEventListener('wheel',e=>{e.preventDefault();controls.radius=Math.max(110,Math.min(1200,controls.radius*(e.deltaY>0?1.08:.92)));},{passive:false});}
function setup3D(){const host=$('scene3d');host.append(renderer.domElement);setupPointer(host);window.addEventListener('resize',resize);resize();const get=()=>window.getConfiguration?.();window.refresh3D=()=>{if(get)renderModel(get());};if(get)renderModel(get());document.querySelectorAll('[data-key]').forEach(el=>{el.addEventListener('change',()=>window.refresh3D());el.addEventListener('input',()=>window.refresh3D());});document.getElementById('front3d').onclick=()=>{controls.theta=0;controls.phi=1.45;controls.radius=620;};document.getElementById('angle3d').onclick=()=>{controls.theta=.68;controls.phi=1.05;controls.radius=620;};document.getElementById('zoom-in3d').onclick=()=>controls.radius=Math.max(110,controls.radius*.85);document.getElementById('zoom-out3d').onclick=()=>controls.radius=Math.min(1200,controls.radius*1.18);document.getElementById('hide-doors3d').onchange=e=>setDoors(e.target.checked);document.getElementById('ghost3d').onchange=e=>{const ghost=e.target.checked;root.children.forEach(m=>{if(m.material?.transparent!==undefined&&m.userData.p?.material!=='door')m.material.opacity=ghost?.2:1;m.material.needsUpdate=true;});};document.getElementById('open-drawers3d').onclick=()=>state.actions.forEach(a=>{if(a.kind!=='porta')setOpen(a.id,true);});document.getElementById('close-all3d').onclick=()=>state.actions.forEach(a=>setOpen(a.id,false));if($('export4k'))$('export4k').onclick=export4K;$('expand3d').onclick=()=>{const dedicated=/preview3d\.html$/i.test(window.location.pathname);if(dedicated){const mainPage=window.location.protocol==='file:'?'Editor_Guarda_Roupa.html':'index.html';window.close();setTimeout(()=>{if(!window.closed)window.location.assign(mainPage);},120);return;}const cfg=get?.();if(cfg)localStorage.setItem('guarda-roupa-preview-config',JSON.stringify(cfg));const tab=window.open('preview3d.html','_blank','noopener');if(!tab)window.location.assign('preview3d.html');};renderer.domElement.addEventListener('dblclick',()=>{});controls.update();frame();}
window.setup3D=setup3D;
;setupWeb();setupCut();setup3D();}catch(__e){console.error(__e);const __s=document.getElementById("scene3d-status");if(__s)__s.textContent="Não foi possível carregar a prévia 3D: "+(__e?.message||__e);}