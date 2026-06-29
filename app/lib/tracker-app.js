// ============================================================
// Deep Waters RTC — Coaching Ledger
// Supabase-backed app, mounted imperatively into a container.
// All DOM + CSS is scoped under .dwroot so it never touches the
// Shopify storefront. Data lives in Supabase (Postgres + RLS).
// ============================================================
import {createClient} from '@supabase/supabase-js';

const palette=[['#ffb15c','#e8783c'],['#54b6ff','#2f7dd6'],['#5fe3e0','#1f9b96'],['#5fe0a0','#27a86d'],['#c79bff','#7d52d6'],['#ff8fa3','#e0566f']];

/* ---------------- icons ---------------- */
function ic(n){const p={
 dash:'<path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/>',
 sess:'<path d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.9"/>',
 ath:'<path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
 pay:'<path d="M3 7h18v10H3zM3 11h18M7 15h3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
 plus:'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 clock:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
 dollar:'<path d="M12 2v20M16 6.5C16 4.6 14.2 3.5 12 3.5S8 4.6 8 6.5 9.8 9.5 12 9.5s4 1.1 4 3-1.8 3-4 3-4-1.1-4-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
 alert:'<path d="M12 3 2 20h20L12 3Zm0 6v5m0 3h.01" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
 x:'<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 edit:'<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
 trash:'<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
 check:'<path d="M5 12l4 4L19 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
 search:'<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
 download:'<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
 out:'<path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
 wave:'<path d="M2 16c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2" stroke="#54b6ff" stroke-width="1.8" stroke-linecap="round"/><path d="M2 11c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2" stroke="#ffb15c" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>'
 };return '<svg viewBox="0 0 24 24" fill="currentColor">'+(p[n]||'')+'</svg>';}

