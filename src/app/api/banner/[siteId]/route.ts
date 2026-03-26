/**
 * Public banner script endpoint.
 * Serves the consent banner JavaScript for embedding on customer sites.
 *
 * Usage: <script src="https://custodia-privacy.com/api/banner/SITE_ID" async></script>
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  props: { params: Promise<{ siteId: string }> },
) {
  const siteId = (await props.params).siteId.replace(/\.js$/, "");

  // Fetch published banner config from database
  const banner = await db.banner.findUnique({
    where: { siteId },
    select: { enabled: true, publishedConfig: true },
  });

  if (!banner?.enabled || !banner.publishedConfig) {
    return new NextResponse("/* Custodia: No published banner config */", {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const config = banner.publishedConfig as any;
  const apiBase = process.env.NEXT_PUBLIC_APP_URL ?? "https://custodia-privacy.com";

  const script = generateBannerSDK(siteId, config, apiBase);

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function generateBannerSDK(siteId: string, config: any, apiBase: string): string {
  const { position, theme, primaryColor, content, categories, regulations, showLogo, customCss } =
    config;
  const isDark = theme === "dark";

  return `(function(){
'use strict';
var SITE_ID='${siteId}';
var API='${apiBase}';
var CONFIG=${JSON.stringify({ position, theme, primaryColor, content, categories: categories.map((c: any) => ({ key: c.key, name: c.name, description: c.description, required: c.required })), regulations })};
var CONSENT_COOKIE='custodia_consent';

// Check existing consent
function getConsent(){
  var m=document.cookie.match(new RegExp('(?:^|; )'+CONSENT_COOKIE+'=([^;]*)'));
  if(m){try{return JSON.parse(decodeURIComponent(m[1]))}catch(e){}}
  return null;
}

function setConsent(consent,action){
  var val=encodeURIComponent(JSON.stringify(consent));
  document.cookie=CONSENT_COOKIE+'='+val+';path=/;max-age=31536000;SameSite=Lax';
  hideBanner();
  // Log consent to API
  var xhr=new XMLHttpRequest();
  xhr.open('POST',API+'/api/banner/'+SITE_ID+'/consent');
  xhr.setRequestHeader('Content-Type','application/json');
  xhr.send(JSON.stringify({consent:consent,action:action,visitorId:getVisitorId(),userAgent:navigator.userAgent}));
  // Fire callback
  if(window.custodiaOnConsent)window.custodiaOnConsent(consent);
}

function getVisitorId(){
  var id=localStorage.getItem('custodia_vid');
  if(!id){id=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('custodia_vid',id);}
  return id;
}

function hideBanner(){var b=document.getElementById('custodia-cb');if(b)b.style.display='none';}

function renderBanner(){
  var existing=getConsent();
  if(existing)return; // Already consented

  var d=document.createElement('div');
  d.id='custodia-cb';
  var pos=CONFIG.position;
  var dark=${isDark};
  d.innerHTML='<div style="position:fixed;'
    +(pos==='center'?'top:50%;left:50%;transform:translate(-50%,-50%);max-width:520px;':'bottom:0;left:0;right:0;')
    +(pos==='bottom-left'?'right:auto;max-width:420px;margin:16px;':'')
    +(pos==='bottom-right'?'left:auto;max-width:420px;margin:16px;':'')
    +'background:'+(dark?'#1a1a2e':'#fff')+';color:'+(dark?'#e0e0e0':'#333')+';padding:24px;'
    +'box-shadow:0 -2px 20px rgba(0,0,0,0.15);z-index:999999;'
    +'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;'
    +(pos==='bottom'?'':'border-radius:12px;')
    +'">'
    +'<div style="font-size:16px;font-weight:600;margin-bottom:8px">${escapeJs(content.title)}</div>'
    +'<div style="font-size:14px;line-height:1.5;opacity:0.85;margin-bottom:16px">${escapeJs(content.description)}</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
    +'<button id="custodia-accept" style="padding:10px 20px;border:none;border-radius:6px;font-size:14px;cursor:pointer;font-weight:500;background:${primaryColor};color:#fff">${escapeJs(content.acceptAllText)}</button>'
    +'<button id="custodia-reject" style="padding:10px 20px;border-radius:6px;font-size:14px;cursor:pointer;font-weight:500;background:transparent;color:'+(dark?'#e0e0e0':'#555')+';border:1px solid '+(dark?'#444':'#ddd')+'">${escapeJs(content.rejectAllText)}</button>'
    +'<button id="custodia-customize" style="padding:10px 20px;border:none;background:transparent;color:${primaryColor};font-size:14px;cursor:pointer;text-decoration:underline">${escapeJs(content.customizeText)}</button>'
    +'</div>'
    +'</div>';

  document.body.appendChild(d);

  document.getElementById('custodia-accept').onclick=function(){
    var c={};CONFIG.categories.forEach(function(cat){c[cat.key]=true;});
    setConsent(c,'accept_all');
  };
  document.getElementById('custodia-reject').onclick=function(){
    var c={};CONFIG.categories.forEach(function(cat){c[cat.key]=cat.required;});
    setConsent(c,'reject_all');
  };
  document.getElementById('custodia-customize').onclick=function(){
    // Simple customize: show category toggles
    var modal=document.createElement('div');
    modal.id='custodia-modal';
    var html='<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000000;display:flex;align-items:center;justify-content:center">'
      +'<div style="background:'+(dark?'#1a1a2e':'#fff')+';color:'+(dark?'#e0e0e0':'#333')+';padding:32px;border-radius:12px;max-width:480px;width:90%;max-height:80vh;overflow-y:auto">'
      +'<div style="font-size:18px;font-weight:600;margin-bottom:16px">Cookie Preferences</div>';
    CONFIG.categories.forEach(function(cat){
      html+='<div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">'
        +'<div><div style="font-weight:500">'+cat.name+'</div><div style="font-size:13px;opacity:0.7">'+cat.description+'</div></div>'
        +'<label style="position:relative;display:inline-block;width:48px;height:26px">'
        +'<input type="checkbox" data-cat="'+cat.key+'" '+(cat.required?'checked disabled':'')
        +' style="opacity:0;width:0;height:0"><span style="position:absolute;top:0;left:0;right:0;bottom:0;background:'+(cat.required?'${primaryColor}':'#ccc')+';border-radius:26px;cursor:'+(cat.required?'not-allowed':'pointer')+'"></span></label>'
        +'</div>';
    });
    html+='<div style="display:flex;gap:8px;margin-top:20px">'
      +'<button id="custodia-save" style="padding:10px 20px;border:none;border-radius:6px;font-size:14px;cursor:pointer;font-weight:500;background:${primaryColor};color:#fff">Save Preferences</button>'
      +'</div></div></div>';
    modal.innerHTML=html;
    document.body.appendChild(modal);

    document.getElementById('custodia-save').onclick=function(){
      var c={};
      var boxes=modal.querySelectorAll('input[data-cat]');
      for(var i=0;i<boxes.length;i++){c[boxes[i].getAttribute('data-cat')]=boxes[i].checked||boxes[i].disabled;}
      setConsent(c,'customize');
      modal.remove();
    };
    modal.querySelector('div').onclick=function(e){if(e.target===this)modal.remove();};
  };
}

${customCss ? `// Custom CSS\nvar style=document.createElement('style');style.textContent=${JSON.stringify(customCss)};document.head.appendChild(style);` : ''}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',renderBanner);}else{renderBanner();}
})();`;
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
