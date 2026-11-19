'use strict';

const siteNoticeText = {
  en: {
    title: 'Before using Rahyar', language: 'Language', intro: 'Review how Rahyar uses your data and what its route information can tell you.',
    headings: ['Privacy', 'Terms of use', 'How to read the dashboard'],
    agree: 'I have read the privacy notice and agree to the terms of use.', confirm: 'Agree and continue', decline: 'Decline', close: 'Close', reset: 'Withdraw and leave Rahyar', review: 'Review again', declined: 'You declined. Rahyar is closed until you agree.',
    sections: [
      [
        'You choose whether to allow location access in your browser. Live routing sends GPS, destination and waypoints, and your truck profile to Valhalla. Road-speed lookup sends route coordinates to Valhalla. Address searches send your query to Esri / ArcGIS or Photon. Photon and Overpass use the route area to look up mapped places and facilities. Open-Meteo receives coordinates of places for forecasts. These requests can reveal parts of your trip.',
        'Map and satellite providers receive requests for the area you view. Hosting, map, search, forecast and audio providers may receive network information such as your IP address. If you play a stream or open an external link, that provider handles the request under its own privacy rules.',
        'Rahyar stores your acceptance, last destination, truck profile, settings, and locally saved reports or ratings in your browser. This acceptance is saved on this browser only. You can clear this data in browser settings. To stop live sharing, pause the trip or revoke the browser’s location permission. Withdraw from this notice to close Rahyar and remove the saved acceptance.'
      ], [
        'Set up and operate the app only while safely stopped. Enter your actual loaded truck dimensions and weight. Follow posted signs, official closures and restrictions, and applicable commercial driving and hours-of-service rules. You are responsible for checking whether a route is legal and suitable for your vehicle, trailer and load.',
        'Rahyar uses the truck profile and mapped restrictions, including recorded height and weight limits. Restrictions can be missing, outdated or temporary. Routes, speed limits, forecasts and facility data are estimates or references and are not guaranteed to be accurate, complete or available. Verify road conditions and access with official sources. Nothing here limits rights or remedies that cannot lawfully be limited.'
      ], [
        'Arrival estimates use calculated driving times and exclude traffic, stops and hours-of-service limits. Weather is the Open-Meteo hourly forecast closest to estimated arrival. Temperature units follow your current country. Times use each city’s time zone when known.',
        'City distances are to the point alongside the city on the calculated route, using mapped boundaries or nearby centers. Boundary distances are approximate and use simplified administrative boundaries. The route list shows identified cities and facilities within the mapped search area, which uses a 2.5 km corridor for facilities.',
        'Facility sources include Pilot / Flying J, BVD, Esso Commercial Cardlocks (Oct 2026), mapped Petro-Pass locations, Ontario 511, BC CVSE, Alberta Sheriff Highway Patrol and US FHWA/BTS (2019). Coverage is partial. Facility distances are measured along the route near the site. Detours, road side, access, opening status, parking and fuel-card acceptance are unverified. Weigh and inspection sites are fixed facilities. Their current operation is unknown.'
      ]
    ]
  },
  fr: {
    title: 'Avant d’utiliser Rahyar', language: 'Langue', intro: 'Consultez l’utilisation de vos données et les limites des informations sur votre trajet.',
    headings: ['Confidentialité', 'Conditions d’utilisation', 'Comment lire le tableau de bord'],
    agree: 'J’ai lu l’avis de confidentialité et j’accepte les conditions d’utilisation.', confirm: 'Accepter et continuer', decline: 'Refuser', close: 'Fermer', reset: 'Retirer mon accord et quitter Rahyar', review: 'Relire', declined: 'Vous avez refusé. Pour utiliser Rahyar, vous devez accepter les conditions.',
    sections: [
      [
        'Vous choisissez si le navigateur peut accéder à votre position. Pour calculer un trajet en direct, Rahyar transmet le GPS, la destination, les étapes et le profil du camion à Valhalla. Les coordonnées du trajet sont aussi transmises à Valhalla pour consulter les limites de vitesse. Esri / ArcGIS ou Photon reçoit les recherches d’adresse. Photon et Overpass recherchent les lieux et installations dans la zone du trajet. Open-Meteo reçoit les coordonnées des lieux pour les prévisions. Ces requêtes peuvent révéler des portions de votre trajet.',
        'Les fournisseurs de cartes et d’images satellites reçoivent des requêtes portant sur la zone affichée. Les fournisseurs d’hébergement, de cartes, de recherche, de météo et d’audio peuvent recevoir des données réseau, dont votre adresse IP. Les services externes auxquels vous accédez par un lien ou un flux audio appliquent leurs propres règles de confidentialité.',
        'Rahyar conserve dans votre navigateur votre accord, la dernière destination, le profil du camion, les réglages et les signalements ou évaluations enregistrés localement. L’accord est enregistré uniquement dans ce navigateur. Vous pouvez effacer ces données dans les réglages du navigateur. Pour arrêter le partage en direct, mettez le trajet en pause ou révoquez l’accès à la position. Vous pouvez retirer votre accord ici pour quitter Rahyar.'
      ], [
        'Configurez et utilisez l’application uniquement à l’arrêt, en lieu sûr. Saisissez les dimensions réelles et le poids en charge de l’ensemble. Respectez la signalisation, les fermetures et restrictions officielles, ainsi que les règles de conduite commerciale et les heures de service. Vérifiez que le trajet convient légalement à votre véhicule, à votre remorque et à votre chargement.',
        'Rahyar utilise le profil du camion et les restrictions cartographiées, dont la hauteur et le poids. Des restrictions peuvent être absentes, périmées ou temporaires. Les trajets, limites de vitesse, prévisions et données sur les installations sont fournis à titre indicatif. Leur exactitude, exhaustivité et disponibilité ne sont pas garanties. Vérifiez l’état des routes et les accès auprès de sources officielles. Vos droits et recours auxquels la loi interdit de renoncer sont préservés.'
      ], [
        'Les estimations d’arrivée excluent la circulation, les arrêts et les limites d’heures de service. La météo repose sur la prévision horaire d’Open-Meteo la plus proche de l’heure d’arrivée estimée. L’unité de température dépend du pays où vous êtes. L’heure locale de chaque ville est affichée lorsque son fuseau est connu.',
        'La distance est mesurée le long du trajet jusqu’au point qui longe la ville, d’après les limites cartographiées ou le centre proche. Les distances aux frontières administratives sont approximatives. La liste affiche les villes et installations identifiées dans la zone de recherche. Le corridor pour les installations est de 2,5 km.',
        'Les sources comprennent Pilot / Flying J, BVD, Esso Commercial Cardlocks (oct. 2026), les sites Petro-Pass cartographiés, Ontario 511, BC CVSE, Alberta Sheriff Highway Patrol et FHWA/BTS des États-Unis (2019). La couverture est partielle. La distance est mesurée le long du trajet, à proximité du site. Les détours, le côté de la route, l’accès, les horaires, le stationnement et les cartes de carburant acceptées sont à vérifier. Les postes de pesée et de contrôle sont fixes. Leur état actuel est inconnu.'
      ]
    ]
  },
  fa: {
    title: 'پیش از استفاده از رهیار', language: 'زبان', intro: 'نحوهٔ استفاده از داده‌ها و محدودیت اطلاعات مسیر را بخوانید.',
    headings: ['حریم خصوصی', 'شرایط استفاده', 'راهنمای اطلاعات داشبورد'],
    agree: 'اطلاعیهٔ حریم خصوصی را خوانده‌ام و شرایط استفاده را می‌پذیرم.', confirm: 'پذیرش و ادامه', decline: 'رد کردن', close: 'بستن', reset: 'پس گرفتن پذیرش و خروج', review: 'بازخوانی', declined: 'شرایط را رد کردید. برای ورود به رهیار باید آن را بپذیرید.',
    sections: [
      [
        'شما دسترسی مرورگر به موقعیت را تعیین می‌کنید. برای مسیر زنده، رهیار مختصات GPS، مقصد و توقف‌های بین راه و مشخصات کامیون را به Valhalla می‌فرستد. مختصات مسیر برای بررسی محدودیت سرعت هم به Valhalla می‌رود. عبارت جستجوی نشانی به Esri / ArcGIS یا Photon فرستاده می‌شود. Photon و Overpass محدودهٔ مسیر را برای پیدا کردن شهرها و امکانات دریافت می‌کنند. Open-Meteo مختصات نقاط را برای پیش‌بینی هوا دریافت می‌کند. این درخواست‌ها می‌توانند بخش‌هایی از سفرتان را مشخص کنند.',
        'ارائه‌دهندگان نقشه و تصویر ماهواره‌ای درخواست‌های مربوط به محدودهٔ قابل مشاهده را دریافت می‌کنند. سرویس‌های میزبانی، نقشه، جستجو، هواشناسی و صدا ممکن است اطلاعات شبکه مانند IP را دریافت کنند. با پخش جریان صوتی یا باز کردن پیوند بیرونی، سرویس مربوط طبق سیاست خودش درخواست را پردازش می‌کند.',
        'تأیید شرایط، آخرین مقصد، مشخصات کامیون، تنظیمات و گزارش‌ها یا امتیازهای محلی در مرورگر ذخیره می‌شوند. پذیرش فقط در همین مرورگر ثبت می‌شود. این داده‌ها را می‌توانید از تنظیمات مرورگر پاک کنید. برای توقف ارسال زنده، سفر را متوقف کنید یا مجوز موقعیت را پس بگیرید. از همین صفحه می‌توانید پذیرش را پس بگیرید و از رهیار خارج شوید.'
      ], [
        'تنظیم و کار با برنامه را فقط در توقف ایمن انجام دهید. ابعاد واقعی و وزن کامیون و تریلیِ بارگیری‌شده را وارد کنید. تابلوها، مسدودی‌ها و محدودیت‌های رسمی و قوانین ساعات کار و رانندگی تجاری را رعایت کنید. بررسی مجاز و مناسب بودن مسیر برای کامیون، تریلی و بار بر عهدهٔ راننده است.',
        'رهیار در مسیریابی از مشخصات کامیون و محدودیت‌های ثبت‌شدهٔ نقشه، از جمله ارتفاع و وزن، استفاده می‌کند. بعضی محدودیت‌ها ممکن است ثبت نشده، قدیمی یا موقت باشند. دقت، کامل بودن و دسترسی همیشگی مسیر، سرعت مجاز، پیش‌بینی هوا و اطلاعات امکانات تضمین نمی‌شود. وضعیت راه و دسترسی را از منابع رسمی بررسی کنید. حقوق و راه‌های پیگیری که قانون اجازهٔ محدود کردنشان را نمی‌دهد محفوظ‌اند.'
      ], [
        'زمان رسیدن بر اساس زمان رانندگی محاسبه می‌شود و ترافیک، توقف و محدودیت ساعت کار را در نظر نمی‌گیرد. هوا نزدیک‌ترین پیش‌بینی ساعتی Open-Meteo به زمان رسیدن است. واحد دما تابع کشور فعلی است. اگر منطقهٔ زمانی شهر معلوم باشد، ساعت به وقت محلی نمایش داده می‌شود.',
        'فاصلهٔ شهر تا نقطهٔ کنار آن روی مسیر محاسبه می‌شود و بر پایهٔ مرز ثبت‌شده یا مرکز نزدیک شهر است. فاصله تا مرزهای اداری تقریبی است. فهرست، شهرها و امکانات شناسایی‌شده در محدودهٔ جستجو را نشان می‌دهد. برای امکانات، محدودهٔ جستجو ۲٫۵ کیلومتر از مسیر است.',
        'منابع شامل Pilot / Flying J، BVD، Esso Commercial Cardlocks (اکتبر ۲۰۲۶)، نقاط ثبت‌شدهٔ Petro-Pass، Ontario 511، BC CVSE، Alberta Sheriff Highway Patrol و FHWA/BTS آمریکا (۲۰۱۹) هستند. پوشش کامل نیست. فاصله تا نزدیکی محل روی مسیر محاسبه می‌شود. انحراف مسیر، سمت جاده، دسترسی، باز بودن، پارکینگ و پذیرش کارت سوخت تأیید نشده‌اند. ایستگاه‌های وزن‌کشی و بازرسی ثابت‌اند و وضعیت فعالیت فعلی آن‌ها معلوم نیست.'
      ]
    ]
  },
  hi: {
    title: 'Rahyar का उपयोग करने से पहले', language: 'भाषा', intro: 'जानें कि Rahyar आपके डेटा का उपयोग कैसे करता है और मार्ग की जानकारी की क्या सीमाएँ हैं।',
    headings: ['गोपनीयता', 'उपयोग की शर्तें', 'डैशबोर्ड की जानकारी'],
    agree: 'मैंने गोपनीयता सूचना पढ़ ली है और उपयोग की शर्तें स्वीकार करता/करती हूँ।', confirm: 'स्वीकार करें और आगे बढ़ें', decline: 'अस्वीकार करें', close: 'बंद करें', reset: 'स्वीकृति वापस लें और बाहर निकलें', review: 'फिर से पढ़ें', declined: 'आपने शर्तें अस्वीकार की हैं। Rahyar का उपयोग करने के लिए इन्हें स्वीकार करना होगा।',
    sections: [
      [
        'ब्राउज़र में स्थान की अनुमति देना आपके हाथ में है। लाइव मार्ग बनाने के लिए GPS, गंतव्य, बीच के पड़ाव और ट्रक प्रोफ़ाइल Valhalla को भेजे जाते हैं। गति सीमा देखने के लिए भी मार्ग के निर्देशांक Valhalla को भेजे जाते हैं। पता खोजने पर आपका प्रश्न Esri / ArcGIS या Photon को जाता है। Photon और Overpass मार्ग क्षेत्र में स्थान और सुविधाएँ खोजते हैं। मौसम के लिए स्थानों के निर्देशांक Open-Meteo को जाते हैं। इन अनुरोधों से यात्रा के कुछ हिस्सों का पता चल सकता है।',
        'मानचित्र और उपग्रह चित्र के प्रदाताओं को आपके देखे गए क्षेत्र के अनुरोध मिलते हैं। होस्टिंग, मानचित्र, खोज, मौसम और ऑडियो सेवाओं को IP पते जैसी नेटवर्क जानकारी मिल सकती है। बाहरी लिंक या ऑडियो स्ट्रीम खोलने पर उस सेवा के अपने गोपनीयता नियम लागू होते हैं।',
        'Rahyar आपकी स्वीकृति, अंतिम गंतव्य, ट्रक प्रोफ़ाइल, सेटिंग और स्थानीय रिपोर्ट या रेटिंग इसी ब्राउज़र में सहेजता है। ब्राउज़र सेटिंग से इन्हें मिटा सकते हैं। लाइव स्थान साझा करना रोकने के लिए यात्रा रोकें या स्थान की अनुमति हटाएँ। इस सूचना से स्वीकृति वापस लेकर Rahyar बंद कर सकते हैं।'
      ], [
        'ऐप की सेटिंग और संचालन तभी करें जब वाहन सुरक्षित रूप से रुका हो। लदे हुए ट्रक और ट्रेलर का वास्तविक आकार और वजन दर्ज करें। सड़क के संकेत, आधिकारिक बंदिशें, वाणिज्यिक वाहन नियम और सेवा-समय की सीमाएँ मानें। अपने वाहन, ट्रेलर और माल के लिए वैध और उपयुक्त मार्ग की जाँच आपकी ज़िम्मेदारी है।',
        'Rahyar ट्रक प्रोफ़ाइल और नक्शे में दर्ज ऊँचाई और वजन जैसी सीमाओं का उपयोग करता है। कुछ सीमाएँ दर्ज न हों, पुरानी हों या अस्थायी हों। मार्ग, गति सीमा, मौसम और सुविधाओं की जानकारी अनुमान या संदर्भ के लिए है। उसकी सटीकता, पूर्णता या उपलब्धता की गारंटी नहीं है। आधिकारिक स्रोतों से सड़क की स्थिति और प्रवेश की पुष्टि करें। कानून के तहत जिन अधिकारों या उपायों को सीमित नहीं किया जा सकता, वे सुरक्षित हैं।'
      ], [
        'आगमन का अनुमान गणना किए गए ड्राइविंग समय पर है। इसमें ट्रैफ़िक, रुकना और सेवा-समय की सीमा शामिल नहीं हैं। मौसम अनुमानित आगमन के सबसे पास का Open-Meteo का प्रति घंटे का पूर्वानुमान है। तापमान की इकाई मौजूदा देश पर निर्भर है। ज्ञात होने पर समय शहर के अपने समय क्षेत्र में दिखता है।',
        'शहर की दूरी मार्ग पर उसके पास के बिंदु तक है, जिसे नक्शे की सीमा या पास के नगर केंद्र से तय किया जाता है। सरल प्रशासनिक सीमाओं के कारण सीमा की दूरी अनुमानित है। सूची में खोज क्षेत्र में पहचाने गए शहर और सुविधाएँ हैं। सुविधाओं का खोज क्षेत्र मार्ग से 2.5 किमी तक है।',
        'स्रोतों में Pilot / Flying J, BVD, Esso Commercial Cardlocks (अक्टूबर 2026), नक्शे पर दर्ज Petro-Pass, Ontario 511, BC CVSE, Alberta Sheriff Highway Patrol और US FHWA/BTS (2019) शामिल हैं। कवरेज आंशिक है। सुविधा की दूरी मार्ग पर उसके पास तक है। चक्कर, सड़क का किनारा, प्रवेश, खुले होने की स्थिति, पार्किंग और ईंधन कार्ड की स्वीकृति सत्यापित नहीं हैं। तौल और निरीक्षण केंद्र स्थायी हैं। उनकी वर्तमान स्थिति अज्ञात है।'
      ]
    ]
  },
  es: {
    title: 'Antes de usar Rahyar', language: 'Idioma', intro: 'Revisa cómo usa Rahyar tus datos y cuáles son los límites de la información de ruta.',
    headings: ['Privacidad', 'Condiciones de uso', 'Cómo leer el panel'],
    agree: 'He leído el aviso de privacidad y acepto las condiciones de uso.', confirm: 'Aceptar y continuar', decline: 'Rechazar', close: 'Cerrar', reset: 'Retirar mi aceptación y salir', review: 'Volver a leer', declined: 'Has rechazado las condiciones. Debes aceptarlas para usar Rahyar.',
    sections: [
      [
        'Tú decides si el navegador puede acceder a tu ubicación. Para calcular rutas en directo, Rahyar envía a Valhalla tu GPS, destino, paradas intermedias y perfil del camión. También envía a Valhalla las coordenadas de la ruta para consultar los límites de velocidad. Las búsquedas de direcciones van a Esri / ArcGIS o Photon. Photon y Overpass buscan lugares e instalaciones en la zona de la ruta. Open-Meteo recibe coordenadas de lugares para el pronóstico. Estas solicitudes pueden revelar partes de tu viaje.',
        'Los proveedores de mapas e imágenes satelitales reciben solicitudes sobre la zona visible. Los servicios de alojamiento, mapas, búsqueda, pronóstico y audio pueden recibir datos de red, como tu dirección IP. Los servicios externos que abras mediante un enlace o una transmisión aplican sus propias reglas de privacidad.',
        'Rahyar guarda en este navegador tu aceptación, el último destino, el perfil del camión, la configuración y los informes o valoraciones locales. Puedes borrar estos datos en la configuración del navegador. Para detener el envío de tu ubicación en directo, pausa el viaje o revoca el permiso de ubicación. Puedes retirar tu aceptación desde este aviso y salir de Rahyar.'
      ], [
        'Configura y usa la aplicación solo cuando estés detenido en un lugar seguro. Introduce las dimensiones y el peso reales del conjunto cargado. Respeta las señales, los cierres y restricciones oficiales y las normas comerciales de conducción y horas de servicio. Debes comprobar que la ruta sea legal y adecuada para el vehículo, el remolque y la carga.',
        'Rahyar usa el perfil del camión y las restricciones registradas en el mapa, incluidas las de altura y peso. Algunas restricciones pueden faltar, estar desactualizadas o ser temporales. Las rutas, límites de velocidad, pronósticos y datos de instalaciones son orientativos. No se garantiza su exactitud, integridad ni disponibilidad. Verifica el estado de la vía y el acceso con fuentes oficiales. Se mantienen los derechos y recursos que la ley no permite limitar.'
      ], [
        'La hora estimada usa el tiempo de conducción calculado y excluye el tráfico, las paradas y los límites de horas de servicio. El tiempo corresponde al pronóstico horario de Open-Meteo más cercano a la llegada prevista. La unidad de temperatura depende del país actual. Cuando se conoce, se usa la zona horaria de cada ciudad.',
        'Las distancias a ciudades se miden hasta el punto de la ruta junto a cada ciudad, según sus límites cartográficos o un centro urbano cercano. Las distancias a límites administrativos son aproximadas. La lista muestra ciudades e instalaciones identificadas en la zona de búsqueda. Para instalaciones, el corredor de búsqueda es de 2,5 km desde la ruta.',
        'Las fuentes incluyen Pilot / Flying J, BVD, Esso Commercial Cardlocks (oct. de 2026), los sitios Petro-Pass cartografiados, Ontario 511, BC CVSE, Alberta Sheriff Highway Patrol y FHWA/BTS de EE. UU. (2019). La cobertura es parcial. Las distancias a instalaciones se miden a lo largo de la ruta hasta un punto cercano. No se verifican desvíos, lado de la vía, acceso, apertura, estacionamiento ni aceptación de tarjetas de combustible. Los puestos de pesaje e inspección son fijos. Se desconoce si están operativos.'
      ]
    ]
  },
  de: {
    title: 'Vor der Nutzung von Rahyar', language: 'Sprache', intro: 'Lies, wie Rahyar deine Daten nutzt und welche Grenzen die Routeninformationen haben.',
    headings: ['Datenschutz', 'Nutzungsbedingungen', 'Hinweise zum Dashboard'],
    agree: 'Ich habe den Datenschutzhinweis gelesen und stimme den Nutzungsbedingungen zu.', confirm: 'Zustimmen und fortfahren', decline: 'Ablehnen', close: 'Schließen', reset: 'Zustimmung zurückziehen und Rahyar verlassen', review: 'Erneut lesen', declined: 'Du hast abgelehnt. Um Rahyar zu nutzen, musst du den Bedingungen zustimmen.',
    sections: [
      [
        'Du entscheidest, ob dein Browser auf deinen Standort zugreifen darf. Für die Live-Routenplanung sendet Rahyar GPS-Daten, Ziel, Zwischenstopps und Lkw-Profil an Valhalla. Auch zur Abfrage von Tempolimits gehen Routenkoordinaten an Valhalla. Adresssuchen gehen an Esri / ArcGIS oder Photon. Photon und Overpass suchen Orte und Einrichtungen im Routenbereich. Open-Meteo erhält Ortskoordinaten für die Wettervorhersage. Diese Anfragen können Teile deiner Fahrt offenlegen.',
        'Karten- und Satellitenbildanbieter erhalten Anfragen für den angezeigten Bereich. Hosting-, Karten-, Such-, Wetter- und Audioanbieter können Netzwerkdaten wie deine IP-Adresse erhalten. Bei externen Links oder Audiostreams gelten die Datenschutzregeln des jeweiligen Anbieters.',
        'Rahyar speichert deine Zustimmung, das letzte Ziel, das Lkw-Profil, Einstellungen und lokal gespeicherte Meldungen oder Bewertungen in diesem Browser. Du kannst diese Daten in den Browsereinstellungen löschen. Um die Live-Übermittlung zu beenden, pausiere die Fahrt oder entziehe die Standortfreigabe. Über diesen Hinweis kannst du deine Zustimmung zurückziehen und Rahyar verlassen.'
      ], [
        'Richte die App nur bei sicher abgestelltem Fahrzeug ein und bediene sie nur dann. Gib die tatsächlichen Maße und das Gewicht des beladenen Gespanns ein. Halte dich an Verkehrszeichen, offizielle Sperrungen und Beschränkungen sowie Vorschriften für gewerbliche Fahrten und Lenkzeiten. Prüfe, ob die Route für Fahrzeug, Anhänger und Ladung zulässig und geeignet ist.',
        'Rahyar nutzt das Lkw-Profil und kartierte Beschränkungen, darunter erfasste Höhen- und Gewichtsbeschränkungen. Angaben können fehlen, veraltet oder vorübergehend sein. Routen, Tempolimits, Wetter und Angaben zu Einrichtungen dienen der Orientierung. Ihre Genauigkeit, Vollständigkeit und Verfügbarkeit werden nicht garantiert. Prüfe Straßenzustand und Zufahrt bei offiziellen Stellen. Gesetzlich nicht einschränkbare Rechte und Ansprüche bleiben unberührt.'
      ], [
        'Die Ankunftszeit beruht auf der berechneten Fahrzeit. Verkehr, Pausen und Lenkzeitgrenzen bleiben unberücksichtigt. Das Wetter stammt aus der stündlichen Open-Meteo-Prognose, die der geschätzten Ankunft am nächsten liegt. Die Temperatureinheit richtet sich nach dem aktuellen Land. Wenn bekannt, wird die Ortszeit der jeweiligen Stadt angezeigt.',
        'Die Entfernung zur Stadt gilt bis zum nächstgelegenen Punkt an der berechneten Route anhand kartierter Stadtgrenzen oder nahegelegener Stadtzentren. Entfernungen zu Verwaltungsgrenzen sind Näherungswerte. Die Liste zeigt erkannte Städte und Einrichtungen im Suchbereich. Für Einrichtungen beträgt der Suchkorridor 2,5 km ab der Route.',
        'Zu den Quellen zählen Pilot / Flying J, BVD, Esso Commercial Cardlocks (Okt. 2026), kartierte Petro-Pass-Standorte, Ontario 511, BC CVSE, Alberta Sheriff Highway Patrol und US FHWA/BTS (2019). Die Abdeckung ist unvollständig. Entfernungen zu Einrichtungen werden entlang der Route bis in deren Nähe gemessen. Umwege, Straßenseite, Zufahrt, Öffnungsstatus, Parkplätze und Tankkartenakzeptanz sind nicht geprüft. Wiege- und Kontrollstellen sind fest eingerichtet. Ihr aktueller Betriebsstatus ist unbekannt.'
      ]
    ]
  }
};

