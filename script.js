const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas=document.getElementById("background");
const context=canvas.getContext("2d");
let width=0,height=0,time=0,frameId;
const pointer={x:.72,y:.18};
const stars=Array.from({length:70},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.25+.2,depth:Math.random()*.65+.2,phase:Math.random()*Math.PI*2}));
function resize(){width=window.innerWidth;height=window.innerHeight;const scale=Math.min(window.devicePixelRatio||1,2);canvas.width=width*scale;canvas.height=height*scale;context.setTransform(scale,0,0,scale,0,0)}
function paintBase(){context.fillStyle="#000000";context.fillRect(0,0,width,height);const aurora=context.createRadialGradient(width*(.22+pointer.x*.18),height*(.16+pointer.y*.08),0,width*.25,height*.18,width*.72);aurora.addColorStop(0,"rgba(86,238,255,.16)");aurora.addColorStop(.42,"rgba(83,129,255,.07)");aurora.addColorStop(1,"rgba(83,129,255,0)");context.fillStyle=aurora;context.fillRect(0,0,width,height)}
function drawHorizon(){context.save();context.translate(width*.72,height*.55);context.rotate(-.1);for(let i=0;i<16;i++){const radius=90+i*i*18;context.beginPath();context.ellipse(0,0,radius,radius*.29,0,0,Math.PI*2);context.strokeStyle=`rgba(151,145,255,${.15-i*.008})`;context.lineWidth=.8;context.stroke()}context.restore()}
function drawStars(){stars.forEach(star=>{const shimmer=.25+Math.sin(time*1.4+star.phase)*.22;const x=star.x*width+(pointer.x-.5)*star.depth*18;const y=star.y*height+(pointer.y-.5)*star.depth*12;context.beginPath();context.arc(x,y,star.r,0,Math.PI*2);context.fillStyle=`rgba(213,239,255,${shimmer})`;context.fill()})}
function drawAurora(){for(let layer=0;layer<3;layer++){context.beginPath();for(let x=-30;x<=width+30;x+=9){const y=height*(.28+layer*.19)+Math.sin(x*.0028+time*.7+layer*2.1)*48+Math.cos(x*.006-time*.55)*22;x===-30?context.moveTo(x,y):context.lineTo(x,y)}context.strokeStyle=layer===1?"rgba(103,232,249,.15)":"rgba(167,139,250,.12)";context.lineWidth=1.2;context.shadowBlur=14;context.shadowColor=layer===1?"rgba(103,232,249,.33)":"rgba(167,139,250,.25)";context.stroke();context.shadowBlur=0}}
function draw(){time+=.004;context.clearRect(0,0,width,height);paintBase();drawHorizon();drawStars();drawAurora();frameId=requestAnimationFrame(draw)}
resize();window.addEventListener("resize",resize);window.addEventListener("pointermove",event=>{pointer.x=event.clientX/width;pointer.y=event.clientY/height},{passive:true});if(!reducedMotion)draw();else paintBase();

const nav=document.querySelector("[data-nav]");
const toggle=document.querySelector(".menu-toggle");
const navLinks=[...document.querySelectorAll(".nav nav a")];
toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));toggle.querySelector(".sr-only").textContent=open?"Close navigation":"Open navigation"});
navLinks.forEach(link=>link.addEventListener("click",()=>{nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");toggle.querySelector(".sr-only").textContent="Open navigation"}));
const sections=navLinks.map(link=>document.querySelector(link.getAttribute("href"))).filter(Boolean);
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(link=>link.classList.toggle("active",link.getAttribute("href")==="#"+entry.target.id))}})},{rootMargin:"-35% 0px -55% 0px",threshold:0});
sections.forEach(section=>observer.observe(section));
window.addEventListener("scroll",()=>nav.classList.toggle("scrolled",window.scrollY>25),{passive:true});
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");revealObserver.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(element=>revealObserver.observe(element));

const toast=document.querySelector(".toast");let toastTimer;
function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),1600)}
document.querySelectorAll(".copy-value").forEach(link=>link.addEventListener("click",async event=>{event.preventDefault();const value=link.dataset.copy;try{await navigator.clipboard.writeText(value);showToast(`${link.dataset.label} copied`)}catch{const area=document.createElement("textarea");area.value=value;area.style.position="fixed";area.style.opacity="0";document.body.append(area);area.select();document.execCommand("copy");area.remove();showToast(`${link.dataset.label} copied`)}}));
if(!reducedMotion){document.querySelectorAll(".skill-card,.project-card").forEach(card=>{card.addEventListener("pointermove",event=>{const box=card.getBoundingClientRect();const x=(event.clientX-box.left)/box.width;const y=(event.clientY-box.top)/box.height;card.style.setProperty("--pointer-x",`${x*100}%`);card.style.setProperty("--pointer-y",`${y*100}%`);card.style.setProperty("--tilt-x",`${(x-.5)*5}deg`);card.style.setProperty("--tilt-y",`${(0.5-y)*5}deg`)});card.addEventListener("pointerleave",()=>{card.style.setProperty("--tilt-x","0deg");card.style.setProperty("--tilt-y","0deg")})})}
document.getElementById("year").textContent=new Date().getFullYear();
window.addEventListener("pagehide",()=>cancelAnimationFrame(frameId));
