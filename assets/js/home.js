/* Home: one scroll story. Orbit → dive into Montréal → the phone rises → tour →
   prices fall and become Québec → the rest of your day → beta. */
(function(){
  'use strict';
  var S=window.SQC;if(!S)return;
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var G=window.G=window.G||{};
  G.mode=S.MOTION?'anim':'static';G.dive=0;G.end=0;G.dim=0;G.hide=0;G.go=!S.MOTION;
  var BRANDS=['Petro-Canada','Shell','Ultramar','Esso','Costco','Couche-Tard','Harnois','Irving','Crevier','Sonic','Canadian Tire','Eko'];
  /* Where each callout points on the real screenshot, in % of the screen. */
  var AN=[[40,34],[57,48.6],[20,65],[22,79]];
  var PRICES=[161.9,188.9,177.4];
  var grade=0,ctx=null,mm=null,splits=[],introDone=false,velTick=null,pinsKill=null,stageD=null,betaST=null;
  /* The globe's state is read from the timelines every frame. Scroll recalculations (opening an FAQ
     answer, resizing) re-render timelines with callbacks muted, so values pushed from onUpdate could go
     stale and leave the Earth showing behind the FAQ. Reading the source each frame can't. */
  /* Spans from the brand names to the beta, measured after every layout pass (pins add spacers). */
  function placeNight(){
    var n=$('.night'),m=$('#main'),b=$('#brands'),e=$('#beta');if(!n||!b||!e)return;
    var mt=m.getBoundingClientRect().top,bt=b.getBoundingClientRect().top,et=e.getBoundingClientRect().top;
    n.style.top=Math.round(bt-mt)+'px';n.style.height=Math.max(0,Math.round(et-bt))+'px';
  }
  function syncGlobe(){
    if(stageD){G.dive=stageD.d;G.dim=stageD.m}
    G.end=betaST?betaST.progress:0;
    G.map=G.mapOf?G.mapOf():0;
    var past=G.pinsPast?G.pinsPast():null;
    /* Once the price scene unpins, the Earth scrolls away with the page by exactly the same pixels,
       and only hides once it is fully off screen. */
    G.shift=past?past.shift:0;G.hide=past&&past.gone?1:0;
  }
  var EXPO='expo.out';

  /* ---------- Odometers ---------- */
  function odoCols(el,len){
    if(el.dataset.len===String(len))return;
    el.dataset.len=len;var h='';
    for(var i=0;i<len;i++)h+='<span class="dg"><span class="col">'+'0123456789'.split('').concat('0').map(function(d){return '<b>'+d+'</b>'}).join('')+'</span></span>';
    el.innerHTML=h;
  }
  function setOdoStr(el,str){
    if(el.dataset.str!==String(str.length)){el.dataset.str=str.length;el.dataset.len='';el.innerHTML=str.split('').map(function(c){return /\d/.test(c)?'<span class="dg"><span class="col">'+'0123456789'.split('').map(function(d){return '<b>'+d+'</b>'}).join('')+'</span></span>':'<span class="dg">'+c+'</span>'}).join('')}
    Array.prototype.forEach.call(el.children,function(d,i){var c=str[i];if(/\d/.test(c))d.firstChild.style.transform='translateY(-'+(+c)+'em)';else d.textContent=c});
  }
  /* Lower digits roll continuously and carry into the next column, like a real odometer. */
  function setOdoNum(el,v,len){
    odoCols(el,len);var cols=$$('.col',el);
    for(var k=0;k<len;k++){
      var col=cols[len-1-k],p=Math.pow(10,k),val;
      if(k===0)val=v%10;else{var below=v%p,carry=Math.max(0,below-(p-1));val=Math.floor(v/p)%10+carry}
      col.style.transform='translateY(-'+val.toFixed(3)+'em)';
      if(k>0)col.parentNode.style.opacity=Math.min(1,Math.max(0,v-(p-1)));
    }
  }
  function paintGrade(){
    var seg=$('#seg');if(!seg)return;
    seg.style.setProperty('--g',grade);
    $$('button',seg).forEach(function(b,i){b.setAttribute('aria-pressed',String(i===grade))});
    setOdoStr($('#odo'),S.fmt(PRICES[grade]));$('#odosr').textContent=S.fmt(PRICES[grade])+'¢';
  }

  /* ---------- Content ---------- */
  function render(){
    var t=S.t(),L=S.lang;
    $('#tour-copy').innerHTML=t.steps.map(function(s,i){return '<div class="st" data-i="'+i+'"><h3>'+s[1]+'</h3><p>'+s[2]+'</p><img class="shot" src="assets/img/shots/'+L+'-'+s[0]+'.webp" alt="'+s[3]+'" width="780" height="1696" loading="lazy" decoding="async"></div>'}).join('')+
      '<div class="prog">'+t.slabels.map(function(n,i){return '<button type="button" data-step="'+i+'"><span>'+n+'</span><i><b></b></i></button>'}).join('')+'</div>';
    $('#scr').innerHTML=t.steps.map(function(s,i){return '<img src="assets/img/shots/'+L+'-'+s[0]+'.webp" alt="'+(i===0?s[3]:'')+'" width="780" height="1696" decoding="async" data-i="'+i+'">'}).join('');
    $('#callouts').innerHTML=t.steps.map(function(s,i){return '<div class="co" style="--ax:'+AN[i][0]+';--ay:'+AN[i][1]+'"><span class="ln"></span><span class="dot"></span><span class="chip glass">'+s[4]+'</span></div>'}).join('');
    $('#nums').innerHTML=t.sts.map(function(x){return '<div><b class="odo" data-n="'+x[0]+'" aria-hidden="true"></b><span class="sr">'+x[0]+'</span><span class="lbl">'+x[1]+'</span></div>'}).join('');
    $$('#nums .odo').forEach(function(el){var n=+el.dataset.n;setOdoNum(el,n,String(n).length)});
    $('#fl').innerHTML=t.all.map(function(g){return '<div><h3>'+g[0]+'</h3><ul>'+g[1].map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></div>'}).join('');
    $('#faqlist').innerHTML=t.q.map(function(q,i){return '<div class="qa"><button type="button" aria-expanded="false" aria-controls="qa'+i+'" id="qb'+i+'"><span>'+q[0]+'</span><span class="pm" aria-hidden="true"></span></button><div class="ans" id="qa'+i+'" role="region" aria-labelledby="qb'+i+'"><p>'+q[1]+'</p></div></div>'}).join('');
    $$('.wp').forEach(function(e){e.textContent=S.fmt(161.9)});
    $$('.wx-hours time[data-h]').forEach(function(e){var h=+e.dataset.h;e.textContent=L==='fr'?h+' h':(h%12||12)+' '+(h<12?'AM':'PM')});
    paintGrade();
    sizeDevice();
  }
  function brands(){
    $$('.vel-row').forEach(function(r){var list=r.dataset.dir==='1'?BRANDS:BRANDS.slice().reverse();var one=list.map(function(b){return '<span>'+b+'</span>'}).join('');r.innerHTML=one+one+one});
  }
  function sizeDevice(){var p=$('#device .phone');if(p)$('#device').style.setProperty('--pw',p.offsetWidth)}

  /* ---------- FAQ ---------- */
  document.addEventListener('click',function(e){
    var b=e.target.closest('.qa button');
    if(b){
      var qa=b.parentNode,ans=$('.ans',qa),open=qa.hasAttribute('data-open');
      b.setAttribute('aria-expanded',String(!open));
      if(!S.MOTION){if(open)qa.removeAttribute('data-open');else qa.setAttribute('data-open','');return}
      gsap.killTweensOf(ans);
      if(open){
        gsap.to(ans,{height:0,duration:.45,ease:'expo.inOut',onComplete:function(){qa.removeAttribute('data-open');gsap.set(ans,{clearProps:'height'});ScrollTrigger.refresh()}});
        gsap.to($('p',ans),{opacity:0,y:-6,duration:.2,ease:'power1.in'});
      }else{
        qa.setAttribute('data-open','');
        gsap.fromTo(ans,{height:0},{height:'auto',duration:.7,ease:EXPO,onComplete:function(){gsap.set(ans,{clearProps:'height'});ScrollTrigger.refresh()}});
        gsap.fromTo($('p',ans),{opacity:0,y:-12,filter:'blur(6px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.7,delay:.06,ease:EXPO});
      }
      return;
    }
    var sb=e.target.closest('[data-step]');if(sb&&S.stageJump){S.stageJump(+sb.dataset.step);return}
    var g=e.target.closest('[data-g]');if(g){grade=+g.dataset.g;paintGrade()}
  });

  /* ---------- Beta form ---------- */
  var form=$('#beta-form');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var t=S.t(),st=$('#beta-status'),name=form.elements.name,mail=form.elements.email;
      var okName=name.value.trim().length>=2,okMail=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim());
      name.setAttribute('aria-invalid',String(!okName));mail.setAttribute('aria-invalid',String(!okMail));
      st.classList.remove('err');
      if(!okName||!okMail){st.textContent=!okName?t.berr_name:t.berr_email;st.classList.add('err');(okName?mail:name).focus();return}
      /* Opened straight from disk there is no server to receive it. */
      if(location.protocol==='file:'){st.textContent=t.berr_local;st.classList.add('err');return}
      form.classList.add('busy');form.elements.lang.value=S.lang;
      var send=$('.send',form);send.disabled=true;st.textContent='';
      fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}})
        .then(function(r){return r.ok},function(){return false})
        .then(function(ok){
          form.classList.remove('busy');send.disabled=false;
          if(ok){
            if(S.MOTION){gsap.to($$('.field,.send',form),{opacity:0,y:-8,duration:.25,stagger:.04,ease:'power1.in',onComplete:function(){form.classList.add('done');st.textContent=t.bok;gsap.fromTo(st,{opacity:0,y:12,filter:'blur(6px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.9,ease:EXPO})}})}
            else{form.classList.add('done');st.textContent=t.bok}
          }else{
            st.classList.add('err');st.textContent=t.berr_server;
          }
        });
    });
  }

  /* ---------- Shared reveal: transform and opacity only, so it stays on the compositor ---------- */
  function lines(el,opts){var s=SplitText.create(el,Object.assign({type:'lines',mask:'lines',linesClass:'ln'},opts||{}));splits.push(s);return s}
  function rise(targets,trigger,opts){
    return gsap.from(targets,Object.assign({y:32,opacity:0,duration:1.2,ease:EXPO,stagger:.08,scrollTrigger:{trigger:trigger,start:'top 80%'}},opts||{}));
  }
  function headline(h,trigger){var s=lines(h);gsap.from(s.lines,{yPercent:110,stagger:.08,duration:1.3,ease:EXPO,scrollTrigger:{trigger:trigger||h,start:'top 80%'}})}

  /* ---------- Scenes ---------- */
  function build(){
    if(!S.MOTION)return;
    ctx=gsap.context(function(){
      mm=gsap.matchMedia();
      mm.add({desk:'(min-width:761px)',mob:'(max-width:760px)'},function(c){
        stage(c.conditions.desk);
        pinsKill=pins(!c.conditions.desk);
        day();
        return function(){if(pinsKill){pinsKill();pinsKill=null}};
      });
      statement();
      numbers();
      reveals();
      beta();
      spy();
    });
    gsap.ticker.add(syncGlobe);
    ScrollTrigger.removeEventListener('refresh',placeNight);ScrollTrigger.addEventListener('refresh',placeNight);
  }

  function stage(desk){
    var stageEl=$('#stage'),dev=$('#device'),imgs=$$('#scr img'),sts=$$('#tour-copy .st'),cos=$$('#callouts .co'),bars=$$('.prog b'),steps=$$('.prog button');
    var hl=SplitText.create('#hl',{type:'words',mask:'words'});splits.push(hl);
    var side=$('.hero-side');
    var d1=SplitText.create('.dive-copy .d1',{type:'chars,words'});splits.push(d1);
    var d2=$('.dive-copy .d2');
    var stLines=sts.map(function(s){return lines($$('h3,p',s))});
    gsap.set(['#hl',side],{visibility:'visible'});
    gsap.set(hl.words,{transformPerspective:700,transformOrigin:'50% 100%'});

    if(!introDone){
      gsap.set(hl.words,{yPercent:115,rotationX:-55});
      gsap.set($$('.hero-side>*'),{y:16,opacity:0});
      S.intro=function(){
        if(introDone)return;introDone=true;G.go=true;
        gsap.to(hl.words,{yPercent:0,rotationX:0,duration:1.2,ease:EXPO,stagger:.06,delay:.1});
        gsap.to($$('.hero-side>*'),{y:0,opacity:1,duration:1,ease:EXPO,stagger:.07,delay:.35});
      };
    }

    /* The phone starts below the fold, tipped back, and rises into place as a real object. */
    gsap.set(dev,{xPercent:-50,yPercent:-50,x:0,y:function(){return window.innerHeight*.9},rotationX:34,rotationY:0,scale:.84,transformPerspective:1600,autoAlpha:0});
    imgs.forEach(function(im,i){gsap.set(im,{xPercent:i?100:0,opacity:1})});
    gsap.set(sts,{autoAlpha:0});
    gsap.set('.prog',{autoAlpha:0});
    gsap.set(d1.chars,{opacity:0,yPercent:40});
    gsap.set(d2,{opacity:0,y:18});
    /* Whole layers stay visibility:hidden outside their moment, so a scroll that settles a pixel
       short of the top can never leave a ghost of the next scene showing through. */
    var diveEl=$('.dive-copy'),tourCopy=$('#tour-copy');
    gsap.set([diveEl,tourCopy],{autoAlpha:0});
    cos.forEach(function(co){gsap.set(co,{opacity:0});gsap.set($('.ln',co),{scaleX:0});gsap.set($('.chip',co),{x:-12,opacity:0})});
    stLines.forEach(function(s){gsap.set(s.lines,{yPercent:110})});

    var D=stageD={d:0,m:0,h:0};
    var targetX=function(){
      if(!desk)return 0;
      var vw=window.innerWidth,maxw=1240,gut=Math.max(20,Math.min(48,vw*.04));
      var rightEdge=vw-Math.max(gut,(vw-maxw)/2+gut)-30;
      var pw=$('#device .phone').offsetWidth;
      return Math.round(rightEdge-pw/2-vw/2);
    };
    var T=14.4;
    /* Lenis already smooths the wheel, so the timeline follows the scroll directly (scrub:true).
       A numeric scrub on top of Lenis is two smoothers in a row, which is what made text trail behind. */
    var tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:stageEl,start:'top top',end:function(){return '+='+Math.round(window.innerHeight*(desk?8.5:7.5))},pin:true,scrub:true,anticipatePin:1,invalidateOnRefresh:true,
      onUpdate:function(self){
        var tt=self.progress*T,idx=tt<6.2?-1:Math.min(sts.length-1,Math.floor((tt-6.0)/2));
        steps.forEach(function(b,k){b.classList.toggle('on',k===idx);if(k===idx)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
      }}});
    var stepAt=function(i){var st=tl.scrollTrigger;return st.start+(st.end-st.start)*((6.5+i*2+1.1)/T)};
    S.anchors.how=function(){return stepAt(0)-(tl.scrollTrigger.end-tl.scrollTrigger.start)*(.6/T)};
    S.stageJump=function(i){S.scrollTo(stepAt(i))};

    /* 1. Leave orbit. fromTo with explicit start values: the intro may still be running when the
       timeline first renders, and a plain .to() would record the hidden state as its start, so
       scrolling back to the top used to leave the headline missing. */
    tl.fromTo(hl.words,{yPercent:0,rotationX:0,opacity:1},{yPercent:-110,rotationX:45,opacity:0,stagger:.035,duration:.9,ease:'power2.in',immediateRender:false},0);
    tl.fromTo(side,{y:0,opacity:1},{y:-32,opacity:0,duration:.8,ease:'power2.in',immediateRender:false},.1);
    /* 2. Dive into Montréal */
    tl.to(D,{d:1,duration:4.6,ease:'power1.inOut',onUpdate:function(){G.dive=D.d}},.25);
    tl.set(diveEl,{autoAlpha:1},1.2);tl.set(diveEl,{autoAlpha:0},3.75);
    tl.set(tourCopy,{autoAlpha:1},6.2);
    tl.to(d1.chars,{opacity:1,yPercent:0,stagger:.025,duration:.7,ease:'power3.out'},1.25);
    tl.to(d2,{opacity:1,y:0,duration:.6,ease:'power3.out'},1.9);
    tl.to(d1.chars,{opacity:0,yPercent:-40,stagger:.015,duration:.5,ease:'power2.in'},3.15);
    tl.to(d2,{opacity:0,y:-12,duration:.4,ease:'power2.in'},3.2);
    /* 3. The city lights soften into a backdrop, and the phone rises out of the night */
    tl.to(D,{m:1,duration:1.1,onUpdate:function(){G.dim=D.m}},3.9);
    tl.to(dev,{autoAlpha:1,duration:.25},4.15);
    tl.to(dev,{y:0,rotationX:0,scale:1,duration:1.5,ease:'power3.out'},4.15);
    tl.to(dev,{x:targetX,duration:1,ease:'power3.inOut'},6.0);
    tl.to('.prog',{autoAlpha:1,duration:.4},6.3);
    /* 4. The tour. Screens push in like iOS navigation; the phone turns a few degrees with each
       push and settles, so the change reads as one object moving, not an image swap. */
    sts.forEach(function(st,i){
      var at=6.5+i*2,prev=i-1;
      if(i>0){
        tl.to(stLines[prev].lines,{yPercent:-110,stagger:.03,duration:.5,ease:'power2.in'},at-.6);
        tl.set(sts[prev],{autoAlpha:0},at-.04);
        tl.to(cos[prev],{opacity:0,duration:.3},at-.7);
        tl.to(imgs[i],{xPercent:0,duration:1.1,ease:'power2.inOut'},at-.6);
        tl.to(imgs[prev],{xPercent:-28,opacity:.35,duration:1.1,ease:'power2.inOut'},at-.6);
        tl.to(dev,{rotationY:desk?-9:-5,duration:.55,ease:'sine.inOut'},at-.6);
        tl.to(dev,{rotationY:0,duration:.75,ease:'sine.inOut'},at-.05);
      }
      tl.set(st,{autoAlpha:1},at);
      tl.to(stLines[i].lines,{yPercent:0,stagger:.05,duration:.75,ease:'power3.out'},at+.05);
      tl.to(bars[i],{scaleX:1,duration:1.7},at);
      if(desk){
        tl.to(cos[i],{opacity:1,duration:.01},at+.5);
        tl.to($('.ln',cos[i]),{scaleX:1,duration:.45,ease:'power2.out'},at+.5);
        tl.to($('.chip',cos[i]),{x:0,opacity:1,duration:.45,ease:'power2.out'},at+.7);
      }
    });
    /* 5. Let the night go as the stage hands off */
    /* The Earth no longer fades out here: it stays, dimmed, and the next scene pulls back out to orbit.
       An empty beat keeps the timeline at T so the step positions above still line up. */
    tl.to({},{duration:.7},T-.7);
  }

  /* ---------- Prices fall, then assemble into Québec ---------- */
  var TIER={c:'#00a568',m:'#1e6fd0',e:'#e53935',n:'#c97a00'};
  /* The same tiers lifted for text on the night side, so blue and red stay legible at 12px. */
  var TIER_TEXT={c:'#30da88',m:'#6cb8ff',e:'#ff7a7a',n:'#ffb84d'};
  function pins(mob){
    var sec=$('#pins'),stageEl=$('.pins-stage',sec),cv=$('#pins-canvas'),g=cv.getContext('2d');
    var W=0,H=0,dpr=1,N=mob?72:150,P=[],formNow=0,prog=0,live=false,parked=true,mx=-1e4,my=-1e4,pmx=-1e4,pmy=-1e4,mspeed=0;
    var PH=mob?21:24,cosL=Math.cos(47.5*Math.PI/180),LAB=[];
    function sprite(tier,label){
      var c=document.createElement('canvas'),x=c.getContext('2d'),fs=Math.round(PH*.56),w;
      x.font='800 '+fs+'px ui-rounded,"SF Pro Rounded",Geist,system-ui,sans-serif';
      w=Math.max(PH*2.1,Math.ceil(x.measureText(label).width)+PH*.75);
      var h=PH,tip=6,r=2;
      c.width=Math.ceil((w+4)*r);c.height=Math.ceil((h+tip+4)*r);x.scale(r,r);x.translate(2,2);
      x.fillStyle=TIER[tier];x.strokeStyle='#fff';x.lineWidth=1.3;
      x.beginPath();x.moveTo(h/2,0);x.lineTo(w-h/2,0);x.arc(w-h/2,h/2,h/2,-Math.PI/2,Math.PI/2);x.lineTo(w/2+5,h);x.lineTo(w/2,h+tip);x.lineTo(w/2-5,h);x.lineTo(h/2,h);x.arc(h/2,h/2,h/2,Math.PI/2,Math.PI*1.5);x.closePath();
      x.fill();x.stroke();
      x.fillStyle='#fff';x.font='800 '+fs+'px ui-rounded,"SF Pro Rounded",Geist,system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(label,w/2,h/2+.5);
      return {c:c,w:w+4,h:h+tip+4,bw:w,bh:h};
    }
    /* Once landed, a pin becomes a lit dot in its tier color, so the province reads as a map of lights. */
    var DOT=mob?9:11,dots={};
    Object.keys(TIER).forEach(function(k){
      var c=document.createElement('canvas'),x=c.getContext('2d'),s=64;c.width=c.height=s;
      var gr=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
      gr.addColorStop(0,'#fff');gr.addColorStop(.16,TIER[k]);gr.addColorStop(.3,TIER[k]);gr.addColorStop(.31,TIER[k]+'55');gr.addColorStop(1,TIER[k]+'00');
      x.fillStyle=gr;x.fillRect(0,0,s,s);dots[k]=c;
    });
    /* No outline. Southern Québec is drawn the way it looks at night: stations cluster in towns and
       string out along the highways, so the lights themselves trace the province. */
    var BOX=[-79.4,45.0,-64.2,50.35];
    var TOWNS=[[-73.57,45.50,30],[-73.69,45.57,8],[-73.52,45.53,6],[-71.21,46.81,12],[-75.70,45.48,6],[-71.89,45.40,5],[-72.55,46.35,5],[-71.07,48.43,4],[-68.52,48.45,2],[-72.48,45.88,3],[-74.00,45.78,3],[-79.02,48.24,2],[-77.78,48.10,1.5],[-66.38,50.22,1.5],[-68.15,49.22,1],[-64.48,48.83,1],[-74.37,49.92,.6],[-72.73,45.40,3],[-72.95,45.63,3],[-73.44,46.03,2],[-69.53,47.84,1.5],[-71.96,46.05,2],[-72.75,46.57,1.5],[-75.50,46.55,1],[-71.65,48.55,1.5],[-67.53,48.85,1],[-71.30,46.10,1],[-70.67,46.12,1.5],[-78.12,48.57,.8]];
    var ROADS=[
      [[-74.4,45.25],[-73.95,45.4],[-73.5,45.52],[-72.95,45.63],[-72.48,45.88],[-71.95,46.2],[-71.6,46.5],[-71.18,46.75],[-70.55,46.98],[-70.0,47.3],[-69.53,47.84],[-69.0,48.15],[-68.52,48.45]],
      [[-68.52,48.45],[-67.53,48.85],[-66.5,49.1],[-65.3,49.2],[-64.48,48.83],[-64.7,48.3],[-65.5,48.05],[-66.7,47.98]],
      [[-73.57,45.5],[-73.2,45.8],[-72.55,46.35],[-71.9,46.65],[-71.21,46.81]],
      [[-71.21,46.81],[-70.7,47.1],[-70.15,47.6],[-69.7,48.15],[-68.9,48.8],[-68.15,49.22],[-67.4,49.4],[-66.38,50.22]],
      [[-73.5,45.47],[-73.0,45.4],[-72.73,45.4],[-72.2,45.35],[-71.89,45.4]],
      [[-73.69,45.57],[-74.0,45.78],[-74.3,46.0],[-74.6,46.2],[-75.0,46.4],[-75.5,46.55],[-76.3,47.2],[-77.0,47.6],[-77.78,48.10],[-78.5,48.2],[-79.02,48.24]],
      [[-71.21,46.81],[-71.3,47.3],[-71.2,47.9],[-71.07,48.43],[-71.65,48.55],[-72.2,48.6]],
      [[-75.70,45.48],[-75.0,45.6],[-74.5,45.65],[-74.0,45.6],[-73.69,45.57]],
      [[-72.55,46.35],[-72.48,45.88],[-72.1,45.6],[-71.89,45.4]],
      [[-71.18,46.75],[-71.0,46.4],[-70.67,46.12],[-70.4,45.7]],
      [[-77.78,48.10],[-76.5,48.6],[-75.5,49.3],[-74.37,49.92]]
    ];
    /* The hero's five city tags (same towns, line heights and sides), now carrying a price. */
    var FEAT=[[-73.57,45.50,'Montréal',112,-1],[-71.21,46.81,'Québec',38,1],[-71.07,48.43,'Saguenay',74,1],[-79.02,48.24,'Rouyn-Noranda',34,-1]]; // Gaspé dropped: its hairline crossed Québec's price
    if(mob)FEAT=[[-73.57,45.50,'Montréal',72,-1],[-71.21,46.81,'Québec',30,1],[-71.07,48.43,'Saguenay',56,1]];
    var WSUM=TOWNS.reduce(function(a,t){return a+t[2]},0);
    var SEGS=[],LSUM=0;ROADS.forEach(function(r){for(var i=1;i<r.length;i++){var l=Math.hypot((r[i][0]-r[i-1][0])*cosL,r[i][1]-r[i-1][1]);SEGS.push([r[i-1],r[i],l]);LSUM+=l}});
    function gauss(){return Math.sqrt(-2*Math.log(1-Math.random()))*Math.cos(6.2832*Math.random())}
    function home(){
      if(Math.random()<.5){
        var q=Math.random()*LSUM,s=SEGS[0];for(var j=0;j<SEGS.length;j++){q-=SEGS[j][2];if(q<=0){s=SEGS[j];break}}
        var u=Math.random();return [s[0][0]+(s[1][0]-s[0][0])*u+gauss()*.05,s[0][1]+(s[1][1]-s[0][1])*u+gauss()*.035];
      }
      var r=Math.random()*WSUM,t=TOWNS[0];for(var k=0;k<TOWNS.length;k++){r-=TOWNS[k][2];if(r<=0){t=TOWNS[k];break}}
      var sp=.05+.03*Math.sqrt(t[2]);
      return [t[0]+gauss()*sp*1.4,t[1]+gauss()*sp];
    }
    for(var i=0;i<N;i++){
      var r=Math.random(),tier=r<.38?'c':r<.8?'m':r<.96?'e':'n',feat=i<FEAT.length;
      if(feat)tier=i===0?'c':i===1?'m':r<.5?'c':'m';
      var price=tier==='c'?149.9+Math.random()*8:tier==='m'?158.9+Math.random()*7:166.9+Math.random()*12;
      var label=tier==='n'?'—':S.fmt(Math.round(price*10)/10);
      var g0=feat?FEAT[i]:home();
      P.push({x:0,y:0,vx:0,vy:0,a:0,s:1,tx:0,ty:0,lo:g0[0],la:g0[1],feat:feat,tier:tier,label:label,spr:sprite(tier,label)});
    }
    function park(){P.forEach(function(p){p.x=Math.random()*W;p.y=-Math.random()*H*1.1-60;p.vx=(Math.random()-.5)*60;p.vy=0;p.a=(Math.random()-.5)*.8})}
    function layout(){
      var minx=BOX[0]*cosL,maxx=BOX[2]*cosL,miny=-BOX[3],maxy=-BOX[1];
      var bx0,bx1,by0,by1;
      if(mob){bx0=W*.04;bx1=W*.96;by0=H*.5;by1=H-96}
      else{bx0=W*.4;bx1=W-Math.max(28,W*.025);by0=H*.2;by1=H*.94}
      var k=Math.min((bx1-bx0)/(maxx-minx),(by1-by0)/(maxy-miny));
      var ox=(bx0+bx1)/2-(minx+maxx)/2*k,oy=(by0+by1)/2-(miny+maxy)/2*k;
      var pr=function(lo,la){return [lo*cosL*k+ox,-la*k+oy]};
      P.forEach(function(p){var q=pr(p.lo,p.la);p.tx=q[0];p.ty=q[1]});
      LAB=FEAT.map(function(f,k){var q=pr(f[0],f[1]);return {x:q[0],y:q[1],n:f[2],h:f[3],dir:f[4],price:P[k].label,tier:P[k].tier}});
    }
    function size(){var r=stageEl.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);layout();if(parked)park()}
    function ss(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
    function physics(dt){
      var drop=ss(.02,.1,prog),form=ss(.44,.6,prog),free=1-form;formNow=ss(.5,.68,prog);
      if(prog<.012){if(!parked){parked=true;park()}return}
      parked=false;
      /* Land on the real Earth: every frame, ask the globe where each station's lat/lon is on screen.
         The flat layout above is only the fallback for devices without WebGL. */
      if(G.project&&(G.map||0)>.01){
        /* The globe answers in viewport pixels; this canvas scrolls with the page once unpinned. */
        var top=stageEl.getBoundingClientRect().top;
        for(var q=0;q<N;q++){var pp=P[q],sp=G.project(pp.la,pp.lo);pp.tx=sp[0];pp.ty=sp[1]-top}
        LAB.forEach(function(l,k){var sp=G.project(FEAT[k][1],FEAT[k][0]);l.x=sp[0];l.y=sp[1]-top});
      }
      var gy=2600*drop*free,floor=H-(mob?100:22),R=mob?90:150;
      mspeed*=.86;
      for(var i=0;i<N;i++){
        var p=P[i],hw=p.spr.bw*p.s/2,hh=p.spr.bh*p.s/2;
        if(form>.001){var k=70*form,c=2*Math.sqrt(k)*1.05;p.vx+=(k*(p.tx-p.x)-c*p.vx)*dt;p.vy+=(k*(p.ty-p.y)-c*p.vy)*dt}
        p.vy+=gy*dt;
        var dx=p.x-mx,dy=p.y-my,d=Math.sqrt(dx*dx+dy*dy);
        if(d<R&&d>.1){var f=Math.pow(1-d/R,2)*(3200+mspeed*22);p.vx+=dx/d*f*dt;p.vy+=dy/d*f*dt}
        var air=1-Math.min(.9,(.35+3.5*form)*dt);p.vx*=air;p.vy*=air;
        p.x+=p.vx*dt;p.y+=p.vy*dt;
        var ta=free*Math.max(-.5,Math.min(.5,p.vx*.0018));p.a+=(ta-p.a)*Math.min(1,dt*(form>.5?10:3));
        p.s+=((free+form*.4)-p.s)*Math.min(1,dt*7);
        if(free>.3){
          if(p.y+hh>floor){p.y=floor-hh;if(p.vy>0)p.vy=p.vy>60?-p.vy*.3:0;p.vx*=.86;p.a*=.8}
          if(p.x<hw){p.x=hw;p.vx=Math.abs(p.vx)*.4}else if(p.x>W-hw){p.x=W-hw;p.vx=-Math.abs(p.vx)*.4}
        }
      }
      if(free>.35){
        for(var it=0;it<2;it++)for(var a=0;a<N;a++){var A=P[a];for(var b=a+1;b<N;b++){var B=P[b];
          var ox=(A.spr.bw*A.s+B.spr.bw*B.s)/2-Math.abs(B.x-A.x),oy=(A.spr.bh*A.s+B.spr.bh*B.s)/2-Math.abs(B.y-A.y);
          if(ox>0&&oy>0){
            if(oy<ox){var sy=B.y>A.y?1:-1;A.y-=sy*oy/2;B.y+=sy*oy/2;var vy=(A.vy+B.vy)/2;A.vy=vy;B.vy=vy}
            else{var sx=B.x>A.x?1:-1;A.x-=sx*ox/2;B.x+=sx*ox/2;var vx=(A.vx+B.vx)/2;A.vx=vx;B.vx=vx}
          }
        }}
      }
    }
    function draw(){
      g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
      var dotT=formNow;
      /* Each price pill melts into a small point of its color as it lands on the Earth. */
      for(var i=0;i<N;i++){var p=P[i];if(p.y<-60)continue;
        var sa=1-dotT;
        if(dotT>.01){g.globalAlpha=dotT;var d=DOT*(.6+.4*dotT);g.drawImage(dots[p.tier],p.x-d/2,p.y-d/2,d,d)}
        if(sa>.01){g.globalAlpha=sa;g.save();g.translate(p.x,p.y);g.rotate(p.a);g.scale(p.s,p.s);g.drawImage(p.spr.c,-p.spr.bw/2-2,-p.spr.bh/2-2,p.spr.w,p.spr.h);g.restore()}
      }
      g.globalAlpha=1;
      if(formNow>.3){
        /* The hero's city tags, exactly: a hairline rising from the town, the name in mono beside its
           top. The only addition is the price, in the color that says how good it is. */
        var la=ss(.3,1,formNow),fs=mob?11:12;
        g.font='400 '+fs+'px "Geist Mono",ui-monospace,monospace';g.textBaseline='top';
        LAB.forEach(function(l){
          var h=l.h*la,top=l.y-h,left=l.dir<0;
          g.globalAlpha=la;g.fillStyle='rgba(238,240,245,.42)';g.fillRect(Math.round(l.x),top,1,h);
          var name=l.n+'  ',w1=g.measureText(name).width,w2=g.measureText(l.price).width,x0=left?l.x-7-w1-w2:l.x+7;
          g.textAlign='left';g.fillStyle='#d9dde6';g.fillText(name,x0,top);
          g.fillStyle=TIER_TEXT[l.tier];g.fillText(l.price,x0+w1,top);
        });
        g.globalAlpha=1;
      }
    }
    var tick=function(time,dtms){if(!live)return;var dt=Math.min(.034,dtms/1000);physics(dt/2);physics(dt/2);draw()};
    function move(e){var r=stageEl.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(pmx>-1e3)mspeed=Math.min(60,mspeed+Math.hypot(x-pmx,y-pmy));pmx=x;pmy=y;mx=x;my=y}
    function leave(){mx=my=pmx=pmy=-1e4}
    window.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',leave);
    size();window.addEventListener('resize',size,{passive:true});
    gsap.ticker.add(tick);
    ScrollTrigger.create({trigger:sec,start:'top top',end:function(){return '+='+Math.round(window.innerHeight*2.2)},pin:stageEl,pinSpacing:true,anticipatePin:1,invalidateOnRefresh:true,onUpdate:function(s){prog=s.progress}});
    /* The Earth comes back facing Québec while the prices are still on the floor, then holds as they land. */
    G.mapOf=function(){return ss(.3,.6,prog)};
    /* "gone" waits until the night layer's soft edge (280px) has fully passed over the Earth. */
    G.pinsPast=function(){var r=stageEl.getBoundingClientRect();return {shift:Math.max(0,-r.top),gone:r.bottom<=-300}};
    ScrollTrigger.create({trigger:sec,start:'top bottom',end:'bottom top',onToggle:function(s){live=s.isActive}});
    var cp=lines($$('.pins-copy h2'));gsap.from(cp.lines,{yPercent:110,stagger:.08,duration:1.3,ease:EXPO,scrollTrigger:{trigger:sec,start:'top 70%'}});
    rise($$('.pins-copy .lede,.pins-copy .pins-note'),sec,{scrollTrigger:{trigger:sec,start:'top 70%'}});
    return function(){G.mapOf=null;G.pinsPast=null;gsap.ticker.remove(tick);window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);window.removeEventListener('resize',size)};
  }

  function day(){
    var track=$('#track'),cards=$$('.card',track),bar=$('#day-bar');
    var dist=function(){return Math.max(0,track.scrollWidth-window.innerWidth)};
    var tw=gsap.to(track,{x:function(){return -dist()},ease:'none',scrollTrigger:{trigger:'#day',start:'top top',end:function(){return '+='+dist()},pin:true,scrub:true,invalidateOnRefresh:true,anticipatePin:1,onUpdate:function(s){gsap.set(bar,{scaleX:s.progress})}}});
    headline($('.day-head h2'),'#day');
    rise($$('.day-head .lede'),'#day',{scrollTrigger:{trigger:'#day',start:'top 70%'}});
    gsap.from(cards,{y:60,rotationX:-12,transformPerspective:1000,transformOrigin:'50% 100%',opacity:0,duration:1.3,ease:EXPO,stagger:.07,scrollTrigger:{trigger:'#day',start:'top 60%'}});
    tilt(cards);
    cards.forEach(function(card){
      var kind=card.dataset.card,play;
      if(kind==='alerts'){var n=$$('.nf',card);gsap.set(n,{y:-24,opacity:0,scale:.96});play=function(){gsap.to(n,{y:0,opacity:1,scale:1,duration:1,stagger:.18,ease:EXPO})}}
      if(kind==='fuel'){play=function(){setOdoStr($('#odo'),S.fmt(PRICES[grade]).replace(/\d/g,'0'));requestAnimationFrame(function(){requestAnimationFrame(paintGrade)})}}
      if(kind==='widget'){var w=$('.widget',card);gsap.set(w,{scale:.86,opacity:0,y:20});play=function(){gsap.to(w,{scale:1,opacity:1,y:0,duration:1.1,ease:EXPO})}}
      if(kind==='weather'){var wx=$$('.wx-now,.wx-meta,.wx-hours li',card);gsap.set(wx,{y:14,opacity:0});play=function(){gsap.to(wx,{y:0,opacity:1,duration:.9,stagger:.06,ease:EXPO})}}
      if(kind==='siri'){var wv=$$('.wave i',card),q=$('q',card);gsap.set(q,{opacity:0,filter:'blur(8px)'});play=function(){gsap.to(wv,{scaleY:1,duration:.3,ease:'sine.inOut',stagger:{each:.07,yoyo:true,repeat:5},onComplete:function(){gsap.to(wv,{scaleY:.25,duration:.3})}});gsap.to(q,{opacity:1,filter:'blur(0px)',duration:1,delay:.25,ease:EXPO})}}
      if(kind==='stickers'){var im=$$('img',card);gsap.set(im,{scale:.5,opacity:0});play=function(){gsap.to(im,{scale:1,opacity:1,duration:.7,stagger:.1,ease:'back.out(1.7)'})}}
      /* Cards already on screen when the row pins never cross a horizontal trigger, so they play
         as the section arrives, together with the cards rising in. The rest play as they slide in. */
      if(!play)return;
      if(card.offsetLeft+card.offsetWidth*.3<window.innerWidth)ScrollTrigger.create({trigger:'#day',start:'top 60%',once:true,onEnter:function(){gsap.delayedCall(.35,play)}});
      else ScrollTrigger.create({trigger:card,containerAnimation:tw,start:'left 88%',once:true,onEnter:play});
    });
  }

  /* React Bits' Tilted Card, without React: the card leans toward the cursor on a soft follow.
     Mouse only; touch would fire it on every tap. */
  function tilt(els){
    if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
    els.forEach(function(el){
      var rx=gsap.quickTo(el,'rotationX',{duration:.6,ease:'power3.out'}),ry=gsap.quickTo(el,'rotationY',{duration:.6,ease:'power3.out'});
      gsap.set(el,{transformPerspective:900});
      el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;rx(-y*8);ry(x*10)});
      el.addEventListener('pointerleave',function(){rx(0);ry(0)});
    });
  }

  function statement(){
    var sp=SplitText.create('#stmt',{type:'words'});splits.push(sp);
    gsap.fromTo(sp.words,{opacity:.14},{opacity:1,stagger:.06,ease:'none',scrollTrigger:{trigger:'#stmt',start:'top 82%',end:'bottom 48%',scrub:true}});
    gsap.fromTo('#stmt',{rotate:2.2,transformOrigin:'0% 50%'},{rotate:0,ease:'none',scrollTrigger:{trigger:'#stmt',start:'top bottom',end:'bottom 50%',scrub:true}});
  }

  function numbers(){
    var els=$$('#nums .odo');
    els.forEach(function(el){var n=+el.dataset.n,len=String(n).length;setOdoNum(el,n===0?9:0,len)});
    ScrollTrigger.create({trigger:'#nums',start:'top 85%',once:true,onEnter:function(){
      els.forEach(function(el,i){var n=+el.dataset.n,len=String(n).length,o={v:n===0?9:0};gsap.to(o,{v:n,duration:2.2,delay:i*.12,ease:EXPO,onUpdate:function(){setOdoNum(el,o.v,len)}})});
    }});
    rise($$('#nums>div'),'#nums',{scrollTrigger:{trigger:'#nums',start:'top 85%'}});
  }

  function reveals(){
    ['.all','.faq-head','.beta-copy'].forEach(function(sel){headline($(sel+' h2'),$(sel))});
    rise($$('.faq-head .btn'),'.faq-head');
    gsap.from($$('#fl h3,#fl li'),{y:22,opacity:0,stagger:.022,duration:1,ease:EXPO,scrollTrigger:{trigger:'#fl',start:'top 78%'}});
    gsap.from($$('.qa'),{y:28,opacity:0,stagger:.06,duration:1.1,ease:EXPO,scrollTrigger:{trigger:'#faqlist',start:'top 80%'}});
    gsap.from($$('.vel-row'),{xPercent:function(i){return i?12:-12},opacity:0,duration:1.6,ease:EXPO,scrollTrigger:{trigger:'#brands',start:'top 80%'}});
    velocity();
  }

  /* React Bits' Scroll Velocity, without React: the brand rows speed up and lean with your scroll. */
  function velocity(){
    var rows=$$('.vel-row').map(function(el){return {el:el,dir:+el.dataset.dir,x:0,w:el.scrollWidth/3}});
    var sv=0,v=0,live=false,sign=1;
    ScrollTrigger.create({trigger:'#brands',start:'top bottom',end:'bottom top',onToggle:function(s){live=s.isActive},onUpdate:function(s){v=s.getVelocity()}});
    if(velTick)gsap.ticker.remove(velTick);
    velTick=function(time,dt){
      if(!live)return;
      sv+=(v-sv)*.12;v*=.9;
      var f=Math.max(-6,Math.min(6,sv/700));if(f<-.05)sign=-1;else if(f>.05)sign=1;
      var skew=Math.max(-7,Math.min(7,-sv/320));
      rows.forEach(function(r){
        if(!r.w)r.w=r.el.scrollWidth/3;
        r.x-=r.dir*sign*(dt/1000)*60*(1+Math.abs(f)*1.6);
        r.x=gsap.utils.wrap(-r.w,0,r.x);
        r.el.style.transform='translate3d('+r.x.toFixed(2)+'px,0,0) skewX('+skew.toFixed(2)+'deg)';
      });
    };
    gsap.ticker.add(velTick);
  }

  function beta(){
    betaST=ScrollTrigger.create({trigger:'#beta',start:'top bottom',end:'top top'});
    rise($$('.beta-copy p,.form'),'#beta',{scrollTrigger:{trigger:'#beta',start:'top 60%'}});
  }

  /* Tab highlight: each frame, whichever section crosses the middle of the screen owns the tab.
     Measuring beats waiting for enter/leave callbacks, which Safari with smooth scrolling can skip. */
  var SPY=[['stage','how'],['pins','how'],['brands','feat'],['facts','feat'],['day','feat'],['all','feat'],['faq','faq'],['beta','beta'],['foot','beta']];
  function spyTick(){
    var mid=window.innerHeight*.55,key=null;
    for(var i=0;i<SPY.length;i++){var el=document.getElementById(SPY[i][0]);if(!el)continue;var r=el.getBoundingClientRect();if(r.top<=mid&&r.bottom>mid){key=SPY[i][1];break}}
    /* The opening orbit belongs to no tab; "How it works" starts as the phone arrives. */
    if(key==='how'&&S.anchors.how&&window.scrollY<S.anchors.how()-window.innerHeight*.8)key=null;
    S.setTab(key);
  }
  function spy(){gsap.ticker.remove(spyTick);gsap.ticker.add(spyTick)}

  function teardown(){
    gsap.ticker.remove(syncGlobe);gsap.ticker.remove(spyTick);stageD=null;betaST=null;
    if(velTick){gsap.ticker.remove(velTick);velTick=null}
    if(mm){mm.revert();mm=null}
    splits.forEach(function(s){s.revert()});splits=[];
    if(ctx){ctx.revert();ctx=null}
  }

  /* Language switches rebuild the story in place and keep you in the same section. */
  var keep=null;
  function span(sec){
    var st=S.MOTION&&ScrollTrigger.getAll().find(function(t){return t.pin===sec||(t.pin&&sec.contains(t.pin)&&t.trigger===sec)});
    if(st)return {top:st.start,len:(st.end-st.start)+window.innerHeight};
    return {top:sec.getBoundingClientRect().top+window.scrollY,len:sec.offsetHeight};
  }
  function anchorNow(){var y=window.scrollY,best=null;$$('main>section').forEach(function(sec){var s=span(sec);if(y>=s.top-1&&y<s.top+s.len)best={id:sec.id,p:(y-s.top)/Math.max(1,s.len)}});return best}
  function anchorY(k){var sec=document.getElementById(k.id);if(!sec)return 0;var s=span(sec);return s.top+k.p*s.len}
  S.before.push(function(){keep=anchorNow();if(S.MOTION)teardown()});
  S.after.push(function(){
    render();
    if(S.MOTION){build();ScrollTrigger.refresh();if(keep)S.scrollTo(anchorY(keep),{immediate:true})}
  });

  brands();render();
  window.addEventListener('resize',sizeDevice,{passive:true});
  if(S.MOTION&&'scrollRestoration' in history)history.scrollRestoration='manual';
  var loaded=document.readyState==='complete'?Promise.resolve():new Promise(function(r){window.addEventListener('load',r,{once:true})});
  /* Split text only after the font is in, so lines break where they will really break. */
  var fontsReady=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,1800)})]):Promise.resolve();
  fontsReady.then(function(){
    build();
    if(!S.MOTION){G.go=true;return}
    ScrollTrigger.refresh();
    var h=location.hash.slice(1),deep=['how','day','faq','beta','all'].indexOf(h)>-1;
    /* No loader: the words arrive now, and the Earth rises in behind them whenever it is ready. */
    if(S.intro)S.intro();
    if(!deep)return;
    loaded.then(function(){
      var done=false;
      function jump(){if(done)return;done=true;ScrollTrigger.removeEventListener('refresh',jump);requestAnimationFrame(function(){requestAnimationFrame(function(){S.go(h,{immediate:true})})})}
      ScrollTrigger.addEventListener('refresh',jump);ScrollTrigger.refresh();setTimeout(jump,450);
    });
  });
})();
