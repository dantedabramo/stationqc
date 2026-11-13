/* Support, privacy and terms, rendered from copy.js so both languages stay in step. */
(function(){
  'use strict';
  var S=window.SQC;if(!S)return;
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var page=document.body.dataset.page,ctx=null,splits=[],first=true;

  function render(){
    var t=S.t(),body=$('#doc-body');
    if(page==='support'){
      body.innerHTML='<div class="fixes">'+t.s.map(function(c){return '<section class="fix"><h2>'+c[0]+'</h2><ol>'+c[1].map(function(x){return '<li>'+x+'</li>'}).join('')+'</ol></section>'}).join('')+'</div>'+
        '<div class="more"><a class="btn btn-glass glass" href="index.html#faq">'+t.nfaq+'</a><a class="btn btn-glass glass" href="privacy.html">'+t.np+'</a><a class="btn btn-glass glass" href="terms.html">'+t.nt+'</a></div>';
    }else{
      var arr=page==='privacy'?t.P:t.T;
      body.innerHTML='<div class="legal"><nav class="toc glass" aria-label="'+t.toc+'"><p>'+t.toc+'</p><div class="toc-in"><span class="mark" aria-hidden="true"></span><ol>'+
        arr.map(function(s,i){return '<li><a href="#s'+(i+1)+'" data-s="'+i+'">'+s[0]+'</a></li>'}).join('')+'</ol></div></nav><article>'+
        arr.map(function(s,i){return '<section id="s'+(i+1)+'"><h2><em>'+(i<9?'0':'')+(i+1)+'</em><span>'+s[0]+'</span></h2><p>'+s[1]+'</p></section>'}).join('')+'</article></div>';
    }
  }

  /* The contents marker slides to the section you are reading. */
  var markY={y:0,h:0},lockUntil=0;
  function mark(i,force){
    if(!force&&performance.now()<lockUntil)return;
    var links=$$('.toc a'),m=$('.toc .mark');if(!m||!links[i])return;
    links.forEach(function(a,k){a.classList.toggle('on',k===i)});
    var a=links[i],y=a.offsetTop,h=a.offsetHeight;
    if(!S.hasGsap||S.reduced||!markY.h){markY.y=y;markY.h=h;m.style.transform='translateY('+y+'px)';m.style.height=h+'px';return}
    gsap.to(markY,{y:y,h:h,duration:.55,ease:'expo.out',onUpdate:function(){m.style.transform='translateY('+markY.y.toFixed(1)+'px)';m.style.height=markY.h.toFixed(1)+'px'}});
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('.toc a');if(!a)return;
    e.preventDefault();var el=document.getElementById(a.getAttribute('href').slice(1));
    /* The marker follows your click; sections near the end can't scroll high enough to become active. */
    mark(+a.dataset.s,true);lockUntil=performance.now()+1900;
    if(el)S.scrollTo(el.getBoundingClientRect().top+window.scrollY-96);
  });

  function build(){
    if(!$('.toc'))return;
    if(!S.hasGsap){mark(0);return}
    ctx=gsap.context(function(){
      $$('.legal section').forEach(function(sec,i){
        ScrollTrigger.create({trigger:sec,start:'top 45%',end:'bottom 45%',onToggle:function(s){if(s.isActive)mark(i)}});
      });
      if(S.MOTION){
        var h=SplitText.create('.doc-hero h1',{type:'words',mask:'words'});splits.push(h);gsap.set('.doc-hero h1',{visibility:'visible'});
        if(first){
          gsap.from(h.words,{yPercent:115,duration:1.2,ease:'expo.out',stagger:.07,delay:.15});
          gsap.from('.back,.doc-hero .lede,.doc-hero .up',{y:14,opacity:0,duration:1,ease:'expo.out',stagger:.08,delay:.35});
          gsap.from('.toc',{x:-16,opacity:0,duration:1,ease:'expo.out',delay:.5});
        }
        $$('.legal section,.fix,.more').forEach(function(el){
          gsap.from(el,{y:36,opacity:0,duration:1,ease:'expo.out',scrollTrigger:{trigger:el,start:'top 88%'}});
        });
      }
    });
    mark(0);
  }
  function buildSupport(){
    if(!S.MOTION||page!=='support')return;
    ctx=gsap.context(function(){
      var h=SplitText.create('.doc-hero h1',{type:'words',mask:'words'});splits.push(h);gsap.set('.doc-hero h1',{visibility:'visible'});
      if(first){
        gsap.from(h.words,{yPercent:115,duration:1.2,ease:'expo.out',stagger:.07,delay:.15});
        gsap.from('.back,.doc-hero .lede',{y:14,opacity:0,duration:1,ease:'expo.out',stagger:.08,delay:.35});
      }
      gsap.from('.fix',{y:28,opacity:0,duration:1,ease:'expo.out',stagger:.07,delay:first?.4:0});
      gsap.from('.more .btn',{y:16,opacity:0,duration:.9,ease:'expo.out',stagger:.06,scrollTrigger:{trigger:'.more',start:'top 92%'}});
    });
  }
  function teardown(){splits.forEach(function(s){s.revert()});splits=[];if(ctx){ctx.revert();ctx=null};markY.h=0}
  S.before.push(teardown);
  S.after.push(function(){render();if(page==='support')buildSupport();else build();if(S.hasGsap)ScrollTrigger.refresh()});

  render();
  var fontsReady=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,1800)})]):Promise.resolve();
  fontsReady.then(function(){if(page==='support')buildSupport();else build();first=false;if(S.hasGsap)ScrollTrigger.refresh()});
  window.addEventListener('load',function(){if(S.hasGsap)ScrollTrigger.refresh()});
})();
