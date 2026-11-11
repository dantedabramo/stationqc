/* Shared by every page: language, tab bar, smooth scroll, footer, App Store links. */
(function(){
  'use strict';
  var APP_STORE_URL='https://apps.apple.com/';
  var C=window.COPY||{en:{},fr:{}};
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap=!!(window.gsap&&window.ScrollTrigger&&window.SplitText);
  var MOTION=hasGsap&&!reduced;
  var root=document.documentElement;
  if(MOTION)root.classList.add('anim');
  if(hasGsap){gsap.registerPlugin(ScrollTrigger);if(window.SplitText)gsap.registerPlugin(SplitText)}

  var lang='en';
  try{var v=localStorage.getItem('sqc-lang');if(v==='fr'||v==='en')lang=v;else if((navigator.language||'').toLowerCase().indexOf('fr')===0)lang='fr'}catch(e){}

  var S=window.SQC={MOTION:MOTION,reduced:reduced,hasGsap:hasGsap,lenis:null,before:[],after:[],anchors:{},
    get lang(){return lang},
    t:function(){var o=C[lang]||C.en,x={};(o.f||[]).forEach(function(f,i){x['f'+(i+1)+'p']=f[2]});return Object.assign({},o,x)},
    fmt:function(n){var s=Number(n).toFixed(1);return lang==='fr'?s.replace('.',','):s}
  };

  function apply(){
    var t=S.t(),page=document.body.dataset.page||'home';
    root.lang=lang==='fr'?'fr-CA':'en';
    if(t['title_'+page])document.title=t['title_'+page];
    $$('[data-i18n]').forEach(function(e){var k=e.dataset.i18n;if(t[k]!==undefined)e.textContent=t[k]});
    $$('[data-l]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.l===lang))});
    $$('input[name=lang]').forEach(function(i){i.value=lang});
    footer(t);
  }
  function footer(t){
    var f=$('#foot');if(!f)return;
    var home=document.body.dataset.page==='home',hp=home?'':'index.html',year=String(new Date().getFullYear());
    var arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
    function link(href,txt,go){return '<li><a href="'+href+'"'+(go?' data-go="'+go+'"':'')+'>'+txt+arrow+'</a></li>'}
    var words=t.ticker.concat(t.ticker,t.ticker);
    f.innerHTML=
      '<div class="tick" aria-hidden="true"><div class="tick-t">'+words.concat(words).map(function(w){return '<span>'+w+'</span>'}).join('')+'</div></div>'+
      '<div class="wrap"><div class="foot-body">'+
        '<div class="foot-cta"><h2>'+t.ch+'</h2><a class="badge" data-app href="#"><img src="assets/img/app-store.svg" alt="'+t.get+'" width="138" height="46"></a></div>'+
        '<div class="cols">'+
          '<div><h3>'+t.fprod+'</h3><ul>'+link(hp+'#how',t.nhow,home&&'how')+link(hp+'#day',t.nfeat,home&&'day')+link(hp+'#faq',t.nfaq,home&&'faq')+link(hp+'#beta',t.nbeta,home&&'beta')+'</ul></div>'+
          '<div><h3>'+t.fhelp+'</h3><ul>'+link('support.html',t.ns)+'</ul></div>'+
          '<div><h3>'+t.flegal+'</h3><ul>'+link('privacy.html',t.np)+link('terms.html',t.nt)+'</ul></div>'+
        '</div></div>'+
        '<div class="foot-bar"><a class="brand" href="'+(home?'#top':'index.html')+'"'+(home?' data-go="top"':'')+'><img src="assets/img/icon.webp" alt="" width="24" height="24"><span>StationQC</span></a><span>'+t.rights.replace('2026',year)+'</span><span>'+t.legal+'</span></div>'+
      '</div>';
  }
  S.setLang=function(l){
    if(l===lang)return;
    S.before.forEach(function(f){f()});
    lang=l;try{localStorage.setItem('sqc-lang',l)}catch(e){}
    apply();
    S.after.forEach(function(f){f()});
  };

  /* Smooth scroll, driven by GSAP's ticker so ScrollTrigger and Lenis never disagree. */
  if(MOTION&&window.Lenis){
    var lenis=new Lenis({lerp:.09,smoothWheel:true,wheelMultiplier:1,autoRaf:false});
    S.lenis=lenis;
    lenis.on('scroll',ScrollTrigger.update);
    gsap.ticker.add(function(t){lenis.raf(t*1000)});
    gsap.ticker.lagSmoothing(0);
  }
  if(MOTION)ScrollTrigger.config({ignoreMobileResize:true});

  S.scrollTo=function(y,opts){
    opts=opts||{};
    /* Lenis caches the page height; pinned sections change it, so measure before every jump. */
    if(S.lenis){S.lenis.resize();S.lenis.scrollTo(y,{duration:opts.immediate?0:1.6,immediate:!!opts.immediate,force:true,easing:function(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}})}
    else window.scrollTo({top:y,behavior:opts.immediate||reduced?'auto':'smooth'});
  };
  S.go=function(id,opts){
    var y;
    if(id==='top')y=0;
    else if(S.anchors[id])y=S.anchors[id]();
    else{var el=document.getElementById(id);if(!el)return;y=el.getBoundingClientRect().top+window.scrollY}
    S.scrollTo(Math.max(0,y),opts);
  };

  /* Tab bar: a glass lens that slides like a drop of liquid, leading edge first. */
  var nav=$('.tabs'),lensEl=nav&&$('.lens',nav),cur=null,L={l:0,r:0,o:0};
  function lensTo(a){
    if(!lensEl)return;
    var o=a?1:0,l=L.l,r=L.r;
    if(a){var nb=nav.getBoundingClientRect(),ab=a.getBoundingClientRect();l=ab.left-nb.left;r=ab.right-nb.left}
    if(!hasGsap||reduced||!L.o){L.l=l;L.r=r;L.o=o;draw();return}
    var right=l>L.l;
    gsap.killTweensOf(L);
    gsap.to(L,{l:l,duration:right?.62:.42,ease:'expo.out',onUpdate:draw});
    gsap.to(L,{r:r,duration:right?.42:.62,ease:'expo.out',onUpdate:draw});
    gsap.to(L,{o:o,duration:.25,onUpdate:draw});
  }
  function draw(){lensEl.style.transform='translateX('+L.l.toFixed(2)+'px)';lensEl.style.width=Math.max(0,L.r-L.l).toFixed(2)+'px';lensEl.style.opacity=L.o}
  S.setTab=function(key){
    if(key===cur)return;cur=key;
    var a=key?$('[data-tab="'+key+'"]',nav):null;
    $$('a',nav).forEach(function(x){x.classList.toggle('on',x===a);if(x===a)x.setAttribute('aria-current','true');else x.removeAttribute('aria-current')});
    lensTo(a);
  };
  window.addEventListener('resize',function(){if(cur){var k=cur;cur=null;var o=L.o;L.o=0;S.setTab(k);L.o=o;draw()}},{passive:true});

  document.addEventListener('click',function(e){
    var l=e.target.closest('[data-l]');if(l){S.setLang(l.dataset.l);return}
    var a=e.target.closest('[data-app]');if(a){e.preventDefault();window.open(APP_STORE_URL,'_blank','noopener');return}
    var g=e.target.closest('[data-go]');
    if(g&&document.body.dataset.page==='home'){e.preventDefault();S.go(g.dataset.go);if(g.dataset.go!=='top')history.replaceState(null,'','#'+g.dataset.go);else history.replaceState(null,'',location.pathname)}
  });

  apply();
  /* Headers drop in once, like a sheet settling. */
  if(MOTION){
    gsap.from('.top .brand,.top .tools',{y:-14,opacity:0,duration:.9,ease:'expo.out',stagger:.06,delay:.1,clearProps:'transform,opacity'});
    gsap.from('.tabs',{opacity:0,duration:.9,ease:'expo.out',delay:.16,clearProps:'opacity'});
  }
  window.addEventListener('load',function(){if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(MOTION)ScrollTrigger.refresh()})});
})();
