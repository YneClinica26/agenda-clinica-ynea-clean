
  try{document.documentElement.classList.add('ynea-locked');}catch(e){}


try{document.documentElement.classList.add('ynea-locked')}catch(e){}

const horas=[]; for(let m=9*60+30;m<=20*60+30;m+=10){horas.push(String(Math.floor(m/60)).padStart(2,'0')+":"+String(m%60).padStart(2,'0'))}
const today=new Date().toISOString().slice(0,10);
let data=JSON.parse(localStorage.getItem("agendaClinicaSemanal")||"null") || {
  profesionales:[],
  consultas:["Consulta 1"],
  tipos:["General"],
  duracionesTipo:{"General":"10"},
  caracteristicasTipo:{},
  tiposPorProfesional:{},
  pacientes:[],
  citas:[],
  bloqueos:[]
};
if(!data.tiposPorProfesional){data.tiposPorProfesional={};}
if(!data.caracteristicasTipo){data.caracteristicasTipo={};}
if(!data.duracionesTipo){
  data.duracionesTipo={};
  data.tipos.forEach(t=>data.duracionesTipo[t]="10");
}
data.tipos.forEach(t=>{if(!data.caracteristicasTipo[t]) data.caracteristicasTipo[t]={descripcion:"",color:"",activo:true};});
if(!data.bloqueos){data.bloqueos=[];}
let weekStart = monday(new Date());

