from pathlib import Path
p=Path('/mnt/data/repair_final/index.html')
s=p.read_text()
patch=r'''

<style id="ynea-rescate-final-css">
  #weekBar select,#monthBar select,#profesionalCita,#consultaCita,#tipoCita{pointer-events:auto!important;opacity:1!important;visibility:visible!important;display:block!important;min-height:36px!important;}
  #weekBar,#monthBar{width:100%!important;max-width:100%!important;box-sizing:border-box!important;overflow:visible!important;}
  .ynea-rescate-top{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:6px!important;align-items:end!important;margin-bottom:6px!important;}
  .ynea-rescate-field{min-width:0!important;}
  .ynea-rescate-field label{display:block!important;font-size:11px!important;font-weight:700!important;color:#475569!important;margin-bottom:2px!important;}
  .ynea-rescate-field select,.ynea-rescate-field input{width:100%!important;min-width:0!important;box-sizing:border-box!important;font-size:12px!important;padding:7px 6px!important;border-radius:10px!important;background:#fff!important;border:1px solid #dbe3ef!important;color:#0f172a!important;}
  .ynea-rescate-actions{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:6px!important;margin-bottom:8px!important;}
  .ynea-rescate-actions button{width:100%!important;min-width:0!important;padding:8px 4px!important;font-size:12px!important;white-space:nowrap!important;}
  #weekTable,#monthTable{width:100%!important;table-layout:fixed!important;max-width:100%!important;}
  #weekTable th,#weekTable td,#monthTable th,#monthTable td{box-sizing:border-box!important;min-width:0!important;overflow:hidden!important;}
  @media(max-width:700px){
    body{max-width:100vw!important;overflow-x:hidden!important;}
    .container,.card,.view{max-width:100%!important;overflow-x:hidden!important;box-sizing:border-box!important;}
    #weekTable th:first-child,#weekTable td.time{width:28px!important;max-width:28px!important;font-size:8px!important;padding:1px!important;}
    #weekTable th:not(:first-child),#weekTable td.slot{width:calc((100% - 28px)/5)!important;padding:1px!important;font-size:8px!important;}
    #weekTable .appt{font-size:7.5px!important;line-height:1.08!important;padding:2px!important;margin:0!important;border-radius:5px!important;}
    #weekTable .appt strong{font-size:7.5px!important;}
    #weekTable .appt span{display:block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
    #monthTable th,#monthTable td{width:20%!important;max-width:20%!important;padding:2px!important;font-size:8px!important;vertical-align:top!important;}
    #monthTable .appt{font-size:7px!important;line-height:1.05!important;padding:2px!important;margin-top:2px!important;border-radius:5px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
    #monthTable .appt span,#monthTable .appt br{display:none!important;}
  }
</style>
<script id="ynea-rescate-final-js">
(function(){
  function q(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function uniq(a){return [...new Set((a||[]).map(x=>String(x||'').trim()).filter(Boolean))]}
  function arr(name){ if(!window.data) window.data={}; if(!Array.isArray(window.data[name])) window.data[name]=[]; return window.data[name]; }
  function norm(){
    arr('profesionales'); arr('consultas'); arr('tipos'); arr('citas'); arr('pacientes');
    window.data.profesionales=uniq(window.data.profesionales);
    window.data.consultas=uniq(window.data.consultas);
    window.data.tipos=uniq(window.data.tipos);
    if(!window.data.consultas.length) window.data.consultas=['Consulta 1'];
    if(!window.data.tipos.length) window.data.tipos=['General'];
    window.data.tiposPorProfesional={};
    window.data.profesionales.forEach(function(p){window.data.tiposPorProfesional[p]=window.data.tipos.slice();});
    return window.data;
  }
  function options(list,first,current){
    var html=first||'';
    uniq(list).forEach(function(x){html+='<option value="'+esc(x)+'">'+esc(x)+'</option>';});
    return html;
  }
  function setSelect(id,list,first,current){
    var el=q(id); if(!el) return;
    var val=current!==undefined?current:el.value;
    el.disabled=false; el.style.pointerEvents='auto'; el.style.opacity='1';
    el.innerHTML=options(list,first,val);
    if([...el.options].some(o=>o.value===val)) el.value=val;
    else if([...el.options].some(o=>o.value==='')) el.value='';
    else if(el.options.length) el.selectedIndex=0;
  }
  function iso(d){var x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)}
  function monday(d){var x=new Date(d);var day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x}
  function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
  function fmt(d){return d.toLocaleDateString('es-ES',{weekday:'short',day:'2-digit',month:'2-digit'})}
  function pacienteNombre(id){var p=(window.data?.pacientes||[]).find(p=>String(p.id)===String(id))||{};return p.nombre||'Paciente'}
  function color(str){
    var pal=['#FDE2E4','#E2F0CB','#CDE7F0','#FFF1C1','#E8DFF5','#D1F0E0','#FAD2E1','#D7E3FC'];
    var s=String(str||'Consulta');var n=0;for(var i=0;i<s.length;i++)n=(n+s.charCodeAt(i))%pal.length;return pal[n];
  }
  window.tiposPermitidosParaProfesional=function(){norm();return window.data.tipos.slice();};
  window.tiposPermitidosParaNuevaCita=function(){norm();return window.data.tipos.slice();};
  window.actualizarTiposNuevaCita=function(){norm();setSelect('tipoCita',window.data.tipos,'',q('tipoCita')?.value||'');};
  function ensureBars(){
    var d=norm();
    var ws=(window.__yneaWeekState=window.__yneaWeekState||{});
    var ms=(window.__yneaMonthState=window.__yneaMonthState||{});
    ws.prof=q('weekProf')?.value ?? ws.prof ?? '';
    ws.cons=q('weekConsulta')?.value ?? ws.cons ?? '';
    ms.prof=q('monthProf')?.value ?? ms.prof ?? '';
    ms.cons=q('monthConsulta')?.value ?? ms.cons ?? '';
    var weekBar=q('weekBar');
    if(weekBar){
      var wv=q('weekPicker')?.value || iso(window.weekStart||monday(new Date()));
      weekBar.innerHTML='<div class="ynea-rescate-top"><div class="ynea-rescate-field"><label>Semana</label><input type="date" id="weekPicker" value="'+esc(wv)+'"></div><div class="ynea-rescate-field"><label>Profesional</label><select id="weekProf"></select></div><div class="ynea-rescate-field"><label>Consulta</label><select id="weekConsulta"></select></div></div><div class="ynea-rescate-actions"><button class="secondary" type="button" id="yneaPrevWeek">Anterior</button><button class="secondary" type="button" id="yneaThisWeek">Actual</button><button class="secondary" type="button" id="yneaNextWeek">Siguiente</button></div>';
      setSelect('weekProf',d.profesionales,'<option value="">Todos</option>',ws.prof);
      setSelect('weekConsulta',d.consultas,'<option value="">Todas</option>',ws.cons);
      q('weekPicker').onchange=function(){window.weekStart=monday(new Date(this.value)); window.renderAll();};
      q('weekProf').onchange=function(){window.__yneaWeekState.prof=this.value; window.renderAll();};
      q('weekConsulta').onchange=function(){window.__yneaWeekState.cons=this.value; window.renderAll();};
      q('yneaPrevWeek').onclick=function(){window.weekStart=addDays(window.weekStart||monday(new Date()),-7); window.renderAll();};
      q('yneaThisWeek').onclick=function(){window.weekStart=monday(new Date()); window.renderAll();};
      q('yneaNextWeek').onclick=function(){window.weekStart=addDays(window.weekStart||monday(new Date()),7); window.renderAll();};
    }
    var monthBar=q('monthBar');
    if(monthBar){
      var mv=q('monthPicker')?.value || new Date().toISOString().slice(0,7);
      monthBar.innerHTML='<div class="ynea-rescate-top"><div class="ynea-rescate-field"><label>Mes</label><input type="month" id="monthPicker" value="'+esc(mv)+'"></div><div class="ynea-rescate-field"><label>Profesional</label><select id="monthProf"></select></div><div class="ynea-rescate-field"><label>Consulta</label><select id="monthConsulta"></select></div></div><div class="ynea-rescate-actions"><button class="secondary" type="button" id="yneaPrevMonth">Anterior</button><button class="secondary" type="button" id="yneaThisMonth">Actual</button><button class="secondary" type="button" id="yneaNextMonth">Siguiente</button></div>';
      setSelect('monthProf',d.profesionales,'<option value="">Todos</option>',ms.prof);
      setSelect('monthConsulta',d.consultas,'<option value="">Todas</option>',ms.cons);
      q('monthPicker').onchange=function(){window.renderAll();};
      q('monthProf').onchange=function(){window.__yneaMonthState.prof=this.value; window.renderAll();};
      q('monthConsulta').onchange=function(){window.__yneaMonthState.cons=this.value; window.renderAll();};
      q('yneaPrevMonth').onclick=function(){var parts=(q('monthPicker').value||new Date().toISOString().slice(0,7)).split('-');var dt=new Date(Number(parts[0]),Number(parts[1])-2,1);q('monthPicker').value=dt.toISOString().slice(0,7);window.renderAll();};
      q('yneaThisMonth').onclick=function(){q('monthPicker').value=new Date().toISOString().slice(0,7);window.renderAll();};
      q('yneaNextMonth').onclick=function(){var parts=(q('monthPicker').value||new Date().toISOString().slice(0,7)).split('-');var dt=new Date(Number(parts[0]),Number(parts[1]),1);q('monthPicker').value=dt.toISOString().slice(0,7);window.renderAll();};
    }
    setSelect('profesionalCita',d.profesionales,'',q('profesionalCita')?.value||'');
    setSelect('consultaCita',d.consultas,'',q('consultaCita')?.value||'');
    setSelect('tipoCita',d.tipos,'',q('tipoCita')?.value||'');
  }
  var oldRefresh=window.refreshAllSelects;
  window.refreshAllSelects=function(){
    var keep={wp:q('weekProf')?.value||'', wc:q('weekConsulta')?.value||'', mp:q('monthProf')?.value||'', mc:q('monthConsulta')?.value||'', pc:q('profesionalCita')?.value||'', cc:q('consultaCita')?.value||'', tc:q('tipoCita')?.value||''};
    try{ if(typeof oldRefresh==='function') oldRefresh.apply(this,arguments); }catch(e){console.warn('refresh anterior ignorado',e)}
    window.__yneaWeekState={prof:keep.wp,cons:keep.wc}; window.__yneaMonthState={prof:keep.mp,cons:keep.mc};
    ensureBars(); setSelect('profesionalCita',window.data.profesionales,'',keep.pc); setSelect('consultaCita',window.data.consultas,'',keep.cc); setSelect('tipoCita',window.data.tipos,'',keep.tc);
  };
  window.renderWeek=function(){
    var d=norm(); ensureBars(); var table=q('weekTable'); if(!table) return;
    var prof=q('weekProf')?.value||''; var consulta=q('weekConsulta')?.value||'';
    var start=window.weekStart||monday(new Date(q('weekPicker')?.value||new Date())); window.weekStart=start; if(q('weekPicker')) q('weekPicker').value=iso(start);
    var days=[0,1,2,3,4].map(n=>addDays(start,n)); if(q('weekTitle')) q('weekTitle').textContent=(consulta||'Todas las consultas')+' · '+(prof||'Todos los profesionales')+' · '+days[0].toLocaleDateString('es-ES')+' - '+days[4].toLocaleDateString('es-ES');
    var hs=window.horas||['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','16:00','16:30','17:00','17:30','18:00'];
    var html='<thead><tr><th>Hora</th>'+days.map(x=>'<th>'+esc(fmt(x))+'</th>').join('')+'</tr></thead><tbody>';
    hs.forEach(function(h){html+='<tr><td class="time">'+esc(h)+'</td>';days.forEach(function(day){var fecha=iso(day);var citas=(d.citas||[]).filter(c=>String(c.fecha)===fecha && String(c.hora)===String(h) && (!prof||String(c.profesional)===prof) && (!consulta||String(c.consulta)===consulta));if(citas.length){var c=citas[0];html+='<td class="slot"><div class="appt" onclick="event.stopPropagation(); if(window.abrirEditorCita) abrirEditorCita('+Number(c.id)+')" style="background:'+color(c.consulta)+'!important;border:1px solid rgba(15,23,42,.12)!important;cursor:pointer"><strong>'+esc(pacienteNombre(c.pacienteId))+'</strong><span>'+esc(c.profesional||'')+'</span><span>'+esc(c.tipo||'')+' · '+esc(c.consulta||'')+'</span></div></td>';}else{html+='<td class="slot" onclick="window.quickNewCitaConsulta&&quickNewCitaConsulta(\''+fecha+'\',\''+esc(h)+'\',\''+esc(consulta)+'\')" style="cursor:pointer;color:#cbd5e1;text-align:center">+</td>';}});html+='</tr>';});
    table.innerHTML=html+'</tbody>';
  };
  window.renderMonthView=function(){
    var d=norm(); ensureBars(); var table=q('monthTable'); if(!table) return;
    var mv=q('monthPicker')?.value||new Date().toISOString().slice(0,7); var parts=mv.split('-'); var yy=Number(parts[0]), mm=Number(parts[1])-1;
    var prof=q('monthProf')?.value||''; var consulta=q('monthConsulta')?.value||''; var first=new Date(yy,mm,1), last=new Date(yy,mm+1,0), cur=monday(first);
    if(q('monthTitle')) q('monthTitle').textContent=(consulta||'Todas las consultas')+' · '+(prof||'Todos los profesionales')+' · '+first.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    var html='<thead><tr><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th></tr></thead><tbody>';
    for(var w=0;w<6;w++){html+='<tr>';for(var i=0;i<5;i++){var day=addDays(cur,i);var fecha=iso(day);var inM=day.getMonth()===mm;var citas=(d.citas||[]).filter(c=>String(c.fecha)===fecha && (!prof||String(c.profesional)===prof) && (!consulta||String(c.consulta)===consulta)).sort((a,b)=>String(a.hora||'').localeCompare(String(b.hora||'')));html+='<td class="slot" style="background:'+(inM?'#fff':'#f8fafc')+'!important"><strong>'+day.getDate()+'</strong>';citas.slice(0,3).forEach(function(c){html+='<div class="appt" onclick="event.stopPropagation(); if(window.abrirEditorCita) abrirEditorCita('+Number(c.id)+')" style="background:'+color(c.consulta)+'!important;border:1px solid rgba(15,23,42,.12)!important;cursor:pointer"><strong>'+esc(c.hora||'')+' '+esc(pacienteNombre(c.pacienteId))+'</strong><br><span>'+esc(c.profesional||'')+' · '+esc(c.consulta||'')+'</span></div>';}); if(citas.length>3) html+='<small>+'+(citas.length-3)+'</small>'; html+='</td>';}html+='</tr>';cur=addDays(cur,7);if(cur>last && cur.getMonth()!==mm) break;}
    table.innerHTML=html+'</tbody>';
  };
  var oldQuick=window.quickNewCitaConsulta;
  window.quickNewCitaConsulta=function(fecha,hora,consulta){
    // Mantener calendario visible; solo prepara el formulario de cita.
    if(q('fechaCita')) q('fechaCita').value=fecha;
    if(q('horaCita')) q('horaCita').value=hora;
    if(q('consultaCita') && consulta) q('consultaCita').value=consulta;
    var prof=q('weekProf')?.value||q('monthProf')?.value||''; if(q('profesionalCita')&&prof) q('profesionalCita').value=prof;
    window.actualizarTiposNuevaCita();
    var box=q('citaForm')||q('agendaView'); if(box&&box.scrollIntoView) box.scrollIntoView({behavior:'smooth',block:'start'});
  };
  window.renderAll=function(){
    norm(); ensureBars();
    try{ if(q('statCitas')) q('statCitas').textContent=(window.data.citas||[]).length; if(q('statPacientes')) q('statPacientes').textContent=(window.data.pacientes||[]).length; if(q('statProfs')) q('statProfs').textContent=(window.data.profesionales||[]).length; if(q('statConsultas')) q('statConsultas').textContent=(window.data.consultas||[]).length; }catch(e){}
    try{window.renderWeek();}catch(e){console.warn(e)}
    try{window.renderMonthView();}catch(e){console.warn(e)}
    try{if(typeof window.renderYearView==='function') window.renderYearView();}catch(e){}
    try{if(typeof window.renderPatients==='function') window.renderPatients();}catch(e){}
    try{window.actualizarTiposNuevaCita();}catch(e){}
  };
  document.addEventListener('change',function(ev){
    if(!ev.target) return;
    if(ev.target.id==='weekProf') window.__yneaWeekState={...(window.__yneaWeekState||{}),prof:ev.target.value};
    if(ev.target.id==='weekConsulta') window.__yneaWeekState={...(window.__yneaWeekState||{}),cons:ev.target.value};
    if(ev.target.id==='monthProf') window.__yneaMonthState={...(window.__yneaMonthState||{}),prof:ev.target.value};
    if(ev.target.id==='monthConsulta') window.__yneaMonthState={...(window.__yneaMonthState||{}),cons:ev.target.value};
    if(['weekProf','weekConsulta','monthProf','monthConsulta','weekPicker','monthPicker'].includes(ev.target.id)){setTimeout(window.renderAll,0);}
    if(ev.target.id==='profesionalCita') setTimeout(window.actualizarTiposNuevaCita,0);
  },true);
  document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){try{window.refreshAllSelects();window.renderAll();}catch(e){console.warn(e)}},300);setTimeout(function(){try{window.refreshAllSelects();window.renderAll();}catch(e){}},1500);});
  setTimeout(function(){try{window.refreshAllSelects();window.renderAll();}catch(e){}},500);
})();
</script>
'''
if '</body>' in s:
    s=s.replace('</body>', patch+'\n</body>')
else:
    s+=patch
p.write_text(s)
