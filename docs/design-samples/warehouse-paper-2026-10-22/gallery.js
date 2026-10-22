const frame=document.querySelector('#preview');
let current='current';
function show(){frame.src=current==='template'?'./preview.html':'./production.html';}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{current=button.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));show();}));
document.querySelector('#phone').addEventListener('click',event=>{const phone=frame.classList.toggle('phone');event.currentTarget.setAttribute('aria-pressed',String(phone));});
document.querySelector('#reset').addEventListener('click',show);
