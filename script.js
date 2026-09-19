const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas=document.getElementById("background");
const context=canvas.getContext("2d");
let width=0,height=0,time=0,frameId;
const pointer={x:.72,y:.18};
const nodes=Array.from({length:34},()=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.00011,vy:(Math.random()-.5)*.00011,r:Math.random()*1.4+.55}));
const signals=Array.from({length:4},(_,index)=>({offset:index*.23,speed:.00007+index*.000013}));
function resize(){width=window.innerWidth;height=window.innerHeight;const scale=Math.min(window.devicePixelRatio||1,2);canvas.width=width*scale;canvas.height=height*scale;context.setTransform(scale,0,0,scale,0,0)}
function paintBase(){const glow=context.createRadialGradient(width*(pointer.x*.18+.62),height*(pointer.y*.12+.12),0,width*.7,height*.18,Math.max(width,height)*.78);glow.addColorStop(0,"#1b1745");glow.addColorStop(.42,"#0b1230");glow.addColorStop(1,"#050711");context.fillStyle=glow;context.fillRect(0,0,width,height)}
function drawGrid(){context.save();context.strokeStyle="rgba(135,159,215,.045)";context.lineWidth=1;const step=64;for(let x=(time*12)%step;x<width;x+=step){context.beginPath();context.moveTo(x,0);context.lineTo(x,height);context.stroke()}for(let y=(time*7)%step;y<height;y+=step){context.beginPath();context.moveTo(0,y);context.lineTo(width,y);context.stroke()}context.restore()}
function drawMesh(){nodes.forEach(node=>{node.x+=node.vx;node.y+=node.vy;if(node.x<-.05||node.x>1.05)node.vx*=-1;if(node.y<-.05||node.y>1.05)node.vy*=-1});for(let i=0;i<nodes.length;i++){for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=(a.x-b.x)*width,dy=(a.y-b.y)*height,distance=Math.hypot(dx,dy);if(distance<155){context.beginPath();context.moveTo(a.x*width,a.y*height);context.lineTo(b.x*width,b.y*height);context.strokeStyle=`rgba(103,232,249,${.11*(1-distance/155)})`;context.lineWidth=.7;context.stroke()}}}nodes.forEach(node=>{context.beginPath();context.arc(node.x*width,node.y*height,node.r,0,Math.PI*2);context.fillStyle="rgba(184,244,255,.48)";context.fill()})}
function waveY(x,offset){return height*(.31+offset*.4)+Math.sin(x*.004+time*1.15+offset*8)*23+Math.sin(x*.0015-time*.8)*15}
function drawSignals(){signals.forEach((signal,index)=>{context.beginPath();for(let x=-20;x<=width+20;x+=10){const y=waveY(x,signal.offset);x===-20?context.moveTo(x,y):context.lineTo(x,y)}context.strokeStyle=index%2?"rgba(167,139,250,.15)":"rgba(103,232,249,.14)";context.lineWidth=1;context.stroke();const px=((time*1500*(index+1))% (width+160))-80,py=waveY(px,signal.offset);const halo=context.createRadialGradient(px,py,0,px,py,16);halo.addColorStop(0,index%2?"rgba(196,181,253,.8)":"rgba(165,243,252,.85)");halo.addColorStop(1,"rgba(103,232,249,0)");context.fillStyle=halo;context.beginPath();context.arc(px,py,16,0,Math.PI*2);context.fill()})}
function draw(){time+=.004;context.clearRect(0,0,width,height);paintBase();drawGrid();drawMesh();drawSignals();frameId=requestAnimationFrame(draw)}
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
