/* ELITE QR — runtime hardening layer
   Keeps the static MVP self-healing across GitHub Pages, Cloudflare Pages and local hosting.
*/
(function(){
'use strict';

const loadScript=(src)=>new Promise((resolve,reject)=>{
  if([...document.scripts].some(s=>s.src===new URL(src,location.href).href)){resolve();return}
  const s=document.createElement('script');
  s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Falha ao carregar '+src));
  document.head.appendChild(s);
});

async function bootDependencies(){
  const local='./';
  try{
    if(!window.supabase?.createClient) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    await loadScript(local+'supabase-integration.js');
    await loadScript(local+'saas-commercial.js');
    await loadScript(local+'saas3-admin.js');
    patchCommercialPix();
  }catch(e){
    console.warn('[ELITE QR] optional cloud modules:',e);
  }
}

async function patchCommercialPix(){
  if(!window.ELITESaaS?.requestPlan)return;
  const original=window.ELITESaaS.requestPlan;
  window.ELITESaaS.requestPlan=async function(code){
    const cfg=JSON.parse(localStorage.getItem('eliteqr_supabase_config_v2')||'null');
    if(!cfg?.url||!cfg?.key||!window.supabase?.createClient)return window.toast?.('Faça login para solicitar um plano.');
    const sb=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true}});
    const session=await sb.auth.getSession();
    if(!session.data.session)return window.toast?.('Faça login para solicitar um plano.');
    const p=await sb.from('saas_plans').select('id,name,monthly_price_cents').eq('code',code).single();
    if(p.error)return window.toast?.('Plano não encontrado.');
    const seller=await sb.rpc('get_product_pix_settings');
    const s=seller.data?.[0]||{};
    const val=(p.data.monthly_price_cents||0)/100;
    document.getElementById('pixModal')?.remove();
    document.body.insertAdjacentHTML('beforeend','<div id="pixModal" class="fixed inset-0 z-[150] bg-black/90 p-4 flex items-center justify-center"><div class="max-w-lg w-full bg-[#111827] border border-emerald-500/30 rounded-2xl p-6"><div class="text-xs text-emerald-300 font-bold">PAGAMENTO MANUAL / PIX</div><h2 class="text-2xl font-black mt-2">Upgrade para '+escSafe(p.data.name)+'</h2><div class="mt-5 bg-slate-900 rounded-xl p-4"><div class="text-xs text-slate-400">Valor mensal</div><div class="text-3xl font-black">R$ '+val.toFixed(2).replace('.',',')+'</div><div class="text-xs text-slate-400 mt-4">Chave PIX para pagamento</div><div class="font-mono text-emerald-300 break-all mt-1">'+escSafe(s.pix_key||'PIX ainda não configurado.')+'</div><div class="text-xs text-slate-400 mt-3">'+escSafe(s.pix_holder||'')+(s.pix_bank?' · '+escSafe(s.pix_bank):'')+'</div><div class="text-xs text-slate-500 mt-3">'+escSafe(s.pix_instructions||'Após o pagamento, registre a solicitação para análise do administrador.')+'</div></div><div class="flex gap-2 mt-5"><button onclick="window.ELITESaaS.confirmPlan(\''+code+'\')" class="flex-1 bg-emerald-600 rounded-xl py-3 font-bold">Registrar solicitação</button><button onclick="document.getElementById('pixModal').remove()" class="px-5 bg-slate-800 rounded-xl">Fechar</button></div></div></div>');
  };
}
const escSafe=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const notify=m=>typeof window.toast==='function'?window.toast(m):console.info('[ELITE QR]',m);
const uidSafe=()=>crypto?.randomUUID?crypto.randomUUID():'id-'+Date.now()+'-'+Math.random().toString(36).slice(2);

function downloadFile(name,text,type){
  const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function csvCell(v){return '"'+String(v??'').replaceAll('"','""')+'"'}
function toCSV(rows){return '\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')}