// Traffic is optional and is enabled from the map controls.
const trafficPrivacyNotices = {
  en: 'If you enable Traffic, TomTom receives requests for the map area you view, your API key and network information. This reveals the viewed area. The key is stored in this browser session, or on this device if you select Remember. Remove key in TomTom setup deletes it from this browser. Traffic display uses your TomTom quota and does not change the current route or arrival estimate.',
  fr: 'Si vous activez Traffic, TomTom reçoit des requêtes pour la zone affichée, votre clé API et des données réseau. La zone consultée peut être révélée. La clé reste dans cette session, ou sur cet appareil si vous choisissez Remember. Remove key dans TomTom setup la supprime de ce navigateur. Le trafic utilise votre quota TomTom et ne modifie ni le trajet ni l’heure d’arrivée.',
  fa: 'اگر Traffic را فعال کنید، محدودهٔ نقشهٔ قابل مشاهده، کلید API و اطلاعات شبکه به TomTom فرستاده می‌شود و محدودهٔ مورد مشاهده مشخص می‌شود. کلید در نشست مرورگر نگه داشته می‌شود یا با انتخاب Remember روی همان دستگاه می‌ماند. Remove key در TomTom setup کلید را از مرورگر پاک می‌کند. نمایش ترافیک از سهمیهٔ TomTom شما مصرف می‌کند و مسیر یا زمان رسیدن فعلی را تغییر نمی‌دهد.',
  hi: 'Traffic चालू करने पर TomTom को देखे गए मानचित्र क्षेत्र के अनुरोध, API कुंजी और नेटवर्क जानकारी मिलती है। इससे देखा गया क्षेत्र पता चल सकता है। कुंजी ब्राउज़र सत्र में रहती है, या Remember चुनने पर इसी डिवाइस में सहेजी जाती है। TomTom setup में Remove key से इसे इस ब्राउज़र से मिटा सकते हैं। ट्रैफ़िक आपके TomTom कोटे का उपयोग करता है और वर्तमान मार्ग या आगमन समय नहीं बदलता।',
  es: 'Al activar Traffic, TomTom recibe solicitudes del área del mapa visible, tu clave API y datos de red. Esto revela el área consultada. La clave se guarda durante la sesión o en el dispositivo si eliges Remember. Remove key en TomTom setup la elimina de este navegador. El tráfico consume tu cuota TomTom y no cambia la ruta ni la hora de llegada actual.',
  de: 'Wenn du Traffic aktivierst, erhält TomTom Anfragen für den angezeigten Kartenbereich, deinen API-Schlüssel und Netzwerkdaten. Dadurch wird der betrachtete Bereich erkennbar. Der Schlüssel bleibt für die Sitzung gespeichert oder mit Remember auf diesem Gerät. Remove key unter TomTom setup löscht ihn aus diesem Browser. Die Anzeige nutzt dein TomTom-Kontingent und ändert weder die aktuelle Route noch die Ankunftszeit.',
};
for (const [language, paragraph] of Object.entries(trafficPrivacyNotices)) siteNoticeText[language].sections[0].push(paragraph);

