const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function toggleMenu(force) {
    const open = force !== undefined ? force : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', open);
    hamburger.classList.toggle('active', open);
    document.body.classList.toggle('menu-open', open);
    hamburger.setAttribute('aria-expanded', open);
}
hamburger.addEventListener('click', () => toggleMenu());
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth >= 1024) toggleMenu(false); });

window.addEventListener('scroll', () => {
    document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

function submitForm(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const msg = document.getElementById('msg').value.trim();
    const requests = JSON.parse(localStorage.getItem('emis_requests') || '[]');
    requests.push({ name, phone, msg, status: 'new', date: new Date().toISOString() });
    localStorage.setItem('emis_requests', JSON.stringify(requests));
    alert('Спасибо за заявку! Мы свяжемся с вами в ближайшее время.');
    e.target.reset();
}

/* Обновление номера в мобильной CTA */
(function(){
  const st = JSON.parse(localStorage.getItem('emis_settings') || '{}');
  if (st.phone) {
    const el = document.getElementById('mobCtaCall');
    if (el) { el.textContent = '📞 ' + st.phone; el.href = 'tel:' + st.phone.replace(/\D/g, ''); }
  }
})();
