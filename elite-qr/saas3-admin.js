/* ELITE QR — SaaS 3 master/admin/onboarding UI */
(function(){
'use strict';
const cfg=()=>{try{return JSON.parse(localStorage.getItem('eliteqr_supabase_config_v2')||'null')}catch{return null}};
const client=()=>{const c=cfg();return c?.url&&c?.key&&window.supabase?.createClient?window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true}}):null};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const toast=t=>window.toast?.(t);
async function session(){const sb=client();if(!sb)return null;const s=await sb.auth.getSession();return s.data.session?{sb,user:s.data.session.user}:null}
async function recover(){
 const sb=client();if(!sb)return toast('Configure o Supabase primeiro.');
 const email=prompt('Digite o e-mail para recuperação de senha:');if(!email)return;
 const c=cfg(),r=await sb.auth.resetPasswordForEmail(email.trim(),{redirectTo:location.origin+location.pathname});
 if(r.error)return toast(r.error.message);toast('Se o e-mail existir, o link de recuperação foi enviado.');
}
async function onboarding(){
 const x=await session();if(!x)return toast('Faça login para iniciar o onboarding.');
 const r=await x.sb.rpc('get_my_onboarding');const o=r.data?.[0]||{};
 document.body.insertAdjacentHTML('beforeend','<div id="onboard" class="fixed inset-0 z-[170] bg-black/90 p-4 overflow-auto"><div class="max-w-2xl mx-auto mt-8 bg-[#111827] border border-slate-700 rounded-2xl p-6"><div class="text-xs text-violet-300 font-bold">PRIMEIROS PASSOS</div><h2 class="text-3xl font-black mt-1">Configure sua empresa</h2><p class="text-slate-400 text-sm mt-2">Complete o cadastro para deixar o ambiente pronto para sua equipe.</p><div class="grid md:grid-cols-2 gap-3 mt-6"><input id="oi" class="bg-slate-900 rounded-xl p-3" placeholder="Segmento / indústria" value="'+esc(o.industry||'')+'"><input id="oc" class="bg-slate-900 rounded-xl p-3" placeholder="Cidade" value="'+esc(o.city||'')+'"><input id="op" class="bg-slate-900 rounded-xl p-3" placeholder="Telefone" value="'+esc(o.phone||'')+'"><select id="os" class="bg-slate-900 rounded-xl p-3"><option value="">Tamanho da equipe</option><option>1-3</option><option>4-15</option><option>16-50</option><option>51+</option></select><textarea id="oo" class="md:col-span-2 bg-slate-900 rounded-xl p-3" placeholder="Principal objetivo com o ELITE QR">'+esc(o.objective||'')+'</textarea></div><div class="flex gap-2 mt-5"><button onclick="window.ELITESaaS3.saveOnboarding()" class="flex-1 bg-violet-600 rounded-xl py-3 font-bold">Salvar e concluir</button><button onclick="document.getElementById('onboard').remove()" class="px-5 bg-slate-800 rounded-xl">Fechar</button></div></div></div>');
 if(o.company_size)document.getElementById('os').value=o.company_size;
}
async function saveOnboarding(){
 const x=await session();if(!x)return;
 const r=await x.sb.rpc('save_my_onboarding',{p_industry:document.getElementById('oi').value,p_city:document.getElementById('oc').value,p_phone:document.getElementById('op').value,p_company_size:document.getElementById('os').value,p_objective:document.getElementById('oo').value,p_step:5,p_completed:true});
 if(r.error)return toast(r.error.message);document.getElementById('onboard')?.remove();toast('Onboarding concluído.');
}
async function master(){
 const x=await session();if(!x)return toast('Faça login com o e-mail mestre.');
 const check=await x.sb.rpc('is_master_admin');if(check.data!==true)return toast('Acesso restrito ao administrador mestre.');
 const [o,p]=await Promise.all([x.sb.rpc('master_overview'),x.sb.rpc('master_payment_requests')]);
 if(o.error||p.error)return toast('Execute as migrations 006–008 no Supabase.');
 const rows=o.data||[], req=p.data||[];
 document.body.insertAdjacentHTML('beforeend','<div id="masterModal" class="fixed inset-0 z-[180] bg-black/95 overflow-auto p-4"><div class="max-w-7xl mx-auto bg-[#0f172a] border border-slate-700 rounded-2xl p-6 mt-5"><div class="flex justify-between"><div><div class="text-xs text-emerald-300 font-bold">ELITE QR / MASTER</div><h2 class="text-3xl font-black">Painel administrativo mestre</h2></div><button onclick="document.getElementById('masterModal').remove()">✕</button></div><div class="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">'+[['Clientes',rows.length],['Pendentes',rows.reduce((n,r)=>n+Number(r.pending_requests||0),0)],['Start',rows.filter(r=>r.plan_code==='START').length],['Pro',rows.filter(r=>r.plan_code==='PRO').length],['Industrial',rows.filter(r=>r.plan_code==='INDUSTRIAL').length]].map(a=>'<div class="bg-slate-900 rounded-xl p-4"><div class="text-xs text-slate-400">'+a[0]+'</div><b class="text-2xl">'+a[1]+'</b></div>').join('')+'</div><h3 class="font-bold text-xl mt-7">Clientes</h3><div class="overflow-auto mt-3"><table class="w-full text-sm"><thead><tr class="text-left text-slate-500"><th class="p-3">Empresa</th><th>Responsável</th><th>Plano</th><th>Usuários</th><th>Ativos</th><th>Onboarding</th><th></th></tr></thead><tbody>'+rows.map(r=>'<tr class="border-t border-slate-800"><td class="p-3 font-bold">'+esc(r.company_name)+'</td><td>'+esc(r.owner_email||'—')+'</td><td>'+esc(r.plan_code||'—')+'</td><td>'+r.users_count+'</td><td>'+r.assets_count+'</td><td>'+((r.onboarding_completed)?'✅':'⏳')+'</td><td><select onchange="window.ELITESaaS3.setPlan(\''+r.company_id+'\',this.value)" class="bg-slate-900 border border-slate-700 rounded-lg p-2"><option value="">Alterar plano</option><option>START</option><option>PRO</option><option>INDUSTRIAL</option></select></td></tr>').join('')+'</tbody></table></div><h3 class="font-bold text-xl mt-8">Pagamentos / upgrades</h3><div class="space-y-3 mt-3">'+(req.length?req.map(r=>'<div class="bg-slate-900 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><b>'+esc(r.company_name)+'</b> → <span class="text-violet-300">'+esc(r.requested_plan)+'</span><div class="text-xs text-slate-500">'+esc(r.requested_by_email||'')+' · R$ '+((r.amount_cents||0)/100).toFixed(2).replace('.',',')+' · '+esc(r.status)+'</div><div class="text-xs text-emerald-300 mt-1">PIX: '+esc(r.pix_key||'não configurado')+'</div></div><div class="flex gap-2">'+(r.status==='pending'?'<button onclick="window.ELITESaaS3.approve(\''+r.request_id+'\')" class="bg-emerald-600 rounded-lg px-4 py-2">Aprovar</button><button onclick="window.ELITESaaS3.reject(\''+r.request_id+'\')" class="bg-rose-600/20 text-rose-200 rounded-lg px-4 py-2">Rejeitar</button>':'')+'</div></div>').join(''):'<div class="text-slate-500">Nenhuma solicitação.</div>')+'</div></div></div>');
}
async function approve(id){const x=await session();if(!x)return;const r=await x.sb.rpc('master_approve_payment',{p_request_id:id,p_notes:'Pagamento PIX aprovado pelo administrador mestre'});if(r.error)return toast(r.error.message);document.getElementById('masterModal')?.remove();toast('Pagamento aprovado e plano ativado.');master()}
async function reject(id){const x=await session();if(!x)return;const r=await x.sb.rpc('master_reject_payment',{p_request_id:id,p_notes:'Solicitação rejeitada pelo administrador mestre'});if(r.error)return toast(r.error.message);document.getElementById('masterModal')?.remove();toast('Solicitação rejeitada.');master()}
async function setPlan(cid,code){if(!code)return;const x=await session();if(!x)return;const r=await x.sb.rpc('master_set_plan',{p_company_id:cid,p_plan_code:code,p_billing_cycle:'monthly'});if(r.error)return toast(r.error.message);toast('Plano atualizado.');document.getElementById('masterModal')?.remove();master()}
function boot(){
 const h=document.querySelector('header');if(!h)return setTimeout(boot,700);
 if(document.getElementById('eliteSaaS3Btn'))return;
 const add=(id,label,fn,cls)=>{const b=document.createElement('button');b.id=id;b.textContent=label;b.className='text-xs border '+cls+' px-3 py-2 rounded-lg';b.onclick=fn;h.querySelector('.flex.gap-2')?.prepend(b)};
 add('eliteOnboardBtn','🚀 Configurar',onboarding,'border-cyan-500/40 text-cyan-300');
 add('eliteRecoverBtn','🔑 Recuperar',recover,'border-slate-500/40 text-slate-300');
 add('eliteSaaS3Btn','👑 Mestre',master,'border-fuchsia-500/40 text-fuchsia-300');
}
window.ELITESaaS3={master,approve,reject,setPlan,onboarding,saveOnboarding,recover};setTimeout(boot,1800);
})();