function $(id){return document.getElementById(id)}
function save(){localStorage.setItem("agendaClinicaSemanal",JSON.stringify(data))}
function paciente(id){return data.pacientes.find(p=>p.id===id)||{}}
function iso(d){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function monday(d){const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x}
function addDays(d,n){const x=new Date(d); x.setDate(x.getDate()+n); return x}
function fmt(d){return d.toLocaleDateString('es-ES',{weekday:'short',day:'2-digit',month:'2-digit'})}

function init(){
 $("fechaCita").value=today; if($("weekPicker")) $("weekPicker").value=iso(weekStart);
 if($("filtroMes")) $("filtroMes").value=today.slice(0,7);
 if($("filtroDia")) $("filtroDia").value=today;
 if($("filtroSemana")) $("filtroSemana").value=today;
 if($("filtroAnio")) $("filtroAnio").value=new Date().getFullYear();
 if($("filtroDesde")) $("filtroDesde").value=today;
 if($("filtroHasta")) $("filtroHasta").value=today; if($("monthPicker")) $("monthPicker").value=today.slice(0,7); if($("yearPicker")) $("yearPicker").value=new Date().getFullYear();
 fillSelect("horaCita",horas); refreshAllSelects(); toggleFiltroPeriodo(); renderAll();
}
function fillSelect(id,arr,first=""){ $(id).innerHTML=first+arr.map(x=>`<option value="${x}">${x}</option>`).join("")}
function refreshAllSelects(){
 fillSelect("profesionalCita",data.profesionales);
 if($("enlaceProfesional")) fillSelect("enlaceProfesional",data.profesionales);
 if($("mapProfesional")) refreshTiposProfesionalSelector(); fillSelect("consultaCita",data.consultas); const profActual = $("profesionalCita") ? $("profesionalCita").value : "";
 if($("enlaceTipo")) fillSelect("enlaceTipo",data.tipos);
 fillSelect("tipoCita", tiposPermitidosParaProfesional(profActual)); setTimeout(applyTipoDuration,0);
 fillSelect("weekProf",data.profesionales,'<option value="">Todos</option>');
 if($("monthProf")) fillSelect("monthProf",data.profesionales,'<option value="">Todos</option>');
 if($("yearProf")) fillSelect("yearProf",data.profesionales,'<option value="">Todos</option>');
 fillSelect("weekConsulta",data.consultas,'<option value="">Todas</option>');
 fillSelect("filtroProf",data.profesionales,'<option value="">Todos</option>');
 fillSelect("filtroTipo",data.tipos,'<option value="">Todos</option>');
 actualizarBuscadorPacienteCita();
}
function setView(view,btn){
 ["semana","mensual","anual","agenda","pacientes","config","bloqueos","listados","copias","avisos","infoDiaria"].forEach(v=>{
   const el=$(v+"View");
   if(el) el.style.display=v===view?"block":"none";
 });
 document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
 if(btn) btn.classList.add("active");
 renderAll();
}
function setWeekFromDate(value){
 const base = value ? new Date(value + "T00:00:00") : new Date();
 weekStart = monday(base);
 if($("weekPicker")) $("weekPicker").value = iso(weekStart);
 renderAll();
}
function moveWeek(n){
 const picker = $("weekPicker");
 const base = picker && picker.value ? monday(new Date(picker.value + "T00:00:00")) : weekStart;
 weekStart = addDays(base, Number(n||0)*7);
 if(picker) picker.value = iso(weekStart);
 renderAll();
}
function goThisWeek(){
 weekStart = monday(new Date());
 if($("weekPicker")) $("weekPicker").value = iso(weekStart);
 renderAll();
}

function addPaciente(){
 const nombre=$("pacNombre").value.trim(); if(!nombre){alert("Escribe el nombre del paciente.");return}
 const p={id:"p"+Date.now(),nombre,telefono:$("pacTelefono").value,email:$("pacEmail").value,obs:$("pacObs").value};
 data.pacientes.push(p); save(); ["pacNombre","pacTelefono","pacEmail","pacObs"].forEach(id=>$(id).value=""); refreshAllSelects(); seleccionarPacienteCita(p.id); renderAll(); alert("Paciente guardado.");
}
function quickNewCita(fecha,hora){
 $("fechaCita").value=fecha;
 $("horaCita").value=hora;
 const prof=$("weekProf").value;
 if(prof){$("profesionalCita").value=prof;}
 document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
 const tabs=document.querySelectorAll(".tab");
 if(tabs[1]) tabs[1].classList.add("active");
 ["semana","mensual","anual","agenda","pacientes","config","bloqueos","listados","copias","avisos","infoDiaria"].forEach(v=>$(`${v}View`).style.display=v==="agenda"?"block":"none");
 setTimeout(()=>$("pacienteCita").focus(),50);
}

function addCita(){
 const c={id:Date.now(),fecha:$("fechaCita").value,hora:$("horaCita").value,duracion:$("duracionCita").value,pacienteId:pacienteSeleccionadoParaCita(),profesional:$("profesionalCita").value,consulta:$("consultaCita").value,tipo:$("tipoCita").value,estado:$("estadoCita").value,obs:$("obsCita").value};
 if(!c.fecha||!c.hora||!c.pacienteId){alert("Falta fecha, hora o paciente.");return}
 if(typeof bloqueoImpideCita==="function" && bloqueoImpideCita(c) && !confirm("Ese horario está bloqueado para ese profesional o para todos los profesionales. ¿Quieres guardar la cita igualmente?")) return;
 const solape=overlapsNewCita(c);
 if(solape&&!confirm("Ya existe una cita solapada con ese profesional durante ese intervalo. ¿Quieres guardarla igualmente?"))return;
 data.citas.push(c);
 window.yneaLocalPendingUntil=Date.now()+8000;
 save();
 try{ if(typeof window.yneaForceCloudSave==="function") window.yneaForceCloudSave(); }catch(e){console.warn(e);}
 weekStart=monday(new Date(c.fecha)); $("weekPicker").value=c.fecha;
 try{ if(typeof setView==="function") setView("semana"); }catch(e){}
 renderAll();
 alert("Cita guardada.");
}

function tiposPermitidosParaProfesional(prof){
 const todos = Array.isArray(data.tipos) ? data.tipos : [];
 const mapa = data.tiposPorProfesional || {};
 if(!prof) return todos;
 if(Object.prototype.hasOwnProperty.call(mapa, prof)){
   const lista = Array.isArray(mapa[prof]) ? mapa[prof] : [];
   // Si un profesional quedó guardado sin tipos por error, no bloqueamos la agenda:
   // mostramos todos los tipos disponibles para poder seguir trabajando.
   return lista.length ? lista : todos;
 }
 return todos;
}
function applyTipoDuration(){
 const tipo=$("tipoCita").value;
 if(data.duracionesTipo && data.duracionesTipo[tipo]){
   $("duracionCita").value=data.duracionesTipo[tipo];
 }
}
function addTipo(){
 const val=$("newTipo").value.trim();
 if(!val)return;
 if(data.tipos.includes(val)){alert("Ya existe.");return}
 data.tipos.push(val);
 data.duracionesTipo[val]=$("newTipoDuracion").value;
 $("newTipo").value="";
 save(); refreshAllSelects(); renderAll();
}
function updateTipoDuration(tipo,value){
 data.duracionesTipo[tipo]=value;
 save();
 if($("tipoCita").value===tipo) applyTipoDuration();
}

function editItem(key, oldValue){
 const nuevo = prompt("Nuevo nombre:", oldValue);
 if(!nuevo || !nuevo.trim()) return;
 const newValue = nuevo.trim();
 if(newValue === oldValue) return;
 if(data[key].includes(newValue)){
   alert("Ya existe un elemento con ese nombre.");
   return;
 }
 data[key] = data[key].map(x => x === oldValue ? newValue : x);

 if(key === "profesionales"){
   data.citas.forEach(c => { if(c.profesional === oldValue) c.profesional = newValue; });
 }
 if(key === "consultas"){
   data.citas.forEach(c => { if(c.consulta === oldValue) c.consulta = newValue; });
 }
 if(key === "tipos"){
   data.citas.forEach(c => { if(c.tipo === oldValue) c.tipo = newValue; });
   if(data.duracionesTipo){
     data.duracionesTipo[newValue] = data.duracionesTipo[oldValue] || "10";
     delete data.duracionesTipo[oldValue];
   }
 }
 save();
 refreshAllSelects();
 renderAll();
}

function addItem(key,inputId){
 const val=$(inputId).value.trim(); if(!val)return;
 if(data[key].includes(val)){alert("Ya existe.");return}
 data[key].push(val); $(inputId).value=""; save(); refreshAllSelects(); renderAll();
}

function renameItemDirect(key, oldValue, newValue){
 newValue = (newValue||"").trim();
 if(!newValue) return alert("Nombre vacío");

 data[key] = data[key].map(x => x===oldValue ? newValue : x);

 if(key==="profesionales"){
   data.citas.forEach(c=>{ if(c.profesional===oldValue) c.profesional=newValue;});
 }
 if(key==="consultas"){
   data.citas.forEach(c=>{ if(c.consulta===oldValue) c.consulta=newValue;});
 }
 if(key==="tipos"){
   data.citas.forEach(c=>{ if(c.tipo===oldValue) c.tipo=newValue;});
   data.duracionesTipo[newValue]=data.duracionesTipo[oldValue];
   delete data.duracionesTipo[oldValue];
 }

 save();
 refreshAllSelects();
 renderAll();
}

function removeItem(key,value){
 if(!confirm("¿Eliminar este elemento? Las citas existentes no se borrarán."))return;
 data[key]=data[key].filter(x=>x!==value); if(key==="tipos" && data.duracionesTipo){delete data.duracionesTipo[value];} save(); refreshAllSelects(); renderAll();
}


function minutesFromHHMM(hhmm){
 const [h,m]=hhmm.split(":").map(Number);
 return h*60+m;
}
function citaOcupaHora(c,hora){
 const start=minutesFromHHMM(c.hora);
 const end=start+Number(c.duracion||10);
 const t=minutesFromHHMM(hora);
 return t>=start && t<end;
}
function citaEsInicio(c,hora){
 return c.hora===hora;
}
function overlapsNewCita(nueva){
 const nStart=minutesFromHHMM(nueva.hora);
 const nEnd=nStart+Number(nueva.duracion||10);
 return data.citas.some(c=>{
   if(c.fecha!==nueva.fecha || c.profesional!==nueva.profesional) return false;
   const cStart=minutesFromHHMM(c.hora);
   const cEnd=cStart+Number(c.duracion||10);
   return nStart < cEnd && nEnd > cStart;
 });
}


function getPacienteNombre(id){
 const p=paciente(id);
 return p && p.nombre ? p.nombre : "";
}
function citasPorFechaProfesional(fecha, profesional){
 return data.citas
   .filter(c=>c.fecha===fecha && (!profesional || c.profesional===profesional))
   .sort((a,b)=>a.hora.localeCompare(b.hora));
}


function moveMonth(n){
 const val=$("monthPicker").value || today.slice(0,7);
 const [y,m]=val.split("-").map(Number);
 const d=new Date(y,m-1+n,1);
 $("monthPicker").value=String(d.getFullYear())+"-"+String(d.getMonth()+1).padStart(2,"0");
 renderAll();
}
function goThisMonth(){
 $("monthPicker").value=today.slice(0,7);
 renderAll();
}
function moveYear(n){
 $("yearPicker").value=Number($("yearPicker").value || new Date().getFullYear())+n;
 renderAll();
}
function goThisYear(){
 $("yearPicker").value=new Date().getFullYear();
 renderAll();
}

function renderWeek(){
 const profFilter=$("weekProf").value;
 const consultaSeleccionada=$("weekConsulta").value;
 const days=[0,1,2,3,4].map(n=>addDays(weekStart,n));
 $("weekTitle").textContent=(consultaSeleccionada?("Consulta: "+consultaSeleccionada):"Todas las consultas")+" · Semana del "+days[0].toLocaleDateString('es-ES')+" al "+days[4].toLocaleDateString('es-ES');
 const skip = {};
 let html="<thead><tr><th>Hora</th>";
 days.forEach(d=>{ html+=`<th>${fmt(d)}</th>`; });
 html+="</tr></thead><tbody>";

 horas.forEach(h=>{
   html+=`<tr><td class="time">${h}</td>`;
   days.forEach(d=>{
    const date=iso(d);
    const key=date+"_"+h;
    if(skip[key]) return;

    let citasInicio=data.citas.filter(c=>c.fecha===date&&citaEsInicio(c,h)&&(!consultaSeleccionada||c.consulta===consultaSeleccionada)&&(!profFilter||c.profesional===profFilter));
    let citasOcupando=data.citas.filter(c=>c.fecha===date&&citaOcupaHora(c,h)&&!citaEsInicio(c,h)&&(!consultaSeleccionada||c.consulta===consultaSeleccionada)&&(!profFilter||c.profesional===profFilter));

    if(citasInicio.length){
      const c=citasInicio[0];
      const p=paciente(c.pacienteId);
      const bloques=Math.max(1,Math.ceil(Number(c.duracion||10)/10));
      for(let i=1;i<bloques;i++){
        const hh=horas[horas.indexOf(h)+i];
        if(hh) skip[date+"_"+hh]=true;
      }
      html+=`<td class="slot" rowspan="${bloques}">
        <div class="appt ${String(c.profesional||'').toLowerCase().includes('susana')?'ynea-susana-rosa':''}" onclick="event.stopPropagation(); abrirEditorCita(${c.id})" title="${c.obs||""}" style="background:${String(c.profesional||'').toLowerCase().includes('susana')?'#f8c8dc':''};height:100%;min-height:${Math.max(58,bloques*58)}px;display:flex;flex-direction:column;justify-content:center">
          <strong>${p.nombre||""}</strong>
          <span>${c.profesional}</span>
          <span>${c.tipo} · ${c.duracion} min · ${c.consulta}</span>
          <span class="badge ${c.estado.replace(" ","")}">${c.estado}</span>
        </div>
      </td>`;
    }else if(citasOcupando.length){
      // Esta celda queda cubierta por el rowspan de la cita que empezó antes.
    }else{
      html+=`<td class="slot" onclick="quickNewCitaConsulta('${date}','${h}','${consultaSeleccionada||""}')" style="cursor:pointer;color:#94a3b8;text-align:center;vertical-align:middle">+ Añadir</td>`;
    }
   });
   html+="</tr>";
 });
 html+="</tbody>"; $("weekTable").innerHTML=html;
}
function quickNewCitaConsulta(fecha,hora,consulta){
 $("fechaCita").value=fecha;
 $("horaCita").value=hora;
 if(consulta){$("consultaCita").value=consulta;}
 const prof=$("weekProf").value;
 if(prof){$("profesionalCita").value=prof;}
 document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
 const tabs=document.querySelectorAll(".tab");
 if(tabs[1]) tabs[1].classList.add("active");
 ["semana","mensual","anual","agenda","pacientes","config","bloqueos","listados","copias","avisos","infoDiaria"].forEach(v=>$(`${v}View`).style.display=v==="agenda"?"block":"none");
 setTimeout(()=>$("pacienteCita").focus(),50);
}

function renderPatients(){
 $("pacientesTable").innerHTML="<thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Observaciones</th></tr></thead><tbody>"+data.pacientes.map(p=>`<tr><td><b>${p.nombre}</b></td><td>${p.telefono||""}</td><td>${p.email||""}</td><td>${p.obs||""}</td></tr>`).join("")+"</tbody>";
}


function refreshTiposProfesionalSelector(){
 const sel=$("mapProfesional");
 if(!sel) return;
 const current=sel.value;
 sel.innerHTML='<option value="">-- Seleccionar profesional --</option>' + data.profesionales.map(p=>`<option value="${p}">${p}</option>`).join("");
 if(current && data.profesionales.includes(current)){
   sel.value=current;
 }else if(data.profesionales.length){
   sel.value=data.profesionales[0];
 }
}


function saveMapTipos(){
 const prof=$("mapProfesional").value;
 if(!prof){alert("Selecciona un profesional.");return;}
 const seleccion=[...document.querySelectorAll("#mapTiposBox input:checked")].map(x=>x.value);
 data.tiposPorProfesional[prof]=seleccion;
 save();
 refreshAllSelects();
 renderAll();
 alert("Tipos guardados para "+prof);
}
function desactivarTiposProfesional(){
 const prof=$("mapProfesional").value;
 if(!prof){alert("Selecciona un profesional.");return;}
 if(!confirm("¿Desactivar todos los tipos para "+prof+"?")) return;
 data.tiposPorProfesional[prof]=[];
 save();
 refreshAllSelects();
 renderAll();
}
function activarTiposProfesional(){
 const prof=$("mapProfesional").value;
 if(!prof){alert("Selecciona un profesional.");return;}
 data.tiposPorProfesional[prof]=[...data.tipos];
 save();
 refreshAllSelects();
 renderAll();
}


function renderConfig(){

 // Profesionales
 $("profList").innerHTML = data.profesionales.map(p => `
   <div class="pill">
     <input value="${p}" onchange="renameItemDirect('profesionales','${p}',this.value)">
     <button class="danger" onclick="removeItem('profesionales','${p}')">X</button>
   </div>
 `).join("");

 // Consultas
 $("consultaList").innerHTML = data.consultas.map(c => `
   <div class="pill">
     <input value="${c}" onchange="renameItemDirect('consultas','${c}',this.value)">
     <button class="danger" onclick="removeItem('consultas','${c}')">X</button>
   </div>
 `).join("");

 // Tipos
 $("tipoList").innerHTML = data.tipos.map(t => `
   <div class="pill">
     <input value="${t}" onchange="renameItemDirect('tipos','${t}',this.value)">
     <select onchange="updateTipoDuration('${t}',this.value)">
       <option ${data.duracionesTipo[t]==="10"?"selected":""}>10</option>
       <option ${data.duracionesTipo[t]==="20"?"selected":""}>20</option>
       <option ${data.duracionesTipo[t]==="30"?"selected":""}>30</option>
       <option ${data.duracionesTipo[t]==="40"?"selected":""}>40</option>
       <option ${data.duracionesTipo[t]==="50"?"selected":""}>50</option>
       <option ${data.duracionesTipo[t]==="60"?"selected":""}>60</option>
     </select>
     <button class="danger" onclick="removeItem('tipos','${t}')">X</button>
   </div>
 `).join("");

}
function renderMapTipos(){
 const box=$("mapTiposBox");
 const sel=$("mapProfesional");
 if(!box || !sel) return;
 const prof=sel.value;
 const seleccion=tiposPermitidosParaProfesional(prof);
 box.innerHTML=data.tipos.map(t=>{
   const checked=seleccion.includes(t) ? "checked" : "";
   return `<label style="display:block;font-weight:normal;margin:7px 0"><input type="checkbox" value="${t}" ${checked}> ${t}</label>`;
 }).join("");
}
function saveMapTipos(){
 const prof=$("mapProfesional").value;
 if(!prof){alert("Selecciona un profesional.");return;}
 const seleccion=[...document.querySelectorAll("#mapTiposBox input:checked")].map(x=>x.value);
 data.tiposPorProfesional[prof]=seleccion;
 save();
 refreshAllSelects();
 renderAll();
 alert("Tipos guardados para "+prof);
}
function desactivarTiposProfesional(){
 const prof=$("mapProfesional").value;
 if(!prof){alert("Selecciona un profesional.");return;}
 if(!confirm("¿Desactivar todos los tipos para "+prof+"?")) return;
 data.tiposPorProfesional[prof]=[];
 save();
 refreshAllSelects();
 renderAll();
}
function activarTiposProfesional(){
 const prof=$("mapProfesional").value;
 if(!prof){alert("Selecciona un profesional.");return;}
 data.tiposPorProfesional[prof]=[...data.tipos];
 save();
 refreshAllSelects();
 renderAll();
}

function renderConfig(){
  $("tipoList").innerHTML=`
    <div class="editBox">
      <h3>Editar tipo de cita</h3>
      <select id="tipoSelector" onchange="loadTipoEditor()">
        <option value="">Seleccionar</option>
        ${data.tipos.map(t=>`<option value="${t}">${t}</option>`).join("")}
      </select>
      <div id="tipoEditorBox"></div>
    </div>
  `;

 $("profList").innerHTML=data.profesionales.map(x=>`<div class="pill"><span>${x}</span><button class="danger" onclick="removeItem('profesionales','${x.replaceAll("'","\\'")}')">Eliminar</button></div>`).join("");
 $("consultaList").innerHTML=data.consultas.map(x=>`<div class="pill"><span>${x}</span><button class="danger" onclick="removeItem('consultas','${x.replaceAll("'","\\'")}')">Eliminar</button></div>`).join("");
 $("tipoList").innerHTML=data.tipos.map(x=>`<div class="pill"><span>${x}</span><button class="danger" onclick="removeItem('tipos','${x.replaceAll("'","\\'")}')">Eliminar</button></div>`).join("");
}
function toggleFiltroPeriodo(){
 const periodo = $("filtroPeriodo") ? $("filtroPeriodo").value : "mes";
 const show = (id, visible) => {
   const el = $(id);
   if(el) el.style.display = visible ? "block" : "none";
 };
 show("boxFiltroDia", periodo === "dia");
 show("boxFiltroSemana", periodo === "semana");
 show("boxFiltroMes", periodo === "mes");
 show("boxFiltroAnio", periodo === "anio");
 show("boxFiltroDesde", periodo === "personalizado");
 show("boxFiltroHasta", periodo === "personalizado");
}

function citaDentroPeriodo(fecha){
 const periodo = $("filtroPeriodo") ? $("filtroPeriodo").value : "mes";

 if(periodo === "dia"){
   const dia = $("filtroDia") && $("filtroDia").value ? $("filtroDia").value : today;
   return fecha === dia;
 }

 if(periodo === "semana"){
   const ref = new Date(($("filtroSemana") && $("filtroSemana").value) ? $("filtroSemana").value : today);
   const ini = monday(ref);
   const fin = addDays(ini, 4);
   return fecha >= iso(ini) && fecha <= iso(fin);
 }

 if(periodo === "mes"){
   const mes = $("filtroMes") && $("filtroMes").value ? $("filtroMes").value : today.slice(0,7);
   return fecha.slice(0,7) === mes;
 }

 if(periodo === "anio"){
   const anio = String(($("filtroAnio") && $("filtroAnio").value) ? $("filtroAnio").value : new Date().getFullYear());
   return fecha.slice(0,4) === anio;
 }

 if(periodo === "personalizado"){
   const desde = $("filtroDesde") && $("filtroDesde").value ? $("filtroDesde").value : "0000-01-01";
   const hasta = $("filtroHasta") && $("filtroHasta").value ? $("filtroHasta").value : "9999-12-31";
   return fecha >= desde && fecha <= hasta;
 }

 return true;
}

function filteredCitas(){
 const prof = $("filtroProf") ? $("filtroProf").value : "";
 const pac = ($("filtroPaciente") ? $("filtroPaciente").value : "").toLowerCase();
 const tipo = $("filtroTipo") ? $("filtroTipo").value : "";
 const estado = $("filtroEstado") ? $("filtroEstado").value : "";

 return data.citas.filter(c=>{
   const p = paciente(c.pacienteId).nombre || "";
   return citaDentroPeriodo(c.fecha) &&
     (!prof || c.profesional === prof) &&
     (!pac || p.toLowerCase().includes(pac)) &&
     (!tipo || c.tipo === tipo) &&
     (!estado || c.estado === estado);
 }).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
}
function loadTipoEditor(){
  const tipo=$("tipoSelector").value;
  if(!tipo){
    $("tipoEditorBox").innerHTML="";
    return;
  }
  $("tipoEditorBox").innerHTML=`
    <label>Nombre</label>
    <input value="${tipo}" onchange="renameItemDirect('tipos','${tipo}',this.value)">
    <label>Duración</label>
    <select onchange="updateTipoDuration('${tipo}',this.value)">
      <option>10</option><option>20</option><option>30</option><option>40</option>
      <option>50</option><option>60</option>
    </select>
  `;
}

function renderLists(){
 const rows=filteredCitas();
 const table="<thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Teléfono</th><th>Email</th><th>Profesional</th><th>Consulta</th><th>Tipo</th><th>Estado</th><th>Duración</th><th>Observaciones</th></tr></thead><tbody>"+rows.map(c=>{const p=paciente(c.pacienteId);return `<tr><td>${c.fecha}</td><td>${c.hora}</td><td><b>${p.nombre||""}</b></td><td>${p.telefono||""}</td><td>${p.email||""}</td><td>${c.profesional}</td><td>${c.consulta}</td><td>${c.tipo}</td><td>${c.estado}</td><td>${c.duracion}</td><td>${c.obs||""}</td></tr>`}).join("")+"</tbody>";
 $("listadosTable").innerHTML=table; $("nextTable").innerHTML=table;
}
function downloadCSV(){
 const header=["Fecha","Hora","Paciente","Telefono","Email","Profesional","Consulta","Tipo","Estado","Duracion","Observaciones"];
 const rows=filteredCitas().map(c=>{const p=paciente(c.pacienteId);return [c.fecha,c.hora,p.nombre||"",p.telefono||"",p.email||"",c.profesional,c.consulta,c.tipo,c.estado,c.duracion,c.obs||""]});
 const csv=[header,...rows].map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(";")).join("\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="listado_citas.csv"; a.click();
}

function renderMonthView(){
 const table=$("monthTable");
 if(!table) return;
 const monthValue=($("monthPicker") && $("monthPicker").value) ? $("monthPicker").value : today.slice(0,7);
 const prof=($("monthProf") && $("monthProf").value) ? $("monthProf").value : "";
 const parts=monthValue.split("-");
 const year=Number(parts[0]);
 const month=Number(parts[1])-1;
 const first=new Date(year,month,1);
 const last=new Date(year,month+1,0);
 const start=monday(first);
 if($("monthTitle")) $("monthTitle").textContent=(prof?("Profesional: "+prof):"Todos los profesionales")+" · "+first.toLocaleDateString("es-ES",{month:"long",year:"numeric"});
 let out="<thead><tr><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead><tbody>";
 let cur=new Date(start);
 for(let w=0; w<6; w++){
   out+="<tr>";
   for(let i=0;i<5;i++){
     const d=addDays(cur,i);
     const date=iso(d);
     const inMonth=d.getMonth()===month;
     const citas=data.citas.filter(c=>c.fecha===date && (!prof || c.profesional===prof)).sort((a,b)=>a.hora.localeCompare(b.hora));
     out+=`<td class="slot" style="min-width:210px;background:${inMonth?"#fff":"#f8fafc"}">
       <strong>${d.getDate()}</strong>`;
     citas.slice(0,5).forEach(c=>{
       const p=paciente(c.pacienteId);
       out+=`<div class="appt estado-${c.estado.replaceAll(" ","")} ${String(c.profesional||'').toLowerCase().includes('susana')?'ynea-susana-rosa':''}" onclick="event.stopPropagation(); abrirEditorCita(${c.id})" style="background:${String(c.profesional||'').toLowerCase().includes('susana')?'#f8c8dc':''};margin-top:6px;cursor:pointer">
          <strong>${c.hora} · ${p.nombre||""}</strong>
          <span>${c.profesional}</span><br>
          <span>${c.tipo} · ${c.consulta}</span>
       </div>`;
     });
     if(citas.length>5) out+=`<p class="small">+${citas.length-5} citas más</p>`;
     out+="</td>";
   }
   out+="</tr>";
   cur=addDays(cur,7);
   if(cur>last && cur.getMonth()!==month) break;
 }
 out+="</tbody>";
 table.innerHTML=out;
}

function renderYearView(){
 const table=$("yearTable");
 if(!table) return;
 const year=Number(($("yearPicker") && $("yearPicker").value) ? $("yearPicker").value : new Date().getFullYear());
 const prof=($("yearProf") && $("yearProf").value) ? $("yearProf").value : "";
 if($("yearTitle")) $("yearTitle").textContent=(prof?("Profesional: "+prof):"Todos los profesionales")+" · Año "+year;
 let out="<thead><tr><th>Mes</th><th>Total citas</th><th>Confirmadas</th><th>Pendientes</th><th>Realizadas</th><th>Canceladas</th><th>No acude</th></tr></thead><tbody>";
 for(let m=0;m<12;m++){
   const monthISO=String(year)+"-"+String(m+1).padStart(2,"0");
   const d=new Date(year,m,1);
   const citas=data.citas.filter(c=>c.fecha.slice(0,7)===monthISO && (!prof || c.profesional===prof));
   const count=(estado)=>citas.filter(c=>c.estado===estado).length;
   out+=`<tr>
     <td class="time">${d.toLocaleDateString("es-ES",{month:"long"})}</td>
     <td>${citas.length}</td>
     <td>${count("Confirmada")}</td>
     <td>${count("Pendiente")}</td>
     <td>${count("Realizada")}</td>
     <td>${count("Cancelada")}</td>
     <td>${count("No acude")}</td>
   </tr>`;
 }
 out+="</tbody>";
 table.innerHTML=out;
}

function renderAll(){
 $("statCitas").textContent=data.citas.length;
 $("statPacientes").textContent=data.pacientes.length;
 $("statProfs").textContent=data.profesionales.length;
 $("statConsultas").textContent=data.consultas.length;
 renderWeek();
 renderMonthView();
 renderYearView();
 renderPatients();
 renderConfig();
 if(typeof renderMapTipos==="function") renderMapTipos();
 renderBloqueos(); renderLists(); renderAvisos();
}

function setupMonthlyAnnualControls(){
 if($("monthPicker") && !$("monthPicker").value) $("monthPicker").value=today.slice(0,7);
 if($("yearPicker") && !$("yearPicker").value) $("yearPicker").value=new Date().getFullYear();
 if($("monthProf")) fillSelect("monthProf",data.profesionales,'<option value="">Todos</option>');
 if($("yearProf")) fillSelect("yearProf",data.profesionales,'<option value="">Todos</option>');
}


function _safeAttr(v){return String(v||"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");}
function _safeJs(v){return String(v||"").replaceAll("\\","\\\\").replaceAll("'","\\'").replaceAll("\n"," ");}

function renderConfig(){
  if($("profList")){
    $("profList").innerHTML = `
      <div class="configEditor">
        <h3>Editar profesional</h3>
        <label>Seleccionar profesional</label>
        <select id="profSelector" onchange="loadProfesionalEditor()">
          <option value="">-- Seleccionar profesional --</option>
          ${data.profesionales.map(p=>`<option value="${_safeAttr(p)}">${_safeAttr(p)}</option>`).join("")}
        </select>
        <div id="profEditorBox"></div>
      </div>
    `;
  }

  if($("consultaList")){
    $("consultaList").innerHTML = `
      <div class="configEditor">
        <h3>Editar consulta</h3>
        <label>Seleccionar consulta</label>
        <select id="consultaSelector" onchange="loadConsultaEditor()">
          <option value="">-- Seleccionar consulta --</option>
          ${data.consultas.map(c=>`<option value="${_safeAttr(c)}">${_safeAttr(c)}</option>`).join("")}
        </select>
        <div id="consultaEditorBox"></div>
      </div>
    `;
  }

  if($("tipoList")){
    $("tipoList").innerHTML = `
      <div class="configEditor">
        <h3>Editar tipo de consulta</h3>
        <label>Seleccionar tipo de consulta</label>
        <select id="tipoSelector" onchange="loadTipoConsultaEditor()">
          <option value="">-- Seleccionar tipo --</option>
          ${data.tipos.map(t=>`<option value="${_safeAttr(t)}">${_safeAttr(t)}</option>`).join("")}
        </select>
        <div id="tipoEditorBox"></div>
      </div>
    `;
  }
}

function loadProfesionalEditor(){
  const prof=$("profSelector").value;
  if(!prof){$("profEditorBox").innerHTML="";return;}
  $("profEditorBox").innerHTML=`
    <label>Nombre del profesional</label>
    <input id="profEditNombre" value="${_safeAttr(prof)}">
    <div class="actions">
      <button onclick="guardarProfesionalEditado('${_safeJs(prof)}')">Guardar cambios</button>
      <button class="danger" onclick="removeItem('profesionales','${_safeJs(prof)}')">Eliminar profesional</button>
    </div>
  `;
}

function guardarProfesionalEditado(oldName){
  const newName=($("profEditNombre").value||"").trim();
  if(!newName){alert("El nombre no puede estar vacío.");return;}
  renameItemDirect("profesionales",oldName,newName);
  alert("Profesional actualizado.");
}

function loadConsultaEditor(){
  const consulta=$("consultaSelector").value;
  if(!consulta){$("consultaEditorBox").innerHTML="";return;}
  $("consultaEditorBox").innerHTML=`
    <label>Nombre de la consulta</label>
    <input id="consultaEditNombre" value="${_safeAttr(consulta)}">
    <div class="actions">
      <button onclick="guardarConsultaEditada('${_safeJs(consulta)}')">Guardar cambios</button>
      <button class="danger" onclick="removeItem('consultas','${_safeJs(consulta)}')">Eliminar consulta</button>
    </div>
  `;
}

function guardarConsultaEditada(oldName){
  const newName=($("consultaEditNombre").value||"").trim();
  if(!newName){alert("El nombre no puede estar vacío.");return;}
  renameItemDirect("consultas",oldName,newName);
  alert("Consulta actualizada.");
}

function loadTipoConsultaEditor(){
  const tipo=$("tipoSelector").value;
  if(!tipo){$("tipoEditorBox").innerHTML="";return;}
  if(!data.caracteristicasTipo) data.caracteristicasTipo={};
  if(!data.caracteristicasTipo[tipo]) data.caracteristicasTipo[tipo]={descripcion:"",color:"",activo:true};
  const car=data.caracteristicasTipo[tipo];
  const dur=data.duracionesTipo[tipo]||"10";
  $("tipoEditorBox").innerHTML=`
    <label>Nombre del tipo de consulta</label>
    <input id="tipoEditNombre" value="${_safeAttr(tipo)}">

    <label>Duración prefijada</label>
    <select id="tipoEditDuracion">
      <option ${dur==="10"?"selected":""}>10</option>
      <option ${dur==="20"?"selected":""}>20</option>
      <option ${dur==="30"?"selected":""}>30</option>
      <option ${dur==="40"?"selected":""}>40</option>
      <option ${dur==="50"?"selected":""}>50</option>
      <option ${dur==="60"?"selected":""}>60</option>
      <option ${dur==="90"?"selected":""}>90</option>
    </select>

    <label>Estado del tipo</label>
    <select id="tipoEditActivo">
      <option value="true" ${car.activo!==false?"selected":""}>Activo</option>
      <option value="false" ${car.activo===false?"selected":""}>Inactivo</option>
    </select>

    <label>Característica / descripción</label>
    <textarea id="tipoEditDescripcion" placeholder="Ej. requiere primera valoración, duración especial, material necesario...">${_safeAttr(car.descripcion||"")}</textarea>

    <label>Color orientativo</label>
    <select id="tipoEditColor">
      <option value="" ${!car.color?"selected":""}>Sin color específico</option>
      <option value="rosa" ${car.color==="rosa"?"selected":""}>Rosa</option>
      <option value="verde" ${car.color==="verde"?"selected":""}>Verde claro</option>
      <option value="azul" ${car.color==="azul"?"selected":""}>Azul celeste</option>
      <option value="amarillo" ${car.color==="amarillo"?"selected":""}>Amarillo</option>
    </select>

    <div class="actions">
      <button onclick="guardarTipoConsultaEditado('${_safeJs(tipo)}')">Guardar cambios</button>
      <button class="danger" onclick="removeItem('tipos','${_safeJs(tipo)}')">Eliminar tipo</button>
    </div>
  `;
}

function guardarTipoConsultaEditado(oldName){
  const newName=($("tipoEditNombre").value||"").trim();
  const dur=$("tipoEditDuracion").value;
  const activo=$("tipoEditActivo").value==="true";
  const descripcion=$("tipoEditDescripcion").value||"";
  const color=$("tipoEditColor").value||"";

  if(!newName){alert("El nombre del tipo no puede estar vacío.");return;}

  if(newName!==oldName){
    renameItemDirect("tipos",oldName,newName);
  }

  const finalName=newName;
  if(!data.caracteristicasTipo) data.caracteristicasTipo={};
  data.duracionesTipo[finalName]=dur;
  data.caracteristicasTipo[finalName]={descripcion, color, activo};

  save();
  refreshAllSelects();
  renderAll();
  alert("Tipo de consulta actualizado.");
}

function renameItemDirect(key, oldValue, rawNewValue){
  const newValue=(rawNewValue||"").trim();
  if(!newValue){alert("El nombre no puede estar vacío.");renderAll();return;}
  if(newValue===oldValue)return;
  if(data[key].includes(newValue)){alert("Ya existe un elemento con ese nombre.");renderAll();return;}

  data[key]=data[key].map(x=>x===oldValue?newValue:x);

  if(key==="profesionales"){
    data.citas.forEach(c=>{if(c.profesional===oldValue)c.profesional=newValue;});
    (data.bloqueos||[]).forEach(b=>{if(b.profesional===oldValue)b.profesional=newValue;});
    if(data.tiposPorProfesional && Object.prototype.hasOwnProperty.call(data.tiposPorProfesional,oldValue)){
      data.tiposPorProfesional[newValue]=data.tiposPorProfesional[oldValue];
      delete data.tiposPorProfesional[oldValue];
    }
  }

  if(key==="consultas"){
    data.citas.forEach(c=>{if(c.consulta===oldValue)c.consulta=newValue;});
  }

  if(key==="tipos"){
    data.citas.forEach(c=>{if(c.tipo===oldValue)c.tipo=newValue;});
    if(data.duracionesTipo){
      data.duracionesTipo[newValue]=data.duracionesTipo[oldValue]||"10";
      delete data.duracionesTipo[oldValue];
    }
    if(data.caracteristicasTipo){
      data.caracteristicasTipo[newValue]=data.caracteristicasTipo[oldValue]||{descripcion:"",color:"",activo:true};
      delete data.caracteristicasTipo[oldValue];
    }
    Object.keys(data.tiposPorProfesional||{}).forEach(prof=>{
      data.tiposPorProfesional[prof]=data.tiposPorProfesional[prof].map(t=>t===oldValue?newValue:t);
    });
  }

  save();
  refreshAllSelects();
  renderAll();
}


function tiposPermitidosParaProfesional(prof){
  let lista;
  if(prof && data.tiposPorProfesional && Object.prototype.hasOwnProperty.call(data.tiposPorProfesional, prof)){
    lista=data.tiposPorProfesional[prof]||[];
  }else{
    lista=data.tipos||[];
  }
  return lista.filter(t=>!data.caracteristicasTipo || !data.caracteristicasTipo[t] || data.caracteristicasTipo[t].activo!==false);
}


function renderMapTipos(){
 refreshTiposProfesionalSelector();
 const box=$("mapTiposBox");
 const sel=$("mapProfesional");
 if(!box || !sel) return;
 const prof=sel.value;
 const seleccion=tiposPermitidosParaProfesional(prof);
 box.innerHTML=data.tipos.map(t=>{
   const checked=seleccion.includes(t) ? "checked" : "";
   return `<label style="display:block;font-weight:normal;margin:7px 0"><input type="checkbox" value="${t}" ${checked}> ${t}</label>`;
 }).join("");
}


function exportBackup(){
 const payload={
   version:"Agenda Clinica Ynea backup 1.0",
   exportedAt:new Date().toISOString(),
   data:data
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
 const a=document.createElement("a");
 const fecha=new Date().toISOString().slice(0,10);
 a.href=URL.createObjectURL(blob);
 a.download="backup_agenda_clinica_ynea_"+fecha+".json";
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(a.href);
}
function importBackup(event){
 const file=event.target.files && event.target.files[0];
 if(!file) return;
 const reader=new FileReader();
 reader.onload=function(e){
   try{
     const parsed=JSON.parse(e.target.result);
     const imported=parsed.data ? parsed.data : parsed;
     if(!imported || !Array.isArray(imported.pacientes) || !Array.isArray(imported.profesionales) || !Array.isArray(imported.citas)){
       alert("El archivo no parece una copia válida de la agenda.");
       return;
     }
     if(confirm("¿Cargar esta copia de seguridad? Se sustituirán los datos actuales de esta agenda.")){
       localStorage.setItem("agendaClinicaSemanal",JSON.stringify(imported));
       alert("Copia cargada. La agenda se reiniciará ahora.");
       /* reload eliminado */
     }
   }catch(err){
     alert("No se pudo cargar la copia. Archivo no válido.");
   }finally{
     event.target.value="";
   }
 };
 reader.readAsText(file);
}


function minutesFromHHMMSafe(hhmm){
  if(typeof minutesFromHHMM==="function") return minutesFromHHMM(hhmm);
  const [h,m]=String(hhmm).split(":").map(Number);
  return h*60+m;
}

function toggleBloqProfesionalNuevo(){
  const box=$("bloqProfesionalBoxNuevo");
  if(box) box.style.display = $("bloqAmbitoNuevo").value==="profesional" ? "block" : "none";
}

function toggleBloqPeriodoCampos(){
  const tipo=$("bloqPeriodoTipo").value;
  const show=(id, visible)=>{ const el=$(id); if(el) el.style.display=visible?"block":"none"; };
  show("bloqFechaUnicaBox", tipo==="dia");
  show("bloqRangoBox", tipo==="rango" || tipo==="diasSemana");
  show("bloqSemanaBox", tipo==="semana");
  show("bloqDiasSemanaBox", tipo==="diasSemana" || tipo==="permanente");
}

function toggleBloqHorarioCampos(){
  const box=$("bloqHorarioBoxNuevo");
  if(box) box.style.display = $("bloqHorarioTipo").value==="horario" ? "grid" : "none";
}

function diasSemanaBloqueoNuevo(){
  return [...document.querySelectorAll(".bloqDiaNuevo:checked")].map(x=>Number(x.value));
}

function rangoFechasBloq(inicio, fin){
  const fechas=[];
  if(!inicio) return fechas;
  const d1=new Date(inicio);
  const d2=new Date(fin || inicio);
  if(d2<d1) return fechas;
  for(let d=new Date(d1); d<=d2; d.setDate(d.getDate()+1)){
    fechas.push(iso(d));
  }
  return fechas;
}

function fechasBloqueoAvanzado(){
  const tipo=$("bloqPeriodoTipo").value;

  if(tipo==="dia"){
    const f=$("bloqFechaUnica").value;
    return f ? [f] : [];
  }

  if(tipo==="rango"){
    return rangoFechasBloq($("bloqFechaDesde").value, $("bloqFechaHasta").value);
  }

  if(tipo==="semana"){
    const ref=$("bloqSemanaFecha").value;
    if(!ref) return [];
    const ini=monday(new Date(ref));
    return [0,1,2,3,4].map(n=>iso(addDays(ini,n)));
  }

  if(tipo==="diasSemana"){
    const dias=diasSemanaBloqueoNuevo();
    if(!dias.length) return [];
    return rangoFechasBloq($("bloqFechaDesde").value, $("bloqFechaHasta").value)
      .filter(f=>dias.includes(new Date(f).getDay()));
  }

  return [];
}

function guardarBloqueoAvanzado(){
  if(!data.bloqueos) data.bloqueos=[];

  const ambito=$("bloqAmbitoNuevo").value;
  const profesional=ambito==="profesional" ? $("bloqProfesionalNuevo").value : "";
  if(ambito==="profesional" && !profesional){
    alert("Selecciona un profesional.");
    return;
  }

  const horarioTipo=$("bloqHorarioTipo").value;
  const desde=horarioTipo==="diaCompleto" ? "09:30" : $("bloqHoraDesdeNuevo").value;
  const hasta=horarioTipo==="diaCompleto" ? "20:40" : $("bloqHoraHastaNuevo").value;

  if(minutesFromHHMMSafe(hasta)<=minutesFromHHMMSafe(desde)){
    alert("La hora final debe ser posterior a la inicial.");
    return;
  }

  const motivo=$("bloqMotivoNuevo").value || "Bloqueado";
  const periodoTipo=$("bloqPeriodoTipo").value;

  if(periodoTipo==="permanente"){
    const dias=diasSemanaBloqueoNuevo();
    if(!dias.length){
      alert("Selecciona al menos un día de la semana.");
      return;
    }

    data.bloqueos.push({
      id:Date.now()+Math.floor(Math.random()*100000),
      modo:"indefinido",
      dias,
      fecha:"",
      tipo:horarioTipo==="diaCompleto" ? "dia" : "hora",
      desde,
      hasta,
      ambito:ambito==="todos" ? "general" : "profesional",
      profesional,
      motivo
    });

    save();
    renderAll();
    alert("Bloqueo permanente guardado.");
    return;
  }

  const fechas=fechasBloqueoAvanzado();
  if(!fechas.length){
    alert("No hay fechas válidas para bloquear.");
    return;
  }

  fechas.forEach(fecha=>{
    data.bloqueos.push({
      id:Date.now()+Math.floor(Math.random()*100000),
      modo:"fecha",
      fecha,
      dias:[],
      tipo:horarioTipo==="diaCompleto" ? "dia" : "hora",
      desde,
      hasta,
      ambito:ambito==="todos" ? "general" : "profesional",
      profesional,
      motivo
    });
  });

  save();
  renderAll();
  alert("Bloqueos guardados: "+fechas.length);
}

function bloqueoAplicaEnFecha(b,fecha){
  if(b.modo==="indefinido"){
    const dow=new Date(fecha).getDay();
    return (b.dias||[]).includes(dow);
  }
  return b.fecha===fecha;
}

function bloqueosEnHora(fecha,hora,profesional){
  const t=minutesFromHHMMSafe(hora);
  return (data.bloqueos||[]).filter(b=>{
    if(!bloqueoAplicaEnFecha(b,fecha)) return false;
    if(b.ambito==="profesional" && b.profesional!==profesional) return false;
    const start=minutesFromHHMMSafe(b.desde);
    const end=minutesFromHHMMSafe(b.hasta);
    return t>=start && t<end;
  });
}

function bloqueoImpideCita(cita){
  const start=minutesFromHHMMSafe(cita.hora);
  const end=start+Number(cita.duracion||10);

  return (data.bloqueos||[]).some(b=>{
    if(!bloqueoAplicaEnFecha(b,cita.fecha)) return false;
    if(b.ambito==="profesional" && b.profesional!==cita.profesional) return false;
    const bStart=minutesFromHHMMSafe(b.desde);
    const bEnd=minutesFromHHMMSafe(b.hasta);
    return start < bEnd && end > bStart;
  });
}

function nombreDiasBloqueo(dias){
  const map={1:"Lunes",2:"Martes",3:"Miércoles",4:"Jueves",5:"Viernes"};
  return (dias||[]).map(d=>map[d]).join(", ");
}

function renderBloqueos(){
  if(!$("bloqueosTable")) return;
  const rows=(data.bloqueos||[]).slice().sort((a,b)=>String((a.fecha||"9999")+a.desde).localeCompare(String((b.fecha||"9999")+b.desde)));
  $("bloqueosTable").innerHTML="<thead><tr><th>Periodo</th><th>Fecha / Días</th><th>Horario</th><th>Aplicado a</th><th>Motivo</th><th></th></tr></thead><tbody>"+
    rows.map(b=>`<tr>
      <td>${b.modo==="indefinido"?"Permanente":"Fechas concretas"}</td>
      <td>${b.modo==="indefinido"?nombreDiasBloqueo(b.dias):b.fecha}</td>
      <td>${b.tipo==="dia"?"Día completo":b.desde+" - "+b.hasta}</td>
      <td>${b.ambito==="general"?"Todos los profesionales":b.profesional}</td>
      <td>${b.motivo||""}</td>
      <td><button class="danger" onclick="deleteBloqueo(${b.id})">Eliminar</button></td>
    </tr>`).join("")+"</tbody>";
}

function deleteBloqueo(id){
  if(!confirm("¿Eliminar este bloqueo?")) return;
  data.bloqueos=(data.bloqueos||[]).filter(b=>b.id!=id);
  save();
  renderAll();
}

function inicializarBloqueosAvanzados(){
  if($("bloqFechaUnica")) $("bloqFechaUnica").value=today;
  if($("bloqFechaDesde")) $("bloqFechaDesde").value=today;
  if($("bloqFechaHasta")) $("bloqFechaHasta").value=today;
  if($("bloqSemanaFecha")) $("bloqSemanaFecha").value=today;
  if($("bloqHoraDesdeNuevo")) fillSelect("bloqHoraDesdeNuevo",horas);
  if($("bloqHoraHastaNuevo")) fillSelect("bloqHoraHastaNuevo",horas);
  if($("bloqHoraHastaNuevo")) $("bloqHoraHastaNuevo").value="10:30";
  if($("bloqProfesionalNuevo")) fillSelect("bloqProfesionalNuevo",data.profesionales);
  toggleBloqProfesionalNuevo();
  toggleBloqPeriodoCampos();
  toggleBloqHorarioCampos();
}

init();
if(typeof inicializarAvisos==='function') inicializarAvisos();
inicializarBloqueosAvanzados();
renderAll();
setupMonthlyAnnualControls();
renderAll();


function mostrarErrorNuevoPaciente(msg){
  const box=document.getElementById("nuevoPacienteError");
  if(!box) return alert(msg);
  box.textContent=msg;
  box.style.display="block";
}

function limpiarErrorNuevoPaciente(){
  const box=document.getElementById("nuevoPacienteError");
  if(box){
    box.textContent="";
    box.style.display="none";
  }
}

function validarTelefonoYnea(tel){
  const limpio=String(tel||"").replace(/\s+/g,"");
  return /^[0-9+]{7,15}$/.test(limpio);
}

function validarEmailYnea(email){
  if(!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function handlePacienteChange(){
  const sel=document.getElementById("pacienteCita");
  if(!sel || sel.value!=="__nuevo__") return;
  abrirNuevoPaciente();
}

function abrirNuevoPaciente(){
  limpiarErrorNuevoPaciente();
  document.getElementById("npNombre").value="";
  document.getElementById("npTelefono").value="";
  document.getElementById("npEmail").value="";
  document.getElementById("npObs").value="";
  document.getElementById("nuevoPacienteOverlay").style.display="flex";
  setTimeout(()=>document.getElementById("npNombre").focus(),50);
}

function cerrarNuevoPaciente(){
  const overlay=document.getElementById("nuevoPacienteOverlay");
  if(overlay) overlay.style.display="none";
  const sel=document.getElementById("pacienteCita");
  if(sel && sel.value==="__nuevo__") sel.value="";
}

function guardarNuevoPacienteModal(){
  limpiarErrorNuevoPaciente();

  const nombre=document.getElementById("npNombre").value.trim();
  const telefono=document.getElementById("npTelefono").value.trim();
  const email=document.getElementById("npEmail").value.trim();
  const obs=document.getElementById("npObs").value.trim();

  if(!nombre){
    mostrarErrorNuevoPaciente("El nombre del paciente es obligatorio.");
    return;
  }

  if(!telefono){
    mostrarErrorNuevoPaciente("El teléfono es obligatorio.");
    return;
  }

  if(!validarTelefonoYnea(telefono)){
    mostrarErrorNuevoPaciente("Introduce un teléfono válido. Usa solo números y, si quieres, el prefijo +.");
    return;
  }

  if(!validarEmailYnea(email)){
    mostrarErrorNuevoPaciente("Introduce un email válido o deja el campo vacío.");
    return;
  }

  const nuevo={
    id:"p"+Date.now(),
    nombre:nombre,
    telefono:telefono,
    email:email,
    obs:obs
  };

  data.pacientes.push(nuevo);
  window.yneaLocalPendingUntil=Date.now()+8000;
  save();
  try{ if(typeof window.yneaForceCloudSave==="function") window.yneaForceCloudSave(); }catch(e){console.warn(e);}

  if(typeof refreshAllSelects==="function"){
    refreshAllSelects();
  }

  const sel=document.getElementById("pacienteCita");
  if(sel) sel.value=nuevo.id; if(typeof seleccionarPacienteCita==="function") seleccionarPacienteCita(nuevo.id);

  document.getElementById("nuevoPacienteOverlay").style.display="none";

  if(typeof renderAll==="function"){
    renderAll();
  }
}


(function(){
  const BACKUP_DAY_KEY = "agendaClinicaUltimoBackupDiario";

  function fechaHoy(){
    return new Date().toISOString().slice(0,10);
  }

  function nombreBackup(){
    return "backup_agenda_clinica_" + fechaHoy() + ".json";
  }

  window.exportBackupNow = function(){
    try{
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], {type:"application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = nombreBackup();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      localStorage.setItem(BACKUP_DAY_KEY, fechaHoy());
      updateAutosaveStatus("Copia guardada hoy");
    }catch(e){
      alert("No se pudo generar la copia de seguridad.");
    }
  }

  function updateAutosaveStatus(text){
    const el=document.getElementById("autosaveStatus");
    if(el) el.textContent = text || ("Autoguardado: " + new Date().toLocaleTimeString("es-ES"));
    const main=document.getElementById("backupMainStatus");
    if(main) main.textContent = text || ("Autoguardado: " + new Date().toLocaleTimeString("es-ES"));
  }
  window.updateAutosaveStatus = updateAutosaveStatus;

  // Refuerzo del guardado: cada vez que la app llame a save(), también muestra estado.
  if(typeof window.save === "function" && !window.save.__autosaveWrapped){
    const originalSave = window.save;
    window.save = function(){
      const result = originalSave.apply(this, arguments);
      updateAutosaveStatus();
      return result;
    };
    window.save.__autosaveWrapped = true;
  }

  // Guardado preventivo cada 30 segundos por si hay cambios pendientes.
  setInterval(function(){
    try{
      if(typeof data !== "undefined"){
        localStorage.setItem("agendaClinicaSemanal", JSON.stringify(data));
        updateAutosaveStatus();
      }
    }catch(e){}
  }, 30000);

  // Aviso diario de copia desactivado para móvil y escritorio.
  // La copia manual sigue disponible en la pestaña Copias de seguridad.
})();


function importBackupFromMain(event){
  const file = event.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const imported = JSON.parse(e.target.result);
      if(!imported || typeof imported !== "object"){
        alert("El archivo no parece una copia válida.");
        return;
      }

      if(confirm("¿Seguro que quieres cargar esta copia? Se sobrescribirán los datos actuales.")){
        data = imported;
        if(typeof save === "function") save();

        // Refuerzo para distintas versiones de almacenamiento.
        localStorage.setItem("agendaClinicaSemanal", JSON.stringify(data));
        localStorage.setItem("agendaData", JSON.stringify(data));

        alert("Copia cargada correctamente. La agenda se recargará ahora.");
        /* reload eliminado */
      }
    }catch(err){
      alert("Archivo no válido. Selecciona una copia .json creada desde esta agenda.");
    }
  };
  reader.readAsText(file);
}


function mostrarErrorEditorCita(msg){
  const box=document.getElementById("editorCitaError");
  if(!box) return alert(msg);
  box.textContent=msg;
  box.style.display="block";
}
function limpiarErrorEditorCita(){
  const box=document.getElementById("editorCitaError");
  if(box){box.textContent="";box.style.display="none";}
}
function llenarSelectEditor(id, arr, valueKey, labelKey){
  const el=document.getElementById(id);
  if(!el) return;
  el.innerHTML=(arr||[]).map(x=>{
    if(typeof x==="object"){
      return `<option value="${x[valueKey]}">${x[labelKey]}</option>`;
    }
    return `<option value="${x}">${x}</option>`;
  }).join("");
}
function tiposPermitidosEditor(prof){
  if(typeof tiposPermitidosParaProfesional==="function"){
    return tiposPermitidosParaProfesional(prof);
  }
  if(data.tiposPorProfesional && Object.prototype.hasOwnProperty.call(data.tiposPorProfesional, prof)){
    return data.tiposPorProfesional[prof] || [];
  }
  return data.tipos || [];
}
function refrescarTiposEditorCita(tipoActual){
  const prof=document.getElementById("editCitaProfesional").value;
  const tipos=tiposPermitidosEditor(prof);
  llenarSelectEditor("editCitaTipo", tipos);
  if(tipoActual && tipos.includes(tipoActual)){
    document.getElementById("editCitaTipo").value=tipoActual;
  }
}
function aplicarDuracionTipoEditor(){
  const tipo=document.getElementById("editCitaTipo").value;
  if(data.duracionesTipo && data.duracionesTipo[tipo]){
    document.getElementById("editCitaDuracion").value=data.duracionesTipo[tipo];
  }
}
function abrirEditorCita(id){
  const cita=(data.citas||[]).find(c=>String(c.id)===String(id));
  if(!cita) return;

  limpiarErrorEditorCita();

  llenarSelectEditor("editCitaHora", horas);
  llenarSelectEditor("editCitaPaciente", data.pacientes||[], "id", "nombre");
  llenarSelectEditor("editCitaProfesional", data.profesionales||[]);
  llenarSelectEditor("editCitaConsulta", data.consultas||[]);

  document.getElementById("editCitaId").value=cita.id;
  document.getElementById("editCitaFecha").value=cita.fecha;
  document.getElementById("editCitaHora").value=cita.hora;
  document.getElementById("editCitaDuracion").value=cita.duracion || "10";
  document.getElementById("editCitaEstado").value=cita.estado || "Pendiente";
  document.getElementById("editCitaPaciente").value=cita.pacienteId;
  document.getElementById("editCitaProfesional").value=cita.profesional;
  document.getElementById("editCitaConsulta").value=cita.consulta;
  refrescarTiposEditorCita(cita.tipo);
  document.getElementById("editCitaTipo").value=cita.tipo;
  document.getElementById("editCitaObs").value=cita.obs || cita.observaciones || "";

  document.getElementById("editorCitaOverlay").style.display="flex";
}
function cerrarEditorCita(){
  const overlay=document.getElementById("editorCitaOverlay");
  if(overlay) overlay.style.display="none";
}
function minutosEditor(hhmm){
  if(typeof minutesFromHHMM==="function") return minutesFromHHMM(hhmm);
  const [h,m]=String(hhmm).split(":").map(Number);
  return h*60+m;
}
function citaSolapaEditor(actualizada){
  const start=minutosEditor(actualizada.hora);
  const end=start+Number(actualizada.duracion||10);

  return (data.citas||[]).some(c=>{
    if(String(c.id)===String(actualizada.id)) return false;
    if(c.fecha!==actualizada.fecha || c.profesional!==actualizada.profesional) return false;
    const cStart=minutosEditor(c.hora);
    const cEnd=cStart+Number(c.duracion||10);
    return start < cEnd && end > cStart;
  });
}
function guardarCitaDesdeEditor(){
  limpiarErrorEditorCita();

  const id=document.getElementById("editCitaId").value;
  const cita=(data.citas||[]).find(c=>String(c.id)===String(id));
  if(!cita) return;

  const actualizada={
    id:cita.id,
    fecha:document.getElementById("editCitaFecha").value,
    hora:document.getElementById("editCitaHora").value,
    duracion:document.getElementById("editCitaDuracion").value,
    estado:document.getElementById("editCitaEstado").value,
    pacienteId:document.getElementById("editCitaPaciente").value,
    profesional:document.getElementById("editCitaProfesional").value,
    consulta:document.getElementById("editCitaConsulta").value,
    tipo:document.getElementById("editCitaTipo").value,
    obs:document.getElementById("editCitaObs").value
  };

  if(!actualizada.fecha || !actualizada.hora || !actualizada.pacienteId || !actualizada.profesional){
    mostrarErrorEditorCita("Faltan datos obligatorios: fecha, hora, paciente o profesional.");
    return;
  }

  if(typeof bloqueoImpideCita==="function" && bloqueoImpideCita(actualizada)){
    if(!confirm("Ese horario está bloqueado. ¿Quieres guardar la cita igualmente?")) return;
  }

  if(citaSolapaEditor(actualizada)){
    if(!confirm("Existe otra cita solapada para ese profesional. ¿Guardar igualmente?")) return;
  }

  Object.assign(cita, actualizada);
  if(typeof save==="function") save();
  try{localStorage.removeItem('ultimaCitaTemporal');}catch(e){}
  cerrarEditorCita();
  if(typeof renderAll==="function") renderAll();
}
function eliminarCitaDesdeEditor(){
  const id=document.getElementById("editCitaId")?.value;
  if(!id){alert("No se ha encontrado la cita para eliminar.");return;}
  if(!confirm("¿Eliminar esta cita?")) return;
  data.citas=(data.citas||[]).filter(c=>String(c.id)!==String(id));
  if(typeof save==="function") save();
  try{localStorage.removeItem('ultimaCitaTemporal');}catch(e){}
  try{const ov=document.getElementById("editorCitaOverlay"); if(ov) ov.style.display="none";}catch(e){}
  try{document.body.classList.remove('ynea-editor-open');}catch(e){}
  try{const wt=document.getElementById('weekTable'); if(wt) wt.innerHTML=''; const mt=document.getElementById('monthTable'); if(mt) mt.innerHTML='';}catch(e){}
  try{ if(typeof setView==='function') setView('semana'); }catch(e){}
  try{ if(typeof renderAll==="function") renderAll(); }catch(e){}
  setTimeout(()=>{try{ if(typeof renderAll==="function") renderAll(); }catch(e){}},120);
}


// Compatibilidad con versiones antiguas que llamaban a editCita().
window.eliminarCitaDesdeEditor=eliminarCitaDesdeEditor;
function editCita(id){
  abrirEditorCita(id);
}


async function guardarBackupEligiendoCarpeta(){
  const nombre = "backup_agenda_clinica_" + new Date().toISOString().slice(0,10) + ".json";
  const contenido = JSON.stringify(data, null, 2);

  // Chrome/Edge: permite elegir ubicación exacta
  if(window.showSaveFilePicker){
    try{
      const handle = await window.showSaveFilePicker({
        suggestedName: nombre,
        types: [{
          description: "Copia de seguridad JSON",
          accept: {"application/json": [".json"]}
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(contenido);
      await writable.close();

      localStorage.setItem("agendaClinicaUltimoBackupDiario", new Date().toISOString().slice(0,10));
      if(typeof updateAutosaveStatus === "function"){
        updateAutosaveStatus("Copia guardada en carpeta elegida");
      }
      alert("Copia guardada correctamente.");
      return;
    }catch(e){
      // Si cancela, no hacemos nada
      if(e && e.name === "AbortError") return;
    }
  }

  // Fallback para navegadores que no dejan elegir carpeta desde la web
  alert("Tu navegador no permite elegir una carpeta directamente desde esta app. Se abrirá la descarga normal. Puedes activar en Chrome/Edge: Configuración > Descargas > Preguntar dónde guardar cada archivo.");
  if(typeof exportBackupNow === "function"){
    exportBackupNow();
  }else{
    const blob = new Blob([contenido], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
  }
}


let citaReferenciaEnlazada = null;
let modoPrimeraAntes = false;

function nombrePacientePorIdYnea(id){
  const p=(data.pacientes||[]).find(x=>String(x.id)===String(id));
  return p ? p.nombre : "";
}
function minutosYnea(hhmm){
  if(typeof minutesFromHHMM==="function") return minutesFromHHMM(hhmm);
  const [h,m]=String(hhmm).split(":").map(Number);
  return h*60+m;
}
function hhmmDesdeMinutosYnea(mins){
  const h=String(Math.floor(mins/60)).padStart(2,"0");
  const m=String(mins%60).padStart(2,"0");
  return h+":"+m;
}
function finCitaYnea(cita){
  return minutosYnea(cita.hora)+Number(cita.duracion||10);
}
function citaSolapaYnea(nueva){
  const nStart=minutosYnea(nueva.hora);
  const nEnd=nStart+Number(nueva.duracion||10);
  return (data.citas||[]).some(c=>{
    if(c.fecha!==nueva.fecha || c.profesional!==nueva.profesional) return false;
    const cStart=minutosYnea(c.hora);
    const cEnd=cStart+Number(c.duracion||10);
    return nStart < cEnd && nEnd > cStart;
  });
}
function horaDisponibleYnea(fecha,hora,profesional,duracion){
  const nueva={fecha,hora,profesional,duracion};
  if(citaSolapaYnea(nueva)) return false;
  if(typeof bloqueoImpideCita==="function" && bloqueoImpideCita(nueva)) return false;
  return true;
}
function tiposPermitidosEnlace(prof){
  if(typeof tiposPermitidosParaProfesional==="function"){
    return tiposPermitidosParaProfesional(prof);
  }
  if(data.tiposPorProfesional && Object.prototype.hasOwnProperty.call(data.tiposPorProfesional, prof)){
    return data.tiposPorProfesional[prof] || [];
  }
  return data.tipos || [];
}
function llenarSelectYnea(id, arr){
  const el=document.getElementById(id);
  if(!el) return;
  el.innerHTML=(arr||[]).map(x=>`<option value="${x}">${x}</option>`).join("");
}
function mostrarErrorEnlazada(msg){
  const box=document.getElementById("citaEnlazadaError");
  if(!box) return alert(msg);
  box.textContent=msg;
  box.style.display="block";
}
function limpiarErrorEnlazada(){
  const box=document.getElementById("citaEnlazadaError");
  if(box){box.textContent="";box.style.display="none";}
}
function actualizarTipoEnlazada(){
  const prof=document.getElementById("enlazadaProfesional").value;
  llenarSelectYnea("enlazadaTipo", tiposPermitidosEnlace(prof));
  aplicarDuracionEnlazada();
}
function aplicarDuracionEnlazada(){
  const tipo=document.getElementById("enlazadaTipo").value;
  if(data.duracionesTipo && data.duracionesTipo[tipo]){
    document.getElementById("enlazadaDuracion").value=data.duracionesTipo[tipo];
  }
}
function minHoraInicioSegunda(){
  if(!citaReferenciaEnlazada) return 0;
  return finCitaYnea(citaReferenciaEnlazada);
}
function maxHoraFinPrimera(){
  if(!citaReferenciaEnlazada) return 24*60;
  return minutosYnea(citaReferenciaEnlazada.hora);
}
function actualizarHorasDisponiblesEnlazada(){
  const fecha=document.getElementById("enlazadaFecha").value;
  const prof=document.getElementById("enlazadaProfesional").value;
  const dur=Number(document.getElementById("enlazadaDuracion").value || 10);
  const sel=document.getElementById("enlazadaHora");
  if(!sel) return;

  let disponibles=(horas||[]).filter(h=>{
    if(modoPrimeraAntes){
      // Primera cita: debe terminar antes o justo al inicio de la segunda cita.
      if(minutosYnea(h)+dur > maxHoraFinPrimera()) return false;
    }else{
      // Segunda cita: debe empezar después del final de la primera cita.
      if(minutosYnea(h) < minHoraInicioSegunda()) return false;
    }
    return horaDisponibleYnea(fecha,h,prof,dur);
  });

  sel.innerHTML=disponibles.length
    ? disponibles.map(h=>{
        const fin=hhmmDesdeMinutosYnea(minutosYnea(h)+dur);
        return `<option value="${h}">${h} - ${fin}</option>`;
      }).join("")
    : `<option value="">Sin huecos disponibles ${modoPrimeraAntes ? "antes" : "después"} de la cita de referencia</option>`;
}
function construirCitaDesdeFormulario(){
  return {
    id:Date.now(),
    fecha:document.getElementById("fechaCita").value,
    hora:document.getElementById("horaCita").value,
    duracion:document.getElementById("duracionCita").value,
    pacienteId:document.getElementById("pacienteCita").value,
    profesional:document.getElementById("profesionalCita").value,
    consulta:document.getElementById("consultaCita").value,
    tipo:document.getElementById("tipoCita").value,
    estado:document.getElementById("estadoCita").value,
    obs:document.getElementById("obsCita").value
  };
}
function abrirCitaEnlazada(citaReferencia, primeraAntes=false){
  citaReferenciaEnlazada=citaReferencia;
  modoPrimeraAntes=primeraAntes;
  limpiarErrorEnlazada();

  const titulo=document.querySelector("#citaEnlazadaOverlay h2");
  const subtitulo=document.querySelector("#citaEnlazadaOverlay .citaEnlazadaHeader p");
  if(titulo) titulo.textContent=primeraAntes ? "Elegir primera cita previa" : "Crear cita enlazada posterior";
  if(subtitulo) subtitulo.textContent=primeraAntes
    ? "Elige uno de los huecos disponibles antes de la segunda cita."
    : "Elige un hueco disponible después de la primera cita.";

  document.getElementById("enlazadaPacienteNombre").value=nombrePacientePorIdYnea(citaReferencia.pacienteId);
  document.getElementById("enlazadaFecha").value=citaReferencia.fecha;
  document.getElementById("enlazadaFecha").disabled=true;

  llenarSelectYnea("enlazadaProfesional", data.profesionales||[]);
  llenarSelectYnea("enlazadaConsulta", data.consultas||[]);

  const profPreferido=document.getElementById("enlaceProfesional") ? document.getElementById("enlaceProfesional").value : "";
  if(profPreferido) document.getElementById("enlazadaProfesional").value=profPreferido;

  actualizarTipoEnlazada();

  const tipoPreferido=document.getElementById("enlaceTipo") ? document.getElementById("enlaceTipo").value : "";
  if(tipoPreferido && [...document.getElementById("enlazadaTipo").options].some(o=>o.value===tipoPreferido)){
    document.getElementById("enlazadaTipo").value=tipoPreferido;
    aplicarDuracionEnlazada();
  }

  document.getElementById("enlazadaEstado").value=citaReferencia.estado || "Pendiente";
  document.getElementById("enlazadaObs").value=primeraAntes
    ? "Cita previa enlazada antes de "+citaReferencia.profesional+" a las "+citaReferencia.hora
    : "Cita posterior enlazada tras "+citaReferencia.profesional+" ("+citaReferencia.hora+"-"+hhmmDesdeMinutosYnea(finCitaYnea(citaReferencia))+")";

  actualizarHorasDisponiblesEnlazada();
  document.getElementById("citaEnlazadaOverlay").style.display="flex";
}
function cerrarCitaEnlazada(){
  const overlay=document.getElementById("citaEnlazadaOverlay");
  if(overlay) overlay.style.display="none";
  const fecha=document.getElementById("enlazadaFecha");
  if(fecha) fecha.disabled=false;
  citaReferenciaEnlazada=null;
  modoPrimeraAntes=false;
}
function guardarCitaEnlazada(){
  limpiarErrorEnlazada();
  if(!citaReferenciaEnlazada){
    mostrarErrorEnlazada("No hay cita de referencia.");
    return;
  }

  const hora=document.getElementById("enlazadaHora").value;
  if(!hora){
    mostrarErrorEnlazada("No hay huecos disponibles.");
    return;
  }

  const citaElegida={
    id:Date.now()+1,
    fecha:citaReferenciaEnlazada.fecha,
    hora,
    duracion:document.getElementById("enlazadaDuracion").value,
    pacienteId:citaReferenciaEnlazada.pacienteId,
    profesional:document.getElementById("enlazadaProfesional").value,
    consulta:document.getElementById("enlazadaConsulta").value,
    tipo:document.getElementById("enlazadaTipo").value,
    estado:document.getElementById("enlazadaEstado").value,
    obs:document.getElementById("enlazadaObs").value,
    enlaceId:citaReferenciaEnlazada.id
  };

  if(modoPrimeraAntes){
    if(minutosYnea(citaElegida.hora)+Number(citaElegida.duracion||10) > minutosYnea(citaReferenciaEnlazada.hora)){
      mostrarErrorEnlazada("La primera cita debe terminar antes de la segunda.");
      return;
    }
  }else{
    if(minutosYnea(citaElegida.hora) < finCitaYnea(citaReferenciaEnlazada)){
      mostrarErrorEnlazada("La segunda cita debe empezar después de terminar la primera.");
      return;
    }
  }

  if(!horaDisponibleYnea(citaElegida.fecha,citaElegida.hora,citaElegida.profesional,citaElegida.duracion)){
    mostrarErrorEnlazada("Ese hueco ya no está disponible. Elige otro.");
    actualizarHorasDisponiblesEnlazada();
    return;
  }

  if(modoPrimeraAntes){
    // El usuario ha introducido en el formulario la segunda cita.
    // Ahora guardamos primero la cita previa elegida y después la segunda.
    const primera={...citaElegida};
    const segunda={...citaReferenciaEnlazada, enlaceId:primera.id};
    primera.enlaceId=segunda.id;
    data.citas.push(primera);
    data.citas.push(segunda);
  }else{
    // Modo normal: la cita de referencia ya se guardó; añadimos la segunda.
    data.citas.push(citaElegida);
    const base=(data.citas||[]).find(c=>String(c.id)===String(citaReferenciaEnlazada.id));
    if(base) base.enlaceId=citaElegida.id;
  }

  if(typeof save==="function") save();
  try{localStorage.removeItem('ultimaCitaTemporal');}catch(e){}
  cerrarCitaEnlazada();
  if(typeof renderAll==="function") renderAll();
  alert("Citas enlazadas guardadas correctamente.");
}

// Envolver addCita sin tocar la lógica original.
(function(){
  if(typeof window.addCita==="function" && !window.addCita.__enlaceWrappedV3){
    const originalAddCita=window.addCita;
    window.addCita=function(){
      const crear=document.getElementById("crearCitaEnlazada") && document.getElementById("crearCitaEnlazada").checked;
      const primeraAntes=document.getElementById("crearPrimeroSegunda") && document.getElementById("crearPrimeroSegunda").checked;

      if(crear && primeraAntes){
        // El formulario representa la segunda cita. No se guarda aún.
        const segunda=construirCitaDesdeFormulario();
        if(!segunda.fecha || !segunda.hora || !segunda.pacienteId || !segunda.profesional){
          alert("Completa la segunda cita: fecha, hora, paciente y profesional.");
          return;
        }
        if(typeof bloqueoImpideCita==="function" && bloqueoImpideCita(segunda) && !confirm("La segunda cita está en un horario bloqueado. ¿Continuar igualmente?")) return;
        if(citaSolapaYnea(segunda) && !confirm("La segunda cita se solapa con otra cita. ¿Continuar igualmente?")) return;

        abrirCitaEnlazada(segunda, true);
        return;
      }

      const before=(data.citas||[]).length;
      originalAddCita.apply(this, arguments);
      const after=(data.citas||[]).length;

      if(crear && after>before){
        const citaBase=data.citas[data.citas.length-1];
        setTimeout(()=>abrirCitaEnlazada(citaBase, false),200);
      }
    };
    window.addCita.__enlaceWrappedV3=true;
  }
})();


const DB_BACKUP_YNEA = "AgendaClinicaYneaDB";
const STORE_BACKUP_YNEA = "handles";
const KEY_CARPETA_YNEA = "backupFolder";

function abrirDBBackupYnea(){
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_BACKUP_YNEA, 1);
    req.onupgradeneeded = ()=> {
      const db=req.result;
      if(!db.objectStoreNames.contains(STORE_BACKUP_YNEA)){
        db.createObjectStore(STORE_BACKUP_YNEA);
      }
    };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}

async function guardarHandleCarpetaYnea(handle){
  const db = await abrirDBBackupYnea();
  return new Promise((resolve, reject)=>{
    const tx=db.transaction(STORE_BACKUP_YNEA, "readwrite");
    tx.objectStore(STORE_BACKUP_YNEA).put(handle, KEY_CARPETA_YNEA);
    tx.oncomplete = ()=> resolve();
    tx.onerror = ()=> reject(tx.error);
  });
}

async function obtenerHandleCarpetaYnea(){
  const db = await abrirDBBackupYnea();
  return new Promise((resolve, reject)=>{
    const tx=db.transaction(STORE_BACKUP_YNEA, "readonly");
    const req=tx.objectStore(STORE_BACKUP_YNEA).get(KEY_CARPETA_YNEA);
    req.onsuccess = ()=> resolve(req.result || null);
    req.onerror = ()=> reject(req.error);
  });
}

async function borrarHandleCarpetaYnea(){
  const db = await abrirDBBackupYnea();
  return new Promise((resolve, reject)=>{
    const tx=db.transaction(STORE_BACKUP_YNEA, "readwrite");
    tx.objectStore(STORE_BACKUP_YNEA).delete(KEY_CARPETA_YNEA);
    tx.oncomplete = ()=> resolve();
    tx.onerror = ()=> reject(tx.error);
  });
}

async function permisoCarpetaYnea(handle){
  if(!handle) return false;
  const opts = {mode:"readwrite"};
  if((await handle.queryPermission(opts)) === "granted") return true;
  if((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

async function cambiarRutaBackup(){
  if(!window.showDirectoryPicker){
    alert("Tu navegador no permite seleccionar una carpeta fija. Usa Chrome o Edge actualizado.");
    return;
  }
  try{
    carpetaHandle = await window.showDirectoryPicker();
    await guardarHandleCarpetaYnea(carpetaHandle);
    alert("Carpeta guardada. Se recordará para próximas sesiones si el navegador conserva el permiso.");
  }catch(e){
    if(e && e.name !== "AbortError"){
      alert("No se pudo cambiar la carpeta.");
    }
  }
}

async function olvidarRutaBackup(){
  carpetaHandle = null;
  await borrarHandleCarpetaYnea();
  alert("Ruta olvidada. La próxima vez se volverá a pedir carpeta.");
}

async function cargarCarpetaGuardadaYnea(){
  try{
    carpetaHandle = await obtenerHandleCarpetaYnea();
    return carpetaHandle;
  }catch(e){
    return null;
  }
}

async function guardarEnCarpetaFija(){
  const nombre = "backup_agenda_clinica_" + new Date().toISOString().slice(0,10) + ".json";
  const contenido = JSON.stringify(data, null, 2);

  if(window.showDirectoryPicker){
    try{
      if(!carpetaHandle){
        carpetaHandle = await cargarCarpetaGuardadaYnea();
      }

      if(!carpetaHandle){
        carpetaHandle = await window.showDirectoryPicker();
        await guardarHandleCarpetaYnea(carpetaHandle);
      }

      const permitido = await permisoCarpetaYnea(carpetaHandle);
      if(!permitido){
        alert("No hay permiso para guardar en esa carpeta. Elige la carpeta de nuevo.");
        carpetaHandle = await window.showDirectoryPicker();
        await guardarHandleCarpetaYnea(carpetaHandle);
      }

      const fileHandle = await carpetaHandle.getFileHandle(nombre, {create:true});
      const writable = await fileHandle.createWritable();
      await writable.write(contenido);
      await writable.close();

      localStorage.setItem("agendaClinicaUltimoBackupDiario", new Date().toISOString().slice(0,10));
      if(typeof updateAutosaveStatus === "function"){
        updateAutosaveStatus("Copia guardada");
      }
      alert("Copia guardada correctamente.");
      return;
    }catch(e){
      if(e && e.name === "AbortError") return;
    }
  }

  const blob = new Blob([contenido], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
}

document.addEventListener("DOMContentLoaded", cargarCarpetaGuardadaYnea);


function llenarSelectEditorProfesionalFix(id, arr, valueKey, labelKey){
  const el=document.getElementById(id);
  if(!el) return;
  el.innerHTML=(arr||[]).map(x=>{
    if(typeof x==="object"){
      return `<option value="${x[valueKey]}">${x[labelKey]}</option>`;
    }
    return `<option value="${x}">${x}</option>`;
  }).join("");
}

function tiposPermitidosEditorFix(prof){
  if(typeof tiposPermitidosParaProfesional==="function"){
    return tiposPermitidosParaProfesional(prof);
  }
  if(data.tiposPorProfesional && Object.prototype.hasOwnProperty.call(data.tiposPorProfesional, prof)){
    return data.tiposPorProfesional[prof] || [];
  }
  return data.tipos || [];
}

function refrescarTiposEditorCita(tipoActual){
  const prof=document.getElementById("editCitaProfesional") ? document.getElementById("editCitaProfesional").value : "";
  const tipos=tiposPermitidosEditorFix(prof);
  llenarSelectEditorProfesionalFix("editCitaTipo", tipos);
  if(tipoActual && tipos.includes(tipoActual)){
    document.getElementById("editCitaTipo").value=tipoActual;
  }
  if(typeof aplicarDuracionTipoEditor === "function"){
    aplicarDuracionTipoEditor();
  }
}

function abrirEditorCita(id){
  const cita=(data.citas||[]).find(c=>String(c.id)===String(id));
  if(!cita) return;

  if(typeof limpiarErrorEditorCita==="function") limpiarErrorEditorCita();

  llenarSelectEditorProfesionalFix("editCitaHora", horas);
  llenarSelectEditorProfesionalFix("editCitaPaciente", data.pacientes||[], "id", "nombre");
  llenarSelectEditorProfesionalFix("editCitaProfesional", data.profesionales||[]);
  llenarSelectEditorProfesionalFix("editCitaConsulta", data.consultas||[]);

  document.getElementById("editCitaId").value=cita.id;
  document.getElementById("editCitaFecha").value=cita.fecha;
  document.getElementById("editCitaHora").value=cita.hora;
  document.getElementById("editCitaDuracion").value=cita.duracion || "10";
  document.getElementById("editCitaEstado").value=cita.estado || "Pendiente";
  document.getElementById("editCitaPaciente").value=cita.pacienteId;
  document.getElementById("editCitaProfesional").value=cita.profesional;
  document.getElementById("editCitaConsulta").value=cita.consulta;

  refrescarTiposEditorCita(cita.tipo);
  if(document.getElementById("editCitaTipo")) document.getElementById("editCitaTipo").value=cita.tipo;

  document.getElementById("editCitaObs").value=cita.obs || cita.observaciones || "";
  document.getElementById("editorCitaOverlay").style.display="flex";
}

function guardarCitaDesdeEditor(){
  if(typeof limpiarErrorEditorCita==="function") limpiarErrorEditorCita();

  const id=document.getElementById("editCitaId").value;
  const cita=(data.citas||[]).find(c=>String(c.id)===String(id));
  if(!cita) return;

  const actualizada={
    id:cita.id,
    fecha:document.getElementById("editCitaFecha").value,
    hora:document.getElementById("editCitaHora").value,
    duracion:document.getElementById("editCitaDuracion").value,
    estado:document.getElementById("editCitaEstado").value,
    pacienteId:document.getElementById("editCitaPaciente").value,
    profesional:document.getElementById("editCitaProfesional").value,
    consulta:document.getElementById("editCitaConsulta").value,
    tipo:document.getElementById("editCitaTipo").value,
    obs:document.getElementById("editCitaObs").value
  };

  if(!actualizada.fecha || !actualizada.hora || !actualizada.pacienteId || !actualizada.profesional){
    if(typeof mostrarErrorEditorCita==="function") mostrarErrorEditorCita("Faltan datos obligatorios: fecha, hora, paciente o profesional.");
    else alert("Faltan datos obligatorios: fecha, hora, paciente o profesional.");
    return;
  }

  if(typeof bloqueoImpideCita==="function" && bloqueoImpideCita(actualizada)){
    if(!confirm("Ese horario está bloqueado. ¿Quieres guardar la cita igualmente?")) return;
  }

  // Comprobación de solape excluyendo esta cita.
  const min = (hhmm)=>{
    if(typeof minutesFromHHMM==="function") return minutesFromHHMM(hhmm);
    const [h,m]=String(hhmm).split(":").map(Number);
    return h*60+m;
  };
  const nStart=min(actualizada.hora);
  const nEnd=nStart+Number(actualizada.duracion||10);
  const solape=(data.citas||[]).some(c=>{
    if(String(c.id)===String(actualizada.id)) return false;
    if(c.fecha!==actualizada.fecha || c.profesional!==actualizada.profesional) return false;
    const cStart=min(c.hora);
    const cEnd=cStart+Number(c.duracion||10);
    return nStart < cEnd && nEnd > cStart;
  });

  if(solape && !confirm("Existe otra cita solapada para ese profesional. ¿Guardar igualmente?")) return;

  Object.assign(cita, actualizada);
  if(typeof save==="function") save();
  try{localStorage.removeItem('ultimaCitaTemporal');}catch(e){}
  if(typeof cerrarEditorCita==="function") cerrarEditorCita();
  if(typeof renderAll==="function") renderAll();
}

// Compatibilidad
window.eliminarCitaDesdeEditor=eliminarCitaDesdeEditor;
function editCita(id){ abrirEditorCita(id); }


function tiposPermitidosParaNuevaCita(prof){
  if(!prof) return data.tipos || [];
  if(data.tiposPorProfesional && Object.prototype.hasOwnProperty.call(data.tiposPorProfesional, prof)){
    return data.tiposPorProfesional[prof] || [];
  }
  return data.tipos || [];
}

function actualizarTiposNuevaCita(){
  const profSel = document.getElementById("profesionalCita");
  const tipoSel = document.getElementById("tipoCita");
  if(!profSel || !tipoSel) return;

  const actual = tipoSel.value;
  const tipos = tiposPermitidosParaNuevaCita(profSel.value);

  tipoSel.innerHTML = tipos.length
    ? tipos.map(t => `<option value="${t}">${t}</option>`).join("")
    : '<option value="">Sin tipos habilitados</option>';

  if(actual && tipos.includes(actual)){
    tipoSel.value = actual;
  }

  if(typeof applyTipoDuration === "function"){
    applyTipoDuration();
  }
}

// Refuerzo: después de cualquier refresh general, vuelve a filtrar los tipos
(function(){
  if(typeof window.refreshAllSelects === "function" && !window.refreshAllSelects.__tiposFixWrapped){
    const originalRefresh = window.refreshAllSelects;
    window.refreshAllSelects = function(){
      const r = originalRefresh.apply(this, arguments);
      actualizarTiposNuevaCita();
      return r;
    };
    window.refreshAllSelects.__tiposFixWrapped = true;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(actualizarTiposNuevaCita, 100);
  });
})();


function inicializarAvisos(){
  if(!data.avisosEnviados) data.avisosEnviados = {};
  if($("avisosFecha") && !$("avisosFecha").value) $("avisosFecha").value = new Date().toISOString().slice(0,10);
  if($("avisosProfesional")) {
    $("avisosProfesional").innerHTML = '<option value="">Todos</option>' + (data.profesionales||[]).map(p=>`<option value="${p}">${p}</option>`).join("");
  }
}

function fechaAvisoDeCita(cita){
  const d = new Date(cita.fecha + "T00:00:00");
  d.setDate(d.getDate() - 2);
  return d.toISOString().slice(0,10);
}

function pacienteDeCita(cita){
  return (data.pacientes||[]).find(p=>String(p.id)===String(cita.pacienteId)) || {};
}

function textoAvisoCita(cita){
  const p = pacienteDeCita(cita);
  return `Hola ${p.nombre || ""}, le recordamos su cita en Ynea el día ${formatoFechaES(cita.fecha)} a las ${cita.hora} con ${cita.profesional}. Si no puede asistir, contacte con la clínica. Gracias.`;
}

function formatoFechaES(fecha){
  const d = new Date(fecha + "T00:00:00");
  return d.toLocaleDateString("es-ES");
}

function avisoKey(cita){
  return "cita_" + cita.id;
}

function citasConAvisoVisible(){
  if(!data.avisosEnviados) data.avisosEnviados = {};
  const fecha = $("avisosFecha") ? $("avisosFecha").value : new Date().toISOString().slice(0,10);
  const prof = $("avisosProfesional") ? $("avisosProfesional").value : "";
  const filtro = $("avisosEstadoFiltro") ? $("avisosEstadoFiltro").value : "";

  return (data.citas||[]).filter(c=>{
    const okFecha = fechaAvisoDeCita(c) === fecha;
    const okProf = !prof || c.profesional === prof;
    const enviado = !!data.avisosEnviados[avisoKey(c)];
    const okEstado = !filtro || (filtro==="enviado" ? enviado : !enviado);
    return okFecha && okProf && okEstado;
  }).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
}

function enviarEmailAviso(id){
  const cita = (data.citas||[]).find(c=>String(c.id)===String(id));
  if(!cita) return;
  const p = pacienteDeCita(cita);
  if(!p.email){
    alert("Este paciente no tiene email registrado.");
    return;
  }
  const subject = encodeURIComponent("Recordatorio de cita - Ynea");
  const body = encodeURIComponent(textoAvisoCita(cita));
  window.location.href = `mailto:${encodeURIComponent(p.email)}?subject=${subject}&body=${body}`;
  marcarAvisoEnviado(id, "email");
}

function enviarSMSAviso(id){
  const cita = (data.citas||[]).find(c=>String(c.id)===String(id));
  if(!cita) return;
  const p = pacienteDeCita(cita);
  if(!p.telefono){
    alert("Este paciente no tiene teléfono registrado.");
    return;
  }
  const body = encodeURIComponent(textoAvisoCita(cita));
  window.location.href = `sms:${encodeURIComponent(p.telefono)}?&body=${body}`;
  marcarAvisoEnviado(id, "sms");
}

function marcarAvisoEnviado(id, canal){
  if(!data.avisosEnviados) data.avisosEnviados = {};
  data.avisosEnviados["cita_" + id] = {
    fecha: new Date().toISOString(),
    canal: canal || "manual"
  };
  if(typeof save==="function") save();
  try{localStorage.removeItem('ultimaCitaTemporal');}catch(e){}
  if(typeof renderAll==="function") renderAll();
}

function marcarTodosAvisosEnviados(){
  const citas = citasConAvisoVisible();
  if(!citas.length){
    alert("No hay avisos visibles para marcar.");
    return;
  }
  if(!confirm("¿Marcar todos los avisos visibles como enviados?")) return;
  citas.forEach(c=>marcarAvisoEnviado(c.id, "manual"));
}

function renderAvisos(){
  inicializarAvisos();
  const table = $("avisosTable");
  if(!table) return;

  const citas = citasConAvisoVisible();
  table.innerHTML =
    "<thead><tr><th>Paciente</th><th>Contacto</th><th>Cita</th><th>Profesional</th><th>Mensaje</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>" +
    citas.map(c=>{
      const p = pacienteDeCita(c);
      const enviado = data.avisosEnviados && data.avisosEnviados[avisoKey(c)];
      const mensaje = textoAvisoCita(c);
      return `<tr>
        <td><b>${p.nombre || ""}</b></td>
        <td>${p.telefono || ""}<br>${p.email || ""}</td>
        <td>${formatoFechaES(c.fecha)}<br>${c.hora}</td>
        <td>${c.profesional}</td>
        <td>${mensaje}</td>
        <td>${enviado ? "Enviado ("+(enviado.canal||"manual")+")" : "Pendiente"}</td>
        <td>
          <button onclick="enviarEmailAviso(${c.id})">Email</button>
          <button class="secondary" onclick="enviarSMSAviso(${c.id})">SMS</button>
          <button class="secondary" onclick="marcarAvisoEnviado(${c.id},'manual')">Marcar enviado</button>
        </td>
      </tr>`;
    }).join("") +
    "</tbody>";

  if(!citas.length){
    table.innerHTML = "<tbody><tr><td>No hay avisos para los filtros seleccionados.</td></tr></tbody>";
  }
}

function exportarAvisosCSV(){
  const citas = citasConAvisoVisible();
  const header = ["Paciente","Telefono","Email","Fecha cita","Hora","Profesional","Mensaje","Estado"];
  const rows = citas.map(c=>{
    const p=pacienteDeCita(c);
    const enviado = data.avisosEnviados && data.avisosEnviados[avisoKey(c)];
    return [p.nombre||"",p.telefono||"",p.email||"",c.fecha,c.hora,c.profesional,textoAvisoCita(c),enviado?"Enviado":"Pendiente"];
  });
  const csv=[header,...rows].map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="avisos_citas.csv";
  a.click();
}

(function(){
  document.addEventListener("DOMContentLoaded", inicializarAvisos);
})();


function _infoTodayISO(){
  return new Date().toISOString().slice(0,10);
}
function _infoAddDaysISO(days){
  const d=new Date();
  d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}
function _infoPacienteNombre(id){
  const p=(data.pacientes||[]).find(x=>String(x.id)===String(id));
  return p ? p.nombre : "";
}
function _infoCountBy(arr, key){
  const out={};
  arr.forEach(x=>{
    const k=typeof key==="function" ? key(x) : x[key];
    out[k || "Sin definir"]=(out[k || "Sin definir"]||0)+1;
  });
  return out;
}
function _infoMiniTable(obj){
  const entries=Object.entries(obj).sort((a,b)=>b[1]-a[1]);
  if(!entries.length) return "<p class='small'>Sin datos</p>";
  return `<table style="min-width:0;width:100%"><tbody>${entries.map(([k,v])=>`<tr><td>${k}</td><td style="text-align:right"><b>${v}</b></td></tr>`).join("")}</tbody></table>`;
}
function renderInfoDiaria(){
  const el = document.getElementById("infoDiariaContent");
  if(!el || typeof data === "undefined") return;

  const hoy=_infoTodayISO();
  const en48=_infoAddDaysISO(2);
  const citas=data.citas||[];
  const citasHoy=citas.filter(c=>c.fecha===hoy);
  const citas48=citas.filter(c=>c.fecha>=hoy && c.fecha<=en48);
  const canceladasHoy=citasHoy.filter(c=>c.estado==="Cancelada").length;
  const noAcudeHoy=citasHoy.filter(c=>c.estado==="No acude").length;
  const pendientesHoy=citasHoy.filter(c=>c.estado==="Pendiente").length;
  const confirmadasHoy=citasHoy.filter(c=>c.estado==="Confirmada").length;

  const porProfesional=_infoCountBy(citasHoy,"profesional");
  const porEstado=_infoCountBy(citasHoy,"estado");
  const porTipo=_infoCountBy(citasHoy,"tipo");

  const proximas=citas
    .filter(c=>c.fecha>=hoy)
    .sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora))
    .slice(0,8);

  el.innerHTML = `
    <div class="infoBox">Citas de hoy <b>${citasHoy.length}</b></div>
    <div class="infoBox">Confirmadas hoy <b>${confirmadasHoy}</b></div>
    <div class="infoBox">Pendientes hoy <b>${pendientesHoy}</b></div>
    <div class="infoBox">Próximas 48h <b>${citas48.length}</b></div>
    <div class="infoBox">Canceladas hoy <b>${canceladasHoy}</b></div>
    <div class="infoBox">No acude hoy <b>${noAcudeHoy}</b></div>
    <div class="infoBox">Pacientes totales <b>${(data.pacientes||[]).length}</b></div>
    <div class="infoBox">Profesionales activos <b>${(data.profesionales||[]).length}</b></div>

    <div class="card" style="grid-column:1/-1;box-shadow:none">
      <h3>Próximas citas</h3>
      <div class="tableWrap">
        <table>
          <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Profesional</th><th>Tipo</th><th>Estado</th></tr></thead>
          <tbody>
            ${proximas.length ? proximas.map(c=>`<tr><td>${c.fecha}</td><td>${c.hora}</td><td>${_infoPacienteNombre(c.pacienteId)}</td><td>${c.profesional}</td><td>${c.tipo}</td><td>${c.estado}</td></tr>`).join("") : `<tr><td colspan="6">No hay próximas citas.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <div class="infoBox" style="grid-column:span 2">
      <h3>Citas de hoy por profesional</h3>
      ${_infoMiniTable(porProfesional)}
    </div>

    <div class="infoBox" style="grid-column:span 2">
      <h3>Citas de hoy por estado</h3>
      ${_infoMiniTable(porEstado)}
    </div>

    <div class="infoBox" style="grid-column:span 2">
      <h3>Citas de hoy por tipo</h3>
      ${_infoMiniTable(porTipo)}
    </div>
  `;
}
(function(){
  const hook = function(){
    if(typeof renderAll === "function" && !renderAll.__infoDiariaHook){
      const originalRenderAll = renderAll;
      renderAll = function(){
        const result = originalRenderAll.apply(this, arguments);
        renderInfoDiaria();
        return result;
      };
      renderAll.__infoDiariaHook = true;
    }
    renderInfoDiaria();
  };
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", hook);
  }else{
    hook();
  }
})();


function normalizarTextoPaciente(v){
  return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
function actualizarBuscadorPacienteCita(){
  const hidden=document.getElementById("pacienteCita");
  const input=document.getElementById("pacienteBusqueda");
  if(!hidden || !input) return;
  const p=(data.pacientes||[]).find(x=>String(x.id)===String(hidden.value));
  if(p && !input.value) input.value=p.nombre||"";
}
function buscarPacienteCita(){
  const input=document.getElementById("pacienteBusqueda");
  const hidden=document.getElementById("pacienteCita");
  const box=document.getElementById("pacienteResultados");
  if(!input || !hidden || !box) return;
  const q=normalizarTextoPaciente(input.value);
  hidden.value="";
  let pacientes=(data.pacientes||[]);
  if(q){
    pacientes=pacientes.filter(p=>{
      const texto=normalizarTextoPaciente((p.nombre||"")+" "+(p.telefono||"")+" "+(p.email||""));
      return texto.includes(q);
    });
  }
  pacientes=pacientes.slice(0,12);
  if(!pacientes.length){
    box.innerHTML='<div class="pacienteResultadoItem"><strong>No hay resultados</strong><span>Puedes crear un paciente nuevo</span></div>';
    box.style.display="block";
    return;
  }
  box.innerHTML=pacientes.map(p=>`
    <div class="pacienteResultadoItem" onclick="seleccionarPacienteCita('${String(p.id).replaceAll("'","\\'")}')">
      <strong>${p.nombre||""}</strong>
      <span>${p.telefono||""}${p.telefono&&p.email?" · ":""}${p.email||""}</span>
    </div>`).join("");
  box.style.display="block";
}
function seleccionarPacienteCita(id){
  const p=(data.pacientes||[]).find(x=>String(x.id)===String(id));
  if(!p) return;
  document.getElementById("pacienteCita").value=p.id;
  document.getElementById("pacienteBusqueda").value=p.nombre||"";
  const box=document.getElementById("pacienteResultados");
  if(box) box.style.display="none";
  let info=document.getElementById("pacienteSeleccionadoInfo");
  if(!info){
    info=document.createElement("div");
    info.id="pacienteSeleccionadoInfo";
    info.className="pacienteSeleccionado";
    document.querySelector(".pacienteSearchBox").appendChild(info);
  }
  info.innerHTML=`Paciente seleccionado: <b>${p.nombre||""}</b>${p.telefono?" · "+p.telefono:""}${p.email?" · "+p.email:""}`;
}
function abrirNuevoPacienteDesdeBusqueda(){
  if(typeof abrirNuevoPaciente==="function"){
    abrirNuevoPaciente();
    return;
  }
  const nombre=prompt("Nombre del nuevo paciente:");
  if(!nombre) return;
  const telefono=prompt("Teléfono:")||"";
  const email=prompt("Email:")||"";
  const nuevo={id:"p"+Date.now(), nombre:nombre.trim(), telefono, email, obs:""};
  data.pacientes.push(nuevo);
  if(typeof save==="function") save();
  try{localStorage.removeItem('ultimaCitaTemporal');}catch(e){}
  if(typeof refreshAllSelects==="function") refreshAllSelects();
  seleccionarPacienteCita(nuevo.id);
}
function pacienteSeleccionadoParaCita(){
  const hidden=document.getElementById("pacienteCita");
  if(hidden && hidden.value) return hidden.value;
  const input=document.getElementById("pacienteBusqueda");
  const q=normalizarTextoPaciente(input ? input.value : "");
  if(q){
    const p=(data.pacientes||[]).find(x=>normalizarTextoPaciente(x.nombre)===q);
    if(p){
      hidden.value=p.id;
      return p.id;
    }
  }
  return "";
}
document.addEventListener("click", function(e){
  const box=document.getElementById("pacienteResultados");
  const wrap=document.querySelector(".pacienteSearchBox");
  if(box && wrap && !wrap.contains(e.target)) box.style.display="none";
});


(function(){
  const views=["semana","mensual","anual","agenda","pacientes","config","bloqueos","listados","copias","avisos","infoDiaria"];
  const originalSetView=window.setView;
  function syncMobileNav(view){
    document.querySelectorAll('.mobileNavBtn').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.mobileView===view);
    });
  }
  window.appMobileSetView=function(view){
    if(typeof originalSetView==='function') originalSetView(view, null);
    else {
      views.forEach(v=>{ const el=document.getElementById(v+'View'); if(el) el.style.display=v===view?'block':'none'; });
    }
    syncMobileNav(view);
    if(window.innerWidth<=900) window.scrollTo({top:0,behavior:'smooth'});
  };
  window.setView=function(view,btn){
    if(typeof originalSetView==='function') originalSetView(view,btn);
    syncMobileNav(view);
  };
  document.addEventListener('click',function(e){
    const btn=e.target.closest('.mobileNavBtn');
    if(!btn) return;
    window.appMobileSetView(btn.dataset.mobileView);
  });
  document.addEventListener('DOMContentLoaded',function(){
    syncMobileNav('semana');
  });
})();


(function(){
  const VIEWS=["semana","mensual","agenda","pacientes","config","bloqueos","listados","copias","avisos","infoDiaria"];
  function $(id){return document.getElementById(id)}
  function esc(v){return String(v??"").replace(/[&<>"]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));}
  function isMobile(){return window.matchMedia && window.matchMedia('(max-width:900px)').matches;}
  function ensureMonthModal(){
    if($('monthModalOverlay')) return;
    const div=document.createElement('div');
    div.id='monthModalOverlay';
    div.className='monthModalOverlay';
    div.innerHTML='<div class="monthModal"><div class="monthModalHead"><h2 id="monthModalTitle">Citas del día</h2><button class="secondary" type="button" onclick="cerrarDiaMensualYnea()">Cerrar</button></div><div id="monthModalContent"></div><div class="monthModalActions"><button type="button" onclick="crearCitaDiaMensualYnea()">Añadir cita</button><button class="secondary" type="button" onclick="cerrarDiaMensualYnea()">Cerrar</button></div></div>';
    document.body.appendChild(div);
  }
  window.cerrarDiaMensualYnea=function(){ const el=$('monthModalOverlay'); if(el) el.style.display='none'; };
  window.abrirDiaMensualYnea=function(fecha){
    ensureMonthModal();
    window.__yneaMesFecha=fecha;
    const prof=($('monthProf') && $('monthProf').value) ? $('monthProf').value : '';
    const citas=((typeof data!=="undefined" && data.citas ? data.citas : [])).filter(c=>c.fecha===fecha && (!prof || c.profesional===prof)).sort((a,b)=>String(a.hora).localeCompare(String(b.hora)));
    const d=new Date(fecha+'T00:00:00');
    $('monthModalTitle').textContent='Citas · '+d.toLocaleDateString('es-ES',{weekday:'long',day:'2-digit',month:'long'});
    $('monthModalContent').innerHTML = citas.length ? citas.map(c=>{
      const p=(typeof paciente==='function') ? paciente(c.pacienteId) : ((data.pacientes||[]).find(x=>String(x.id)===String(c.pacienteId))||{});
      return `<div class="monthCita" onclick="abrirEditorCita(${Number(c.id)})"><b>${esc(c.hora)} · ${esc(p.nombre||'Paciente')}</b><br><span>${esc(c.profesional||'')} · ${esc(c.tipo||'')} · ${esc(c.consulta||'')}</span><br><small>${esc(c.estado||'')}</small></div>`;
    }).join('') : '<p class="small">No hay citas en este día.</p>';
    $('monthModalOverlay').style.display='flex';
  };
  window.crearCitaDiaMensualYnea=function(){
    const fecha=window.__yneaMesFecha || (new Date()).toISOString().slice(0,10);
    cerrarDiaMensualYnea();
    if($('fechaCita')) $('fechaCita').value=fecha;
    if($('horaCita') && !$('horaCita').value) $('horaCita').value='09:30';
    const prof=($('monthProf') && $('monthProf').value) ? $('monthProf').value : '';
    if(prof && $('profesionalCita')) $('profesionalCita').value=prof;
    if(typeof setView==='function') setView('agenda',null);
    setTimeout(()=>{ const el=$('pacienteBusqueda')||$('pacienteCita'); if(el) el.focus(); },80);
  };

  // Quitar vista anual de la navegación sin borrar funciones internas.
  function ocultarAnual(){
    document.querySelectorAll('button').forEach(b=>{ if((b.getAttribute('onclick')||'').includes("setView('anual'")) b.style.display='none'; });
    const anual=$('anualView'); if(anual) anual.style.display='none';
  }

  // Reemplazo estable de navegación: en móvil nunca muestra ajustes/listados/copias/bloqueos.
  const oldSetView=window.setView;
  window.setView=function(view,btn){
    if(view==='anual') view='semana';
    if(isMobile() && ['config','listados','copias','infoDiaria','avisos','bloqueos','agenda'].includes(view)) view='semana';
    VIEWS.forEach(v=>{ const el=$(v+'View'); if(el) el.style.display=(v===view?'block':'none'); });
    ocultarAnual();
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    document.querySelectorAll('.mobileNavBtn').forEach(b=>b.classList.toggle('active', b.dataset.mobileView===view));
    try{ if(typeof renderAll==='function') renderAll(); }catch(e){ console.error('renderAll:',e); }
  };

  // Selects robustos, incluido bloqueos.
  function llenar(id,arr,first){
    const el=$(id); if(!el) return;
    const current=el.value;
    el.innerHTML=(first||'')+(arr||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    if([...el.options].some(o=>o.value===current)) el.value=current;
  }
  const oldRefresh=window.refreshAllSelects;
  window.refreshAllSelects=function(){
    try{ if(typeof oldRefresh==='function') oldRefresh(); }catch(e){ console.warn('refresh antiguo:',e); }
    if(typeof data==="undefined") return;
    llenar('profesionalCita',data.profesionales||[]);
    llenar('enlaceProfesional',data.profesionales||[]);
    llenar('weekProf',data.profesionales||[],'<option value="">Todos</option>');
    llenar('monthProf',data.profesionales||[],'<option value="">Todos</option>');
    llenar('bloqProfesionalNuevo',data.profesionales||[],'');
    llenar('consultaCita',data.consultas||[]);
    llenar('weekConsulta',data.consultas||[],'<option value="">Todas</option>');
    llenar('tipoCita',typeof tiposPermitidosParaProfesional==='function' ? tiposPermitidosParaProfesional($('profesionalCita')?.value||'') : (data.tipos||[]));
    llenar('filtroProf',data.profesionales||[],'<option value="">Todos</option>');
    llenar('filtroTipo',data.tipos||[],'<option value="">Todos</option>');
    if(typeof actualizarBuscadorPacienteCita==='function') actualizarBuscadorPacienteCita();
  };

  // Pacientes visibles y editables al clicar.
  window.renderPatients=function(){
    const table=$('pacientesTable'); if(!table || typeof data==="undefined") return;
    const pacientes=data.pacientes||[];
    table.innerHTML='<thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Observaciones</th></tr></thead><tbody>'+pacientes.map(p=>`<tr onclick="editarPacienteYnea('${String(p.id).replace(/'/g,"\\'")}')"><td><b>${esc(p.nombre)}</b></td><td>${esc(p.telefono||'')}</td><td>${esc(p.email||'')}</td><td>${esc(p.obs||'')}</td></tr>`).join('')+'</tbody>';
  };
  window.editarPacienteYnea=function(id){
    const p=(data.pacientes||[]).find(x=>String(x.id)===String(id)); if(!p) return;
    const nombre=prompt('Nombre del paciente:',p.nombre||''); if(nombre===null) return;
    const telefono=prompt('Teléfono obligatorio:',p.telefono||''); if(telefono===null) return;
    const email=prompt('Email obligatorio:',p.email||''); if(email===null) return;
    if(!String(nombre).trim()) return alert('El nombre es obligatorio.');
    if(!String(telefono).trim()) return alert('El teléfono es obligatorio.');
    if(!String(email).trim()) return alert('El email es obligatorio.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return alert('Introduce un email válido.');
    const obs=prompt('Observaciones:',p.obs||''); if(obs===null) return;
    p.nombre=String(nombre).trim(); p.telefono=String(telefono).trim(); p.email=String(email).trim(); p.obs=String(obs||'').trim();
    if(typeof save==='function') save();
    if(typeof refreshAllSelects==='function') refreshAllSelects();
    if(typeof renderAll==='function') renderAll();
  };

  // Alta paciente: obliga teléfono y email tanto en ficha como en modal.
  window.addPaciente=function(){
    const nombre=($('pacNombre')?.value||'').trim();
    const telefono=($('pacTelefono')?.value||'').trim();
    const email=($('pacEmail')?.value||'').trim();
    const obs=$('pacObs')?.value||'';
    if(!nombre) return alert('Escribe el nombre del paciente.');
    if(!telefono) return alert('El teléfono es obligatorio.');
    if(!email) return alert('El email es obligatorio.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Introduce un email válido.');
    data.pacientes.push({id:'p'+Date.now(),nombre,telefono,email,obs});
    if(typeof save==='function') save();
    ['pacNombre','pacTelefono','pacEmail','pacObs'].forEach(id=>{ if($(id)) $(id).value=''; });
    if(typeof refreshAllSelects==='function') refreshAllSelects();
    if(typeof renderAll==='function') renderAll();
    alert('Paciente guardado.');
  };
  const oldGuardarNuevo=window.guardarNuevoPacienteModal;
  window.guardarNuevoPacienteModal=function(){
    const email=($('npEmail')?.value||'').trim();
    if(!email){ if(typeof mostrarErrorNuevoPaciente==='function') mostrarErrorNuevoPaciente('El email es obligatorio.'); else alert('El email es obligatorio.'); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ if(typeof mostrarErrorNuevoPaciente==='function') mostrarErrorNuevoPaciente('Introduce un email válido.'); else alert('Introduce un email válido.'); return; }
    if(typeof oldGuardarNuevo==='function') return oldGuardarNuevo();
  };

  // Vista mensual desplegable: solo colorea días con citas y no pinta todas las citas en la tabla.
  window.renderMonthView=function(){
    const table=$('monthTable'); if(!table || typeof data==="undefined") return;
    const monthValue=($('monthPicker')&&$('monthPicker').value)||new Date().toISOString().slice(0,7);
    const prof=($('monthProf')&&$('monthProf').value)||'';
    const [yearN, monthNRaw]=monthValue.split('-').map(Number);
    const monthN=monthNRaw-1;
    const first=new Date(yearN,monthN,1);
    const last=new Date(yearN,monthN+1,0);
    const start=(typeof monday==='function') ? monday(first) : first;
    if($('monthTitle')) $('monthTitle').textContent=(prof?'Profesional: '+prof:'Todos los profesionales')+' · '+first.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    let out='<thead><tr><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th></tr></thead><tbody>';
    let cur=new Date(start);
    for(let w=0; w<6; w++){
      out+='<tr>';
      for(let i=0;i<5;i++){
        const d=(typeof addDays==='function') ? addDays(cur,i) : new Date(cur.getTime()+i*86400000);
        const fecha=(typeof iso==='function') ? iso(d) : d.toISOString().slice(0,10);
        const inMonth=d.getMonth()===monthN;
        const citas=(data.citas||[]).filter(c=>c.fecha===fecha && (!prof || c.profesional===prof));
        out+=`<td class="month-day ${inMonth?'':'out'} ${citas.length?'has-citas':''}" onclick="abrirDiaMensualYnea('${fecha}')"><span class="day-num">${d.getDate()}</span>${citas.length?`<span class="day-count">${citas.length} cita${citas.length>1?'s':''}</span>`:'<span class="day-empty">Añadir</span>'}</td>`;
      }
      out+='</tr>';
      cur=(typeof addDays==='function') ? addDays(cur,7) : new Date(cur.getTime()+7*86400000);
      if(cur>last && cur.getMonth()!==monthN) break;
    }
    out+='</tbody>'; table.innerHTML=out;
  };

  // Ajuste móvil: solo Semana, Mes y Pacientes; sin + flotante ni Ajustes.
  function ajustarNavMovil(){
    const nav=document.querySelector('.mobileBottomNav');
    if(nav){
      const btns=[...nav.querySelectorAll('.mobileNavBtn')];
      if(btns[0]){btns[0].dataset.mobileView='semana'; btns[0].innerHTML='<span class="ico">📅</span><span>Semana</span>'; btns[0].style.display='flex';}
      if(btns[1]){btns[1].dataset.mobileView='mensual'; btns[1].innerHTML='<span class="ico">🗓️</span><span>Mes</span>'; btns[1].style.display='flex';}
      if(btns[2]){btns[2].dataset.mobileView='pacientes'; btns[2].innerHTML='<span class="ico">👤</span><span>Pacientes</span>'; btns[2].style.display='flex';}
      btns.slice(3).forEach(b=>b.style.display='none');
    }
    document.querySelectorAll('.appFab,.autosaveBar').forEach(el=>el.style.display='none');
  }
  document.addEventListener('click',function(e){
    const btn=e.target.closest('.mobileNavBtn');
    if(!btn) return;
    e.preventDefault();
    window.setView(btn.dataset.mobileView||'semana',null);
  },true);

  const oldRenderAll=window.renderAll;
  window.renderAll=function(){
    try{ if(typeof oldRenderAll==='function') oldRenderAll(); }catch(e){ console.warn('renderAll antiguo:',e); }
    try{ window.renderPatients(); }catch(e){ console.error('renderPatients:',e); }
    try{ window.renderMonthView(); }catch(e){ console.error('renderMonthView:',e); }
    try{ if($('bloqProfesionalNuevo')) llenar('bloqProfesionalNuevo',(data&&data.profesionales)||[],''); }catch(e){}
    ocultarAnual(); ajustarNavMovil();
  };

  document.addEventListener('DOMContentLoaded',function(){
    ocultarAnual(); ajustarNavMovil();
    try{ if(typeof refreshAllSelects==='function') refreshAllSelects(); }catch(e){}
    try{ if(typeof renderAll==='function') renderAll(); }catch(e){}
    if(isMobile()) window.setView('semana',null);
  });
})();


(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const isMobile=()=>matchMedia('(max-width:900px)').matches;
  function getData(){ try{return data;}catch(e){return null;} }
  function ensureVisibleView(view){
    const allowed=['semana','mensual','agenda','pacientes','config','bloqueos','listados','copias','avisos','infoDiaria'];
    if(view==='anual') view='semana';
    if(isMobile() && !['semana','mensual','pacientes'].includes(view)) view='semana';
    allowed.forEach(v=>{ const el=$(v+'View'); if(el) el.style.display=(v===view?'block':'none'); });
    const anual=$('anualView'); if(anual) anual.style.display='none';
    document.querySelectorAll('button').forEach(b=>{ if((b.getAttribute('onclick')||'').includes("setView('anual'")) b.style.display='none'; });
    document.querySelectorAll('.mobileNavBtn').forEach(b=>b.classList.toggle('active', b.dataset.mobileView===view));
  }
  const previousSetView=window.setView;
  window.setView=function(view,btn){
    ensureVisibleView(view);
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    try{ if(typeof renderAll==='function') renderAll(); }catch(e){ console.error('renderAll final',e); }
  };
  function optionList(arr,first=''){ return first+(arr||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''); }
  function fillSelect(id,arr,first=''){ const el=$(id); if(!el) return; const old=el.value; el.innerHTML=optionList(arr,first); if([...el.options].some(o=>o.value===old)) el.value=old; }
  const oldRefresh=window.refreshAllSelects;
  window.refreshAllSelects=function(){
    try{ if(typeof oldRefresh==='function') oldRefresh(); }catch(e){ console.warn(e); }
    const d=getData(); if(!d) return;
    fillSelect('profesionalCita',d.profesionales||[]);
    fillSelect('enlaceProfesional',d.profesionales||[]);
    fillSelect('weekProf',d.profesionales||[],'<option value="">Todos</option>');
    fillSelect('monthProf',d.profesionales||[],'<option value="">Todos</option>');
    fillSelect('bloqProfesionalNuevo',d.profesionales||[]);
    fillSelect('filtroProf',d.profesionales||[],'<option value="">Todos</option>');
    fillSelect('consultaCita',d.consultas||[]);
    fillSelect('weekConsulta',d.consultas||[],'<option value="">Todas</option>');
    fillSelect('tipoCita',d.tipos||[]);
    fillSelect('filtroTipo',d.tipos||[],'<option value="">Todos</option>');
    try{ if(typeof actualizarBuscadorPacienteCita==='function') actualizarBuscadorPacienteCita(); }catch(e){}
  };
  window.editarPacienteYnea=function(id){
    const d=getData(); if(!d) return;
    const p=(d.pacientes||[]).find(x=>String(x.id)===String(id)); if(!p) return;
    const nombre=prompt('Nombre del paciente:',p.nombre||''); if(nombre===null) return;
    const telefono=prompt('Teléfono obligatorio:',p.telefono||''); if(telefono===null) return;
    const email=prompt('Email obligatorio:',p.email||''); if(email===null) return;
    if(!String(nombre).trim()) return alert('El nombre es obligatorio.');
    if(!String(telefono).trim()) return alert('El teléfono es obligatorio.');
    if(!String(email).trim()) return alert('El email es obligatorio.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return alert('Introduce un email válido.');
    const obs=prompt('Observaciones:',p.obs||''); if(obs===null) return;
    Object.assign(p,{nombre:String(nombre).trim(),telefono:String(telefono).trim(),email:String(email).trim(),obs:String(obs||'').trim()});
    try{ if(typeof save==='function') save(); }catch(e){}
    try{ refreshAllSelects(); renderAll(); }catch(e){}
  };
  window.renderPatients=function(){
    const d=getData(), table=$('pacientesTable'); if(!d||!table) return;
    const pacientes=d.pacientes||[];
    table.innerHTML='<thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Observaciones</th></tr></thead><tbody>'+pacientes.map(p=>`<tr data-paciente-id="${esc(p.id)}"><td><b>${esc(p.nombre)}</b></td><td>${esc(p.telefono||'')}</td><td>${esc(p.email||'')}</td><td>${esc(p.obs||'')}</td></tr>`).join('')+'</tbody>';
    table.querySelectorAll('tbody tr').forEach(tr=>tr.onclick=()=>window.editarPacienteYnea(tr.dataset.pacienteId));
  };
  window.addPaciente=function(){
    const d=getData(); if(!d) return;
    const nombre=($('pacNombre')?.value||'').trim();
    const telefono=($('pacTelefono')?.value||'').trim();
    const email=($('pacEmail')?.value||'').trim();
    const obs=$('pacObs')?.value||'';
    if(!nombre) return alert('Escribe el nombre del paciente.');
    if(!telefono) return alert('El teléfono es obligatorio.');
    if(!email) return alert('El email es obligatorio.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Introduce un email válido.');
    d.pacientes.push({id:'p'+Date.now(),nombre,telefono,email,obs});
    try{ if(typeof save==='function') save(); }catch(e){}
    ['pacNombre','pacTelefono','pacEmail','pacObs'].forEach(id=>{ if($(id)) $(id).value=''; });
    refreshAllSelects(); renderAll(); alert('Paciente guardado.');
  };
  const oldModal=window.guardarNuevoPacienteModal;
  window.guardarNuevoPacienteModal=function(){
    const tel=($('npTelefono')?.value||'').trim();
    const email=($('npEmail')?.value||'').trim();
    if(!tel) return (typeof mostrarErrorNuevoPaciente==='function'?mostrarErrorNuevoPaciente('El teléfono es obligatorio.'):alert('El teléfono es obligatorio.'));
    if(!email) return (typeof mostrarErrorNuevoPaciente==='function'?mostrarErrorNuevoPaciente('El email es obligatorio.'):alert('El email es obligatorio.'));
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (typeof mostrarErrorNuevoPaciente==='function'?mostrarErrorNuevoPaciente('Introduce un email válido.'):alert('Introduce un email válido.'));
    if(typeof oldModal==='function') return oldModal();
  };
  window.__yneaMesExpandido='';
  window.abrirDiaMensualYnea=function(fecha){
    const d=getData(); if(!d) return;
    const citas=(d.citas||[]).filter(c=>c.fecha===fecha);
    if(citas.length && window.__yneaMesExpandido!==fecha){ window.__yneaMesExpandido=fecha; renderMonthView(); return; }
    if(confirm('¿Añadir cita el '+fecha+'?')){
      if(typeof limpiarFormularioCita==='function') limpiarFormularioCita();
      if($('fechaCita')) $('fechaCita').value=fecha;
      if($('horaCita') && !$('horaCita').value) $('horaCita').value='09:30';
      if($('profesionalCita') && $('monthProf')?.value) $('profesionalCita').value=$('monthProf').value;
      ensureVisibleView('agenda');
      setTimeout(()=>($('pacienteBusqueda')||$('pacienteCita'))?.focus(),80);
    }
  };
  window.renderMonthView=function(){
    const d=getData(), table=$('monthTable'); if(!d||!table) return;
    const monthValue=($('monthPicker')?.value)||new Date().toISOString().slice(0,7);
    const prof=($('monthProf')?.value)||'';
    const [yy,mmRaw]=monthValue.split('-').map(Number), mm=mmRaw-1;
    const first=new Date(yy,mm,1), last=new Date(yy,mm+1,0);
    const start=(typeof monday==='function')?monday(first):new Date(first);
    if($('monthTitle')) $('monthTitle').textContent=(prof?'Profesional: '+prof:'Todos los profesionales')+' · '+first.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    let cur=new Date(start), out='<thead><tr><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th></tr></thead><tbody>';
    for(let w=0;w<6;w++){ out+='<tr>';
      for(let i=0;i<5;i++){
        const dd=(typeof addDays==='function')?addDays(cur,i):new Date(cur.getTime()+i*86400000);
        const fecha=(typeof iso==='function')?iso(dd):dd.toISOString().slice(0,10);
        const inMonth=dd.getMonth()===mm;
        const citas=(d.citas||[]).filter(c=>c.fecha===fecha && (!prof||c.profesional===prof)).sort((a,b)=>String(a.hora||'').localeCompare(String(b.hora||'')));
        const expanded=window.__yneaMesExpandido===fecha;
        const list=expanded?'<div class="month-mini-list">'+(citas.length?citas.map(c=>{const pac=(d.pacientes||[]).find(p=>String(p.id)===String(c.pacienteId))||{};return `<div class="month-mini-item">${esc(c.hora||'')} ${esc(pac.nombre||'Cita')}</div>`;}).join(''):'<div class="month-mini-item">Sin citas. Click otra vez para añadir.</div>')+'</div>':'';
        out+=`<td class="month-day ${inMonth?'':'out'} ${citas.length?'has-citas':''} ${expanded?'expanded':''}" onclick="abrirDiaMensualYnea('${fecha}')"><span class="day-num">${dd.getDate()}</span>${citas.length?`<span class="day-count">${citas.length} cita${citas.length>1?'s':''}</span>`:'<span class="day-empty">Añadir</span>'}${list}</td>`;
      }
      out+='</tr>'; cur=(typeof addDays==='function')?addDays(cur,7):new Date(cur.getTime()+7*86400000);
      if(cur>last && cur.getMonth()!==mm) break;
    }
    table.innerHTML=out+'</tbody>';
  };
  const oldRenderAll=window.renderAll;
  window.renderAll=function(){
    try{ if(typeof oldRenderAll==='function') oldRenderAll(); }catch(e){ console.warn('renderAll previo',e); }
    try{ renderPatients(); }catch(e){ console.error(e); }
    try{ renderMonthView(); }catch(e){ console.error(e); }
    try{ const d=getData(); if(d) fillSelect('bloqProfesionalNuevo',d.profesionales||[]); }catch(e){}
    document.querySelectorAll('.appFab,.autosaveBar').forEach(el=>el.style.display='none');
    document.querySelectorAll('button').forEach(b=>{ if((b.getAttribute('onclick')||'').includes("setView('anual'")) b.style.display='none'; });
  };
  document.addEventListener('click',function(e){
    const b=e.target.closest('.mobileNavBtn'); if(!b) return;
    e.preventDefault(); window.setView(b.dataset.mobileView||'semana',null);
  },true);
  function initFinal(){
    document.querySelectorAll('.appFab,.autosaveBar').forEach(el=>el.style.display='none');
    document.querySelectorAll('.mobileNavBtn').forEach((b,i)=>{
      const names=['semana','mensual','pacientes'];
      if(i<3){ b.dataset.mobileView=names[i]; b.style.display='flex'; const labels=['📅<span>Semana</span>','🗓️<span>Mes</span>','👤<span>Pacientes</span>']; b.innerHTML='<span class="ico">'+labels[i].split('<')[0]+'</span><span>'+['Semana','Mes','Pacientes'][i]+'</span>'; }
      else b.style.display='none';
    });
    try{ refreshAllSelects(); renderAll(); }catch(e){ console.error(e); }
    if(isMobile()) ensureVisibleView('semana');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initFinal); else initFinal();
})();


(function(){
  try{
    var VERSION='login-pro-clinica-2026-05-05-1';
    var old=sessionStorage.getItem('yneaAppVersion');
    if(old!==VERSION){
      sessionStorage.setItem('yneaAppVersion', VERSION);
      sessionStorage.removeItem('yneaCurrentUser');
      sessionStorage.removeItem('yneaAccessConfigured');
      localStorage.removeItem('yneaSupabaseUrl');
      localStorage.removeItem('yneaSupabaseAnonKey');
      try{
        var raw=localStorage.getItem('agendaClinicaSemanal');
        if(raw){
          var saved=JSON.parse(raw);
          saved.profesionales=[];
          saved.accesosProfesionales={};
          localStorage.setItem('agendaClinicaSemanal', JSON.stringify(saved));
        }
      }catch(e){}
    }
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(function(regs){ regs.forEach(function(r){ r.unregister(); }); }).catch(function(){});
    }
    if(window.caches){
      caches.keys().then(function(keys){ keys.forEach(function(k){ caches.delete(k); }); }).catch(function(){});
    }
  }catch(e){}
})();


(function(){
  'use strict';
  try{ document.documentElement.classList.add('ynea-locked'); sessionStorage.removeItem('yneaCurrentUser'); }catch(e){}
  try{ if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});} if(window.caches){caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))).catch(()=>{});} }catch(e){}
  const STORAGE_URL='yneaSupabaseUrl';
  const STORAGE_KEY='yneaSupabaseAnonKey';
  const ACCESS_FLAG='yneaAccessConfigured';
  const DEFAULT_URL='https://vadohvwjoxghubceffpn.supabase.co';
  const DEFAULT_KEY='sb_publishable_PM7HIrRvX8ShKW8yUFvh-w_ucW8ewwY';
  const ROLE_LABELS={usuario:'Usuario profesional',recepcion:'Recepción',admin:'Administrador'};
  const ROLE_ALLOWED={usuario:['semana','mensual','pacientes','agenda'],recepcion:['semana','mensual','pacientes','agenda','bloqueos'],admin:['semana','mensual','pacientes','agenda','config','bloqueos','listados','infoDiaria','avisos','copias']};
  const PROF_SELECTS=['weekProf','monthProf','yearProf','filtroProf','profesionalCita','editCitaProfesional','enlaceProfesional','enlazadaProfesional','bloqProfesionalNuevo','avisosProfesional'];
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const dataObj=()=>{try{return data}catch(e){return null}};
  const saveObj=()=>{try{if(typeof save==='function') save(); else localStorage.setItem('agendaClinicaSemanal',JSON.stringify(dataObj()));}catch(e){console.warn('save',e)}};
  function cleanUrl(u){u=String(u||'').trim().replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,''); if(u.endsWith('.supabase.com')) u=u.replace('.supabase.com','.supabase.co'); return u;}
  function cleanKey(k){return String(k||'').replace(/\s+/g,'').trim();}
  function creds(){return {url:cleanUrl(DEFAULT_URL),key:cleanKey(DEFAULT_KEY)};}
  function storeCreds(url,key){/* Conexión fija incluida en la app. No se guarda en localStorage ni se muestra en login. */}
  function pickName(row){return String(row?.nombre??row?.nombre_completo??row?.profesional??row?.display_name??row?.name??row?.titulo??row?.title??row?.descripcion??row?.label??'').trim();}
  function pickCode(row){return String(row?.codigo??row?.codigo_acceso??row?.cod_acceso??row?.pin??row?.clave??row?.password??row?.pass??'').trim();}
  function pickRole(row){return String(row?.rol??row?.role??row?.tipo_acceso??row?.perfil??'usuario').trim().toLowerCase();}
  function isActive(row){return !(row?.activo===false||row?.active===false||String(row?.estado||'').toLowerCase()==='inactivo');}
  function unique(a){return [...new Set((a||[]).map(x=>String(x||'').trim()).filter(Boolean))];}
  async function fetchTable(table){
    const {url,key}=creds();
    if(!url||!key) throw new Error('Faltan URL o clave de Supabase.');
    const endpoint=url.replace(/\/+$/,'')+'/rest/v1/'+encodeURIComponent(table)+'?select=*&_ynea_ts='+Date.now();
    const headers={
      apikey:key,
      Authorization:'Bearer '+key,
      Accept:'application/json',
      'Cache-Control':'no-cache',
      Pragma:'no-cache'
    };
    try{
      const res=await fetch(endpoint,{method:'GET',headers,cache:'no-store',mode:'cors'});
      const text=await res.text();
      if(!res.ok) throw new Error(table+': HTTP '+res.status+' '+text.slice(0,180));
      const rows=text?JSON.parse(text):[];
      return Array.isArray(rows)?rows:[];
    }catch(restErr){
      if(window.supabase && window.supabase.createClient){
        try{
          if(!window.yneaSupabaseClient){
            window.yneaSupabaseClient = window.supabase.createClient(url, key, {
              auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false },
              global: { headers: { 'Cache-Control':'no-cache', 'Pragma':'no-cache' } }
            });
          }
          const { data: rows, error } = await window.yneaSupabaseClient.from(table).select('*');
          if(error) throw error;
          return Array.isArray(rows)?rows:[];
        }catch(jsErr){
          throw new Error(table+': '+(restErr.message||restErr)+' / '+(jsErr.message||jsErr));
        }
      }
      throw new Error(table+': '+(restErr.message||restErr));
    }
  }

  async function supabaseWrite(method, table, body, query){
    const {url,key}=creds();
    const endpoint=url.replace(/\/+$/,'')+'/rest/v1/'+encodeURIComponent(table)+(query||'');
    const headers={apikey:key,Authorization:'Bearer '+key,Accept:'application/json','Content-Type':'application/json',Prefer:'return=representation','Cache-Control':'no-cache',Pragma:'no-cache'};
    const res=await fetch(endpoint,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',mode:'cors'});
    const text=await res.text();
    if(!res.ok) throw new Error(table+': HTTP '+res.status+' '+text.slice(0,220));
    try{return text?JSON.parse(text):null;}catch(e){return null;}
  }
  function profRowByName(name){return (window.yneaProfRowsByName||{})[name]||null;}
  function col(row,cands,fallback){row=row||{}; return cands.find(k=>Object.prototype.hasOwnProperty.call(row,k))||fallback;}
  async function syncProfesionalToSupabase(name, opts){
    opts=opts||{}; name=String(name||'').trim(); if(!name) return;
    const a=ensureAccess(), row=profRowByName(opts.oldName||name)||{};
    const nameCol=col(row,['nombre','nombre_completo','profesional','display_name','name','titulo','title','descripcion','label'],'nombre');
    const codeCol=col(row,['codigo','codigo_acceso','cod_acceso','pin','clave','password','pass'],'codigo');
    const roleCol=col(row,['rol','role','tipo_acceso','perfil'],'rol');
    const activeCol=col(row,['activo','active'],'activo');
    const body={}; body[nameCol]=name; body[codeCol]=String(a[name]?.codigo||''); body[roleCol]=String(a[name]?.rol||'usuario'); body[activeCol]=true;
    let rows=null;
    if(row.id){ rows=await supabaseWrite('PATCH','profesionales',body,'?id=eq.'+encodeURIComponent(row.id)); }
    else { rows=await supabaseWrite('POST','profesionales',body,''); }
    const saved=Array.isArray(rows)?rows[0]:rows;
    if(saved){window.yneaProfRowsByName=window.yneaProfRowsByName||{}; window.yneaProfRowsByName[name]=saved; if(opts.oldName&&opts.oldName!==name) delete window.yneaProfRowsByName[opts.oldName];}
  }
  async function deleteProfesionalFromSupabase(name){
    name=String(name||'').trim(); const row=profRowByName(name)||{};
    try{
      if(row.id){ await supabaseWrite('DELETE','profesionales',null,'?id=eq.'+encodeURIComponent(row.id)); }
      else { await supabaseWrite('DELETE','profesionales',null,'?nombre=eq.'+encodeURIComponent(name)); }
      if(window.yneaProfRowsByName) delete window.yneaProfRowsByName[name];
    }catch(e){
      try{ await supabaseWrite('PATCH','profesionales',{activo:false}, row.id?'?id=eq.'+encodeURIComponent(row.id):'?nombre=eq.'+encodeURIComponent(name)); if(window.yneaProfRowsByName) delete window.yneaProfRowsByName[name]; }catch(e2){throw e;}
    }
  }
  function showSync(msg,bad){try{let el=document.getElementById('yneaSyncStatus'); if(!el){el=document.createElement('div'); el.id='yneaSyncStatus'; el.className='small'; el.style.marginTop='8px'; const panel=document.getElementById('yneaAccessPanelStable'); if(panel) panel.appendChild(el);} if(el){el.textContent=msg; el.style.color=bad?'#991b1b':'#166534';}}catch(e){} }
  function syncLater(promise){Promise.resolve(promise).then(()=>showSync('Cambios guardados en Supabase.',false)).catch(e=>{console.error('No guardado en Supabase',e); showSync('No se pudo guardar en Supabase: '+(e.message||e),true); alert('No se pudo guardar el cambio en Supabase. Revisa permisos/RLS. Detalle: '+(e.message||e));});}


  async function loadCatalogs(showAlert){const d=dataObj(); if(!d) return false; const settled=await Promise.allSettled([fetchTable('profesionales'),fetchTable('tipos_cita'),fetchTable('consultas')]); if(settled[0].status!=='fulfilled') throw settled[0].reason; const profs=settled[0].value||[]; window.yneaProfRowsByName={}; profs.forEach(row=>{const n=pickName(row); if(n) window.yneaProfRowsByName[n]=row;}); const tipos=settled[1].status==='fulfilled'?(settled[1].value||[]):[]; const consultas=settled[2].status==='fulfilled'?(settled[2].value||[]):[]; const p=unique(profs.filter(isActive).map(pickName)); const t=unique(tipos.filter(isActive).map(pickName)); const c=unique(consultas.filter(isActive).map(pickName)); d.profesionales=p; if(t.length) d.tipos=t; if(c.length) d.consultas=c; d.accesosProfesionales={}; profs.filter(isActive).forEach(row=>{const n=pickName(row); if(!n) return; const rol=pickRole(row); d.accesosProfesionales[n]={codigo:pickCode(row),rol:['admin','recepcion','usuario'].includes(rol)?rol:'usuario'};}); d.duracionesTipo=d.duracionesTipo||{}; tipos.forEach(row=>{const n=pickName(row); if(n) d.duracionesTipo[n]=String(row?.duracion??row?.duracion_minutos??row?.duration??row?.minutos??d.duracionesTipo[n]??'10');}); ensureAccess(); saveObj(); refreshSelects(); renderAccessPanel(); renderLoginSelect(); try{if(typeof renderAll==='function') renderAll();}catch(e){} if(showAlert) alert('Catálogos cargados desde Supabase: '+p.length+' profesionales.'); return true;}
  function ensureAccess(){const d=dataObj(); if(!d) return {}; d.profesionales=unique(d.profesionales||[]); if(!d.accesosProfesionales||typeof d.accesosProfesionales!=='object') d.accesosProfesionales={}; const a=d.accesosProfesionales; d.profesionales.forEach(p=>{if(!a[p]) a[p]={codigo:'',rol:'usuario'}; if(!a[p].rol) a[p].rol='usuario';}); Object.keys(a).forEach(p=>{if(!d.profesionales.includes(p)) delete a[p];}); const configured=sessionStorage.getItem(ACCESS_FLAG)==='1'; if(configured){Object.values(a).forEach(x=>{if(String(x.codigo||'')==='1234') x.codigo='';});} if(!d.profesionales.some(p=>a[p]?.rol==='admin') && d.profesionales[0]) a[d.profesionales[0]].rol='admin'; if(!configured && d.profesionales[0] && !d.profesionales.some(p=>String(a[p]?.codigo||'').trim())) a[d.profesionales[0]].codigo='1234'; return a;}
  function current(){try{return JSON.parse(sessionStorage.getItem('yneaCurrentUser')||'null')}catch(e){return null}}
  function currentRole(){return current()?.rol||''}
  function currentProf(){return current()?.nombre||''}
  function canAll(){return ['recepcion','admin'].includes(currentRole())}
  function fill(id,arr,first=''){const el=$(id); if(!el) return; const old=el.value; el.innerHTML=first+(arr||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join(''); if([...el.options].some(o=>o.value===old)) el.value=old;}
  function refreshSelects(){const d=dataObj(); if(!d) return; const ps=d.profesionales||[]; fill('profesionalCita',ps); fill('editCitaProfesional',ps); fill('enlaceProfesional',ps); fill('enlazadaProfesional',ps); fill('weekProf',ps,'<option value="">Todos</option>'); fill('monthProf',ps,'<option value="">Todos</option>'); fill('filtroProf',ps,'<option value="">Todos</option>'); fill('avisosProfesional',ps,'<option value="">Todos</option>'); fill('bloqProfesionalNuevo',ps,'<option value="todos">Todos los profesionales</option>'); fill('consultaCita',d.consultas||[]); fill('weekConsulta',d.consultas||[],'<option value="">Todas</option>'); fill('tipoCita',d.tipos||[]); fill('filtroTipo',d.tipos||[],'<option value="">Todos</option>'); if(currentRole()&&!canAll()){const p=currentProf(); PROF_SELECTS.forEach(id=>{const el=$(id); if(el&&p){el.innerHTML=`<option value="${esc(p)}">${esc(p)}</option>`; el.value=p; el.disabled=true;}});}else{PROF_SELECTS.forEach(id=>{const el=$(id); if(el) el.disabled=false;});} try{if(typeof actualizarBuscadorPacienteCita==='function') actualizarBuscadorPacienteCita();}catch(e){} }
  function addSupabasePanel(){const old=$('supabaseConfigCard'); if(old) old.remove();}
  function setStatus(msg,bad){const el=$('supabaseYneaStatus'); if(el){el.textContent=msg; el.style.color=bad?'#991b1b':'#166534';} console[bad?'error':'log']('Ynea',msg);}
  window.guardarConexionSupabaseYnea=function(){const c=creds(); storeCreds(c.url,c.key); setStatus('Conexión guardada.',false);};
  window.probarSupabaseYnea=async function(){try{const rows=await fetchTable('profesionales'); setStatus('Conexión OK. Profesionales leídos: '+rows.length,false);}catch(e){setStatus(e.message||String(e),true); alert('Error Supabase: '+(e.message||e));}};
  window.cargarCatalogosSupabaseYnea=async function(){try{await loadCatalogs(true);}catch(e){setStatus(e.message||String(e),true); alert('Error cargando catálogos: '+(e.message||e));}};
  function renderAccessPanel(){const d=dataObj(); const cfg=$('configView'); if(!d||!cfg) return; let panel=$('yneaAccessPanelStable'); if(!panel){panel=document.createElement('div'); panel.id='yneaAccessPanelStable'; panel.className='card'; const sup=$('supabaseConfigCard'); cfg.insertBefore(panel,sup?sup.nextSibling:cfg.firstChild);} const a=ensureAccess(); panel.style.display=currentRole()==='admin'||!currentRole()?'block':'none'; panel.innerHTML='<h2>Accesos de profesionales</h2><p class="small">Cada profesional usa su propio acceso. Usuario profesional: solo su calendario. Recepción y administrador: todos los calendarios.</p><div id="accessRowsStable"></div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="secondary" onclick="yneaLogout()">Cerrar sesión</button></div>'; const rows=$('accessRowsStable'); rows.innerHTML=d.profesionales.length?d.profesionales.map(p=>{const r=a[p]||{}; return `<div class="accessRow"><b>${esc(p)}</b><input type="text" value="${esc(r.codigo||'')}" placeholder="Código" data-access-prof="${esc(p)}" data-access-field="codigo"><select data-access-prof="${esc(p)}" data-access-field="rol"><option value="usuario" ${r.rol==='usuario'?'selected':''}>Usuario profesional</option><option value="recepcion" ${r.rol==='recepcion'?'selected':''}>Recepción</option><option value="admin" ${r.rol==='admin'?'selected':''}>Administrador</option></select></div>`}).join(''):'<p class="small">No hay profesionales cargados.</p>'; }
  document.addEventListener('change',e=>{const el=e.target; if(!el.matches('[data-access-prof][data-access-field]')) return; const d=dataObj(), prof=el.dataset.accessProf, field=el.dataset.accessField; ensureAccess(); d.accesosProfesionales[prof][field]=String(el.value||'').trim(); sessionStorage.setItem(ACCESS_FLAG,'1'); if(!Object.values(d.accesosProfesionales).some(x=>x.rol==='admin')) d.accesosProfesionales[prof].rol='admin'; saveObj(); renderLoginSelect(); syncLater(syncProfesionalToSupabase(prof));},true);
  const REMEMBER_KEY='yneaLoginRecordadoV1';
  function getRememberedLogin(){try{return JSON.parse(localStorage.getItem(REMEMBER_KEY)||'null')||{};}catch(e){return {};}}
  function setRememberedLogin(prof,code){try{localStorage.setItem(REMEMBER_KEY,JSON.stringify({profesional:String(prof||''),codigo:String(code||''),fecha:new Date().toISOString()}));}catch(e){}}
  function clearRememberedLogin(){try{localStorage.removeItem(REMEMBER_KEY);}catch(e){}}
  function applyRememberedLogin(){
    const saved=getRememberedLogin();
    const sel=$('yneaLoginUser'), code=$('yneaLoginCode'), chk=$('yneaRememberLogin');
    if(chk) chk.checked=true;
    if(!sel||!saved.profesional) return;
    const has=[...sel.options].some(o=>o.value===saved.profesional);
    if(has) sel.value=saved.profesional;
    if(code && saved.codigo) code.value=saved.codigo;
  }
  window.yneaOlvidarLogin=function(){clearRememberedLogin(); const c=$('yneaLoginCode'); if(c)c.value=''; const chk=$('yneaRememberLogin'); if(chk) chk.checked=false; const e=$('yneaLoginError'); if(e){e.textContent='Datos recordados eliminados de este dispositivo.'; e.style.display='block';}};
  function renderLoginSelect(){const sel=$('yneaLoginUser'), d=dataObj(); if(!sel||!d) return; ensureAccess(); const old=sel.value; sel.innerHTML=(d.profesionales||[]).map(p=>`<option value=\"${esc(p)}\">${esc(p)}</option>`).join(''); if([...sel.options].some(o=>o.value===old)) sel.value=old;}
  async function makeLogin(){
    document.querySelectorAll('#yneaLoginOverlay').forEach(x=>x.remove());
    const div=document.createElement('div');
    div.id='yneaLoginOverlay';
    div.className='ynea-login-overlay';
    div.innerHTML=`<div class="ynea-login-card">
      <div class="ynea-login-brand"><img class="ynea-login-logo" src="icon-180-ynea.png" alt="Ynea"><div><h2 class="ynea-login-title">Acceso profesional</h2><p class="ynea-login-subtitle">Agenda clínica Ynea</p></div></div>
      <label>Profesional</label>
      <select id="yneaLoginUser" disabled><option value="">Cargando profesionales...</option></select>
      <label>Código de acceso</label>
      <input id="yneaLoginCode" type="password" inputmode="numeric" autocomplete="current-password" placeholder="Código de acceso">
      <label class="ynea-login-remember" style="display:none"><input id="yneaRememberLogin" type="checkbox" checked></label>
      
      <div id="yneaLoginError" class="ynea-login-error"></div>
      <button type="button" class="ynea-login-button" id="yneaLoginBtn" disabled>Entrar</button>
      <div class="ynea-login-mini"><span class="ynea-login-foot">Acceso privado para profesionales autorizados</span></div>
    </div>`;
    document.body.appendChild(div);
    const err=$('yneaLoginError');
    if(err){err.textContent=''; err.style.display='none';}
    try{await loadCatalogs(false);}catch(e){console.warn('Carga inicial Supabase',e); if(err){err.textContent='No se pudieron cargar los profesionales desde Supabase. Detalle técnico: '+(e.message||e)+''; err.style.display='block';}}
    ensureAccess();
    renderLoginSelect();
    applyRememberedLogin();
    const sel=$('yneaLoginUser'), btn=$('yneaLoginBtn'), codeInput=$('yneaLoginCode');
    if(sel&&sel.options.length){
      sel.disabled=false;
      if(btn) btn.disabled=false;
      if(err && err.textContent.startsWith('No se pudieron cargar')){err.textContent=''; err.style.display='none';}
    }else{
      if(sel) sel.innerHTML='<option value="">No hay profesionales disponibles</option>';
      if(btn) btn.disabled=true;
    }
    if(sel){sel.addEventListener('change',()=>{
      const saved=getRememberedLogin();
      if(saved.profesional===sel.value && codeInput && saved.codigo) codeInput.value=saved.codigo;
      else if(codeInput && !$('yneaRememberLogin')?.checked) codeInput.value='';
    });}
    const enter=()=>{
      const prof=$('yneaLoginUser').value;
      const code=String($('yneaLoginCode').value||'').trim();
      const remember=!!$('yneaRememberLogin')?.checked;
      const a=ensureAccess();
      if(!prof||String(a[prof]?.codigo||'')!==code){
        $('yneaLoginError').textContent='Profesional o código incorrecto.';
        $('yneaLoginError').style.display='block';
        return;
      }
      if(remember) setRememberedLogin(prof,code); else clearRememberedLogin();
      sessionStorage.setItem('yneaCurrentUser',JSON.stringify({nombre:prof,rol:a[prof].rol||'usuario'}));
      document.documentElement.classList.remove('ynea-locked');
      div.remove();
      applyRole();
      refreshSelects();
      try{if(typeof setView==='function') setView('semana');}catch(e){}
    };
    $('yneaLoginBtn').onclick=enter;
    $('yneaLoginCode').addEventListener('keydown',e=>{if(e.key==='Enter') enter();});
  }
  function applyRole(){const r=currentRole(), allowed=ROLE_ALLOWED[r]||ROLE_ALLOWED.admin; document.querySelectorAll('.tabs .tab').forEach(btn=>{const oc=btn.getAttribute('onclick')||''; const m=oc.match(/setView\('([^']+)'/); if(!m) return; const v=m[1]; btn.style.display=(v==='anual'||(r&&!allowed.includes(v)))?'none':'';}); if(r==='usuario') document.querySelectorAll('button[onclick*="setView(\'config\'"]').forEach(b=>b.style.display='none'); const panel=$('yneaAccessPanelStable'); if(panel) panel.style.display=(r==='admin'||!r)?'block':'none';}
  const originalSetView=window.setView; window.setView=function(view,btn){const r=currentRole(); const allowed=ROLE_ALLOWED[r]||ROLE_ALLOWED.admin; if(view==='anual') view='semana'; if(r&&!allowed.includes(view)) view=allowed[0]||'semana'; const out=originalSetView?originalSetView(view,btn):undefined; applyRole(); refreshSelects(); return out;};
  window.yneaLogout=function(){sessionStorage.removeItem('yneaCurrentUser'); try{document.documentElement.classList.add('ynea-locked');}catch(e){} /* reload eliminado */};
  const originalRefresh=window.refreshAllSelects; window.refreshAllSelects=function(){try{originalRefresh&&originalRefresh();}catch(e){console.warn(e)} refreshSelects();};
  function afterProfs(){ensureAccess(); saveObj(); refreshSelects(); renderAccessPanel(); renderLoginSelect();}
  const originalAddItem=window.addItem; window.addItem=function(key,inputId){if(key==='profesionales'){const d=dataObj(); const val=String($(inputId)?.value||'').trim(); if(!val) return; if(!d.profesionales.includes(val)) d.profesionales.push(val); if($(inputId)) $(inputId).value=''; ensureAccess(); syncLater(syncProfesionalToSupabase(val)); afterProfs(); try{if(typeof renderConfig==='function') renderConfig(); if(typeof renderAll==='function') renderAll();}catch(e){} return;} return originalAddItem?originalAddItem.apply(this,arguments):undefined;};
  const originalRemoveItem=window.removeItem; window.removeItem=function(key,value){if(key==='profesionales'){const d=dataObj(); if(!confirm('¿Eliminar este profesional?')) return; d.profesionales=(d.profesionales||[]).filter(x=>x!==value); if(d.accesosProfesionales) delete d.accesosProfesionales[value]; (d.citas||[]).forEach(c=>{if(c.profesional===value)c.profesional='';}); if(currentProf()===value) sessionStorage.removeItem('yneaCurrentUser'); syncLater(deleteProfesionalFromSupabase(value)); afterProfs(); try{if(typeof renderConfig==='function') renderConfig(); if(typeof renderAll==='function') renderAll();}catch(e){} return;} return originalRemoveItem?originalRemoveItem.apply(this,arguments):undefined;};
  const originalRename=window.renameItemDirect; window.renameItemDirect=function(key,oldValue,newValue){if(key==='profesionales'){const d=dataObj(); newValue=String(newValue||'').trim(); if(!newValue) return alert('Nombre vacío'); d.profesionales=(d.profesionales||[]).map(x=>x===oldValue?newValue:x); if(d.accesosProfesionales&&d.accesosProfesionales[oldValue]){d.accesosProfesionales[newValue]=d.accesosProfesionales[oldValue]; delete d.accesosProfesionales[oldValue];} (d.citas||[]).forEach(c=>{if(c.profesional===oldValue)c.profesional=newValue}); const cur=current(); if(cur&&cur.nombre===oldValue) sessionStorage.setItem('yneaCurrentUser',JSON.stringify({nombre:newValue,rol:cur.rol})); syncLater(syncProfesionalToSupabase(newValue,{oldName:oldValue})); afterProfs(); try{if(typeof renderConfig==='function') renderConfig(); if(typeof renderAll==='function') renderAll();}catch(e){} return;} return originalRename?originalRename.apply(this,arguments):undefined;};
  function emailOk(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());}
  window.editarPacienteYnea=function(id){const d=dataObj(); const p=(d?.pacientes||[]).find(x=>String(x.id)===String(id)); if(!p) return; const nombre=prompt('Nombre del paciente:',p.nombre||''); if(nombre===null) return; const telefono=prompt('Teléfono obligatorio:',p.telefono||''); if(telefono===null) return; const email=prompt('Email obligatorio:',p.email||''); if(email===null) return; if(!nombre.trim()||!telefono.trim()||!email.trim()) return alert('Nombre, teléfono y email son obligatorios.'); if(!emailOk(email)) return alert('Introduce un email válido.'); const obs=prompt('Observaciones:',p.obs||''); if(obs===null) return; Object.assign(p,{nombre:nombre.trim(),telefono:telefono.trim(),email:email.trim(),obs:String(obs||'').trim()}); saveObj(); try{if(typeof renderPatients==='function') renderPatients(); if(typeof renderAll==='function') renderAll();}catch(e){} };
  const originalRenderPatients=window.renderPatients; window.renderPatients=function(){const d=dataObj(), table=$('pacientesTable'); if(!d||!table) return originalRenderPatients?originalRenderPatients():undefined; const q=String($('buscadorPacientes')?.value||'').toLowerCase().trim(); const rows=(d.pacientes||[]).filter(p=>!q||String([p.nombre,p.telefono,p.email].join(' ')).toLowerCase().includes(q)).map(p=>`<tr data-paciente-id="${esc(p.id)}"><td><b>${esc(p.nombre||'')}</b></td><td>${esc(p.telefono||'')}</td><td>${esc(p.email||'')}</td><td>${esc(p.obs||'')}</td></tr>`).join(''); table.innerHTML='<thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Observaciones</th></tr></thead><tbody>'+rows+'</tbody>'; };
  document.addEventListener('click',e=>{const row=e.target.closest('#pacientesTable tbody tr'); if(row){e.preventDefault(); window.editarPacienteYnea(row.dataset.pacienteId);}},true);
  const originalRenderConfig=window.renderConfig; window.renderConfig=function(){try{originalRenderConfig&&originalRenderConfig();}catch(e){console.warn(e)} addSupabasePanel(); renderAccessPanel(); refreshSelects();};
  const originalRenderAll=window.renderAll; window.renderAll=function(){try{originalRenderAll&&originalRenderAll();}catch(e){console.warn(e)} try{refreshSelects(); renderAccessPanel(); applyRole();}catch(e){console.warn(e)} document.querySelectorAll('.notice,.autosaveBar,.appFab').forEach(el=>el.style.display='none');};

  setInterval(function(){try{if(!sessionStorage.getItem('yneaCurrentUser') && !document.getElementById('yneaLoginOverlay')){document.documentElement.classList.add('ynea-locked'); makeLogin();}}catch(e){}},1500);
  document.addEventListener('DOMContentLoaded',async()=>{sessionStorage.removeItem('yneaCurrentUser'); addSupabasePanel(); ensureAccess(); refreshSelects(); try{renderAccessPanel();}catch(e){} const c=creds(); if(c.key){try{await loadCatalogs(false);}catch(e){console.warn('Supabase auto',e);}} await makeLogin(); try{if(typeof renderAll==='function') renderAll();}catch(e){} });
})();


(function(){
  window.yneaSalirConCopia=function(){
    try{ if(typeof save==='function') save(); }catch(e){}
    try{
      if(typeof exportBackup==='function'){ exportBackup(); }
      else{
        const payload={version:'Agenda Clinica Ynea backup salida',exportedAt:new Date().toISOString(),data:window.data||null};
        const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
        const a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download='backup_agenda_clinica_ynea_'+new Date().toISOString().slice(0,10)+'.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
      }
    }catch(e){console.warn('backup salida',e);}
    setTimeout(function(){
      try{sessionStorage.removeItem('yneaCurrentUser');}catch(e){}
      try{document.documentElement.classList.add('ynea-locked');}catch(e){}
      /* reload eliminado */
    },450);
  };
})();


(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const pad=n=>String(n).padStart(2,'0');
  function iso(d){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
  function parseDate(v){ if(v&&/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v+'T12:00:00'); return new Date(); }
  function mondayLocal(d){const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(12,0,0,0); return x;}
  function addDaysLocal(d,n){const x=new Date(d); x.setDate(x.getDate()+n); return x;}
  function fmtShort(d){return pad(d.getDate())+'/'+pad(d.getMonth()+1);}
  function weekRangeFrom(v){const m=mondayLocal(parseDate(v)); return fmtShort(m)+' - '+fmtShort(addDaysLocal(m,4));}
  function monthLabel(v){ if(!v||!/^\d{4}-\d{2}$/.test(v)){const n=new Date(); v=n.getFullYear()+'-'+pad(n.getMonth()+1);} const [y,m]=v.split('-').map(Number); return new Date(y,m-1,1).toLocaleDateString('es-ES',{month:'long',year:'numeric'});}
  window.yneaOpenHiddenPicker=function(id){const el=$(id); if(!el) return; try{ if(el.showPicker) el.showPicker(); else {el.focus(); el.click();} }catch(e){try{el.focus();}catch(_){}}};
  function setOptions(id,arr,first,current){const el=$(id); if(!el) return; const old=current!==undefined?current:el.value; el.innerHTML=(first||'')+(arr||[]).map(x=>`<option value="${String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')}">${String(x).replaceAll('&','&amp;').replaceAll('<','&lt;')}</option>`).join(''); if([...el.options].some(o=>o.value===old)) el.value=old;}
  function updateDisplays(){
    try{
      const wp=$('weekPicker'); const wd=$('yneaWeekDisplay');
      if(wp){ if(!wp.value) wp.value=iso(mondayLocal(window.weekStart||new Date())); if(wd) wd.textContent=weekRangeFrom(wp.value); }
      const mp=$('monthPicker'); const md=$('yneaMonthDisplay');
      if(mp){ if(!mp.value){const n=new Date(); mp.value=n.getFullYear()+'-'+pad(n.getMonth()+1);} if(md) md.textContent=monthLabel(mp.value); }
    }catch(e){console.warn('updateDisplays',e)}
  }
  const oldRefresh=window.refreshAllSelects;
  window.refreshAllSelects=function(){
    const keep={weekProf:$('weekProf')?.value||'',weekConsulta:$('weekConsulta')?.value||'',monthProf:$('monthProf')?.value||'',monthConsulta:$('monthConsulta')?.value||''};
    if(oldRefresh) oldRefresh.apply(this,arguments);
    const d=window.data||{};
    setOptions('weekProf',d.profesionales||[],'<option value="">Todos</option>',keep.weekProf);
    setOptions('weekConsulta',d.consultas||[],'<option value="">Todas</option>',keep.weekConsulta);
    setOptions('monthProf',d.profesionales||[],'<option value="">Todos</option>',keep.monthProf);
    setOptions('monthConsulta',d.consultas||[],'<option value="">Todas</option>',keep.monthConsulta);
    updateDisplays();
  };
  window.setWeekFromDate=function(value){window.weekStart=mondayLocal(parseDate(value)); const wp=$('weekPicker'); if(wp) wp.value=iso(window.weekStart); renderAll();};
  window.moveWeek=function(n){window.weekStart=addDaysLocal(mondayLocal(window.weekStart||new Date()),n*7); const wp=$('weekPicker'); if(wp) wp.value=iso(window.weekStart); renderAll();};
  window.goThisWeek=function(){window.weekStart=mondayLocal(new Date()); const wp=$('weekPicker'); if(wp) wp.value=iso(window.weekStart); renderAll();};
  window.moveMonth=function(n){const mp=$('monthPicker'); if(!mp) return; const val=mp.value || (new Date().getFullYear()+'-'+pad(new Date().getMonth()+1)); const [y,m]=val.split('-').map(Number); const d=new Date(y,m-1+n,1); mp.value=d.getFullYear()+'-'+pad(d.getMonth()+1); renderAll();};
  window.goThisMonth=function(){const n=new Date(); const mp=$('monthPicker'); if(mp) mp.value=n.getFullYear()+'-'+pad(n.getMonth()+1); renderAll();};
  const oldRenderAll=window.renderAll;
  window.renderAll=function(){const r=oldRenderAll?oldRenderAll.apply(this,arguments):undefined; updateDisplays(); return r;};
  const oldRenderMonth=window.renderMonthView;
  window.renderMonthView=function(){
    if(!oldRenderMonth) return;
    const res=oldRenderMonth.apply(this,arguments);
    const consulta=$('monthConsulta')?.value||'';
    if(consulta){
      try{
        // Re-render mensual con filtro de consulta si se ha elegido una.
        const table=$('monthTable'); if(!table||!window.data) return res;
        const monthValue=$('monthPicker')?.value || new Date().toISOString().slice(0,7);
        const prof=$('monthProf')?.value || '';
        const [yearS,monthS]=monthValue.split('-'); const year=Number(yearS), month=Number(monthS)-1;
        const first=new Date(year,month,1), last=new Date(year,month+1,0), start=mondayLocal(first);
        if($('monthTitle')) $('monthTitle').textContent=(prof?('Profesional: '+prof):'Todos los profesionales')+' · Consulta: '+consulta+' · '+first.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
        let out='<thead><tr><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead><tbody>';
        let cur=new Date(start);
        for(let w=0;w<6;w++){
          out+='<tr>';
          for(let i=0;i<5;i++){
            const d=addDaysLocal(cur,i), date=iso(d), inMonth=d.getMonth()===month;
            const citas=(window.data.citas||[]).filter(c=>c.fecha===date && (!prof||c.profesional===prof) && c.consulta===consulta).sort((a,b)=>String(a.hora).localeCompare(String(b.hora)));
            out+=`<td class="slot" style="min-width:210px;background:${inMonth?'#fff':'#f8fafc'}"><strong>${d.getDate()}</strong>`;
            citas.slice(0,5).forEach(c=>{const p=(typeof paciente==='function'?paciente(c.pacienteId):{})||{}; out+=`<div class="appt estado-${String(c.estado||'').replaceAll(' ','')} ${String(c.profesional||'').toLowerCase().includes('susana')?'ynea-susana-rosa':''}" onclick="event.stopPropagation(); abrirEditorCita(${c.id})" style="background:${String(c.profesional||'').toLowerCase().includes('susana')?'#f8c8dc':''};margin-top:6px;cursor:pointer"><strong>${c.hora} · ${p.nombre||''}</strong><span>${c.profesional||''}</span><br><span>${c.tipo||''} · ${c.consulta||''}</span></div>`;});
            if(citas.length>5) out+=`<p class="small">+${citas.length-5} citas más</p>`;
            out+='</td>';
          }
          out+='</tr>'; cur=addDaysLocal(cur,7); if(cur>last && cur.getMonth()!==month) break;
        }
        table.innerHTML=out+'</tbody>';
      }catch(e){console.warn('month consulta filter',e)}
    }
    updateDisplays(); return res;
  };
  const oldMakeLogin=window.makeLogin;
  if(oldMakeLogin){ window.makeLogin=async function(){document.documentElement.classList.add('ynea-locked'); return oldMakeLogin.apply(this,arguments);}; }
  document.addEventListener('DOMContentLoaded',function(){document.documentElement.classList.add('ynea-locked'); setTimeout(function(){try{window.refreshAllSelects(); updateDisplays();}catch(e){}},0);},true);
})();


(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const isMobile=()=>/iPhone|iPad|iPod|Android/i.test(navigator.userAgent||'') || matchMedia('(max-width: 700px)').matches;
  function saveData(){try{ if(typeof save==='function') save(); else localStorage.setItem('agendaClinicaSemanal',JSON.stringify(window.data)); }catch(e){console.warn('saveData',e);} }
  function allTiposActivos(){
    const d=window.data||{};
    return (d.tipos||[]).filter(t=>!d.caracteristicasTipo || !d.caracteristicasTipo[t] || d.caracteristicasTipo[t].activo!==false);
  }
  window.tiposPermitidosParaProfesional=function(prof){
    const todos=allTiposActivos();
    if(!prof) return todos;
    const mapa=(window.data&&window.data.tiposPorProfesional)||{};
    if(Object.prototype.hasOwnProperty.call(mapa,prof)){
      const lista=Array.isArray(mapa[prof])?mapa[prof]:[];
      return lista.filter(t=>todos.includes(t));
    }
    return todos;
  };
  function fillSelect(id,arr,first,keep){
    const el=$(id); if(!el) return;
    const old=keep!==undefined?keep:el.value;
    el.innerHTML=(first||'')+(arr||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    if([...el.options].some(o=>o.value===old)) el.value=old;
    else if(el.options.length && !first) el.selectedIndex=0;
  }
  function actualizarSelectTiposCita(){
    const prof=$('profesionalCita')?.value||'';
    const actual=$('tipoCita')?.value||'';
    fillSelect('tipoCita',window.tiposPermitidosParaProfesional(prof),'',actual);
    try{ if(typeof applyTipoDuration==='function') applyTipoDuration(); }catch(e){}
  }
  const refreshOld=window.refreshAllSelects;
  window.refreshAllSelects=function(){
    const keep={
      wp:$('weekProf')?.value||'', wc:$('weekConsulta')?.value||'', mp:$('monthProf')?.value||'', mc:$('monthConsulta')?.value||'',
      pc:$('profesionalCita')?.value||'', tc:$('tipoCita')?.value||''
    };
    try{ if(refreshOld) refreshOld.apply(this,arguments); }catch(e){ console.warn('refresh anterior',e); }
    const d=window.data||{};
    fillSelect('weekProf',d.profesionales||[],'<option value="">Todos</option>',keep.wp);
    fillSelect('monthProf',d.profesionales||[],'<option value="">Todos</option>',keep.mp);
    fillSelect('weekConsulta',d.consultas||[],'<option value="">Todas</option>',keep.wc);
    fillSelect('monthConsulta',d.consultas||[],'<option value="">Todas</option>',keep.mc);
    fillSelect('profesionalCita',d.profesionales||[],'',keep.pc);
    fillSelect('consultaCita',d.consultas||[],'',$('consultaCita')?.value||'');
    actualizarSelectTiposCita();
    try{ if(typeof renderMapTipos==='function') renderMapTipos(); }catch(e){}
  };
  document.addEventListener('change',function(e){
    if(e.target && e.target.id==='profesionalCita') actualizarSelectTiposCita();
  },true);

  function refreshTiposProfesionalSelectorFinal(){
    const sel=$('mapProfesional'); if(!sel) return;
    const old=sel.value;
    fillSelect('mapProfesional',(window.data&&window.data.profesionales)||[],'',old);
  }
  window.renderMapTipos=function(){
    refreshTiposProfesionalSelectorFinal();
    const box=$('mapTiposBox'), sel=$('mapProfesional'); if(!box||!sel) return;
    const d=window.data||{}; const prof=sel.value || (d.profesionales||[])[0] || '';
    if(prof && sel.value!==prof) sel.value=prof;
    const todos=allTiposActivos();
    const mapa=d.tiposPorProfesional||(d.tiposPorProfesional={});
    const seleccion=Object.prototype.hasOwnProperty.call(mapa,prof) ? (Array.isArray(mapa[prof])?mapa[prof]:[]) : todos;
    box.className='ynea-tipos-lineado';
    box.innerHTML=todos.length?todos.map((t,i)=>`
      <label class="tipo-row" for="tipo-prof-${i}">
        <input id="tipo-prof-${i}" type="checkbox" value="${esc(t)}" ${seleccion.includes(t)?'checked':''}>
        <span>${esc(t)}</span>
      </label>`).join(''):'<p class="small" style="padding:12px">No hay tipos de consulta creados.</p>';
  };
  window.saveMapTipos=function(){
    const prof=$('mapProfesional')?.value||''; if(!prof){alert('Selecciona un profesional.');return;}
    const d=window.data||{}; d.tiposPorProfesional=d.tiposPorProfesional||{};
    d.tiposPorProfesional[prof]=[...document.querySelectorAll('#mapTiposBox input[type="checkbox"]:checked')].map(x=>x.value);
    saveData();
    actualizarSelectTiposCita();
    try{ if(typeof renderAll==='function') renderAll(); }catch(e){}
    alert('Tipos guardados para '+prof+'.');
  };
  window.activarTiposProfesional=function(){
    const prof=$('mapProfesional')?.value||''; if(!prof){alert('Selecciona un profesional.');return;}
    window.data.tiposPorProfesional=window.data.tiposPorProfesional||{};
    window.data.tiposPorProfesional[prof]=allTiposActivos(); saveData(); renderMapTipos(); actualizarSelectTiposCita();
  };
  window.desactivarTiposProfesional=function(){
    const prof=$('mapProfesional')?.value||''; if(!prof){alert('Selecciona un profesional.');return;}
    window.data.tiposPorProfesional=window.data.tiposPorProfesional||{};
    window.data.tiposPorProfesional[prof]=[]; saveData(); renderMapTipos(); actualizarSelectTiposCita();
  };

  // Login: mostrar solo nombre del profesional, no tipo de acreditación.
  window.renderLoginSelect=function(){
    const sel=$('yneaLoginUser'), d=window.data; if(!sel||!d) return;
    const old=sel.value;
    sel.innerHTML=(d.profesionales||[]).map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
    if([...sel.options].some(o=>o.value===old)) sel.value=old;
  };

  function backupPayload(){return {version:'Agenda Clinica Ynea backup 1.0',exportedAt:new Date().toISOString(),data:window.data||{}};}
  function backupName(){return 'backup_agenda_clinica_ynea_'+new Date().toISOString().slice(0,10)+'.json';}
  async function writeWithHandle(handle,contenido){const file=await handle.getFileHandle(backupName(),{create:true}); const w=await file.createWritable(); await w.write(contenido); await w.close();}
  window.guardarEnCarpetaFija=async function(){
    const contenido=JSON.stringify(backupPayload(),null,2);
    if(window.showDirectoryPicker && !isMobile()){
      try{
        let handle=window.yneaBackupDirHandle||null;
        if(!handle){ handle=await window.showDirectoryPicker({mode:'readwrite'}); window.yneaBackupDirHandle=handle; }
        const perm=await handle.requestPermission({mode:'readwrite'});
        if(perm!=='granted') throw new Error('Sin permiso para escribir en la carpeta.');
        await writeWithHandle(handle,contenido);
        const st=$('backupMainStatus'); if(st){st.textContent='Copia guardada en la carpeta elegida.'; st.classList.add('ynea-backup-ok');}
        return;
      }catch(e){ if(e && e.name==='AbortError') return; alert('No se pudo guardar en la carpeta elegida. Se descargará el archivo.'); }
    }
    const blob=new Blob([contenido],{type:'application/json;charset=utf-8'}); const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=backupName(); document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
  };
  window.cambiarRutaBackup=async function(){
    if(!(window.showDirectoryPicker && !isMobile())){ alert('En este navegador no se puede fijar una carpeta. La copia irá a Descargas o a la carpeta que tengas configurada en el navegador.'); return; }
    try{ window.yneaBackupDirHandle=await window.showDirectoryPicker({mode:'readwrite'}); const st=$('backupMainStatus'); if(st) st.textContent='Carpeta de copia seleccionada para esta sesión.'; }
    catch(e){}
  };
  window.exportBackup=function(){ window.guardarEnCarpetaFija(); };
  window.exportBackupNow=function(){ window.guardarEnCarpetaFija(); };
  window.yneaSalirConCopia=function(){
    try{ if(typeof save==='function') save(); }catch(e){}
    if(!isMobile()){
      try{ window.guardarEnCarpetaFija(); }catch(e){console.warn('backup cierre',e);}
    }
    setTimeout(function(){ try{sessionStorage.removeItem('yneaCurrentUser');}catch(e){} try{document.documentElement.classList.add('ynea-locked');}catch(e){} /* reload eliminado */ }, isMobile()?100:350);
  };

  document.addEventListener('DOMContentLoaded',function(){
    try{ refreshTiposProfesionalSelectorFinal(); renderMapTipos(); actualizarSelectTiposCita(); }catch(e){}
    setTimeout(function(){try{window.refreshAllSelects(); window.renderLoginSelect();}catch(e){}},300);
  },true);
})();


(function(){
  'use strict';
  const SUPABASE_URL='https://vadohvwjoxghubceffpn.supabase.co';
  const SUPABASE_KEY='sb_publishable_PM7HIrRvX8ShKW8yUFvh-w_ucW8ewwY';
  const TABLE='agenda_online';
  const ID='main';
  let applying=false;
  let saving=false;
  let lastJson='';
  let timer=null;

  function $(id){return document.getElementById(id)}
  function clone(x){try{return JSON.parse(JSON.stringify(x||{}))}catch(e){return {}}}
  function uniq(a){return Array.from(new Set((a||[]).map(x=>String(x||'').trim()).filter(Boolean)))}
  function normalize(d){
    d=d&&typeof d==='object'?clone(d):{};
    d.profesionales=uniq(d.profesionales||[]);
    d.consultas=uniq(d.consultas||[]); if(!d.consultas.length)d.consultas=['Consulta 1'];
    d.tipos=uniq(d.tipos||[]); if(!d.tipos.length)d.tipos=['General'];
    d.pacientes=Array.isArray(d.pacientes)?d.pacientes.filter(Boolean):[];
    d.citas=Array.isArray(d.citas)?d.citas.filter(Boolean):[];
    d.bloqueos=Array.isArray(d.bloqueos)?d.bloqueos.filter(Boolean):[];
    d.duracionesTipo=d.duracionesTipo&&typeof d.duracionesTipo==='object'?d.duracionesTipo:{};
    d.caracteristicasTipo=d.caracteristicasTipo&&typeof d.caracteristicasTipo==='object'?d.caracteristicasTipo:{};
    d.tiposPorProfesional=d.tiposPorProfesional&&typeof d.tiposPorProfesional==='object'?d.tiposPorProfesional:{};
    d.tipos.forEach(t=>{if(!d.duracionesTipo[t])d.duracionesTipo[t]='10'; if(!d.caracteristicasTipo[t])d.caracteristicasTipo[t]={descripcion:'',color:'',activo:true}});
    d.profesionales.forEach(p=>{let arr=Array.isArray(d.tiposPorProfesional[p])?d.tiposPorProfesional[p]:[]; arr=uniq(arr).filter(t=>d.tipos.includes(t)); d.tiposPorProfesional[p]=arr.length?arr:d.tipos.slice();});
    Object.keys(d.tiposPorProfesional).forEach(p=>{if(!d.profesionales.includes(p))delete d.tiposPorProfesional[p]});
    return d;
  }
  function localData(){try{return normalize(window.data||data||{})}catch(e){} try{return normalize(JSON.parse(localStorage.getItem('agendaClinicaSemanal')||'{}'))}catch(e){return normalize({})}}
  function applyData(d){
    d=normalize(d); applying=true;
    try{window.data=d; data=d}catch(e){window.data=d}
    try{localStorage.setItem('agendaClinicaSemanal',JSON.stringify(d));localStorage.setItem('agendaData',JSON.stringify(d))}catch(e){}
    applying=false;
  }
  function render(){
    ['refreshAllSelects','renderMapTipos','renderConfig','renderPatients','actualizarSelectTiposCita','renderAll'].forEach(n=>{try{if(typeof window[n]==='function')window[n]()}catch(e){console.warn(n,e)}});
  }
  function status(msg,bad){
    console[bad?'error':'log']('[YNEA ONLINE]',msg);
    let el=$('yneaSyncStatusFinal');
    if(!el){el=document.createElement('div');el.id='yneaSyncStatusFinal';el.style.cssText='position:fixed;left:10px;bottom:10px;z-index:999999;background:#fff;border:1px solid #bbf7d0;border-radius:12px;padding:6px 9px;font-size:12px;color:#166534;box-shadow:0 6px 18px rgba(0,0,0,.10);max-width:85vw'; if(document.body)document.body.appendChild(el);}
    el.textContent=msg; el.style.color=bad?'#991b1b':'#166534'; el.style.borderColor=bad?'#fecaca':'#bbf7d0';
  }
  async function req(method,body){
    const headers={'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json','Cache-Control':'no-cache','Pragma':'no-cache'};
    let url=SUPABASE_URL+'/rest/v1/'+TABLE;
    let opt={method,headers,cache:'no-store'};
    if(method==='GET'){url+='?id=eq.'+encodeURIComponent(ID)+'&select=id,datos,updated_at';}
    else if(method==='PATCH'){url+='?id=eq.'+encodeURIComponent(ID); headers['Prefer']='return=representation'; opt.body=JSON.stringify(body);}
    else {headers['Prefer']='resolution=merge-duplicates,return=representation'; url+='?on_conflict=id'; opt.body=JSON.stringify(body);}
    const r=await fetch(url,opt); const txt=await r.text(); let j=null; try{j=txt?JSON.parse(txt):null}catch(e){}
    if(!r.ok)throw new Error((j&&(j.message||j.error))||txt||('HTTP '+r.status));
    return j;
  }
  async function loadCloud(){
    const rows=await req('GET');
    if(Array.isArray(rows)&&rows[0])return normalize(rows[0].datos||{});
    const d=localData(); await saveCloud(d,true); return d;
  }
  async function saveCloud(d,silent){
    if(applying)return;
    d=normalize(d||localData()); saving=true;
    try{
      await req('POST',{id:ID,datos:d,updated_at:new Date().toISOString()});
      lastJson=JSON.stringify(d);
      window.yneaLocalPendingUntil=0;
      if(!silent)status('Guardado online · '+new Date().toLocaleTimeString('es-ES'),false);
    }catch(e){status('ERROR online: '+(e.message||e),true); alert('No se ha guardado online. Error Supabase: '+(e.message||e)); throw e;}
    finally{saving=false;}
  }
  function schedule(){
    if(applying)return; clearTimeout(timer);
    window.yneaLocalPendingUntil=Date.now()+8000;
    timer=setTimeout(()=>{const d=localData(); const j=JSON.stringify(d); if(j!==lastJson)saveCloud(d,false).catch(()=>{});},250);
  }
  async function refreshFromCloud(){
    if(saving)return;
    if(window.yneaLocalPendingUntil && Date.now()<window.yneaLocalPendingUntil) return;
    try{const remote=await loadCloud(); const rj=JSON.stringify(remote); if(rj!==lastJson || rj!==JSON.stringify(localData())){lastJson=rj; applyData(remote); render();} status('Sincronizado online · '+new Date().toLocaleTimeString('es-ES'),false);}catch(e){status('ERROR online: '+(e.message||e),true)}
  }

  // Forzar que cualquier guardado local dispare guardado online.
  const oldSave=window.save;
  window.save=function(){let r; try{if(typeof oldSave==='function')r=oldSave.apply(this,arguments)}catch(e){console.warn(e)} schedule(); return r;};
  if(!Storage.prototype.setItem.__yneaHardSync){
    const oldSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){const r=oldSet.apply(this,arguments); if(!applying && (k==='agendaClinicaSemanal'||k==='agendaData')) schedule(); return r;};
    Storage.prototype.setItem.__yneaHardSync=true;
  }
  ['addCita','guardarCitaDesdeEditor','eliminarCitaDesdeEditor','guardarCitaEnlazada','addPaciente','guardarNuevoPacienteModal','saveMapTipos','guardarTipoConsultaEditado','addTipo','removeItem','renameItemDirect','addItem','deleteBloqueo','guardarEdicionCita','eliminarCita'].forEach(n=>{
    const fn=window[n]; if(typeof fn==='function'&&!fn.__yneaHardSync){window[n]=function(){const r=fn.apply(this,arguments); setTimeout(schedule,100); return r}; window[n].__yneaHardSync=true;}
  });
  window.yneaForceCloudLoad=refreshFromCloud;
  window.yneaForceCloudSave=function(){return saveCloud(localData(),false)};
  window.yneaSubirEsteDispositivo=function(){return saveCloud(localData(),false)};
  window.yneaSalirConCopia=async function(){try{await saveCloud(localData(),true)}catch(e){} try{sessionStorage.removeItem('yneaCurrentUser')}catch(e){} /* reload eliminado */};

  document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshFromCloud,900),true);
  window.addEventListener('focus',()=>setTimeout(refreshFromCloud,200));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshFromCloud()});
  setInterval(()=>{if(document.visibilityState==='visible')refreshFromCloud()},2500);
})();


