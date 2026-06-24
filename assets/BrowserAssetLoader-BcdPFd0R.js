(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();class le{constructor(e){this.device=e,this.textures=new Map}acquire(e,t){const n=this.textures.get(e);if(n&&n.width===t.size.width&&n.height===t.size.height&&n.format===t.format)return n;n&&n.destroy();const i=this.device.createTexture({label:e,...t});return this.textures.set(e,i),i}get(e){return this.textures.get(e)}createDetached(e){return this.device.createTexture(e)}destroyKey(e){const t=this.textures.get(e);t&&(t.destroy(),this.textures.delete(e))}destroyAll(){for(const e of this.textures.values())e.destroy();this.textures.clear()}}function q(r,e,t=0){for(let n=0;n<3;n++)e[t+n*4+0]=r[0*3+n],e[t+n*4+1]=r[1*3+n],e[t+n*4+2]=r[2*3+n],e[t+n*4+3]=0;return e}function H({width:r,height:e,pixelAspect:t,timeSeconds:n,frameIndex:i,globalSeed:s,simDt:a,debugMode:o}){const l=new Float32Array(8);return l[0]=r,l[1]=e,l[2]=t??1,l[3]=n??0,l[4]=i??0,l[5]=s??0,l[6]=a,l[7]=o??0,l}function O({forward:r,inverse:e,normalDir:t,enabled:n,simResolution:i,worldNormal:s,aspect:a}){const o=new Float32Array(32);return q(r,o,0),q(e,o,12),o[24]=t?.dx??0,o[25]=t?.dy??0,o[26]=n?1:0,o[27]=i??256,o[28]=s?.x??0,o[29]=s?.y??0,o[30]=s?.z??1,o[31]=a??1,o}function ue(r){const e=new Float32Array(Math.max(1,r.length)*16);return r.forEach((t,n)=>{const i=n*16;e[i+0]=t.surfaceUV.u??t.surfaceUV.x??0,e[i+1]=t.surfaceUV.v??t.surfaceUV.y??0,e[i+2]=t.birthFrame??0,e[i+3]=t.dropSize??1,e[i+4]=t.responseIndex??0,e[i+5]=t.incomingVelocity??1,e[i+6]=t.responseSeed>>>0,e[i+7]=t.visualGain??1,e[i+8]=t.heightOv??1,e[i+9]=t.widthOv??1,e[i+10]=t.bounceOv??1,e[i+11]=t.spreadOv??1,e[i+12]=t.lifetimeOv??15,e[i+13]=t.rippleImpulse??.3,e[i+14]=t.wetnessDeposit??.5,e[i+15]=t.waterDeposit??.2}),e}function j({encode:r}){const e=new Float32Array(4);return e[0]=r?1:0,e}function ce({baseFlow:r,bias:e}){const t=new Float32Array(4);return t[0]=r?.x??0,t[1]=r?.y??0,t[2]=e?.x??0,t[3]=e?.y??0,t}function de(r){const e=new Float32Array(4);return e[0]=r?.amount??0,e[1]=r?.speed??.25,e[2]=r?.width??.01,e[3]=r?.meander??.5,e}const R=128,fe=32;function pe(r=1){const e=new Float32Array(R*8);let t=r*2654435761>>>0;const n=()=>(t=t*1664525+1013904223>>>0,t/4294967296);for(let i=0;i<R;i++){const s=i*8;e[s]=n(),e[s+1]=n()*.4,e[s+2]=0,e[s+3]=0,e[s+4]=n(),e[s+5]=n()*1e3}return e}const me=[{uuid:"ebbbeb3b-4bc5-4eca-9915-c34ac0636cb9",aeDiskId:1e3,id:"globalSeed",name:"Global Seed",section:"Global",type:"int",default:1337,min:0,max:1e6,step:1,historyAffecting:!0},{uuid:"827e49ea-400f-448d-8d2a-0e4b28fcc922",aeDiskId:1001,id:"debugMode",name:"Debug View",section:"Global",type:"enum",default:0,min:0,max:8,step:1,wgsl:"debugMode",options:["Off","Surface UV","Impact IDs","Wetness","Relief","Flow","Pool","Ripple","Mask"]},{uuid:"169396c0-910c-4621-82e0-9b3b64b7fa8d",aeDiskId:1002,id:"visualGain",name:"Overall Visual Gain",section:"Global",type:"float",default:1,min:0,max:4,step:.01,wgsl:"visualGain"},{uuid:"aa8881f8-c7b4-4977-8be2-d4818c9c6770",aeDiskId:1003,id:"rainDensity",name:"Rain Density",section:"Rain",type:"float",default:.5,min:0,max:1,step:.001,historyAffecting:!0},{uuid:"e181e7b5-4bea-4edf-9ff2-02c2534d8bfd",aeDiskId:1004,id:"dropSizeMin",name:"Drop Size Min",section:"Rain",type:"float",default:.4,min:.05,max:2,step:.01,historyAffecting:!0},{uuid:"6d4d2419-9857-438c-9162-053d4da1887d",aeDiskId:1005,id:"dropSizeMax",name:"Drop Size Max",section:"Rain",type:"float",default:1,min:.05,max:4,step:.01,historyAffecting:!0},{uuid:"866b6658-7f72-4c8e-a440-d40df4e35b15",aeDiskId:1006,id:"impactVelocity",name:"Impact Velocity",section:"Rain",type:"float",default:1,min:0,max:4,step:.01,wgsl:"impactVelocity"},{uuid:"f31b99fd-616c-4170-9ec5-195e59e46f6b",aeDiskId:1007,id:"splashHeight",name:"Splash Height",section:"Splash",type:"float",default:.8,min:0,max:6,step:.01,wgsl:"splashHeight"},{uuid:"ee79d005-2ee9-47ca-8578-d5b2ffeb5bf7",aeDiskId:1008,id:"splashWidth",name:"Splash Width",section:"Splash",type:"float",default:.7,min:0,max:6,step:.01,wgsl:"splashWidth"},{uuid:"01e67761-19a4-438d-b2d9-c4839187e0ed",aeDiskId:1009,id:"bounce",name:"Bounce",section:"Splash",type:"float",default:.4,min:0,max:2,step:.01,wgsl:"bounce"},{uuid:"280239e7-4e1d-4a53-95f5-f67b11f75612",aeDiskId:1010,id:"spread",name:"Ejecta Spread",section:"Splash",type:"float",default:1.4,min:0,max:4,step:.01,wgsl:"spread"},{uuid:"6785a040-1dd4-4983-9de8-d8e1de588c77",aeDiskId:1011,id:"lifetime",name:"Lifetime",section:"Splash",type:"float",default:1,min:.1,max:4,step:.01,wgsl:"lifetime"},{uuid:"8886e956-a828-44ae-b635-0b5a7f4f5b8c",aeDiskId:1012,id:"wetnessDeposit",name:"Wetness Deposit",section:"Wet State",type:"float",default:1,min:0,max:4,step:.01,historyAffecting:!0},{uuid:"f6712f59-a785-454f-b4a0-b2f450f2a291",aeDiskId:1013,id:"flowSpeed",name:"Flow Speed",section:"Wet State",type:"float",default:1,min:0,max:4,step:.01,historyAffecting:!0,wgsl:"flowSpeed"},{uuid:"aad832c9-5ae2-4c9a-a543-5c270de5b81e",aeDiskId:1014,id:"evaporation",name:"Evaporation",section:"Wet State",type:"float",default:.15,min:0,max:2,step:.01,historyAffecting:!0,wgsl:"evaporation"},{uuid:"73215537-c432-41c1-837a-5e9f98920bf8",aeDiskId:1015,id:"reliefHeight",name:"Relief Height",section:"Relief",type:"float",default:1,min:0,max:4,step:.01,historyAffecting:!0,wgsl:"reliefHeight"},{uuid:"d68aa46a-3cae-4cd6-9489-d19ac5ed4d6b",aeDiskId:1016,id:"reliefSoftness",name:"Relief Softness",section:"Relief",type:"float",default:.08,min:.001,max:.5,step:.001,historyAffecting:!0,wgsl:"reliefSoftness"},{uuid:"1e20fa2a-a8c8-42dd-a4fc-0c582c4b884a",aeDiskId:1017,id:"flowDeflection",name:"Flow Deflection",section:"Relief",type:"float",default:1,min:0,max:4,step:.01,historyAffecting:!0,wgsl:"flowDeflection"},{uuid:"4f9ba7c5-2aa6-4470-a945-fb77bb9a0ff2",aeDiskId:1018,id:"boundaryWrap",name:"Boundary Wrap",section:"Relief",type:"float",default:1,min:0,max:4,step:.01,historyAffecting:!0,wgsl:"boundaryWrap"},{uuid:"b6dc5be1-1cbb-4532-936d-508e70e38663",aeDiskId:1019,id:"wetDarkening",name:"Wet Darkening",section:"Look",type:"float",default:.75,min:0,max:1.5,step:.01,wgsl:"wetDarkening"},{uuid:"c7813214-3b22-4318-808a-feff01ab8a0f",aeDiskId:1020,id:"saturationShift",name:"Saturation Shift",section:"Look",type:"float",default:.25,min:-1,max:1,step:.01,wgsl:"saturationShift"},{uuid:"b3e44e59-8641-4e35-b623-0f353c368a20",aeDiskId:1021,id:"specularGain",name:"Specular Amount",section:"Look",type:"float",default:1.4,min:0,max:4,step:.01,wgsl:"specularGain"},{uuid:"01c6e123-2fc6-4ff0-a2b4-4e3901359347",aeDiskId:1022,id:"specularWidth",name:"Specular Width",section:"Look",type:"float",default:.4,min:.01,max:2,step:.01,wgsl:"specularWidth"},{uuid:"e79f5bd6-f36e-4713-a81b-b8a8876600ac",aeDiskId:1023,id:"specularDirection",name:"Specular Direction",section:"Look",type:"float",default:.7,min:-3.14159,max:3.14159,step:.01,wgsl:"specularDirection"},{uuid:"4be1ca07-158e-477c-b78c-e4b971e71ce3",aeDiskId:1024,id:"microNormalStrength",name:"Micro-Normal Strength",section:"Look",type:"float",default:.35,min:0,max:2,step:.01,wgsl:"microNormalStrength"},{uuid:"d5dfc666-6139-4475-b845-2db2ac246685",aeDiskId:1025,id:"flowStreakStrength",name:"Flow-Streak Strength",section:"Look",type:"float",default:.15,min:0,max:2,step:.01,wgsl:"flowStreakStrength"},{uuid:"07961019-50a9-4f3e-83b2-64ea4bf2a7e4",aeDiskId:1026,id:"rippleNormalStrength",name:"Ripple-Normal Strength",section:"Look",type:"float",default:1,min:0,max:2,step:.01,wgsl:"rippleNormalStrength"},{uuid:"833d8fd3-ae73-453b-a403-89029f7d37af",aeDiskId:1027,id:"poolHighlight",name:"Pool Highlight",section:"Look",type:"float",default:.7,min:0,max:2,step:.01,wgsl:"poolHighlight"},{uuid:"09610d9c-068d-4250-b2fb-a54a6cc36248",aeDiskId:1028,id:"distortion",name:"Distortion Amount",section:"Look",type:"float",default:.5,min:0,max:2,step:.01,wgsl:"distortion"},{uuid:"4ae59814-752d-40cc-a960-c2e3b6197ab1",aeDiskId:1029,id:"edgeBead",name:"Edge Bead Amount",section:"Look",type:"float",default:.4,min:0,max:2,step:.01,wgsl:"edgeBead"},{uuid:"b7c1e2a4-9f33-4d51-8e60-1a2b3c4d5e6f",aeDiskId:1030,id:"dropletScale",name:"Droplet Scale",section:"Splash",type:"float",default:1.6,min:0,max:6,step:.01,wgsl:"dropletScale"},{uuid:"c8d2f3b5-a044-4e62-9f71-2b3c4d5e6f70",aeDiskId:1031,id:"waterLevel",name:"Water Level",section:"Look",type:"float",default:.35,min:0,max:1,step:.01,wgsl:"waterLevel"},{uuid:"d9e3a4c6-b155-4f73-a082-3c4d5e6f7081",aeDiskId:1032,id:"puddleAmount",name:"Puddle Amount",section:"Look",type:"float",default:.6,min:0,max:1,step:.01,wgsl:"puddleAmount"},{uuid:"e0f4b5d7-c266-4a84-b193-4d5e6f708192",aeDiskId:1033,id:"puddleScale",name:"Puddle Scale",section:"Look",type:"float",default:3.5,min:.5,max:16,step:.1,wgsl:"puddleScale"},{uuid:"f1a5c6e8-d377-4b95-c2a4-5e6f70819203",aeDiskId:1034,id:"puddleEdge",name:"Puddle Edge",section:"Look",type:"float",default:.5,min:0,max:1,step:.01,wgsl:"puddleEdge"},{uuid:"a2b6d7f9-e488-4ca6-d3b5-6f7081920314",aeDiskId:1035,id:"rippleScale",name:"World / Ripple Scale",section:"Splash",type:"float",default:1,min:.2,max:4,step:.01,wgsl:"rippleScale"}],te={params:me},zr=te,D=te.params,re=new Map(D.map(r=>[r.id,r])),he=new Map(D.map(r=>[r.uuid,r]));function $r(r){return re.get(r)}function qr(r){return he.get(r)}const W=D.filter(r=>r.wgsl).map(r=>r.id);class Y{constructor(e={}){this.values=new Map;for(const t of D)this.values.set(t.id,t.default);this.applyOverrides(e)}get(e){return this.values.get(e)}set(e,t){const n=re.get(e);if(!n)return!1;let i=Number(t);return Number.isNaN(i)?!1:((n.type==="int"||n.type==="enum")&&(i=Math.round(i)),i=Math.min(n.max,Math.max(n.min,i)),this.values.set(e,i),!0)}applyOverrides(e){for(const[t,n]of Object.entries(e||{}))this.set(t,n)}toObject(){return Object.fromEntries(this.values)}historyHash(){const e=[];for(const t of D)t.historyAffecting&&e.push(`${t.id}=${this.values.get(t.id)}`);return e.join("|")}packUniform(){const e=new Float32Array(W.length);return W.forEach((t,n)=>{e[n]=this.values.get(t)}),e}}function ge(r){const[e,t,n,i]=r,s=t.x-n.x,a=i.x-n.x,o=e.x-t.x+n.x-i.x,l=t.y-n.y,u=i.y-n.y,c=e.y-t.y+n.y-i.y;let f,m,d,p,g,h,v,w;const x=1e-12;if(Math.abs(o)<x&&Math.abs(c)<x)f=t.x-e.x,m=n.x-t.x,d=e.x,p=t.y-e.y,g=n.y-t.y,h=e.y,v=0,w=0;else{const b=s*u-l*a;v=(o*u-a*c)/b,w=(s*c-l*o)/b,f=t.x-e.x+v*t.x,m=i.x-e.x+w*i.x,d=e.x,p=t.y-e.y+v*t.y,g=i.y-e.y+w*i.y,h=e.y}return[f,m,d,p,g,h,v,w,1]}function ve(r){const[e,t,n,i,s,a,o,l,u]=r,c=s*u-a*l,f=-(i*u-a*o),m=i*l-s*o,d=e*c+t*f+n*m;if(Math.abs(d)<1e-14)return null;const p=1/d;return[c*p,(n*l-t*u)*p,(t*a-n*s)*p,f*p,(e*u-n*o)*p,(n*i-e*a)*p,m*p,(t*o-e*l)*p,(e*s-t*i)*p]}function E(r,e,t){const n=r[0]*e+r[1]*t+r[2],i=r[3]*e+r[4]*t+r[5],s=r[6]*e+r[7]*t+r[8];return[n/s,i/s]}function B(r,e,t,n){return r*n-e*t}function X(r,e,t,n){const i=B(n.x-t.x,n.y-t.y,r.x-t.x,r.y-t.y),s=B(n.x-t.x,n.y-t.y,e.x-t.x,e.y-t.y),a=B(e.x-r.x,e.y-r.y,t.x-r.x,t.y-r.y),o=B(e.x-r.x,e.y-r.y,n.x-r.x,n.y-r.y);return i>0!=s>0&&a>0!=o>0}function we(r){let e=0;for(let t=0;t<4;t++){const n=r[t],i=r[(t+1)%4];e+=n.x*i.y-i.x*n.y}return e/2}function ne(r){const e=[];if(!r||r.length!==4)return{forward:null,inverse:null,valid:!1,warnings:["quad must have 4 corners"]};const t=we(r);Math.abs(t)<1e-6&&e.push("near-zero quad area"),t<0&&e.push("inverted winding (corners may be reversed)"),(X(r[0],r[1],r[2],r[3])||X(r[1],r[2],r[3],r[0]))&&e.push("self-intersecting (bowtie) quad");for(const a of r)if(a.x<-2||a.x>3||a.y<-2||a.y>3){e.push("extreme corner coordinate (far outside the plate)");break}const n=ge(r),i=ve(n);i||e.push("singular / ill-conditioned matrix");const s=i!=null&&!e.includes("self-intersecting (bowtie) quad")&&!e.includes("near-zero quad area");return{forward:n,inverse:i,valid:s,warnings:e}}function be(r){const e=(r.calibrationQuad||[]).map(n=>Array.isArray(n)?{x:n[0],y:n[1]}:n),t=ne(e);return{forward:t.forward,inverse:t.inverse,valid:t.valid,warnings:t.warnings,surfaceToImage:(n,i)=>E(t.forward,n,i),imageToSurface:(n,i)=>t.inverse?E(t.inverse,n,i):[NaN,NaN]}}function L(r){let e=r.worldNormal;if(!e||e.x===0&&e.y===0&&e.z===0){const n=r.normalDirection??-1.5708;e={x:Math.cos(n),y:-Math.sin(n),z:.9}}const t=Math.hypot(e.x,e.y,e.z)||1;return{x:e.x/t,y:e.y/t,z:e.z/t}}function xe(r){const e=(r.calibrationQuad||[]).map(s=>Array.isArray(s)?{x:s[0],y:s[1]}:s);if(e.length!==4)return 1;const t=(s,a)=>Math.hypot(a.x-s.x,a.y-s.y),n=(t(e[0],e[1])+t(e[3],e[2]))/2,i=(t(e[0],e[3])+t(e[1],e[2]))/2;return i<1e-5?1:Math.min(8,Math.max(.125,n/i))}function ye(r){const e=L(r),t=r.normalScale??.04;return{dx:e.x*t,dy:-e.y*t}}function N(r,e,t){let n=!1;for(let i=0,s=t.length-1;i<t.length;s=i++){const a=t[i].u??t[i][0],o=t[i].v??t[i][1],l=t[s].u??t[s][0],u=t[s].v??t[s][1];o>e!=u>e&&r<(l-a)*(e-o)/(u-o)+a&&(n=!n)}return n}function Se(r,e,t,n={}){const{feather:i=0,cutouts:s=[]}=n,a=new Uint8Array(e*t);if(!r||r.length<3)return a;const o=(s||[]).filter(u=>u&&u.length>=3);for(let u=0;u<t;u++){const c=(u+.5)/t;for(let f=0;f<e;f++){const m=(f+.5)/e;let d=N(m,c,r);if(d){for(let p=0;p<o.length;p++)if(N(m,c,o[p])){d=!1;break}}a[u*e+f]=d?255:0}}const l=Math.round(Math.max(0,Math.min(1,i))*Math.min(e,t)*.06);return l>0?_e(a,e,t,l):Ue(a,e,t)}function _e(r,e,t,n){const i=2*n+1,s=new Float32Array(e*t);for(let o=0;o<t;o++){const l=o*e;let u=0;for(let c=0;c<=n&&c<e;c++)u+=r[l+c];for(let c=0;c<e;c++){s[l+c]=u/i;const f=c+n+1,m=c-n;f<e&&(u+=r[l+f]),m>=0&&(u-=r[l+m])}}const a=new Uint8Array(e*t);for(let o=0;o<e;o++){let l=0;for(let u=0;u<=n&&u<t;u++)l+=s[u*e+o];for(let u=0;u<t;u++){a[u*e+o]=Math.round(Math.min(255,l/i));const c=u+n+1,f=u-n;c<t&&(l+=s[c*e+o]),f>=0&&(l-=s[f*e+o])}}return a}function Ue(r,e,t){const n=new Uint8Array(e*t);for(let i=0;i<t;i++)for(let s=0;s<e;s++){let a=0,o=0;for(let l=-1;l<=1;l++)for(let u=-1;u<=1;u++){const c=s+u,f=i+l;c<0||f<0||c>=e||f>=t||(a+=r[f*e+c],o++)}n[i*e+s]=Math.round(a/o)}return n}const M=r=>({x:r.u??r.x,y:r.v??r.y}),ie=r=>({u:r.u??r.x,v:r.v??r.y});function Hr(r){const e=(r||[]).map(ie);return e.length!==4?null:{rows:2,grid:[[e[0],e[1]],[e[3],e[2]]],blend:.5}}function jr(r,e=.5){const t=r.grid.map(l=>l.map(ie)),n=t.length,i=Math.min(n-2,Math.max(0,Math.floor(e*(n-1)))),s=e*(n-1)-i,a=(l,u,c)=>({u:l.u+(u.u-l.u)*c,v:l.v+(u.v-l.v)*c}),o=[a(t[i][0],t[i+1][0],s),a(t[i][1],t[i+1][1],s)];return t.splice(i+1,0,o),{...r,rows:t.length,grid:t}}function Te(r){const e=[];for(let t=0;t<r.length-1;t++){const n=r[t][0],i=r[t][1],s=r[t+1][1],a=r[t+1][0];e.push(ne([M(n),M(i),M(s),M(a)]).forward)}return e}function Ie(r,{segU:e=24,segV:t=24,blend:n=0}={}){const i=Te(r),s=i.length,a=e+1,o=t+1,l=new Float32Array(a*o*2),u=new Float32Array(a*o*2),c=(d,p,g)=>E(i[d],p,g);for(let d=0;d<=t;d++){const p=d/t,g=Math.min(s-1e-6,Math.max(0,p*s)),h=Math.min(s-1,Math.floor(g)),v=g-h;for(let w=0;w<=e;w++){const x=w/e;let[b,y]=c(h,x,v);if(n>0&&s>1){const U=.5*n;if(v<U&&h>0){const[V,A]=c(h-1,x,1+v),T=K(0,1,(U-v)/(2*U));b=b+(V-b)*T,y=y+(A-y)*T}else if(v>1-U&&h<s-1){const[V,A]=c(h+1,x,v-1),T=K(0,1,(v-(1-U))/(2*U));b=b+(V-b)*T,y=y+(A-y)*T}}const P=(d*a+w)*2;l[P]=b,l[P+1]=y,u[P]=x,u[P+1]=p}}const f=new Uint32Array(e*t*6);let m=0;for(let d=0;d<t;d++)for(let p=0;p<e;p++){const g=d*a+p,h=g+1,v=g+a,w=v+1;f[m++]=g,f[m++]=v,f[m++]=h,f[m++]=h,f[m++]=v,f[m++]=w}return{positions:l,uvs:u,indices:f,cols:a,rows:o}}function K(r,e,t){const n=Math.min(1,Math.max(0,(t-r)/(e-r)));return n*n*(3-2*n)}function ke(r){return!!(r&&r.warp&&r.warp.grid&&r.warp.grid.length>2)}function De(r,e,t){let n=1/0;for(let i=0,s=t.length-1;i<t.length;s=i++){const a=t[s].u,o=t[s].v,l=t[i].u,u=t[i].v,c=l-a,f=u-o,m=c*c+f*f||1e-9;let d=((r-a)*c+(e-o)*f)/m;d=Math.min(1,Math.max(0,d));const p=a+d*c,g=o+d*f,h=Math.hypot(r-p,e-g);h<n&&(n=h)}return N(r,e,t)?-n:n}function Pe(r,e,t){const n=t.center,i=t.radius,s=t.rotation??0,a=Math.cos(-s),o=Math.sin(-s),l=(r-n.u)*a-(e-n.v)*o,u=(r-n.u)*o+(e-n.v)*a;return(Math.hypot(l/i.u,u/i.v)-1)*Math.min(i.u,i.v)}function Be(r,e,t){return t.type==="ellipse"?Pe(r,e,t):De(r,e,t.points||[])}function Me(r,e,t){const n=Re((e- -r)/e),i=n*n*(3-2*n);switch(t){case"depression":case"drain":return-i;case"ridge":case"channel":return Math.max(0,1-Math.abs(r)/e)*(t==="channel"?-1:1);case"raised":default:return i}}function Ge(r,e,t,n={}){const i=n.reliefHeight??1,s=new Float32Array(e*t*4);if(!r||!r.length)return{data:s,width:e,height:t};for(let a=0;a<t;a++){const o=(a+.5)/t;for(let l=0;l<e;l++){const u=(l+.5)/e;let c=0;for(const m of r){if(m.enabled===!1)continue;const d=Be(u,o,m.shape),p=Math.max(.001,m.softness??n.reliefSoftness??.08);c+=Me(d,p,m.mode)*(m.height??1)}const f=(a*e+l)*4;s[f]=c*i}}return{data:s,width:e,height:t}}function Re(r){return Math.min(1,Math.max(0,r))}function Ve(r){return r=r>>>0,r^=r>>>16,r=Math.imul(r,2146121005)>>>0,r^=r>>>15,r=Math.imul(r,2221713035)>>>0,r^=r>>>16,r>>>0}const Ae=2654435761;function Oe(r,e){return Ve((r>>>0^Math.imul(e>>>0,Ae)>>>0)>>>0)}function $(...r){let e=2166136261;for(let t=0;t<r.length;t++)e=Oe(e,r[t]|0);return e>>>0}function Ce(...r){return $(...r)/4294967296}const S=Object.freeze({PLACEMENT:1347174723,RESPONSE:1380275024,BREAKUP:1112689493,SHADING:1397244228});function _(r,...e){return Ce(r,...e)}function F(r){let e=2166136261;for(let t=0;t<r.length;t++)e^=r.charCodeAt(t),e=Math.imul(e,16777619)>>>0;return e>>>0}const Ee=256;function Le(r,e,t){return $(r>>>0,F(e),F(t))}function Ne(r,e){const t=Le(e,r.surfaceId,r.id),n=r.poolSize??Ee,i=new Array(n);for(let s=0;s<n;s++){const a=_(S.PLACEMENT,t,s,1)*2-1,o=_(S.PLACEMENT,t,s,2)*2-1,l=Math.hypot(a,o);i[s]={index:s,localX:a,localY:o,radius:l,birthFrac:_(S.PLACEMENT,t,s,3),sizeRand:_(S.PLACEMENT,t,s,4),accept:_(S.PLACEMENT,t,s,5),velRand:_(S.PLACEMENT,t,s,6),responseRand:_(S.RESPONSE,t,s,1)}}return i}function Fe(r,e){if(e<=0)return 1;const t=Math.min(1,r);return 1-e*ze(1-e,1,t)}function ze(r,e,t){if(r===e)return t<r?0:1;const n=Math.min(1,Math.max(0,(t-r)/(e-r)));return n*n*(3-2*n)}function $e(r,e,t=0){const n=[];for(const i of r){const s=e*Fe(i.radius,t);i.accept<s&&n.push(i)}return n}function qe(r,e){const t=Math.cos(e.rotation??0),n=Math.sin(e.rotation??0),i=(e.scaleUV?.x??.25)*r.localX,s=(e.scaleUV?.y??.25)*r.localY,a=i*t-s*n,o=i*n+s*t;return{u:(e.centerUV?.u??.5)+a,v:(e.centerUV?.v??.5)+o}}function He(r,e,t={}){const n=Ne(r,e),i=$e(n,je(r.density??.5),r.falloff??0),s=r.startFrame??0,a=r.endFrame??0,o=Math.max(0,a-s),[l,u]=r.dropSizeRange??[t.dropSizeMin??.4,t.dropSizeMax??1],[c,f]=r.velocityRange??[.6,1.4],m=[];for(const d of i){const p=qe(d,r);m.push({stableId:`${r.id}#${d.index}`,surfaceId:r.surfaceId,sourceFieldId:r.id,frame:s+Math.floor(d.birthFrac*o),surfaceUV:p,dropSize:l+(u-l)*d.sizeRand,incomingVelocity:c+(f-c)*d.velRand,responseRand:d.responseRand,responseSeed:$(F(r.id),d.index)>>>0,paletteId:r.paletteId??null,candidateIndex:d.index})}return m.sort((d,p)=>d.frame-p.frame||d.candidateIndex-p.candidateIndex),m}function je(r){return Math.min(1,Math.max(0,r))}function We(r,e){if(!r||!r.entries?.length)return null;const t=r.entries.reduce((s,a)=>s+Math.max(0,a.weight),0);if(t<=0)return r.entries[0].responseId;let n=0;const i=e*t;for(const s of r.entries)if(n+=Math.max(0,s.weight),i<n)return s.responseId;return r.entries[r.entries.length-1].responseId}function Ye(r,e,t){return r.map(n=>{const i=n.paletteId?e.get(n.paletteId):null,s=We(i,n.responseRand)??t;return{...n,responseId:s}})}let Xe=0;function Wr(r,e){return{id:`hero-${(++Xe).toString(36)}-${(r.stableId||"").replace(/[^\w]/g,"_")}`,sourceStableId:r.stableId??null,surfaceId:r.surfaceId,frame:r.frame,surfaceUV:{...r.surfaceUV},responseId:e,heightOverride:null,widthOverride:null,bounceOverride:null,spreadOverride:null,lifetimeOverride:null,visualGainOverride:null,enabled:!0}}function Ke(r){const e=new Set;for(const t of r)t.sourceStableId&&e.add(t.sourceStableId);return e}function Qe(r,e){return e.size?r.filter(t=>!t.stableId||!e.has(t.stableId)):r}const Je="metal-tick",Ze="Metal Tick",et="ring",tt=0,rt=.35,nt=[0,.6,.8],it=[0,1,0],st=.1,at=4,ot=1.6,lt=.5,ut=.2,ct=.25,dt=.05,ft=.15,pt=1.1,mt={id:Je,name:Ze,contactMode:et,atlasEntry:tt,lifetime:rt,radiusCurve:nt,heightCurve:it,reboundProbability:st,secondaryCount:at,secondarySpeed:ot,secondarySpread:lt,directionalBias:ut,wetnessDeposit:ct,waterDeposit:dt,rippleImpulse:ft,visualGain:pt},ht="metal-bounce",gt="Metal Bounce",vt="crown",wt=1,bt=.5,xt=[0,.5,.7],yt=[0,1,.3,0],St=.55,_t=6,Ut=2,Tt=.6,It=.6,kt=.4,Dt=.1,Pt=.25,Bt=1.3,Mt={id:ht,name:gt,contactMode:vt,atlasEntry:wt,lifetime:bt,radiusCurve:xt,heightCurve:yt,reboundProbability:St,secondaryCount:_t,secondarySpeed:Ut,secondarySpread:Tt,directionalBias:It,wetnessDeposit:kt,waterDeposit:Dt,rippleImpulse:Pt,visualGain:Bt},Gt="puddle-crown",Rt="Puddle Crown",Vt="crown",At=2,Ot=.8,Ct=[0,1,1.2],Et=[0,.6,.2,0],Lt=.2,Nt=8,Ft=1.2,zt=1.4,$t=.05,qt=.7,Ht=.5,jt=.6,Wt=.95,Yt={id:Gt,name:Rt,contactMode:Vt,atlasEntry:At,lifetime:Ot,radiusCurve:Ct,heightCurve:Et,reboundProbability:Lt,secondaryCount:Nt,secondarySpeed:Ft,secondarySpread:zt,directionalBias:$t,wetnessDeposit:qt,waterDeposit:Ht,rippleImpulse:jt,visualGain:Wt},Xt="hero-splash",Kt="Hero Splash",Qt="crown",Jt=3,Zt=1.4,er=[0,1.2,1.6],tr=[0,1,.6,.2,0],rr=.4,nr=12,ir=2.4,sr=1.2,ar=.3,or=.8,lr=.4,ur=.7,cr=1.6,dr={id:Xt,name:Kt,contactMode:Qt,atlasEntry:Jt,lifetime:Zt,radiusCurve:er,heightCurve:tr,reboundProbability:rr,secondaryCount:nr,secondarySpeed:ir,secondarySpread:sr,directionalBias:ar,wetnessDeposit:or,waterDeposit:lr,rippleImpulse:ur,visualGain:cr},fr={contactMode:"ring",atlasEntry:0,lifetime:.5,radiusCurve:[0,1],heightCurve:[0,1,0],reboundProbability:0,secondaryCount:4,secondarySpeed:1,secondarySpread:1,directionalBias:0,wetnessDeposit:.5,waterDeposit:.2,rippleImpulse:.3,visualGain:1};function pr(r){return{...fr,...r}}const se=[mt,Mt,Yt,dr].map(pr),Q=new Map(se.map(r=>[r.id,r]));function J(r){return Q.get(r)??Q.get("metal-tick")}const Z=new Map(se.map((r,e)=>[r.id,e])),k=30;function mr({schemaHash:r,topologyHash:e,paramHistoryHash:t,simResolution:n,frameRate:i,projectSeed:s}){return[`schema:${r}`,`topo:${e}`,`params:${t}`,`res:${n}`,`fps:${i}`,`seed:${s}`].join("#")}function G(r){let e=2166136261;for(let t=0;t<r.length;t++)e^=r.charCodeAt(t),e=Math.imul(e,16777619)>>>0;return(e>>>0).toString(16)}function I(r,e,t,n){return{level:r,code:e,message:t,data:n}}class hr{constructor(e,t=k){this.frameRate=e,this.simHz=t,this.dt=1/t}simStepForFrame(e){const t=e/this.frameRate;return Math.floor(t*this.simHz+1e-6)}stepDt(){return this.dt}}class gr{constructor({interval:e=30,maxCheckpoints:t=64,onEvict:n}={}){this.interval=e,this.maxCheckpoints=t,this.onEvict=n,this.checkpoints=new Map,this.cacheKey=null}reset(e=null){for(const t of this.checkpoints.values())this.onEvict?.(t);this.checkpoints.clear(),this.cacheKey=e}shouldCheckpoint(e){return e%this.interval===0&&!this.checkpoints.has(e)}store(e,t){this.checkpoints.set(e,t),this._evictIfNeeded()}nearestAtOrBefore(e){let t=-1;for(const n of this.checkpoints.keys())n<=e&&n>t&&(t=n);return t<0?null:{step:t,texture:this.checkpoints.get(t)}}_evictIfNeeded(){for(;this.checkpoints.size>this.maxCheckpoints;){const e=[...this.checkpoints.keys()].sort((i,s)=>i-s),t=e[Math.floor(e.length/2)],n=this.checkpoints.get(t);this.checkpoints.delete(t),this.onEvict?.(n)}}}function vr({currentStep:r,targetStep:e,cache:t}){if(e<0&&(e=0),r>=0&&e>=r)return{restoreFrom:null,restoreTexture:null,replaySteps:e-r,fromStep:r};const n=t.nearestAtOrBefore(e);return n?{restoreFrom:n.step,restoreTexture:n.texture,replaySteps:e-n.step,fromStep:n.step}:{restoreFrom:0,restoreTexture:null,replaySteps:e,fromStep:0}}const z=1,ee=r=>typeof r=="number"&&Number.isFinite(r),C=r=>typeof r=="string";function Yr(r){const e=[],t=[];if(!r||typeof r!="object")return{ok:!1,errors:["not an object"],warnings:t};r.schemaVersion!==z&&e.push(`schemaVersion ${r.schemaVersion} != current ${z} (migrate first)`),C(r.projectId)||e.push("projectId must be a string"),(!r.sourcePlate||!C(r.sourcePlate.assetId))&&e.push("sourcePlate.assetId required"),(!ee(r.durationFrames)||r.durationFrames<=0)&&e.push("durationFrames must be > 0"),(!ee(r.frameRate)||r.frameRate<=0)&&e.push("frameRate must be > 0"),Array.isArray(r.surfaces)||e.push("surfaces must be an array"),Array.isArray(r.heroEvents)||e.push("heroEvents must be an array");const n=new Set;for(const i of r.surfaces||[])C(i.id)?n.has(i.id)?e.push(`duplicate surface id ${i.id}`):n.add(i.id):e.push("surface missing id"),(!Array.isArray(i.calibrationQuad)||i.calibrationQuad.length!==4)&&t.push(`surface ${i.id}: calibrationQuad should have 4 corners`),(!Array.isArray(i.maskPath)||i.maskPath.length<3)&&t.push(`surface ${i.id}: maskPath should have >= 3 points`);for(const i of wr(r))i.surfaceId&&!n.has(i.surfaceId)&&t.push(`rain field ${i.id}: references unknown surface ${i.surfaceId}`);for(const i of r.heroEvents||[])i.surfaceId&&!n.has(i.surfaceId)&&t.push(`hero event ${i.id}: references unknown surface ${i.surfaceId}`);return{ok:e.length===0,errors:e,warnings:t}}function wr(r){const e=[];for(const t of r.surfaces||[])for(const n of t.rainFields||[])e.push(n);return e}const br={};function Xr(r){let e=xr(r),t=e.schemaVersion??1;for(;t<z;){const n=br[t];if(!n)throw new Error(`no migration from schema version ${t}`);e=n(e),t=e.schemaVersion}return e}function xr(r){return typeof structuredClone=="function"?structuredClone(r):JSON.parse(JSON.stringify(r))}function yr(r){const e=[];for(const t of r.surfaces||[]){e.push(t.id),e.push(JSON.stringify(t.calibrationQuad)),e.push(JSON.stringify(t.maskPath)),e.push(`nrm:${t.normalDirection}:${t.normalScale}`),e.push(`res:${t.simulationResolution}`);for(const n of t.reliefLayers||[])e.push(`relief:${n.id}:${n.mode}:${JSON.stringify(n.shape)}`)}return e.join("||")}const Sr=["plate_linearize","deposit_stamp","wet_update","relief_gradient","flow_build","wet_composite","splash","droplets","rivulet_update"],_r=(r,e,t)=>{const n=Math.min(1,Math.max(0,(t-r)/(e-r)));return n*n*(3-2*n)};class ae{constructor({device:e,queue:t,outputFormat:n,shaderSources:i,diagnostics:s}){this.device=e,this.queue=t??e.queue,this.outputFormat=n,this.shaderSources=i,this.emit=s??(()=>{}),this.params=new Y,this.project=null,this.assets={microNormal:null,plate:null},this.pool=new le(e),this.modules={},this.pipelines={},this.samplers={},this.uniformBuffers={},this.surfaceRuntime=new Map,this.cacheKey=null,this.currentSimStep=-1,this.checkpoints=new gr({interval:30,onEvict:a=>a.destroy()}),this.width=1920,this.height=1080,this.pixelAspect=1}static async create(e){const t=new ae(e);return await t._init(),t}async _init(){const e=this.device;e.pushErrorScope("validation");const t=this.shaderSources["common.wgsl"]??"",n=a=>e.createShaderModule({label:a,code:t+`
`+(this.shaderSources[`${a}.wgsl`]??"")});for(const a of Sr)this.modules[a]=n(a);await this._reportShaderCompilation(),this.samplers.linear=e.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),this.samplers.repeat=e.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"});const i=a=>e.createBuffer({size:a,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.uniformBuffers.frame=i(32),this.uniformBuffers.params=i(128),this.uniformBuffers.compositeLinear=i(16),this.uniformBuffers.compositeEncode=i(16),this.queue.writeBuffer(this.uniformBuffers.compositeLinear,0,j({encode:0})),this.queue.writeBuffer(this.uniformBuffers.compositeEncode,0,j({encode:1})),this._createPipelines();const s=await e.popErrorScope();s&&this.emit(I("error","init",s.message))}async _reportShaderCompilation(){for(const[e,t]of Object.entries(this.modules)){if(!t||typeof t.getCompilationInfo!="function")continue;let n;try{n=await t.getCompilationInfo()}catch{continue}for(const i of n.messages){if(i.type!=="error")continue;const a=`shader ${`${e}.wgsl:${i.lineNum}:${i.linePos}`} — ${i.message}`;this.emit(I("error","shader",a)),typeof console<"u"&&console.error(`[meteor] ${a}`)}}}_createPipelines(){const e=this.device,t="rgba16float",n=typeof GPUShaderStage<"u"?GPUShaderStage:{FRAGMENT:2,COMPUTE:4},i=(d,p)=>({binding:d,visibility:p,buffer:{type:"uniform"}}),s=(d,p)=>({binding:d,visibility:p,texture:{sampleType:"float"}}),a=(d,p)=>({binding:d,visibility:p,sampler:{type:"filtering"}}),o=(d,p)=>({binding:d,visibility:p,storageTexture:{access:"write-only",format:t}}),l=e.createBindGroupLayout({entries:[i(0,n.COMPUTE),i(1,n.COMPUTE),s(2,n.COMPUTE),s(3,n.COMPUTE),s(4,n.COMPUTE),s(5,n.COMPUTE),s(6,n.COMPUTE),a(7,n.COMPUTE),o(8,n.COMPUTE)]}),u=e.createBindGroupLayout({entries:[i(0,n.FRAGMENT),i(1,n.FRAGMENT),i(2,n.FRAGMENT),s(3,n.FRAGMENT),s(4,n.FRAGMENT),s(5,n.FRAGMENT),s(6,n.FRAGMENT),s(7,n.FRAGMENT),s(8,n.FRAGMENT),a(9,n.FRAGMENT),i(10,n.FRAGMENT),s(11,n.FRAGMENT)]});this.pipelines.linearize=e.createRenderPipeline({layout:"auto",vertex:{module:this.modules.plate_linearize,entryPoint:"vs"},fragment:{module:this.modules.plate_linearize,entryPoint:"fs",targets:[{format:t}]},primitive:{topology:"triangle-list"}}),this.pipelines.deposit=e.createComputePipeline({layout:"auto",compute:{module:this.modules.deposit_stamp,entryPoint:"main"}}),this.pipelines.rivuletUpdate=e.createComputePipeline({layout:"auto",compute:{module:this.modules.rivulet_update,entryPoint:"main"}}),this.pipelines.wetUpdate=e.createComputePipeline({layout:e.createPipelineLayout({bindGroupLayouts:[l]}),compute:{module:this.modules.wet_update,entryPoint:"main"}}),this.pipelines.reliefGradient=e.createComputePipeline({layout:"auto",compute:{module:this.modules.relief_gradient,entryPoint:"main"}}),this.pipelines.flowBuild=e.createComputePipeline({layout:"auto",compute:{module:this.modules.flow_build,entryPoint:"main"}});const c=e.createPipelineLayout({bindGroupLayouts:[u]}),f=d=>e.createRenderPipeline({layout:c,vertex:{module:this.modules.wet_composite,entryPoint:"vs"},fragment:{module:this.modules.wet_composite,entryPoint:"fs",targets:[{format:d}]},primitive:{topology:"triangle-list"}});this.pipelines.compositeLinear=f(t),this.pipelines.compositeOutput=f(this.outputFormat),this.pipelines.compositeWarp=e.createRenderPipeline({layout:c,vertex:{module:this.modules.wet_composite,entryPoint:"vs_warp",buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:"float32x2"},{shaderLocation:1,offset:8,format:"float32x2"}]}]},fragment:{module:this.modules.wet_composite,entryPoint:"fs_warp",targets:[{format:t}]},primitive:{topology:"triangle-list"}});const m={color:{srcFactor:"one",dstFactor:"one",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one",operation:"add"}};this.pipelines.splash=e.createRenderPipeline({layout:"auto",vertex:{module:this.modules.splash,entryPoint:"vs"},fragment:{module:this.modules.splash,entryPoint:"fs",targets:[{format:t,blend:m}]},primitive:{topology:"triangle-list"}}),this.pipelines.droplets=e.createRenderPipeline({layout:"auto",vertex:{module:this.modules.droplets,entryPoint:"vs"},fragment:{module:this.modules.droplets,entryPoint:"fs",targets:[{format:t,blend:m}]},primitive:{topology:"triangle-list"}})}setParameters(e){e instanceof Y?this.params=e:this.params.applyOverrides(e),this._invalidateIfHistoryChanged()}setProject(e){this.project=e,this._compileProject(),this._invalidateIfHistoryChanged(!1)}registerAssets(e){this.assets={...this.assets,...e}}resize({width:e,height:t,pixelAspect:n}){this.width=e,this.height=t,this.pixelAspect=n??1}resetSimulation({surfaceId:e=null}={}){this.currentSimStep=-1,this.checkpoints.reset(this.cacheKey);for(const[t,n]of this.surfaceRuntime)e&&t!==e||(n.simInitialized=!1)}dispose(){this.pool.destroyAll(),this.checkpoints.reset(null);for(const e of Object.values(this.uniformBuffers))e.destroy?.();this.surfaceRuntime.clear()}_currentCacheKey(){return this.project?mr({schemaHash:G(String(this.project.schemaVersion)),topologyHash:G(yr(this.project)),paramHistoryHash:G(this.params.historyHash()),simResolution:256,frameRate:this.project.frameRate,projectSeed:this.project.globalSeed}):"empty"}_invalidateIfHistoryChanged(e=!1){const t=this._currentCacheKey();(e||t!==this.cacheKey)&&(this.cacheKey=t,this.resetSimulation({}))}_compileProject(){if(!this.project)return;const e=this.project,t=new Map((e.palettes??[]).map(i=>[i.id,i])),n=Ke(e.heroEvents??[]);for(const i of this.surfaceRuntime.values())i.warpMesh?.vbuf.destroy(),i.warpMesh?.ibuf.destroy();this.surfaceRuntime.clear();for(const i of e.surfaces??[]){const s=be(i);s.valid||this.emit(I("warn","homography",`surface ${i.id}: ${s.warnings.join(", ")}`));const a=i.simulationResolution??256;let o=[];for(const f of i.rainFields??[])o.push(...He(f,e.globalSeed,this.params.toObject()));o=Ye(o,t,"metal-tick"),o=Qe(o,n);const l=f=>{const[m,d]=s.imageToSurface(f.u??f.x,f.v??f.y);return{u:m,v:d}},u=(i.maskPath??[]).map(l),c=(i.cutouts??[]).map(f=>(f.points??f).map(l)).filter(f=>f.length>=3);this.surfaceRuntime.set(i.id,{surface:i,transforms:s,res:a,events:o,maskData:Se(u,a,a,{feather:i.maskFeather??.12,cutouts:c}),reliefData:Ge(i.reliefLayers??[],a,a,this.params.toObject()),flowConfig:i.flow??{baseFlow:{x:0,y:.3},bias:{x:0,y:0}},simInitialized:!1,staticUploaded:!1,bindGroups:{},warpMesh:this._buildWarpMesh(i)})}}_buildWarpMesh(e){if(!ke(e))return null;const{positions:t,uvs:n,indices:i}=Ie(e.warp.grid,{segU:32,segV:32,blend:e.warp.blend??0}),s=t.length/2,a=new Float32Array(s*4);for(let u=0;u<s;u++)a[u*4]=t[u*2],a[u*4+1]=t[u*2+1],a[u*4+2]=n[u*2],a[u*4+3]=n[u*2+1];const o=this.device.createBuffer({size:a.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.queue.writeBuffer(o,0,a);const l=this.device.createBuffer({size:i.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST});return this.queue.writeBuffer(l,0,i),{vbuf:o,ibuf:l,indexCount:i.length}}_activeImpactsAt(e,t){const n=this.project.frameRate,i=this.params.toObject(),s=[];for(const a of e.events){const o=J(a.responseId),l=o.lifetime*n*(i.lifetime??1);t<a.frame||t>a.frame+l||s.push({surfaceUV:a.surfaceUV,birthFrame:a.frame,dropSize:a.dropSize,responseIndex:Z.get(a.responseId)??0,incomingVelocity:a.incomingVelocity,responseSeed:a.responseSeed,visualGain:o.visualGain,heightOv:1,widthOv:1,bounceOv:1,spreadOv:1,lifetimeOv:l,rippleImpulse:o.rippleImpulse,wetnessDeposit:o.wetnessDeposit*(i.wetnessDeposit??1),waterDeposit:o.waterDeposit})}for(const a of this.project.heroEvents??[]){if(!a.enabled||a.surfaceId!==e.surface.id)continue;const o=J(a.responseId),l=(a.lifetimeOverride??o.lifetime*n)*(i.lifetime??1);t<a.frame||t>a.frame+l||s.push({surfaceUV:a.surfaceUV,birthFrame:a.frame,dropSize:1.4,responseIndex:Z.get(a.responseId)??3,incomingVelocity:1,responseSeed:G(a.id)>>>0,visualGain:a.visualGainOverride??o.visualGain,heightOv:a.heightOverride??1.5,widthOv:a.widthOverride??1.3,bounceOv:a.bounceOverride??1,spreadOv:a.spreadOverride??1.2,lifetimeOv:l,rippleImpulse:o.rippleImpulse,wetnessDeposit:o.wetnessDeposit*(i.wetnessDeposit??1),waterDeposit:o.waterDeposit})}return s}render(e){if(!this.project){this.emit(I("warn","render","no project set"));return}try{this._writeFrameUniforms(e),this._advanceSimulation(e),this._renderBeauty(e)}catch(t){this.emit(I("error","render",t.message))}}_writeFrameUniforms(e){this.queue.writeBuffer(this.uniformBuffers.params,0,this._paramsPadded())}_paramsPadded(){const e=this.params.packUniform(),t=new Float32Array(32);return t.set(e),t}_advanceSimulation(e){const n=new hr(this.project.frameRate,k).simStepForFrame(e.frameIndex),i=vr({currentStep:this.currentSimStep,targetStep:n,cache:this.checkpoints});for(const o of this.surfaceRuntime.values())this._ensureSurfaceTextures(o);let s=i.fromStep;if(i.restoreTexture)for(const o of this.surfaceRuntime.values())this._restoreCheckpoint(o,i.restoreTexture);else if(i.restoreFrom===0&&this.currentSimStep<0)for(const o of this.surfaceRuntime.values())this._clearState(o);const a=this.project.frameRate/k;for(let o=0;o<i.replaySteps;o++){s+=1;const l=s*a;this._encodeSimStep(l),this.checkpoints.shouldCheckpoint(s)&&this._storeCheckpoint(s)}this.currentSimStep=n}_encodeSimStep(e){const t=this.device;for(const n of this.surfaceRuntime.values()){const i=this._activeImpactsAt(n,e);this._uploadImpacts(n,i),this.queue.writeBuffer(this.uniformBuffers.frame,0,H({width:n.res,height:n.res,pixelAspect:1,timeSeconds:e/this.project.frameRate,frameIndex:e,globalSeed:this.project.globalSeed,simDt:1/k,debugMode:0}));const s=t.createCommandEncoder();if(this._effectiveDrip(n.surface).amount>.001){const a=s.beginComputePass();a.setPipeline(this.pipelines.rivuletUpdate),a.setBindGroup(0,this._rivuletBindGroup(n)),a.dispatchWorkgroups(Math.ceil(R/64)),a.end()}{const a=s.beginComputePass();a.setPipeline(this.pipelines.deposit),a.setBindGroup(0,this._depositBindGroup(n)),a.dispatchWorkgroups(Math.ceil(n.res/8),Math.ceil(n.res/8)),a.end()}{const a=s.beginComputePass();a.setPipeline(this.pipelines.wetUpdate),a.setBindGroup(0,this._wetUpdateBindGroup(n)),a.dispatchWorkgroups(Math.ceil(n.res/8),Math.ceil(n.res/8)),a.end()}this.queue.submit([s.finish()]),[n.stateA,n.stateB]=[n.stateB,n.stateA]}}_renderBeauty(e){const t=this.device,n=this.pool.acquire("working",{size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),i=this.pool.acquire("colorB",{size:{width:this.width,height:this.height},format:"rgba16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});this.queue.writeBuffer(this.uniformBuffers.frame,0,H({width:this.width,height:this.height,pixelAspect:this.pixelAspect,timeSeconds:e.timeSeconds,frameIndex:e.frameIndex,globalSeed:this.project.globalSeed,simDt:1/k,debugMode:e.debugMode??this.params.get("debugMode")}));const s=t.createCommandEncoder();this._fullscreen(s,n.createView(),this.pipelines.linearize,this._linearizeBindGroup(e.inputTextureView));let a=n,o=i;for(const l of this.surfaceRuntime.values())l.warpMesh?(this._fullscreen(s,o.createView(),this.pipelines.compositeLinear,this._passthroughBindGroup(a.createView())),this._drawWarp(s,o.createView(),l,a.createView())):this._fullscreen(s,o.createView(),this.pipelines.compositeLinear,this._compositeBindGroup(l,a.createView())),[a,o]=[o,a];for(const l of this.surfaceRuntime.values()){const u=this._activeImpactsAt(l,e.frameIndex);u.length&&(this._uploadImpacts(l,u),this._drawInstanced(s,a.createView(),this.pipelines.droplets,this._dropletBindGroup(l),u.length*12))}this._fullscreen(s,e.outputTextureView,this.pipelines.compositeOutput,this._encodeBindGroup(a.createView())),this.queue.submit([s.finish()])}_fullscreen(e,t,n,i){const s=e.beginRenderPass({colorAttachments:[{view:t,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});s.setPipeline(n),s.setBindGroup(0,i),s.draw(3),s.end()}_drawInstanced(e,t,n,i,s){const a=e.beginRenderPass({colorAttachments:[{view:t,loadOp:"load",storeOp:"store"}]});a.setPipeline(n),a.setBindGroup(0,i),a.draw(6,s),a.end()}_drawWarp(e,t,n,i){const s=e.beginRenderPass({colorAttachments:[{view:t,loadOp:"load",storeOp:"store"}]});s.setPipeline(this.pipelines.compositeWarp),s.setBindGroup(0,this._compositeBindGroup(n,i)),s.setVertexBuffer(0,n.warpMesh.vbuf),s.setIndexBuffer(n.warpMesh.ibuf,"uint32"),s.drawIndexed(n.warpMesh.indexCount),s.end()}_passthroughBindGroup(e){this._disabledSurface??=(()=>{const i=this.device.createBuffer({size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s=[1,0,0,0,1,0,0,0,1];return this.queue.writeBuffer(i,0,O({forward:s,inverse:s,normalDir:{dx:0,dy:0},enabled:!1,simResolution:256,worldNormal:{x:0,y:0,z:1}})),i})();const t=this._dummyTex??=this.pool.acquire("dummy",{size:{width:1,height:1},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),n=this._dummyMask??=this.pool.acquire("dummyMask",{size:{width:1,height:1},format:"r8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return this.device.createBindGroup({layout:this.pipelines.compositeLinear.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniformBuffers.frame}},{binding:1,resource:{buffer:this.uniformBuffers.params}},{binding:2,resource:{buffer:this._disabledSurface}},{binding:3,resource:e},{binding:4,resource:t.createView()},{binding:5,resource:t.createView()},{binding:6,resource:t.createView()},{binding:7,resource:n.createView()},{binding:8,resource:t.createView()},{binding:9,resource:this.samplers.linear},{binding:10,resource:{buffer:this.uniformBuffers.compositeLinear}},{binding:11,resource:this._environmentView()}]})}_ensureSurfaceTextures(e){const t=e.res,n={size:{width:t,height:t},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_SRC|GPUTextureUsage.COPY_DST};(!e.stateA||e.stateA.width!==t)&&(e.stateA=this.pool.acquire(`${e.surface.id}:stateA`,n),e.stateB=this.pool.acquire(`${e.surface.id}:stateB`,n)),e.deposit=this.pool.acquire(`${e.surface.id}:deposit`,{size:{width:t,height:t},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),e.flow=this.pool.acquire(`${e.surface.id}:flow`,{size:{width:t,height:t},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),e.reliefRaw=this.pool.acquire(`${e.surface.id}:reliefRaw`,{size:{width:t,height:t},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),e.relief=this.pool.acquire(`${e.surface.id}:relief`,{size:{width:t,height:t},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.STORAGE_BINDING}),e.mask=this.pool.acquire(`${e.surface.id}:mask`,{size:{width:t,height:t},format:"r8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),e.surfaceUniform??=this.device.createBuffer({size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e.flowUniform??=this.device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e.dripUniform??=this.device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e.rivuletBuffer??=this.device.createBuffer({size:R*fe,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this._writeSurfaceUniform(e),e.staticUploaded||(this._uploadStatic(e),e.staticUploaded=!0)}_effectiveDrip(e){const t=e.drip||{},n=L(e),i=_r(.7,.15,n.y);return{amount:Math.max(t.amount??0,(t.fromTilt??0)*i),speed:(t.speed??.25)*(.6+.8*i),width:t.width??.012,meander:t.meander??.5}}_writeSurfaceUniform(e){const t=ye(e.surface);this.queue.writeBuffer(e.surfaceUniform,0,O({forward:e.transforms.forward,inverse:e.transforms.inverse,normalDir:t,enabled:e.surface.enabled!==!1,simResolution:e.res,worldNormal:L(e.surface),aspect:xe(e.surface)})),this.queue.writeBuffer(e.flowUniform,0,ce(e.flowConfig)),this.queue.writeBuffer(e.dripUniform,0,de(this._effectiveDrip(e.surface))),e.rivuletsSeeded||(this.queue.writeBuffer(e.rivuletBuffer,0,pe((this.project.globalSeed??1)+1)),e.rivuletsSeeded=!0)}_uploadStatic(e){const t=e.res,n=Math.ceil(t/256)*256,i=new Uint8Array(n*t);for(let c=0;c<t;c++)i.set(e.maskData.subarray(c*t,c*t+t),c*n);this.queue.writeTexture({texture:e.mask},i,{bytesPerRow:n,rowsPerImage:t},{width:t,height:t});const s=Ur(e.reliefData.data),a=Math.ceil(t*4*2/256)*256,o=new Uint8Array(a*t),l=new DataView(o.buffer);for(let c=0;c<t;c++)for(let f=0;f<t*4;f++)l.setUint16(c*a+f*2,s[c*t*4+f],!0);this.queue.writeTexture({texture:e.reliefRaw},o,{bytesPerRow:a,rowsPerImage:t},{width:t,height:t});const u=this.device.createCommandEncoder();{const c=u.beginComputePass();c.setPipeline(this.pipelines.reliefGradient),c.setBindGroup(0,this.device.createBindGroup({layout:this.pipelines.reliefGradient.getBindGroupLayout(0),entries:[{binding:0,resource:e.reliefRaw.createView()},{binding:1,resource:this.samplers.linear},{binding:2,resource:e.relief.createView()}]})),c.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(t/8)),c.end()}this.device.queue.submit([u.finish()]),this._buildFlow(e)}_buildFlow(e){const t=e.res,n=this.device.createCommandEncoder(),i=n.beginComputePass();i.setPipeline(this.pipelines.flowBuild),i.setBindGroup(0,this.device.createBindGroup({layout:this.pipelines.flowBuild.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniformBuffers.params}},{binding:1,resource:{buffer:e.flowUniform}},{binding:2,resource:e.relief.createView()},{binding:3,resource:e.mask.createView()},{binding:4,resource:this.samplers.linear},{binding:5,resource:e.flow.createView()}]})),i.dispatchWorkgroups(Math.ceil(t/8),Math.ceil(t/8)),i.end(),this.device.queue.submit([n.finish()])}_clearState(e){const t=e.res,n=Math.ceil(t*4*2/256)*256,i=new Uint8Array(n*t);this.queue.writeTexture({texture:e.stateA},i,{bytesPerRow:n,rowsPerImage:t},{width:t,height:t})}_restoreCheckpoint(e,t){const n=this.device.createCommandEncoder();n.copyTextureToTexture({texture:t},{texture:e.stateA},{width:e.res,height:e.res}),this.queue.submit([n.finish()])}_storeCheckpoint(e){for(const t of this.surfaceRuntime.values()){const n=this.pool.createDetached({size:{width:t.res,height:t.res},format:"rgba16float",usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.COPY_SRC|GPUTextureUsage.TEXTURE_BINDING}),i=this.device.createCommandEncoder();i.copyTextureToTexture({texture:t.stateA},{texture:n},{width:t.res,height:t.res}),this.queue.submit([i.finish()]),this.checkpoints.store(e,n)}}_uploadImpacts(e,t){const n=ue(t),i=Math.max(64,n.byteLength);(!e.impactBuffer||e.impactCapacity<i)&&(e.impactBuffer?.destroy(),e.impactCapacity=Math.ceil(i/64)*64*2,e.impactBuffer=this.device.createBuffer({size:e.impactCapacity,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})),this.queue.writeBuffer(e.impactBuffer,0,n),e.impactCount=t.length}_linearizeBindGroup(e){return this.device.createBindGroup({layout:this.pipelines.linearize.getBindGroupLayout(0),entries:[{binding:0,resource:e},{binding:1,resource:this.samplers.linear}]})}_depositBindGroup(e){return this.device.createBindGroup({layout:this.pipelines.deposit.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniformBuffers.frame}},{binding:1,resource:{buffer:this.uniformBuffers.params}},{binding:2,resource:{buffer:e.impactBuffer}},{binding:3,resource:e.deposit.createView()},{binding:4,resource:{buffer:e.surfaceUniform}},{binding:5,resource:{buffer:e.rivuletBuffer}},{binding:6,resource:{buffer:e.dripUniform}}]})}_rivuletBindGroup(e){return this.device.createBindGroup({layout:this.pipelines.rivuletUpdate.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniformBuffers.frame}},{binding:1,resource:{buffer:e.rivuletBuffer}},{binding:2,resource:e.flow.createView()},{binding:3,resource:{buffer:e.dripUniform}},{binding:4,resource:this.samplers.linear}]})}_wetUpdateBindGroup(e){return this.device.createBindGroup({layout:this.pipelines.wetUpdate.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniformBuffers.frame}},{binding:1,resource:{buffer:this.uniformBuffers.params}},{binding:2,resource:e.stateA.createView()},{binding:3,resource:e.deposit.createView()},{binding:4,resource:e.flow.createView()},{binding:5,resource:e.relief.createView()},{binding:6,resource:e.mask.createView()},{binding:7,resource:this.samplers.linear},{binding:8,resource:e.stateB.createView()}]})}_compositeBindGroup(e,t){return this.device.createBindGroup({layout:this.pipelines.compositeLinear.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniformBuffers.frame}},{binding:1,resource:{buffer:this.uniformBuffers.params}},{binding:2,resource:{buffer:e.surfaceUniform}},{binding:3,resource:t},{binding:4,resource:e.stateA.createView()},{binding:5,resource:e.relief.createView()},{binding:6,resource:e.flow.createView()},{binding:7,resource:e.mask.createView()},{binding:8,resource:(this.assets.microNormal??e.relief).createView()},{binding:9,resource:this.samplers.repeat},{binding:10,resource:{buffer:this.uniformBuffers.compositeLinear}},{binding:11,resource:this._environmentView()}]})}_environmentView(){return this.assets.environment?this.assets.environment.createView():(this._defaultEnv??=(()=>{const n=this.device.createTexture({size:{width:128,height:64},format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),i=Math.ceil(128*4/256)*256,s=new Uint8Array(i*64),a=(l,u,c)=>l+(u-l)*c,o=l=>Math.max(0,Math.min(255,Math.round(l)));for(let l=0;l<64;l++){const u=l/63;let c,f,m;if(u<.5){const d=u/.5;c=a(38,232,d*d),f=a(70,168,d),m=a(150,120,d)}else{const d=(u-.5)/.5;c=a(232,26,d),f=a(168,24,d),m=a(120,28,d)}for(let d=0;d<128;d++){const p=Math.min(Math.abs(d/128-.32),1-Math.abs(d/128-.32)),g=Math.exp(-(p*p/.004))*Math.exp(-((u-.46)*(u-.46)/.004)),h=l*i+d*4;s[h]=o(c+g*60),s[h+1]=o(f+g*45),s[h+2]=o(m+g*20),s[h+3]=255}}return this.device.queue.writeTexture({texture:n},s,{bytesPerRow:i,rowsPerImage:64},{width:128,height:64}),n})(),this._defaultEnv.createView())}_encodeBindGroup(e){this._disabledSurface??=(()=>{const i=this.device.createBuffer({size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s=[1,0,0,0,1,0,0,0,1];return this.queue.writeBuffer(i,0,O({forward:s,inverse:s,normalDir:{dx:0,dy:0},enabled:!1,simResolution:256,worldNormal:{x:0,y:0,z:1}})),i})();const t=this._dummyTex??=this.pool.acquire("dummy",{size:{width:1,height:1},format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),n=this._dummyMask??=this.pool.acquire("dummyMask",{size:{width:1,height:1},format:"r8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return this.device.createBindGroup({layout:this.pipelines.compositeOutput.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniformBuffers.frame}},{binding:1,resource:{buffer:this.uniformBuffers.params}},{binding:2,resource:{buffer:this._disabledSurface}},{binding:3,resource:e},{binding:4,resource:t.createView()},{binding:5,resource:t.createView()},{binding:6,resource:t.createView()},{binding:7,resource:n.createView()},{binding:8,resource:t.createView()},{binding:9,resource:this.samplers.linear},{binding:10,resource:{buffer:this.uniformBuffers.compositeEncode}},{binding:11,resource:this._environmentView()}]})}_splashBindGroup(e){return this.device.createBindGroup({layout:this.pipelines.splash.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniformBuffers.frame}},{binding:1,resource:{buffer:this.uniformBuffers.params}},{binding:2,resource:{buffer:e.surfaceUniform}},{binding:3,resource:{buffer:e.impactBuffer}}]})}_dropletBindGroup(e){return this.device.createBindGroup({layout:this.pipelines.droplets.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniformBuffers.frame}},{binding:1,resource:{buffer:this.uniformBuffers.params}},{binding:2,resource:{buffer:e.surfaceUniform}},{binding:3,resource:{buffer:e.impactBuffer}},{binding:4,resource:this._environmentView()},{binding:5,resource:this.samplers.linear}]})}}function Ur(r){const e=new Uint16Array(r.length);for(let t=0;t<r.length;t++)e[t]=Tr(r[t]);return e}function Tr(r){const e=new Float32Array(1),t=new Int32Array(e.buffer);e[0]=r;const n=t[0],i=n>>16&32768;let s=(n>>23&255)-127+15,a=n&8388607;return s<=0?i:s>=31?i|31744:i|s<<10|a>>13}class oe{constructor(e){this.canvas=e,this.device=null,this.context=null,this.format=null,this.adapter=null,this.onDeviceLost=null}static isSupported(){return typeof navigator<"u"&&!!navigator.gpu}async init(){if(!oe.isSupported())throw new Error("WebGPU is not available in this browser.");for(const e of[{powerPreference:"high-performance"},{},{powerPreference:"low-power"}])if(this.adapter=await navigator.gpu.requestAdapter(e),this.adapter)break;if(!this.adapter)throw new Error("navigator.gpu.requestAdapter() returned null (no GPU adapter for any power preference).");try{const e=this.adapter.info||this.adapter.requestAdapterInfo&&await this.adapter.requestAdapterInfo();e&&(this.adapterInfo=[e.vendor,e.architecture,e.description].filter(Boolean).join(" / "))}catch{}try{this.device=await this.adapter.requestDevice({requiredFeatures:[]})}catch(e){throw new Error(`requestDevice failed: ${e?.message||e}`)}return this.device.lost.then(e=>{e.reason!=="destroyed"&&this.onDeviceLost?.(e)}),this.device.onuncapturederror=e=>{this.lastUncapturedError=e.error,console.error("[webgpu uncaptured]",e.error?.message)},this.format=navigator.gpu.getPreferredCanvasFormat(),this.context=this.canvas.getContext("webgpu"),this.configureCanvas(),this.device}configureCanvas(){this.context.configure({device:this.device,format:this.format,alphaMode:"opaque"})}resizeToDisplay(){const e=Math.min(window.devicePixelRatio||1,2),t=Math.max(1,Math.floor(this.canvas.clientWidth*e)),n=Math.max(1,Math.floor(this.canvas.clientHeight*e));return this.canvas.width!==t||this.canvas.height!==n?(this.canvas.width=t,this.canvas.height=n,this.configureCanvas(),!0):!1}currentOutputView(){return this.context.getCurrentTexture().createView()}get queue(){return this.device.queue}}const Ir=`// common.wgsl — shared structs + helpers prepended to every other Meteor shader\r
// (the engine and the WGSL validator both concatenate this fragment first).\r
//\r
// CRITICAL: hash_u32 / combine / rand01 MUST match src/engine/events/SeededHash.js\r
// so CPU event records and GPU evaluation agree bit-for-bit.\r
\r
// ---- deterministic hash (mirror of SeededHash.js) ----\r
fn hash_u32(x_in: u32) -> u32 {\r
  var x = x_in;\r
  x = x ^ (x >> 16u);\r
  x = x * 0x7feb352du;\r
  x = x ^ (x >> 15u);\r
  x = x * 0x846ca68bu;\r
  x = x ^ (x >> 16u);\r
  return x;\r
}\r
\r
fn combine(acc: u32, value: u32) -> u32 {\r
  return hash_u32(acc ^ (value * 0x9e3779b1u));\r
}\r
\r
fn rand01(a: u32, b: u32, c: u32) -> f32 {\r
  var h: u32 = 0x811c9dc5u;\r
  h = combine(h, a);\r
  h = combine(h, b);\r
  h = combine(h, c);\r
  return f32(h) / 4294967296.0;\r
}\r
\r
// ---- color (build plan §19) ----\r
fn srgb_to_linear(c: vec3<f32>) -> vec3<f32> {\r
  let cutoff = step(vec3<f32>(0.04045), c);\r
  let low = c / 12.92;\r
  let high = pow((c + vec3<f32>(0.055)) / 1.055, vec3<f32>(2.4));\r
  return mix(low, high, cutoff);\r
}\r
\r
fn linear_to_srgb(c: vec3<f32>) -> vec3<f32> {\r
  let cutoff = step(vec3<f32>(0.0031308), c);\r
  let low = c * 12.92;\r
  let high = 1.055 * pow(max(c, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4)) - 0.055;\r
  return mix(low, high, cutoff);\r
}\r
\r
fn luminance(c: vec3<f32>) -> f32 {\r
  return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));\r
}\r
\r
// ---- value-noise FBM (hash after Dave Hoskins / Ethera super_fractal) ----\r
fn hash21(p: vec2<f32>) -> f32 {\r
  var p3 = fract(vec3<f32>(p.x, p.y, p.x) * 0.1031);\r
  p3 = p3 + dot(p3, p3.yzx + 33.33);\r
  return fract((p3.x + p3.y) * p3.z);\r
}\r
\r
fn vnoise(p: vec2<f32>) -> f32 {\r
  let i = floor(p);\r
  let f = fract(p);\r
  let u = f * f * (3.0 - 2.0 * f);\r
  let a = hash21(i);\r
  let b = hash21(i + vec2<f32>(1.0, 0.0));\r
  let c = hash21(i + vec2<f32>(0.0, 1.0));\r
  let d = hash21(i + vec2<f32>(1.0, 1.0));\r
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);\r
}\r
\r
// 4-octave FBM in ~[0,1]; art-directs where puddles pool.\r
fn fbm2(p_in: vec2<f32>) -> f32 {\r
  var p = p_in;\r
  var v = 0.0;\r
  var amp = 0.5;\r
  for (var i = 0; i < 4; i = i + 1) {\r
    v = v + amp * vnoise(p);\r
    p = p * 2.0;\r
    amp = amp * 0.5;\r
  }\r
  return v / 0.9375; // normalise sum of amplitudes (0.5+0.25+0.125+0.0625)\r
}\r
\r
// Puddle membership in [0,1] at a surface-UV point: 1 = pooled, 0 = dry. \`edge\`\r
// sharpens the boundary. Shared by the composite (wet look) AND the deposit pass\r
// (so rings only emit where there's water to ring).\r
fn puddleField(uv: vec2<f32>, scale: f32, edge: f32) -> f32 {\r
  // domain warp the sample point so puddles read as organic pools with ragged\r
  // edges instead of smooth round blobs (the "breakup" the wet/dry look needs).\r
  let warp = vec2<f32>(\r
    fbm2(uv * scale * 0.5 + vec2<f32>(11.3, 5.1)),\r
    fbm2(uv * scale * 0.5 + vec2<f32>(41.7, 23.9)),\r
  ) - 0.5;\r
  let pud = fbm2(uv * scale + warp * 0.7);\r
  let e = clamp(edge, 0.0, 0.98);\r
  return smoothstep(0.5 - (1.0 - e) * 0.5, 0.5 + (1.0 - e) * 0.5, pud);\r
}\r
\r
// Blend between "wet everywhere" (amount 0) and "wet only in puddles" (amount 1).\r
fn puddleGate(uv: vec2<f32>, amount: f32, scale: f32, edge: f32) -> f32 {\r
  return mix(1.0, puddleField(uv, scale, edge), clamp(amount, 0.0, 1.0));\r
}\r
\r
// ---- shared uniform structs ----\r
// Packed scalar parameters. Field ORDER must match ParameterState.WGSL_PARAM_IDS\r
// (see docs/shader-bindings.md). 31 scalars.\r
struct Params {\r
  debugMode: f32,\r
  visualGain: f32,\r
  impactVelocity: f32,\r
  splashHeight: f32,\r
  splashWidth: f32,\r
  bounce: f32,\r
  spread: f32,\r
  lifetime: f32,\r
  flowSpeed: f32,\r
  evaporation: f32,\r
  reliefHeight: f32,\r
  reliefSoftness: f32,\r
  flowDeflection: f32,\r
  boundaryWrap: f32,\r
  wetDarkening: f32,\r
  saturationShift: f32,\r
  specularGain: f32,\r
  specularWidth: f32,\r
  specularDirection: f32,\r
  microNormalStrength: f32,\r
  flowStreakStrength: f32,\r
  rippleNormalStrength: f32,\r
  poolHighlight: f32,\r
  distortion: f32,\r
  edgeBead: f32,\r
  dropletScale: f32,\r
  waterLevel: f32,   // base standing-water/wetness floor inside the mask (0 dry .. 1 full pool)\r
  puddleAmount: f32, // how strongly fractal noise carves puddles into the wetness floor\r
  puddleScale: f32,  // puddle noise frequency (blobs across the surface)\r
  puddleEdge: f32,   // puddle boundary sharpness (0 soft .. 1 crisp)\r
  rippleScale: f32,  // world/feature scale: multiplies ripple + footprint + rivulet sizes\r
};\r
\r
struct Frame {\r
  resolution: vec2<f32>,\r
  pixelAspect: f32,\r
  timeSeconds: f32,\r
  frameIndex: f32,\r
  globalSeed: f32,\r
  simDt: f32,\r
  debugMode: f32,\r
};\r
\r
// A water rivulet running down a surface (windshield/vertical streaming). Stored\r
// in a per-surface storage buffer, advanced by rivulet_update, deposited by\r
// deposit_stamp. 8 f32 = 32 bytes.\r
struct Rivulet {\r
  pos: vec2<f32>,    // surface UV\r
  vel: vec2<f32>,    // surface-UV / sec\r
  water: f32,        // remaining volume (depletes -> respawn)\r
  seed: f32,         // per-rivulet random seed\r
  pad0: f32,\r
  pad1: f32,\r
};\r
\r
// Per-surface drip controls (16 bytes).\r
struct DripConfig {\r
  amount: f32,   // 0 = off; scales deposit + respawn (how wet the streaming is)\r
  speed: f32,    // how fast rivulets run down\r
  width: f32,    // trail width\r
  meander: f32,  // horizontal wander\r
};\r
\r
struct Surface {\r
  homographyFwd: mat3x3<f32>, // surface UV -> image UV\r
  homographyInv: mat3x3<f32>, // image UV -> surface UV\r
  normalDir: vec2<f32>,       // screen-space displacement per unit splash height\r
  enabled: f32,\r
  simResolution: f32,\r
  worldNormal: vec3<f32>,     // 3D world normal of the plane (x right, y up, z toward camera)\r
  aspect: f32,                // quad world aspect (width/height) — keeps sim footprints round\r
};\r
\r
// One active impact (deposit_stamp / splash / droplets). 16 f32 = 64 bytes.\r
// Byte offsets documented in docs/shader-bindings.md for Dawn parity.\r
struct Impact {\r
  surfaceUV: vec2<f32>,    // 0\r
  birthFrame: f32,         // 8\r
  dropSize: f32,           // 12\r
  responseIndex: f32,      // 16\r
  incomingVelocity: f32,   // 20\r
  responseSeed: f32,       // 24\r
  visualGain: f32,         // 28\r
  heightOv: f32,           // 32\r
  widthOv: f32,            // 36\r
  bounceOv: f32,           // 40\r
  spreadOv: f32,           // 44\r
  lifetimeOv: f32,         // 48\r
  rippleImpulse: f32,      // 52\r
  wetnessDeposit: f32,     // 56\r
  waterDeposit: f32,       // 60\r
};\r
\r
// homography apply with perspective divide\r
fn apply_h(m: mat3x3<f32>, p: vec2<f32>) -> vec2<f32> {\r
  let r = m * vec3<f32>(p, 1.0);\r
  return r.xy / r.z;\r
}\r
\r
// fullscreen-triangle vertex helper\r
struct VSOut {\r
  @builtin(position) pos: vec4<f32>,\r
  @location(0) uv: vec2<f32>,\r
};\r
\r
fn fullscreen_vertex(vid: u32) -> VSOut {\r
  var out: VSOut;\r
  // 3-vertex covering triangle\r
  let x = f32((vid << 1u) & 2u);\r
  let y = f32(vid & 2u);\r
  out.uv = vec2<f32>(x, y);\r
  out.pos = vec4<f32>(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);\r
  return out;\r
}\r
`,kr=`// debug.wgsl — standalone debug-view overlay (build plan §4 step 14). For the\r
// browser demo the debug visualizations are produced inside wet_composite.wgsl\r
// (it already has surface UV + all state textures bound); this standalone pass is\r
// kept valid + Metal-portable as the separable Dawn form, and can render any\r
// single state texture directly to the output.\r
\r
@group(0) @binding(0) var<uniform> frame: Frame;\r
@group(0) @binding(1) var stateTex: texture_2d<f32>;\r
@group(0) @binding(2) var samp: sampler;\r
\r
@vertex\r
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {\r
  return fullscreen_vertex(vid);\r
}\r
\r
@fragment\r
fn fs(in: VSOut) -> @location(0) vec4<f32> {\r
  let s = textureSample(stateTex, samp, in.uv);\r
  let mode = frame.debugMode;\r
  var rgb = s.rgb;\r
  if (mode < 3.5) {\r
    rgb = vec3<f32>(s.r * 0.5);            // wetness\r
  } else if (mode < 6.5) {\r
    rgb = vec3<f32>(0.0, s.g * 0.5, s.g);  // pool\r
  } else {\r
    rgb = vec3<f32>(s.b * 0.5 + 0.5);      // ripple\r
  }\r
  return vec4<f32>(linear_to_srgb(rgb), 1.0);\r
}\r
`,Dr=`// deposit_stamp.wgsl — compute pass that writes per-texel impact deposits into\r
// depositTex (build plan §17, §28 fallback: compute deposit instead of float\r
// additive blending). Each invocation owns one texel and sums contributions from\r
// all active impacts, avoiding atomics/blend entirely.\r
//\r
// depositTex channels: R wetnessDeposit, G waterDeposit, B rippleImpulse, A unused.\r
\r
@group(0) @binding(0) var<uniform> frame: Frame;\r
@group(0) @binding(1) var<uniform> params: Params;\r
@group(0) @binding(2) var<storage, read> impacts: array<Impact>;\r
@group(0) @binding(3) var depositTex: texture_storage_2d<rgba16float, write>;\r
@group(0) @binding(4) var<uniform> surface: Surface;\r
@group(0) @binding(5) var<storage, read> rivulets: array<Rivulet>;\r
@group(0) @binding(6) var<uniform> drip: DripConfig;\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {\r
  let dim = textureDimensions(depositTex);\r
  if (gid.x >= dim.x || gid.y >= dim.y) {\r
    return;\r
  }\r
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) / vec2<f32>(f32(dim.x), f32(dim.y));\r
\r
  var wet = 0.0;\r
  var water = 0.0;\r
  var ripple = 0.0;\r
\r
  let count = arrayLength(&impacts);\r
  for (var i = 0u; i < count; i = i + 1u) {\r
    let imp = impacts[i];\r
    let age = frame.frameIndex - imp.birthFrame;\r
    let lifeFrames = max(1.0, imp.lifetimeOv); // lifetimeOv is baked in frames\r
    if (age < 0.0 || age > lifeFrames) {\r
      continue;\r
    }\r
    // temporal kernel: sharp at birth, decaying over a few frames\r
    let tw = exp(-age * 0.6);\r
    let wscale = max(0.2, params.rippleScale); // world/feature scale\r
    let radius = (0.0025 + 0.004 * imp.dropSize * max(0.2, params.splashWidth) * max(0.2, imp.widthOv)) * wscale;\r
    // Aspect-correct the footprint: the square sim UV is stretched onto a (often\r
    // very wide) calibration quad, so a circle in UV is an ellipse in the world\r
    // plane. Scaling the u offset by the quad aspect makes drops land as ROUND\r
    // rings in the world (the perspective then foreshortens them naturally).\r
    let delta = (uv - imp.surfaceUV) * vec2<f32>(surface.aspect, 1.0);\r
    let d = length(delta);\r
    let spatial = exp(-(d * d) / (radius * radius));\r
    // Puddle gate at the IMPACT point: a drop only rings where there is standing\r
    // water. On a dry patch it still dampens the ground a touch but emits no ring.\r
    let gate = puddleGate(imp.surfaceUV, params.puddleAmount, params.puddleScale, params.puddleEdge);\r
    wet = wet + imp.wetnessDeposit * spatial * tw * (0.3 + 0.7 * gate);\r
    water = water + imp.waterDeposit * spatial * tw * gate;\r
    // Ripple impulse footprint kept TIGHT (~2.5x smaller than before) so each drop\r
    // launches a small ring — dense like real rain on a puddle, not giant rings.\r
    let rippleRadius = (0.0016 + 0.0012 * imp.dropSize) * wscale;\r
    let rippleSpatial = exp(-(d * d) / (rippleRadius * rippleRadius));\r
    ripple = ripple + imp.rippleImpulse * rippleSpatial * exp(-age * 1.5) * gate;\r
  }\r
\r
  // --- rivulet trails: gather wet/water from the streaming particles. As each\r
  // rivulet runs down, it deposits here every step; the wet channel's persistence\r
  // turns that into a continuous trail behind the bright head. ---\r
  if (drip.amount > 0.001) {\r
    let rc = arrayLength(&rivulets);\r
    let rw = max(drip.width, 0.002) * max(0.2, params.rippleScale);\r
    for (var ri = 0u; ri < rc; ri = ri + 1u) {\r
      let rv = rivulets[ri];\r
      if (rv.water <= 0.0) { continue; }\r
      let dd = (uv - rv.pos) * vec2<f32>(surface.aspect, 1.0);\r
      let sp = exp(-dot(dd, dd) / (rw * rw));\r
      wet = wet + sp * drip.amount * 0.6 * rv.water;\r
      water = water + sp * drip.amount * 0.35 * rv.water;\r
      // the running rivulet disturbs the wave field too, so it reads as live\r
      // water interacting with the sim (a faint wake), not a painted-on streak\r
      ripple = ripple + sp * drip.amount * 0.04 * rv.water;\r
    }\r
  }\r
\r
  textureStore(depositTex, vec2<i32>(i32(gid.x), i32(gid.y)),\r
    vec4<f32>(wet, water, ripple, 0.0));\r
}\r
`,Pr=`// droplets.wgsl — instanced analytic ballistic droplets (build plan §15.2, §20\r
// pass G). One instance per (impact, droplet-slot). Position is evaluated\r
// directly from event time — no CPU particle integration:\r
//   uv(age)    = uv0 + lateralVelocity * age\r
//   height(age)= verticalVelocity * age - 0.5 * g * age^2\r
// Height is projected along the art-directed surface normal.\r
\r
const MAX_DROPLETS: u32 = 12u;\r
const GRAVITY: f32 = 9.8;\r
\r
@group(0) @binding(0) var<uniform> frame: Frame;\r
@group(0) @binding(1) var<uniform> params: Params;\r
@group(0) @binding(2) var<uniform> surface: Surface;\r
@group(0) @binding(3) var<storage, read> impacts: array<Impact>;\r
@group(0) @binding(4) var envTex: texture_2d<f32>; // sky the droplets reflect\r
@group(0) @binding(5) var samp: sampler;\r
\r
struct DropVSOut {\r
  @builtin(position) pos: vec4<f32>,\r
  @location(0) local: vec2<f32>,\r
  @location(1) alpha: f32,\r
};\r
\r
const QUAD = array<vec2<f32>, 6>(\r
  vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),\r
  vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)\r
);\r
\r
@vertex\r
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> DropVSOut {\r
  var out: DropVSOut;\r
  let impIndex = iid / MAX_DROPLETS;\r
  let slot = iid % MAX_DROPLETS;\r
  let imp = impacts[impIndex];\r
\r
  let seed = u32(imp.responseSeed);\r
  let a0 = rand01(seed, slot, 11u);\r
  let a1 = rand01(seed, slot, 12u);\r
  let a2 = rand01(seed, slot, 13u);\r
\r
  let ageFrames = frame.frameIndex - imp.birthFrame;\r
  let age = ageFrames / 30.0; // seconds\r
\r
  let dir = a0 * 6.2831853;\r
  // Ballistic hop: launch up, full gravity pulls it back down. The bead exists\r
  // ONLY for the duration of its arc (birth -> landing), so it rises AND falls\r
  // and then is gone — instead of drifting away forever.\r
  let vVel = (0.5 + 0.6 * a1) * params.splashHeight * imp.heightOv * 1.1;\r
  let tLand = max(0.05, 2.0 * vVel / GRAVITY);   // time to fall back to the surface\r
  let alive = ageFrames >= 0.0 && age < tLand;\r
\r
  // emit a handful of the slots (scaled by spread)\r
  let emit = a2 < clamp(0.30 + imp.spreadOv * 0.30, 0.0, 0.85);\r
\r
  if (!alive || !emit || surface.enabled < 0.5) {\r
    out.pos = vec4<f32>(2.0, 2.0, 2.0, 1.0);\r
    out.local = vec2<f32>(0.0);\r
    out.alpha = 0.0;\r
    return out;\r
  }\r
\r
  // small lateral drift (ejecta don't travel far) + gravity arc lifted along the\r
  // surface normal; the 6x makes the small hop read at screen scale.\r
  let lateralSpeed = (0.3 + 0.5 * a1) * params.spread * imp.spreadOv * 0.012;\r
  let lateral = vec2<f32>(cos(dir), sin(dir)) * lateralSpeed;\r
  let h = max(0.0, vVel * age - 0.5 * GRAVITY * age * age);\r
\r
  let imgUV0 = apply_h(surface.homographyFwd, imp.surfaceUV);\r
  let center = imgUV0 + lateral * age + surface.normalDir * h * 6.0;\r
\r
  // Tiny beads. Scale via params.dropletScale ("Droplet scale" slider).\r
  let radius = 0.0007 * params.dropletScale * imp.dropSize * (0.6 + 0.4 * a1);\r
  let q = QUAD[vid];\r
  let aspect = frame.resolution.x / max(frame.resolution.y, 1.0);\r
  let p = center + vec2<f32>(q.x, q.y * aspect) * radius;\r
\r
  out.pos = vec4<f32>(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);\r
  out.local = q;\r
  // brightest at launch, fades as it falls back and lands\r
  out.alpha = (1.0 - age / tLand) * imp.visualGain * params.visualGain * 0.8;\r
  return out;\r
}\r
\r
@fragment\r
fn fs(in: DropVSOut) -> @location(0) vec4<f32> {\r
  let r = length(in.local);\r
  if (r > 1.0) {\r
    discard;\r
  }\r
  // Sphere-imposter shading (the lightweight take on screen-space fluid droplets):\r
  // treat the quad as a little water bead. Reconstruct a hemisphere normal, give\r
  // it a Fresnel rim that reflects the sky env, a bright specular glint, and a\r
  // soft body — so droplets read as rounded lit water beads, not flat sprites.\r
  let nz = sqrt(max(0.0, 1.0 - r * r));\r
  let n = vec3<f32>(in.local.x, in.local.y, nz);\r
\r
  // reflect the sky env across the bead (rim grabs more sky -> Fresnel)\r
  let fres = pow(1.0 - nz, 3.0);\r
  let envUV = clamp(vec2<f32>(0.5 + n.x * 0.45, 0.18 - n.y * 0.35), vec2<f32>(0.0), vec2<f32>(1.0));\r
  let sky = textureSampleLevel(envTex, samp, envUV, 0.0).rgb;\r
\r
  // specular glint toward the art-directed light\r
  let lightDir = normalize(vec3<f32>(cos(params.specularDirection), sin(params.specularDirection), 0.8));\r
  let spec = pow(max(dot(n, lightDir), 0.0), 24.0);\r
\r
  let body = sky * (0.5 + 0.8 * fres) + vec3<f32>(1.0) * spec * 0.9;\r
  // fuller/brighter toward the bead centre; fade over the droplet's life\r
  let cover = (0.45 + 0.55 * nz) * in.alpha;\r
  return vec4<f32>(body * cover, cover); // additive (premultiplied) over the wet color\r
}\r
`,Br=`// flow_build.wgsl — construct the visual flow field (build plan §16.2):\r
//   flow = baseFlow + explicitBias\r
//        - flowDeflection * gradient(reliefHeight)\r
//        + boundaryWrap * tangent(reliefBoundary)\r
// The boundary-wrap term is deliberately art-directed so water visibly divides\r
// around a raised intake even when the derived field would read weakly.\r
\r
struct FlowConfig {\r
  baseFlow: vec2<f32>,\r
  bias: vec2<f32>,\r
};\r
\r
@group(0) @binding(0) var<uniform> params: Params;\r
@group(0) @binding(1) var<uniform> flowConfig: FlowConfig;\r
@group(0) @binding(2) var reliefTex: texture_2d<f32>;  // R height, GB gradient, A mag\r
@group(0) @binding(3) var maskTex: texture_2d<f32>;\r
@group(0) @binding(4) var linSamp: sampler;\r
@group(0) @binding(5) var flowOut: texture_storage_2d<rgba16float, write>;\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {\r
  let dim = textureDimensions(flowOut);\r
  if (gid.x >= dim.x || gid.y >= dim.y) {\r
    return;\r
  }\r
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) / vec2<f32>(f32(dim.x), f32(dim.y));\r
\r
  let relief = textureSampleLevel(reliefTex, linSamp, uv, 0.0);\r
  let grad = relief.yz;\r
  let mag = relief.w;\r
\r
  var flow = flowConfig.baseFlow + flowConfig.bias;\r
\r
  // deflect downhill away from raised relief\r
  flow = flow - params.flowDeflection * grad;\r
\r
  // boundary wrap: tangent to the relief gradient (perpendicular), strongest near\r
  // the boundary where |grad| is large.\r
  let tangent = vec2<f32>(-grad.y, grad.x);\r
  let wrapWeight = params.boundaryWrap * clamp(mag * 0.5, 0.0, 1.0);\r
  // choose the tangent side that routes around the feature\r
  let side = sign(dot(tangent, flowConfig.baseFlow) + 1e-4);\r
  flow = flow + tangent * wrapWeight * side;\r
\r
  let mask = textureSampleLevel(maskTex, linSamp, uv, 0.0).r;\r
  flow = flow * step(0.01, mask);\r
\r
  let m = length(flow);\r
  textureStore(flowOut, vec2<i32>(i32(gid.x), i32(gid.y)),\r
    vec4<f32>(flow.x, flow.y, m, 0.0));\r
}\r
`,Mr=`// plate_linearize.wgsl — sample the sRGB source plate and write a linear-light\r
// rgba16float working texture (build plan §19). All wet compositing happens in\r
// linear light; we re-encode only at final output.\r
\r
@group(0) @binding(0) var inputTex: texture_2d<f32>;\r
@group(0) @binding(1) var samp: sampler;\r
\r
@vertex\r
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {\r
  return fullscreen_vertex(vid);\r
}\r
\r
@fragment\r
fn fs(in: VSOut) -> @location(0) vec4<f32> {\r
  let c = textureSample(inputTex, samp, in.uv);\r
  return vec4<f32>(srgb_to_linear(c.rgb), c.a);\r
}\r
`,Gr=`// relief_gradient.wgsl — derive relief gradient + magnitude from the relief\r
// height texture (build plan §16.1 steps 4-5). Input R = height (CPU-rasterized\r
// in the demo); output packs R=height, G=grad.x, B=grad.y, A=|grad|.\r
\r
@group(0) @binding(0) var reliefIn: texture_2d<f32>;\r
@group(0) @binding(1) var linSamp: sampler;\r
@group(0) @binding(2) var reliefOut: texture_storage_2d<rgba16float, write>;\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {\r
  let dim = textureDimensions(reliefOut);\r
  if (gid.x >= dim.x || gid.y >= dim.y) {\r
    return;\r
  }\r
  let texel = 1.0 / vec2<f32>(f32(dim.x), f32(dim.y));\r
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) * texel;\r
\r
  let hl = textureSampleLevel(reliefIn, linSamp, uv - vec2<f32>(texel.x, 0.0), 0.0).r;\r
  let hr = textureSampleLevel(reliefIn, linSamp, uv + vec2<f32>(texel.x, 0.0), 0.0).r;\r
  let hd = textureSampleLevel(reliefIn, linSamp, uv - vec2<f32>(0.0, texel.y), 0.0).r;\r
  let hu = textureSampleLevel(reliefIn, linSamp, uv + vec2<f32>(0.0, texel.y), 0.0).r;\r
  let h = textureSampleLevel(reliefIn, linSamp, uv, 0.0).r;\r
\r
  let grad = vec2<f32>((hr - hl) * 0.5, (hu - hd) * 0.5) / texel;\r
  let mag = length(grad);\r
  textureStore(reliefOut, vec2<i32>(i32(gid.x), i32(gid.y)),\r
    vec4<f32>(h, grad.x, grad.y, mag));\r
}\r
`,Rr=`// relief_raster.wgsl — GPU rasterization of relief shapes into the height texture\r
// (build plan §16.1). The browser demo currently rasterizes relief on the CPU\r
// (src/engine/geometry/ReliefShapes.js) and uploads the result; this GPU form is\r
// kept valid + Metal-portable for the Dawn bridge. Shapes are supplied as a\r
// storage buffer of ellipse/polygon-bbox primitives.\r
\r
struct ReliefShape {\r
  center: vec2<f32>,\r
  radius: vec2<f32>,\r
  rotation: f32,\r
  height: f32,\r
  softness: f32,\r
  mode: f32, // 0 raised, 1 depression, 2 ridge\r
};\r
\r
@group(0) @binding(0) var<uniform> params: Params;\r
@group(0) @binding(1) var<storage, read> shapes: array<ReliefShape>;\r
@group(0) @binding(2) var reliefOut: texture_storage_2d<rgba16float, write>;\r
\r
fn smooth01(a: f32, b: f32, x: f32) -> f32 {\r
  let t = clamp((x - a) / (b - a), 0.0, 1.0);\r
  return t * t * (3.0 - 2.0 * t);\r
}\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {\r
  let dim = textureDimensions(reliefOut);\r
  if (gid.x >= dim.x || gid.y >= dim.y) {\r
    return;\r
  }\r
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) / vec2<f32>(f32(dim.x), f32(dim.y));\r
\r
  var h = 0.0;\r
  let count = arrayLength(&shapes);\r
  for (var i = 0u; i < count; i = i + 1u) {\r
    let s = shapes[i];\r
    let co = cos(-s.rotation);\r
    let si = sin(-s.rotation);\r
    let lx = (uv.x - s.center.x) * co - (uv.y - s.center.y) * si;\r
    let ly = (uv.x - s.center.x) * si + (uv.y - s.center.y) * co;\r
    let k = length(vec2<f32>(lx / s.radius.x, ly / s.radius.y));\r
    let sd = (k - 1.0) * min(s.radius.x, s.radius.y);\r
    let soft = max(1e-3, s.softness);\r
    var profile = smooth01(soft, -soft, sd); // 1 inside -> 0 outside\r
    if (s.mode > 1.5) {\r
      profile = max(0.0, 1.0 - abs(sd) / soft); // ridge band\r
    } else if (s.mode > 0.5) {\r
      profile = -profile; // depression\r
    }\r
    h = h + profile * s.height;\r
  }\r
\r
  textureStore(reliefOut, vec2<i32>(i32(gid.x), i32(gid.y)),\r
    vec4<f32>(h * params.reliefHeight, 0.0, 0.0, 0.0));\r
}\r
`,Vr=`// ripple_update.wgsl — separable ripple solver (damped wave). For the browser\r
// demo the ripple step is merged into wet_update.wgsl for one fewer ping-pong;\r
// this standalone form is kept valid + Metal-portable for the Dawn bridge, which\r
// may prefer separate passes. Reads state + deposit, writes B/A (ripple h/v) and\r
// passes wetness/water through unchanged.\r
\r
@group(0) @binding(0) var<uniform> frame: Frame;\r
@group(0) @binding(1) var<uniform> params: Params;\r
@group(0) @binding(2) var stateIn: texture_2d<f32>;\r
@group(0) @binding(3) var depositTex: texture_2d<f32>;\r
@group(0) @binding(4) var linSamp: sampler;\r
@group(0) @binding(5) var stateOut: texture_storage_2d<rgba16float, write>;\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {\r
  let dim = textureDimensions(stateOut);\r
  if (gid.x >= dim.x || gid.y >= dim.y) {\r
    return;\r
  }\r
  let res = vec2<f32>(f32(dim.x), f32(dim.y));\r
  let texel = 1.0 / res;\r
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) * texel;\r
  let dt = max(frame.simDt, 1.0 / 120.0);\r
\r
  let c = textureSampleLevel(stateIn, linSamp, uv, 0.0);\r
  let l = textureSampleLevel(stateIn, linSamp, uv - vec2<f32>(texel.x, 0.0), 0.0).b;\r
  let r = textureSampleLevel(stateIn, linSamp, uv + vec2<f32>(texel.x, 0.0), 0.0).b;\r
  let d = textureSampleLevel(stateIn, linSamp, uv - vec2<f32>(0.0, texel.y), 0.0).b;\r
  let u = textureSampleLevel(stateIn, linSamp, uv + vec2<f32>(0.0, texel.y), 0.0).b;\r
  let deposit = textureSampleLevel(depositTex, linSamp, uv, 0.0);\r
\r
  let lap = (l + r + d + u) - 4.0 * c.b;\r
  var vel = c.a + (0.25 * lap - 2.5 * c.a) * dt + deposit.b;\r
  var hgt = clamp(c.b + vel * dt, -4.0, 4.0);\r
\r
  textureStore(stateOut, vec2<i32>(i32(gid.x), i32(gid.y)),\r
    vec4<f32>(c.r, c.g, hgt, vel));\r
}\r
`,Ar=`// rivulet_update.wgsl — advance the per-surface water rivulets (drip / streaming
// on a windshield or any running surface). One thread per rivulet. Rivulets run
// DOWN the surface along the flow field + gravity, meander a little, lose volume,
// and respawn at the top when depleted or off-surface. They deposit a wet trail
// in deposit_stamp (gather), which the main composite then renders as streaming
// water — no separate "drip look", it mixes into the same wet state.
//
// Forces are deterministic functions of (index, frameIndex, seed) so a replayed
// sim reproduces the same streaming.

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<storage, read_write> rivulets: array<Rivulet>;
@group(0) @binding(2) var flowTex: texture_2d<f32>;
@group(0) @binding(3) var<uniform> drip: DripConfig;
@group(0) @binding(4) var linSamp: sampler;

@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= arrayLength(&rivulets)) { return; }
  if (drip.amount < 0.001) { return; } // streaming off for this surface

  var r = rivulets[i];
  let dt = max(frame.simDt, 1.0 / 120.0);

  // direction: the surface's runoff flow plus a downward gravity bias (+v = down)
  let flow = textureSampleLevel(flowTex, linSamp, clamp(r.pos, vec2<f32>(0.0), vec2<f32>(1.0)), 0.0).xy;
  let dir = normalize(flow + vec2<f32>(0.0, 1.5) + vec2<f32>(1.0e-5, 0.0));
  // horizontal meander + per-rivulet speed variation
  let wob = sin(r.pos.y * 18.0 + r.seed + frame.timeSeconds * 1.5) * drip.meander;
  let speed = drip.speed * (0.5 + 0.8 * fract(r.seed * 0.013));
  r.vel = dir * speed + vec2<f32>(wob * 0.15, 0.0);
  r.pos = r.pos + r.vel * dt;
  r.water = r.water - dt * 0.15; // streaming bleeds volume as it runs

  // respawn at the top edge with a fresh column when depleted or off-surface
  if (r.water <= 0.0 || r.pos.y > 1.05 || r.pos.x < -0.05 || r.pos.x > 1.05) {
    let fi = u32(max(frame.frameIndex, 0.0));
    let h = rand01(i, fi, bitcast<u32>(r.seed));
    let h2 = rand01(i + 7u, fi + 13u, bitcast<u32>(r.seed));
    r.pos = vec2<f32>(h, -0.02);
    r.vel = vec2<f32>(0.0, 0.0);
    r.water = 0.6 + 0.4 * h2;
    r.seed = h2 * 1000.0;
  }

  rivulets[i] = r;
}
`,Or=`// splash.wgsl — instanced contact splashes (build plan §15, §20 pass F). One\r
// instance per active impact draws a screen-space quad with an analytic contact\r
// ring + lifted crown. Engine draws 6 vertices * impactCount with additive blend.\r
// Crowns lift along the artist-defined surface normal (surface.normalDir).\r
\r
@group(0) @binding(0) var<uniform> frame: Frame;\r
@group(0) @binding(1) var<uniform> params: Params;\r
@group(0) @binding(2) var<uniform> surface: Surface;\r
@group(0) @binding(3) var<storage, read> impacts: array<Impact>;\r
\r
struct SplashVSOut {\r
  @builtin(position) pos: vec4<f32>,\r
  @location(0) local: vec2<f32>,   // [-1,1] quad coords\r
  @location(1) life: f32,          // age fraction 0..1\r
  @location(2) gain: f32,\r
};\r
\r
const QUAD = array<vec2<f32>, 6>(\r
  vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),\r
  vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)\r
);\r
\r
@vertex\r
fn vs(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> SplashVSOut {\r
  var out: SplashVSOut;\r
  let imp = impacts[iid];\r
  let ageFrames = frame.frameIndex - imp.birthFrame;\r
  let lifeFrames = max(1.0, imp.lifetimeOv);\r
  let t = ageFrames / lifeFrames;\r
\r
  // off-screen collapse for inactive impacts\r
  if (ageFrames < 0.0 || t > 1.0 || surface.enabled < 0.5) {\r
    out.pos = vec4<f32>(2.0, 2.0, 2.0, 1.0);\r
    out.local = vec2<f32>(0.0);\r
    out.life = 0.0;\r
    out.gain = 0.0;\r
    return out;\r
  }\r
\r
  let imgUV = apply_h(surface.homographyFwd, imp.surfaceUV);\r
  // Small crown lift — the heightfield ripple now provides the spreading ring, so\r
  // this pass is just the brief sparkle of the drop striking, not a big crown.\r
  let crownH = sin(clamp(t, 0.0, 1.0) * 3.14159) * imp.heightOv * params.splashHeight * 0.3;\r
  let lift = surface.normalDir * crownH;\r
  let center = imgUV + lift;\r
\r
  // A small, roughly fixed-size dot (NOT an expanding ring — the water handles\r
  // that). The old expanding white ring duplicated the ripple and read as a blob.\r
  let radius = (0.004 + 0.006 * imp.dropSize) * imp.widthOv * max(0.3, params.splashWidth)\r
             * (0.8 + 0.3 * t);\r
  let q = QUAD[vid];\r
  let aspect = frame.resolution.x / max(frame.resolution.y, 1.0);\r
  let p = center + vec2<f32>(q.x, q.y * aspect) * radius;\r
\r
  out.pos = vec4<f32>(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);\r
  out.local = q;\r
  out.life = t;\r
  out.gain = imp.visualGain * params.visualGain;\r
  return out;\r
}\r
\r
@fragment\r
fn fs(in: SplashVSOut) -> @location(0) vec4<f32> {\r
  let r = length(in.local);\r
  if (r > 1.0) {\r
    discard;\r
  }\r
  // Just a brief bright impact sparkle: a soft dot that pops the instant the\r
  // drop lands and is gone within a few frames. The spreading ring comes from the\r
  // water sim now, so there is no ring here — this only adds the "tick" of impact.\r
  let core = smoothstep(1.0, 0.0, r);\r
  let flash = pow(1.0 - in.life, 4.0);\r
  let intensity = core * flash * in.gain * 0.55;\r
  let rgb = vec3<f32>(0.90, 0.95, 1.0) * intensity;\r
  return vec4<f32>(rgb, intensity); // premultiplied; engine uses additive blend\r
}\r
`,Cr=`// wet_composite.wgsl — base wet composite + wet-look treatment (build plan §18).
// Runs once per surface, reading the previous linear color and compositing this
// surface's wet contribution. A final invocation with a disabled surface and
// compositeConfig.encode=1 performs the linear->sRGB encode to the output target.
//
// Two ways in:
//  - fs       fullscreen pass: screen->surface via the perspective homography
//             (flat planes). Also handles debug views + the final sRGB encode.
//  - fs_warp  mesh pass: a tessellated, BENT plane feeds surface UV per vertex
//             (curved surfaces), so no homography/inverse is needed. Linear
//             intermediate only; the shared wetCompositeLinear() does the look.
//
// Debug visualizations (build plan §4 step 14) are produced here when
// params.debugMode > 0.

struct CompositeConfig {
  encode: f32,        // 1 => linear_to_srgb on output
  pad0: f32,
  pad1: f32,
  pad2: f32,
};

@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var<uniform> params: Params;
@group(0) @binding(2) var<uniform> surface: Surface;
@group(0) @binding(3) var colorIn: texture_2d<f32>;
@group(0) @binding(4) var stateTex: texture_2d<f32>;
@group(0) @binding(5) var reliefTex: texture_2d<f32>;
@group(0) @binding(6) var flowTex: texture_2d<f32>;
@group(0) @binding(7) var maskTex: texture_2d<f32>;
@group(0) @binding(8) var microTex: texture_2d<f32>;
@group(0) @binding(9) var samp: sampler;
@group(0) @binding(10) var<uniform> cfg: CompositeConfig;
@group(0) @binding(11) var envTex: texture_2d<f32>; // environment/sky the puddle reflects

@vertex
fn vs(@builtin(vertex_index) vid: u32) -> VSOut {
  return fullscreen_vertex(vid);
}

fn encodeOut(rgb: vec3<f32>) -> vec3<f32> {
  if (cfg.encode > 0.5) {
    return linear_to_srgb(rgb);
  }
  return rgb;
}

// Fresnel-like weight: tilted ripple flanks (small n.z) reflect more strongly.
fn fresnelTilt(n: vec3<f32>) -> f32 {
  return pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0);
}

// Shared wet look. Given a surface-UV sample point, the screen UV under it, and
// the background colour there, return the LINEAR composited colour (not encoded).
// Returns \`base\` unchanged where the mask is empty.
fn wetCompositeLinear(surfUV: vec2<f32>, imgUV: vec2<f32>, base: vec3<f32>) -> vec3<f32> {
  let mask = textureSampleLevel(maskTex, samp, surfUV, 0.0).r;
  if (mask < 0.01) {
    return base;
  }

  let state = textureSampleLevel(stateTex, samp, surfUV, 0.0);     // wet, water, rippleH, rippleV
  let relief = textureSampleLevel(reliefTex, samp, surfUV, 0.0);   // height, gx, gy, mag
  let flow = textureSampleLevel(flowTex, samp, surfUV, 0.0).xy;

  let wet = state.r;
  let water = state.g;
  let rippleH = state.b;

  // It is raining, so the masked ground reads wet — but how MUCH standing water
  // sits there at rest is the "Water Level" control, art-directed into PUDDLES by
  // a fractal-noise field: low spots pool, high spots stay merely damp. Puddle
  // Amount fades between uniform wetness and noise-carved puddles; Scale sets the
  // blob frequency; Edge sharpens the puddle boundary. Accumulated \`wet\` from
  // drops always pushes toward saturated on top.
  let gate = puddleGate(surfUV, params.puddleAmount, params.puddleScale, params.puddleEdge);
  let wetFloor = mask * params.waterLevel * gate;
  let wetAmt = clamp(max(wet, wetFloor), 0.0, 1.0);
  let pool = clamp(water, 0.0, 1.0);

  // ---- surface normal from the heightfield ripple gradient (+ micro breakup) ----
  let texel = 1.0 / max(surface.simResolution, 16.0);
  let rl = textureSampleLevel(stateTex, samp, surfUV - vec2<f32>(texel, 0.0), 0.0).b;
  let rr = textureSampleLevel(stateTex, samp, surfUV + vec2<f32>(texel, 0.0), 0.0).b;
  let rd = textureSampleLevel(stateTex, samp, surfUV - vec2<f32>(0.0, texel), 0.0).b;
  let ru = textureSampleLevel(stateTex, samp, surfUV + vec2<f32>(0.0, texel), 0.0).b;
  let ripGrad = vec2<f32>(rr - rl, ru - rd);
  let ripSlope = length(ripGrad);
  var n = vec3<f32>(-ripGrad * params.rippleNormalStrength * 4.0, 1.0);
  let micro = textureSampleLevel(microTex, samp, surfUV * 6.0, 0.0).xy * 2.0 - 1.0;
  n = normalize(n + vec3<f32>(micro * params.microNormalStrength * 0.3 * wetAmt, 0.0));

  // ---- Real water surface: Fresnel blend of REFRACTION (the bottom seen
  // through the film) and REFLECTION (what's above the surface), plus a sharp
  // specular glint. Same model as ThinMatrix / chinedufn water; with a single
  // locked plate we sample the plate as both the refracted bottom AND (offset
  // toward the horizon) the reflection. Because the ground is drawn in
  // perspective, the view is GRAZING toward the far edge (surfUV.y -> 0), so
  // Fresnel makes the puddle mirror-like in the distance and transparent up
  // close — which is exactly why reference puddle photos look so reflective. ----
  let distMag = 0.015 + 0.05 * params.distortion;

  // REFRACTION: darkened, ripple-distorted view of the ground beneath the film,
  // plus CAUSTICS — ripple crests act as lenses that focus light onto the bottom
  // (the bright wavy light webgpu-water shows). Concave surface (negative
  // Laplacian of the ripple height) => focused/brighter.
  let refrUV = imgUV + n.xy * distMag;
  let bottom = textureSampleLevel(colorIn, samp, refrUV, 0.0).rgb;
  let lap = (rl + rr + rd + ru) - 4.0 * rippleH;
  let caustic = clamp(-lap * 5.0, 0.0, 1.5);
  let refrCol = bottom * (1.0 - params.wetDarkening * 0.7 * wetAmt)
              + vec3<f32>(1.0, 0.97, 0.88) * caustic * wetAmt * 0.45;

  // REFLECTION: mirror a SPHERICAL sky (equirectangular env / HDRI) — NOT the
  // plate. Build a world reflection direction from the heightfield normal and
  // the surface's WORLD normal (set by the gizmo); grazing toward the horizon
  // lowers the elevation and the ripple normal shimmers the azimuth.
  let grazing = clamp(1.0 - surfUV.y, 0.0, 1.0);
  let wn = surface.worldNormal;
  let refl = normalize(vec3<f32>(
    wn.x * 1.5 + n.x * 2.2,
    mix(max(wn.z, 0.05), 0.2, grazing),
    -wn.y * 1.5 + n.y * 2.2 + grazing * 0.5,
  ));
  let lon = atan2(refl.x, refl.z) / 6.2831853 + 0.5;
  let envUV = vec2<f32>(fract(lon), clamp(0.5 - 0.5 * refl.y, 0.0, 1.0));
  let envCol = textureSampleLevel(envTex, samp, envUV, 0.0).rgb;
  let reflCol = envCol + vec3<f32>(0.5, 0.58, 0.72) * ripSlope * 0.4;

  // Fresnel: rises toward the grazing far edge and on tilted ripple flanks.
  let fres = clamp(mix(0.06, 0.9, grazing * grazing) + fresnelTilt(n) * 0.8, 0.0, 1.0);

  let waterCol = mix(refrCol, reflCol, fres);
  var col = mix(base, waterCol, wetAmt);
  let lum = luminance(col);
  col = mix(vec3<f32>(lum), col, 1.0 + params.saturationShift * wetAmt);

  // ---- specular glint (Blinn-Phong). The VIEW direction is the plane's world
  // normal (set by the orientation wheel), not a fixed straight-down — so tilting
  // the wheel changes the angle the ripples are *seen* at and the glints rake
  // across the surface, making the drops feel placed in the scene. ----
  let viewDir = normalize(vec3<f32>(wn.x, wn.y, max(wn.z, 0.2)));
  let lightDir = normalize(vec3<f32>(cos(params.specularDirection), sin(params.specularDirection), 0.55));
  let halfV = normalize(lightDir + viewDir);
  let spec = pow(max(dot(n, halfV), 0.0), mix(18.0, 220.0, 1.0 - clamp(params.specularWidth, 0.0, 1.0)));
  col = col + spec * params.specularGain * (0.4 + 0.7 * wetAmt);

  // ---- splash CROWN + central jet: displaced, lit water (no sprite). The crown
  // brightness is scaled DOWN (0.4) so the Splash Height slider ramps gradually
  // across its range instead of blowing to white within the first fraction. ----
  let crown = smoothstep(0.02, 0.4, rippleH);
  col = col + vec3<f32>(0.85, 0.90, 1.0) * crown * (0.45 + 0.9 * fres) * wetAmt * params.splashHeight * 0.4;

  // ---- reflective pooling: standing water is more mirror-like + glints harder.
  col = mix(col, reflCol, pool * 0.4 * params.poolHighlight);
  col = col + params.poolHighlight * 0.4 * pool * spec;

  // ---- flow streaks (subtle directional smear on the wet sheen) — low frequency
  // and gentle so they read as faint runoff, not a confusing repeating glint ----
  let streak = sin((surfUV.x * flow.y - surfUV.y * flow.x) * 28.0) * 0.5 + 0.5;
  col = col * (1.0 - params.flowStreakStrength * 0.05 * streak * wetAmt);

  // ---- edge bead near mask boundary ----
  let beadL = textureSampleLevel(maskTex, samp, surfUV - vec2<f32>(texel, 0.0), 0.0).r;
  let beadR = textureSampleLevel(maskTex, samp, surfUV + vec2<f32>(texel, 0.0), 0.0).r;
  let edge = abs(beadR - beadL);
  col = col + params.edgeBead * 0.3 * edge * wetAmt;

  col = col * params.visualGain;
  return col;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let imgUV = in.uv;
  var base = textureSampleLevel(colorIn, samp, imgUV, 0.0).rgb;

  if (surface.enabled < 0.5) {
    return vec4<f32>(encodeOut(base), 1.0);
  }

  let surfUV = apply_h(surface.homographyInv, imgUV);
  let inBounds = surfUV.x >= 0.0 && surfUV.x <= 1.0 && surfUV.y >= 0.0 && surfUV.y <= 1.0;
  if (!inBounds) {
    return vec4<f32>(encodeOut(base), 1.0);
  }

  // ---- debug views ----
  if (params.debugMode > 0.5) {
    let mask = textureSampleLevel(maskTex, samp, surfUV, 0.0).r;
    let state = textureSampleLevel(stateTex, samp, surfUV, 0.0);
    let relief = textureSampleLevel(reliefTex, samp, surfUV, 0.0);
    let flow = textureSampleLevel(flowTex, samp, surfUV, 0.0).xy;
    var dbg = base;
    let m = params.debugMode;
    if (m < 1.5) { dbg = vec3<f32>(surfUV, 0.0); }
    else if (m < 2.5) { dbg = vec3<f32>(fract(surfUV * 8.0), 0.5); }
    else if (m < 3.5) { dbg = vec3<f32>(state.r * 0.5); }
    else if (m < 4.5) { dbg = vec3<f32>(relief.r * 0.5 + 0.5); }
    else if (m < 5.5) { dbg = vec3<f32>(flow * 0.5 + 0.5, 0.5); }
    else if (m < 6.5) { dbg = vec3<f32>(0.0, state.g * 0.5, state.g); }
    else if (m < 7.5) { dbg = vec3<f32>(state.b * 0.5 + 0.5); }
    else { dbg = vec3<f32>(mask); }
    dbg = mix(base, dbg, step(0.01, mask));
    return vec4<f32>(encodeOut(dbg), 1.0);
  }

  return vec4<f32>(encodeOut(wetCompositeLinear(surfUV, imgUV, base)), 1.0);
}

// ---- warp mesh path: a bent plane feeds surface UV per vertex ----
struct WarpVSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) imgUV: vec2<f32>,   // screen UV (the bent image position)
  @location(1) surfUV: vec2<f32>,  // undeformed surface UV
};

@vertex
fn vs_warp(@location(0) posImg: vec2<f32>, @location(1) suv: vec2<f32>) -> WarpVSOut {
  var out: WarpVSOut;
  out.imgUV = posImg;
  out.surfUV = suv;
  // image UV (y-down, [0,1]) -> clip space
  out.pos = vec4<f32>(posImg.x * 2.0 - 1.0, 1.0 - posImg.y * 2.0, 0.0, 1.0);
  return out;
}

@fragment
fn fs_warp(in: WarpVSOut) -> @location(0) vec4<f32> {
  let base = textureSampleLevel(colorIn, samp, in.imgUV, 0.0).rgb;
  // linear intermediate (encode happens in the final fullscreen encode pass)
  return vec4<f32>(wetCompositeLinear(in.surfUV, in.imgUV, base), 1.0);
}
`,Er=`// wet_update.wgsl — fixed-step wet-state solver (build plan §17.1). One compute\r
// dispatch advances the full state texture (ping-pong). This is a visual solver,\r
// NOT conservation-grade fluid.\r
//\r
// state channels (rgba16float): R wetness, G shallow-water, B ripple height,\r
// A ripple velocity.\r
\r
@group(0) @binding(0) var<uniform> frame: Frame;\r
@group(0) @binding(1) var<uniform> params: Params;\r
@group(0) @binding(2) var stateIn: texture_2d<f32>;\r
@group(0) @binding(3) var depositTex: texture_2d<f32>;\r
@group(0) @binding(4) var flowTex: texture_2d<f32>;\r
@group(0) @binding(5) var reliefTex: texture_2d<f32>;\r
@group(0) @binding(6) var maskTex: texture_2d<f32>;\r
@group(0) @binding(7) var linSamp: sampler;\r
@group(0) @binding(8) var stateOut: texture_storage_2d<rgba16float, write>;\r
\r
fn sampleState(uv: vec2<f32>) -> vec4<f32> {\r
  return textureSampleLevel(stateIn, linSamp, uv, 0.0);\r
}\r
\r
@compute @workgroup_size(8, 8, 1)\r
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {\r
  let dim = textureDimensions(stateOut);\r
  if (gid.x >= dim.x || gid.y >= dim.y) {\r
    return;\r
  }\r
  let res = vec2<f32>(f32(dim.x), f32(dim.y));\r
  let texel = 1.0 / res;\r
  let uv = (vec2<f32>(f32(gid.x), f32(gid.y)) + 0.5) * texel;\r
  let dt = max(frame.simDt, 1.0 / 120.0);\r
\r
  let mask = textureSampleLevel(maskTex, linSamp, uv, 0.0).r;\r
  let deposit = textureSampleLevel(depositTex, linSamp, uv, 0.0);\r
  let flow = textureSampleLevel(flowTex, linSamp, uv, 0.0).xy;\r
\r
  // --- advect wetness/water by backtracing along the flow field ---\r
  let advectStep = flow * params.flowSpeed * dt;\r
  let srcUV = clamp(uv - advectStep, vec2<f32>(0.0), vec2<f32>(1.0));\r
  let advected = sampleState(srcUV);\r
\r
  var wet = advected.r;\r
  var water = advected.g;\r
\r
  // --- diffusion (4-tap) ---\r
  let l = sampleState(uv - vec2<f32>(texel.x, 0.0));\r
  let r = sampleState(uv + vec2<f32>(texel.x, 0.0));\r
  let d = sampleState(uv - vec2<f32>(0.0, texel.y));\r
  let u = sampleState(uv + vec2<f32>(0.0, texel.y));\r
  let avg = (l + r + d + u) * 0.25;\r
  let diffuse = 0.12;\r
  wet = mix(wet, avg.r, diffuse);\r
  water = mix(water, avg.g, diffuse * 1.5);\r
\r
  // --- deposits ---\r
  wet = wet + deposit.r;\r
  water = water + deposit.g;\r
\r
  // --- absorption / evaporation / runoff ---\r
  let evap = clamp(params.evaporation * dt, 0.0, 1.0);\r
  wet = max(0.0, wet - evap * 0.25);\r
  water = max(0.0, water - evap * 0.6);\r
  // shallow water slowly soaks into wetness\r
  let soak = min(water, 0.5 * dt);\r
  water = water - soak;\r
  wet = wet + soak * 0.5;\r
\r
  wet = clamp(wet, 0.0, 4.0);\r
  water = clamp(water, 0.0, 4.0);\r
\r
  // --- ripple: Evan Wallace heightfield wave solver (madebyevan.com/webgl-water,\r
  //     ported in jeantimex/webgpu-water — MIT). On a fixed-step grid the\r
  //     velocity relaxes toward the neighbour-average height, is lightly damped,\r
  //     then the height integrates the velocity. This is the proven model that\r
  //     produces clean, long-lived CONCENTRIC RINGS from a point impulse — the\r
  //     signature raindrop-on-puddle look. Driven by our art-directed impacts\r
  //     via deposit.b (rippleImpulse). Evaluated on the fixed grid (not flow-\r
  //     advected) so the rings stay crisp.\r
  let center = sampleState(uv);\r
  let neighborAvg = (l.b + r.b + d.b + u.b) * 0.25;\r
  var vel = center.a + (neighborAvg - center.b) * 2.0;\r
  // Heavier damping: with continuous rain the heightfield ACCUMULATES, so light\r
  // damping let ripple energy pile up until the height clamped everywhere and the\r
  // wave froze ('stopped reacting'). Stronger damping holds a low, bounded\r
  // steady state — rings stay lively AND fade sooner, so they read smaller/denser.\r
  vel = vel * 0.94;                  // heavier damping => rings decay sooner = smaller\r
  vel = vel - deposit.b;             // raindrop dimples the surface, then rebounds\r
  var hgt = (center.b + vel) * 0.994; // gentle height bleed prevents slow DC buildup\r
  hgt = clamp(hgt, -3.0, 3.0);\r
\r
  // --- mask boundary ---\r
  let m = step(0.01, mask);\r
  let outv = vec4<f32>(wet * m, water * m, hgt * m, vel * m);\r
  textureStore(stateOut, vec2<i32>(i32(gid.x), i32(gid.y)), outv);\r
}\r
`,Lr=Object.assign({"../engine/shaders/common.wgsl":Ir,"../engine/shaders/debug.wgsl":kr,"../engine/shaders/deposit_stamp.wgsl":Dr,"../engine/shaders/droplets.wgsl":Pr,"../engine/shaders/flow_build.wgsl":Br,"../engine/shaders/plate_linearize.wgsl":Mr,"../engine/shaders/relief_gradient.wgsl":Gr,"../engine/shaders/relief_raster.wgsl":Rr,"../engine/shaders/ripple_update.wgsl":Vr,"../engine/shaders/rivulet_update.wgsl":Ar,"../engine/shaders/splash.wgsl":Or,"../engine/shaders/wet_composite.wgsl":Cr,"../engine/shaders/wet_update.wgsl":Er});function Kr(){const r={};for(const[e,t]of Object.entries(Lr)){const n=e.split("/").pop();r[n]=t}return r}async function Nr(r){const e=await fetch(r);if(!e.ok)throw new Error(`asset ${r}: ${e.status}`);const t=await e.blob();return createImageBitmap(t,{colorSpaceConversion:"none"})}function Fr(r,e,t="plate"){const n=r.createTexture({label:t,size:{width:e.width,height:e.height},format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});return r.queue.copyExternalImageToTexture({source:e},{texture:n},{width:e.width,height:e.height}),n}async function Qr(r,e){try{const t=await Nr(e);return Fr(r,t,"micro-normal")}catch{const t=r.createTexture({size:{width:4,height:4},format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST}),n=new Uint8Array(4*4*4).fill(128);for(let i=0;i<16;i++)n[i*4+2]=255;return r.queue.writeTexture({texture:t},n,{bytesPerRow:16,rowsPerImage:4},{width:4,height:4}),t}}export{oe as B,z as C,ae as M,Y as P,E as a,He as b,ne as c,Ke as d,jr as e,zr as f,$r as g,qr as h,ke as i,Qr as j,Nr as k,Kr as l,Xr as m,Wr as p,L as s,Fr as u,Yr as v,Hr as w};
//# sourceMappingURL=BrowserAssetLoader-BcdPFd0R.js.map
