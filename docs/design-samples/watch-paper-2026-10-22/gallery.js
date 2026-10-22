const frame = document.querySelector('#preview');
let current = 'template';
function show() { frame.src = current === 'template' ? './preview.html' : './preview.html?current'; }
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  current = button.dataset.view;
  document.querySelectorAll('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  show();
}));
document.querySelector('#phone').addEventListener('click', event => {
  const phone = frame.classList.toggle('phone');
  event.currentTarget.setAttribute('aria-pressed', String(phone));
});
document.querySelector('#reset').addEventListener('click', show);
