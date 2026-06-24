import{P as B,m as z,v as W,c as Q,a as P,i as v,s as G,b as X,p as J,d as K,e as $,w as Y,f as V,g as C,C as Z,h as j,B as R,l as F,M as U,j as L,u as w,k as ee}from"./BrowserAssetLoader-BcdPFd0R.js";class te extends EventTarget{constructor(){super(),this.params=new B,this.project=null,this.selection={type:null,id:null}}setProject(t){this.project=t,t.globalSeed!=null&&this.params.set("globalSeed",t.globalSeed),this.emit("project")}emit(t){this.dispatchEvent(new CustomEvent("change",{detail:{kind:t}}))}surfaces(){return this.project?.surfaces??[]}surface(t){return this.surfaces().find(e=>e.id===t)}rainFields(t){return this.surface(t)?.rainFields??[]}allRainFields(){return this.surfaces().flatMap(t=>t.rainFields??[])}rainField(t){return this.allRainFields().find(e=>e.id===t)}select(t,e){this.selection={type:t,id:e},this.emit("selection")}setParam(t,e){this.params.set(t,e)&&(t==="globalSeed"&&this.project&&(this.project.globalSeed=this.params.get("globalSeed")),this.emit("param"))}updateRainField(t,e){const a=this.rainField(t);a&&(Object.assign(a,e),this.emit("field"))}addHeroEvent(t){this.project.heroEvents.push(t),this.emit("hero")}setReliefEnabled(t,e){const a=this.surface(t);if(a){for(const n of a.reliefLayers??[])n.enabled=e;this.emit("relief")}}}function N(i){const t=z(i),e=W(t);if(!e.ok)throw new Error(`Invalid project:
  ${e.errors.join(`
  `)}`);return{project:t,warnings:e.warnings}}class ae{constructor(t=30,e=240){this.frameRate=t,this.durationFrames=e,this.frame=0,this.playing=!1,this._lastWall=0,this._accum=0,this.loop=!0}play(){this.playing=!0,this._lastWall=performance.now()}pause(){this.playing=!1}toggle(){this.playing?this.pause():this.play()}reset(){this.frame=0,this._accum=0}seek(t){this.frame=Math.max(0,Math.min(this.durationFrames-1,Math.round(t)))}tick(t){if(this.playing){const e=(t-this._lastWall)/1e3;this._lastWall=t,this._accum+=e*this.frameRate;const a=Math.floor(this._accum);a>0&&(this._accum-=a,this.frame+=a,this.frame>=this.durationFrames&&(this.frame=this.loop?this.frame%this.durationFrames:this.durationFrames-1,this.loop||this.pause()))}return this.frame}get timeSeconds(){return this.frame/this.frameRate}}class ne{constructor(t,{frameRate:e,durationFrames:a,onSeek:n}){this.clock=new ae(e,a),this.onSeek=n,this.mount=t,this._build()}_build(){this.mount.innerHTML=`
      <div class="timeline">
        <button data-act="play" title="Play/Pause (Space)">▶</button>
        <button data-act="reset" title="Reset to frame 0">⏮</button>
        <input type="range" data-act="scrub" min="0" max="${this.clock.durationFrames-1}" value="0" />
        <span class="frame-readout">0 / ${this.clock.durationFrames-1}</span>
        <label class="loop"><input type="checkbox" data-act="loop" checked /> loop</label>
      </div>`,this.playBtn=this.mount.querySelector("[data-act=play]"),this.scrub=this.mount.querySelector("[data-act=scrub]"),this.readout=this.mount.querySelector(".frame-readout"),this.playBtn.addEventListener("click",()=>{this.clock.toggle(),this._syncPlayButton()}),this.mount.querySelector("[data-act=reset]").addEventListener("click",()=>{this.clock.pause(),this.clock.reset(),this._syncPlayButton(),this._emit()}),this.scrub.addEventListener("input",()=>{this.clock.pause(),this.clock.seek(Number(this.scrub.value)),this._syncPlayButton(),this._emit()}),this.mount.querySelector("[data-act=loop]").addEventListener("change",t=>{this.clock.loop=t.target.checked}),window.addEventListener("keydown",t=>{t.code==="Space"&&t.target.tagName!=="INPUT"&&(t.preventDefault(),this.clock.toggle(),this._syncPlayButton())})}_syncPlayButton(){this.playBtn.textContent=this.clock.playing?"⏸":"▶"}update(t){const e=this.clock.tick(t);return this.clock.playing&&(this.scrub.value=String(e),this._readout(e)),e}jumpTo(t){this.clock.seek(t),this.scrub.value=String(this.clock.frame),this._emit()}_emit(){this._readout(this.clock.frame),this.onSeek?.(this.clock.frame)}_readout(t){this.readout.textContent=`${t} / ${this.clock.durationFrames-1}`}}class re{constructor(t){this.svg=t,this.homographies=new Map}size(){const t=this.svg.getBoundingClientRect();return{w:t.width,h:t.height,left:t.left,top:t.top}}uvToScreen(t,e){const{w:a,h:n}=this.size();return{x:t*a,y:e*n}}screenToUv(t,e){const{w:a,h:n}=this.size();return{u:t/a,v:e/n}}eventToUv(t){const{left:e,top:a}=this.size();return this.screenToUv(t.clientX-e,t.clientY-a)}cacheHomography(t){const e=(t.calibrationQuad||[]).map(a=>Array.isArray(a)?{x:a[0],y:a[1]}:a);this.homographies.set(t.id,Q(e))}surfaceUVToImage(t,e,a){const n=this.homographies.get(t);return n?.forward?P(n.forward,e,a):[e,a]}imageToSurfaceUV(t,e,a){const n=this.homographies.get(t);return n?.inverse?P(n.inverse,e,a):[e,a]}surfaceUVToScreen(t,e,a){const[n,r]=this.surfaceUVToImage(t,e,a);return this.uvToScreen(n,r)}}function l(i,t={}){const e=document.createElementNS("http://www.w3.org/2000/svg",i);for(const[a,n]of Object.entries(t))e.setAttribute(a,String(n));return e}function ie(i,t,e,a){const n=(e.maskPath||[]).map(r=>{const s=t.uvToScreen(r.u??r[0],r.v??r[1]);return`${s.x},${s.y}`}).join(" ");n&&i.appendChild(l("polygon",{points:n,class:`surface-hit${a?" selected":""}`,"data-handle":"surface-select","data-surface":e.id}))}function se(i,t,e,a){a&&(e.cutouts??[]).forEach((n,r)=>{const o=(n.points??n).map(d=>t.uvToScreen(d.u??d[0],d.v??d[1]));o.length<3||(i.appendChild(l("polygon",{points:o.map(d=>`${d.x},${d.y}`).join(" "),class:"cutout-shape"})),o.forEach((d,c)=>{i.appendChild(l("circle",{cx:d.x,cy:d.y,r:6,class:"handle cutout-handle","data-handle":"cutout","data-surface":e.id,"data-cutout":r,"data-vertex":c}))}))})}const oe=["A","B","C","D"];function de(i,t,e,a){if(v(e))return;const n=(e.calibrationQuad||[]).map(s=>Array.isArray(s)?{x:s[0],y:s[1]}:s);if(n.length!==4)return;const r=n.map(s=>t.uvToScreen(s.x,s.y));i.appendChild(l("polygon",{points:r.map(s=>`${s.x},${s.y}`).join(" "),class:`calib-quad${a?" selected":""}`})),a&&(r.forEach((s,o)=>{const d=r[o],c=r[(o+1)%4];i.appendChild(l("rect",{x:(d.x+c.x)/2-5,y:(d.y+c.y)/2-5,width:10,height:10,class:"handle edge-handle","data-handle":"edge","data-surface":e.id,"data-edge":o}))}),r.forEach((s,o)=>{i.appendChild(l("circle",{cx:s.x,cy:s.y,r:7,class:"handle corner-handle","data-handle":"quad","data-surface":e.id,"data-corner":o}));const d=l("text",{x:s.x+9,y:s.y-9,class:"handle-label"});d.textContent=oe[o],i.appendChild(d)}))}function ce(i,t,e,a){if(!v(e)||!a)return;const n=e.warp.grid,r=n.length,s=n.map(o=>o.map(d=>t.uvToScreen(d.u,d.v)));for(let o=0;o<2;o++){let d="";for(let c=0;c<r;c++)d+=`${c?"L":"M"}${s[c][o].x},${s[c][o].y}`;i.appendChild(l("path",{d,class:"warp-edge"}))}for(let o=0;o<r;o++){const d=o>0&&o<r-1;i.appendChild(l("line",{x1:s[o][0].x,y1:s[o][0].y,x2:s[o][1].x,y2:s[o][1].y,class:d?"warp-slice":"warp-edge"}))}for(let o=0;o<r;o++)for(let d=0;d<2;d++){const c=o===0||o===r-1;i.appendChild(l("circle",{cx:s[o][d].x,cy:s[o][d].y,r:7,class:`handle ${c?"corner-handle":"warp-handle"}`,"data-handle":"warp-pt","data-surface":e.id,"data-row":o,"data-col":d}))}}function le(i,t,e){return i===0?t===0?0:1:i===e-1?t===0?3:2:-1}const p=72;function ue(i){return i.worldNormal??G(i)}function he(i,t,e,a){if(!a)return;const n=t.surfaceUVToScreen(e.id,.5,.5),r=ue(e),s=Math.hypot(r.x,r.y,r.z)||1,o=r.x/s,d=r.y/s,c={x:n.x+o*p,y:n.y-d*p};i.appendChild(l("circle",{cx:n.x,cy:n.y,r:p,class:"gizmo-hit","data-handle":"normal-disc","data-surface":e.id})),i.appendChild(l("circle",{cx:n.x,cy:n.y,r:p,class:"gizmo-wheel"})),i.appendChild(l("circle",{cx:n.x,cy:n.y,r:p*.5,class:"gizmo-wheel-inner"})),i.appendChild(l("line",{x1:n.x-p,y1:n.y,x2:n.x+p,y2:n.y,class:"gizmo-cross"})),i.appendChild(l("line",{x1:n.x,y1:n.y-p,x2:n.x,y2:n.y+p,class:"gizmo-cross"})),i.appendChild(l("line",{x1:n.x,y1:n.y,x2:c.x,y2:c.y,class:"gizmo-normal"})),i.appendChild(l("circle",{cx:n.x,cy:n.y,r:3,class:"gizmo-origin"})),i.appendChild(l("circle",{cx:c.x,cy:c.y,r:9,class:"handle gizmo-knob","data-handle":"normal-disc","data-surface":e.id}))}function pe(i,t,e){const a=i.surfaceUVToScreen(t.id,.5,.5);let n=(e.x-a.x)/p,r=-(e.y-a.y)/p;const s=Math.hypot(n,r);s>.999&&(n=n/s*.999,r=r/s*.999);const o=Math.sqrt(Math.max(0,1-n*n-r*r));return{x:n,y:r,z:o}}function fe(i,t,e,a,n,r){const s=t.surfaceUVToScreen(e.id,a.centerUV.u,a.centerUV.v),o=[];for(let d=0;d<=24;d++){const c=d/24*Math.PI*2,u=Math.cos(c),h=Math.sin(c),f=Math.cos(a.rotation||0),m=Math.sin(a.rotation||0),g=a.centerUV.u+a.scaleUV.x*u*f-a.scaleUV.y*h*m,H=a.centerUV.v+a.scaleUV.x*u*m+a.scaleUV.y*h*f,I=t.surfaceUVToScreen(e.id,g,H);o.push(`${I.x},${I.y}`)}if(i.appendChild(l("polygon",{points:o.join(" "),class:`field-footprint${n?" selected":""}`})),n){i.appendChild(l("circle",{cx:s.x,cy:s.y,r:8,class:"handle field-move","data-handle":"field-move","data-field":a.id}));const d=t.surfaceUVToScreen(e.id,a.centerUV.u+a.scaleUV.x*Math.cos(a.rotation||0),a.centerUV.v+a.scaleUV.x*Math.sin(a.rotation||0));i.appendChild(l("circle",{cx:d.x,cy:d.y,r:6,class:"handle field-scale","data-handle":"field-scale","data-field":a.id}))}}function me(i,t,e,a){for(const n of e){if(!n.enabled)continue;const r=t.surfaceUVToScreen(n.surfaceId,n.surfaceUV.u,n.surfaceUV.v);i.appendChild(l("circle",{cx:r.x,cy:r.y,r:9,class:"dot hero","data-handle":"hero","data-id":n.id,"data-surface":n.surfaceId}));const s=l("text",{x:r.x+11,y:r.y+4,class:"handle-label hero-label"});s.textContent=`★ f${n.frame}`,i.appendChild(s)}}function ve(i,t,e){for(const a of e.reliefLayers??[]){const n=a.enabled===!1,s=ge(a.shape).map(([o,d])=>{const c=t.surfaceUVToScreen(e.id,o,d);return`${c.x},${c.y}`});i.appendChild(l("polygon",{points:s.join(" "),class:`relief-shape ${a.mode}${n?" off":""}`}))}}function ge(i){if(i.type==="ellipse"){const t=[];for(let e=0;e<=32;e++){const a=e/32*Math.PI*2,n=Math.cos(a)*i.radius.u,r=Math.sin(a)*i.radius.v,s=Math.cos(i.rotation||0),o=Math.sin(i.rotation||0);t.push([i.center.u+n*s-r*o,i.center.v+n*o+r*s])}return t}return(i.points||[]).map(t=>[t.u,t.v])}function ye(i,t,e,a=10){let n=null,r=a;const s=i.project.globalSeed,o=i.params.toObject();for(const d of i.surfaces())for(const c of d.rainFields??[]){const u=X(c,s,o);for(const h of u){const f=t.surfaceUVToScreen(d.id,h.surfaceUV.u,h.surfaceUV.v),m=Math.hypot(f.x-e.x,f.y-e.y);m<r&&(r=m,n={event:h,field:c})}}return n}function be(i,t,{notify:e}={}){const a={...t.event,responseId:t.event.responseId??"hero-splash"},n=J(a,"hero-splash");return i.addHeroEvent(n),e?.info(`Promoted ${t.event.stableId} → hero (move/retime it now)`),n}function we(i,t,e){const a=i.project.heroEvents.find(n=>n.id===t);a&&(a.surfaceUV={...e},i.emit("hero"))}function Se(i,t,e){const a=i.project.heroEvents.find(n=>n.id===t);a&&(a.frame=Math.max(0,Math.round(e)),i.emit("hero"))}function S(i,t,e,a){const n=i.project.heroEvents.find(r=>r.id===t);n&&(n[e]=a,i.emit("hero"))}class xe{constructor(t,e,a,{notify:n,getFrame:r}){this.svg=t,this.viewportEl=e,this.state=a,this.notify=n,this.getFrame=r,this.vp=new re(t),this.drag=null,this.inspector=document.createElement("div"),this.inspector.className="inspector",this.viewportEl.appendChild(this.inspector),this._inspectorKey=null,this._bindPointer(),a.addEventListener("change",()=>this.render())}render(){if(!this.state.project)return;this.getFrame();const t=this.state.selection;for(const n of this.state.surfaces())this.vp.cacheHomography(n);for(;this.svg.firstChild;)this.svg.removeChild(this.svg.firstChild);const e=l("g");K(this.state.project.heroEvents),this.state.project.globalSeed,this.state.params.toObject(),this.state.project.frameRate;for(const n of this.state.surfaces()){const r=t.type==="surface"&&t.id===n.id;ve(e,this.vp,n),ie(e,this.vp,n,r),he(e,this.vp,n,r),de(e,this.vp,n,r),ce(e,this.vp,n,r),se(e,this.vp,n,r);for(const s of n.rainFields??[])fe(e,this.vp,n,s,t.type==="field"&&t.id===s.id)}me(e,this.vp,this.state.project.heroEvents),this.svg.appendChild(e);const a=t.type?`${t.type}:${t.id}`:"";a!==this._inspectorKey&&(this._inspectorKey=a,this._renderInspector())}invalidateInspector(){this._inspectorKey=null}_bindPointer(){this.svg.addEventListener("pointerdown",t=>this._onDown(t)),window.addEventListener("pointermove",t=>this._onMove(t)),window.addEventListener("pointerup",()=>this.drag=null)}_onDown(t){const e=t.target,a=e.dataset?.handle;if(a){if(t.preventDefault(),this.svg.setPointerCapture?.(t.pointerId),a==="impact"){this.state.select("impact",e.dataset.id),this._lastPicked=ye(this.state,this.vp,this._evScreen(t),12);return}if(a==="hero"){this.state.select("hero",e.dataset.id),this.drag={type:"hero",id:e.dataset.id,surfaceId:e.dataset.surface};return}if(a==="surface-select"){const n=this.state.surface(e.dataset.surface);this.state.select("surface",e.dataset.surface),this.drag={type:"quad-move",surfaceId:e.dataset.surface,start:this.vp.eventToUv(t),origQuad:n.calibrationQuad.map(r=>({x:r.x,y:r.y})),origMask:(n.maskPath??[]).map(r=>({u:r.u??r.x,v:r.v??r.y})),origCuts:(n.cutouts??[]).map(r=>(r.points??r).map(s=>({u:s.u??s.x,v:s.v??s.y}))),origWarp:v(n)?n.warp.grid.map(r=>r.map(s=>({u:s.u,v:s.v}))):null};return}if(a==="quad"){this.state.select("surface",e.dataset.surface),this.drag={type:"quad",surfaceId:e.dataset.surface,corner:Number(e.dataset.corner)};return}if(a==="edge"){const n=this.state.surface(e.dataset.surface);this.state.select("surface",e.dataset.surface);const r=Number(e.dataset.edge),s=(r+1)%4,o=n.calibrationQuad.map(h=>({x:h.x??h[0],y:h.y??h[1]})),d=o[s].x-o[r].x,c=o[s].y-o[r].y,u=Math.hypot(d,c)||1;this.drag={type:"edge",surfaceId:e.dataset.surface,i:r,j:s,start:this.vp.eventToUv(t),origQuad:o,normal:{x:-c/u,y:d/u}};return}if(a==="normal-disc"){this.state.select("surface",e.dataset.surface),this.drag={type:"normal-disc",surfaceId:e.dataset.surface};return}if(a==="warp-pt"){this.state.select("surface",e.dataset.surface),this.drag={type:"warp-pt",surfaceId:e.dataset.surface,row:Number(e.dataset.row),col:Number(e.dataset.col)};return}if(a==="cutout"){this.state.select("surface",e.dataset.surface),this.drag={type:"cutout",surfaceId:e.dataset.surface,ci:Number(e.dataset.cutout),vi:Number(e.dataset.vertex)};return}if(a==="field-move"){this.state.select("field",e.dataset.field),this.drag={type:"field-move",fieldId:e.dataset.field};return}a==="field-scale"&&(this.state.select("field",e.dataset.field),this.drag={type:"field-scale",fieldId:e.dataset.field})}}_onMove(t){if(!this.drag)return;const e=this.vp.eventToUv(t),a=this._evScreen(t);switch(this.drag.type){case"quad":{const n=this.state.surface(this.drag.surfaceId);this._setQuadCorner(n,this.drag.corner,e.u,e.v),this.state.emit("surface");break}case"edge":{const n=this.state.surface(this.drag.surfaceId),r={u:e.u-this.drag.start.u,v:e.v-this.drag.start.v},s=r.u*this.drag.normal.x+r.v*this.drag.normal.y,{i:o,j:d,origQuad:c,normal:u}=this.drag;this._setQuadCorner(n,o,c[o].x+s*u.x,c[o].y+s*u.y),this._setQuadCorner(n,d,c[d].x+s*u.x,c[d].y+s*u.y),this.state.emit("surface");break}case"quad-move":{const n=this.state.surface(this.drag.surfaceId),r=e.u-this.drag.start.u,s=e.v-this.drag.start.v;n.calibrationQuad=this.drag.origQuad.map(o=>({x:o.x+r,y:o.y+s})),this.drag.origMask.length&&(n.maskPath=this.drag.origMask.map(o=>({u:o.u+r,v:o.v+s}))),this.drag.origCuts.length&&(n.cutouts=this.drag.origCuts.map(o=>({points:o.map(d=>({u:d.u+r,v:d.v+s}))}))),this.drag.origWarp&&(n.warp={...n.warp,grid:this.drag.origWarp.map(o=>o.map(d=>({u:d.u+r,v:d.v+s})))}),this.state.emit("surface");break}case"normal-disc":{const n=this.state.surface(this.drag.surfaceId);n.worldNormal=pe(this.vp,n,a),this.state.emit("surface");break}case"warp-pt":{const n=this.state.surface(this.drag.surfaceId),{row:r,col:s}=this.drag;n.warp.grid[r][s]={u:e.u,v:e.v};const o=le(r,s,n.warp.grid.length);o>=0&&this._setQuadCorner(n,o,e.u,e.v),this.state.emit("surface");break}case"cutout":{const r=this.state.surface(this.drag.surfaceId).cutouts?.[this.drag.ci],s=r?.points??r;s&&(s[this.drag.vi]={u:e.u,v:e.v},this.state.emit("surface"));break}case"field-move":{const n=this.state.rainField(this.drag.fieldId),r=this._fieldSurface(n),[s,o]=this.vp.imageToSurfaceUV(r,e.u,e.v);this.state.updateRainField(n.id,{centerUV:{u:s,v:o}});break}case"field-scale":{const n=this.state.rainField(this.drag.fieldId),r=this._fieldSurface(n),[s,o]=this.vp.imageToSurfaceUV(r,e.u,e.v),d=Math.max(.03,Math.hypot(s-n.centerUV.u,o-n.centerUV.v));this.state.updateRainField(n.id,{scaleUV:{x:d,y:d*(n.scaleUV.y/n.scaleUV.x||1)}});break}case"hero":{const[n,r]=this.vp.imageToSurfaceUV(this.drag.surfaceId,e.u,e.v);we(this.state,this.drag.id,{u:n,v:r});break}}}_setQuadCorner(t,e,a,n){t.calibrationQuad[e]={x:a,y:n},t.maskPath?.length===4&&(t.maskPath[e]={u:a,v:n})}_evScreen(t){const{left:e,top:a}=this.vp.size();return{x:t.clientX-e,y:t.clientY-a}}_fieldSurface(t){return t.surfaceId??this.state.surfaces().find(e=>(e.rainFields??[]).includes(t))?.id}_renderInspector(){const t=this.state.selection,e=this.inspector;if(e.innerHTML="",!t.type){e.style.display="none";return}if(e.style.display="block",t.type==="field"){const a=this.state.rainField(t.id);if(!a)return;e.appendChild(this._title(`Rain Field: ${a.name||a.id}`)),e.appendChild(this._slider("Density",a.density,0,1,.01,n=>this.state.updateRainField(a.id,{density:n}))),e.appendChild(this._slider("Rotation",a.rotation||0,-3.14,3.14,.01,n=>this.state.updateRainField(a.id,{rotation:n}))),e.appendChild(this._slider("Falloff",a.falloff||0,0,1,.01,n=>this.state.updateRainField(a.id,{falloff:n}))),e.appendChild(this._paletteSelect(a))}else if(t.type==="hero"){const a=this.state.project.heroEvents.find(n=>n.id===t.id);if(!a)return;e.appendChild(this._title("Hero Impact")),e.appendChild(this._slider("Frame",a.frame,0,this.state.project.durationFrames-1,1,n=>Se(this.state,a.id,n))),e.appendChild(this._slider("Height ×",a.heightOverride??1.5,.2,6,.05,n=>S(this.state,a.id,"heightOverride",n))),e.appendChild(this._slider("Width ×",a.widthOverride??1.3,.2,6,.05,n=>S(this.state,a.id,"widthOverride",n))),e.appendChild(this._slider("Spread ×",a.spreadOverride??1.2,.2,6,.05,n=>S(this.state,a.id,"spreadOverride",n)))}else if(t.type==="impact"){e.appendChild(this._title(`Impact ${t.id}`));const a=document.createElement("button");a.textContent="★ Promote to Hero",a.addEventListener("click",()=>{const n=this._lastPicked;if(n){const r=be(this.state,n,{notify:this.notify});this.state.select("hero",r.id)}else this.notify?.warn("Click an impact dot first, then promote.")}),e.appendChild(a)}else if(t.type==="surface"){const a=this.state.surface(t.id);e.appendChild(this._title(`Surface: ${a.name||a.id}`));const n=document.createElement("div");n.className="muted",n.textContent="Drag the plane to move · corners or edges to reshape · the wheel to aim · a cutout to carve",e.appendChild(n),e.appendChild(this._slider("Edge feather",a.maskFeather??.12,0,1,.01,c=>{a.maskFeather=c,this.state.emit("surface")})),e.appendChild(this._slider("Drip / streaming",a.drip?.amount??0,0,1,.01,c=>{a.drip={speed:.25,width:.012,meander:.5,...a.drip||{},amount:c},this.state.emit("surface")})),e.appendChild(this._slider("Drip from tilt",a.drip?.fromTilt??0,0,1,.01,c=>{a.drip={speed:.25,width:.012,meander:.5,amount:0,...a.drip||{},fromTilt:c},this.state.emit("surface")})),e.appendChild(this._slider("World / Ripple scale",this.state.params.get("rippleScale")??1,.2,4,.01,c=>{this.state.setParam("rippleScale",c)})),v(a)&&e.appendChild(this._slider("Bend blend",a.warp.blend??.5,0,1,.01,c=>{a.warp={...a.warp,blend:c},this.state.emit("surface")}));const r=document.createElement("div");r.className="inspector-actions";const s=document.createElement("button");if(s.textContent=v(a)?"✚ Add slice":"⌒ Bend (add slice)",s.addEventListener("click",()=>this._addSlice(a)),r.appendChild(s),v(a)){const c=document.createElement("button");c.textContent="Flatten",c.addEventListener("click",()=>{delete a.warp,this.state.emit("surface"),this.invalidateInspector(),this.render()}),r.appendChild(c)}e.appendChild(r);const o=document.createElement("div");o.className="inspector-actions";const d=document.createElement("button");if(d.textContent="✂ Add cutout",d.addEventListener("click",()=>this._addCutout(a)),o.appendChild(d),(a.cutouts??[]).length){const c=document.createElement("button");c.textContent=`Clear (${a.cutouts.length})`,c.addEventListener("click",()=>{a.cutouts=[],this.state.emit("surface"),this.invalidateInspector(),this.render()}),o.appendChild(c)}e.appendChild(o)}}_addSlice(t){if(v(t))t.warp=$(t.warp,.5);else{const e=Y(t.calibrationQuad);if(!e){this.notify?.warn("Calibrate the surface first.");return}t.warp=$(e,.5)}this.state.emit("surface"),this.invalidateInspector(),this.render()}_addCutout(t){const e=t.maskPath??[];if(e.length<3){this.notify?.warn("This surface has no mask to carve.");return}let a=1,n=1,r=0,s=0;for(const f of e){const m=f.u??f.x,g=f.v??f.y;a=Math.min(a,m),r=Math.max(r,m),n=Math.min(n,g),s=Math.max(s,g)}const o=(a+r)/2,d=(n+s)/2,c=(r-a)*.18,u=(s-n)*.18,h=[{u:o-c,v:d-u},{u:o+c,v:d-u},{u:o+c,v:d+u},{u:o-c,v:d+u}];t.cutouts=t.cutouts??[],t.cutouts.push({points:h}),this.state.emit("surface"),this.invalidateInspector(),this.render()}_title(t){const e=document.createElement("div");return e.className="inspector-title",e.textContent=t,e}_slider(t,e,a,n,r,s){const o=document.createElement("label");o.className="param-row";const d=document.createElement("span");d.className="param-value",d.textContent=M(e);const c=document.createElement("input");return c.type="range",c.min=a,c.max=n,c.step=r,c.value=e,c.addEventListener("input",()=>{const u=Number(c.value);d.textContent=M(u),s(u)}),o.innerHTML=`<span>${t}</span>`,o.appendChild(c),o.appendChild(d),o}_paletteSelect(t){const e=document.createElement("label");e.className="param-row";const a=document.createElement("select"),n=this.state.project.palettes??[];return a.innerHTML='<option value="">(default)</option>'+n.map(r=>`<option value="${r.id}">${r.name}</option>`).join(""),a.value=t.paletteId??"",a.addEventListener("change",()=>this.state.updateRainField(t.id,{paletteId:a.value||null})),e.innerHTML="<span>Palette</span>",e.appendChild(a),e}}function M(i){return Number.isInteger(i)?String(i):Number(i).toFixed(2)}class _e{constructor(t,e){this.mount=t,this.state=e,this.inputs=new Map,this._build(),e.addEventListener("change",a=>{(a.detail.kind==="preset"||a.detail.kind==="project")&&this.syncAll()})}_build(){const t=new Map;for(const a of V.params)t.has(a.section)||t.set(a.section,[]),t.get(a.section).push(a);const e=document.createElement("div");e.className="panel param-panel",e.innerHTML="<h3>Parameters</h3>";for(const[a,n]of t){const r=document.createElement("details");r.open=a==="Splash"||a==="Look",r.className="param-section",r.innerHTML=`<summary>${a}</summary>`;for(const s of n)r.appendChild(this._control(s));e.appendChild(r)}this.mount.appendChild(e)}_control(t){const e=document.createElement("label");e.className="param-row";const a=this.state.params.get(t.id);if(t.type==="enum"){const s=document.createElement("select");return(t.options||[]).forEach((o,d)=>{const c=document.createElement("option");c.value=String(d),c.textContent=o,s.appendChild(c)}),s.value=String(a),s.addEventListener("change",()=>this.state.setParam(t.id,Number(s.value))),e.innerHTML=`<span>${t.name}</span>`,e.appendChild(s),this.inputs.set(t.id,{kind:"enum",el:s}),e}const n=document.createElement("input");n.type="range",n.min=String(t.min),n.max=String(t.max),n.step=String(t.step??.01),n.value=String(a);const r=document.createElement("span");return r.className="param-value",r.textContent=x(a),n.addEventListener("input",()=>{const s=Number(n.value);r.textContent=x(s),this.state.setParam(t.id,s)}),e.innerHTML=`<span>${t.name}</span>`,e.appendChild(n),e.appendChild(r),this.inputs.set(t.id,{kind:"range",el:n,out:r}),e}syncAll(){for(const[t,e]of this.inputs){const a=this.state.params.get(t);e.el.value=String(a),e.out&&(e.out.textContent=x(a))}}}function x(i){return Number.isInteger(i)?String(i):i.toFixed(2)}class Ee{constructor(t,e,{onResetSim:a,onBake:n,perf:r}){this.mount=t,this.state=e,this.onResetSim=a,this.onBake=n,this.perf=r,this._build()}_build(){const e=(C("debugMode").options||[]).map((n,r)=>`<option value="${r}">${n}</option>`).join(""),a=document.createElement("div");a.className="panel debug-panel",a.innerHTML=`
      <h3>Debug &amp; Simulation</h3>
      <label class="param-row"><span>Debug View</span>
        <select data-act="debug">${e}</select></label>
      <div class="btn-row">
        <button data-act="reset-sim">Reset Wet State</button>
        <button data-act="bake">Bake to Frame</button>
      </div>
      <div class="perf" data-act="perf">—</div>`,this.mount.appendChild(a),a.querySelector("[data-act=debug]").addEventListener("change",n=>{this.state.setParam("debugMode",Number(n.target.value))}),a.querySelector("[data-act=reset-sim]").addEventListener("click",()=>this.onResetSim?.()),a.querySelector("[data-act=bake]").addEventListener("click",()=>this.onBake?.()),this.perfEl=a.querySelector("[data-act=perf]")}setPerf(t){this.perfEl&&(this.perfEl.textContent=t)}}const ke=`{\r
  "_format": "wcx",\r
  "_plugin": "meteor",\r
  "_wcxVersion": 1,\r
  "name": "Directed Metal Hood",\r
  "category": "Metal",\r
  "created": "2026-06-23",\r
  "thumbnail": null,\r
  "params": [\r
    {\r
      "uuid": "169396c0-910c-4621-82e0-9b3b64b7fa8d",\r
      "id": "visualGain",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "f31b99fd-616c-4170-9ec5-195e59e46f6b",\r
      "id": "splashHeight",\r
      "value": 1.8\r
    },\r
    {\r
      "uuid": "ee79d005-2ee9-47ca-8578-d5b2ffeb5bf7",\r
      "id": "splashWidth",\r
      "value": 0.9\r
    },\r
    {\r
      "uuid": "01e67761-19a4-438d-b2d9-c4839187e0ed",\r
      "id": "bounce",\r
      "value": 1.1\r
    },\r
    {\r
      "uuid": "280239e7-4e1d-4a53-95f5-f67b11f75612",\r
      "id": "spread",\r
      "value": 1.3\r
    },\r
    {\r
      "uuid": "6785a040-1dd4-4983-9de8-d8e1de588c77",\r
      "id": "lifetime",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "8886e956-a828-44ae-b635-0b5a7f4f5b8c",\r
      "id": "wetnessDeposit",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "f6712f59-a785-454f-b4a0-b2f450f2a291",\r
      "id": "flowSpeed",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "aad832c9-5ae2-4c9a-a543-5c270de5b81e",\r
      "id": "evaporation",\r
      "value": 0.15\r
    },\r
    {\r
      "uuid": "73215537-c432-41c1-837a-5e9f98920bf8",\r
      "id": "reliefHeight",\r
      "value": 1.2\r
    },\r
    {\r
      "uuid": "d68aa46a-3cae-4cd6-9489-d19ac5ed4d6b",\r
      "id": "reliefSoftness",\r
      "value": 0.08\r
    },\r
    {\r
      "uuid": "1e20fa2a-a8c8-42dd-a4fc-0c582c4b884a",\r
      "id": "flowDeflection",\r
      "value": 1.4\r
    },\r
    {\r
      "uuid": "4f9ba7c5-2aa6-4470-a945-fb77bb9a0ff2",\r
      "id": "boundaryWrap",\r
      "value": 1.6\r
    },\r
    {\r
      "uuid": "b6dc5be1-1cbb-4532-936d-508e70e38663",\r
      "id": "wetDarkening",\r
      "value": 0.5\r
    },\r
    {\r
      "uuid": "c7813214-3b22-4318-808a-feff01ab8a0f",\r
      "id": "saturationShift",\r
      "value": 0.25\r
    },\r
    {\r
      "uuid": "b3e44e59-8641-4e35-b623-0f353c368a20",\r
      "id": "specularGain",\r
      "value": 1.8\r
    },\r
    {\r
      "uuid": "01c6e123-2fc6-4ff0-a2b4-4e3901359347",\r
      "id": "specularWidth",\r
      "value": 0.35\r
    },\r
    {\r
      "uuid": "e79f5bd6-f36e-4713-a81b-b8a8876600ac",\r
      "id": "specularDirection",\r
      "value": 0.7\r
    },\r
    {\r
      "uuid": "4be1ca07-158e-477c-b78c-e4b971e71ce3",\r
      "id": "microNormalStrength",\r
      "value": 0.7\r
    },\r
    {\r
      "uuid": "d5dfc666-6139-4475-b845-2db2ac246685",\r
      "id": "flowStreakStrength",\r
      "value": 0.8\r
    },\r
    {\r
      "uuid": "07961019-50a9-4f3e-83b2-64ea4bf2a7e4",\r
      "id": "rippleNormalStrength",\r
      "value": 0.6\r
    },\r
    {\r
      "uuid": "833d8fd3-ae73-453b-a403-89029f7d37af",\r
      "id": "poolHighlight",\r
      "value": 0.5\r
    },\r
    {\r
      "uuid": "09610d9c-068d-4250-b2fb-a54a6cc36248",\r
      "id": "distortion",\r
      "value": 0.2\r
    },\r
    {\r
      "uuid": "4ae59814-752d-40cc-a960-c2e3b6197ab1",\r
      "id": "edgeBead",\r
      "value": 0.6\r
    }\r
  ]\r
}\r
`,Ce=`{\r
  "_format": "wcx",\r
  "_plugin": "meteor",\r
  "_wcxVersion": 1,\r
  "name": "Heavy Puddle",\r
  "category": "Puddle",\r
  "created": "2026-06-23",\r
  "thumbnail": null,\r
  "params": [\r
    {\r
      "uuid": "169396c0-910c-4621-82e0-9b3b64b7fa8d",\r
      "id": "visualGain",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "f31b99fd-616c-4170-9ec5-195e59e46f6b",\r
      "id": "splashHeight",\r
      "value": 1.2\r
    },\r
    {\r
      "uuid": "ee79d005-2ee9-47ca-8578-d5b2ffeb5bf7",\r
      "id": "splashWidth",\r
      "value": 1.8\r
    },\r
    {\r
      "uuid": "01e67761-19a4-438d-b2d9-c4839187e0ed",\r
      "id": "bounce",\r
      "value": 0.3\r
    },\r
    {\r
      "uuid": "280239e7-4e1d-4a53-95f5-f67b11f75612",\r
      "id": "spread",\r
      "value": 1.6\r
    },\r
    {\r
      "uuid": "6785a040-1dd4-4983-9de8-d8e1de588c77",\r
      "id": "lifetime",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "8886e956-a828-44ae-b635-0b5a7f4f5b8c",\r
      "id": "wetnessDeposit",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "f6712f59-a785-454f-b4a0-b2f450f2a291",\r
      "id": "flowSpeed",\r
      "value": 1.4\r
    },\r
    {\r
      "uuid": "aad832c9-5ae2-4c9a-a543-5c270de5b81e",\r
      "id": "evaporation",\r
      "value": 0.08\r
    },\r
    {\r
      "uuid": "73215537-c432-41c1-837a-5e9f98920bf8",\r
      "id": "reliefHeight",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "d68aa46a-3cae-4cd6-9489-d19ac5ed4d6b",\r
      "id": "reliefSoftness",\r
      "value": 0.08\r
    },\r
    {\r
      "uuid": "1e20fa2a-a8c8-42dd-a4fc-0c582c4b884a",\r
      "id": "flowDeflection",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "4f9ba7c5-2aa6-4470-a945-fb77bb9a0ff2",\r
      "id": "boundaryWrap",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "b6dc5be1-1cbb-4532-936d-508e70e38663",\r
      "id": "wetDarkening",\r
      "value": 0.9\r
    },\r
    {\r
      "uuid": "c7813214-3b22-4318-808a-feff01ab8a0f",\r
      "id": "saturationShift",\r
      "value": 0.4\r
    },\r
    {\r
      "uuid": "b3e44e59-8641-4e35-b623-0f353c368a20",\r
      "id": "specularGain",\r
      "value": 1.4\r
    },\r
    {\r
      "uuid": "01c6e123-2fc6-4ff0-a2b4-4e3901359347",\r
      "id": "specularWidth",\r
      "value": 0.8\r
    },\r
    {\r
      "uuid": "e79f5bd6-f36e-4713-a81b-b8a8876600ac",\r
      "id": "specularDirection",\r
      "value": 0.7\r
    },\r
    {\r
      "uuid": "4be1ca07-158e-477c-b78c-e4b971e71ce3",\r
      "id": "microNormalStrength",\r
      "value": 0.5\r
    },\r
    {\r
      "uuid": "d5dfc666-6139-4475-b845-2db2ac246685",\r
      "id": "flowStreakStrength",\r
      "value": 0.5\r
    },\r
    {\r
      "uuid": "07961019-50a9-4f3e-83b2-64ea4bf2a7e4",\r
      "id": "rippleNormalStrength",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "833d8fd3-ae73-453b-a403-89029f7d37af",\r
      "id": "poolHighlight",\r
      "value": 1.2\r
    },\r
    {\r
      "uuid": "09610d9c-068d-4250-b2fb-a54a6cc36248",\r
      "id": "distortion",\r
      "value": 0.8\r
    },\r
    {\r
      "uuid": "4ae59814-752d-40cc-a960-c2e3b6197ab1",\r
      "id": "edgeBead",\r
      "value": 0.5\r
    }\r
  ]\r
}\r
`,Ie=`{\r
  "_format": "wcx",\r
  "_plugin": "meteor",\r
  "_wcxVersion": 1,\r
  "name": "Subtle Wet Metal",\r
  "category": "Metal",\r
  "created": "2026-06-23",\r
  "thumbnail": null,\r
  "params": [\r
    {\r
      "uuid": "169396c0-910c-4621-82e0-9b3b64b7fa8d",\r
      "id": "visualGain",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "f31b99fd-616c-4170-9ec5-195e59e46f6b",\r
      "id": "splashHeight",\r
      "value": 0.8\r
    },\r
    {\r
      "uuid": "ee79d005-2ee9-47ca-8578-d5b2ffeb5bf7",\r
      "id": "splashWidth",\r
      "value": 0.7\r
    },\r
    {\r
      "uuid": "01e67761-19a4-438d-b2d9-c4839187e0ed",\r
      "id": "bounce",\r
      "value": 0.4\r
    },\r
    {\r
      "uuid": "280239e7-4e1d-4a53-95f5-f67b11f75612",\r
      "id": "spread",\r
      "value": 0.6\r
    },\r
    {\r
      "uuid": "6785a040-1dd4-4983-9de8-d8e1de588c77",\r
      "id": "lifetime",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "8886e956-a828-44ae-b635-0b5a7f4f5b8c",\r
      "id": "wetnessDeposit",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "f6712f59-a785-454f-b4a0-b2f450f2a291",\r
      "id": "flowSpeed",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "aad832c9-5ae2-4c9a-a543-5c270de5b81e",\r
      "id": "evaporation",\r
      "value": 0.15\r
    },\r
    {\r
      "uuid": "73215537-c432-41c1-837a-5e9f98920bf8",\r
      "id": "reliefHeight",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "d68aa46a-3cae-4cd6-9489-d19ac5ed4d6b",\r
      "id": "reliefSoftness",\r
      "value": 0.08\r
    },\r
    {\r
      "uuid": "1e20fa2a-a8c8-42dd-a4fc-0c582c4b884a",\r
      "id": "flowDeflection",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "4f9ba7c5-2aa6-4470-a945-fb77bb9a0ff2",\r
      "id": "boundaryWrap",\r
      "value": 1\r
    },\r
    {\r
      "uuid": "b6dc5be1-1cbb-4532-936d-508e70e38663",\r
      "id": "wetDarkening",\r
      "value": 0.35\r
    },\r
    {\r
      "uuid": "c7813214-3b22-4318-808a-feff01ab8a0f",\r
      "id": "saturationShift",\r
      "value": 0.25\r
    },\r
    {\r
      "uuid": "b3e44e59-8641-4e35-b623-0f353c368a20",\r
      "id": "specularGain",\r
      "value": 0.9\r
    },\r
    {\r
      "uuid": "01c6e123-2fc6-4ff0-a2b4-4e3901359347",\r
      "id": "specularWidth",\r
      "value": 0.6\r
    },\r
    {\r
      "uuid": "e79f5bd6-f36e-4713-a81b-b8a8876600ac",\r
      "id": "specularDirection",\r
      "value": 0.7\r
    },\r
    {\r
      "uuid": "4be1ca07-158e-477c-b78c-e4b971e71ce3",\r
      "id": "microNormalStrength",\r
      "value": 0.3\r
    },\r
    {\r
      "uuid": "d5dfc666-6139-4475-b845-2db2ac246685",\r
      "id": "flowStreakStrength",\r
      "value": 0.3\r
    },\r
    {\r
      "uuid": "07961019-50a9-4f3e-83b2-64ea4bf2a7e4",\r
      "id": "rippleNormalStrength",\r
      "value": 0.6\r
    },\r
    {\r
      "uuid": "833d8fd3-ae73-453b-a403-89029f7d37af",\r
      "id": "poolHighlight",\r
      "value": 0.3\r
    },\r
    {\r
      "uuid": "09610d9c-068d-4250-b2fb-a54a6cc36248",\r
      "id": "distortion",\r
      "value": 0.1\r
    },\r
    {\r
      "uuid": "4ae59814-752d-40cc-a960-c2e3b6197ab1",\r
      "id": "edgeBead",\r
      "value": 0.25\r
    }\r
  ]\r
}\r
`,Pe=new Set(["__gpu","__hover","__cache","selectedIds"]);function $e(i){const t=JSON.parse(JSON.stringify(i,(e,a)=>{if(!Pe.has(e)&&typeof a!="function")return a}));return t.schemaVersion=Z,t}function je(i,t="car-hood-demo.meteor.json"){const e=JSON.stringify($e(i),null,2),a=new Blob([e],{type:"application/json"});A(a,t)}async function Re(i){const t=await i.text(),e=JSON.parse(t);return N(e)}function A(i,t){const e=URL.createObjectURL(i),a=document.createElement("a");a.href=e,a.download=t,document.body.appendChild(a),a.click(),a.remove(),setTimeout(()=>URL.revokeObjectURL(e),1e3)}const Fe=1,Ue=new Set(["Look","Splash","Wet State","Relief","Global"]),Le=new Set(["globalSeed","debugMode"]);function Me(){return V.params.filter(i=>Ue.has(i.section)&&!Le.has(i.id)).map(i=>i.id)}function Te(i,{name:t,category:e="Metal",thumbnail:a=null}={}){const n=Me().map(r=>({uuid:C(r).uuid,id:r,value:i.get(r)}));return{_format:"wcx",_plugin:"meteor",_wcxVersion:Fe,name:t??"Untitled Look",category:e,created:new Date().toISOString().slice(0,10),thumbnail:a??null,params:n}}function De(i,t){const e=[];if(i._format!=="wcx")throw new Error("not a .wcx file");if(i._plugin!=="meteor")throw new Error(`refusing preset for plugin "${i._plugin}"`);let a=0;for(const n of i.params??[]){const r=j(n.uuid)??C(n.id);if(!r){e.push(`unknown param ${n.id??n.uuid}`);continue}j(n.uuid)==null&&n.id&&e.push(`param ${n.id} resolved by id fallback (uuid not found)`),t.set(r.id,n.value),a++}return{applied:a,warnings:e}}function Ve(i){const t=(i.name||"look").toLowerCase().replace(/[^\w]+/g,"-"),e=new Blob([JSON.stringify(i,null,2)],{type:"application/json"});A(e,`${t}.wcx`)}async function Ne(i){const t=await i.text();return JSON.parse(t)}const Ae=Object.assign({"../../presets/factory/directed-metal-hood.wcx":ke,"../../presets/factory/heavy-puddle.wcx":Ce,"../../presets/factory/subtle-wet-metal.wcx":Ie});function Oe(){return Object.entries(Ae).map(([i,t])=>{const e=JSON.parse(t);return e.__file=i.split("/").pop(),e})}class qe{constructor(t,e,{notify:a,onApplied:n}){this.mount=t,this.state=e,this.notify=a,this.onApplied=n,this.factory=Oe(),this._build()}_build(){const t=document.createElement("div");t.className="preset-bar";const e=this.factory.map((n,r)=>`<option value="${r}">${n.name} (${n.category})</option>`).join("");t.innerHTML=`
      <select data-act="factory"><option value="">Factory Look…</option>${e}</select>
      <button data-act="save">Save .wcx</button>
      <button data-act="import">Import .wcx</button>
      <input type="file" accept=".wcx,application/json" data-act="file" hidden />`,this.mount.appendChild(t),t.querySelector("[data-act=factory]").addEventListener("change",n=>{const r=n.target.value;r!==""&&this._apply(this.factory[Number(r)])}),t.querySelector("[data-act=save]").addEventListener("click",()=>{const n=prompt("Look preset name:","My Look");if(!n)return;const r=Te(this.state.params,{name:n});Ve(r),this.notify?.info(`Saved ${n}.wcx`)});const a=t.querySelector("[data-act=file]");t.querySelector("[data-act=import]").addEventListener("click",()=>a.click()),a.addEventListener("change",async()=>{const n=a.files?.[0];if(n){try{const r=await Ne(n);this._apply(r)}catch(r){this.notify?.error(`Import failed: ${r.message}`)}a.value=""}})}_apply(t){try{const{applied:e,warnings:a}=De(t,this.state.params);this.state.emit("preset"),this.onApplied?.(),this.notify?.info(`Applied "${t.name}" (${e} params)`),a.forEach(n=>this.notify?.warn(n))}catch(e){this.notify?.error(e.message)}}}class He{constructor(t,e,{notify:a,onProjectLoaded:n,onReloadDemo:r}){this.mount=t,this.state=e,this.notify=a,this.onProjectLoaded=n,this.onReloadDemo=r,this._build()}_build(){const t=document.createElement("div");t.className="project-menu",t.innerHTML=`
      <button data-act="export">Export Project</button>
      <button data-act="import">Import Project</button>
      <button data-act="demo">Reload Demo</button>
      <input type="file" accept=".json,.meteor.json" data-act="file" hidden />`,this.mount.appendChild(t),t.querySelector("[data-act=export]").addEventListener("click",()=>{je(this.state.project),this.notify?.info("Exported .meteor.json")});const e=t.querySelector("[data-act=file]");t.querySelector("[data-act=import]").addEventListener("click",()=>e.click()),t.querySelector("[data-act=demo]").addEventListener("click",()=>this.onReloadDemo?.()),e.addEventListener("change",async()=>{const a=e.files?.[0];if(a){try{const{project:n,warnings:r}=await Re(a);this.onProjectLoaded?.(n),r.forEach(s=>this.notify?.warn(s)),this.notify?.info("Project loaded")}catch(n){this.notify?.error(`Load failed: ${n.message}`)}e.value=""}})}}const Be=[{key:"DIRECT",label:"Direct"},{key:"RECEIVE",label:"Receive"},{key:"RESPOND",label:"Respond"},{key:"ACCUMULATE",label:"Accumulate"},{key:"LOOK",label:"Look"}];class ze{constructor(t,e,{notify:a}){this.mount=t,this.state=e,this.notify=a,this._build(),e.addEventListener("change",n=>{["project","selection","field","relief"].includes(n.detail.kind)&&this._render()})}_build(){this.root=document.createElement("div"),this.root.className="panel chip-stack",this.root.innerHTML="<h3>Chip Stack</h3>",this.list=document.createElement("div"),this.list.className="chip-list",this.root.appendChild(this.list),this.mount.appendChild(this.root),this._render()}_render(){if(!this.state.project){this.list.innerHTML='<div class="muted">No project loaded</div>';return}const t=this.state.selection,e=[];e.push(y("RECEIVE"));for(const a of this.state.surfaces()){e.push(T("surface",a.id,`🧩 ${a.name||a.id}`,t));for(const n of a.reliefLayers??[]){const r=n.enabled===!1?"off":"on";e.push(`<div class="chip sub relief-toggle ${r}" data-relief="${n.id}" data-surface="${a.id}">⛰ Relief: ${n.mode} (${r}) — click to toggle</div>`)}}e.push(y("DIRECT"));for(const a of this.state.allRainFields())e.push(T("field",a.id,`🌧 ${a.name||a.id}`,t));e.push(y("RESPOND"));for(const a of this.state.allRainFields())e.push(`<div class="chip-sub">${a.name||a.id}: palette ${a.paletteId??"—"}</div>`);e.push(y("ACCUMULATE")),e.push('<div class="chip-sub">Wetness · Runoff · Ripple · Evaporation</div>'),this.list.innerHTML=e.join(""),this.list.querySelectorAll("[data-chip]").forEach(a=>{a.addEventListener("click",()=>{this.state.select(a.dataset.type,a.dataset.id)})}),this.list.querySelectorAll(".relief-toggle").forEach(a=>{a.addEventListener("click",()=>{const r=(this.state.surface(a.dataset.surface)?.reliefLayers??[]).find(s=>s.id===a.dataset.relief);r&&(this.state.setReliefEnabled(a.dataset.surface,r.enabled===!1),this.notify?.info(`Relief ${r.enabled===!1?"enabled":"disabled"}`))})})}}function y(i){const t=Be.find(e=>e.key===i);return`<div class="chip-group">${t?t.label:i}</div>`}function T(i,t,e,a,n=!1){return`<div class="chip${a.type===i&&a.id===t?" active":""}${n?" sub":""}" data-chip data-type="${i}" data-id="${t}">${e}</div>`}class We{constructor(t){this.mount=t}show(t,e="info",a=4e3){const n=document.createElement("div");n.className=`toast toast-${e}`,n.textContent=t,this.mount.appendChild(n),requestAnimationFrame(()=>n.classList.add("show")),setTimeout(()=>{n.classList.remove("show"),setTimeout(()=>n.remove(),300)},a)}info(t){this.show(t,"info")}warn(t){this.show(t,"warn",6e3)}error(t){this.show(t,"error",8e3)}}const Qe=1,Ge="hard-surface-topdown",Xe={assetId:"demo/hard-surface-topdown.png",width:1672,height:941},Je=240,Ke=30,Ye=4071,Ze=[{id:"metal-mix",name:"Metal Mix",entries:[{responseId:"metal-tick",weight:.6},{responseId:"metal-bounce",weight:.4}]},{id:"puddle",name:"Puddle",entries:[{responseId:"puddle-crown",weight:1}]}],et=[{id:"asphalt",name:"Asphalt (smooth)",enabled:!0,renderOrder:0,simulationResolution:384,normalDirection:-1.5708,normalScale:.03,materialResponseId:"puddle-crown",maskPath:[{u:.05,v:.16},{u:.47,v:.16},{u:.47,v:.95},{u:.05,v:.95}],calibrationQuad:[{x:.05,y:.16},{x:.47,y:.16},{x:.47,y:.95},{x:.05,y:.95}],flow:{baseFlow:{x:0,y:.3},bias:{x:0,y:0}},reliefLayers:[{id:"car-edge-left",surfaceId:"asphalt",mode:"raised",height:1,softness:.05,flowDeflection:1,boundaryWrap:1,enabled:!1,shape:{type:"ellipse",center:{u:.95,v:.5},radius:{u:.16,v:.42},rotation:0}}],rainFields:[{id:"asphalt-rain",name:"Asphalt Rain",enabled:!0,surfaceId:"asphalt",placementSeed:11,responseSeed:23,centerUV:{u:.5,v:.5},scaleUV:{x:.85,y:.85},rotation:0,density:.6,falloff:.2,ratePerSecond:40,startFrame:0,endFrame:240,dropSizeRange:[.25,.7],velocityRange:[.6,1.4],incomingDirection:-1.5708,paletteId:"puddle",poolSize:700}]},{id:"concrete",name:"Concrete (rough)",enabled:!0,renderOrder:1,simulationResolution:384,normalDirection:-1.5708,normalScale:.03,materialResponseId:"metal-tick",maskPath:[{u:.53,v:.16},{u:.95,v:.16},{u:.95,v:.95},{u:.53,v:.95}],calibrationQuad:[{x:.53,y:.16},{x:.95,y:.16},{x:.95,y:.95},{x:.53,y:.95}],flow:{baseFlow:{x:0,y:.3},bias:{x:0,y:0}},reliefLayers:[{id:"car-edge-right",surfaceId:"concrete",mode:"raised",height:1,softness:.05,flowDeflection:1,boundaryWrap:1,enabled:!1,shape:{type:"ellipse",center:{u:.05,v:.5},radius:{u:.16,v:.42},rotation:0}}],rainFields:[{id:"concrete-rain",name:"Concrete Rain",enabled:!0,surfaceId:"concrete",placementSeed:41,responseSeed:57,centerUV:{u:.5,v:.5},scaleUV:{x:.85,y:.85},rotation:0,density:.6,falloff:.2,ratePerSecond:40,startFrame:0,endFrame:240,dropSizeRange:[.25,.7],velocityRange:[.6,1.4],incomingDirection:-1.5708,paletteId:"metal-mix",poolSize:700}]}],tt=[],at=[],nt={zoom:1,panX:0,panY:0},rt={schemaVersion:Qe,projectId:Ge,sourcePlate:Xe,durationFrames:Je,frameRate:Ke,globalSeed:Ye,palettes:Ze,surfaces:et,heroEvents:tt,selectedIds:at,viewportState:nt},it=1,st="tesla-model3",ot={assetId:"demo/tesla-model3.png",width:1672,height:941},dt=240,ct=30,lt=2087,ut=[{id:"metal-mix",name:"Metal Mix",entries:[{responseId:"metal-tick",weight:.6},{responseId:"metal-bounce",weight:.4}]},{id:"puddle",name:"Puddle",entries:[{responseId:"puddle-crown",weight:1}]}],ht=[{id:"hood",name:"Hood (starter — drag A·B·C·D to fit)",enabled:!0,renderOrder:0,simulationResolution:384,normalDirection:-1.5708,normalScale:.05,materialResponseId:"metal-tick",maskPath:[{u:.32,v:.5},{u:.6,v:.44},{u:.66,v:.58},{u:.36,v:.64}],calibrationQuad:[{x:.32,y:.5},{x:.6,y:.44},{x:.66,y:.58},{x:.36,y:.64}],flow:{baseFlow:{x:.05,y:.4},bias:{x:0,y:0}},reliefLayers:[{id:"intake",surfaceId:"hood",mode:"raised",height:1,softness:.06,flowDeflection:1,boundaryWrap:1,enabled:!1,shape:{type:"ellipse",center:{u:.5,v:.4},radius:{u:.18,v:.1},rotation:0}}],rainFields:[{id:"focused-hood-rain",name:"Focused Hood Rain",enabled:!0,surfaceId:"hood",placementSeed:11,responseSeed:23,centerUV:{u:.5,v:.55},scaleUV:{x:.85,y:.85},rotation:0,density:.6,falloff:.2,ratePerSecond:40,startFrame:0,endFrame:240,dropSizeRange:[.25,.7],velocityRange:[.6,1.4],incomingDirection:-1.5708,paletteId:null,poolSize:700}]},{id:"ground",name:"Ground (starter)",enabled:!0,renderOrder:1,simulationResolution:384,normalDirection:-1.5708,normalScale:.03,materialResponseId:"puddle-crown",maskPath:[{u:.02,v:.72},{u:.78,v:.68},{u:.98,v:.98},{u:.02,v:.98}],calibrationQuad:[{x:.02,y:.72},{x:.78,y:.68},{x:.98,y:.98},{x:.02,y:.98}],flow:{baseFlow:{x:0,y:.25},bias:{x:0,y:0}},reliefLayers:[],rainFields:[{id:"ground-puddle",name:"Ground Puddle Rain",enabled:!0,surfaceId:"ground",placementSeed:41,responseSeed:57,centerUV:{u:.5,v:.5},scaleUV:{x:.85,y:.85},rotation:0,density:.6,falloff:.2,ratePerSecond:40,startFrame:0,endFrame:240,dropSizeRange:[.25,.7],velocityRange:[.5,1.2],incomingDirection:-1.5708,paletteId:"puddle",poolSize:700}]}],pt=[],ft=[],mt={zoom:1,panX:0,panY:0},vt={schemaVersion:it,projectId:st,sourcePlate:ot,durationFrames:dt,frameRate:ct,globalSeed:lt,palettes:ut,surfaces:ht,heroEvents:pt,selectedIds:ft,viewportState:mt},gt=1,yt="ioniq5-split",bt={assetId:"demo/ioniq5-split.png",width:1672,height:941},wt=240,St=30,xt=3155,_t=[{id:"metal-mix",name:"Metal Mix",entries:[{responseId:"metal-tick",weight:.6},{responseId:"metal-bounce",weight:.4}]},{id:"puddle",name:"Puddle",entries:[{responseId:"puddle-crown",weight:1}]}],Et=[{id:"hood",name:"Hood (starter — drag A·B·C·D to fit)",enabled:!0,renderOrder:0,simulationResolution:384,normalDirection:-1.5708,normalScale:.05,materialResponseId:"metal-tick",maskPath:[{u:.22,v:.52},{u:.52,v:.46},{u:.58,v:.62},{u:.26,v:.66}],calibrationQuad:[{x:.22,y:.52},{x:.52,y:.46},{x:.58,y:.62},{x:.26,y:.66}],flow:{baseFlow:{x:.05,y:.4},bias:{x:0,y:0}},reliefLayers:[{id:"intake",surfaceId:"hood",mode:"raised",height:1,softness:.06,flowDeflection:1,boundaryWrap:1,enabled:!1,shape:{type:"ellipse",center:{u:.45,v:.42},radius:{u:.18,v:.1},rotation:0}}],rainFields:[{id:"focused-hood-rain",name:"Focused Hood Rain",enabled:!0,surfaceId:"hood",placementSeed:11,responseSeed:23,centerUV:{u:.5,v:.55},scaleUV:{x:.85,y:.85},rotation:0,density:.6,falloff:.2,ratePerSecond:40,startFrame:0,endFrame:240,dropSizeRange:[.25,.7],velocityRange:[.6,1.4],incomingDirection:-1.5708,paletteId:null,poolSize:700}]},{id:"ground",name:"Ground (starter)",enabled:!0,renderOrder:1,simulationResolution:384,normalDirection:-1.5708,normalScale:.03,materialResponseId:"puddle-crown",maskPath:[{u:.02,v:.7},{u:.72,v:.66},{u:.98,v:.98},{u:.02,v:.98}],calibrationQuad:[{x:.02,y:.7},{x:.72,y:.66},{x:.98,y:.98},{x:.02,y:.98}],flow:{baseFlow:{x:0,y:.25},bias:{x:0,y:0}},reliefLayers:[],rainFields:[{id:"ground-puddle",name:"Ground Puddle Rain",enabled:!0,surfaceId:"ground",placementSeed:41,responseSeed:57,centerUV:{u:.5,v:.5},scaleUV:{x:.85,y:.85},rotation:0,density:.6,falloff:.2,ratePerSecond:40,startFrame:0,endFrame:240,dropSizeRange:[.25,.7],velocityRange:[.5,1.2],incomingDirection:-1.5708,paletteId:"puddle",poolSize:700}]}],kt=[],Ct=[],It={zoom:1,panX:0,panY:0},Pt={schemaVersion:gt,projectId:yt,sourcePlate:bt,durationFrames:wt,frameRate:St,globalSeed:xt,palettes:_t,surfaces:Et,heroEvents:kt,selectedIds:Ct,viewportState:It},$t=1,jt="car-hood-demo",Rt={assetId:"demo/car-hood-demo.png",width:1920,height:1080},Ft=240,Ut=30,Lt=1337,Mt=[{id:"metal-mix",name:"Metal Mix",entries:[{responseId:"metal-tick",weight:.6},{responseId:"metal-bounce",weight:.4}]},{id:"puddle",name:"Puddle",entries:[{responseId:"puddle-crown",weight:1}]}],Tt=[{id:"hood",name:"Hood",enabled:!0,renderOrder:0,simulationResolution:384,normalDirection:-1.5708,normalScale:.05,materialResponseId:"metal-tick",maskPath:[{u:.3,v:.4},{u:.7,v:.4},{u:.78,v:.62},{u:.22,v:.62}],calibrationQuad:[{x:.3,y:.4},{x:.7,y:.4},{x:.78,y:.62},{x:.22,y:.62}],flow:{baseFlow:{x:0,y:.45},bias:{x:0,y:0}},reliefLayers:[{id:"intake",surfaceId:"hood",mode:"raised",height:1,softness:.06,flowDeflection:1,boundaryWrap:1,enabled:!1,shape:{type:"ellipse",center:{u:.5,v:.42},radius:{u:.16,v:.08},rotation:0}}],rainFields:[{id:"focused-hood-rain",name:"Focused Hood Rain",enabled:!0,surfaceId:"hood",placementSeed:11,responseSeed:23,centerUV:{u:.5,v:.55},scaleUV:{x:.85,y:.85},rotation:0,density:.6,falloff:.2,ratePerSecond:40,startFrame:0,endFrame:240,dropSizeRange:[.25,.7],velocityRange:[.6,1.4],incomingDirection:-1.5708,paletteId:null,poolSize:700}]},{id:"ground",name:"Ground",enabled:!0,renderOrder:1,simulationResolution:384,normalDirection:-1.5708,normalScale:.03,materialResponseId:"puddle-crown",maskPath:[{u:.05,v:.7},{u:.95,v:.7},{u:.98,v:.98},{u:.02,v:.98}],calibrationQuad:[{x:.05,y:.7},{x:.95,y:.7},{x:.98,y:.98},{x:.02,y:.98}],flow:{baseFlow:{x:0,y:.25},bias:{x:0,y:0}},reliefLayers:[],rainFields:[{id:"ground-puddle",name:"Ground Puddle Rain",enabled:!0,surfaceId:"ground",placementSeed:41,responseSeed:57,centerUV:{u:.5,v:.5},scaleUV:{x:.85,y:.85},rotation:0,density:.6,falloff:.2,ratePerSecond:40,startFrame:0,endFrame:240,dropSizeRange:[.25,.7],velocityRange:[.5,1.2],incomingDirection:-1.5708,paletteId:"puddle",poolSize:700}]}],Dt=[],Vt=[],Nt={zoom:1,panX:0,panY:0},At={schemaVersion:$t,projectId:jt,sourcePlate:Rt,durationFrames:Ft,frameRate:Ut,globalSeed:Lt,palettes:Mt,surfaces:Tt,heroEvents:Dt,selectedIds:Vt,viewportState:Nt},b="/Meteor_SplashDemo/",E=[{id:"hard-surface-topdown",name:"Hard-Surface (top-down: asphalt | concrete)",plateUrl:`${b}assets/demo/hard-surface-topdown.png`,project:rt},{id:"tesla-model3",name:"Tesla Model 3 (3/4 — hood + ground)",plateUrl:`${b}assets/demo/tesla-model3.png`,project:vt},{id:"ioniq5-split",name:"Hyundai Ioniq 5 (3/4 — hood + ground)",plateUrl:`${b}assets/demo/ioniq5-split.png`,project:Pt},{id:"car-hood-demo",name:"Synthetic (procedural fallback)",plateUrl:`${b}assets/demo/car-hood-demo.png`,project:At}],O="hard-surface-topdown";function _(i){return E.find(t=>t.id===i)??E[0]}class Ot{constructor(t,{onScene:e,onUpload:a}){this.mount=t,this.onScene=e,this.onUpload=a,this._build()}_build(){const t=document.createElement("div");t.className="scene-picker";const e=E.map(n=>`<option value="${n.id}"${n.id===O?" selected":""}>${n.name}</option>`).join("");t.innerHTML=`
      <select data-act="scene" title="Bundled demo scene">${e}</select>
      <button data-act="upload" title="Use your own plate image">Upload Plate</button>
      <input type="file" accept="image/*" data-act="file" hidden />`,this.mount.appendChild(t),t.querySelector("[data-act=scene]").addEventListener("change",n=>this.onScene?.(n.target.value));const a=t.querySelector("[data-act=file]");t.querySelector("[data-act=upload]").addEventListener("click",()=>a.click()),a.addEventListener("change",()=>{const n=a.files?.[0];n&&this.onUpload?.(n),a.value=""})}}const D="/Meteor_SplashDemo/assets/normals/wet-micro-normal.png",qt=100;class Ht{constructor(t){this.dom=t,this.state=new te,this.notify=new We(t.notifications),this.projectDirty=!1,this._lastCompile=0,this.inputTexture=null,this._frameTimes=[]}async start(){if(!R.isSupported()){this._showStartupError("WebGPU is not available","navigator.gpu is undefined in this browser/context. WebGPU needs a secure context (https) and a supporting browser. On iOS all browsers share Safari’s setting (enable Settings → Safari → Advanced → Feature Flags → WebGPU on iOS 17; on by default in iOS 18). On Android use Chrome 121+.");return}try{this.host=new R(this.dom.canvas),await this.host.init(),this.host.onDeviceLost=n=>this._handleDeviceLost(n);const t=F();this.engine=await U.create({device:this.host.device,queue:this.host.queue,outputFormat:this.host.format,shaderSources:t,diagnostics:n=>this._onDiagnostic(n)});const e=await L(this.host.device,D);this.engine.registerAssets({microNormal:e});const a=_(O);this.currentSceneId=a.id,await this._loadPlate(a.plateUrl),this._loadProject(structuredClone(a.project)),this._buildUI(),this.state.addEventListener("change",n=>this._onStateChange(n)),this._loop(),this.notify.info("Meteor demo ready — pick a scene, drag a rain field, raise density.")}catch(t){const e=`${t?.name||"Error"}: ${t?.message||String(t)}`+(this.host?.adapterInfo?`  [adapter: ${this.host.adapterInfo}]`:"");this._showStartupError("Couldn’t start the demo",e),typeof console<"u"&&console.error("[meteor] startup failed:",t)}}_showStartupError(t,e){const a=this.dom.unsupported;if(!a)return;const n=a.querySelector("h2"),r=a.querySelector("p");n&&(n.textContent=t),r&&(r.textContent=e),a.hidden=!1}async loadScene(t){const e=_(t);this.currentSceneId=e.id,await this._loadPlate(e.plateUrl),this._loadProject(structuredClone(e.project)),this.timeline&&(this.timeline.clock.durationFrames=this.state.project.durationFrames,this.timeline.jumpTo(0)),this.paramPanel?.syncAll(),this.notify.info(`Loaded scene: ${e.name}`)}async loadUploadedPlate(t){try{const e=await createImageBitmap(t,{colorSpaceConversion:"none"});this.inputTexture=w(this.host.device,e,"plate"),this.plateSize={width:e.width,height:e.height},this.notify.info("Custom plate loaded — recalibrate surfaces if needed.")}catch(e){this.notify.error(`Plate load failed: ${e.message}`)}}async _loadPlate(t){try{const e=await ee(t);this.inputTexture=w(this.host.device,e,"plate"),this.plateSize={width:e.width,height:e.height}}catch(e){this.notify.warn(`Plate missing (${e.message}); run "npm run assets".`),this.inputTexture=w(this.host.device,await Bt(),"plate"),this.plateSize={width:1920,height:1080}}}_loadProject(t){const{project:e,warnings:a}=N(t);this.state.setProject(e),this.engine.setProject(e),this.engine.setParameters(this.state.params),a.forEach(n=>this.notify?.warn(n)),this.projectDirty=!1,this.timeline&&this.timeline.jumpTo(0)}_buildUI(){new Ot(this.dom.scenePicker,{onScene:t=>this.loadScene(t),onUpload:t=>this.loadUploadedPlate(t)}),new ze(this.dom.chipStack,this.state,{notify:this.notify}),this.paramPanel=new _e(this.dom.paramPanel,this.state),this.debugPanel=new Ee(this.dom.debugPanel,this.state,{onResetSim:()=>{this.engine.resetSimulation({}),this.notify.info("Wet state reset")},onBake:()=>this.notify.info("Baked to current frame")}),new qe(this.dom.presetBar,this.state,{notify:this.notify,onApplied:()=>{this.paramPanel.syncAll()}}),new He(this.dom.projectMenu,this.state,{notify:this.notify,onProjectLoaded:t=>{this._loadProject(t),this.paramPanel?.syncAll()},onReloadDemo:()=>{this._loadProject(structuredClone(demoProjectRaw)),this.paramPanel?.syncAll(),this.notify.info("Demo reloaded")}}),this.timeline=new ne(this.dom.timeline,{frameRate:this.state.project.frameRate,durationFrames:this.state.project.durationFrames,onSeek:()=>{}}),this.editor=new xe(this.dom.overlay,this.dom.viewport,this.state,{notify:this.notify,getFrame:()=>this.timeline.clock.frame})}_onStateChange(t){const e=t.detail.kind;["project","surface","field","relief","hero","selection"].includes(e)&&(this.projectDirty=!0)}_loop(){const t=e=>{if(this._raf=requestAnimationFrame(t),!this.engine)return;if(this.editor&&this.editor.drag){this._resumeAfterDrag=!0;return}this._resumeAfterDrag&&(this._resumeAfterDrag=!1,this.projectDirty=!0),this.host.resizeToDisplay()&&this.engine.resize({width:this.host.canvas.width,height:this.host.canvas.height,pixelAspect:1});const a=this.timeline.update(e);this.projectDirty&&e-this._lastCompile>=qt&&(this.engine.setProject(this.state.project),this.projectDirty=!1,this._lastCompile=e),this.engine.setParameters(this.state.params);const n=performance.now();this.engine.render({inputTextureView:this.inputTexture.createView(),outputTextureView:this.host.currentOutputView(),width:this.host.canvas.width,height:this.host.canvas.height,pixelAspect:1,frameIndex:a,timeSeconds:this.timeline.clock.timeSeconds,frameRate:this.state.project.frameRate,debugMode:this.state.params.get("debugMode")}),this._perf(performance.now()-n),this.editor.render()};this._raf=requestAnimationFrame(t)}_perf(t){if(this._frameTimes.push(t),this._frameTimes.length>30&&this._frameTimes.shift(),this.timeline.clock.frame%15===0&&this.debugPanel){const e=this._frameTimes.reduce((a,n)=>a+n,0)/this._frameTimes.length;this.debugPanel.setPerf(`CPU encode: ${e.toFixed(1)} ms · ${this.host.canvas.width}×${this.host.canvas.height}`)}}async captureFrame(t){this.timeline.clock.pause(),this.timeline.jumpTo(t),this.engine.setProject(this.state.project),this.projectDirty=!1,this.engine.setParameters(this.state.params),this.engine.render({inputTextureView:this.inputTexture.createView(),outputTextureView:this.host.currentOutputView(),width:this.host.canvas.width,height:this.host.canvas.height,pixelAspect:1,frameIndex:t,timeSeconds:t/this.state.project.frameRate,frameRate:this.state.project.frameRate,debugMode:this.state.params.get("debugMode")}),await this.host.device.queue.onSubmittedWorkDone()}get uncapturedError(){return this.host?.lastUncapturedError??null}_onDiagnostic(t){t.level==="error"?this.notify.error(`[engine] ${t.message}`):t.level==="warn"&&console.warn("[engine]",t.message)}async _handleDeviceLost(t){this.notify.error(`GPU device lost (${t.message}); rebuilding…`),cancelAnimationFrame(this._raf),this.engine?.dispose(),await this.host.init();const e=F();this.engine=await U.create({device:this.host.device,queue:this.host.queue,outputFormat:this.host.format,shaderSources:e,diagnostics:n=>this._onDiagnostic(n)});const a=await L(this.host.device,D);this.engine.registerAssets({microNormal:a}),await this._loadPlate(_(this.currentSceneId).plateUrl),this.engine.setProject(this.state.project),this.engine.setParameters(this.state.params),this._loop()}}async function Bt(){const i=new Uint8ClampedArray(4).fill(40);return i[3]=255,createImageBitmap(new ImageData(i,1,1))}const k={canvas:document.getElementById("gpu-canvas"),overlay:document.getElementById("overlay"),viewport:document.getElementById("viewport"),unsupported:document.getElementById("unsupported"),chipStack:document.getElementById("chip-stack-mount"),paramPanel:document.getElementById("parameter-panel-mount"),debugPanel:document.getElementById("debug-panel-mount"),presetBar:document.getElementById("preset-bar-mount"),scenePicker:document.getElementById("scene-picker-mount"),projectMenu:document.getElementById("project-menu-mount"),timeline:document.getElementById("timeline-mount"),notifications:document.getElementById("notifications-mount")},q=new Ht(k);window.__meteorApp=q;q.start().then(()=>{window.__meteorReady=!0}).catch(i=>{console.error(i),window.__meteorError=i.message,k.unsupported.hidden=!1,k.unsupported.querySelector("p").textContent=i.message});
//# sourceMappingURL=index-CbyCv9vh.js.map
