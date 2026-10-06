/* ELITE QR — Commercial SaaS UI */
(function(){'use strict';
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
async function cx(){const c=JSON.parse(localStorage.getItem('eliteqr_supabase_config_v2')||'null');if(!c?.url||!c?.key||!window.supabase?.createClient)return null;const sb=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true}});const ss=await sb.auth.getSession();if(!ss.data.session)return null;return {sb,user:ss.data.session.user}}
async function ent(){const x=await cx();if(!x)return null;await x.sb.rpc('ensure_my_subscription');const r=await x.sb.rpc('company_entitlements');if(r.error)throw r.error;return r.data?.[0]||null}
function bar(u,m){const p=m?Math.min(100,Math.round(u/m*100)):0;return '<div class="h-2 bg-slate-800 rounded-full overflow-hidden"><div class="h-full '+(p>=90?'bg-rose-500':p>=70?'bg-amber-500':'bg-violet-500')+'" style="width:'+p+'%"></div></div><div class="text-[11px] text-slate-500 mt-1">'+u+' / '+m+'</div>'}
async function open(){let e=null;try{e=await ent()}catch(err){return window.toast?.('Execute a migration 006 no Supabase antes de usar o SaaS.')}
const plans=[['START','Start','Grátis','3 usuários · 50 equipamentos'],['PRO','Pro','R$ 149/mês','15 usuários · 500 equipamentos'],['INDUSTRIAL','Industrial','R$ 499/mês','50 usuários · 5.000 equipamentos']];
const cards=plans.map(p=>'<div class="border '+(e?.plan_code===p[0]?'border-violet-500 bg-violet-500/10':'border-slate-700')+' rounded-2xl p-5"><div class="flex justify-between"><h3 class="font-black text-lg">'+p[1]+'</h3>'+(e?.plan_code===p[0]?'<span class="text-xs text-emerald-300">ATUAL</span>':'')+'</div><div class="text-2xl font-black mt-3">'+p[2]+'</div><div class="text-xs text-slate-300 mt-4">'+p[3]+'</div><button onclick="window.ELITESaaS.requestPlan(\''+p[0]+'\')" class="w-full mt-4 '+(e?.plan_code===p[0]?'bg-slate-800':'bg-violet-600')+' rounded-xl py-3">'+(e?.plan_code===p[0]?'Plano atual':'Solicitar upgrade')+'</button></div>').join('');
const usage=e?'<div class="grid md:grid-cols-2 gap-4 mt-6"><div class="bg-slate-900 rounded-xl p-4"><b>Usuários</b>'+bar(e.users_used,e.max_users)+'</div><div class="bg-slate-900 rounded-xl p-4"><b>Equipamentos</b>'+bar(e.assets_used,e.max_assets)+'</div><div class="bg-slate-900 rounded-xl p-4"><b>Relatos no mês</b>'+bar(e.reports_month_used,e.max_reports_month)+'</div><div class="bg-slate-900 rounded-xl p-4"><b>Inspeções no mês</b>'+bar(e.inspections_month_used,e.max_inspections_month)+'</div></div>':'<div class="p-4 bg-slate-900 rounded-xl mt-5">Conecte uma conta Supabase para consultar seu plano.</div>';
document.body.insertAdjacentHTML('beforeend','<div id="saasModal" class="fixed inset-0 z-[130] bg-black/80 overflow-auto p-4"><div class="max-w-5xl mx-auto bg-[#111827] border border-slate-700 rounded-2xl p-6 mt-8"><div class="flex justify-between"><div><div class="text-xs text-violet-300 font-bold">ELITE QR / SAAS</div><h2 class="text-3xl font-black">Plano e utilização</h2></div><button onclick="document.getElementById(\'saasModal\').remove()">✕</button></div>'+usage+'<div class="grid md:grid-cols-3 gap-4 mt-6">'+cards+'</div><div class="text-xs text-slate-500 mt-5">Cobrança online será conectada ao provedor de pagamentos. Chaves secretas ficam somente no backend.</div></div></div>')}
async function requestPlan(code){
 const x=await cx();if(!x)return window.toast?.('Faça login para solicitar um plano.');
 const e=await ent(); if(e?.plan_code===code)return window.toast?.('Este já é seu plano atual.');
 const plan=await x.sb.from('saas_plans').select('id,name,monthly_price_cents,annual_price_cents').eq('code',code).single();
 if(plan.error)return window.toast?.('Plano não encontrado.');
 const b=await x.sb.rpc('get_my_billing_settings');
 const bs=b.data?.[0]||{};
 const pix=bs.pix_key||'PIX ainda não configurado pelo administrador mestre.';
 const val=(plan.data.monthly_price_cents||0)/100;
 document.body.insertAdjacentHTML('beforeend','<div id="pixModal" class="fixed inset-0 z-[150] bg-black/90 p-4 flex items-center justify-center"><div class="max-w-lg w-full bg-[#111827] border border-emerald-500/30 rounded-2xl p-6"><div class="text-xs text-emerald-300 font-bold">PAGAMENTO MANUAL / PIX</div><h2 class="text-2xl font-black mt-2">Upgrade para '+esc(plan.data.name)+'</h2><div class="mt-5 bg-slate-900 rounded-xl p-4"><div class="text-xs text-slate-400">Valor mensal</div><div class="text-3xl font-black">R$ '+val.toFixed(2).replace('.',',')+'</div><div class="text-xs text-slate-400 mt-4">Chave PIX</div><div class="font-mono text-emerald-300 break-all mt-1">'+esc(pix)+'</div></div><div class="flex gap-2 mt-5"><button onclick="window.ELITESaaS.confirmPlan(\''+code+'\')" class="flex-1 bg-emerald-600 rounded-xl py-3 font-bold">Registrar solicitação</button><button onclick="document.getElementById(\'pixModal\').remove()" class="px-5 bg-slate-800 rounded-xl">Fechar</button></div></div></div>');
}
async function confirmPlan(code){
 const x=await cx();if(!x)return;
 const p=await x.sb.from('saas_plans').select('id').eq('code',code).single();
 if(p.error)return window.toast?.('Plano inválido.');
 const {error}=await x.sb.from('plan_change_requests').insert({company_id:(await x.sb.rpc('my_company')).data?.[0]?.id,requested_plan_id:p.data.id,billing_cycle:'monthly',payment_method:'pix',requested_by:x.user.id,status:'pending'});
 if(error)return window.toast?.('Não foi possível registrar: '+error.message);
 document.getElementById('pixModal')?.remove(); window.toast?.('Solicitação registrada. Após o pagamento, a ativação será feita pelo administrador.');
}
async function pixSettings(){
 const x=await cx();if(!x)return window.toast?.('Faça login como administrador.');
 const b=await x.sb.rpc('get_my_billing_settings'); const s=b.data?.[0]||{};
 document.body.insertAdjacentHTML('beforeend','<div id="pixCfg" class="fixed inset-0 z-[160] bg-black/90 p-4 flex items-center justify-center"><div class="max-w-lg w-full bg-[#111827] border border-slate-700 rounded-2xl p-6"><h2 class="text-2xl font-black">Configurar PIX</h2><p class="text-xs text-slate-400 mt-2">Digite manualmente sua chave. Ela ficará no banco da empresa, não no código-fonte.</p><input id="pk" class="w-full mt-4 bg-slate-900 rounded-xl p-3" placeholder="Chave PIX" value="'+esc(s.pix_key||'')+'"><input id="ph" class="w-full mt-2 bg-slate-900 rounded-xl p-3" placeholder="Titular" value="'+esc(s.pix_holder||'')+'"><input id="pb" class="w-full mt-2 bg-slate-900 rounded-xl p-3" placeholder="Banco" value="'+esc(s.pix_bank||'')+'"><textarea id="pi" class="w-full mt-2 bg-slate-900 rounded-xl p-3" placeholder="Instruções">'+esc(s.pix_instructions||'')+'</textarea><div class="flex gap-2 mt-4"><button onclick="window.ELITESaaS.savePix()" class="flex-1 bg-violet-600 rounded-xl py-3 font-bold">Salvar PIX</button><button onclick="document.getElementById(\'pixCfg\').remove()" class="px-5 bg-slate-800 rounded-xl">Fechar</button></div></div></div>');
}
async function savePix(){
 const x=await cx();if(!x)return;
 const r=await x.sb.rpc('save_my_pix_settings',{p_pix_key:document.getElementById('pk').value,p_pix_holder:document.getElementById('ph').value,p_pix_bank:document.getElementById('pb').value,p_pix_instructions:document.getElementById('pi').value});
 if(r.error)return window.toast?.(r.error.message); document.getElementById('pixCfg')?.remove(); window.toast?.('Chave PIX salva.');
}
function boot(){const h=document.querySelector('header');if(!h)return setTimeout(boot,700);if(document.getElementById('eliteSaaSBtn'))return;const b=document.createElement('button');b.id='eliteSaaSBtn';b.textContent='💳 Plano';b.className='text-xs border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded-lg';b.onclick=open;const p=document.createElement('button');p.id='elitePixBtn';p.textContent='⚙ PIX';p.className='text-xs border border-amber-500/40 text-amber-300 px-3 py-2 rounded-lg';p.onclick=pixSettings;h.querySelector('.flex.gap-2')?.prepend(p);h.querySelector('.flex.gap-2')?.prepend(b)}
window.ELITESaaS={open,requestPlan,confirmPlan,pixSettings,savePix};setTimeout(boot,1200);})();