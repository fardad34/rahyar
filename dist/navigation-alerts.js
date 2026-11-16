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

function speakNavigation(direction) {
  const voice = spokenDirections[alertLanguage];
  if (!spokenAlerts || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  voiceActivated = true;
  const utterance = new SpeechSynthesisUtterance(voice[direction]);
  utterance.lang = voice.locale;
  utterance.onerror = event => {
    if (!['canceled','interrupted'].includes(event.error)) $('voice-status').textContent = 'Speech unavailable. Check your device voices and sound settings.';
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function initNavigationAlerts() {
  try {
    const stored = localStorage.getItem('rahyar.voiceLanguage');
    if (Object.hasOwn(spokenDirections,stored)) alertLanguage = stored;
    spokenAlerts = localStorage.getItem('rahyar.voiceEnabled') === 'true';
  } catch {}
  const picker = $('voice-language');
  picker.value = alertLanguage;
  picker.onchange = () => {
    alertLanguage = picker.value;
    try { localStorage.setItem('rahyar.voiceLanguage',alertLanguage); } catch {}
    $('voice-status').textContent = '';
  };
  const buttons = [...document.querySelectorAll('[data-voice-toggle]')];
  const update = () => {
    for (const button of buttons) {
      button.setAttribute('aria-pressed',String(spokenAlerts));
      button.setAttribute('aria-label',spokenAlerts ? 'Mute spoken alerts' : 'Enable spoken alerts');
      button.title = button.getAttribute('aria-label');
      button.textContent = spokenAlerts ? '🔊' : '🔇';
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
  document.addEventListener('click', () => {
    if (watch !== null && navigationAudio?.state !== 'running') unlockNavigationAudio();
  });
}

function navigationCue(next, remaining) {
  if (next?.direction && remaining <= 250) return next.direction;
  if (routeLength - progress <= 300) return 'arrive';
  return '';
}

function announceNavigationCue(cue, next, remaining) {
  if (!spokenAlerts || !cue || !Number.isFinite(lastAccuracyMeters) || lastAccuracyMeters > 35) return;
  const threshold = cue === 'arrive' ? 180 : 150;
  if ((cue === 'arrive' ? routeLength-progress : remaining) > threshold) return;
  const key = cue === 'arrive' ? 'arrive' : cue+':'+Math.round(next.at/20);
  if (spokenManeuvers.has(key)) return;
  spokenManeuvers.add(key);
  speakNavigation(cue);
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
