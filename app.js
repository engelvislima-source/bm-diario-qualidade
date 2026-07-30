
function today(){return new Date().toISOString().slice(0,10)}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');window.scrollTo(0,0);if(id==='history')renderHistory()}

function init(){
 document.getElementById('data').value=today();document.getElementById('noteDate').value=today();
 Object.keys(works).forEach(x=>obra.add(new Option(x,x)));
 mirantesModules.forEach(x=>modulo.add(new Option(x.name,x.name)));
 apartamento.add(new Option("Sem apartamento / área comum",""));
 [1,2,3,4].forEach(p=>[1,2,3,4].forEach(n=>apartamento.add(new Option(`${p}0${n}`,`${p}0${n}`))));
 environments.forEach(x=>ambiente.add(new Option(x,x)));
 services.forEach(x=>servico.add(new Option(x,x)));
 renderChecklistFields(); onWorkChange(); updatePhotoCaptionPreview(); updateWeekdayPreview();
}
function onWorkChange(){
 const w=works[obra.value];
 endereco.value=w.address; cidade.value=w.city;
 const isMirantes=obra.value==="Mirantes do Lago";
 moduleWrap.classList.toggle("hidden",!isMirantes);
 if(isMirantes){modulo.value=w.defaultModule||"Módulo 2"}
 populateBlocks();
}
function populateBlocks(){
 bloco.innerHTML="";
 let start=1,end=works[obra.value].blocks;
 if(obra.value==="Mirantes do Lago"){
   const m=mirantesModules.find(x=>x.name===modulo.value)||mirantesModules[1];
   start=m.start; end=m.end;
 }
 for(let i=start;i<=end;i++) bloco.add(new Option(`Bloco ${String(i).padStart(2,'0')}`,String(i).padStart(2,'0')));
 updatePhotoCaptionPreview();
}
// Dia da semana: SEGUNDA..SABADO (índice 0-5). Domingo não tem correspondência (obra não trabalha).
function weekdayIndex(dateStr){
 if(!dateStr) return -1;
 const d=new Date(dateStr+'T12:00:00');
 const map={1:0,2:1,3:2,4:3,5:4,6:5};
 return map[d.getDay()]!==undefined?map[d.getDay()]:-1;
}
function updateWeekdayPreview(){
 const idx=weekdayIndex(data.value);
 diaSemana.value = idx>=0 ? DOW_LABELS[idx] : (data.value?"Domingo":"");
}
function newDiary(){current={id:uid(),header:{},records:[],checklist:[],notes:[]};data.value=today();updateWeekdayPreview();showScreen('diary')}
function saveHeader(){
 current.header={
  obra:obra.value,modulo:obra.value==="Mirantes do Lago"?modulo.value:"",data:data.value,
  endereco:endereco.value,cidade:cidade.value,fase:fase.value,
  engenheiro:engenheiro.value,engCoordenador:engCoordenador.value,
  qualidade:qualidade.value,assistente:assistente.value,encarregado:encarregado.value
 };
 persist();alert('Dados do diário salvos.');
}
function fileToDataURL(file){return new Promise((resolve,reject)=>{if(!file)return resolve('');const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function locationText(r){
 return [`Bloco ${r.bloco}`,r.apartamento?`Apartamento ${r.apartamento}`:"",r.ambiente].filter(Boolean).join(" – ");
}
function automaticPhotoCaption(service){
 const captions={
  "Pintura":"Serviço de pintura",
  "Cerâmica":"Serviço de revestimento cerâmico",
  "Esquadrias":"Instalação e ajuste de esquadrias",
  "Gesso Cola":"Aplicação de gesso cola",
  "Gesso Acartonado":"Execução de gesso acartonado",
  "Louças":"Instalação de louças sanitárias",
  "Bancadas":"Instalação de bancadas",
  "Elétrica":"Execução de instalações elétricas",
  "Hidráulica":"Execução de instalações hidráulicas",
  "PU":"Aplicação de selante PU",
  "Limpeza":"Serviço de limpeza",
  "Textura":"Aplicação de textura",
  "Massa Corrida":"Aplicação de massa corrida",
  "Impermeabilização":"Serviço de impermeabilização",
  "Porta de Madeira":"Instalação de porta de madeira",
  "Porta Postigo":"Instalação de porta postigo",
  "Infra I":"Execução da Infra I",
  "Infra II":"Execução da Infra II",
  "Serralheria":"Serviço de serralheria",
  "Reboco":"Execução de reboco",
  "Requadração":"Execução de requadração",
  "Alvenaria":"Execução de alvenaria",
  "Forma":"Montagem de formas",
  "Estuque":"Execução de estuque"
 };
 return captions[service]||`Serviço de ${service}`;
}
function updatePhotoCaptionPreview(){
 if(typeof photoCaptionPreview!=="undefined"){
   photoCaptionPreview.textContent=`${automaticPhotoCaption(servico.value)} – ${locationText({bloco:bloco.value,apartamento:apartamento.value,ambiente:ambiente.value})}`;
 }
}
async function addRecord(){
 const image=await fileToDataURL(foto.files[0]);
 if(!descricao.value.trim() && !image){alert('Escreva o apontamento técnico ou tire uma foto.');return}
 const rec={id:uid(),bloco:bloco.value,apartamento:apartamento.value,ambiente:ambiente.value,servico:servico.value,responsavel:responsavelReg.value,prazo:prazo.value,legenda:automaticPhotoCaption(servico.value),descricao:descricao.value.trim(),image,generateNote:generateNote.checked};
 current.records.push(rec);
 if(rec.generateNote && rec.descricao){
   current.notes.push({id:uid(),name:qualidade.value||current.header.qualidade||"",date:data.value||today(),text:rec.descricao,resolution:rec.prazo||""});
 }
 descricao.value='';foto.value='';responsavelReg.value='';prazo.value='';generateNote.checked=false;persist();renderRecords();renderNotes();alert('Registro salvo.');
}
function renderRecords(){
 recordList.innerHTML=current.records.map((r,i)=>`<div class="list-item"><div class="row between"><strong>Foto ${i+1} — ${r.servico}</strong><button onclick="removeRecord('${r.id}')">Excluir</button></div><div class="muted">${locationText(r)}</div><p><strong>Descrição da foto:</strong> ${escapeHtml(r.legenda||automaticPhotoCaption(r.servico))}</p>${r.descricao?`<p><strong>Apontamento técnico:</strong> ${escapeHtml(r.descricao)}</p>`:''}${r.image?`<img src="${r.image}">`:''}${r.generateNote?'<div class="muted">✓ Também está no relatório de apontamento</div>':''}</div>`).join('');
}
function removeRecord(id){current.records=current.records.filter(x=>x.id!==id);persist();renderRecords()}
function renderChecklistFields(){
 checklistFields.innerHTML=questions.map((q,i)=>`<div class="check-row"><strong>${i+1}. ${q}</strong><div class="grid2"><label>Resposta<select id="q${i}ans"><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select></label><label>Quantidade<input type="number" id="q${i}qty"></label><label>Se sim por quem? Se não por quê?<input id="q${i}why"></label><label>Equipamento/material/serviço/empreiteiro/quem checou<input id="q${i}detail"></label></div></div>`).join('');
}
function saveChecklist(){
 current.checklist=questions.map((q,i)=>({question:q,answer:document.getElementById(`q${i}ans`).value,qty:document.getElementById(`q${i}qty`).value,why:document.getElementById(`q${i}why`).value,detail:document.getElementById(`q${i}detail`).value}));
 persist();alert('Relatório de ocorrências salvo.');
}
function addNote(){
 if(!noteText.value.trim()){alert('Digite a descrição da orientação.');return}
 current.notes.push({id:uid(),name:noteName.value,date:noteDate.value,text:noteText.value.trim(),resolution:noteResolution.value||''});
 noteText.value='';noteResolution.value='';persist();renderNotes();
}
function renderNotes(){
 noteList.innerHTML=current.notes.map(n=>`<div class="list-item"><div class="row between"><strong>${escapeHtml(n.name||'-')}</strong><button onclick="removeNote('${n.id}')">Excluir</button></div><div class="muted">${formatDate(n.date)}</div><p>${escapeHtml(n.text)}</p></div>`).join('');
}
function removeNote(id){current.notes=current.notes.filter(x=>x.id!==id);persist();renderNotes()}
function persist(){
 if(!current.id)current.id=uid();
 const all=JSON.parse(localStorage.getItem('bm_diaries')||'[]');
 const idx=all.findIndex(x=>x.id===current.id); if(idx>=0)all[idx]=current;else all.push(current);
 localStorage.setItem('bm_diaries',JSON.stringify(all));
}
function renderHistory(){
 const all=JSON.parse(localStorage.getItem('bm_diaries')||'[]').reverse();
 historyList.innerHTML=all.length?all.map(d=>`<div class="list-item"><div class="row between"><div><strong>${escapeHtml(d.header?.obra||'Diário sem título')}</strong><div class="muted">${formatDate(d.header?.data)} • ${d.records?.length||0} registros</div></div><button onclick="openDiary('${d.id}')">Abrir</button></div></div>`).join(''):'<p>Nenhum diário salvo.</p>';
}
function openDiary(id){
 const all=JSON.parse(localStorage.getItem('bm_diaries')||'[]');current=all.find(x=>x.id===id);if(!current)return;
 const h=current.header||{};obra.value=h.obra||'Paraty';onWorkChange();if(h.modulo)modulo.value=h.modulo;populateBlocks();
 data.value=h.data||today();updateWeekdayPreview();endereco.value=h.endereco||'';cidade.value=h.cidade||'';fase.value=h.fase||'';
 engenheiro.value=h.engenheiro||'';engCoordenador.value=h.engCoordenador||'';
 qualidade.value=h.qualidade||'Elvis Lima';assistente.value=h.assistente||'';encarregado.value=h.encarregado||'';
 renderRecords();renderNotes();updatePhotoCaptionPreview();showScreen('diary');
}
function formatDate(v){if(!v)return '';const [y,m,d]=v.split('-');return y&&m&&d?`${d}/${m}/${y}`:v}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function dowPrintHtml(dateStr){
 const idx=weekdayIndex(dateStr);
 return DOW_LABELS.map((lbl,i)=>`<span class="${i===idx?'checked':''}">${i===idx?'☑':'☐'} ${lbl}</span>`).join('');
}

function renderReport(){
 saveHeader();
 const h=current.header;
 const photoCards=current.records.length?current.records.map((r,i)=>`<div class="photo-card">${r.image?`<img src="${r.image}">`:'<div style="height:190px"></div>'}<div class="photo-caption">FOTO ${i+1}: ${escapeHtml(r.legenda||automaticPhotoCaption(r.servico))} – ${escapeHtml(locationText(r))}</div></div>`).join(''):'<div class="photo-card"><div style="height:190px"></div><div class="photo-caption">SEM REGISTROS FOTOGRÁFICOS</div></div>';
 const checks=(current.checklist.length?current.checklist:questions.map(q=>({question:q,answer:'',qty:'',why:'',detail:''}))).map((c,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(c.question)}</td><td>${c.answer==='SIM'?'x':''}</td><td>${c.answer==='NÃO'?'x':''}</td><td>${escapeHtml(c.qty||'')}</td><td>${escapeHtml(c.why||'')}</td><td>${escapeHtml(c.detail||'')}</td></tr>`).join('');
 const notes=current.notes.map(n=>`<tr><td>${escapeHtml(n.name||'')}</td><td>${formatDate(n.date)}</td><td>${escapeHtml(n.text)}</td><td>${formatDate(n.resolution)||'-'}</td></tr>`).join('')||'<tr><td colspan="4">Sem apontamentos registrados.</td></tr>';
 const workTitle=h.modulo?`${h.obra} – ${h.modulo}`:h.obra;
 reportContent.innerHTML=`
 <div class="report-band title"><img src="logo.png"><div class="txt">DIÁRIO DE OBRA - QUALIDADE</div></div>
 <table class="info-table">
 <tr><td class="label">Empreendimento:</td><td>${escapeHtml(workTitle||'')}</td><td class="label">Eng. Responsável:</td><td>${escapeHtml(h.engenheiro||'')}</td></tr>
 <tr><td class="label">Endereço:</td><td>${escapeHtml(h.endereco||'')}</td><td class="label">Eng. Coordenador:</td><td>${escapeHtml(h.engCoordenador||'')}</td></tr>
 <tr><td class="label">Cidade/UF:</td><td>${escapeHtml(h.cidade||'')}</td><td class="label">Responsável Qualidade:</td><td>${escapeHtml(h.qualidade||'')}</td></tr>
 <tr><td class="label">Fase da Obra:</td><td>${escapeHtml(h.fase||'')}</td><td class="label">Assistente de Engenharia:</td><td>${escapeHtml(h.assistente||'')}</td></tr>
 <tr><td class="label">Data do Diário:</td><td>${formatDate(h.data)}</td><td class="label">Encarregado:</td><td>${escapeHtml(h.encarregado||'')}</td></tr>
 <tr><td class="label">Dia da Semana:</td><td colspan="3"><div class="dow-print">${dowPrintHtml(h.data)}</div></td></tr>
 </table>
 <div class="report-band section"><div class="logo-blank"></div><div class="txt">RELATÓRIO FOTOGRÁFICO</div></div>
 <div class="photo-grid">${photoCards}</div>
 <div class="report-band section"><img src="logo.png"><div class="txt">RELATÓRIO DE OCORRÊNCIAS</div></div>
 <table class="occ-table"><thead><tr><th>ITEM</th><th>OCORRÊNCIAS</th><th>SIM</th><th>NÃO</th><th>QUANT.</th><th>SE SIM POR QUEM? SE NÃO POR QUÊ?</th><th>QUAL EQUIPAMENTO / MATERIAL / SERVIÇO / EMPREITEIRO / QUEM CHECOU</th></tr></thead><tbody>${checks}</tbody></table>
 <div class="report-band section"><img src="logo.png"><div class="txt">RELATÓRIO DE APONTAMENTO</div></div>
 <table class="note-table"><thead><tr><th>NOME</th><th>DATA DA ORIENTAÇÃO</th><th>DESCRIÇÃO DA ORIENTAÇÃO</th><th>DATA DA RESOLUÇÃO</th></tr></thead><tbody>${notes}</tbody></table>`;
 showScreen('report');
}
function downloadBackup(){
 const blob=new Blob([JSON.stringify(current,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`diario-${current.header?.data||today()}.json`;a.click();URL.revokeObjectURL(a.href);
}

/* ===================== EXPORTAÇÃO EXCEL (ExcelJS) =====================
   Estrutura e coordenadas idênticas ao molde original da empresa
   (DIARIO_DE_OBRA_-_QUALIDADE.xlsx): título em H1:R1, dados nas linhas
   2-8, RELATÓRIO FOTOGRÁFICO na linha 9, grade de 9 fotos (linhas 10-54),
   RELATÓRIO DE OCORRÊNCIAS a partir da linha 55 e RELATÓRIO DE APONTAMENTO
   a partir da linha 64. Paleta: azul FF44546A com texto branco em negrito
   nos títulos/rótulos/cabeçalhos de tabela, igual ao arquivo da empresa. */

function colNum(letters){let n=0;for(let i=0;i<letters.length;i++)n=n*26+(letters.charCodeAt(i)-64);return n}
function parseRef(ref){const m=ref.match(/^([A-Z]+)(\d+)$/);return {col:colNum(m[1]),row:parseInt(m[2],10)}}
function makeStyler(ws){
 return function styleRange(rangeStr,opts,value){
  opts=opts||{};
  const hasMerge=rangeStr.indexOf(':')>-1;
  if(hasMerge) ws.mergeCells(rangeStr);
  const refs=rangeStr.split(':');
  const start=parseRef(refs[0]);
  const end=hasMerge?parseRef(refs[1]):start;
  const thin={style:'thin',color:{argb:'FF9AA8B5'}};
  for(let r=start.row;r<=end.row;r++){
   for(let c=start.col;c<=end.col;c++){
    const cell=ws.getCell(r,c);
    cell.font={name:'Arial',size:opts.size||10,bold:!!opts.bold,color:{argb:opts.color||'FF000000'}};
    cell.alignment={vertical:'middle',horizontal:opts.center?'center':(opts.right?'right':'left'),wrapText:opts.wrap!==false};
    if(opts.fill) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:opts.fill}};
    if(opts.border!==false) cell.border={top:thin,left:thin,bottom:thin,right:thin};
   }
  }
  const anchor=ws.getCell(start.row,start.col);
  if(value!==undefined) anchor.value=value;
  return anchor;
 };
}
function b64ToRaw(dataUrl){return (dataUrl||'').split(',')[1]||''}
function extFromDataUrl(dataUrl){
 if(!dataUrl) return 'jpeg';
 if(dataUrl.indexOf('image/png')>-1) return 'png';
 return 'jpeg';
}

async function buildWorkbook(){
 const h=current.header||{};
 const workTitle=h.modulo?`${h.obra} – ${h.modulo}`:(h.obra||'');
 const workbook=new ExcelJS.Workbook();
 const ws=workbook.addWorksheet('Diário',{pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});
 const styleRange=makeStyler(ws);
 const DARK='FF44546A';
 const WHITE='FFFFFFFF';

 ws.columns=[
  {width:17.14},{width:14.71},{width:6.57},{width:6.86},{width:8},{width:6.57},{width:6.29},
  {width:10.57},{width:8.43},{width:9.86},{width:8.43},{width:31.14},{width:14.14},{width:8.43},
  {width:16.43},{width:17.43},{width:18.71},{width:19.29}
 ];

 let logoImgId=null;
 try{ logoImgId=workbook.addImage({base64:LOGO_B64,extension:'png'}); }catch(e){}
 function placeLogo(rowNumber){
  if(logoImgId===null) return;
  try{ ws.addImage(logoImgId,{tl:{col:0.05,row:(rowNumber-1)+0.08},ext:{width:170,height:30}}); }catch(e){}
 }

 // Título
 styleRange('A1:G1',{},'');
 styleRange('H1:R1',{bold:true,center:true,color:WHITE,fill:DARK,size:18},'DIÁRIO DE OBRA - QUALIDADE');
 placeLogo(1);
 ws.getRow(1).height=32;

 // Cabeçalho de dados (rótulos: fundo azul/texto branco; valores: fundo branco/texto preto)
 styleRange('A2:C2',{bold:true,color:WHITE,fill:DARK},'Empreendimento:');
 styleRange('D2:R2',{bold:true,size:12},workTitle);

 styleRange('A3:C4',{bold:true,color:WHITE,fill:DARK},'Endereço:');
 styleRange('D3:J4',{},h.endereco||'');
 styleRange('K3:L3',{bold:true,color:WHITE,fill:DARK,size:9},'Eng. Responsável:');
 styleRange('M3:R3',{},h.engenheiro||'');
 styleRange('K4:L4',{bold:true,color:WHITE,fill:DARK,size:9},'Eng. Coordenador:');
 styleRange('M4:R4',{},h.engCoordenador||'');

 styleRange('A5:C5',{bold:true,color:WHITE,fill:DARK},'Cidade/UF:');
 styleRange('D5:J5',{},h.cidade||'');
 styleRange('K5:L5',{bold:true,color:WHITE,fill:DARK,size:9},'Responsável Qualidade:');
 styleRange('M5:R5',{},h.qualidade||'');

 styleRange('A6:C7',{bold:true,color:WHITE,fill:DARK},'Fase da Obra:');
 styleRange('D6:J7',{},h.fase||'');
 styleRange('K6:L6',{bold:true,color:WHITE,fill:DARK,size:9},'Assistente de Engenharia:');
 styleRange('M6:R6',{},h.assistente||'');
 styleRange('K7:L7',{bold:true,color:WHITE,fill:DARK,size:9},'Encarregado:');
 styleRange('M7:R7',{},h.encarregado||'');

 styleRange('A8:C8',{bold:true,color:WHITE,fill:DARK},'Data do Diário:');
 styleRange('D8:J8',{},formatDate(h.data));
 styleRange('K8:L8',{bold:true,color:WHITE,fill:DARK,size:9},'Dia da Semana:');
 const dowCells=['M8','N8','O8','P8','Q8','R8'];
 const dowIdx=weekdayIndex(h.data);
 DOW_LABELS.forEach((lbl,i)=>{
  const chosen=(dowIdx===i);
  styleRange(dowCells[i],{center:true,bold:chosen,size:9},(chosen?'☑ ':'☐ ')+lbl);
 });
 for(let rr=2;rr<=8;rr++) ws.getRow(rr).height=20;

 // Relatório fotográfico
 styleRange('A9:R9',{bold:true,center:true,color:WHITE,fill:DARK,size:12},'RELATÓRIO FOTOGRÁFICO');
 ws.getRow(9).height=18;

 const PHOTO_SLOTS=["A10:I23","J10:N23","O10:R23","A25:I38","J25:N38","O25:R38","A40:I53","J40:N53","O40:R53"];
 const PHOTO_CAPS=["A24:I24","J24:N24","O24:R24","A39:I39","J39:N39","O39:R39","A54:I54","J54:N54","O54:R54"];
 const photosForGrid=current.records.slice(0,9);
 for(let i=0;i<9;i++){
  styleRange(PHOTO_SLOTS[i],{fill:'FFFFFFFF'},undefined);
  if(i<photosForGrid.length){
   const r=photosForGrid[i];
   if(r.image){
    try{
     const imgId=workbook.addImage({base64:b64ToRaw(r.image),extension:extFromDataUrl(r.image)});
     ws.addImage(imgId,PHOTO_SLOTS[i]);
    }catch(e){}
   }
   styleRange(PHOTO_CAPS[i],{bold:true,center:true,size:9,wrap:true},`FOTO ${i+1}: ${r.legenda||automaticPhotoCaption(r.servico)} – ${locationText(r)}`);
  }else{
   styleRange(PHOTO_CAPS[i],{bold:true,center:true,size:9},'');
  }
 }
 [24,39,54].forEach(r=>{ ws.getRow(r).height=26; });

 // Ocorrências
 const occHeaderRow=55;
 styleRange('A'+occHeaderRow+':G'+occHeaderRow,{},'');
 styleRange('H'+occHeaderRow+':R'+occHeaderRow,{bold:true,center:true,color:WHITE,fill:DARK,size:12},'RELATÓRIO DE OCORRÊNCIAS');
 placeLogo(occHeaderRow);
 ws.getRow(occHeaderRow).height=30;

 const tblHeadRow=occHeaderRow+1;
 styleRange('A'+tblHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'ITEM');
 styleRange('B'+tblHeadRow+':G'+tblHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'OCORRÊNCIAS');
 styleRange('H'+tblHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'SIM');
 styleRange('I'+tblHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'NÃO');
 styleRange('J'+tblHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'QUANT.');
 styleRange('K'+tblHeadRow+':M'+tblHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'SE SIM POR QUEM? SE NÃO POR QUE?');
 styleRange('N'+tblHeadRow+':R'+tblHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'QUAL EQUIPAMENTO / QUAL MATERIAL / QUAL SERVIÇO / QUAL EMPREITEIRO / QUEM CHECOU');
 ws.getRow(tblHeadRow).height=30;

 const checklistData=(current.checklist&&current.checklist.length)?current.checklist:questions.map(q=>({question:q,answer:'',qty:'',why:'',detail:''}));
 checklistData.forEach((c,idx)=>{
  const r=tblHeadRow+1+idx;
  styleRange('A'+r,{center:true},idx+1);
  styleRange('B'+r+':G'+r,{wrap:true,size:9},c.question);
  styleRange('H'+r,{center:true,bold:true},c.answer==='SIM'?'X':'');
  styleRange('I'+r,{center:true,bold:true},c.answer==='NÃO'?'X':'');
  styleRange('J'+r,{center:true},c.qty||'');
  styleRange('K'+r+':M'+r,{},c.why||'');
  styleRange('N'+r+':R'+r,{},c.detail||'');
  ws.getRow(r).height=30;
 });

 // Apontamentos
 const apRow0=tblHeadRow+1+checklistData.length+1;
 styleRange('A'+apRow0+':G'+apRow0,{},'');
 styleRange('H'+apRow0+':R'+apRow0,{bold:true,center:true,color:WHITE,fill:DARK,size:12},'RELATÓRIO DE APONTAMENTO');
 placeLogo(apRow0);
 ws.getRow(apRow0).height=30;

 const apHeadRow=apRow0+1;
 styleRange('A'+apHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'NOME');
 styleRange('B'+apHeadRow+':C'+apHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'DATA DA ORIENTAÇÃO');
 styleRange('D'+apHeadRow+':Q'+apHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'DESCRIÇÃO DA ORIENTAÇÃO');
 styleRange('R'+apHeadRow,{bold:true,center:true,color:WHITE,fill:DARK,size:9},'DATA DA RESOLUÇÃO');
 ws.getRow(apHeadRow).height=22;

 const noteEntries=current.notes||[];
 if(noteEntries.length){
  noteEntries.forEach((n,idx)=>{
   const r=apHeadRow+1+idx;
   styleRange('A'+r,{size:9},n.name||'');
   styleRange('B'+r+':C'+r,{center:true,size:9},formatDate(n.date));
   styleRange('D'+r+':Q'+r,{wrap:true,size:9},n.text||'');
   styleRange('R'+r,{center:true,size:9},formatDate(n.resolution)||'-');
   ws.getRow(r).height=40;
  });
 }else{
  styleRange('A'+(apHeadRow+1)+':C'+(apHeadRow+1),{size:9},'');
  styleRange('D'+(apHeadRow+1)+':Q'+(apHeadRow+1),{size:9},'Nenhum apontamento registrado neste diário.');
  styleRange('R'+(apHeadRow+1),{size:9},'-');
  ws.getRow(apHeadRow+1).height=22;
 }

 return workbook;
}

async function exportExcel(){
 saveHeader();
 const btns=document.querySelectorAll('button.excel');
 btns.forEach(b=>{b.disabled=true;b.dataset.oldText=b.textContent;b.textContent='Gerando...'});
 try{
  const workbook=await buildWorkbook();
  const outBuffer=await workbook.xlsx.writeBuffer();
  const blob=new Blob([outBuffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const fname='DIARIO_DE_OBRA_QUALIDADE_'+(current.header.data||today()).split('-').reverse().join('_')+'.xlsx';
  a.href=url;a.download=fname;document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),4000);
 }catch(err){
  console.error(err);
  alert('Erro ao gerar o Excel: '+(err&&err.message?err.message:'tente novamente.'));
 }finally{
  btns.forEach(b=>{b.disabled=false;b.textContent=b.dataset.oldText||'Exportar Excel'});
 }
}

init();
