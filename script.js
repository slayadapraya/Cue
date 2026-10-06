const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const initialNow = new Date();
const initialToday = dateKey(initialNow);
function daysFromToday(offset){const date=new Date(initialNow);date.setDate(date.getDate()+offset);return dateKey(date)}
const defaults = [
 {id:'a1',time:'11:42',label:'Wake Up',days:[2,5],date:'',on:true},
 {id:'a2',time:'12:00',label:'Wake Up',days:[5],date:'',on:true},
 {id:'a3',time:'13:00',label:'Wake Up',days:[],date:daysFromToday(1),on:true},
 {id:'a4',time:'11:42',label:'Wake Up',days:[],date:daysFromToday(2),on:false}
];
function read(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback}catch{return fallback}}
let alarms=read('cue-alarms',defaults);
let events=read('cue-events',[{id:'e1',date:daysFromToday(2),time:'13:00',title:'Group Project Meeting',location:'Library'}]);
let activeAlarmId;
try { activeAlarmId=localStorage.getItem('cue-active-alarm') } catch {}
if(!alarms.some(a=>a.id===activeAlarmId)) activeAlarmId=alarms[0]?.id;
let selectedDate=initialToday,month=new Date(initialNow.getFullYear(),initialNow.getMonth(),1),editing=null,repeat=[],toastTimer;
let clockDay=initialToday,clockMinute='',nextAlarmId=null;
const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(name,cls='')=>`<img class="${cls}" src="assets/${name}.svg" alt="">`;
function timeParts(time){const [h,m]=time.split(':').map(Number);return {value:`${h%12||12}:${String(m).padStart(2,'0')}`,period:h<12?'AM':'PM'}}
function toast(message){clearTimeout(toastTimer);$('.toast').textContent=message;$('.toast').classList.add('visible');toastTimer=setTimeout(()=>$('.toast').classList.remove('visible'),3000)}
function persist(keepAlarmCards=false){try{localStorage.setItem('cue-alarms',JSON.stringify(alarms));localStorage.setItem('cue-events',JSON.stringify(events));localStorage.setItem('cue-active-alarm',activeAlarmId||'')}catch{toast('Changes will last for this session.')}render(keepAlarmCards)}
function showScreen(name){if(!['home','alarms','calendar','settings'].includes(name))return;$$('.screen').forEach(el=>{const active=el.id===name;el.hidden=!active;el.classList.toggle('active',active)});$('.dock').className=`dock dock-${name}`;$$('.dock button').forEach(b=>{if(b.dataset.go===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});const label=$('.dock-label');label.textContent=name[0].toUpperCase()+name.slice(1);label.classList.remove('reveal');requestAnimationFrame(()=>label.classList.add('reveal'));window.scrollTo({top:0,behavior:'instant'})}
function render(keepAlarmCards=false){
 const count=alarms.filter(a=>a.on).length;$('#home-count').textContent=`${count} active`;$('#alarm-count').textContent=`${count} ${count===1?'alarm':'alarms'} active`;
 if(!keepAlarmCards) $('#alarm-list').innerHTML=alarms.map(a=>{const t=timeParts(a.time);return `<article class="alarm-card ${a.id===activeAlarmId?'is-active':''}" data-alarm-id="${a.id}" tabindex="0" aria-label="Select ${escapeHTML(a.label)} alarm at ${t.value} ${t.period}"><div class="alarm-top"><div class="alarm-time">${t.value} <small>${t.period}</small></div><button class="switch ${a.on?'on':''}" role="switch" aria-checked="${a.on}" aria-label="Enable ${escapeHTML(a.label)} at ${t.value} ${t.period}" data-toggle="${a.id}"></button></div><p class="alarm-name">${escapeHTML(a.label)}</p><div class="alarm-days">${a.days.length?days.map((d,i)=>`<span class="day-chip ${a.days.includes(i)?'selected':''}">${d}</span>`).join(''):`<span class="one-time"><span class="badge-calendar" aria-hidden="true"></span>One-time</span><span class="alarm-date">${new Date(a.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span>`}</div><button class="edit-alarm" data-edit="${a.id}" aria-label="Edit ${escapeHTML(a.label)} at ${t.value} ${t.period}">${img('1-imgArrow8')}</button></article>`}).join('')||'<p class="empty">No alarms yet. Add your first alarm above.</p>';
 $$('.alarm-card').forEach(card=>{const a=alarms.find(a=>a.id===card.dataset.alarmId);card.classList.toggle('is-active',a.id===activeAlarmId);const control=card.querySelector('.switch');control.classList.toggle('on',a.on);control.setAttribute('aria-checked',String(a.on))});
 updateNextAlarm(new Date());
 renderHome();renderCalendar();
}
function alarmOnDate(alarm,date){
 return alarm.on && (alarm.days.length ? alarm.days.includes((date.getDay()+6)%7) : alarm.date===dateKey(date));
}
function nextOccurrence(alarm,now){
 if(!alarm.on)return null;
 const [hours,minutes]=alarm.time.split(':').map(Number);
 if(!alarm.days.length){const date=new Date(alarm.date+'T00:00:00');date.setHours(hours,minutes,0,0);return date>=now?date:null}
 for(let offset=0;offset<=7;offset++){
  const date=new Date(now);date.setDate(date.getDate()+offset);date.setHours(hours,minutes,0,0);
  if(alarmOnDate(alarm,date)&&date>=now)return date;
 }
 return null;
}
function updateNextAlarm(now){
 // Keep an alarm visible throughout its scheduled minute.
 const minute=new Date(now);minute.setSeconds(0,0);
 const upcoming=alarms.map(alarm=>({alarm,date:nextOccurrence(alarm,minute)})).filter(item=>item.date).sort((a,b)=>a.date-b.date);
 const next=upcoming[0];nextAlarmId=next?.alarm.id||null;
 const control=$('#next-switch');control.disabled=!next;control.classList.toggle('on',Boolean(next));control.setAttribute('aria-checked',String(Boolean(next)));
 if(!next){$('#next-time').textContent='—';$('#next-period').textContent='';$('#next-date').textContent='No upcoming alarms';return}
 const time=timeParts(next.alarm.time);$('#next-time').textContent=time.value;$('#next-period').textContent=time.period;
 const tomorrow=new Date(now);tomorrow.setDate(tomorrow.getDate()+1);
 const prefix=dateKey(next.date)===dateKey(now)?'Today':dateKey(next.date)===dateKey(tomorrow)?'Tomorrow':next.date.toLocaleDateString('en-GB',{weekday:'short'});
 $('#next-date').textContent=`${prefix}, ${next.date.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}`;
 control.setAttribute('aria-label',`Disable next alarm: ${next.alarm.label} at ${time.value} ${time.period}`);
}
function renderHome(){
 const now=new Date(),weekStart=new Date(now);weekStart.setDate(weekStart.getDate()-(weekStart.getDay()+6)%7);
 $('#home-week').innerHTML=days.map((day,index)=>{
  const date=new Date(weekStart);date.setDate(date.getDate()+index);const key=dateKey(date);
  const hasItems=events.some(event=>event.date===key)||alarms.some(alarm=>alarmOnDate(alarm,date));
  return `<button data-week="${key}" class="${selectedDate===key?'selected':''} ${key===dateKey(now)?'is-today':''}" ${key===dateKey(now)?'aria-current="date"':''} aria-label="${date.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}"><small>${day.toUpperCase()}</small>${date.getDate()}<div class="dots">${hasItems?img('0-imgEllipse11'):''}</div></button>`;
 }).join('');
 const selected=new Date(selectedDate+'T12:00:00');
 const agenda=[...alarms.filter(alarm=>alarmOnDate(alarm,selected)).map(alarm=>({...alarm,kind:'alarm',title:alarm.label})),...events.filter(event=>event.date===selectedDate).map(event=>({...event,kind:'event'}))].sort((a,b)=>a.time.localeCompare(b.time)).slice(0,3);
 $('#home-agenda').innerHTML=agenda.map(item=>{const time=timeParts(item.time);return `<button class="agenda-row" ${item.kind==='alarm'?`data-edit="${item.id}"`:'data-go="calendar"'}><span>${time.value} ${time.period}</span>${img(item.kind==='alarm'?'0-imgEllipse14':'0-imgEllipse16')}<span><strong>${escapeHTML(item.title)}</strong><small>${item.kind==='alarm'?'Alarm':escapeHTML(item.location)}</small></span><span class="event-meta">${img('0-imgArrow1')}</span></button>`}).join('')||'<p class="empty">Nothing scheduled today.</p>';
}
function updateClock(){
 const now=new Date(),time=timeParts(`${now.getHours()}:${now.getMinutes()}`),today=dateKey(now);
 $('#current-time-value').textContent=time.value;$('#current-period').textContent=time.period;
 $('#current-date').textContent=now.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
 $('.clock-hand').style.transform=`rotate(${(now.getHours()%12)*30+now.getMinutes()/2-90}deg)`;
 if(today!==clockDay){
  if(selectedDate===clockDay)selectedDate=today;
  const previous=new Date(clockDay+'T12:00:00');
  if(month.getFullYear()===previous.getFullYear()&&month.getMonth()===previous.getMonth())month=new Date(now.getFullYear(),now.getMonth(),1);
  clockDay=today;render(true);
 }
 const minute=`${today}-${now.getHours()}:${now.getMinutes()}`;
 if(clockMinute!==minute){clockMinute=minute;updateNextAlarm(now)}
}

function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function renderCalendar(){
 $('#month-title').textContent=month.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
 const offset=(month.getDay()+6)%7,last=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 $('#calendar-grid').innerHTML=days.map(d=>`<small>${d}</small>`).join('')+'<span></span>'.repeat(offset)+Array.from({length:last},(_,i)=>{const key=dateKey(new Date(month.getFullYear(),month.getMonth(),i+1));return `<button data-date="${key}" class="${key===selectedDate?'selected':''} ${events.some(e=>e.date===key)?'has-event':''}" aria-label="${i+1} ${$('#month-title').textContent}" aria-pressed="${key===selectedDate}">${i+1}</button>`}).join('');
 $('#day-title').textContent=new Date(selectedDate+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
 const list=events.filter(e=>e.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));
 $('#day-events').innerHTML=list.map(e=>{const t=timeParts(e.time);return `<article class="day-event"><span>${t.value}<small>${t.period}</small></span><div><strong>${escapeHTML(e.title)}</strong><small>${escapeHTML(e.location)}</small></div><button data-delete-event="${e.id}" aria-label="Delete ${escapeHTML(e.title)}">×</button></article>`}).join('')||'<p class="empty">Nothing scheduled. Enjoy the space.</p>';
}
function renderRepeat(){ $('#repeat-days').innerHTML=days.map((d,i)=>`<button type="button" data-repeat="${i}" aria-pressed="${repeat.includes(i)}" class="${repeat.includes(i)?'selected':''}">${d}</button>`).join('');$('#date-label').hidden=repeat.length>0;$('#alarm-date').required=repeat.length===0; }
function openAlarm(id){if(id){activeAlarmId=id;persist(true)}editing=id||null;const a=alarms.find(a=>a.id===id);repeat=a?[...a.days]:[];$('#alarm-dialog-title').textContent=a?'Edit Alarm':'New Alarm';$('#alarm-time').value=a?.time||'07:00';$('#alarm-label').value=a?.label||'Wake Up';$('#alarm-date').value=a?.date||dateKey(new Date());$('#delete-alarm').hidden=!a;renderRepeat();$('#alarm-dialog').showModal()}
document.addEventListener('click',e=>{const card=e.target.closest('.alarm-card');if(card){activeAlarmId=card.dataset.alarmId;persist(true)}const b=e.target.closest('button');if(!b)return;if(b.dataset.go)showScreen(b.dataset.go);if(b.dataset.toggle){const a=alarms.find(a=>a.id===b.dataset.toggle);a.on=!a.on;activeAlarmId=a.id;persist(true)}if(b.dataset.edit)openAlarm(b.dataset.edit);if(b.dataset.close)$('#'+b.dataset.close).close();if(b.dataset.repeat!==undefined){const i=Number(b.dataset.repeat);repeat=repeat.includes(i)?repeat.filter(d=>d!==i):[...repeat,i];renderRepeat()}if(b.dataset.date){selectedDate=b.dataset.date;renderCalendar()}if(b.dataset.week){selectedDate=b.dataset.week;const date=new Date(selectedDate+'T12:00:00');month=new Date(date.getFullYear(),date.getMonth(),1);renderHome();renderCalendar();showScreen('calendar')}if(b.dataset.deleteEvent){events=events.filter(v=>v.id!==b.dataset.deleteEvent);persist();toast('Event deleted')}});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.alarm-card')){e.preventDefault();activeAlarmId=e.target.dataset.alarmId;persist(true)}});
$('#new-alarm').addEventListener('click',()=>openAlarm());
$('#alarm-form').addEventListener('submit',e=>{e.preventDefault();const value={id:editing||crypto.randomUUID(),time:$('#alarm-time').value,label:$('#alarm-label').value.trim()||'Alarm',days:[...repeat].sort(),date:repeat.length?'':$('#alarm-date').value,on:editing?alarms.find(a=>a.id===editing).on:true};if(editing)alarms=alarms.map(a=>a.id===editing?value:a);else alarms.push(value);activeAlarmId=value.id;persist();$('#alarm-dialog').close();toast('Alarm saved')});
$('#delete-alarm').addEventListener('click',()=>{alarms=alarms.filter(a=>a.id!==editing);if(activeAlarmId===editing)activeAlarmId=alarms[0]?.id;persist();$('#alarm-dialog').close();toast('Alarm deleted')});
$('#next-switch').addEventListener('click',()=>{const a=alarms.find(a=>a.id===nextAlarmId);if(a){a.on=!a.on;activeAlarmId=a.id;persist(true)}});
$('#prev-month').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);selectedDate=dateKey(month);renderCalendar()});$('#next-month').addEventListener('click',()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);selectedDate=dateKey(month);renderCalendar()});
$('#new-event').addEventListener('click',()=>{$('#event-form').reset();$('#event-dialog').showModal()});
$('#event-form').addEventListener('submit',e=>{e.preventDefault();events.push({id:crypto.randomUUID(),date:selectedDate,time:$('#event-time').value,title:$('#event-title').value.trim()||'Event',location:$('#event-location').value.trim()});persist();$('#event-dialog').close();toast('Event saved')});
$('#sync-button').addEventListener('click',()=>toast('Demo mode · Alarms saved in this browser.'));
$('#connection').addEventListener('click',()=>toast('Demo connection · Physical Cue Clock is not connected.'));
function applyTheme(dark){document.body.classList.toggle('dark-theme',dark);const control=$('#theme-switch');control.classList.toggle('on',dark);control.setAttribute('aria-checked',String(dark));document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#000000':'#003d42')}
let darkTheme=false;try{darkTheme=localStorage.getItem('cue-dark-theme')==='true'}catch{}
applyTheme(darkTheme);
$('#theme-switch').addEventListener('click',()=>{darkTheme=!darkTheme;applyTheme(darkTheme);try{localStorage.setItem('cue-dark-theme',String(darkTheme))}catch{toast('Theme saved for this session.')}});
render();
updateClock();
setInterval(updateClock,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateClock()});
window.addEventListener('focus',updateClock);