(function(){
  'use strict';
  const DB='AgendaClinicaYneaBackupDirFinal';
  const STORE='handles';
  const KEY='dir';
  function isMobile(){return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||window.matchMedia('(max-width: 700px)').matches;}
  function hoyLocal(){const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10);}
  function esFechaPasada(fecha){return String(fecha||'') < hoyLocal();}
  function avisoFechaPasada(){alert('No se pueden crear citas en una fecha anterior a la actual.');}
  function setMinDates(){
    const min=hoyLocal();
    ['fechaCita','editCitaFecha','enlazadaFecha'].forEach(id=>{const el=document.getElementById(id); if(el) el.min=min;});
  }
  async function openDB(){
    return new Promise((res,rej)=>{const r=indexedDB.open(DB,1); r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)}; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);});
  }
  async function idbGet(){try{const db=await openDB(); return await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly'); const req=tx.objectStore(STORE).get(KEY); req.onsuccess=()=>res(req.result||null); req.onerror=()=>rej(req.error);});}catch(e){return null;}}
  async function idbSet(handle){try{const db=await openDB(); await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(handle,KEY); tx.oncomplete=res; tx.onerror=()=>rej(tx.error);});}catch(e){}}
  async function idbDel(){try{const db=await openDB(); await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(KEY); tx.oncomplete=res; tx.onerror=()=>rej(tx.error);});}catch(e){}}
  function backupName(){return 'backup_agenda_clinica_ynea_'+hoyLocal()+'.json';}
  function backupPayload(){return {version:'Agenda Clinica Ynea backup 1.0',exportedAt:new Date().toISOString(),data:window.data||{}};}
  async function permiso(handle){
    if(!handle) return false;
    const opt={mode:'readwrite'};
    try{ if(await handle.queryPermission(opt)==='granted') return true; }catch(e){}
    try{ return await handle.requestPermission(opt)==='granted'; }catch(e){return false;}
  }
  async function escribirBackupPC(){
    if(isMobile()) return false;
    const contenido=JSON.stringify(backupPayload(),null,2);
    if(window.showDirectoryPicker){
      let handle=window.yneaBackupDirHandle || await idbGet();
      if(!handle){ handle=await window.showDirectoryPicker({mode:'readwrite'}); await idbSet(handle); }
      if(!(await permiso(handle))){ handle=await window.showDirectoryPicker({mode:'readwrite'}); await idbSet(handle); if(!(await permiso(handle))) throw new Error('Sin permiso para escribir en la carpeta.'); }
      window.yneaBackupDirHandle=handle;
      const file=await handle.getFileHandle(backupName(),{create:true});
      const w=await file.createWritable(); await w.write(contenido); await w.close();
      const st=document.getElementById('backupMainStatus'); if(st) st.textContent='Copia guardada en la ruta indicada.';
      return true;
    }
    const blob=new Blob([contenido],{type:'application/json;charset=utf-8'}); const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=backupName(); document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
    return true;
  }
  window.cambiarRutaBackup=async function(){
    if(isMobile()){alert('En teléfono no se guarda copia local. Los datos se guardan online en Supabase.'); return;}
    if(!window.showDirectoryPicker){alert('Este navegador no permite recordar una carpeta concreta. Usa Chrome o Edge actualizado.'); return;}
    try{const h=await window.showDirectoryPicker({mode:'readwrite'}); await idbSet(h); window.yneaBackupDirHandle=h; const st=document.getElementById('backupMainStatus'); if(st) st.textContent='Ruta guardada para las copias en este PC.'; alert('Ruta guardada para este PC.');}catch(e){if(!e||e.name!=='AbortError')alert('No se pudo guardar la ruta.');}
  };
  window.olvidarRutaBackup=async function(){window.yneaBackupDirHandle=null; await idbDel(); alert('Ruta olvidada.');};
  window.guardarEnCarpetaFija=async function(){try{await escribirBackupPC(); if(!isMobile()) alert('Copia guardada correctamente.');}catch(e){alert('No se pudo guardar la copia: '+(e.message||e));}};
  window.exportBackup=window.guardarEnCarpetaFija;
  window.exportBackupNow=window.guardarEnCarpetaFija;

  // Bloquear creación o edición en fechas anteriores a hoy.
  const wrap=(name,check)=>{const fn=window[name]; if(typeof fn==='function'&&!fn.__yneaNoPast){window[name]=function(){if(check&&check.apply(this,arguments)===false)return; return fn.apply(this,arguments)}; window[name].__yneaNoPast=true;}};
  function checkNueva(){const f=document.getElementById('fechaCita')?.value; if(esFechaPasada(f)){avisoFechaPasada(); return false;}}
  function checkEditor(){const f=document.getElementById('editCitaFecha')?.value; if(esFechaPasada(f)){avisoFechaPasada(); return false;}}
  function checkEnlazada(){const f=document.getElementById('enlazadaFecha')?.value; if(esFechaPasada(f)){avisoFechaPasada(); return false;}}
  function checkQuick(fecha){if(esFechaPasada(fecha)){avisoFechaPasada(); return false;}}
  function instalarBloqueos(){
    wrap('addCita',checkNueva);
    wrap('guardarCitaDesdeEditor',checkEditor);
    wrap('guardarEdicionCita',checkEditor);
    wrap('guardarCitaEnlazada',checkEnlazada);
    wrap('quickNewCita',checkQuick);
    setMinDates();
  }

  // Cierre: móvil solo guarda online/cierra; PC guarda online y copia en ruta indicada.
  window.yneaSalirConCopia=async function(){
    try{ if(typeof window.yneaForceCloudSave==='function') await window.yneaForceCloudSave(); else if(typeof save==='function') save(); }catch(e){console.warn('guardado online al cerrar',e);}
    if(!isMobile()){try{await escribirBackupPC();}catch(e){alert('No se pudo hacer la copia de seguridad: '+(e.message||e));}}
    try{sessionStorage.removeItem('yneaCurrentUser');}catch(e){}
    try{document.documentElement.classList.add('ynea-locked');}catch(e){}
    /* reload eliminado */
  };

  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{instalarBloqueos(); setMinDates();},300);},true);
  setInterval(()=>{instalarBloqueos(); setMinDates();},1500);
})();


