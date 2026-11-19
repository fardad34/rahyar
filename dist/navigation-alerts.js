'use strict';

const spokenDirections = {
  en: {locale:'en-CA', left:'Turn left', right:'Turn right', arrive:'You are approaching your destination', reached:'You have arrived', enabled:'Spoken alerts on'},
  fr: {locale:'fr-CA', left:'Tournez à gauche', right:'Tournez à droite', arrive:'Vous approchez de votre destination', reached:'Vous êtes arrivé', enabled:'Guidage vocal activé'},
  fa: {locale:'fa-IR', left:'به چپ بپیچید', right:'به راست بپیچید', arrive:'به مقصد نزدیک می‌شوید', reached:'به مقصد رسیدید', enabled:'راهنمای صوتی روشن است'},
  hi: {locale:'hi-IN', left:'बाएँ मुड़ें', right:'दाएँ मुड़ें', arrive:'आप अपने गंतव्य के पास हैं', reached:'आप अपने गंतव्य पर पहुँच गए हैं', enabled:'आवाज़ वाले निर्देश चालू हैं'},
  es: {locale:'es-US', left:'Gire a la izquierda', right:'Gire a la derecha', arrive:'Se acerca a su destino', reached:'Ha llegado a su destino', enabled:'Indicaciones por voz activadas'},
  de: {locale:'de-DE', left:'Biegen Sie links ab', right:'Biegen Sie rechts ab', arrive:'Sie nähern sich Ihrem Ziel', reached:'Sie haben Ihr Ziel erreicht', enabled:'Sprachansagen eingeschaltet'},
};
let alertLanguage = 'en';
let spokenAlerts = false;
let navigationAudio = null;
let voiceActivated = false;
const spokenManeuvers = new Set();
let arrivalFixes = 0;
let lastArrivalFix = null;
let tripEndState = '';

function unlockNavigationAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    navigationAudio ||= new Audio();
    if (navigationAudio.state === 'suspended') navigationAudio.resume().catch(()=>{});
  } catch {}
}

function announceSpeedStage(stage) {
  speedAlertBeep(4 - stage/100);
}

function speedAlertBeep(count) {
  if (navigationAudio?.state !== 'running') return;
  const now = navigationAudio.currentTime;
  for (let index = 0; index < count; index++) {
    const tone = navigationAudio.createOscillator();
    const gain = navigationAudio.createGain();
    const start = now + index * .22;
    tone.frequency.value = 720;
    gain.gain.setValueAtTime(.13, start);
    gain.gain.exponentialRampToValueAtTime(.001, start + .14);
    tone.connect(gain).connect(navigationAudio.destination);
    tone.start(start);
    tone.stop(start + .15);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); };
  }
}