// Supplemental notice for the optional shared backend; re-consent is versioned.
const sharedBackendNotice={
 en:'Signing in uses Supabase. Reports you choose to submit share location, capture time and travel direction with other signed-in drivers. Account settings sync is optional and private to your account. Observations are not official station status and expire; conflicting or uncorroborated station status is Unknown. Offline queues and saved routes remain on your device until synchronized or deleted. Voice input may use browser speech services. Ask Rahyar currently uses data lookup, with no connected AI model.',
 fr:'La connexion utilise Supabase. Les signalements envoyés partagent la position, l’heure et le sens de circulation avec les conducteurs connectés. La synchronisation des paramètres est facultative et privée. Les observations expirent et ne sont pas un statut officiel. Sans corroboration ou en cas de conflit, le statut est Inconnu. Les files hors ligne et itinéraires restent sur cet appareil. La saisie vocale peut utiliser les services du navigateur. Aucun modèle IA n’est connecté.',
 fa:'ورود به حساب از Supabase استفاده می‌کند. گزارش‌هایی که ارسال می‌کنید، موقعیت، زمان و جهت حرکت را با رانندگان واردشده به حساب به اشتراک می‌گذارند. همگام‌سازی تنظیمات اختیاری و مختص حساب شماست. مشاهدات وضعیت رسمی ایستگاه نیستند و منقضی می‌شوند؛ وضعیت متناقض یا تأییدنشده نامشخص است. صف آفلاین و مسیرهای ذخیره‌شده تا همگام‌سازی یا حذف روی دستگاه می‌مانند. ورودی صوتی ممکن است از سرویس مرورگر استفاده کند. دستیار فعلاً جست‌وجوی داده انجام می‌دهد و مدل هوش مصنوعی متصل نیست.',
 hi:'साइन इन के लिए Supabase का उपयोग होता है। भेजी गई रिपोर्ट स्थान, समय और यात्रा की दिशा अन्य साइन इन चालकों से साझा करती हैं। सेटिंग सिंक वैकल्पिक और निजी है। अवलोकन आधिकारिक स्थिति नहीं हैं और समाप्त हो जाते हैं। विरोधी या अपुष्ट स्थिति अज्ञात है। ऑफलाइन कतार और सहेजे मार्ग डिवाइस पर रहते हैं। आवाज़ इनपुट ब्राउज़र सेवाओं का उपयोग कर सकता है। कोई AI मॉडल जुड़ा नहीं है।',
 es:'El inicio de sesión usa Supabase. Los informes enviados comparten ubicación, hora y sentido con otros conductores conectados. La sincronización de ajustes es opcional y privada. Las observaciones caducan y no son estado oficial. Sin corroboración o con conflicto, el estado es Desconocido. La cola y rutas sin conexión permanecen en el dispositivo. La voz puede usar servicios del navegador. No hay un modelo de IA conectado.',
 de:'Die Anmeldung verwendet Supabase. Gesendete Meldungen teilen Standort, Zeitpunkt und Fahrtrichtung mit angemeldeten Fahrern. Die Einstellungssynchronisierung ist optional und privat. Beobachtungen sind kein amtlicher Status und laufen ab. Ohne Bestätigung oder bei Widersprüchen ist der Status Unbekannt. Offline-Warteschlangen und Routen bleiben auf dem Gerät. Spracheingabe kann Browserdienste nutzen. Kein KI-Modell ist verbunden.'
};
for(const language of Object.keys(sharedBackendNotice))siteNoticeText[language].sections[0].push(sharedBackendNotice[language]);
