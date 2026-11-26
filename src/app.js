'use strict';
const CATS={Housing:['🏠','#c4623f'],Food:['🥕','#e8a622'],Transport:['🚌','#2f7f79'],Utilities:['💡','#7a6bb0'],Entertainment:['🎬','#d4688c'],Health:['🩺','#4a9a5a'],Shopping:['🛍️','#9a6a3c'],Other:['📦','#7d8a80']};
const INC=['💰','#2f7f79'];
const info=c=>CATS[c]||INC;
const KEY='hearth.v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const money0=n=>'$'+Math.round(n).toLocaleString('en-US');
const ymOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
const shift=(ym,k)=>{const [y,m]=ym.split('-').map(Number);return ymOf(new Date(y,m-1+k,1));};
const mname=(ym,long)=>{const [y,m]=ym.split('-').map(Number);return new Date(y,m-1,1).toLocaleString('en-US',long?{month:'long',year:'numeric'}:{month:'short'});};
const todayStr=()=>{const d=new Date();return ymOf(d)+'-'+String(d.getDate()).padStart(2,'0');};
const NOW=ymOf(new Date());

function sample(){
  const tx=[];let id=1;const now=new Date();
  for(let i=5;i>=0;i--){
    const ym=ymOf(new Date(now.getFullYear(),now.getMonth()-i,1));
    const v=(i*37)%5;
    const add=(day,type,amount,cat,note)=>{if(i===0)day=Math.min(day,now.getDate());tx.push({id:id++,date:ym+'-'+String(day).padStart(2,'0'),type,amount,cat,note});};
    add(1,'income',4200,'Income','Monthly paycheck');
    if(i%2===0)add(15,'income',120+v*15,'Income','Weekend side job');
    add(1,'expense',1200,'Housing','Rent');
    add(4,'expense',160+v*3,'Food','Groceries');
    add(12,'expense',180-v*2,'Food','Groceries');
    add(21,'expense',180,'Food','Groceries and bakery');
    add(8,'expense',95+v*4,'Utilities','Electric and water');
    add(9,'expense',60,'Utilities','Internet');
    add(10,'expense',45+v*5,'Transport','Gas');
    add(22,'expense',40,'Transport','Bus pass top-up');
    add(14,'expense',35+v*6,'Entertainment','Movie night');
    add(18,'expense',30+(i%3)*20,'Health','Pharmacy');
    add(24,'expense',70+v*10,'Shopping','Kids clothes');
    add(20,'expense',25,'Other','School fundraiser');
    if(i===0)add(25,'expense',85,'Shopping','Winter coat');
  }
  return{open:3000,tx,nid:id,
    limits:{Housing:1250,Food:600,Transport:150,Utilities:180,Entertainment:80,Health:100,Shopping:120,Other:60},
    goals:[{id:1,name:'Emergency fund',target:10000,saved:4200},{id:2,name:'Summer road trip',target:3000,saved:1150},{id:3,name:'New laptop',target:1200,saved:800}]};
}
function load(){try{const r=localStorage.getItem(KEY);if(r){const s=JSON.parse(r);if(s&&Array.isArray(s.tx)&&s.limits&&Array.isArray(s.goals))return s;}}catch(e){}return sample();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
let S=load(),cur=NOW,view='dash';
const nextId=()=>{S.nid=(S.nid||1000)+1;return S.nid;};
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2200);}

function stats(ym){let inc=0,exp=0;const by={};for(const t of S.tx){if(t.date.slice(0,7)!==ym)continue;if(t.type==='income')inc+=t.amount;else{exp+=t.amount;by[t.cat]=(by[t.cat]||0)+t.amount;}}return{inc,exp,by};}
function delta(a,b,goodDown){if(!b)return'<span class="dl">&nbsp;</span>';const p=(a-b)/b*100,up=p>=0,good=goodDown?!up:up;return`<span class="dl ${good?'ok':'bad'}">${up?'▲':'▼'} ${Math.abs(p).toFixed(0)}% vs last month</span>`;}

