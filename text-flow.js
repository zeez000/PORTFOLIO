(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const state=window.textFlow={ready:false,enabled:false};
  if(reduced.matches || !window.gsap || !window.ScrollTrigger){state.ready=true;return;}
  gsap.registerPlugin(ScrollTrigger);
  state.enabled=true;
  const selectors=['.section-head','.project-intro','.about-copy','.terminal','.skill-card','.project-card','.timeline li','.resume-box','.contact-row'];
  selectors.forEach(selector=>{
    gsap.utils.toArray(selector).forEach((el,index)=>{
      gsap.fromTo(el,{y:38,opacity:.18},{y:0,opacity:1,duration:.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true},delay:Math.min(index*.02,.12)});
    });
  });
  gsap.utils.toArray('.section-title').forEach(title=>{
    if(title.dataset.flowReady) return;
    title.dataset.flowReady='1';
    const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const frag=document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part=>{
        if(!part) return;
        if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return;}
        const span=document.createElement('span');span.className='flow-word';span.textContent=part;frag.appendChild(span);
      });
      node.replaceWith(frag);
    });
    const words=title.querySelectorAll('.flow-word');
    gsap.fromTo(words,{yPercent:35,opacity:.16},{yPercent:0,opacity:1,stagger:.035,ease:'none',scrollTrigger:{trigger:title,start:'top 92%',end:'top 54%',scrub:.6}});
  });
  window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
  state.ready=true;
})();