function pastelColorProfesional(nombre){
 const n=(nombre||'').toLowerCase();
 if(n.includes('susana')){
   return '#f8c8dc';
 }
 const colors=['#fde2e4','#e2f0cb','#cddafd','#fff1c1','#e0c3fc','#b5ead7','#f9dcc4'];
 let h=0; for(let i=0;i<(nombre||'').length;i++) h+=nombre.charCodeAt(i);
 return colors[h % colors.length];
}



(function(){
  'use strict';

  function esMovil(){
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.matchMedia('(max-width:700px)').matches;
  }

  function irCalendarioYRepintar(fecha){
    try{
      if(fecha && typeof monday==='function'){
        weekStart = monday(new Date(fecha));
        const wp=document.getElementById('weekPicker');
        if(wp) wp.value = fecha;
      }
    }catch(e){}
    try{
      if(typeof setView==='function') setView('semana');
    }catch(e){}
    try{
      if(typeof renderAll==='function') renderAll();
    }catch(e){}
    setTimeout(function(){try{ if(typeof renderAll==='function') renderAll(); }catch(e){}},80);
    setTimeout(function(){try{ if(typeof renderAll==='function') renderAll(); }catch(e){}},300);
  }

  // Render de pacientes móvil sin teléfono/email/observaciones.
  const renderPatientsBase = window.renderPatients;
  window.renderPatients = function(){
    const tabla=document.getElementById('pacientesTable');
    if(!tabla) return;
    if(esMovil()){
      const pacientes=(window.data && Array.isArray(window.data.pacientes)) ? window.data.pacientes : (typeof data!=='undefined' && Array.isArray(data.pacientes) ? data.pacientes : []);
      tabla.innerHTML = '<tbody>' + pacientes.map(function(p){
        return '<tr><td><b>' + String(p.nombre||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}) + '</b></td></tr>';
      }).join('') + '</tbody>';
      return;
    }
    if(typeof renderPatientsBase === 'function') return renderPatientsBase.apply(this, arguments);
  };

  // Crear cita: guardar, cerrar formulario móvil si existe y volver al calendario.
  const addCitaBase = window.addCita;
  window.addCita = function(){
    const antes = (window.data && Array.isArray(window.data.citas)) ? window.data.citas.length : 0;
    const r = addCitaBase.apply(this, arguments);
    const despues = (window.data && Array.isArray(window.data.citas)) ? window.data.citas.length : antes;
    if(despues > antes){
      try{ if(typeof window.yneaForceCloudSave==='function') window.yneaForceCloudSave(); }catch(e){}
      try{
        const f=document.getElementById('fechaCita')?.value;
        irCalendarioYRepintar(f);
      }catch(e){ irCalendarioYRepintar(); }
    }
    return r;
  };

  // Editar cita: guardar, cerrar modal y volver al calendario.
  const guardarEditorBase = window.guardarCitaDesdeEditor;
  window.guardarCitaDesdeEditor = function(){
    const f=document.getElementById('editCitaFecha')?.value;
    const r = guardarEditorBase.apply(this, arguments);
    try{ if(typeof window.yneaForceCloudSave==='function') window.yneaForceCloudSave(); }catch(e){}
    try{
      const ov=document.getElementById('editorCitaOverlay');
      if(ov) ov.style.display='none';
    }catch(e){}
    irCalendarioYRepintar(f);
    return r;
  };

  // Eliminar cita: NO cerrar app, NO recargar. Borra, guarda online y reconstruye cuadrícula.
  window.eliminarCitaDesdeEditor = async function(){
    const id=document.getElementById('editCitaId')?.value;
    const f=document.getElementById('editCitaFecha')?.value;
    if(!id){ alert('No se ha encontrado la cita para eliminar.'); return; }
    if(!confirm('¿Eliminar esta cita?')) return;

    try{
      if(window.data && Array.isArray(window.data.citas)){
        window.data.citas = window.data.citas.filter(function(c){return String(c.id)!==String(id);});
      }
      if(typeof data!=='undefined' && Array.isArray(data.citas)){
        data.citas = data.citas.filter(function(c){return String(c.id)!==String(id);});
      }
    }catch(e){}

    try{ if(typeof save==='function') save(); }catch(e){}
    try{ if(typeof window.yneaForceCloudSave==='function') await window.yneaForceCloudSave(); }catch(e){ console.warn(e); }

    try{
      const ov=document.getElementById('editorCitaOverlay');
      if(ov) ov.style.display='none';
    }catch(e){}

    irCalendarioYRepintar(f);
  };

  // Compatibilidad con botones que llamen a otro nombre.
  window.eliminarCita = window.eliminarCitaDesdeEditor;

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){try{window.renderPatients();}catch(e){}},250);
  }, true);
})();