function exportDataset(type){
  const rows=Array.isArray(db[type])?db[type]:[];
  if(!rows.length)return notify('Não há dados para exportar.');
  const keys=[...new Set(rows.flatMap(x=>Object.keys(x)))];
  downloadFile('elite-qr-'+type+'.csv',toCSV([keys,...rows.map(x=>keys.map(k=>x[k]))]),'text/csv;charset=utf-8');
  notify('CSV exportado.');
}
function exportFullBackup(){
  downloadFile('elite-qr-backup.json',JSON.stringify({app:'ELITE QR',version:'2.1',exportedAt:new Date().toISOString(),data:db},null,2),'application/json');
  notify('Backup completo exportado.');
}
function parseCSV(text){
  const out=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;continue}
    if(ch==='"'){quoted=!quoted;continue}
    if((ch===';'||ch===',')&&!quoted){row.push(cell);cell='';continue}
    if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&next==='\n')i++;
      row.push(cell);cell='';
      if(row.some(v=>String(v).trim()!==''))out.push(row);
      row=[];continue;
    }
    cell+=ch;
  }
  if(cell!==''||row.length){row.push(cell);if(row.some(v=>String(v).trim()!==''))out.push(row)}
  return out;
}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={
 tag:['tag','codigo','codigoequipamento','assettag'],
 name:['nome','name','equipamento','nomeequipamento'],
 manufacturer:['fabricante','manufacturer'],
 model:['modelo','model'],
 serial:['serie','serial','numerodeserie','numeroSerie'],
 location:['local','localizacao','location'],
 team:['equipe','team'],
 criticality:['criticidade','criticality'],
 status:['status']
};
function importAssetsCSV(text){
  const rows=parseCSV(text);
  if(rows.length<2)throw new Error('CSV sem registros.');
  const headers=rows[0].map(norm);
  const idx=k=>headers.findIndex(h=>(aliases[k]||[k]).includes(h));
  const value=(r,k)=>{const i=idx(k);return i>=0?String(r[i]??'').trim():''};
  const valid=[],errors=[];
  rows.slice(1).forEach((r,n)=>{
    const tag=value(r,'tag'),name=value(r,'name');
    if(!tag||!name){errors.push('Linha '+(n+2)+': TAG e Nome são obrigatórios.');return}
    valid.push({id:uidSafe(),tag,name,manufacturer:value(r,'manufacturer'),model:value(r,'model'),serial:value(r,'serial'),location:value(r,'location')||'Não informado',team:value(r,'team')||'Não informado',criticality:value(r,'criticality')||'Média',status:value(r,'status')||'Operacional',qr:tag});
  });
  return {valid,errors};
}
function mergeRecords(target,incoming,key){
  let inserted=0,updated=0;
  incoming.forEach(item=>{
    const i=target.findIndex(x=>key==='tag'?x.tag===item.tag:x.id===item.id);
    if(i<0){target.push(item);inserted++}
    else{target[i]={...target[i],...item,id:target[i].id};updated++}
  });
  return {inserted,updated};
}
function importFile(kind){
  const input=document.createElement('input');
  input.type='file';input.accept=kind==='csv'?'.csv,text/csv':'.json,application/json';
  input.onchange=()=>{
    const file=input.files?.[0];if(!file)return;
    if(file.size>5*1024*1024)return notify('Arquivo acima do limite de 5 MB.');
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        if(kind==='csv'){
          const r=importAssetsCSV(String(reader.result));
          if(!r.valid.length)return notify('Nenhum equipamento válido encontrado.');
          const message='Válidos: '+r.valid.length+' · erros: '+r.errors.length;
          if(!confirm('Prévia da importação\n'+message+'\n\nConfirmar gravação?'))return;
          const m=mergeRecords(db.assets,r.valid,'tag');save();render();notify(m.inserted+' inseridos · '+m.updated+' atualizados.');
        }else{
          const parsed=JSON.parse(String(reader.result)),data=parsed.data||parsed;
          if(!data||typeof data!=='object')throw new Error('Backup inválido.');
          if(!confirm('Importar backup e mesclar dados existentes?'))return;
          let inserted=0,updated=0;
          for(const type of ['assets','reports','orders','inspections']){
            if(Array.isArray(data[type])){
              const m=mergeRecords(db[type],data[type],type==='assets'?'tag':'id');
              inserted+=m.inserted;updated+=m.updated;
            }
          }
          save();render();notify(inserted+' inseridos · '+updated+' atualizados.');
        }
      }catch(e){notify('Importação recusada: '+e.message)}
    };
    reader.readAsText(file,'UTF-8');
  };
  input.click();
}