function renderDash(){
  const s=stats(cur),p=stats(shift(cur,-1));
  const bal=S.open+S.tx.reduce((a,t)=>a+(t.type==='income'?t.amount:-t.amount),0);
  const rate=s.inc?(s.inc-s.exp)/s.inc*100:null,prate=p.inc?(p.inc-p.exp)/p.inc*100:null;
  $('#stats').innerHTML=
   `<div class="stat hero"><small>Total balance</small><div class="big">${money(bal)}</div><small>across all months</small></div>`+
   `<div class="stat"><small>Income in ${mname(cur)}</small><div class="big">${money(s.inc)}</div>${delta(s.inc,p.inc,false)}</div>`+
   `<div class="stat"><small>Spending in ${mname(cur)}</small><div class="big">${money(s.exp)}</div>${delta(s.exp,p.exp,true)}</div>`+
   `<div class="stat"><small>Savings rate</small><div class="big">${rate===null?'—':rate.toFixed(0)+'%'}</div><span class="dl ${rate!==null&&prate!==null?(rate>=prate?'ok':'bad'):''}">${rate!==null&&prate!==null?(rate>=prate?'▲':'▼')+' '+Math.abs(rate-prate).toFixed(0)+' pt(s) vs last month':'&nbsp;'}</span></div>`;
  const ent=Object.entries(s.by).sort((a,b)=>b[1]-a[1]);
  if(!ent.length){$('#donut').innerHTML=`<div class="empty">No spending in ${mname(cur,1)} yet.<br>Add a transaction to see the breakdown.</div>`;}
  else{
    let off=25,c='';
    for(const[k,v]of ent){const pc=v/s.exp*100;c+=`<circle cx="21" cy="21" r="15.9155" fill="none" stroke="${info(k)[1]}" stroke-width="6" stroke-dasharray="${pc} ${100-pc}" stroke-dashoffset="${off}"><title>${k}: ${money(v)}</title></circle>`;off-=pc;}
    $('#donut').innerHTML=`<div class="donut"><svg viewBox="0 0 42 42" role="img" aria-label="Spending by category"><circle cx="21" cy="21" r="15.9155" fill="none" stroke="#e6ead6" stroke-width="6"/>${c}<text x="21" y="22" text-anchor="middle" class="ctr">${money0(s.exp)}</text><text x="21" y="26.5" text-anchor="middle" class="ctr ctr2">spent</text></svg><ul class="leg">${ent.map(([k,v])=>`<li><span class="dot" style="background:${info(k)[1]}"></span>${info(k)[0]} ${k}<b>${money0(v)}</b></li>`).join('')}</ul></div>`;
  }
  const ms=[];for(let i=5;i>=0;i--)ms.push(shift(cur,-i));
  const d=ms.map(stats),mx=Math.max(1,...d.flatMap(x=>[x.inc,x.exp]));
  let h='<svg viewBox="0 0 420 195" role="img" aria-label="Income and spending, last 6 months">';
  ms.forEach((m,i)=>{const x=i*70+12,hi=d[i].inc/mx*140,he=d[i].exp/mx*140;
    h+=`<rect x="${x}" y="${160-hi}" width="26" height="${hi}" rx="5" fill="#2f7f79"><title>${mname(m)} income ${money0(d[i].inc)}</title></rect><rect x="${x+29}" y="${160-he}" width="26" height="${he}" rx="5" fill="#e8a622"><title>${mname(m)} spending ${money0(d[i].exp)}</title></rect><text x="${x+28}" y="180" text-anchor="middle" class="ax${m===cur?' cur':''}">${mname(m)}</text>`;});
  $('#bars').innerHTML=h+'<line x1="0" y1="160" x2="420" y2="160" stroke="#d9dfc9"/></svg>';
}