(function(){
  function reconstruirCuadricula(){
    try{ if(typeof renderWeek==='function') renderWeek(); }catch(e){}
    try{ if(typeof renderMonth==='function') renderMonth(); }catch(e){}
    try{ if(typeof renderAll==='function') renderAll(); }catch(e){}
    setTimeout(function(){
      try{ if(typeof renderWeek==='function') renderWeek(); }catch(e){}
      try{ if(typeof renderMonth==='function') renderMonth(); }catch(e){}
      try{ if(typeof renderAll==='function') renderAll(); }catch(e){}
    },120);
  }

  const eliminarBase = window.eliminarCitaDesdeEditor;
  window.eliminarCitaDesdeEditor = async function(){
    const r = await eliminarBase.apply(this, arguments);
    reconstruirCuadricula();
    return r;
  };

  window.eliminarCita = window.eliminarCitaDesdeEditor;
})();


(function(){
  function texto(el){ return (el && el.textContent ? el.textContent : '').trim().toLowerCase(); }

  function repararBotonesPC(){
    try{
      const botones = Array.from(document.querySelectorAll('button'));
      const cerrar = botones.find(b => texto(b) === 'cerrar' || texto(b).includes('cerrar'));
      const bloqueos = botones.find(b => texto(b).includes('bloqueos') || texto(b).includes('bloqueo'));
      if(cerrar){
        cerrar.style.marginRight = '16px';
        cerrar.style.marginLeft = '0';
        cerrar.style.position = 'relative';
        cerrar.style.zIndex = '5';
      }
      if(bloqueos){
        bloqueos.style.marginLeft = '16px';
        bloqueos.style.position = 'relative';
        bloqueos.style.zIndex = '4';
      }
      if(cerrar && cerrar.parentElement){
        cerrar.parentElement.style.display = 'flex';
        cerrar.parentElement.style.flexWrap = 'wrap';
        cerrar.parentElement.style.gap = '8px';
        cerrar.parentElement.style.alignItems = 'center';
      }
    }catch(e){}
  }

  function limpiarHuecos(){
    try{
      const candidatos = Array.from(document.querySelectorAll('.cita,.calendar-cita,.evento-cita,.evento,.appointment,[data-cita-id],[data-event-id]'));
      candidatos.forEach(function(el){
        const t = texto(el);
        const sinContenido = !t || t === 'undefined' || t === 'null' || t === '-' || t === '—';
        const sinInputs = !el.querySelector('input,select,textarea,button');
        if(sinContenido && sinInputs){
          el.remove();
        }
      });

      // Si una celda quedó artificialmente alta tras borrar, devolverla a tamaño normal.
      Array.from(document.querySelectorAll('td, .calendar-cell, .day-cell, .slot, .time-slot')).forEach(function(celda){
        const citas = celda.querySelectorAll('.cita,.calendar-cita,.evento-cita,.evento,.appointment,[data-cita-id],[data-event-id]');
        if(citas.length === 0){
          celda.style.minHeight = '';
          celda.style.height = '';
          celda.style.paddingBottom = '';
        }
      });
    }catch(e){}
  }

  function reparar(){
    try{ if(typeof renderWeek === 'function') renderWeek(); }catch(e){}
    try{ if(typeof renderMonth === 'function') renderMonth(); }catch(e){}
    try{ if(typeof renderAll === 'function') renderAll(); }catch(e){}
    setTimeout(limpiarHuecos, 30);
    setTimeout(limpiarHuecos, 160);
    setTimeout(repararBotonesPC, 60);
  }

  window.yneaRepararCuadricula = reparar;

  window.addEventListener('load', function(){
    setTimeout(reparar, 150);
    setTimeout(reparar, 600);
    setTimeout(repararBotonesPC, 1000);
  });

  document.addEventListener('click', function(){
    setTimeout(function(){
      limpiarHuecos();
      repararBotonesPC();
    }, 80);
  }, true);

  // Tras eliminar cita, limpiar de nuevo sin cerrar app.
  const anteriorEliminar = window.eliminarCitaDesdeEditor;
  if(typeof anteriorEliminar === 'function'){
    window.eliminarCitaDesdeEditor = async function(){
      const r = await anteriorEliminar.apply(this, arguments);
      setTimeout(reparar, 60);
      setTimeout(reparar, 300);
      return r;
    };
    window.eliminarCita = window.eliminarCitaDesdeEditor;
  }
})();


