'use strict';
(() => {
 const words={
  en:['Plan your trip','Destination','Search','＋ Report','Close','Police','Road Closed','Construction','Weigh Station','Unknown','Open','Closed'],
  fr:['Planifiez votre trajet','Destination','Rechercher','＋ Signaler','Fermer','Police','Route fermée','Travaux','Poste de pesée','Inconnu','Ouvert','Fermé'],
  fa:['برنامه‌ریزی سفر','مقصد','جست‌وجو','＋ گزارش','بستن','پلیس','جاده بسته','عملیات راه‌سازی','ایستگاه بازرسی و توزین','نامشخص','باز','بسته'],
  hi:['यात्रा की योजना','गंतव्य','खोजें','＋ रिपोर्ट','बंद करें','पुलिस','सड़क बंद','निर्माण','वजन जाँच स्टेशन','अज्ञात','खुला','बंद'],
  es:['Planifique su viaje','Destino','Buscar','＋ Informar','Cerrar','Policía','Carretera cerrada','Obras','Estación de pesaje','Desconocido','Abierta','Cerrada'],
  de:['Reise planen','Ziel','Suchen','＋ Melden','Schließen','Polizei','Straße gesperrt','Baustelle','Wiegestation','Unbekannt','Offen','Geschlossen']
 };
 const label=document.createElement('label');label.className='theme-setting';label.innerHTML='Interface language <select id="interface-language"><option value="en">English</option><option value="fr">Français</option><option value="fa">فارسی</option><option value="hi">हिन्दी</option><option value="es">Español</option><option value="de">Deutsch</option></select><small>Core planner/report controls are translated. Some detailed settings and status messages remain in English.</small>';$('app-theme').closest('label').before(label);
 let language='en';try{language=localStorage.getItem('rahyar.uiLanguage')||'en';}catch{}if(!words[language])language='en';
 function apply(){
  const text=words[language];document.documentElement.lang=language;document.documentElement.dir=language==='fa'?'rtl':'ltr';
  for(const [index,id]of ['planner-title','place-search-label','search','report-open','report-close'].entries()){if($(id)){if(id==='report-open'&&window.RahyarIcon){$(id).innerHTML=window.RahyarIcon('report');$(id).setAttribute('aria-label',text[index]);}else $(id).textContent=text[index];}}
  for(const [index,kind]of ['police','closed','construction','weigh'].entries())document.querySelectorAll('[data-report="'+kind+'"]').forEach(b=>{b.setAttribute('aria-label',text[index+5]);b.title=text[index+5];if(window.RahyarIcon)b.innerHTML=window.RahyarIcon(kind);else b.textContent=text[index+5];});
 }
 window.rahyarTranslateStatus=status=>words[language][status==='open'?10:status==='closed'?11:9];
 $('interface-language').value=language;$('interface-language').onchange=()=>{language=$('interface-language').value;try{localStorage.setItem('rahyar.uiLanguage',language);}catch{}apply();};apply();
})();
