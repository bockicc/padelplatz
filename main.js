/* ============================================================
   PADEL PLATZ KRALJEVO — JavaScript
   ============================================================ */
(function(){
'use strict';

document.addEventListener('DOMContentLoaded',function(){

// ========================= MOBILE MENU =========================
var ham=document.getElementById('hamburger-btn');
var mm=document.getElementById('mobileMenu');
if(ham&&mm){
  var mc=mm.querySelector('.mobile-close');
  function openM(){mm.classList.add('open');document.body.style.overflow='hidden';}
  function closeM(){mm.classList.remove('open');document.body.style.overflow='';}
  ham.addEventListener('click',function(e){e.stopPropagation();mm.classList.contains('open')?closeM():openM();});
  if(mc)mc.addEventListener('click',closeM);
  var ml=mm.querySelectorAll('a');
  for(var i=0;i<ml.length;i++)ml[i].addEventListener('click',closeM);
  mm.addEventListener('click',function(e){if(e.target===mm)closeM();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'||e.key==='Esc')closeM();});
}

// ========================= SMOOTH SCROLL =========================
var al=document.querySelectorAll('a[href^="#"]');
for(var a=0;a<al.length;a++){
  al[a].addEventListener('click',function(e){
    var h=this.getAttribute('href');
    if(h&&h.length>1){
      var t=document.querySelector(h);
      if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}
    }
  });
}

// ========================= ACTIVE NAV =========================
var cp=location.pathname.split('/').pop()||'index.html';
var nl=document.querySelectorAll('.nav-links a');
for(var n=0;n<nl.length;n++){
  var lh=nl[n].getAttribute('href');
  if(lh&&lh.split('/').pop()===cp){
    nl[n].style.color='#E8B84B';
    nl[n].style.background='rgba(232,184,75,0.15)';
  }
}

// ========================= SCROLL ANIMATION =========================
var ae=document.querySelectorAll('.animate-on-scroll');
if('IntersectionObserver' in window){
  var obs=new IntersectionObserver(function(entries){
    for(var e=0;e<entries.length;e++){
      if(entries[e].isIntersecting){entries[e].target.classList.add('visible');obs.unobserve(entries[e].target);}
    }
  },{threshold:0.05,rootMargin:'0px 0px -30px 0px'});
  for(var i=0;i<ae.length;i++)obs.observe(ae[i]);
}else{
  for(var i2=0;i2<ae.length;i2++)ae[i2].classList.add('visible');
}

// ========================= CONTACT FORM =========================
var cf=document.getElementById('contact-form');
if(cf){
  cf.addEventListener('submit',function(e){
    e.preventDefault();
    clearFM(cf);
    var nm=document.getElementById('contact-name');
    var ph=document.getElementById('contact-phone');
    var em=document.getElementById('contact-email');
    var msg=document.getElementById('contact-message');
    if(!nm.value.trim()){errF(nm,cf,'Unesite ime i prezime.');return;}
    if(!ph.value.trim()||!isValidPhone(ph.value)){errF(ph,cf,'Unesite ispravan broj telefona.');return;}
    if(!em.value.trim()||!isValidEmail(em.value)){errF(em,cf,'Unesite ispravan email.');return;}
    if(!msg.value.trim()){errF(msg,cf,'Unesite poruku.');return;}
    var btn=cf.querySelector('button');
    var oh=btn.innerHTML;
    btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Šaljem...';btn.disabled=true;
    setTimeout(function(){
      showFM(cf,'✅ Hvala! Vaša poruka je poslata. Javićemo vam se uskoro.');
      cf.reset();btn.innerHTML=oh;btn.disabled=false;
    },1200);
  });
}

// ================================================================
// ===================== RESERVATION SYSTEM ========================
// ================================================================
(function(){

// --- Date helpers ---
function todayStr(){
  var d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function parseDate(s){var p=s.split('-');return new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));}
function fmtDisplay(s){
  if(!s)return'';
  var p=s.split('-');
  var m=['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'];
  return parseInt(p[2])+'. '+m[parseInt(p[1],10)-1]+' '+p[0]+'. godine';
}

// --- Working hours ---
function isWorkingDay(d){return d.getDay()>=1&&d.getDay()<=5;} // Mon-Fri
function isWeekend(d){return d.getDay()===0||d.getDay()===6;} // Sat-Sun
function getDayStartEnd(d){
  var dow=d.getDay();
  if(dow===0)return{start:10,end:20}; // nedelja
  if(dow===6)return{start:9,end:22};  // subota
  return{start:8,end:24};             // pon-pet
}

// --- Simulated bookings (deterministic based on date) ---
// About 35-40% of available slots will be booked
function generateBookedSlots(){
  var booked={};
  var baseSeed=93025;
  var sd=new Date();
  sd.setHours(0,0,0,0);
  for(var dayOffset=0;dayOffset<60;dayOffset++){
    var d=new Date(sd);
    d.setDate(d.getDate()+dayOffset);
    var dow=d.getDay();
    if(dow===0)continue; // closed on Sunday
    var limits=getDayStartEnd(d);
    var iso=dateToISO(d);
    booked[iso]=[];
    for(var h=limits.start;h<limits.end;h++){
      baseSeed=(baseSeed*1103515245+12345)&0x7fffffff;
      if(baseSeed%100<40){
        booked[iso].push(h);
      }
    }
    if(booked[iso].length===0)delete booked[iso];
  }
  return booked;
}

var BOOKED=generateBookedSlots();
var TODAY=todayStr();

function dateToISO(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

// --- Calendar state ---
var calYear,calMonth,selectedDate=null;
var now=new Date();
calYear=now.getFullYear();
calMonth=now.getMonth();

var MONTHS=['Januar','Februar','Mart','April','Maj','Jun','Jul','Avgust','Septembar','Oktobar','Novembar','Decembar'];
var DAYS_SHORT=['Po','Ut','Sr','Če','Pe','Su','Ne'];

// --- DOM refs ---
var calGrid=document.getElementById('cal-grid');
var calLabel=document.getElementById('cal-label');
var calPrev=document.getElementById('cal-prev');
var calNext=document.getElementById('cal-next');
var dateInput=document.getElementById('date-input');
var dateDisplay=document.getElementById('date-display');
var timeSelect=document.getElementById('time-select');
var timesSection=document.getElementById('times-section');
var selectedInfo=document.getElementById('selected-info');
var selectedInfoText=document.getElementById('selected-info-text');

if(!calGrid)return; // not on reservation page

function formatSlot(h){
  var suffix=h<12?'h':(h===12?'h popodne':(h-12)+'h popodne');
  if(h>=20)return (h)+'h';
  return h+'h';
}

function renderCalendar(){
  calLabel.textContent=MONTHS[calMonth]+' '+calYear;
  var firstDow=new Date(calYear,calMonth,1).getDay();
  var daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  var offset=firstDow===0?6:firstDow-1; // Mon=0

  var h='';
  // empty cells
  for(var s=0;s<offset;s++)h+='<div class="cal-day cd-empty"></div>';

  for(var dd=1;dd<=daysInMonth;dd++){
    var dObj=new Date(calYear,calMonth,dd);
    var iso=dateToISO(dObj);
    var cls='cal-day';

    if(iso===TODAY)cls+=' cd-today';
    if(iso===selectedDate)cls+=' cd-sel';
    if(dObj<now){var ts=new Date();ts.setHours(0,0,0,0);if(dObj<ts)cls+=' cd-past';}

    var isBookedDay=BOOKED[iso]&&BOOKED[iso].length>0;
    var isWeekendDay=isWeekend(dObj);
    var isSunday=dObj.getDay()===0;

    if(isSunday){
      cls+=' cd-booked';
    }else if(dObj<now){
      cls+=' cd-booked';
    }else if(isBookedDay){
      // partially booked — show as partially styled
      // still clickable if some slots free
      // we'll keep it normal, click handler checks availability
    }

    h+='<div class="'+cls+'" data-d="'+iso+'" role="button" tabindex="0" aria-label="'+dd+'. '+MONTHS[calMonth]+'">'+dd+'</div>';
  }

  calGrid.innerHTML=h;

  // attach events
  var cells=calGrid.querySelectorAll('.cal-day:not(.cd-empty)');
  for(var c=0;c<cells.length;c++){
    cells[c].addEventListener('click',function(){
      var iso=this.getAttribute('data-d');
      selectDate(iso);
    });
    cells[c].addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        var iso=this.getAttribute('data-d');
        selectDate(iso);
      }
    });
  }
}

function selectDate(iso){
  var d=parseDate(iso);
  if(d<now){d.setHours(0,0,0,0);if(d<now)return;} // past
  if(d.getDay()===0)return; // Sunday closed

  selectedDate=iso;
  dateInput.value=iso;
  dateDisplay.value=fmtDisplay(iso);
  selectedInfo.classList.add('visible');
  selectedInfoText.textContent=fmtDisplay(iso);

  // remove old selection
  var all=calGrid.querySelectorAll('.cal-d');
  for(var a=0;a<all.length;a++)all[a].classList.remove('cd-sel');
  var sel=calGrid.querySelector('[data-d="'+iso+'"]');
  if(sel)sel.classList.add('cd-sel');

  renderTimeSlots(iso);
  updateSubmitState();
}

function renderTimeSlots(iso){
  var d=parseDate(iso);
  var limits=getDayStartEnd(d);
  timeSelect.innerHTML='';
  timeSelect.disabled=false;

  var bookedHours=BOOKED[iso]||[];

  for(var h=limits.start;h<limits.end;h++){
    var opt=document.createElement('option');
    var label=formatSlot(h);
    if(bookedHours.indexOf(h)!==-1){
      label+=' ✗';
      opt.disabled=true;
      opt.style.opacity='0.4';
    }
    opt.value=h;
    opt.textContent=label;
    timeSelect.appendChild(opt);
  }

  // If all booked, disable
  var available=timeSelect.querySelectorAll('option:not([disabled])');
  if(available.length===0){
    timeSelect.disabled=true;
    var o=document.createElement('option');
    o.value='';
    o.textContent='Svi termini su zauzeti';
    timeSelect.insertBefore(o,timeSelect.firstChild);
  }
}

function updateSubmitState(){
  var btn=document.getElementById('submit-btn');
  if(!btn)return;
  btn.disabled=!(selectedDate&&timeSelect.value&&document.getElementById('fullname').value.trim()&&document.getElementById('phone').value.trim());
}

// Calendar navigation
if(calPrev)calPrev.addEventListener('click',function(){
  calMonth--;
  if(calMonth<0){calMonth=11;calYear--;}
  selectedDate=null;
  renderCalendar();
});
if(calNext)calNext.addEventListener('click',function(){
  calMonth++;
  if(calMonth>11){calMonth=0;calYear++;}
  selectedDate=null;
  renderCalendar();
});

// Watch date display click to open native picker (optional)
if(dateDisplay){
  dateDisplay.addEventListener('focus',function(){this.blur();});
}

// --- Reservation form ---
var rf=document.getElementById('reserve-form');
if(rf){
  rf.addEventListener('submit',function(e){
    e.preventDefault();
    clearFM(rf);
    var fn=document.getElementById('fullname');
    var fp=document.getElementById('phone');
    var dVal=dateInput.value;
    var tVal=timeSelect.value;
    if(!fn.value.trim()){errF(fn,rf,'Unesite ime i prezime.');return;}
    if(!fp.value.trim()||!isValidPhone(fp.value)){errF(fp,rf,'Unesite ispravan broj telefona.');return;}
    if(!dVal){showFM(rf,'Izaberite datum u kalendaru.');return;}
    if(!tVal||timeSelect.disabled){showFM(rf,'Izaberite slobodan termin.');return;}

    var btn=rf.querySelector('button');
    var oh=btn.innerHTML;
    btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Šaljem...';btn.disabled=true;
    setTimeout(function(){
      // Show summary
      btn.innerHTML=oh;btn.disabled=false;
      document.querySelector('.reservation-page').style.display='none';
      document.querySelector('.cta-section').style.display='none';

      document.getElementById('sum-date').textContent=fmtDisplay(dVal);
      var hVal=parseInt(tVal);
      var ampm=hVal<12?'Prepodne':'Popodne';
      document.getElementById('sum-time').textContent=formatSlot(hVal);
      document.getElementById('sum-players').textContent=document.getElementById('players').selectedOptions[0].text;
      document.getElementById('sum-name').textContent=fn.value.trim();

      document.getElementById('res-summary').classList.add('visible');
      document.getElementById('res-summary').scrollIntoView({behavior:'smooth',block:'start'});

      rf.reset();
      selectedDate=null;
      dateDisplay.value='';
      timeSelect.innerHTML='<option value="">-- Prvo izaberite datum --</option>';
      timeSelect.disabled=true;
      selectedInfo.classList.remove('visible');
      renderCalendar();
      updateSubmitState();
    },1400);
  });

  // Field watchers for submit enable
  var flds=['fullname','phone','date-input','time-select'];
  for(var f=0;f<flds.length;f++){
    var el=document.getElementById(flds[f]);
    if(el)el.addEventListener('change',updateSubmitState);
    if(el)el.addEventListener('input',updateSubmitState);
  }
}

// close summary
var csb=document.getElementById('close-summary');
if(csb)csb.addEventListener('click',function(){
  document.getElementById('res-summary').classList.remove('visible');
  document.querySelector('.reservation-page').style.display='block';
  document.querySelector('.cta-section').style.display='block';
  document.getElementById('res-summary').scrollIntoView({behavior:'smooth',block:'start'});
});

})(); // end reservation system

// ========================= FORM HELPERS =========================
window.clearFM=function(f){if(!f)return;var ms=f.querySelectorAll('.fm');for(var i=0;i<ms.length;i++)ms[i].parentNode.removeChild(ms[i]);};
window.showFM=function(f,m){clearFM(f);var d=document.createElement('div');d.className='fm suc';d.innerHTML=m;f.appendChild(d);};
window.errFM=function(f,m){clearFM(f);var d=document.createElement('div');d.className='fm err';d.innerHTML=m;f.insertBefore(d,f.firstChild);shakeEl(f);};
window.errF=function(inp,f,m){inp.style.borderColor='#D4382B';inp.style.boxShadow='0 0 0 3px rgba(212,56,43,0.15)';setTimeout(function(){inp.style.borderColor='';inp.style.boxShadow='';},2200);errFM(f,m);};

function shakeEl(el){if(!el)return;el.style.animation='shk .4s ease';setTimeout(function(){el.style.animation='';},400);}

// Add keyframes if missing
if(!document.getElementById('kf')){var s=document.createElement('style');s.id='kf';s.textContent='@keyframes shk{0%,100%{transform:translateX(0)}10%,50%,90%{transform:translateX(-4px)}30%,70%{transform:translateX(4px)}}';document.head.appendChild(s);}

// ========================= COPYRIGHT =========================
var cye=document.querySelectorAll('#cy,#copyright-year');
for(var y=0;y<cye.length;y++)cye[y].textContent=new Date().getFullYear();

// ========================= GALLERY FILTERS =========================
var galFilters=document.querySelectorAll('.gal-filter');
if(galFilters.length>0){
  var pieces=document.querySelectorAll('.gallery-piece');
  for(var g=0;g<galFilters.length;g++){
    galFilters[g].addEventListener('click',function(){
      var f=this.getAttribute('data-filter');
      // update active
      for(var gf=0;gf<galFilters.length;gf++)galFilters[gf].classList.remove('active');
      this.classList.add('active');
      // filter pieces
      for(var p=0;p<pieces.length;p++){
        var cat=pieces[p].getAttribute('data-category')||'';
        if(f==='all'){
          pieces[p].classList.remove('hidden');
          pieces[p].classList.add('filtered-in');
        }else{
          if(cat.split(' ').indexOf(f)!==-1){
            pieces[p].classList.remove('hidden');
            pieces[p].classList.add('filtered-in');
          }else{
            pieces[p].classList.add('hidden');
            pieces[p].classList.remove('filtered-in');
          }
        }
      }
    });
  }
}

// ========================= GALLERY MODAL =========================
window.showImageInfo=function(title,desc){
  var ex=document.getElementById('gm-over');
  if(ex)ex.parentNode.removeChild(ex);
  var ov=document.createElement('div');
  ov.id='gm-over';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;animation:gmFi .25s ease;';
  ov.innerHTML='<div style="background:var(--surface);border-radius:20px;padding:36px 40px;max-width:420px;width:90%;text-align:center;border:2px solid var(--accent);position:relative;">'+
    '<button onclick="this.closest(\'#gm-over\').remove()" style="position:absolute;top:10px;right:14px;background:none;border:none;color:#fff;font-size:26px;cursor:pointer;">&times;</button>'+
    '<div style="font-size:2.6rem;margin-bottom:14px;color:var(--accent);"><i class="fas fa-camera"></i></div>'+
    '<h3 style="color:var(--white);font-size:1.2rem;margin-bottom:8px;">'+title+'</h3>'+
    '<p style="color:rgba(255,255,255,0.7);line-height:1.55;font-size:0.92rem;">'+desc+'</p>'+
    '<button onclick="this.closest(\'#gm-over\').remove()" style="margin-top:20px;background:var(--accent);color:var(--surface);border:none;padding:11px 32px;border-radius:50px;font-weight:700;cursor:pointer;font-size:0.95rem;">Zatvori</button>'+
  '</div>';
  document.body.appendChild(ov);
  setTimeout(function(){if(ov.parentNode)ov.parentNode.removeChild(ov);},10000);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.parentNode.removeChild(ov);});
  if(!document.getElementById('gmfk')){var s2=document.createElement('style');s2.id='gmfk';s2.textContent='@keyframes gmFi{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}';document.head.appendChild(s2);}
};

});})();