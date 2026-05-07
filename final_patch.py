from pathlib import Path
p=Path('/mnt/data/workfix/index.html')
s=p.read_text()
patch=r'''

<!-- ===== YNEA PATCH FINAL ESTABLE: navegación calendario + login sin parpadeo ===== -->
<style id="ynea-final-stable-calendar-css">
/* Ocultar todos los intentos anteriores de navegación duplicada */
.ynea-ultra-nav,
.ynea-mobile-nav-def,
[id^="yneaMobileNav"],
.ynea-rescate-actions,
.ynea-final-actions,
.ynea-cal-row.actions{
  display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;
}
/* Ocultar botones originales dentro de weekbar: usamos una única barra estable */
#semanaView .weekbar > button,
#mensualView .weekbar > button{display:none!important;}

#semanaView .weekbar,
#mensualView .weekbar{
  display:grid!important;
  align-items:end!important;
  gap:8px!important;
  width:100%!important;
  margin:6px 0 6px!important;
  visibility:visible!important;
  opacity:1!important;
  overflow:visible!important;
}
#semanaView .weekbar > div,
#mensualView .weekbar > div{min-width:0!important;width:100%!important;}
#semanaView .weekbar label,
#mensualView .weekbar label{font-size:12px!important;font-weight:800!important;color:#64748b!important;margin:0 0 4px!important;line-height:1.1!important;white-space:nowrap!important;}
#semanaView .weekbar input,
#semanaView .weekbar select,
#mensualView .weekbar input,
#mensualView .weekbar select{background:#fff!important;border:1px solid #dbe3ee!important;color:#0f172a!important;border-radius:10px!important;box-shadow:none!important;}
.ynea-hidden-real-picker{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;}
.ynea-display-picker{width:100%!important;text-align:left!important;background:#fff!important;border:1px solid #dbe3ee!important;color:#0f172a!important;border-radius:10px!important;box-shadow:none!important;font-weight:700!important;}

.ynea-master-nav{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:8px!important;
  width:100%!important;
  margin:6px 0 10px!important;
  visibility:visible!important;
  opacity:1!important;
  height:auto!important;
  min-height:0!important;
  overflow:visible!important;
}
.ynea-master-nav button{
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:1px!important;
  background:#fff!important;
  color:#0f172a!important;
  border:1px solid #dbe3ee!important;
  box-shadow:none!important;
  border-radius:12px!important;
  min-height:46px!important;
  padding:6px 4px!important;
  font-weight:800!important;
}
.ynea-master-nav button:hover{background:#f8fafc!important;color:#0f172a!important;}
.ynea-master-nav .main{font-size:13px!important;line-height:1.05!important;}
.ynea-master-nav .sub{font-size:11px!important;line-height:1.05!important;color:#64748b!important;font-weight:700!important;}

@media(min-width:901px){
  #semanaView .weekbar{grid-template-columns:180px minmax(190px,1fr) minmax(220px,1fr)!important;max-width:850px!important;}
  #mensualView .weekbar{grid-template-columns:180px minmax(260px,1fr)!important;max-width:560px!important;}
  .ynea-master-nav{max-width:560px!important;}
}
@media(max-width:900px){
  #semanaView .weekbar{grid-template-columns:.9fr 1fr 1fr!important;gap:5px!important;margin:4px 0 4px!important;}
  #mensualView .weekbar{grid-template-columns:.9fr 1.1fr!important;gap:5px!important;margin:4px 0 4px!important;}
  #semanaView .weekbar label,#mensualView .weekbar label{font-size:9px!important;margin:0 0 2px!important;}
  #semanaView .weekbar input,#semanaView .weekbar select,#mensualView .weekbar input,#mensualView .weekbar select,.ynea-display-picker{height:30px!important;min-height:30px!important;font-size:10.5px!important;padding:4px 5px!important;border-radius:9px!important;}
  .ynea-master-nav{gap:5px!important;margin:4px 0 7px!important;}
  .ynea-master-nav button{min-height:42px!important;border-radius:10px!important;padding:4px 2px!important;}
  .ynea-master-nav .main{font-size:11px!important;}
  .ynea-master-nav .sub{font-size:9px!important;}
}
/* Evita que la app se vea detrás del login durante carga */
html.ynea-locked body > *:not(#yneaLoginOverlay){visibility:hidden!important;pointer-events:none!important;user-select:none!important;}
html.ynea-locked #yneaLoginOverlay,html.ynea-locked #yneaLoginOverlay *{visibility:visible!important;pointer-events:auto!important;}
</style>
<script id="ynea-final-stable-calendar-js">
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const pad=n=>String(n).padStart(2,'0');
  const esc=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function parseDate(v){if(v&&/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v+'T12:00:00'); return new Date();}
  function monday(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x;}
  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
  function fmt(d){return pad(d.getDate())+'/'+pad(d.getMonth()+1);}
  function weekLabel(v){const m=monday(parseDate(v));return fmt(m)+' - '+fmt(addDays(m,4));}
  function monthLabel(v,shift){
    let d=new Date();
    if(v&&/^\d{4}-\d{2}$/.test(v)){const [y,m]=v.split('-').map(Number);d=new Date(y,m-1,1);}
    d=new Date(d.getFullYear(),d.getMonth()+(shift||0),1);
    return d.toLocaleDateString('es-ES',{month:'short',year:'2-digit'}).replace(/\./g,'');
  }
  function opts(list,all,selected){
    let out=all||'';
    (list||[]).forEach(x=>{x=String(x||'').trim(); if(x) out+='<option value="'+esc(x)+'" '+(x===selected?'selected':'')+'>'+esc(x)+'</option>';});
    return out;
  }
  function dataObj(){try{return window.data||data;}catch(e){return {profesionales:[],consultas:[]};}}
  function navButton(text,sub,action){return '<button type="button" onclick="'+action+'; setTimeout(window.yneaFinalCalendarSync,20); setTimeout(window.yneaFinalCalendarSync,180);"><span class="main">'+text+'</span><span class="sub">'+esc(sub)+'</span></button>';}
  function ensureWeek(){
    const view=$('semanaView'); if(!view) return;
    const d=dataObj();
    const oldProf=$('weekProf')?.value||'';
    const oldCons=$('weekConsulta')?.value||'';
    let wv=$('weekPicker')?.value || (typeof window.weekStart!=='undefined' ? iso(window.weekStart) : iso(monday(new Date())));
    wv=iso(monday(parseDate(wv)));
    let bar=view.querySelector('.weekbar'); if(!bar){bar=document.createElement('div');bar.className='weekbar';view.querySelector('.card')?.insertBefore(bar,view.querySelector('#weekTitle'));}
    if(!bar.dataset.yneaFinalStable){
      bar.dataset.yneaFinalStable='1';
      bar.innerHTML='<div><label>Semana</label><input class="ynea-hidden-real-picker" type="date" id="weekPicker"><button type="button" class="ynea-display-picker" id="weekPickerDisplay">'+weekLabel(wv)+'</button></div><div><label>Consulta</label><select id="weekConsulta" onchange="renderAll()"></select></div><div><label>Profesional</label><select id="weekProf" onchange="renderAll()"></select></div>';
      $('weekPickerDisplay').onclick=function(){const p=$('weekPicker'); if(p&&p.showPicker) p.showPicker(); else if(p) p.click();};
      $('weekPicker').onchange=function(){try{ if(typeof setWeekFromDate==='function') setWeekFromDate(this.value); else window.weekStart=monday(parseDate(this.value)); }catch(e){} sync();};
    }
    if($('weekPicker')) $('weekPicker').value=wv;
    if($('weekPickerDisplay')) $('weekPickerDisplay').textContent=weekLabel(wv);
    if($('weekConsulta')) $('weekConsulta').innerHTML=opts(d.consultas||[],'<option value="">Todas</option>',oldCons);
    if($('weekProf')) $('weekProf').innerHTML=opts(d.profesionales||[],'<option value="">Todos</option>',oldProf);
    let nav=$('yneaMasterWeekNav'); if(!nav){nav=document.createElement('div');nav.id='yneaMasterWeekNav';nav.className='ynea-master-nav';bar.parentNode.insertBefore(nav,bar.nextSibling);} 
    const current=parseDate(wv);
    nav.innerHTML=navButton('Anterior',weekLabel(iso(addDays(current,-7))),'moveWeek(-1)')+navButton('Actual',weekLabel(iso(new Date())),'goThisWeek()')+navButton('Siguiente',weekLabel(iso(addDays(current,7))),'moveWeek(1)');
  }
  function ensureMonth(){
    const view=$('mensualView'); if(!view) return;
    const d=dataObj();
    const oldProf=$('monthProf')?.value||'';
    let mv=$('monthPicker')?.value || (new Date().toISOString().slice(0,7));
    let bar=view.querySelector('.weekbar'); if(!bar){bar=document.createElement('div');bar.className='weekbar';view.querySelector('.card')?.insertBefore(bar,view.querySelector('#monthTitle'));}
    if(!bar.dataset.yneaFinalStable){
      bar.dataset.yneaFinalStable='1';
      bar.innerHTML='<div><label>Mes</label><input type="month" id="monthPicker" onchange="renderAll()"></div><div><label>Profesional</label><select id="monthProf" onchange="renderAll()"></select></div>';
    }
    if($('monthPicker')) $('monthPicker').value=mv;
    if($('monthProf')) $('monthProf').innerHTML=opts(d.profesionales||[],'<option value="">Todos</option>',oldProf);
    let nav=$('yneaMasterMonthNav'); if(!nav){nav=document.createElement('div');nav.id='yneaMasterMonthNav';nav.className='ynea-master-nav';bar.parentNode.insertBefore(nav,bar.nextSibling);} 
    nav.innerHTML=navButton('Anterior',monthLabel(mv,-1),'moveMonth(-1)')+navButton('Actual',monthLabel('',0),'goThisMonth()')+navButton('Siguiente',monthLabel(mv,1),'moveMonth(1)');
  }
  function sync(){
    try{document.querySelectorAll('.ynea-ultra-nav,.ynea-mobile-nav-def,[id^="yneaMobileNav"],.ynea-rescate-actions,.ynea-final-actions,.ynea-cal-row.actions').forEach(el=>{el.style.display='none';});}catch(e){}
    ensureWeek(); ensureMonth();
    if(!sessionStorage.getItem('yneaCurrentUser') && !$('yneaLoginOverlay')) document.documentElement.classList.add('ynea-locked');
  }
  window.yneaFinalCalendarSync=sync;
  const oldRenderAll=window.renderAll;
  window.renderAll=function(){
    sync();
    const r=oldRenderAll?oldRenderAll.apply(this,arguments):undefined;
    setTimeout(sync,0);setTimeout(sync,120);setTimeout(sync,400);
    return r;
  };
  const oldSetView=window.setView;
  window.setView=function(){
    const r=oldSetView?oldSetView.apply(this,arguments):undefined;
    setTimeout(sync,0);setTimeout(sync,120);setTimeout(sync,400);
    return r;
  };
  document.addEventListener('DOMContentLoaded',()=>{document.documentElement.classList.add('ynea-locked');setTimeout(sync,20);setTimeout(sync,300);setTimeout(sync,900);});
  document.addEventListener('change',e=>{if(e.target&&['weekPicker','weekProf','weekConsulta','monthPicker','monthProf'].includes(e.target.id)) setTimeout(sync,30);},true);
  window.addEventListener('resize',()=>setTimeout(sync,80));
  setInterval(sync,900);
})();
</script>
'''
# append before </body> after all scripts
s=s.replace('</body>', patch+'\n</body>')
p.write_text(s)
