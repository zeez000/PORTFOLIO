const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas=document.getElementById("background");
const context=canvas.getContext("2d");
let width=0,height=0,time=0,frameId;
const dots=Array.from({length:42},()=>({x:Math.random(),y:Math.random(),radius:Math.random()*1.4+.35,speed:Math.random()*.00045+.00016}));
function resize(){width=window.innerWidth;height=window.innerHeight;const scale=Math.min(window.devicePixelRatio||1,2);canvas.width=width*scale;canvas.height=height*scale;context.setTransform(scale,0,0,scale,0,0)}
function draw(){time+=.0035;context.clearRect(0,0,width,height);const glow=context.createRadialGradient(width*.74,height*.14,0,width*.74,height*.14,width*.7);glow.addColorStop(0,"#17133b");glow.addColorStop(1,"#050711");context.fillStyle=glow;context.fillRect(0,0,width,height);for(let i=0;i<4;i++){context.beginPath();for(let x=-30;x<=width+30;x+=10){const y=height*(.22+i*.2)+Math.sin(x*.006+time+i)*25+Math.sin(x*.002-time*1.4)*16;x===-30?context.moveTo(x,y):context.lineTo(x,y)}context.strokeStyle=i%2?"rgba(103,232,249,.10)":"rgba(167,139,250,.13)";context.lineWidth=1;context.stroke()}dots.forEach(dot=>{dot.y-=dot.speed;if(dot.y<0)dot.y=1;context.beginPath();context.arc(dot.x*width,dot.y*height,dot.radius,0,Math.PI*2);context.fillStyle="rgba(103,232,249,.42)";context.fill()});frameId=requestAnimationFrame(draw)}
resize();window.addEventListener("resize",resize);if(!reducedMotion)draw();else{const glow=context.createRadialGradient(width*.74,height*.14,0,width*.74,height*.14,width*.7);glow.addColorStop(0,"#17133b");glow.addColorStop(1,"#050711");context.fillStyle=glow;context.fillRect(0,0,width,height)}

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
document.getElementById("year").textContent=new Date().getFullYear();
window.addEventListener("pagehide",()=>cancelAnimationFrame(frameId));