/* ---------------- helpers ---------------- */
const money=n=>'$'+(Math.round(n*100)/100).toLocaleString('en-US',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2});
const initials=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const MO=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function fdate(t){const d=new Date(t);return MO[d.getMonth()]+' '+d.getDate()}
function ftime(t){const d=new Date(t);let h=d.getHours(),m=d.getMinutes();const ap=h>=12?'PM':'AM';h=h%12||12;return h+(m?':'+String(m).padStart(2,'0'):'')+ap}
function hrs(m){return Math.round(m/6)/10}
function sameMonth(t){const d=new Date(t),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()}
function startOfWeek(){const n=new Date();const day=(n.getDay()+6)%7;n.setHours(0,0,0,0);n.setDate(n.getDate()-day);return n.getTime()}
function escapeHtml(s){return (s||'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}
function escapeAttr(s){return (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;')}

/* ============================================================ */
export function mount(root,{SUPABASE_URL,SUPABASE_ANON_KEY}){
  root.classList.add('dwroot');
  root.innerHTML='<style>'+CSS+'</style>'+SHELL;
  const q=s=>root.querySelector(s), qa=s=>[...root.querySelectorAll(s)];

  if(!SUPABASE_URL||!SUPABASE_ANON_KEY){
    q('#login').innerHTML=loginCard('<div class="lerr">⚙️ Not configured yet.<br><span>Add <code>PUBLIC_SUPABASE_URL</code> and <code>PUBLIC_SUPABASE_ANON_KEY</code> to your environment variables, then reload.</span></div>');
    return ()=>{};
  }

  const sb=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  let db={clients:[],sessions:[]}, user=null, cur='dash';

  /* ---------- data ---------- */
  async function reload(){
    const [a,s,l]=await Promise.all([
      sb.from('athletes').select('*').order('name'),
      sb.from('sessions').select('*').order('date',{ascending:false}),
      sb.from('session_athletes').select('*')
    ]);
    if(a.error||s.error||l.error){toast('Load error: '+((a.error||s.error||l.error).message));return}
    db.clients=(a.data||[]).map(r=>({id:r.id,name:r.name,type:r.level,rate:+r.rate,phone:r.phone||'',email:r.email||'',guardian:r.guardian||'',notes:r.notes||'',active:r.active,color:r.color||0,created:new Date(r.created_at).getTime()}));
    const by={};(l.data||[]).forEach(x=>{(by[x.session_id]=by[x.session_id]||[]).push(x.athlete_id)});
    db.sessions=(s.data||[]).map(r=>({id:r.id,date:new Date(r.date).getTime(),mins:r.mins,kind:r.kind,focus:r.focus||'',amount:+r.amount,paid:r.paid,paidDate:r.paid_date?new Date(r.paid_date).getTime():0,method:r.method||'',notes:r.notes||'',athletes:by[r.id]||[]}));
  }
  const clientById=id=>db.clients.find(c=>c.id===id);
  function clientBalance(cid){let b=0;db.sessions.forEach(s=>{if(!s.paid&&s.athletes.includes(cid))b+=s.amount/s.athletes.length});return b}
  function clientStats(cid){let sessions=0,mins=0,paid=0,due=0,last=0;db.sessions.forEach(s=>{if(s.athletes.includes(cid)){sessions++;mins+=s.mins;const sh=s.amount/s.athletes.length;if(s.paid)paid+=sh;else due+=sh;if(s.date>last)last=s.date}});return{sessions,mins,paid,due,last}}
  function avatar(c,cls=''){const p=palette[(c?c.color:0)%palette.length];return '<div class="av '+cls+'" style="background:linear-gradient(140deg,'+p[0]+','+p[1]+')">'+(c?initials(c.name):'?')+'</div>'}
  function avatarInline(cs){return '<span style="display:inline-flex">'+cs.slice(0,3).map((c,i)=>{const p=palette[c.color%palette.length];return '<span style="width:18px;height:18px;border-radius:6px;margin-left:'+(i?-6:0)+'px;border:1.5px solid #0a0f1c;display:inline-grid;place-items:center;font-size:8.5px;font-weight:800;color:#08101f;background:linear-gradient(140deg,'+p[0]+','+p[1]+')">'+initials(c.name)[0]+'</span>'}).join('')+'</span>'}

  /* ---------- router ---------- */
  function go(v){cur=v;qa('#nav button,#mnav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));render();root.scrollTop=0;window.scrollTo&&window.scrollTo(0,0)}
  function render(){
    const el=q('#view');
    if(cur==='dash')el.innerHTML=vDash();
    else if(cur==='sessions')el.innerHTML=vSessions();
    else if(cur==='athletes')el.innerHTML=vAthletes();
    else if(cur==='payments')el.innerHTML=vPayments();
    bind();
  }

  /* ---------- dashboard ---------- */
  function vDash(){
    const monthSess=db.sessions.filter(s=>sameMonth(s.date));
    const rev=monthSess.filter(s=>s.paid).reduce((a,s)=>a+s.amount,0);
    const monthMins=monthSess.reduce((a,s)=>a+s.mins,0);
    const outstanding=db.sessions.filter(s=>!s.paid).reduce((a,s)=>a+s.amount,0);
    const dueCount=db.sessions.filter(s=>!s.paid).length;
    const activeC=db.clients.filter(c=>c.active).length;
    const weekCount=db.sessions.filter(s=>s.date>=startOfWeek()).length;
    const billed=rev+outstanding, pct=billed?Math.round(rev/billed*100):100;
    const recent=[...db.sessions].sort((a,b)=>b.date-a.date).slice(0,6);
    const topDue=db.clients.map(c=>({c,b:clientBalance(c.id)})).filter(x=>x.b>0).sort((a,b)=>b.b-a.b).slice(0,4);
    if(!db.clients.length&&!db.sessions.length)return emptyDash();
    return `
    <div class="topbar">
      <div><h1>Welcome back${user&&user.email?', '+user.email.split('@')[0]:''}</h1><div class="ph">Your coaching ledger for ${new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})}.</div></div>
      <button class="btn" data-act="newsess">${ic('plus')}Log session</button>
    </div>
    <div class="stats">
      <div class="card stat"><div class="lbl"><span class="ic i-green">${ic('dollar')}</span>Collected · month</div><div class="v">${money(rev)}</div><div class="d">${monthSess.filter(s=>s.paid).length} paid sessions</div></div>
      <div class="card stat"><div class="lbl"><span class="ic i-red">${ic('alert')}</span>Outstanding</div><div class="v">${money(outstanding)}</div><div class="d">${dueCount} unpaid session${dueCount!==1?'s':''}</div></div>
      <div class="card stat"><div class="lbl"><span class="ic i-blue">${ic('clock')}</span>Hours · month</div><div class="v">${hrs(monthMins)}</div><div class="d">${monthSess.length} sessions logged</div></div>
      <div class="card stat"><div class="lbl"><span class="ic i-amber">${ic('ath')}</span>Active athletes</div><div class="v">${activeC}</div><div class="d">${weekCount} session${weekCount!==1?'s':''} this week</div></div>
    </div>
    <div class="grid2">
      <div class="card">
        <div class="sec" style="padding:0 18px;margin:18px 0 4px"><h2>Recent sessions</h2><a class="hint" style="cursor:pointer" data-go="sessions">View all →</a></div>
        <div class="list">${recent.map(rowSession).join('')||emptyState('No sessions yet')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="card mini"><h3>Collection rate</h3>
          <div style="font-size:12px;color:var(--faint)">${money(rev)} of ${money(billed)} billed this month</div>
          <div class="pbar" style="margin-top:14px"><i style="width:${pct}%"></i></div>
          <div style="display:flex;justify-content:space-between;margin-top:9px;font-size:12px"><span style="color:var(--green);font-weight:700">${pct}% collected</span><span style="color:var(--red)">${money(outstanding)} open</span></div>
        </div>
        <div class="card mini"><h3 style="margin-bottom:8px">Who owes you</h3>
          ${topDue.length?topDue.map(x=>`<div class="sm-row">${avatar(x.c)}<div style="flex:1;min-width:0"><div class="nm-main" style="font-size:13.5px">${x.c.name}</div><div class="nm-sub">${clientStats(x.c.id).sessions} sessions</div></div><div class="amt" style="color:var(--red)">${money(x.b)}</div></div>`).join(''):'<div style="padding:18px 0;color:var(--faint);font-size:13px">All clear — everyone\'s paid up. 🌊</div>'}
        </div>
      </div>
    </div>`;
  }
  function emptyDash(){return `
    <div class="topbar"><div><h1>Welcome to your ledger</h1><div class="ph">Let's get your first athletes and sessions in.</div></div></div>
    <div class="card" style="padding:46px 28px;text-align:center">
      <div style="font-size:15px;color:var(--muted);max-width:440px;margin:0 auto 22px;line-height:1.6">No data yet. Add your first athlete, then log a session — or load a sample set to explore the app.</div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button class="btn" data-act="newcli">${ic('plus')}Add athlete</button>
        <button class="btn ghost" data-act="seed">${ic('download')}Load sample data</button>
      </div>
    </div>`;}

  /* ---------- sessions ---------- */
  function rowSession(s){
    const cs=s.athletes.map(clientById).filter(Boolean);
    const names=cs.map(c=>c.name).join(', ')||'—';
    return `<div class="row sess-row" data-sess="${s.id}">
      <div class="c-when datechip"><div class="mo">${MO[new Date(s.date).getMonth()]}</div><div class="dy">${new Date(s.date).getDate()}</div></div>
      <div class="c-main" style="min-width:0">
        <div class="nm-main" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(s.focus)||'Training session'}</div>
        <div class="nm-sub">${avatarInline(cs)}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(names)}</span></div>
      </div>
      <div class="c-type"><span class="tag ${s.kind==='group'?'group':'priv'}"><span class="dot"></span>${s.kind==='group'?'Group · '+cs.length:'1-on-1'}</span></div>
      <div class="c-rate"><div class="nm-sub" style="margin:0">${ftime(s.date)} · ${hrs(s.mins)}h</div></div>
      <div class="c-pay"><span class="tag ${s.paid?'paid':'due'}">${s.paid?ic('check'):''}${s.paid?'Paid':'Due'}</span></div>
      <div class="c-acts rowacts"><div class="amt">${money(s.amount)}</div></div>
    </div>`;
  }
  function vSessions(){
    const list=[...db.sessions].sort((a,b)=>b.date-a.date);
    const totalH=hrs(db.sessions.reduce((a,s)=>a+s.mins,0));
    const totalRev=db.sessions.filter(s=>s.paid).reduce((a,s)=>a+s.amount,0);
    return `
    <div class="topbar"><div><h1>Sessions</h1><div class="ph">${db.sessions.length} sessions · ${totalH} hours · ${money(totalRev)} collected all-time</div></div>
      <button class="btn" data-act="newsess">${ic('plus')}Log session</button></div>
    <div class="card"><div class="scrollwrap">
      <div class="colhead row sess-row"><div></div><div>Session</div><div>Type</div><div>Time</div><div>Status</div><div style="text-align:right">Amount</div></div>
      <div class="list">${list.map(rowSession).join('')||emptyState('No sessions logged yet','Tap “Log session” to add your first one.')}</div>
    </div></div>`;
  }

  /* ---------- athletes ---------- */
  function rowClient(c){
    const st=clientStats(c.id);const bal=st.due;
    return `<div class="row cli-row" data-cli="${c.id}" data-name="${escapeAttr(c.name.toLowerCase())}">
      ${avatar(c)}
      <div class="c-main" style="min-width:0">
        <div class="nm-main">${escapeHtml(c.name)} ${c.active?'':'<span class="tag inact" style="margin-left:4px">Inactive</span>'}</div>
        <div class="nm-sub"><span class="tag ${c.active?'act':'inact'}" style="padding:2px 7px"><span class="dot"></span>${c.type}</span><span>${st.sessions} sessions · ${hrs(st.mins)}h</span></div>
      </div>
      <div class="c-rate"><div class="nm-sub" style="margin:0">${money(c.rate)}/hr</div></div>
      <div class="c-bal">${bal>0?'<span class="amt" style="color:var(--red)">'+money(bal)+'</span>':'<span class="tag paid">Clear</span>'}</div>
      <div class="c-acts rowacts"><button class="ix" data-edit-cli="${c.id}">${ic('edit')}</button></div>
    </div>`;
  }
  function vAthletes(){
    const cs=[...db.clients].sort((a,b)=>(b.active-a.active)||a.name.localeCompare(b.name));
    return `
    <div class="topbar"><div><h1>Athletes</h1><div class="ph">${db.clients.filter(c=>c.active).length} active · ${db.clients.length} total</div></div>
      <div style="display:flex;gap:10px;align-items:center"><div class="search"><input id="csearch" placeholder="Search athletes…">${ic('search')}</div>
      <button class="btn" data-act="newcli">${ic('plus')}Add</button></div></div>
    <div class="card"><div class="scrollwrap">
      <div class="colhead row cli-row"><div></div><div>Athlete</div><div>Rate</div><div>Balance</div><div></div></div>
      <div class="list" id="clilist">${cs.map(rowClient).join('')||emptyState('No athletes yet','Add your first athlete to get started.')}</div>
    </div></div>`;
  }

  /* ---------- payments ---------- */
  function rowPayDue(s){const cs=s.athletes.map(clientById).filter(Boolean);
    return `<div class="row pay-row" data-sess="${s.id}">${avatar(cs[0])}
      <div class="c-main" style="min-width:0"><div class="nm-main">${escapeHtml(cs.map(c=>c.name).join(', ')||'—')}</div>
      <div class="nm-sub">${fdate(s.date)} · ${escapeHtml(s.focus)||'Session'} · <span class="tag ${s.kind==='group'?'group':'priv'}" style="padding:2px 7px">${s.kind==='group'?'Group':'1-on-1'}</span></div></div>
      <div class="c-last amt" style="color:var(--red)">${money(s.amount)}</div>
      <div class="c-acts rowacts" style="gap:8px;align-items:center"><button class="btn sm" data-paid="${s.id}">${ic('check')}Mark paid</button></div></div>`;}
  function rowPaid(s){const cs=s.athletes.map(clientById).filter(Boolean);
    return `<div class="row pay-row">${avatar(cs[0])}
      <div class="c-main" style="min-width:0"><div class="nm-main">${escapeHtml(cs.map(c=>c.name).join(', ')||'—')}</div>
      <div class="nm-sub">${fdate(s.paidDate||s.date)} · ${escapeHtml(s.method)||'Paid'}</div></div>
      <div class="c-last"><span class="tag paid">${ic('check')}Paid</span></div>
      <div class="c-acts rowacts"><div class="amt" style="color:var(--green)">${money(s.amount)}</div></div></div>`;}
  function vPayments(){
    const unpaid=[...db.sessions].filter(s=>!s.paid).sort((a,b)=>a.date-b.date);
    const paid=[...db.sessions].filter(s=>s.paid).sort((a,b)=>b.paidDate-a.paidDate).slice(0,8);
    const out=unpaid.reduce((a,s)=>a+s.amount,0);
    const monthIn=db.sessions.filter(s=>s.paid&&sameMonth(s.paidDate)).reduce((a,s)=>a+s.amount,0);
    return `
    <div class="topbar"><div><h1>Payments</h1><div class="ph">${money(out)} outstanding across ${unpaid.length} session${unpaid.length!==1?'s':''}</div></div></div>
    <div class="stats" style="grid-template-columns:repeat(3,1fr)">
      <div class="card stat"><div class="lbl"><span class="ic i-red">${ic('alert')}</span>Outstanding</div><div class="v">${money(out)}</div><div class="d">awaiting payment</div></div>
      <div class="card stat"><div class="lbl"><span class="ic i-green">${ic('dollar')}</span>Collected · month</div><div class="v">${money(monthIn)}</div><div class="d">${new Date().toLocaleDateString('en-US',{month:'long'})}</div></div>
      <div class="card stat"><div class="lbl"><span class="ic i-cyan">${ic('check')}</span>Paid sessions</div><div class="v">${db.sessions.filter(s=>s.paid).length}</div><div class="d">all-time</div></div>
    </div>
    <div class="sec"><h2>Awaiting payment</h2><span class="hint">Tap “Mark paid” when collected</span></div>
    <div class="card"><div class="list">${unpaid.length?unpaid.map(rowPayDue).join(''):emptyState('Nothing outstanding','Every session is paid up. 🌊')}</div></div>
    <div class="sec"><h2>Recently collected</h2></div>
    <div class="card"><div class="list">${paid.length?paid.map(rowPaid).join(''):emptyState('No payments yet')}</div></div>`;
  }
  function emptyState(t,sub=''){return `<div class="empty">${ic('sess')}<p><b style="color:var(--muted)">${t}</b>${sub?'<br>'+sub:''}</p></div>`}

  /* ---------- bind ---------- */
  function bind(){
    qa('[data-act="newsess"]').forEach(b=>b.onclick=()=>sessionModal());
    qa('[data-act="newcli"]').forEach(b=>b.onclick=()=>clientModal());
    qa('[data-act="seed"]').forEach(b=>b.onclick=()=>loadSample());
    qa('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
    qa('[data-sess]').forEach(r=>r.addEventListener('click',e=>{if(e.target.closest('[data-paid]'))return;sessionDetail(r.dataset.sess)}));
    qa('[data-cli]').forEach(r=>r.addEventListener('click',e=>{if(e.target.closest('[data-edit-cli]'))return;clientDetail(r.dataset.cli)}));
    qa('[data-edit-cli]').forEach(b=>b.onclick=e=>{e.stopPropagation();clientModal(b.dataset.editCli)});
    qa('[data-paid]').forEach(b=>b.onclick=e=>{e.stopPropagation();markPaid(b.dataset.paid)});
    const cs=q('#csearch');if(cs)cs.oninput=()=>{const v=cs.value.toLowerCase();qa('#clilist .row').forEach(r=>{r.style.display=r.dataset.name.includes(v)?'':'none'})};
  }

  /* ---------- modal infra ---------- */
  function openModal(html){q('#modalMount').innerHTML=html;q('#scrim').classList.add('on');document.body.style.overflow='hidden'}
  function closeModal(){q('#scrim').classList.remove('on');document.body.style.overflow='';q('#modalMount').innerHTML=''}
  q('#scrim').onclick=e=>{if(e.target.id==='scrim')closeModal()};
  function toast(m){const t=q('#toast');q('#toastMsg').textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2600)}
  let busy=false; const withBusy=async fn=>{if(busy)return;busy=true;try{await fn()}catch(e){toast('Error: '+(e.message||e))}busy=false};

  /* ---------- session modal ---------- */
  function sessionModal(id){
    const s=id?db.sessions.find(x=>x.id===id):null;
    const d=s?new Date(s.date):new Date();
    const dateStr=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const timeStr=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    const sel=s?[...s.athletes]:[]; const kind=s?s.kind:'private';
    const opts=db.clients.filter(c=>c.active||sel.includes(c.id));
    openModal(`
    <div class="modal"><div class="mhead"><h3>${s?'Edit session':'Log a session'}</h3><button class="ix" data-close>${ic('x')}</button></div>
      <div class="mbody">
        <div class="seg" style="margin-bottom:16px"><button type="button" data-kind="private" class="${kind==='private'?'on':''}">1-on-1 Private</button><button type="button" data-kind="group" class="${kind==='group'?'on':''}">Group Private</button></div>
        <div class="f full"><label>Athletes <span style="color:var(--faint)" id="selcount"></span></label>
          <div class="chips" id="athchips">${opts.length?opts.map(c=>`<div class="chip ${sel.includes(c.id)?'on':''}" data-aid="${c.id}"><span class="ck">${ic('check')}</span>${escapeHtml(c.name)}</div>`).join(''):'<span style="color:var(--faint);font-size:13px">No athletes yet — add one first.</span>'}</div></div>
        <div class="fgrid">
          <div class="f"><label>Date</label><input type="date" id="f_date" value="${dateStr}"></div>
          <div class="f"><label>Start time</label><input type="time" id="f_time" value="${timeStr}"></div>
          <div class="f"><label>Duration</label><select id="f_mins">${[30,45,60,75,90,120].map(m=>`<option value="${m}" ${(s?s.mins:60)===m?'selected':''}>${m} min${m>=60?' ('+hrs(m)+'h)':''}</option>`).join('')}</select></div>
          <div class="f"><label>Amount charged ($)</label><input type="number" id="f_amt" min="0" step="5" value="${s?s.amount:''}" placeholder="auto from rate"></div>
          <div class="f full"><label>Focus / what you worked on</label><input id="f_focus" value="${s?escapeAttr(s.focus):''}" placeholder="e.g. Low single finishes"></div>
          <div class="f"><label>Payment status</label><select id="f_paid"><option value="0" ${s&&s.paid?'':'selected'}>Unpaid</option><option value="1" ${s&&s.paid?'selected':''}>Paid</option></select></div>
          <div class="f"><label>Method</label><select id="f_method">${['','Venmo','Zelle','Cash','Card','Check'].map(m=>`<option ${s&&s.method===m?'selected':''}>${m||'—'}</option>`).join('')}</select></div>
          <div class="f full"><label>Notes</label><textarea id="f_notes" placeholder="Optional">${s?escapeHtml(s.notes):''}</textarea></div>
        </div>
      </div>
      <div class="mfoot">${s?`<button class="btn ghost" style="margin-right:auto;color:var(--red)" data-del>${ic('trash')}Delete</button>`:''}
        <button class="btn ghost" data-close>Cancel</button><button class="btn" id="saveSess">${s?'Save changes':'Log session'}</button></div>
    </div>`);
    qa('[data-close]').forEach(b=>b.onclick=closeModal);
    if(s)q('[data-del]').onclick=()=>delSession(s.id);
    let curKind=kind;
    qa('[data-kind]').forEach(b=>b.onclick=()=>{curKind=b.dataset.kind;qa('[data-kind]').forEach(x=>x.classList.toggle('on',x===b))});
    const amtEl=q('#f_amt');
    function refreshCount(){q('#selcount').textContent=(qa('#athchips .chip.on').length?'· '+qa('#athchips .chip.on').length+' selected':'')}
    function autoAmt(){if(s)return;if(amtEl.dataset.touched==='1')return;const ids=qa('#athchips .chip.on').map(c=>c.dataset.aid);const mins=+q('#f_mins').value;const total=ids.reduce((a,id)=>{const c=clientById(id);return a+(c?c.rate*(mins/60):0)},0);amtEl.value=Math.round(total)||''}
    qa('#athchips .chip').forEach(ch=>ch.onclick=()=>{ch.classList.toggle('on');refreshCount();autoAmt()});
    q('#f_mins').onchange=autoAmt; amtEl.oninput=()=>amtEl.dataset.touched='1';
    refreshCount();autoAmt();
    q('#saveSess').onclick=()=>withBusy(async()=>{
      const ids=qa('#athchips .chip.on').map(c=>c.dataset.aid);
      if(!ids.length){toast('Pick at least one athlete');return}
      const ts=new Date((q('#f_date').value||dateStr)+'T'+(q('#f_time').value||'16:00'));
      const paid=q('#f_paid').value==='1';
      const payload={date:ts.toISOString(),mins:+q('#f_mins').value,kind:curKind,focus:q('#f_focus').value.trim(),amount:+amtEl.value||0,paid,paid_date:paid?(s&&s.paidDate?new Date(s.paidDate).toISOString():ts.toISOString()):null,method:q('#f_method').value.trim()==='—'?'':q('#f_method').value.trim(),notes:q('#f_notes').value.trim()};
      let sid;
      if(s){const{error}=await sb.from('sessions').update(payload).eq('id',s.id);if(error)throw error;sid=s.id;await sb.from('session_athletes').delete().eq('session_id',sid);}
      else{const{data,error}=await sb.from('sessions').insert(payload).select('id').single();if(error)throw error;sid=data.id;}
      const{error:le}=await sb.from('session_athletes').insert(ids.map(a=>({session_id:sid,athlete_id:a})));if(le)throw le;
      await reload();closeModal();render();toast(s?'Session updated':'Session logged ✓');
    });
  }
  function delSession(id){if(!confirm('Delete this session? This cannot be undone.'))return;withBusy(async()=>{const{error}=await sb.from('sessions').delete().eq('id',id);if(error)throw error;await reload();closeModal();render();toast('Session deleted')})}
  function markPaid(id){const s=db.sessions.find(x=>x.id===id);if(!s)return;withBusy(async()=>{const{error}=await sb.from('sessions').update({paid:true,paid_date:new Date().toISOString(),method:s.method||'Paid'}).eq('id',id);if(error)throw error;await reload();render();toast('Marked paid ✓')})}

  /* ---------- session detail ---------- */
  function sessionDetail(id){
    const s=db.sessions.find(x=>x.id===id);if(!s)return;
    const cs=s.athletes.map(clientById).filter(Boolean);
    openModal(`
    <div class="modal"><div class="mhead"><h3>${escapeHtml(s.focus)||'Session'}</h3><button class="ix" data-close>${ic('x')}</button></div>
      <div class="mbody">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px"><span class="tag ${s.kind==='group'?'group':'priv'}"><span class="dot"></span>${s.kind==='group'?'Group · '+cs.length:'1-on-1'}</span><span class="tag ${s.paid?'paid':'due'}">${s.paid?'Paid '+(s.method?'· '+s.method:''):'Unpaid'}</span></div>
        <div class="dstats">
          <div class="dstat"><div class="l">Date</div><div class="n" style="font-size:16px">${fdate(s.date)}</div></div>
          <div class="dstat"><div class="l">Time</div><div class="n" style="font-size:16px">${ftime(s.date)}</div></div>
          <div class="dstat"><div class="l">Length</div><div class="n">${hrs(s.mins)}h</div></div>
          <div class="dstat"><div class="l">Amount</div><div class="n">${money(s.amount)}</div></div>
          <div class="dstat"><div class="l">Per athlete</div><div class="n" style="font-size:16px">${money(s.amount/(cs.length||1))}</div></div>
          <div class="dstat"><div class="l">Athletes</div><div class="n">${cs.length}</div></div>
        </div>
        <div class="hbar">Athletes</div>
        ${cs.map(c=>`<div style="padding:9px 0;display:flex;align-items:center;gap:12px">${avatar(c)}<div style="flex:1"><div class="nm-main" style="font-size:13.5px">${escapeHtml(c.name)}</div><div class="nm-sub">${c.type} · ${money(c.rate)}/hr</div></div></div>`).join('')}
        ${s.notes?`<div class="hbar">Notes</div><div style="font-size:13.5px;color:var(--muted);line-height:1.6">${escapeHtml(s.notes)}</div>`:''}
      </div>
      <div class="mfoot">${!s.paid?`<button class="btn blue" style="margin-right:auto" data-mp>${ic('check')}Mark paid</button>`:''}<button class="btn ghost" data-close>Close</button><button class="btn" data-edit>${ic('edit')}Edit</button></div>
    </div>`);
    qa('[data-close]').forEach(b=>b.onclick=closeModal);
    q('[data-edit]').onclick=()=>sessionModal(s.id);
    if(!s.paid)q('[data-mp]').onclick=()=>{markPaid(s.id);closeModal()};
  }

  /* ---------- client modal ---------- */
  function clientModal(id){
    const c=id?clientById(id):null;
    openModal(`
    <div class="modal"><div class="mhead"><h3>${c?'Edit athlete':'Add athlete'}</h3><button class="ix" data-close>${ic('x')}</button></div>
      <div class="mbody"><div class="fgrid">
        <div class="f full"><label>Full name</label><input id="c_name" value="${c?escapeAttr(c.name):''}" placeholder="First Last"></div>
        <div class="f"><label>Level</label><select id="c_type">${['Youth','HS','College','Adult'].map(t=>`<option ${c&&c.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="f"><label>Rate ($/hr)</label><input type="number" id="c_rate" min="0" step="5" value="${c?c.rate:60}"></div>
        <div class="f"><label>Phone</label><input id="c_phone" value="${c?escapeAttr(c.phone):''}" placeholder="(951) 555-0000"></div>
        <div class="f"><label>Email</label><input id="c_email" value="${c?escapeAttr(c.email):''}" placeholder="optional"></div>
        <div class="f full"><label>Guardian (for youth)</label><input id="c_guardian" value="${c?escapeAttr(c.guardian):''}" placeholder="optional"></div>
        <div class="f full"><label>Notes</label><textarea id="c_notes" placeholder="Goals, focus areas…">${c?escapeHtml(c.notes):''}</textarea></div>
        <div class="f full"><label>Status</label><select id="c_active"><option value="1" ${!c||c.active?'selected':''}>Active</option><option value="0" ${c&&!c.active?'selected':''}>Inactive</option></select></div>
      </div></div>
      <div class="mfoot">${c?`<button class="btn ghost" style="margin-right:auto;color:var(--red)" data-del>${ic('trash')}Delete</button>`:''}<button class="btn ghost" data-close>Cancel</button><button class="btn" id="saveCli">${c?'Save changes':'Add athlete'}</button></div>
    </div>`);
    qa('[data-close]').forEach(b=>b.onclick=closeModal);
    if(c)q('[data-del]').onclick=()=>delClient(c.id);
    q('#saveCli').onclick=()=>withBusy(async()=>{
      const name=q('#c_name').value.trim();if(!name){toast('Name required');return}
      const payload={name,level:q('#c_type').value,rate:+q('#c_rate').value||0,phone:q('#c_phone').value.trim(),email:q('#c_email').value.trim(),guardian:q('#c_guardian').value.trim(),notes:q('#c_notes').value.trim(),active:q('#c_active').value==='1',color:c?c.color:db.clients.length%palette.length};
      if(c){const{error}=await sb.from('athletes').update(payload).eq('id',c.id);if(error)throw error;}
      else{const{error}=await sb.from('athletes').insert(payload);if(error)throw error;}
      await reload();closeModal();render();toast(c?'Athlete updated':'Athlete added ✓');
    });
  }
  function delClient(id){
    const used=db.sessions.some(s=>s.athletes.includes(id));
    if(!confirm(used?'This athlete has sessions logged. Delete them and their sessions where they were the only athlete? This cannot be undone.':'Delete this athlete? This cannot be undone.'))return;
    withBusy(async()=>{
      const{error}=await sb.from('athletes').delete().eq('id',id);if(error)throw error; // cascade removes links
      await reload();
      const empties=db.sessions.filter(s=>!s.athletes.length).map(s=>s.id);
      if(empties.length){await sb.from('sessions').delete().in('id',empties);await reload();}
      closeModal();render();toast('Athlete deleted');
    });
  }

  /* ---------- client detail ---------- */
  function clientDetail(id){
    const c=clientById(id);if(!c)return;const st=clientStats(id);
    const hist=db.sessions.filter(s=>s.athletes.includes(id)).sort((a,b)=>b.date-a.date);
    openModal(`
    <div class="modal"><div class="mhead"><h3>Athlete</h3><button class="ix" data-close>${ic('x')}</button></div>
      <div class="mbody">
        <div class="detail-hero">${avatar(c)}<div><div style="font-size:20px;font-weight:800">${escapeHtml(c.name)}</div><div class="nm-sub" style="margin-top:5px"><span class="tag ${c.active?'act':'inact'}" style="padding:2px 8px"><span class="dot"></span>${c.type}</span>${money(c.rate)}/hr</div></div></div>
        <div class="dstats"><div class="dstat"><div class="l">Sessions</div><div class="n">${st.sessions}</div></div><div class="dstat"><div class="l">Hours</div><div class="n">${hrs(st.mins)}</div></div><div class="dstat"><div class="l">Balance</div><div class="n" style="color:${st.due>0?'var(--red)':'var(--green)'}">${money(st.due)}</div></div></div>
        ${(c.phone||c.email||c.guardian)?`<div class="hbar">Contact</div><div style="font-size:13.5px;color:var(--muted);line-height:1.9">${c.phone?'📞 '+escapeHtml(c.phone)+'<br>':''}${c.email?'✉️ '+escapeHtml(c.email)+'<br>':''}${c.guardian?'👤 Guardian: '+escapeHtml(c.guardian):''}</div>`:''}
        ${c.notes?`<div class="hbar">Notes</div><div style="font-size:13.5px;color:var(--muted);line-height:1.6">${escapeHtml(c.notes)}</div>`:''}
        <div class="hbar">Session history</div>
        <div class="hist">${hist.length?hist.map(s=>`<div class="h-row"><div><b style="font-weight:700">${fdate(s.date)}</b> <span style="color:var(--faint)">· ${escapeHtml(s.focus)||(s.kind==='group'?'Group':'Private')}</span></div><div style="display:flex;gap:10px;align-items:center"><span class="tag ${s.paid?'paid':'due'}" style="padding:2px 8px">${s.paid?'Paid':'Due'}</span><b>${money(s.amount/s.athletes.length)}</b></div></div>`).join(''):'<div style="color:var(--faint);font-size:13px;padding:8px 0">No sessions yet</div>'}</div>
      </div>
      <div class="mfoot"><button class="btn ghost" data-close>Close</button><button class="btn" data-edit>${ic('edit')}Edit</button></div>
    </div>`);
    qa('[data-close]').forEach(b=>b.onclick=closeModal);
    q('[data-edit]').onclick=()=>clientModal(c.id);
  }

  /* ---------- backup export ---------- */
  function exportBackup(){
    const data={exported_at:new Date().toISOString(),athletes:db.clients,sessions:db.sessions};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='deepwaters-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();
    // also a sessions CSV
    const rows=[['date','time','kind','focus','athletes','minutes','amount','paid','method','notes']];
    db.sessions.forEach(s=>{const nm=s.athletes.map(a=>{const c=clientById(a);return c?c.name:''}).join('; ');rows.push([new Date(s.date).toLocaleDateString(),ftime(s.date),s.kind,s.focus,nm,s.mins,s.amount,s.paid?'yes':'no',s.method,(s.notes||'').replace(/\n/g,' ')])});
    const csv=rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');
    const cb=new Blob([csv],{type:'text/csv'});const a2=document.createElement('a');a2.href=URL.createObjectURL(cb);a2.download='deepwaters-sessions-'+new Date().toISOString().slice(0,10)+'.csv';a2.click();
    toast('Backup downloaded ✓');
  }

  /* ---------- sample data ---------- */
  async function loadSample(){
    if(!confirm('Load a set of sample athletes and sessions into your account? You can delete them later.'))return;
    withBusy(async()=>{
      const A=[['Mateo Rivera','Youth',60,'Ana Rivera','(951) 555-0142','ana.r@email.com','Folkstyle focus. Working on low single finishes.',0],
        ['Sophia Chen','HS',65,'','(951) 555-0173','sophiac@email.com','Prepping for CIF. Sharp on top.',1],
        ['Diego Salas','Youth',55,'Marco Salas','(951) 555-0198','','Needs conditioning. Great attitude.',2],
        ['Liam Brooks','HS',65,'','(951) 555-0110','liamb@email.com','Leg rider. Building a bottom game.',3],
        ['Ava Martinez','Youth',55,'Rosa Martinez','(951) 555-0155','rosa.m@email.com','',4]];
      const{data:ins,error}=await sb.from('athletes').insert(A.map(a=>({name:a[0],level:a[1],rate:a[2],guardian:a[3],phone:a[4],email:a[5],notes:a[6],color:a[7],active:true}))).select('id,name');
      if(error)throw error;
      const id=n=>{const f=ins.find(x=>x.name===n);return f&&f.id};
      const D=(d,h,m)=>{const x=new Date();x.setDate(x.getDate()-d);x.setHours(h,m,0,0);return x.toISOString()};
      const S=[[D(1,16,0),60,'private',[id('Mateo Rivera')],60,'Low single entries',true,'Venmo'],
        [D(2,17,0),90,'group',[id('Sophia Chen'),id('Liam Brooks')],90,'Live wrestling + scramble drills',true,'Cash'],
        [D(3,15,30),60,'private',[id('Diego Salas')],55,'Conditioning + stance',false,''],
        [D(5,16,0),60,'private',[id('Sophia Chen')],65,'Top/bottom situations',true,'Zelle'],
        [D(6,17,0),75,'group',[id('Mateo Rivera'),id('Diego Salas'),id('Ava Martinez')],120,'Youth technique clinic',false,''],
        [D(9,15,0),60,'private',[id('Ava Martinez')],55,'Footwork',true,'Cash'],
        [D(12,16,30),90,'group',[id('Sophia Chen'),id('Liam Brooks')],90,'Hand fighting series',true,'Venmo'],
        [D(15,16,0),60,'private',[id('Mateo Rivera')],60,'Finishing on the edge',false,'']];
      for(const r of S){const{data:sd,error:se}=await sb.from('sessions').insert({date:r[0],mins:r[1],kind:r[2],amount:r[4],focus:r[5],paid:r[6],paid_date:r[6]?r[0]:null,method:r[7]}).select('id').single();if(se)throw se;await sb.from('session_athletes').insert(r[3].filter(Boolean).map(a=>({session_id:sd.id,athlete_id:a})));}
      await reload();render();toast('Sample data loaded ✓');
    });
  }

  /* ---------- auth (Google + email/password, shared team access) ---------- */
  function gIcon(){return '<svg viewBox="0 0 18 18" width="17" height="17" style="margin-right:2px"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"/></svg>';}
  function loginMsg(html){const el=q('#lmsg');if(el)el.innerHTML=html||'';}
  function loginCard(extra=''){return `
    <div class="lcard">
      <div class="logo big">${ic('wave')}</div>
      <div class="ltitle">Deep Waters RTC</div>
      <div class="lsub">Coaching Ledger</div>
      <button class="btn gbtn" id="gbtn" type="button">${gIcon()}Continue with Google</button>
      <div class="ldiv"><span>or</span></div>
      <form id="lform">
        <input type="email" id="lemail" placeholder="you@email.com" autocomplete="email" required>
        <input type="password" id="lpass" placeholder="Password (6+ characters)" autocomplete="current-password" required minlength="6">
        <button class="btn" type="submit" id="lbtn" style="width:100%;justify-content:center"><span id="lbtntx">Sign in</span></button>
      </form>
      <div class="ltoggle">New to the team? <button type="button" id="ltgl">Create an account</button></div>
      <div class="lmsg" id="lmsg">${extra}</div>
      <div class="lnote">Everyone on staff shares the same athletes &amp; sessions — sign in with any account.</div>
    </div>`;}
  function showLogin(){root.classList.remove('authed');q('#login').innerHTML=loginCard();bindLogin();}
  function bindLogin(){
    let mode='signin';
    const setMode=m=>{mode=m;q('#lbtntx').textContent=m==='signin'?'Sign in':'Create account';
      q('#ltgl').textContent=m==='signin'?'Create an account':'Have an account? Sign in';
      q('#lpass').setAttribute('autocomplete',m==='signin'?'current-password':'new-password');loginMsg('');};
    q('#ltgl').onclick=()=>setMode(mode==='signin'?'signup':'signin');
    q('#gbtn').onclick=async()=>{loginMsg('<div class="lok">Redirecting to Google…</div>');
      const{error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/'}});
      if(error)loginMsg('<div class="lerr">'+escapeHtml(error.message)+'</div>');};
    q('#lform').onsubmit=async e=>{e.preventDefault();
      const email=q('#lemail').value.trim(),pass=q('#lpass').value;if(!email||!pass)return;
      const btn=q('#lbtn');btn.disabled=true;loginMsg('');
      let res;
      if(mode==='signup')res=await sb.auth.signUp({email,password:pass,options:{emailRedirectTo:window.location.origin+'/'}});
      else res=await sb.auth.signInWithPassword({email,password:pass});
      btn.disabled=false;
      if(res.error){loginMsg('<div class="lerr">'+escapeHtml(res.error.message)+'</div>');}
      else if(mode==='signup'&&!res.data.session){loginMsg('<div class="lok">✓ Account created. If email confirmation is on, check your inbox, then sign in.</div>');}
    };
  }
  function showApp(){root.classList.add('authed');
    qa('#nav button,#mnav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
    q('#fab').onclick=()=>{cur==='athletes'?clientModal():sessionModal()};
    q('#fab').innerHTML=ic('plus');
    qa('[data-ic]').forEach(b=>{if(!b.dataset.bound){b.insertAdjacentHTML('afterbegin',ic(b.dataset.ic));b.dataset.bound='1'}});
    qa('[data-export]').forEach(b=>b.onclick=exportBackup);
    qa('[data-signout]').forEach(b=>b.onclick=async()=>{await sb.auth.signOut();});
  }

  /* ---------- boot ---------- */
  const {data:authSub}=sb.auth.onAuthStateChange((_e,session)=>{
    if(session){user=session.user;showApp();reload().then(()=>{render()})}
    else{user=null;showLogin()}
  });
  (async()=>{const{data}=await sb.auth.getSession();if(data&&data.session){user=data.session.user;showApp();await reload();render()}else showLogin();})();

  document.addEventListener('keydown',escClose);
  function escClose(e){if(e.key==='Escape')closeModal()}

  return ()=>{try{authSub&&authSub.subscription&&authSub.subscription.unsubscribe()}catch(e){};document.removeEventListener('keydown',escClose)};
}

/* ============================================================ */
/* SHELL markup (injected into the .dwroot container)           */
/* ============================================================ */
const SHELL=`
<div class="bg"></div><div class="orb a"></div><div class="orb b"></div><div class="orb c"></div>
<div class="login" id="login"></div>
<div class="app">
  <aside class="side">
    <div class="brand"><div class="logo"><svg viewBox="0 0 24 24" fill="none"><path d="M2 16c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2" stroke="#54b6ff" stroke-width="1.8" stroke-linecap="round"/><path d="M2 11c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2" stroke="#ffb15c" stroke-width="1.8" stroke-linecap="round" opacity=".85"/></svg></div>
      <div><div class="nm">Deep Waters</div><div class="sub">RTC · Ledger</div></div></div>
    <nav class="nav" id="nav">
      <button data-v="dash" data-ic="dash" class="on">Dashboard</button>
      <button data-v="sessions" data-ic="sess">Sessions</button>
      <button data-v="athletes" data-ic="ath">Athletes</button>
      <button data-v="payments" data-ic="pay">Payments</button>
    </nav>
    <div class="sidebtns">
      <button class="btn ghost sm" data-export data-ic="download" style="width:100%;justify-content:center">Export backup</button>
      <button class="btn ghost sm" data-signout data-ic="out" style="width:100%;justify-content:center;margin-top:8px">Sign out</button>
    </div>
    <div class="foot"><b>Deep Waters RTC</b><br>Riverside, CA · Coaching Ledger<br><span style="opacity:.6">Synced to the cloud — your data is safe.</span></div>
  </aside>
  <main class="main">
    <div class="mobhead-bar">
      <div class="logo"><svg viewBox="0 0 24 24" fill="none"><path d="M2 16c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2" stroke="#54b6ff" stroke-width="1.8" stroke-linecap="round"/><path d="M2 11c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2" stroke="#ffb15c" stroke-width="1.8" stroke-linecap="round" opacity=".85"/></svg></div>
      <div style="flex:1"><div style="font-weight:800;font-size:15px">Deep Waters RTC</div><div style="font-size:11px;color:var(--faint)">Coaching Ledger</div></div>
      <button class="ix" data-export data-ic="download"></button>
      <button class="ix" data-signout data-ic="out"></button>
    </div>
    <div id="view"></div>
  </main>
</div>
<nav class="mobile-nav" id="mnav">
  <button data-v="dash" data-ic="dash" class="on">Home</button>
  <button data-v="sessions" data-ic="sess">Sessions</button>
  <button data-v="athletes" data-ic="ath">Athletes</button>
  <button data-v="payments" data-ic="pay">Pay</button>
</nav>
<button class="fab" id="fab"></button>
<div class="scrim" id="scrim"><div id="modalMount"></div></div>
<div class="toast" id="toast"><span class="pulse"></span><span id="toastMsg"></span></div>
`;

/* ============================================================ */
/* Scoped styles — every rule lives under .dwroot               */
/* ============================================================ */
const CSS=`
.dwroot{
  --void:#04060d;--void-2:#070b16;--glass:rgba(20,30,52,.55);--glass-2:rgba(14,22,40,.65);
  --stroke:rgba(120,160,220,.14);--stroke-2:rgba(120,160,220,.08);--text:#eaf1ff;--muted:#8ea3c6;--faint:#5d6f92;
  --amber:#ffb15c;--copper:#e8783c;--blue:#54b6ff;--cyan:#5fe3e0;--green:#5fe0a0;--red:#ff6b7a;
  --shadow:0 24px 60px -28px rgba(0,0,0,.9);--r:20px;
  position:relative;min-height:100vh;color:var(--text);background:var(--void);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;letter-spacing:.1px;overflow-x:hidden;
}
.dwroot *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
.dwroot .bg{position:fixed;inset:0;z-index:0;background:radial-gradient(120% 90% at 50% -10%,#0a1226 0%,#06090f 45%,#04060d 100%)}
.dwroot .orb{position:fixed;border-radius:50%;filter:blur(70px);opacity:.5;z-index:0;pointer-events:none;mix-blend-mode:screen;will-change:transform}
.dwroot .orb.a{width:560px;height:560px;left:-160px;top:-120px;background:radial-gradient(circle at 30% 30%,#e8783c,transparent 65%);animation:dwa 26s ease-in-out infinite}
.dwroot .orb.b{width:620px;height:620px;right:-200px;top:18%;background:radial-gradient(circle at 60% 40%,#2f7dd6,transparent 65%);animation:dwb 32s ease-in-out infinite}
.dwroot .orb.c{width:480px;height:480px;left:30%;bottom:-220px;background:radial-gradient(circle at 50% 50%,#1f9b96,transparent 60%);animation:dwc 38s ease-in-out infinite}
@keyframes dwa{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(60px,40px) scale(1.12)}}
@keyframes dwb{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-50px,60px) scale(1.08)}}
@keyframes dwc{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-50px) scale(1.15)}}
@media (prefers-reduced-motion:reduce){.dwroot .orb{animation:none}}

.dwroot .app{display:none;position:relative;z-index:1;min-height:100vh}
.dwroot.authed .app{display:flex}
.dwroot .login{display:flex;position:relative;z-index:2;min-height:100vh;align-items:center;justify-content:center;padding:24px}
.dwroot.authed .login{display:none}

.dwroot .side{width:248px;flex:0 0 248px;padding:26px 18px;position:sticky;top:0;height:100vh;border-right:1px solid var(--stroke-2);display:flex;flex-direction:column;gap:6px;background:linear-gradient(180deg,rgba(10,16,30,.5),rgba(6,9,16,.2));backdrop-filter:blur(14px)}
.dwroot .brand{display:flex;align-items:center;gap:12px;padding:6px 8px 22px}
.dwroot .logo{width:42px;height:42px;border-radius:13px;flex:0 0 42px;position:relative;background:linear-gradient(145deg,#0c1830,#060b16);border:1px solid rgba(120,170,255,.22);display:grid;place-items:center;overflow:hidden;box-shadow:0 0 24px -4px rgba(84,182,255,.4),inset 0 0 18px rgba(84,182,255,.12)}
.dwroot .logo svg{width:24px;height:24px}
.dwroot .logo::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 120%,rgba(84,182,255,.4),transparent 70%);animation:dwbr 5s ease-in-out infinite}
@keyframes dwbr{0%,100%{opacity:.4}50%{opacity:.9}}
.dwroot .brand .nm{font-weight:800;font-size:15px;letter-spacing:.3px;line-height:1.1}
.dwroot .brand .sub{font-size:10.5px;color:var(--faint);letter-spacing:1.6px;text-transform:uppercase;margin-top:3px}
.dwroot .nav{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.dwroot .nav button{display:flex;align-items:center;gap:13px;width:100%;border:0;cursor:pointer;background:transparent;color:var(--muted);padding:12px 14px;border-radius:13px;font-size:14px;font-weight:600;font-family:inherit;transition:.22s;text-align:left}
.dwroot .nav button svg{width:19px;height:19px;opacity:.8;flex:0 0 19px}
.dwroot .nav button:hover{background:rgba(120,160,220,.07);color:var(--text)}
.dwroot .nav button.on{color:var(--text);background:linear-gradient(100deg,rgba(232,120,60,.16),rgba(84,182,255,.12));border:1px solid var(--stroke);box-shadow:inset 0 0 18px rgba(120,160,220,.06)}
.dwroot .nav button.on svg{opacity:1}
.dwroot .sidebtns{margin-top:18px;padding:0 4px}
.dwroot .foot{margin-top:auto;font-size:11px;color:var(--faint);padding:16px 12px 4px;line-height:1.6}
.dwroot .foot b{color:var(--muted);font-weight:700}

.dwroot .main{flex:1;min-width:0;padding:34px 40px 120px;max-width:1180px}
.dwroot .mobhead-bar{display:none}
.dwroot .topbar{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap}
.dwroot .topbar h1{font-size:27px;font-weight:800;letter-spacing:-.4px}
.dwroot .topbar .ph{font-size:13.5px;color:var(--muted);margin-top:5px}

.dwroot .card{background:var(--glass);border:1px solid var(--stroke);border-radius:var(--r);backdrop-filter:blur(18px) saturate(1.2);box-shadow:var(--shadow);position:relative;overflow:hidden}
.dwroot .card::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(160deg,rgba(255,255,255,.07),transparent 38%)}
.dwroot .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px}
.dwroot .stat{padding:20px 20px 18px}
.dwroot .stat .lbl{font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:1.2px;font-weight:600;display:flex;align-items:center;gap:8px}
.dwroot .stat .ic{width:26px;height:26px;border-radius:9px;display:grid;place-items:center;flex:0 0 26px}
.dwroot .stat .ic svg{width:15px;height:15px}
.dwroot .stat .v{font-size:30px;font-weight:800;margin-top:14px;letter-spacing:-.5px;font-variant-numeric:tabular-nums}
.dwroot .stat .d{font-size:12px;color:var(--faint);margin-top:5px}
.dwroot .i-amber{background:rgba(232,120,60,.16);color:var(--amber)}
.dwroot .i-blue{background:rgba(84,182,255,.16);color:var(--blue)}
.dwroot .i-green{background:rgba(95,224,160,.14);color:var(--green)}
.dwroot .i-cyan{background:rgba(95,227,224,.14);color:var(--cyan)}
.dwroot .i-red{background:rgba(255,107,122,.16);color:var(--red)}
.dwroot .sec{display:flex;align-items:center;justify-content:space-between;margin:30px 2px 14px}
.dwroot .sec h2{font-size:17px;font-weight:750;letter-spacing:-.2px}
.dwroot .sec .hint{font-size:12px;color:var(--faint)}

.dwroot .btn{border:0;cursor:pointer;font-family:inherit;font-weight:700;font-size:13.5px;border-radius:12px;padding:11px 17px;display:inline-flex;align-items:center;gap:8px;transition:.2s;color:#08101f;background:linear-gradient(120deg,var(--amber),var(--copper));box-shadow:0 8px 22px -8px rgba(232,120,60,.7)}
.dwroot .btn:hover{transform:translateY(-1px);filter:brightness(1.07)}
.dwroot .btn svg{width:16px;height:16px}
.dwroot .btn.ghost{background:rgba(120,160,220,.08);color:var(--text);border:1px solid var(--stroke);box-shadow:none}
.dwroot .btn.ghost:hover{background:rgba(120,160,220,.14)}
.dwroot .btn.sm{padding:8px 13px;font-size:12.5px;border-radius:10px}
.dwroot .btn.blue{background:linear-gradient(120deg,var(--blue),#2f7dd6);color:#06101f;box-shadow:0 8px 22px -8px rgba(84,182,255,.7)}
.dwroot .btn:disabled{opacity:.6;cursor:default}

.dwroot .list{padding:8px}
.dwroot .row{display:grid;align-items:center;gap:14px;padding:14px 14px;border-radius:14px;transition:.18s}
.dwroot .row:hover{background:rgba(120,160,220,.05)}
.dwroot .row+.row{border-top:1px solid var(--stroke-2)}
.dwroot .sess-row{grid-template-columns:54px 1.7fr 1fr .8fr .9fr auto;cursor:pointer}
.dwroot .cli-row{grid-template-columns:42px 1.6fr 1fr 1fr auto;cursor:pointer}
.dwroot .pay-row{grid-template-columns:42px 1.6fr 1fr 1fr auto}
.dwroot .colhead{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--faint);font-weight:700;padding:6px 14px 2px}
.dwroot .colhead:hover{background:none}
.dwroot .datechip{width:54px;height:54px;border-radius:13px;background:rgba(120,160,220,.07);border:1px solid var(--stroke-2);display:grid;place-content:center;text-align:center;line-height:1}
.dwroot .datechip .mo{font-size:10px;color:var(--copper);font-weight:800;letter-spacing:.5px;text-transform:uppercase}
.dwroot .datechip .dy{font-size:20px;font-weight:800;margin-top:2px}
.dwroot .av{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;font-weight:800;font-size:15px;color:#07101f;flex:0 0 42px}
.dwroot .nm-main{font-weight:700;font-size:14.5px}
.dwroot .nm-sub{font-size:12px;color:var(--faint);margin-top:3px;display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.dwroot .amt{font-weight:800;font-variant-numeric:tabular-nums;font-size:14.5px}
.dwroot .tag{font-size:10.5px;font-weight:700;padding:4px 9px;border-radius:20px;letter-spacing:.3px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.dwroot .tag svg{width:12px;height:12px}
.dwroot .tag.priv{background:rgba(84,182,255,.14);color:var(--blue)}
.dwroot .tag.group{background:rgba(255,177,92,.15);color:var(--amber)}
.dwroot .tag.paid{background:rgba(95,224,160,.14);color:var(--green)}
.dwroot .tag.due{background:rgba(255,107,122,.15);color:var(--red)}
.dwroot .tag.act{background:rgba(95,224,160,.12);color:var(--green)}
.dwroot .tag.inact{background:rgba(141,163,198,.12);color:var(--faint)}
.dwroot .dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.dwroot .ix{width:34px;height:34px;border-radius:10px;border:1px solid var(--stroke-2);background:transparent;color:var(--muted);display:grid;place-items:center;cursor:pointer;transition:.18s}
.dwroot .ix:hover{background:rgba(120,160,220,.1);color:var(--text)}
.dwroot .ix svg{width:15px;height:15px}
.dwroot .rowacts{display:flex;gap:7px;justify-content:flex-end;align-items:center}
.dwroot .empty{padding:54px 20px;text-align:center;color:var(--faint)}
.dwroot .empty svg{width:40px;height:40px;opacity:.4;margin-bottom:12px}
.dwroot .empty p{font-size:13.5px;line-height:1.6}
.dwroot .pbar{height:7px;border-radius:6px;background:rgba(120,160,220,.1);overflow:hidden;margin-top:9px}
.dwroot .pbar i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,var(--copper),var(--amber));box-shadow:0 0 12px rgba(255,177,92,.5)}
.dwroot .grid2{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start}
.dwroot .mini{padding:20px}
.dwroot .mini h3{font-size:14px;font-weight:750;margin-bottom:4px}
.dwroot .sm-row{display:flex;align-items:center;gap:12px;padding:11px 0}
.dwroot .sm-row+.sm-row{border-top:1px solid var(--stroke-2)}
.dwroot .scrollwrap{overflow-x:auto}
.dwroot .search{position:relative;flex:1;max-width:300px}
.dwroot .search input{width:100%;background:rgba(8,13,24,.6);border:1px solid var(--stroke);border-radius:12px;padding:11px 13px 11px 38px;color:var(--text);font-family:inherit;font-size:13.5px}
.dwroot .search input:focus{outline:0;border-color:rgba(84,182,255,.4)}
.dwroot .search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--faint)}

.dwroot .scrim{position:fixed;inset:0;background:rgba(2,4,9,.72);backdrop-filter:blur(6px);z-index:50;display:none;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto}
.dwroot .scrim.on{display:flex}
.dwroot .modal{width:100%;max-width:560px;border-radius:24px;background:linear-gradient(180deg,rgba(18,27,48,.95),rgba(9,14,26,.97));border:1px solid var(--stroke);box-shadow:0 40px 100px -30px #000;animation:dwpop .26s cubic-bezier(.2,.9,.3,1.2);position:relative;overflow:hidden}
.dwroot .modal::before{content:"";position:absolute;top:0;left:0;right:0;height:120px;background:radial-gradient(120% 100% at 50% 0,rgba(84,182,255,.14),transparent 70%);pointer-events:none}
@keyframes dwpop{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
.dwroot .mhead{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 6px;position:relative}
.dwroot .mhead h3{font-size:18px;font-weight:800}
.dwroot .mbody{padding:14px 24px 24px;position:relative}
.dwroot .fgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.dwroot .f{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}
.dwroot .f.full{grid-column:1/-1}
.dwroot .f label{font-size:12px;color:var(--muted);font-weight:600;letter-spacing:.2px}
.dwroot .f input,.dwroot .f select,.dwroot .f textarea{background:rgba(8,13,24,.7);border:1px solid var(--stroke);border-radius:12px;color:var(--text);padding:12px 13px;font-size:14px;font-family:inherit;transition:.18s;width:100%}
.dwroot .f textarea{resize:vertical;min-height:70px}
.dwroot .f input:focus,.dwroot .f select:focus,.dwroot .f textarea:focus{outline:0;border-color:rgba(84,182,255,.5);box-shadow:0 0 0 3px rgba(84,182,255,.12)}
.dwroot .f select option{background:#0b1120}
.dwroot .seg{display:flex;gap:8px}
.dwroot .seg button{flex:1;padding:11px;border-radius:12px;border:1px solid var(--stroke);background:rgba(8,13,24,.5);color:var(--muted);font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;transition:.18s}
.dwroot .seg button.on{background:linear-gradient(120deg,rgba(232,120,60,.22),rgba(84,182,255,.18));color:var(--text)}
.dwroot .chips{display:flex;flex-wrap:wrap;gap:8px;max-height:170px;overflow-y:auto;padding:2px}
.dwroot .chip{padding:9px 13px;border-radius:11px;border:1px solid var(--stroke);background:rgba(8,13,24,.5);color:var(--muted);font-size:13px;font-weight:600;cursor:pointer;transition:.18s;display:flex;align-items:center;gap:7px}
.dwroot .chip.on{background:linear-gradient(120deg,rgba(232,120,60,.2),rgba(84,182,255,.16));color:var(--text)}
.dwroot .chip .ck{width:15px;height:15px;border-radius:5px;border:1.5px solid var(--faint);display:grid;place-items:center;transition:.15s}
.dwroot .chip.on .ck{background:var(--amber);border-color:var(--amber)}
.dwroot .chip .ck svg{width:11px;height:11px;opacity:0;color:#08101f}
.dwroot .chip.on .ck svg{opacity:1}
.dwroot .mfoot{display:flex;gap:10px;justify-content:flex-end;padding:6px 24px 24px;flex-wrap:wrap}
.dwroot .detail-hero{display:flex;align-items:center;gap:16px;margin-bottom:6px}
.dwroot .detail-hero .av{width:58px;height:58px;border-radius:17px;font-size:21px}
.dwroot .dstats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}
.dwroot .dstat{background:rgba(8,13,24,.5);border:1px solid var(--stroke-2);border-radius:14px;padding:14px}
.dwroot .dstat .l{font-size:10.5px;color:var(--faint);text-transform:uppercase;letter-spacing:.8px;font-weight:700}
.dwroot .dstat .n{font-size:20px;font-weight:800;margin-top:6px;font-variant-numeric:tabular-nums}
.dwroot .hbar{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--faint);font-weight:700;margin:16px 0 8px}
.dwroot .hist .h-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;font-size:13px}
.dwroot .hist .h-row+.h-row{border-top:1px solid var(--stroke-2)}

.dwroot .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);background:linear-gradient(120deg,rgba(18,27,48,.97),rgba(9,14,26,.97));border:1px solid var(--stroke);color:var(--text);padding:13px 20px;border-radius:14px;font-size:13.5px;font-weight:600;box-shadow:0 20px 50px -16px #000;opacity:0;transition:.35s;z-index:80;display:flex;align-items:center;gap:10px;pointer-events:none}
.dwroot .toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
.dwroot .pulse{width:7px;height:7px;border-radius:50%;background:var(--amber);box-shadow:0 0 10px var(--amber);animation:dwpp 2.4s ease-in-out infinite}
@keyframes dwpp{0%,100%{opacity:.5;transform:scale(.8)}50%{opacity:1;transform:scale(1.25)}}

.dwroot .fab{display:none}
.dwroot .mobile-nav{display:none}

/* login card */
.dwroot .lcard{position:relative;z-index:2;width:100%;max-width:380px;text-align:center;background:linear-gradient(180deg,rgba(18,27,48,.85),rgba(9,14,26,.92));border:1px solid var(--stroke);border-radius:26px;padding:40px 30px;box-shadow:0 40px 100px -30px #000;backdrop-filter:blur(20px)}
.dwroot .lcard .logo.big{width:64px;height:64px;border-radius:20px;margin:0 auto 18px}
.dwroot .lcard .logo.big svg{width:36px;height:36px}
.dwroot .ltitle{font-size:22px;font-weight:800;letter-spacing:-.3px}
.dwroot .lsub{font-size:11px;color:var(--faint);letter-spacing:2px;text-transform:uppercase;margin-top:5px;margin-bottom:26px}
.dwroot #lform{display:flex;flex-direction:column;gap:10px}
.dwroot #lform input{background:rgba(8,13,24,.7);border:1px solid var(--stroke);border-radius:13px;color:var(--text);padding:14px 15px;font-size:15px;font-family:inherit;text-align:center}
.dwroot #lform input:focus{outline:0;border-color:rgba(84,182,255,.5);box-shadow:0 0 0 3px rgba(84,182,255,.12)}
.dwroot .gbtn{background:#fff;color:#1a1a1a;width:100%;justify-content:center;box-shadow:none;margin-bottom:2px}
.dwroot .gbtn:hover{filter:brightness(.96)}
.dwroot .ldiv{display:flex;align-items:center;gap:12px;color:var(--faint);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:14px 0 12px}
.dwroot .ldiv::before,.dwroot .ldiv::after{content:"";flex:1;height:1px;background:var(--stroke)}
.dwroot .ltoggle{font-size:12.5px;color:var(--muted);margin-top:14px}
.dwroot .ltoggle button{background:none;border:0;color:var(--blue);font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;padding:0}
.dwroot .lmsg:empty{display:none}
.dwroot .lnote{font-size:12px;color:var(--faint);line-height:1.6;margin-top:16px}
.dwroot .lok{margin-top:16px;font-size:13px;color:var(--green);background:rgba(95,224,160,.1);border:1px solid rgba(95,224,160,.2);padding:12px;border-radius:12px;line-height:1.5}
.dwroot .lerr{margin-top:16px;font-size:13px;color:var(--red);background:rgba(255,107,122,.1);border:1px solid rgba(255,107,122,.2);padding:12px;border-radius:12px;line-height:1.5}
.dwroot .lerr span{color:var(--muted);font-size:12px}
.dwroot .lerr code{background:rgba(120,160,220,.12);padding:1px 5px;border-radius:5px;font-size:11px}

@media (max-width:860px){
  .dwroot .side{display:none}
  .dwroot .main{padding:16px 16px 110px;max-width:100%}
  .dwroot .mobhead-bar{display:flex;align-items:center;gap:12px;margin-bottom:18px}
  .dwroot .mobhead-bar .logo{width:38px;height:38px}
  .dwroot .stats{grid-template-columns:1fr 1fr;gap:12px}
  .dwroot .grid2{grid-template-columns:1fr}
  .dwroot .topbar h1{font-size:22px}
  .dwroot .sess-row{grid-template-columns:46px 1fr auto;grid-template-areas:"d main acts";row-gap:8px}
  .dwroot .sess-row .c-when{grid-area:d}.dwroot .sess-row .c-main{grid-area:main}.dwroot .sess-row .c-acts{grid-area:acts}
  .dwroot .sess-row .c-rate,.dwroot .sess-row .c-type,.dwroot .sess-row .c-pay{display:none}
  .dwroot .cli-row{grid-template-columns:42px 1fr auto}
  .dwroot .cli-row .c-rate,.dwroot .cli-row .c-bal{display:none}
  .dwroot .pay-row{grid-template-columns:42px 1fr auto}
  .dwroot .pay-row .c-last{display:none}
  .dwroot .colhead{display:none}
  .dwroot .fgrid{grid-template-columns:1fr}
  .dwroot.authed .mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:45;background:linear-gradient(180deg,rgba(8,12,22,.7),rgba(5,7,13,.96));backdrop-filter:blur(20px);border-top:1px solid var(--stroke);padding:9px 8px calc(9px + env(safe-area-inset-bottom));justify-content:space-around}
  .dwroot .mobile-nav button{flex:1;border:0;background:transparent;color:var(--faint);display:flex;flex-direction:column;align-items:center;gap:4px;font-family:inherit;font-size:10.5px;font-weight:700;cursor:pointer;padding:5px;transition:.18s}
  .dwroot .mobile-nav button svg{width:21px;height:21px}
  .dwroot .mobile-nav button.on{color:var(--amber)}
  .dwroot.authed .fab{display:grid;position:fixed;right:18px;bottom:84px;width:58px;height:58px;border-radius:19px;place-items:center;border:0;cursor:pointer;z-index:40;background:linear-gradient(120deg,var(--amber),var(--copper));box-shadow:0 14px 34px -10px rgba(232,120,60,.8)}
  .dwroot .fab svg{width:26px;height:26px;color:#08101f}
}
`;