let navigationVoiceName='';
let navigationVoiceVolume=1;
let navigationSpeechRevision=0;
let navigationRadioOriginalVolume=null;
function speakNavigationText(text,force=false) {
  if ((!spokenAlerts&&!force) || !window.speechSynthesis || !window.SpeechSynthesisUtterance || !text) return false;
  const locale=spokenDirections[alertLanguage].locale;
  const voices=window.speechSynthesis.getVoices();
  const chosen=voices.find(v=>v.name===navigationVoiceName&&v.lang.startsWith(alertLanguage)) || voices.find(v=>v.lang===locale) || voices.find(v=>v.lang.startsWith(alertLanguage));
  if(!chosen){$('voice-status').textContent='No installed '+locale+' voice is available. Choose another language or install a device voice. This language has not been verified on this device.';return false;}
  voiceActivated=true;
  const revision=++navigationSpeechRevision;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.voice=chosen;utterance.lang=chosen.lang;utterance.volume=navigationVoiceVolume;
  const radio=$('road-audio');
  if(radio&&!radio.paused&&navigationRadioOriginalVolume===null)navigationRadioOriginalVolume=radio.volume;
  const volume=navigationRadioOriginalVolume;
  if(radio&&!radio.paused&&Number.isFinite(volume))try{radio.volume=Math.min(volume,.25);}catch{}
  const restore=()=>{if(revision===navigationSpeechRevision){if(radio&&Number.isFinite(volume))try{radio.volume=volume;}catch{}navigationRadioOriginalVolume=null;}};
  const watchdog=setTimeout(restore,20000);
  utterance.onend=()=>{clearTimeout(watchdog);restore();$('voice-status').textContent='Speech completed using '+chosen.name+'. Confirm audibility on your device.';};
  utterance.onerror=event=>{clearTimeout(watchdog);restore();if(!['canceled','interrupted'].includes(event.error))$('voice-status').textContent='Speech failed. Tap Test Voice, check installed voices and Safari sound settings.';};
  window.speechSynthesis.speak(utterance);
  return true;
}
function speakNavigation(direction) {return speakNavigationText(spokenDirections[alertLanguage]?.[direction]);}
function spokenManeuverText(next) {
  if(!next)return '';
  const details=next.speech;
  if(!details)return next.direction?spokenDirections[alertLanguage][next.direction]:'';
  const words={
   en:{exit:'Take exit',keep:'Keep',continue:'Continue',roundabout:'At the roundabout take exit'},
   fr:{exit:'Prenez la sortie',keep:'Restez',continue:'Continuez',roundabout:'Au rond-point prenez la sortie'},
   fa:{exit:'از خروجی خارج شوید',keep:'در مسیر بمانید',continue:'ادامه دهید',roundabout:'در میدان از خروجی خارج شوید'},
   hi:{exit:'निकास लें',keep:'इस दिशा में रहें',continue:'आगे बढ़ें',roundabout:'गोल चक्कर पर निकास लें'},
   es:{exit:'Tome la salida',keep:'Manténgase',continue:'Continúe',roundabout:'En la rotonda tome la salida'},
   de:{exit:'Nehmen Sie die Ausfahrt',keep:'Halten Sie sich',continue:'Fahren Sie weiter',roundabout:'Im Kreisverkehr nehmen Sie die Ausfahrt'}
  }[alertLanguage];
  if(details.type==='arrive')return spokenDirections[alertLanguage].arrive;
  if(details.exit)return words.exit+' '+details.exit+' '+(details.road||'');
  if(details.roundaboutExit)return words.roundabout+' '+details.roundaboutExit+' '+(details.road||'');
  if(alertLanguage==='en')return next.instruction;
  return (next.direction?spokenDirections[alertLanguage][next.direction]:words.continue)+' '+(details.road||'');
}

function initNavigationAlerts() {
  try {
    const stored = localStorage.getItem('rahyar.voiceLanguage');
    if (Object.hasOwn(spokenDirections,stored)) alertLanguage = stored;
    spokenAlerts = localStorage.getItem('rahyar.voiceEnabled') === 'true';
  } catch {}
  try {navigationVoiceName=localStorage.getItem('rahyar.voiceName')||'';navigationVoiceVolume=Number(localStorage.getItem('rahyar.voiceVolume')??1);}catch{}
  const picker = $('voice-language');
  picker.value = alertLanguage;
  picker.onchange = () => {
    alertLanguage = picker.value;
    try { localStorage.setItem('rahyar.voiceLanguage',alertLanguage); } catch {}
    $('voice-status').textContent = '';
    refreshVoiceList();
  };
  const buttons = [...document.querySelectorAll('[data-voice-toggle]')];
  const update = () => {
    for (const button of buttons) {
      button.setAttribute('aria-pressed',String(spokenAlerts));
      button.setAttribute('aria-label',spokenAlerts ? 'Mute spoken alerts' : 'Enable spoken alerts');
      button.title = button.getAttribute('aria-label');
      button.textContent = spokenAlerts ? 'Voice on' : 'Voice off';
    }
  };
  for (const button of buttons) button.onclick = () => {
    spokenAlerts = !spokenAlerts;
    if (spokenAlerts) speakNavigation('enabled');
    else window.speechSynthesis?.cancel();
    try { localStorage.setItem('rahyar.voiceEnabled',String(spokenAlerts)); } catch {}
    update();
  };
  update();
  const voices=$('voice-choice'),volume=$('voice-volume');
  function refreshVoiceList(){
    if(!voices)return;
    const available=window.speechSynthesis?.getVoices().filter(v=>v.lang.startsWith(alertLanguage))||[];
    voices.replaceChildren(...available.map(v=>new Option(v.name+' · '+v.lang,v.name)));
    voices.disabled=!available.length;
    if(available.some(v=>v.name===navigationVoiceName))voices.value=navigationVoiceName;
    $('voice-status').textContent=available.length?'Voice installed. Use Test Voice to check audibility.':'No matching device voice found; this language is unavailable on this device.';
  }
  if(voices)voices.onchange=()=>{navigationVoiceName=voices.value;try{localStorage.setItem('rahyar.voiceName',navigationVoiceName);}catch{}};
  if(volume){volume.value=navigationVoiceVolume;volume.oninput=()=>{navigationVoiceVolume=Number(volume.value);try{localStorage.setItem('rahyar.voiceVolume',String(navigationVoiceVolume));}catch{}};}
  if($('test-voice'))$('test-voice').onclick=()=>{unlockNavigationAudio();window.speechSynthesis?.resume();speakNavigationText(spokenDirections[alertLanguage].enabled,true);};
  window.speechSynthesis?.addEventListener('voiceschanged',refreshVoiceList);refreshVoiceList();
  document.addEventListener('click', () => {
    if (watch !== null && navigationAudio?.state !== 'running') unlockNavigationAudio();
  });
}

