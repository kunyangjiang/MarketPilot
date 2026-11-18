/* 回到顶部按钮：与统一样稿（design-exploration/index.html）相同的逻辑。滚动后出现；单击回顶；长按 0.2 秒拖动；双击复位。 */
(()=>{
  const b=document.getElementById('totop'),tip=document.getElementById('totop-tip');
  const KEY='mp-totop-pos',HOLD=200,SHOW_AT=480,M=12;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let pos=null;try{pos=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  const vw=()=>document.documentElement.clientWidth,vh=()=>innerHeight,edge=()=>vw()<=760?16:28;
  /* 位置记成"靠左/靠右 + 纵向比例"：窗口尺寸变了也不会跑出屏幕 */
  function place(){
    if(!pos){b.style.left=b.style.top=b.style.right=b.style.bottom='';return}
    const w=b.offsetWidth,x=pos.side==='l'?edge():vw()-w-edge(),y=Math.min(Math.max(pos.y*vh(),M),vh()-w-M);
    b.style.left=x+'px';b.style.top=y+'px';b.style.right='auto';b.style.bottom='auto';
  }
  function save(){try{pos?localStorage.setItem(KEY,JSON.stringify(pos)):localStorage.removeItem(KEY)}catch(e){}}
  const vis=()=>b.classList.toggle('on',scrollY>SHOW_AT);
  addEventListener('scroll',vis,{passive:true});addEventListener('resize',place);addEventListener('hashchange',()=>setTimeout(vis,40));
  place();vis();

  let timer=0,state='idle',sx=0,sy=0,ox=0,oy=0,pid=null,skip=false;
  function showTip(t){tip.textContent=t;const r=b.getBoundingClientRect(),tw=tip.offsetWidth;
    tip.style.left=Math.min(Math.max(r.left+r.width/2-tw/2,8),vw()-tw-8)+'px';tip.style.top=Math.max(r.top-44,8)+'px';tip.classList.add('on')}
  const hideTip=()=>tip.classList.remove('on');
  function reset(){clearTimeout(timer);b.classList.remove('press','lift');state='idle';pid=null}

  b.addEventListener('pointerdown',e=>{
    if(e.button!==0||!b.classList.contains('on'))return;
    pid=e.pointerId;sx=e.clientX;sy=e.clientY;state='press';skip=false;b.classList.add('press');
    try{b.setPointerCapture(pid)}catch(_){}
    timer=setTimeout(()=>{ /* 按满 0.2 秒：进入拖动 */
      if(state!=='press')return;state='lift';b.classList.remove('press');b.classList.add('lift');
      const r=b.getBoundingClientRect();ox=sx-r.left;oy=sy-r.top;
      if(navigator.vibrate)try{navigator.vibrate(12)}catch(_){}
      showTip('拖到任意位置，松手放下');
    },HOLD);
  });
  b.addEventListener('pointermove',e=>{
    if(e.pointerId!==pid)return;
    if(state==='press'){if(Math.hypot(e.clientX-sx,e.clientY-sy)>8)reset();return} /* 还没按满就滑动：当作误触 */
    if(state!=='lift'&&state!=='drag')return;
    e.preventDefault();if(state==='lift'){state='drag';hideTip()}
    const w=b.offsetWidth;
    b.style.left=Math.min(Math.max(e.clientX-ox,M),vw()-w-M)+'px';b.style.top=Math.min(Math.max(e.clientY-oy,M),vh()-w-M)+'px';
    b.style.right='auto';b.style.bottom='auto';
  });
  function end(e){
    if(e.pointerId!==pid)return;
    const was=state;
    if(was==='lift'||was==='drag'){
      skip=true;hideTip();
      if(was==='drag'){ /* 松手后贴到最近的左/右边 */
        const r=b.getBoundingClientRect();pos={side:(r.left+r.width/2)<vw()/2?'l':'r',y:r.top/vh()};save();
        b.classList.add('snap');requestAnimationFrame(place);setTimeout(()=>b.classList.remove('snap'),320);
      }
    }
    reset();
  }
  b.addEventListener('pointerup',end);
  b.addEventListener('pointercancel',e=>{if(e.pointerId===pid){hideTip();reset()}});
  b.addEventListener('contextmenu',e=>e.preventDefault());
  b.addEventListener('click',()=>{
    if(skip){skip=false;return}
    scrollTo({top:0,behavior:reduce.matches?'auto':'smooth'});
  });
  b.addEventListener('dblclick',()=>{pos=null;save();b.classList.add('snap');place();setTimeout(()=>b.classList.remove('snap'),320)});
})();