function dataPage(){
  const cards=[['Equipamentos','assets'],['Relatos','reports'],['Ordens','orders'],['Inspeções','inspections']];
  return shell(
    '<div class="mb-6"><div class="text-xs uppercase tracking-widest text-violet-600 font-bold">Central de dados</div><h2 class="text-3xl font-black mt-1">Importar e exportar</h2><p class="text-slate-500 mt-2">Validação, merge não destrutivo e backup completo.</p></div>'+
    '<div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">'+cards.map(([label,type])=>
      '<div class="elite-data-card"><div class="text-sm text-slate-500">'+label+'</div><div class="text-3xl font-black mt-2">'+(db[type]?.length||0)+'</div><button onclick="window.ELITERepair.exportDataset(\''+type+'\')" class="mt-4 w-full bg-slate-100 rounded-xl py-2.5 font-semibold">Exportar CSV</button></div>'
    ).join('')+'</div>'+
    '<div class="grid lg:grid-cols-2 gap-5 mt-5">'+
    '<div class="elite-data-card"><h3 class="text-lg font-bold">Importar equipamentos</h3><p class="text-sm text-slate-500 mt-1">CSV até 5 MB.</p><button onclick="window.ELITERepair.importFile(\'csv\')" class="mt-4 bg-violet-600 text-white rounded-xl px-5 py-3 font-bold">Selecionar CSV</button></div>'+
    '<div class="elite-data-card"><h3 class="text-lg font-bold">Backup completo</h3><p class="text-sm text-slate-500 mt-1">JSON com merge por TAG/ID.</p><div class="flex gap-2 mt-4"><button onclick="window.ELITERepair.exportFullBackup()" class="bg-slate-900 text-white rounded-xl px-4 py-3">Exportar</button><button onclick="window.ELITERepair.importFile(\'json\')" class="bg-violet-600 text-white rounded-xl px-4 py-3">Importar</button></div></div></div>',
    'Dados'
  );
}

function decorate(){
  const h=document.querySelector('header .flex.gap-2');if(!h)return;
  if(!h.querySelector('[data-data-nav]')){
    const b=document.createElement('button');
    b.dataset.dataNav='1';b.textContent='Dados';
    b.className='text-xs border border-violet-200 text-violet-700 bg-violet-50 px-3 py-2 rounded-lg font-semibold';
    b.onclick=()=>{page='data';selected=null;render()};
    h.prepend(b);
  }
}

function install(){
  const originalSeed=window.seed;
  window.seed=function(){
    if(typeof demo==='undefined')return;
    db=JSON.parse(JSON.stringify({...demo,demo:true}));
    save();render();notify('Dados demonstrativos carregados.');
  };
  const originalRender=window.render;
  if(typeof originalRender==='function'){
    window.render=function(){
      if(page==='data'){
        document.getElementById('app').innerHTML=dataPage();decorate();return;
      }
      originalRender();decorate();
    };
  }
  window.ELITERepair={exportDataset,exportFullBackup,importFile,parseCSV,bootDependencies,originalSeed};
  decorate();
}

const style=document.createElement('style');
style.textContent='.elite-data-card{background:#fff;border:1px solid #e6eaf0;border-radius:18px;padding:20px;box-shadow:0 8px 28px rgba(15,23,42,.05)}';
document.head.appendChild(style);

install();
window.addEventListener('load',()=>{if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});});
bootDependencies();
})();