function navigationCue(next, remaining) {
  if (next && remaining <= 250) return next.direction || 'maneuver';
  if (routeLength - progress <= 300) return 'arrive';
  return '';
}

function announceNavigationCue(cue, next, remaining) {
  if (!spokenAlerts || !cue || !Number.isFinite(lastAccuracyMeters) || lastAccuracyMeters > 35) return;
  const threshold = cue === 'arrive' ? 180 : 150;
  if ((cue === 'arrive' ? routeLength-progress : remaining) > threshold) return;
  const key = cue === 'arrive' ? 'arrive' : cue+':'+Math.round(next.at/20);
  if (spokenManeuvers.has(key)) return;
  const spoken=cue==='arrive'?speakNavigation(cue):speakNavigationText(spokenManeuverText(next));
  if(spoken)spokenManeuvers.add(key);
}

function confirmTripArrival(location, timestamp) {
  const distanceToEnd = routeLength - progress;
  const nearDestination = Date.now()-timestamp <= 10000 && lastAccuracyMeters <= 30 &&
    Number.isFinite(lastAccuracyMeters) && !routeBusy && dest && distanceToEnd <= 45 &&
    hav(location,coords.at(-1)) <= 40 && hav(location,dest.coord) <= 85 &&
    (!Number.isFinite(lastSpeedMps) || lastSpeedMps <= 6);
  if (!nearDestination) {
    arrivalFixes = 0;
    lastArrivalFix = null;
  } else if (lastArrivalFix !== timestamp) {
    arrivalFixes++;
    lastArrivalFix = timestamp;
  }
  return arrivalFixes >= 2;
}

function followingZoom() {
  if (watch === null || !coords.length || guidanceOffRoute) return null;
  if (routeLength - progress <= 550) return 18;
  if (!Number.isFinite(lastSpeedMps)) return null;
  if (lastSpeedMps >= 24) return 14.8;
  if (lastSpeedMps >= 15) return 16;
  return 17;
}

function mappedSpeedAnnouncement(limit,unit,distance,language=alertLanguage) {
  const templates={
    en:`Mapped speed limit ${limit} ${unit}, ${distance} ahead. Follow posted signs.`,
    fr:`Limite cartographiée ${limit} ${unit}, dans ${distance}. Respectez les panneaux.`,
    fa:`حد سرعت ثبت‌شده ${limit} ${unit} در ${distance} جلوتر. از تابلوهای جاده پیروی کنید.`,
    hi:`मानचित्र की गति सीमा ${limit} ${unit}, ${distance} आगे। सड़क के संकेतों का पालन करें।`,
    es:`Límite cartografiado ${limit} ${unit}, a ${distance}. Siga las señales.`,
    de:`Kartierte Geschwindigkeitsbegrenzung ${limit} ${unit}, in ${distance}. Beachten Sie die Schilder.`
  };
  return templates[language]||templates.en;
}