(function(){
  function limpiarRolTexto(t){
    return String(t||'')
      .replace(/\s*[·•]\s*(Administrador|Admin|Recepción|Recepcion|Profesional|Usuario|Móvil|Movil|Limitado|Total).*$/i,'')
      .replace(/\s*[-–—|]\s*(Administrador|Admin|Recepción|Recepcion|Profesional|Usuario|Móvil|Movil|Limitado|Total).*$/i,'')
      .replace(/\s*\((Administrador|Admin|Recepción|Recepcion|Profesional|Usuario|Móvil|Movil|Limitado|Total)[^)]*\)\s*$/i,'')
      .trim();
  }

  function limpiarSelectAcreditacion(){
    var sel=document.getElementById('yneaLoginUser');
    if(!sel) return;
    Array.prototype.forEach.call(sel.options,function(opt){
      var limpio=limpiarRolTexto(opt.textContent);
      if(limpio) opt.textContent=limpio;
    });
  }

  var original=window.renderLoginSelect;
  if(typeof original==='function'){
    window.renderLoginSelect=function(){
      var r=original.apply(this, arguments);
      limpiarSelectAcreditacion();
      setTimeout(limpiarSelectAcreditacion, 50);
      return r;
    };
  }

  document.addEventListener('DOMContentLoaded', function(){
    limpiarSelectAcreditacion();
    setTimeout(limpiarSelectAcreditacion, 300);
    setTimeout(limpiarSelectAcreditacion, 1000);
  });
  window.addEventListener('load', function(){
    limpiarSelectAcreditacion();
    setTimeout(limpiarSelectAcreditacion, 500);
  });
  setInterval(limpiarSelectAcreditacion, 1000);
})();