function filtered(){
  const q=$('#q').value.trim().toLowerCase(),c=$('#fc').value,ty=$('#ft').value,all=$('#fall').checked;
  return S.tx.filter(t=>(all||t.date.slice(0,7)===cur)&&(!c||t.cat===c)&&(!ty||t.type===ty)&&(!q||(t.note+' '+t.cat).toLowerCase().includes(q)))
    .sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
}
function renderTx(){
  const l=filtered();let i=0,e=0;l.forEach(t=>t.type==='income'?i+=t.amount:e+=t.amount);
  $('#txsum').textContent=`${l.length} transaction${l.length===1?'':'s'} · income ${money(i)} · spending ${money(e)}`;
  $('#list').innerHTML=l.length?l.map(t=>{const[ic,col]=info(t.cat);
    return`<div class="tx" data-id="${t.id}"><div class="ic" style="background:${col}22">${ic}</div><div class="m"><b>${esc(t.note||t.cat)}</b><span>${t.cat} · ${new Date(t.date+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span></div><div class="amt ${t.type==='income'?'in':''}">${t.type==='income'?'+':'-'}${money(t.amount)}</div><button class="sm" data-act="edit" aria-label="Edit">✏️</button><button class="sm" data-act="del" aria-label="Delete">🗑️</button></div>`;}).join('')
    :'<div class="empty">Nothing matches. Try clearing the filters or add a new transaction.</div>';
}

function renderBud(){
  const st=stats(cur);let over=0,lim=0;
  $('#blist').innerHTML=Object.keys(CATS).map(c=>{
    const l=S.limits[c]||0,sp=st.by[c]||0,p=l?sp/l*100:0;lim+=l;
    const cls=!l?'':p>100?'over':p>=85?'warn':'';if(cls==='over')over++;
    const msg=!l?'No limit set':p>100?`⚠ Over budget by ${money(sp-l)}`:p>=85?`Close to the limit · ${money(l-sp)} left`:`${money(l-sp)} left`;
    return`<div class="brow ${cls}"><div><div class="n"><div class="ic" style="background:${CATS[c][1]}22">${CATS[c][0]}</div><div><b>${c}</b><div class="note">${money(sp)} of ${money(l)} · ${msg}</div></div></div><div class="track" style="margin-top:8px"><i style="width:${Math.min(100,p)}%"></i></div></div><input type="number" min="0" step="10" value="${l}" data-cat="${c}" aria-label="${c} monthly limit"></div>`;}).join('');
  $('#bsum').textContent=(over?`⚠ ${over} categor${over>1?'ies are':'y is'} over budget in ${mname(cur,1)}. `:`All categories are within budget in ${mname(cur,1)}. `)+`Spent ${money(Object.values(st.by).reduce((a,b)=>a+b,0))} of ${money(lim)} in total limits.`;
}

function renderGoals(){
  $('#glist').innerHTML=S.goals.length?S.goals.map(g=>{const p=Math.min(100,g.saved/g.target*100);
    return`<div class="card goal" data-id="${g.id}"><h2>${esc(g.name)}</h2><div class="big">${money0(g.saved)} <small style="font-size:.9rem;color:var(--mut)">of ${money0(g.target)}</small></div><div class="track"><i style="width:${p}%"></i></div><div class="note">${p>=100?'🎉 Goal reached!':p.toFixed(0)+'% saved · '+money0(g.target-g.saved)+' to go'}</div><div class="row2"><input type="number" min="1" step="1" placeholder="Add $" aria-label="Amount to add"><button class="btn pri" data-act="gadd">Add</button><button class="btn" data-act="gdel" aria-label="Delete goal">🗑️</button></div></div>`;}).join('')
    :'<div class="card empty">No goals yet. Create one to start tracking.</div>';
}

function render(){
  $('#ml').textContent=mname(cur,1);$('#next').disabled=cur>=NOW;
  renderDash();renderTx();renderBud();renderGoals();
}
function show(v){view=v;document.querySelectorAll('.view').forEach(s=>s.hidden=s.id!=='v-'+v);document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));window.scrollTo(0,0);}

