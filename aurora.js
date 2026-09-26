(() => {
  'use strict';
  const canvas=document.getElementById('network-background');
  if(!canvas) return;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const toggle=document.querySelector('.aurora-toggle');
  const label=toggle?.querySelector('.aurora-toggle-label');
  const icon=toggle?.querySelector('.aurora-toggle-icon');
  let paused=reduced.matches,raf=0,last=0,w=0,h=0,dpr=1,phase=0;
  let mx=.68,my=.38,tx=.68,ty=.38,lowPower=false,ribbonGradient=null;
  const state=window.silkAurora={ready:false,paused,quality:'full',fps:60};

  function resize(){
    w=innerWidth;h=innerHeight;
    const area=w*h;
    lowPower=area>1800000 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency<=6);
    dpr=Math.min(devicePixelRatio||1,lowPower?0.9:1.15);
    canvas.width=Math.max(1,Math.floor(w*dpr));
    canvas.height=Math.max(1,Math.floor(h*dpr));
    canvas.style.width=w+'px'; canvas.style.height=h+'px';
    state.quality=lowPower?'reduced':'full';
    ribbonGradient=ctx.createLinearGradient(0,0,w,0);
    ribbonGradient.addColorStop(0,'rgba(26,70,165,0)');
    ribbonGradient.addColorStop(.28,'rgba(39,126,255,.42)');
    ribbonGradient.addColorStop(.53,'rgba(94,94,255,.74)');
    ribbonGradient.addColorStop(.76,'rgba(151,78,246,.72)');
    ribbonGradient.addColorStop(1,'rgba(214,84,230,.05)');
    render();
  }

  function base(){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha=1;
    ctx.fillStyle='#050712';
    ctx.fillRect(0,0,w,h);
    const radial=ctx.createRadialGradient(w*.82,h*.32,0,w*.82,h*.32,Math.max(w,h)*.72);
    radial.addColorStop(0,'rgba(57,52,130,.30)');
    radial.addColorStop(.45,'rgba(22,35,96,.15)');
    radial.addColorStop(1,'rgba(5,7,18,0)');
    ctx.fillStyle=radial;ctx.fillRect(0,0,w,h);
  }

  function ribbon(offset,widthScale,alpha,t){
    const points=lowPower?30:44;
    ctx.beginPath();
    for(let i=0;i<=points;i++){
      const p=i/points;
      const x=-w*.12+p*w*1.25;
      const wave=Math.sin(p*5.0-t*.38+offset)*h*.07 + Math.sin(p*11+t*.18+offset*.7)*h*.018;
      const y=h*(.9-p*.66)+wave+offset*h*.07+(mx-.5)*18;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=ribbonGradient;
    ctx.globalAlpha=alpha;
    ctx.lineWidth=Math.max(1,h*widthScale);
    ctx.stroke();
  }

  function render(){
    base();
    ctx.save();
    ctx.globalCompositeOperation='screen';
    const drift=(my-.5)*18;
    ctx.translate((mx-.5)*16,drift);
    if(!lowPower){ctx.filter='blur(16px)';ribbon(-.7,.038,.13,phase);ribbon(.2,.034,.11,phase);ctx.filter='none';}
    const strands=lowPower?8:14;
    for(let b=0;b<3;b++){
      for(let i=0;i<strands;i++){
        const z=(i/(strands-1)-.5)*2;
        const off=(b-1)*.72+z*.22;
        ribbon(off,.0012,.035+Math.abs(z)*.025,phase+b*.35);
      }
    }
    ctx.restore();
    const veil=ctx.createLinearGradient(0,0,w,0);
    veil.addColorStop(0,'rgba(5,7,18,.74)');
    veil.addColorStop(.38,'rgba(5,7,18,.38)');
    veil.addColorStop(.72,'rgba(5,7,18,.08)');
    veil.addColorStop(1,'rgba(5,7,18,.02)');
    ctx.fillStyle=veil;ctx.fillRect(0,0,w,h);
  }

  function loop(now){
    raf=0;
    if(paused||document.hidden||reduced.matches) return;
    const dt=last?Math.min((now-last)/1000,.05):0;
    last=now;
    phase+=dt*.48;
    const ease=1-Math.exp(-dt*3.8);
    mx+=(tx-mx)*ease;my+=(ty-my)*ease;
    render();
    raf=requestAnimationFrame(loop);
  }
  function start(){cancelAnimationFrame(raf);last=0;render();if(!paused&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(loop);}
  function updateToggle(){
    if(!toggle) return;
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.setAttribute('aria-label',paused?'Play Silk Aurora background':'Pause Silk Aurora background');
    if(label)label.textContent=paused?'Motion off':'Motion on';
    if(icon)icon.textContent=paused?'▷':'Ⅱ';
    state.paused=paused;
  }
  toggle?.addEventListener('click',()=>{paused=!paused;updateToggle();start();});
  addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;tx=e.clientX/innerWidth;ty=e.clientY/innerHeight;},{passive:true});
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',start);
  reduced.addEventListener('change',e=>{paused=e.matches;updateToggle();start();});
  addEventListener('pagehide',()=>cancelAnimationFrame(raf));
  resize();updateToggle();start();state.ready=true;
})();