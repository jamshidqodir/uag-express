/* UAG Express — site behaviour: menu, motion, gallery, copy, forms */
(function(){
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

  /* menus */
  document.querySelectorAll('.topbar').forEach(function(bar){
    var b=bar.querySelector('.burger'), n=bar.querySelector('.nav');
    var card=bar.closest('.hcard');
    function set(o){n.classList.toggle('open',o);b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Close menu':'Open menu');if(card)card.classList.toggle('menu-open',o)}
    b.addEventListener('click',function(e){e.stopPropagation();set(!n.classList.contains('open'))});
    n.addEventListener('click',function(e){if(e.target.closest('a'))set(false)});
    document.addEventListener('click',function(e){if(n.classList.contains('open')&&!bar.contains(e.target))set(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
  });

  /* ---------- motion ---------- */
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* split hero titles into words */
  document.querySelectorAll('.hcard h1').forEach(function(h){
    var words=h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label',h.textContent.trim());
    h.innerHTML=words.map(function(w,i){return '<span class="w" aria-hidden="true"><span style="--i:'+i+'">'+esc(w)+'</span></span>'}).join(' ');
  });
  /* scroll reveal with stagger */
  var groups=['.features','.process-l','.steps','.dcard .head','.cards3','.mini3','.partners','.about','.why','.quote','.news','.faq','.cta','.fcard','.values','.assure','.truck','.cinfo','form.card','.head','.apply-side'];
  var items=[];
  groups.forEach(function(g){document.querySelectorAll(g).forEach(function(el){
    var kids=['.features','.steps','.cards3','.mini3','.why','.news','.values','.assure','.cinfo'].indexOf(g)>-1?[].slice.call(el.children):[el];
    if(g==='.faq'||g==='.about'||g==='.process-l')kids=[].slice.call(el.children);
    kids.forEach(function(k,i){if(k.classList.contains('rv')||k.closest('.rv'))return;k.classList.add('rv');k.style.setProperty('--d',Math.min(i,6)*90+'ms');items.push(k)});
  })});
  function countUp(el){
    var n=el.querySelector('.n'); if(!n||n.dataset.done)return; n.dataset.done=1;
    var node=n.firstChild; if(!node||node.nodeType!==3)return;
    var m=node.nodeValue.match(/^(\d+)([^\/]*)$/); if(!m)return;
    var end=+m[1], rest=m[2], t0=null;
    function step(t){t0=t0||t;var p=Math.min((t-t0)/1200,1);node.nodeValue=Math.round(end*(1-Math.pow(1-p,3)))+rest;if(p<1)requestAnimationFrame(step)}
    requestAnimationFrame(step);
  }
  if(!reduce&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var t=e.target;t.classList.remove('pending');setTimeout(function(){t.style.removeProperty('--d')},1400);t.querySelectorAll('.stat').forEach(countUp);io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    window.__arm=function(){
      var vh=innerHeight;
      items.forEach(function(el){
        if(!el.offsetParent)return;
        var r=el.getBoundingClientRect();
        if(r.top>vh*0.92){el.classList.add('pending');io.observe(el)}else{el.classList.remove('pending')}
      });
    };
    window.__arm();
  }


  /* topic prefill from ?topic= (e.g. contact.html?topic=Truck%20purchase%3A%20...) */
  var qt=new URLSearchParams(location.search).get('topic');
  if(qt&&document.getElementById('cform')){
    var base=qt.split(':')[0];
    document.querySelectorAll('input[name=topic]').forEach(function(r){r.checked=(r.value===base)});
    if(qt.indexOf(':')>0){document.getElementById('fmsg').value="I'm interested in the"+qt.slice(qt.indexOf(':')+1)+". Is it still available?"}
  }

  /* truck gallery */
  var main=document.getElementById('truckMain');
  if(main)document.querySelectorAll('.thumbs button').forEach(function(b){b.addEventListener('click',function(){
    main.src=b.dataset.src; document.querySelectorAll('.thumbs button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});
  })});

  /* copy */
  document.querySelectorAll('[data-copy]').forEach(function(b){b.addEventListener('click',function(){
    var done=function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)};
    try{navigator.clipboard.writeText(b.dataset.copy).then(done,function(){sel(b)})}catch(e){sel(b)}
  })});
  function sel(b){var t=b.parentNode.querySelector('b');var r=document.createRange();r.selectNodeContents(t);var s=getSelection();s.removeAllRanges();s.addRange(r)}

  /* forms -> Web3Forms (submissions go to the email set on the access key) */
  function send(f,note,okMsg){
    var btn=f.querySelector('button[type=submit]'), label=btn.innerHTML;
    btn.disabled=true; btn.textContent='Sending…';
    note.className='form-note'; note.textContent='';
    var data=new FormData(f);
    if(f.id==='cform'){var t=f.querySelector('input[name=topic]:checked'); if(t)data.set('subject',t.value+' — uagexpress.com')}
    fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Accept':'application/json'},body:data})
      .then(function(r){return r.json()})
      .then(function(j){
        if(!j.success)throw new Error(j.message||'failed');
        note.className='form-note sent'; note.textContent=okMsg; f.reset();
      })
      .catch(function(){
        note.className='form-note'; note.textContent='Something went wrong and your message was not sent. Please call (513) 297-3232 or email uagexpress@gmail.com.';
      })
      .then(function(){btn.disabled=false; btn.innerHTML=label});
  }
  var dform=document.getElementById('dform');
  if(dform)dform.addEventListener('submit',function(e){
    e.preventDefault();
    var f=e.target, el=f.elements, note=document.getElementById('dnote'), bad=[];
    [['name',el['name'].value.trim()],['phone',el['phone'].value.trim()],['position',el['position'].value]].forEach(function(x){var i=el[x[0]];i.classList.toggle('err',!x[1]);if(!x[1])bad.push(i)});
    if(bad.length){note.className='form-note';note.textContent='Add your name, phone number and driver position so a recruiter can call you.';bad[0].focus();return}
    send(f,note,'Thanks, '+el['name'].value.trim().split(' ')[0]+'. Your application is in. A recruiter will call you within one business day.');
  });
  var cform=document.getElementById('cform');
  if(cform)cform.addEventListener('submit',function(e){
    e.preventDefault();
    var f=e.target, el=f.elements, note=document.getElementById('fnote');
    if(!el['name'].value.trim()||!el['email'].value||!el['email'].checkValidity()){note.className='form-note';note.textContent='Add your name and a valid email address so we can reply.';return}
    send(f,note,'Thanks, '+el['name'].value.trim().split(' ')[0]+'. Your message is in. We reply within one business day.');
  });
})();