/* transaction dialog */
let editId=null;
const typeVal=()=>document.querySelector('input[name=type]:checked').value;
function syncCat(){const inc=typeVal()==='income';$('#fcat').disabled=inc;if(inc)$('#fcat').value='Income';else if($('#fcat').value==='Income')$('#fcat').value='Food';}
function openTx(t){
  editId=t?t.id:null;$('#dt').textContent=t?'Edit transaction':'Add transaction';
  document.querySelector(`input[name=type][value=${t?t.type:'expense'}]`).checked=true;
  $('#fa').value=t?t.amount:'';$('#fd').value=t?t.date:(cur===NOW?todayStr():cur+'-01');
  $('#fcat').value=t?t.cat:'Food';$('#fn').value=t?t.note:'';syncCat();$('#dlg').showModal();
}
$('#tf').addEventListener('submit',e=>{
  e.preventDefault();const amount=Math.round(parseFloat($('#fa').value)*100)/100;
  if(!(amount>0)||!$('#fd').value)return;
  const inc=typeVal()==='income',rec={type:inc?'income':'expense',amount,date:$('#fd').value,cat:inc?'Income':$('#fcat').value,note:$('#fn').value.trim()};
  if(editId){Object.assign(S.tx.find(t=>t.id===editId),rec);toast('Transaction updated');}
  else{S.tx.push({id:nextId(),...rec});toast('Transaction added');}
  save();$('#dlg').close();cur=rec.date.slice(0,7)>NOW?NOW:rec.date.slice(0,7);render();
});
document.querySelectorAll('input[name=type]').forEach(r=>r.addEventListener('change',syncCat));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));

/* wiring */
const catOpts=Object.keys(CATS).map(c=>`<option>${c}</option>`).join('');
$('#fcat').innerHTML=catOpts+'<option hidden>Income</option>';
$('#fc').innerHTML='<option value="">All categories</option>'+catOpts+'<option>Income</option>';
document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>show(b.dataset.v)));
$('#prev').onclick=()=>{cur=shift(cur,-1);render();};
$('#next').onclick=()=>{if(cur<NOW){cur=shift(cur,1);render();}};
$('#add').onclick=()=>openTx();
['q','fc','ft','fall'].forEach(id=>$('#'+id).addEventListener('input',renderTx));
$('#list').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const id=+b.closest('.tx').dataset.id,t=S.tx.find(x=>x.id===id);
  if(b.dataset.act==='edit')openTx(t);
  else if(confirm('Delete "'+(t.note||t.cat)+'"?')){S.tx=S.tx.filter(x=>x.id!==id);save();render();toast('Transaction deleted');}
});
$('#csv').onclick=()=>{
  const rows=[['Date','Type','Category','Amount','Note'],...S.tx.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(t=>[t.date,t.type,t.cat,t.amount.toFixed(2),t.note])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download='hearth-transactions.csv';
  document.body.appendChild(a);a.click();a.remove();toast('CSV exported');
};
$('#reset').onclick=()=>{if(confirm('Replace everything with the sample family data?')){S=sample();save();render();toast('Sample data restored');}};
$('#blist').addEventListener('change',e=>{const c=e.target.dataset.cat;if(!c)return;S.limits[c]=Math.max(0,parseFloat(e.target.value)||0);save();renderBud();toast(c+' limit saved');});
$('#gnew').onclick=()=>{$('#gf').reset();$('#gdlg').showModal();};
$('#gf').addEventListener('submit',e=>{
  e.preventDefault();const target=parseFloat($('#gt').value),saved=Math.max(0,parseFloat($('#gs').value)||0);if(!(target>0))return;
  S.goals.push({id:nextId(),name:$('#gn').value.trim(),target,saved});save();$('#gdlg').close();renderGoals();toast('Goal created');
});
$('#glist').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const card=b.closest('.goal'),g=S.goals.find(x=>x.id===+card.dataset.id);
  if(b.dataset.act==='gdel'){if(confirm('Delete goal "'+g.name+'"?')){S.goals=S.goals.filter(x=>x!==g);save();renderGoals();toast('Goal deleted');}}
  else{const v=parseFloat(card.querySelector('input').value);if(v>0){g.saved+=v;save();renderGoals();toast('Added '+money(v)+' to '+g.name);}}
});
$('#glist').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT')e.target.closest('.goal').querySelector('[data-act=gadd]').click();});
render();