(function(){
  function byId(id){ return document.getElementById(id); }

  function parseDateLocal(v){
    if(v instanceof Date){
      return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    }
    if(typeof v === 'string' && v){
      var m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if(m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    }
    return new Date();
  }

  function isoLocal(d){
    var x = parseDateLocal(d);
    return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0');
  }

  function mondayLocal(d){
    var x = parseDateLocal(d);
    var day = x.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    x.setHours(0,0,0,0);
    return x;
  }

  function addDaysLocal(d,n){
    var x = parseDateLocal(d);
    x.setDate(x.getDate() + Number(n||0));
    return x;
  }

  function safeHtml(v){
    return String(v == null ? '' : v)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;');
  }

  function safeJs(v){
    return String(v == null ? '' : v)
      .replaceAll('\\','\\\\')
      .replaceAll("'","\\'")
      .replaceAll('\n',' ');
  }

  function getWeekBase(){
    var wp = byId('weekPicker');
    if(wp && wp.value) return mondayLocal(wp.value);
    try{
      if(typeof weekStart !== 'undefined') return mondayLocal(weekStart);
    }catch(e){}
    return mondayLocal(new Date());
  }

  function setWeekBase(d){
    var m = mondayLocal(d);
    var wp = byId('weekPicker');
    if(wp) wp.value = isoLocal(m);
    try{ weekStart = m; }catch(e){}
    try{ window.weekStart = m; }catch(e){}
    return m;
  }

  /* REEMPLAZO REAL DEL RENDER SEMANAL:
     usa SIEMPRE weekPicker.value, no variables antiguas de parches. */
  renderWeek = function(){
    var table = byId('weekTable');
    if(!table) return;

    var profFilter = byId('weekProf') ? byId('weekProf').value : '';
    var consultaSeleccionada = byId('weekConsulta') ? byId('weekConsulta').value : '';
    var base = getWeekBase();
    var days = [0,1,2,3,4].map(function(n){ return addDaysLocal(base,n); });

    var title = byId('weekTitle');
    if(title){
      title.textContent = (consultaSeleccionada ? ('Consulta: ' + consultaSeleccionada) : 'Todas las consultas') +
        ' · Semana del ' + days[0].toLocaleDateString('es-ES') +
        ' al ' + days[4].toLocaleDateString('es-ES');
    }

    var skip = {};
    var out = '<thead><tr><th>Hora</th>';
    days.forEach(function(d){
      out += '<th>' + (typeof fmt === 'function' ? fmt(d) : d.toLocaleDateString('es-ES')) + '</th>';
    });
    out += '</tr></thead><tbody>';

    (horas || []).forEach(function(h){
      out += '<tr><td class="time">' + safeHtml(h) + '</td>';

      days.forEach(function(d){
        var date = typeof iso === 'function' ? iso(d) : isoLocal(d);
        var key = date + '_' + h;
        if(skip[key]) return;

        var citasInicio = (data.citas || []).filter(function(c){
          return c.fecha === date &&
                 citaEsInicio(c,h) &&
                 (!consultaSeleccionada || c.consulta === consultaSeleccionada) &&
                 (!profFilter || c.profesional === profFilter);
        });

        var citasOcupando = (data.citas || []).filter(function(c){
          return c.fecha === date &&
                 citaOcupaHora(c,h) &&
                 !citaEsInicio(c,h) &&
                 (!consultaSeleccionada || c.consulta === consultaSeleccionada) &&
                 (!profFilter || c.profesional === profFilter);
        });

        if(citasInicio.length){
          var c = citasInicio[0];
          var p = typeof paciente === 'function' ? paciente(c.pacienteId) : {};
          var bloques = Math.max(1, Math.ceil(Number(c.duracion || 10) / 10));

          for(var i=1;i<bloques;i++){
            var idx = (horas || []).indexOf(h) + i;
            var hh = (horas || [])[idx];
            if(hh) skip[date + '_' + hh] = true;
          }

          var esSusana = String(c.profesional || '').toLowerCase().includes('susana');
          out += '<td class="slot" rowspan="' + bloques + '">' +
            '<div class="appt ' + (esSusana ? 'ynea-susana-rosa' : '') + '" ' +
            'onclick="event.stopPropagation(); abrirEditorCita(' + c.id + ')" ' +
            'title="' + safeHtml(c.obs || '') + '" ' +
            'style="background:' + (esSusana ? '#f8c8dc' : '') + ';height:100%;min-height:' + Math.max(58,bloques*58) + 'px;display:flex;flex-direction:column;justify-content:center">' +
            '<strong>' + safeHtml(p.nombre || '') + '</strong>' +
            '<span>' + safeHtml(c.profesional || '') + '</span>' +
            '<span>' + safeHtml(c.tipo || '') + ' · ' + safeHtml(c.duracion || '') + ' min · ' + safeHtml(c.consulta || '') + '</span>' +
            '<span class="badge ' + safeHtml(String(c.estado || '').replace(' ','')) + '">' + safeHtml(c.estado || '') + '</span>' +
            '</div></td>';
        }else if(citasOcupando.length){
          /* cubierta por rowspan */
        }else{
          out += '<td class="slot" onclick="quickNewCitaConsulta(\'' + safeJs(date) + '\',\'' + safeJs(h) + '\',\'' + safeJs(consultaSeleccionada || '') + '\')" style="cursor:pointer;color:#94a3b8;text-align:center;vertical-align:middle">+ Añadir</td>';
        }
      });

      out += '</tr>';
    });

    out += '</tbody>';
    table.innerHTML = out;
  };

  setWeekFromDate = function(value){
    setWeekBase(value || new Date());
    renderWeek();
    try{ if(typeof updateRangeDisplays === 'function') updateRangeDisplays(); }catch(e){}
  };

  moveWeek = function(n){
    var base = getWeekBase();
    base.setDate(base.getDate() + (Number(n||0) * 7));
    setWeekBase(base);
    renderWeek();
    try{ if(typeof updateRangeDisplays === 'function') updateRangeDisplays(); }catch(e){}
  };

  goThisWeek = function(){
    setWeekBase(new Date());
    renderWeek();
    try{ if(typeof updateRangeDisplays === 'function') updateRangeDisplays(); }catch(e){}
  };

  /* Limpieza de textos de acreditación incluso si otra función reconstruye el login */
  function limpiarLogin(){
    var root = byId('yneaLoginOverlay');
    if(!root) return;
    var hint = root.querySelector('.ynea-login-hint');
    if(hint) hint.remove();
    root.querySelectorAll('.ynea-login-remember,.ynea-login-link').forEach(function(x){ x.style.display='none'; });
  }

  document.addEventListener('DOMContentLoaded', function(){
    setWeekBase((byId('weekPicker') && byId('weekPicker').value) || new Date());
    limpiarLogin();
    setTimeout(function(){ try{ renderWeek(); }catch(e){} limpiarLogin(); }, 250);
    setTimeout(limpiarLogin, 1000);
  });

  window.addEventListener('load', function(){
    limpiarLogin();
    setTimeout(limpiarLogin, 500);
  });

  setInterval(limpiarLogin, 1000);
})();


(function(){
  function el(id){ return document.getElementById(id); }

  function parseDateLocal(v){
    if(v instanceof Date){
      return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    }
    if(typeof v === 'string' && v){
      var m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if(m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    }
    return new Date();
  }

  function isoLocal(d){
    var x = parseDateLocal(d);
    return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0');
  }

  function mondayLocal(d){
    var x = parseDateLocal(d);
    var day = x.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    x.setHours(0,0,0,0);
    return x;
  }

  function fmtDate(d){
    return parseDateLocal(d).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit'});
  }

  function semanaActualTabla(){
    var wp = el('weekPicker');
    var base = wp && wp.value ? mondayLocal(wp.value) : mondayLocal(new Date());
    var end = parseDateLocal(base);
    end.setDate(end.getDate() + 4);
    return {start:base, end:end};
  }

  function actualizarTextoSemana(){
    var wp = el('weekPicker');
    var btn = el('yneaWeekDisplay');
    var title = el('weekTitle');
    var s = semanaActualTabla();

    if(wp) wp.value = isoLocal(s.start);

    var texto = fmtDate(s.start) + ' - ' + fmtDate(s.end);

    if(btn){
      btn.textContent = texto;
      btn.title = texto;
    }

    if(title && title.textContent){
      /* Si el título tiene rango antiguo, lo dejamos sincronizado con el mismo rango */
      title.textContent = title.textContent.replace(
        /Semana del .*?(?=$| ·)/,
        'Semana del ' + fmtDate(s.start) + ' al ' + fmtDate(s.end)
      );
    }
  }

  var oldRenderWeek = typeof renderWeek === 'function' ? renderWeek : null;
  if(oldRenderWeek){
    renderWeek = function(){
      var r = oldRenderWeek.apply(this, arguments);
      actualizarTextoSemana();
      return r;
    };
    window.renderWeek = renderWeek;
  }

  ['moveWeek','goThisWeek','setWeekFromDate'].forEach(function(fn){
    var old = window[fn];
    if(typeof old === 'function'){
      window[fn] = function(){
        var r = old.apply(this, arguments);
        actualizarTextoSemana();
        setTimeout(actualizarTextoSemana, 40);
        return r;
      };
    }
  });

  var oldUpdate = typeof updateRangeDisplays === 'function' ? updateRangeDisplays : null;
  if(oldUpdate){
    updateRangeDisplays = function(){
      var r = oldUpdate.apply(this, arguments);
      actualizarTextoSemana();
      return r;
    };
    window.updateRangeDisplays = updateRangeDisplays;
  }

  document.addEventListener('DOMContentLoaded', function(){
    actualizarTextoSemana();
    setTimeout(actualizarTextoSemana, 250);
    setTimeout(actualizarTextoSemana, 800);
  });
  window.addEventListener('load', function(){
    actualizarTextoSemana();
    setTimeout(actualizarTextoSemana, 300);
  });
})();


(function(){
  function normalizar(v){
    return String(v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .trim();
  }

  function getPacientesQuery(){
    var posibles = [
      'pacientesSearch',
      'pacienteSearch',
      'buscarPaciente',
      'buscadorPacientes',
      'pacientesSearchInput',
      'filtroPacienteListado'
    ];

    for(var i=0;i<posibles.length;i++){
      var el = document.getElementById(posibles[i]);
      if(el) return el;
    }

    var view = document.getElementById('pacientesView');
    if(view){
      var inputs = Array.prototype.slice.call(view.querySelectorAll('input'));
      var buscador = inputs.find(function(x){
        var ph = normalizar(x.getAttribute('placeholder') || '');
        var id = normalizar(x.id || '');
        return ph.includes('buscar') || id.includes('buscar') || id.includes('search');
      });
      if(buscador) return buscador;
    }

    return null;
  }

  function textoPacienteDesdeFila(tr){
    return normalizar(tr.textContent || '');
  }

  function filtrarPacientesMovil(){
    var input = getPacientesQuery();
    var q = normalizar(input ? input.value : '');

    var view = document.getElementById('pacientesView');
    if(!view) return;

    var filas = Array.prototype.slice.call(view.querySelectorAll('#pacientesTable tbody tr, table#pacientesTable tbody tr'));

    filas.forEach(function(tr){
      var visible = !q || textoPacienteDesdeFila(tr).includes(q);
      tr.classList.toggle('yneaPacienteCardOculta', !visible);
      tr.style.display = visible ? '' : 'none';
    });

    /* Si existe una vista móvil alternativa de tarjetas, filtrarla también */
    var cards = Array.prototype.slice.call(view.querySelectorAll('.pacienteCard, .paciente-card, [data-paciente-card]'));
    cards.forEach(function(card){
      var visible = !q || normalizar(card.textContent || '').includes(q);
      card.classList.toggle('yneaPacienteCardOculta', !visible);
      card.style.display = visible ? '' : 'none';
    });
  }

  function conectarBuscadorPacientes(){
    var input = getPacientesQuery();
    if(!input || input.dataset.yneaBuscadorFix === '1') return;

    input.dataset.yneaBuscadorFix = '1';
    input.addEventListener('input', filtrarPacientesMovil);
    input.addEventListener('keyup', filtrarPacientesMovil);
    input.addEventListener('search', filtrarPacientesMovil);
    input.addEventListener('change', filtrarPacientesMovil);
  }

  var oldRenderPacientes = window.renderPacientes;
  if(typeof oldRenderPacientes === 'function'){
    window.renderPacientes = function(){
      var r = oldRenderPacientes.apply(this, arguments);
      setTimeout(function(){
        conectarBuscadorPacientes();
        filtrarPacientesMovil();
      }, 30);
      return r;
    };
  }

  var oldRenderAll = window.renderAll;
  if(typeof oldRenderAll === 'function'){
    window.renderAll = function(){
      var r = oldRenderAll.apply(this, arguments);
      setTimeout(function(){
        conectarBuscadorPacientes();
        filtrarPacientesMovil();
      }, 60);
      return r;
    };
  }

  document.addEventListener('input', function(ev){
    var input = getPacientesQuery();
    if(input && ev.target === input) filtrarPacientesMovil();
  }, true);

  document.addEventListener('DOMContentLoaded', function(){
    conectarBuscadorPacientes();
    setTimeout(conectarBuscadorPacientes, 300);
    setTimeout(filtrarPacientesMovil, 500);
  });

  window.addEventListener('load', function(){
    conectarBuscadorPacientes();
    filtrarPacientesMovil();
    setTimeout(function(){
      conectarBuscadorPacientes();
      filtrarPacientesMovil();
    }, 800);
  });

  setInterval(function(){
    conectarBuscadorPacientes();
  }, 1200);

  window.yneaFiltrarPacientesMovil = filtrarPacientesMovil;
})();


(function(){
  function norm(v){
    return String(v||'')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .trim();
  }

  function q(sel, root){ return (root||document).querySelector(sel); }
  function qa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  function getPacientesView(){ return document.getElementById('pacientesView'); }

  function getSearchInput(){
    var view = getPacientesView();
    if(!view) return null;

    var exact = document.getElementById('buscadorPacientes')
      || document.getElementById('pacientesSearch')
      || document.getElementById('pacientesSearchInput')
      || document.getElementById('buscarPaciente')
      || document.getElementById('pacienteSearch');

    if(exact && view.contains(exact)) return exact;

    var inputs = qa('input', view).filter(function(inp){
      var id = norm(inp.id);
      var ph = norm(inp.getAttribute('placeholder'));
      var type = norm(inp.type);
      return type !== 'hidden' && (
        id.includes('busc') || id.includes('search') || ph.includes('buscar') || ph.includes('paciente')
      );
    });

    return inputs[0] || null;
  }

  function filaTexto(row){
    var raw = row.getAttribute('data-ynea-search-text') || row.textContent || '';
    return norm(raw);
  }

  function filtrarPacientes(){
    var view = getPacientesView();
    if(!view) return;

    var input = getSearchInput();
    if(!input) return;

    var term = norm(input.value);
    var rows = qa('#pacientesTable tbody tr', view);
    var cards = qa('.pacienteCard, .paciente-card, [data-paciente-card]', view);

    rows.forEach(function(row){
      var visible = !term || filaTexto(row).includes(term);
      row.classList.toggle('yneaPacienteOculto', !visible);
      row.style.display = visible ? '' : 'none';
    });

    cards.forEach(function(card){
      var visible = !term || filaTexto(card).includes(term);
      card.classList.toggle('yneaPacienteOculto', !visible);
      card.style.display = visible ? '' : 'none';
    });
  }

  function conectar(){
    var input = getSearchInput();
    if(!input) return;

    input.removeEventListener('input', filtrarPacientes);
    input.removeEventListener('keyup', filtrarPacientes);
    input.removeEventListener('change', filtrarPacientes);
    input.removeEventListener('search', filtrarPacientes);

    input.addEventListener('input', filtrarPacientes);
    input.addEventListener('keyup', filtrarPacientes);
    input.addEventListener('change', filtrarPacientes);
    input.addEventListener('search', filtrarPacientes);

    filtrarPacientes();
  }

  function fmtNoYear(d){
    return d.toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit'});
  }

  function parseLocal(v){
    if(v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    if(typeof v === 'string'){
      var m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if(m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    }
    return new Date();
  }

  function monday(d){
    var x = parseLocal(d);
    var day = x.getDay();
    var diff = day === 0 ? -6 : 1-day;
    x.setDate(x.getDate()+diff);
    x.setHours(0,0,0,0);
    return x;
  }

  function semanaSinAnio(){
    var btn = document.getElementById('yneaWeekDisplay');
    var picker = document.getElementById('weekPicker');
    if(!btn) return;

    var base = picker && picker.value ? monday(picker.value) : monday(new Date());
    var fin = new Date(base.getFullYear(), base.getMonth(), base.getDate()+4);
    var texto = fmtNoYear(base) + ' - ' + fmtNoYear(fin);

    btn.textContent = texto;
    btn.title = texto;
  }

  function postRender(){
    conectar();
    filtrarPacientes();
    semanaSinAnio();
  }

  var oldRenderAll = window.renderAll;
  if(typeof oldRenderAll === 'function'){
    window.renderAll = function(){
      var r = oldRenderAll.apply(this, arguments);
      setTimeout(postRender, 30);
      setTimeout(postRender, 200);
      return r;
    };
  }

  var oldRenderLists = window.renderLists;
  if(typeof oldRenderLists === 'function'){
    window.renderLists = function(){
      var r = oldRenderLists.apply(this, arguments);
      setTimeout(postRender, 30);
      return r;
    };
  }

  ['renderPacientes','moveWeek','goThisWeek','setWeekFromDate','updateRangeDisplays','renderWeek'].forEach(function(name){
    var old = window[name] || (typeof window[name] === 'function' ? window[name] : null);
    if(typeof old === 'function'){
      window[name] = function(){
        var r = old.apply(this, arguments);
        setTimeout(postRender, 20);
        setTimeout(semanaSinAnio, 120);
        return r;
      };
      try{
        if(name in window) eval(name + ' = window[name]');
      }catch(e){}
    }
  });

  document.addEventListener('input', function(e){
    var input = getSearchInput();
    if(input && e.target === input) filtrarPacientes();
  }, true);

  document.addEventListener('click', function(){
    setTimeout(postRender, 80);
  }, true);

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(postRender, 100);
    setTimeout(postRender, 500);
    setTimeout(postRender, 1200);
  });

  window.addEventListener('load', function(){
    postRender();
    setTimeout(postRender, 500);
    setTimeout(postRender, 1500);
  });

  setInterval(function(){
    conectar();
    semanaSinAnio();
  }, 1000);

  window.yneaFiltrarPacientes = filtrarPacientes;
})();


(function(){
  const PENDING_KEY='yneaPendientesRecientesPacientesCitasV2';

  function $(id){return document.getElementById(id);}
  function norm(v){
    return String(v||'')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .trim();
  }
  function esc(v){
    return String(v==null?'':v)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;');
  }
  function getData(){
    try{return window.data || data;}catch(e){return window.data || {};}
  }
  function setData(d){
    try{window.data=d; data=d;}catch(e){window.data=d;}
  }
  function loadPending(){
    try{return JSON.parse(localStorage.getItem(PENDING_KEY)||'{"pacientes":[],"citas":[],"ts":0}');}
    catch(e){return {pacientes:[],citas:[],ts:0};}
  }
  function savePending(p){
    try{localStorage.setItem(PENDING_KEY, JSON.stringify(p));}catch(e){}
  }
  function rememberPending(){
    const d=getData();
    const p=loadPending();
    const cutoff=Date.now()-10*60*1000;
    p.pacientes=(p.pacientes||[]).filter(x=>(x.__ts||p.ts||0)>cutoff);
    p.citas=(p.citas||[]).filter(x=>(x.__ts||p.ts||0)>cutoff);

    (d.pacientes||[]).forEach(x=>{
      if(!x || !x.id) return;
      if(String(x.id).startsWith('p') && !p.pacientes.some(y=>y.id===x.id)){
        const c=JSON.parse(JSON.stringify(x)); c.__ts=Date.now(); p.pacientes.push(c);
      }
    });
    (d.citas||[]).forEach(x=>{
      if(!x || !x.id) return;
      if(!p.citas.some(y=>String(y.id)===String(x.id))){
        const c=JSON.parse(JSON.stringify(x)); c.__ts=Date.now(); p.citas.push(c);
      }
    });
    p.ts=Date.now();
    savePending(p);
  }
  function mergePending(){
    const d=getData();
    if(!d || typeof d!=='object') return false;
    const p=loadPending();
    const cutoff=Date.now()-10*60*1000;
    let changed=false;

    d.pacientes=Array.isArray(d.pacientes)?d.pacientes:[];
    d.citas=Array.isArray(d.citas)?d.citas:[];

    (p.pacientes||[]).filter(x=>(x.__ts||p.ts||0)>cutoff).forEach(x=>{
      if(x && x.id && !d.pacientes.some(y=>y.id===x.id)){
        const c=JSON.parse(JSON.stringify(x)); delete c.__ts;
        d.pacientes.push(c); changed=true;
      }
    });
    (p.citas||[]).filter(x=>(x.__ts||p.ts||0)>cutoff).forEach(x=>{
      if(x && x.id && !d.citas.some(y=>String(y.id)===String(x.id))){
        const c=JSON.parse(JSON.stringify(x)); delete c.__ts;
        d.citas.push(c); changed=true;
      }
    });

    if(changed){
      setData(d);
      try{localStorage.setItem('agendaClinicaSemanal', JSON.stringify(d));}catch(e){}
      try{if(typeof save==='function') save();}catch(e){}
      window.yneaLocalPendingUntil=Date.now()+120000;
      try{if(typeof window.yneaForceCloudSave==='function') setTimeout(()=>window.yneaForceCloudSave(), 300);}catch(e){}
    }
    return changed;
  }

  /* Reemplazo real del listado de pacientes: filtra por nombre/teléfono/email/obs */
  window.renderPatients = function(){
    mergePending();
    const d=getData();
    const table=$('pacientesTable');
    if(!table) return;

    const input=$('buscadorPacientes');
    const q=norm(input ? input.value : '');

    const pacientes=(d.pacientes||[]).filter(p=>{
      const texto=norm([p.nombre,p.telefono,p.email,p.obs].join(' '));
      return !q || texto.includes(q);
    });

    table.innerHTML =
      '<thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Observaciones</th></tr></thead><tbody>' +
      pacientes.map(p =>
        '<tr data-paciente-id="'+esc(p.id)+'">' +
        '<td><b>'+esc(p.nombre)+'</b></td>' +
        '<td>'+esc(p.telefono||'')+'</td>' +
        '<td>'+esc(p.email||'')+'</td>' +
        '<td>'+esc(p.obs||'')+'</td>' +
        '</tr>'
      ).join('') +
      '</tbody>';

    const info=$('pacientesSearchInfo');
    if(info){
      info.textContent = q ? (' ' + pacientes.length + ' resultado(s)') : '';
    }
  };

  function conectarBuscador(){
    const input=$('buscadorPacientes');
    if(!input || input.dataset.yneaSearchOk==='1') return;
    input.dataset.yneaSearchOk='1';
    input.oninput=function(){ window.renderPatients(); };
    input.addEventListener('input', function(){ window.renderPatients(); });
    input.addEventListener('keyup', function(){ window.renderPatients(); });
    input.addEventListener('search', function(){ window.renderPatients(); });
    input.addEventListener('change', function(){ window.renderPatients(); });
  }

  /* Envolver altas para recordar lo recién creado antes de que una lectura antigua lo pise */
  ['addCita','guardarNuevoPacienteModal','addPaciente'].forEach(function(name){
    const old=window[name];
    if(typeof old==='function' && !old.__yneaPendientesFix){
      window[name]=function(){
        const before=JSON.stringify(getData());
        const r=old.apply(this, arguments);
        setTimeout(function(){
          rememberPending();
          mergePending();
          try{if(typeof save==='function') save();}catch(e){}
          try{if(typeof window.yneaForceCloudSave==='function') window.yneaForceCloudSave();}catch(e){}
          try{if(typeof renderAll==='function') renderAll();}catch(e){}
          try{window.renderPatients();}catch(e){}
        }, 80);
        setTimeout(function(){
          mergePending();
          try{if(typeof window.yneaForceCloudSave==='function') window.yneaForceCloudSave();}catch(e){}
        }, 1000);
        return r;
      };
      window[name].__yneaPendientesFix=true;
    }
  });

  const oldRenderAll=window.renderAll;
  if(typeof oldRenderAll==='function' && !oldRenderAll.__yneaPatientsFix){
    window.renderAll=function(){
      mergePending();
      const r=oldRenderAll.apply(this, arguments);
      setTimeout(function(){conectarBuscador(); window.renderPatients(); mergePending();}, 50);
      return r;
    };
    window.renderAll.__yneaPatientsFix=true;
  }

  /* Proteger frente a recargas Supabase antiguas durante 2 minutos tras alta */
  setInterval(function(){
    conectarBuscador();
    const changed=mergePending();
    if(changed){
      try{if(typeof renderAll==='function') renderAll();}catch(e){}
      try{window.renderPatients();}catch(e){}
    }
  }, 1200);

  document.addEventListener('DOMContentLoaded', function(){
    conectarBuscador();
    mergePending();
    setTimeout(function(){conectarBuscador(); window.renderPatients();}, 300);
    setTimeout(function(){conectarBuscador(); window.renderPatients();}, 1200);
  });
  window.addEventListener('load', function(){
    conectarBuscador();
    mergePending();
    window.renderPatients();
  });
})();


(function(){
  'use strict';
  const SUPABASE_URL='https://vadohvwjoxghubceffpn.supabase.co';
  const SUPABASE_KEY='sb_publishable_PM7HIrRvX8ShKW8yUFvh-w_ucW8ewwY';
  const TABLE='agenda_online';
  const ID='main';

  function $(id){return document.getElementById(id);}
  function d(){try{return data;}catch(e){return window.data||{};}}
  function setD(x){try{data=x;}catch(e){} window.data=x;}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function normText(s){return String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');}
  function normPhone(s){return String(s||'').replace(/[^0-9+]/g,'').replace(/^00/,'+');}
  function normEmail(s){return String(s||'').trim().toLowerCase();}
  function getPacientes(){const x=d(); if(!Array.isArray(x.pacientes)) x.pacientes=[]; return x.pacientes;}
  function getCitas(){const x=d(); if(!Array.isArray(x.citas)) x.citas=[]; return x.citas;}
  function localSave(){try{localStorage.setItem('agendaClinicaSemanal',JSON.stringify(d()));localStorage.setItem('agendaData',JSON.stringify(d()));}catch(e){} try{if(typeof save==='function')save();}catch(e){}}
  async function cloudSave(){
    const payload=d();
    window.yneaLocalPendingUntil=Date.now()+30000;
    try{
      const r=await fetch(SUPABASE_URL+'/rest/v1/'+TABLE+'?on_conflict=id',{
        method:'POST',cache:'no-store',headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=representation'},
        body:JSON.stringify({id:ID,datos:payload,updated_at:new Date().toISOString()})
      });
      if(!r.ok) throw new Error(await r.text());
      try{if(typeof window.yneaForceCloudSave==='function') setTimeout(function(){window.yneaForceCloudSave().catch(function(){});},300);}catch(e){}
    }catch(e){console.warn('YNEA guardado nube final',e); try{if(typeof window.yneaForceCloudSave==='function') await window.yneaForceCloudSave();}catch(e2){}}
  }
  function afterChange(){localSave(); cloudSave(); try{if(typeof refreshAllSelects==='function')refreshAllSelects();}catch(e){} try{if(typeof renderPatients==='function')renderPatients();}catch(e){} try{if(typeof renderAll==='function')renderAll();}catch(e){} }

  function findDuplicate(nombre,telefono,email,excludeId){
    const n=normText(nombre), t=normPhone(telefono), em=normEmail(email);
    for(const p of getPacientes()){
      if(excludeId && String(p.id)===String(excludeId)) continue;
      if(n && normText(p.nombre)===n) return {tipo:'nombre',valor:nombre,p:p};
      if(t && normPhone(p.telefono)===t) return {tipo:'teléfono',valor:telefono,p:p};
      if(em && normEmail(p.email)===em) return {tipo:'email',valor:email,p:p};
    }
    return null;
  }
  function duplicateMessage(x){return 'Ese '+x.tipo+' ya está registrado.\n\nLo tiene: '+(x.p.nombre||'Paciente sin nombre')+'\nTeléfono: '+(x.p.telefono||'')+'\nEmail: '+(x.p.email||'');}
  window.yneaComprobarDuplicadoPaciente=function(nombre,telefono,email,excludeId){return findDuplicate(nombre,telefono,email,excludeId);};

  // Alta de paciente desde pestaña Pacientes.
  window.addPaciente=function(){
    const nombre=($('pacNombre')?.value||'').trim();
    const telefono=($('pacTelefono')?.value||'').trim();
    const email=($('pacEmail')?.value||'').trim();
    const obs=($('pacObs')?.value||'').trim();
    if(!nombre){alert('Escribe el nombre del paciente.');return;}
    if(!telefono){alert('El teléfono es obligatorio.');return;}
    if(!email){alert('El email es obligatorio.');return;}
    const dup=findDuplicate(nombre,telefono,email,null);
    if(dup){alert(duplicateMessage(dup));return;}
    const p={id:'p'+Date.now(),nombre:nombre,telefono:telefono,email:email,obs:obs,bloqueado:false,motivoBloqueo:''};
    getPacientes().push(p);
    ['pacNombre','pacTelefono','pacEmail','pacObs'].forEach(function(id){const el=$(id); if(el)el.value='';});
    try{if(typeof seleccionarPacienteCita==='function')seleccionarPacienteCita(p.id);}catch(e){}
    afterChange();
    alert('Paciente guardado.');
  };

  // Alta de paciente desde modal Nuevo paciente.
  window.guardarNuevoPacienteModal=function(){
    const nombre=($('npNombre')?.value||'').trim();
    const telefono=($('npTelefono')?.value||'').trim();
    const email=($('npEmail')?.value||'').trim();
    const obs=($('npObs')?.value||'').trim();
    function modalError(msg){try{if(typeof mostrarErrorNuevoPaciente==='function')mostrarErrorNuevoPaciente(msg);else alert(msg);}catch(e){alert(msg);}}
    if(!nombre){modalError('El nombre del paciente es obligatorio.');return;}
    if(!telefono){modalError('El teléfono es obligatorio.');return;}
    if(!email){modalError('El email es obligatorio.');return;}
    const dup=findDuplicate(nombre,telefono,email,null);
    if(dup){modalError(duplicateMessage(dup));return;}
    const p={id:'p'+Date.now(),nombre:nombre,telefono:telefono,email:email,obs:obs,bloqueado:false,motivoBloqueo:''};
    getPacientes().push(p);
    try{if(typeof seleccionarPacienteCita==='function')seleccionarPacienteCita(p.id);}catch(e){}
    const sel=$('pacienteCita'); if(sel) sel.value=p.id;
    const editSel=$('editCitaPaciente'); if(editSel){
      const opt=document.createElement('option'); opt.value=p.id; opt.textContent=p.nombre; editSel.appendChild(opt); editSel.value=p.id;
    }
    const ov=$('nuevoPacienteOverlay'); if(ov) ov.style.display='none';
    ['npNombre','npTelefono','npEmail','npObs'].forEach(function(id){const el=$(id); if(el)el.value='';});
    afterChange();
  };

  function pacienteById(id){return getPacientes().find(function(p){return String(p.id)===String(id);});}
  function blockedMessage(p){return 'Paciente bloqueado: '+(p.nombre||'')+'\nMotivo: '+(p.motivoBloqueo||'Sin motivo indicado');}
  function citaPacienteBloqueado(id){const p=pacienteById(id); if(p && p.bloqueado){alert(blockedMessage(p)); return true;} return false;}

  // Crear cita con control de paciente bloqueado.
  const oldAddCita=window.addCita;
  window.addCita=function(){
    let pid=''; try{pid=typeof pacienteSeleccionadoParaCita==='function'?pacienteSeleccionadoParaCita():($('pacienteCita')?.value||'');}catch(e){pid=$('pacienteCita')?.value||'';}
    if(citaPacienteBloqueado(pid)) return;
    return oldAddCita?oldAddCita.apply(this,arguments):undefined;
  };

  // Guardar editor con control de paciente bloqueado.
  const oldGuardarEditor=window.guardarCitaDesdeEditor;
  window.guardarCitaDesdeEditor=function(){
    const pid=$('editCitaPaciente')?.value||'';
    if(citaPacienteBloqueado(pid)) return;
    return oldGuardarEditor?oldGuardarEditor.apply(this,arguments):undefined;
  };

  // Borrado definitivo de cita: local + nube directa + repintado. Evita que en móvil reaparezca.
  window.eliminarCitaDesdeEditor=async function(){
    const id=$('editCitaId')?.value;
    const fecha=$('editCitaFecha')?.value;
    if(!id){alert('No se ha encontrado la cita para eliminar.');return;}
    if(!confirm('¿Eliminar esta cita?')) return;
    const x=d();
    x.citas=(Array.isArray(x.citas)?x.citas:[]).filter(function(c){return String(c.id)!==String(id);});
    setD(x);
    window.yneaLocalPendingUntil=Date.now()+30000;
    localSave();
    const ov=$('editorCitaOverlay'); if(ov) ov.style.display='none';
    try{if(fecha && typeof monday==='function'){weekStart=monday(new Date(fecha)); const wp=$('weekPicker'); if(wp)wp.value=fecha;}}catch(e){}
    try{if(typeof setView==='function')setView('semana');}catch(e){}
    try{if(typeof renderAll==='function')renderAll();}catch(e){}
    await cloudSave();
    setTimeout(function(){try{if(typeof renderAll==='function')renderAll();}catch(e){}},300);
  };
  window.eliminarCita=window.eliminarCitaDesdeEditor;

  // Editor de paciente con duplicados y bloqueo con motivo.
  window.editarPacienteYnea=function(id){
    const p=pacienteById(id); if(!p)return;
    const nombre=prompt('Nombre del paciente:',p.nombre||''); if(nombre===null)return;
    const telefono=prompt('Teléfono obligatorio:',p.telefono||''); if(telefono===null)return;
    const email=prompt('Email obligatorio:',p.email||''); if(email===null)return;
    if(!String(nombre).trim()||!String(telefono).trim()||!String(email).trim()){alert('Nombre, teléfono y email son obligatorios.');return;}
    const dup=findDuplicate(nombre,telefono,email,p.id); if(dup){alert(duplicateMessage(dup));return;}
    const obs=prompt('Observaciones:',p.obs||''); if(obs===null)return;
    const bloquear=confirm('¿Quieres BLOQUEAR este paciente?\n\nAceptar = bloquear / mantener bloqueado\nCancelar = dejar sin bloqueo');
    let motivo='';
    if(bloquear){motivo=prompt('Motivo del bloqueo:',p.motivoBloqueo||''); if(motivo===null) motivo=p.motivoBloqueo||'';}
    Object.assign(p,{nombre:String(nombre).trim(),telefono:String(telefono).trim(),email:String(email).trim(),obs:String(obs||'').trim(),bloqueado:!!bloquear,motivoBloqueo:bloquear?String(motivo||'').trim():''});
    afterChange();
  };

  // Render pacientes incluyendo estado bloqueado.
  const oldRenderPatients=window.renderPatients;
  window.renderPatients=function(){
    const table=$('pacientesTable');
    if(!table){return oldRenderPatients?oldRenderPatients.apply(this,arguments):undefined;}
    const q=normText($('buscadorPacientes')?.value||'');
    let arr=getPacientes();
    if(q){arr=arr.filter(function(p){return normText((p.nombre||'')+' '+(p.telefono||'')+' '+(p.email||'')+' '+(p.obs||'')).includes(q);});}
    table.innerHTML='<thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Observaciones</th></tr></thead><tbody>'+arr.map(function(p){
      const bloqueado=p.bloqueado?' <span class="ynea-paciente-bloqueado">BLOQUEADO: '+esc(p.motivoBloqueo||'Sin motivo')+'</span>':'';
      return '<tr data-paciente-id="'+esc(p.id)+'" onclick="editarPacienteYnea(\''+String(p.id).replace(/'/g,"\\'")+'\')"><td><b>'+esc(p.nombre)+'</b>'+bloqueado+'</td><td>'+esc(p.telefono||'')+'</td><td>'+esc(p.email||'')+'</td><td>'+esc(p.obs||'')+'</td></tr>';
    }).join('')+'</tbody>';
  };

  // Añadir botón Nuevo paciente en CREAR cita y MODIFICAR cita, también móvil.
  function addNuevoPacienteButtons(){
    const crearBox=$('pacienteBusqueda')?.closest('.pacienteSearchBox') || $('pacienteCita')?.parentElement;
    if(crearBox && !$('btnNuevoPacienteCitaFinal')){
      const b=document.createElement('button'); b.type='button'; b.id='btnNuevoPacienteCitaFinal'; b.className='secondary ynea-inline-patient-btn'; b.textContent='➕ Nuevo paciente'; b.onclick=function(){if(typeof abrirNuevoPaciente==='function')abrirNuevoPaciente();}; crearBox.appendChild(b);
    }
    const editSel=$('editCitaPaciente');
    if(editSel && !$('btnNuevoPacienteEditorFinal')){
      const b=document.createElement('button'); b.type='button'; b.id='btnNuevoPacienteEditorFinal'; b.className='secondary ynea-inline-patient-btn'; b.textContent='➕ Nuevo paciente'; b.onclick=function(){if(typeof abrirNuevoPaciente==='function')abrirNuevoPaciente();}; editSel.insertAdjacentElement('afterend',b);
    }
  }
  const oldAbrirEditor=window.abrirEditorCita;
  window.abrirEditorCita=function(){const r=oldAbrirEditor?oldAbrirEditor.apply(this,arguments):undefined; setTimeout(addNuevoPacienteButtons,50); return r;};
  document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){addNuevoPacienteButtons(); try{window.renderPatients();}catch(e){}},500);},true);
  setInterval(addNuevoPacienteButtons,1500);
})();
