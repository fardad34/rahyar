'use strict';
// Online-only recovery entry bypasses older workers' cached home-page fallback.
// Same origin/storage; replaceState does not reload the home page or end a trip.
function recoveryHTML(html){
 if(!html.includes('<head>'))throw Error('HTML entry has no head');
 const script="<script>if(location.pathname.endsWith('/road-test.html'))history.replaceState(history.state,'','./'+location.search);</script>";
 return html.replace('<head>','<head>'+script);
}
module.exports={recoveryHTML};
