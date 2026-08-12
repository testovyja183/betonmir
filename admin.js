const ADMIN_PASSWORD = 'admin2026';
const LS_KEY = 'emis_requests';
const LS_SETTINGS = 'emis_settings';

let requests = [];
let settings = {};

function init() {
  const token = localStorage.getItem('emis_admin_token');
  if (token === 'ok') {
    showDashboard();
    loadData();
  } else {
    showLogin();
  }
}

/* ---------- AUTH ---------- */
function showLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('adminLayout').classList.remove('active');
}
function doLogin(e) {
  e.preventDefault();
  const pass = document.getElementById('adminPass').value;
  if (pass === ADMIN_PASSWORD) {
    localStorage.setItem('emis_admin_token', 'ok');
    showDashboard();
    loadData();
    toast('Добро пожаловать в панель управления!', 'success');
  } else {
    toast('Неверный пароль', 'error');
  }
}
function logout() {
  localStorage.removeItem('emis_admin_token');
  location.reload();
}

/* ---------- NAV ---------- */
function showDashboard() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminLayout').classList.add('active');
  switchPage('dashboard');
}
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.sidebar-nav a[data-page="${page}"]`);
  if (link) link.classList.add('active');
  document.getElementById('pageTitle').textContent = {
    dashboard:'Дашборд', requests:'Заявки', services:'Услуги', gallery:'Галерея', settings:'Настройки'
  }[page] || 'Админ-панель';
  closeSidebar();
  if (page === 'dashboard') renderDashboard();
  if (page === 'requests') renderRequests();
  if (page === 'services') renderServices();
  if (page === 'gallery') renderGallery();
  if (page === 'settings') renderSettings();
}

/* ---------- DATA ---------- */
function loadData() {
  requests = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  settings = JSON.parse(localStorage.getItem(LS_SETTINGS) || JSON.stringify(defaultSettings()));
}
function defaultSettings() {
  return {
    phone: '+375 29 662-52-66',
    email: '',
    address: 'Минск и Минская область',
    workHours: 'Ежедневно с 8:00 до 20:00',
    instagram: 'https://www.instagram.com/emislavstroy',
    tiktok: 'https://www.tiktok.com/@emislavstroy',
    siteTitle: 'EMISLAVSTROY — Бетонные работы | Минск и область',
    metaDescription: 'EMISLAVSTROY — бетонные работы в Минске и Минской области. Отмостки, дорожки, парковки, площадки из бетона.'
  };
}

/* ---------- DASHBOARD ---------- */
function renderDashboard() {
  const total = requests.length;
  const newReq = requests.filter(r => r.status === 'new').length;
  const done = requests.filter(r => r.status === 'done').length;
  document.getElementById('dashTotal').textContent = total;
  document.getElementById('dashNew').textContent = newReq;
  document.getElementById('dashDone').textContent = done;
  document.getElementById('dashConversion').textContent = total ? Math.round((done/total)*100) + '%' : '0%';

  // последние заявки
  const tbody = document.getElementById('dashRecent');
  if (!requests.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Пока нет заявок</td></tr>';
  } else {
    tbody.innerHTML = requests.slice(-5).reverse().map(r => `
      <tr>
        <td class="td-name">${esc(r.name)}</td>
        <td class="td-phone">${esc(r.phone)}</td>
        <td>${statusBadge(r.status)}</td>
        <td class="td-date">${fmtDate(r.date)}</td>
      </tr>
    `).join('');
  }
  drawChart();
}

function drawChart() {
  const canvas = document.getElementById('statsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  ctx.clearRect(0,0,w,h);

  // Group by date (last 7 days)
  const days = {};
  for (let i=6; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days[d.toISOString().slice(0,10)] = 0;
  }
  requests.forEach(r => { if (days[r.date.slice(0,10)] !== undefined) days[r.date.slice(0,10)]++; });
  const labels = Object.keys(days);
  const vals = Object.values(days);
  const max = Math.max(...vals, 1);

  const pad = 30, bw = (w - pad*2) / labels.length, gap = 12;
  const barW = bw - gap;

  // grid
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
  for (let i=0; i<=4; i++) {
    const y = pad + (h - pad*2) * (i/4);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w-pad, y); ctx.stroke();
  }

  // bars
  vals.forEach((v,i) => {
    const x = pad + i*bw + gap/2;
    const barH = (v/max) * (h - pad*2);
    const y = h - pad - barH;
    const grad = ctx.createLinearGradient(0,y,0,h-pad);
    grad.addColorStop(0, '#38bdf8'); grad.addColorStop(1, 'rgba(56,189,248,.2)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 6); ctx.fill();
    // label
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'center';
    const label = labels[i].slice(5);
    ctx.fillText(label, x + barW/2, h - 10);
    // value
    if (v > 0) { ctx.fillStyle = '#f1f5f9'; ctx.fillText(v, x + barW/2, y - 6); }
  });
}

/* ---------- REQUESTS ---------- */
let reqFilter = 'all';
function renderRequests() {
  const tbody = document.getElementById('reqTable');
  let list = [...requests].reverse();
  if (reqFilter !== 'all') list = list.filter(r => r.status === reqFilter);
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty"><div class="empty-icon">📭</div>Заявок не найдено</td></tr>';
    return;
  }
  tbody.innerHTML = list.map((r,idx) => `
    <tr>
      <td class="td-name">${esc(r.name)}</td>
      <td class="td-phone"><a href="tel:${esc(r.phone)}" style="color:var(--primary)">${esc(r.phone)}</a></td>
      <td class="td-msg" title="${esc(r.msg)}">${esc(r.msg || '—')}</td>
      <td>${statusBadge(r.status)}</td>
      <td class="td-date">${fmtDate(r.date)}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="editReq(${requests.indexOf(r)})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteReq(${requests.indexOf(r)})">🗑</button>
      </td>
    </tr>
  `).join('');
}
function setFilter(f) { reqFilter = f; renderRequests(); }
function statusBadge(s) {
  const map = { new:'<span class="badge badge-new">● Новая</span>', wait:'<span class="badge badge-wait">● В работе</span>', done:'<span class="badge badge-done">✓ Выполнена</span>' };
  return map[s] || s;
}
function deleteReq(i) {
  if (!confirm('Удалить заявку?')) return;
  requests.splice(i,1);
  saveRequests();
  renderRequests();
  toast('Заявка удалена', 'success');
}
function editReq(i) {
  const r = requests[i];
  document.getElementById('editIdx').value = i;
  document.getElementById('editName').value = r.name;
  document.getElementById('editPhone').value = r.phone;
  document.getElementById('editMsg').value = r.msg || '';
  document.getElementById('editStatus').value = r.status;
  openModal('modalEdit');
}
function saveEdit(e) {
  e.preventDefault();
  const i = +document.getElementById('editIdx').value;
  requests[i].name = document.getElementById('editName').value;
  requests[i].phone = document.getElementById('editPhone').value;
  requests[i].msg = document.getElementById('editMsg').value;
  requests[i].status = document.getElementById('editStatus').value;
  saveRequests();
  closeModal('modalEdit');
  renderRequests();
  toast('Заявка обновлена', 'success');
}
function exportCSV() {
  if (!requests.length) { toast('Нет данных для экспорта', 'warning'); return; }
  const header = 'Имя,Телефон,Сообщение,Статус,Дата\n';
  const rows = requests.map(r => `${escCSV(r.name)},${escCSV(r.phone)},${escCSV(r.msg)},${r.status},${r.date}`).join('\n');
  const blob = new Blob([header+rows], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'emis_requests.csv'; a.click(); URL.revokeObjectURL(url);
  toast('CSV экспортирован', 'success');
}
function saveRequests() { localStorage.setItem(LS_KEY, JSON.stringify(requests)); }

/* ---------- SERVICES ---------- */
const defaultServices = [
  {icon:'🏡', title:'Отмостки бетонные', desc:'Надёжная защита фундамента дома с правильным уклоном и армированием.'},
  {icon:'🛤️', title:'Дорожки из бетона', desc:'Аккуратные и долговечные садовые дорожки любой формы и фактуры.'},
  {icon:'🚗', title:'Парковки из бетона', desc:'Прочные парковочные площадки, выдерживающие ежедневные нагрузки.'},
  {icon:'⬜', title:'Площадки из бетона', desc:'Ровные и практичные площадки под террасы, зоны отдыха и хознужды.'},
  {icon:'🌿', title:'Благоустройство', desc:'Комплексное благоустройство частной территории с помощью бетона.'},
  {icon:'🎨', title:'Цветной бетон', desc:'Декоративные решения и цветные дорожки — новый стиль вашего участка.'}
];
function renderServices() {
  const list = JSON.parse(localStorage.getItem('emis_services') || JSON.stringify(defaultServices));
  const wrap = document.getElementById('servicesList');
  wrap.innerHTML = list.map((s,i) => `
    <div class="card" style="margin-bottom:.8rem;">
      <div class="card-body" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
        <div style="font-size:1.6rem;width:40px;text-align:center;">${s.icon}</div>
        <div style="flex:1;min-width:200px;">
          <div style="font-weight:800;margin-bottom:.2rem;">${esc(s.title)}</div>
          <div style="font-size:.85rem;color:var(--text-muted);">${esc(s.desc)}</div>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="editService(${i})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteService(${i})">🗑</button>
      </div>
    </div>
  `).join('');
}
function editService(i) {
  const list = JSON.parse(localStorage.getItem('emis_services') || JSON.stringify(defaultServices));
  const s = list[i];
  document.getElementById('svcIdx').value = i;
  document.getElementById('svcIcon').value = s.icon;
  document.getElementById('svcTitle').value = s.title;
  document.getElementById('svcDesc').value = s.desc;
  openModal('modalService');
}
function deleteService(i) {
  if (!confirm('Удалить услугу?')) return;
  const list = JSON.parse(localStorage.getItem('emis_services') || JSON.stringify(defaultServices));
  list.splice(i,1);
  localStorage.setItem('emis_services', JSON.stringify(list));
  renderServices();
  toast('Услуга удалена', 'success');
}
function saveService(e) {
  e.preventDefault();
  const list = JSON.parse(localStorage.getItem('emis_services') || JSON.stringify(defaultServices));
  const i = document.getElementById('svcIdx').value;
  const obj = { icon: document.getElementById('svcIcon').value, title: document.getElementById('svcTitle').value, desc: document.getElementById('svcDesc').value };
  if (i === '') list.push(obj); else list[+i] = obj;
  localStorage.setItem('emis_services', JSON.stringify(list));
  closeModal('modalService');
  renderServices();
  toast('Услуга сохранена', 'success');
}
function resetServices() {
  if (!confirm('Сбросить услуги к стандартным?')) return;
  localStorage.setItem('emis_services', JSON.stringify(defaultServices));
  renderServices();
  toast('Услуги сброшены', 'success');
}

/* ---------- GALLERY ---------- */
const defaultGallery = [
  {title:'Отмостка вокруг дома', subtitle:'Минский район', color:'graphite'},
  {title:'Цветная дорожка', subtitle:'декоративный бетон', color:'sky'},
  {title:'Парковка', subtitle:'частный дом', color:'blue'},
  {title:'Площадка под террасу', subtitle:'зона отдыха', color:'dark'},
  {title:'Дорожки в саду', subtitle:'благоустройство', color:'gray'}
];
function renderGallery() {
  const list = JSON.parse(localStorage.getItem('emis_gallery') || JSON.stringify(defaultGallery));
  const wrap = document.getElementById('galleryList');
  wrap.innerHTML = list.map((g,i) => `
    <div class="card" style="margin-bottom:.8rem;">
      <div class="card-body" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
        <div style="width:60px;height:45px;border-radius:8px;background:var(--${g.color==='graphite'?'graphite':g.color==='sky'?'blue-sky':g.color==='blue'?'blue':'graphite'});flex-shrink:0;"></div>
        <div style="flex:1;min-width:200px;">
          <div style="font-weight:800;margin-bottom:.2rem;">${esc(g.title)}</div>
          <div style="font-size:.85rem;color:var(--text-muted);">${esc(g.subtitle)}</div>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="editGallery(${i})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteGallery(${i})">🗑</button>
      </div>
    </div>
  `).join('');
}
function editGallery(i) {
  const list = JSON.parse(localStorage.getItem('emis_gallery') || JSON.stringify(defaultGallery));
  const g = list[i];
  document.getElementById('galIdx').value = i;
  document.getElementById('galTitle').value = g.title;
  document.getElementById('galSubtitle').value = g.subtitle;
  document.getElementById('galColor').value = g.color;
  openModal('modalGallery');
}
function deleteGallery(i) {
  if (!confirm('Удалить элемент галереи?')) return;
  const list = JSON.parse(localStorage.getItem('emis_gallery') || JSON.stringify(defaultGallery));
  list.splice(i,1);
  localStorage.setItem('emis_gallery', JSON.stringify(list));
  renderGallery();
  toast('Элемент удалён', 'success');
}
function saveGallery(e) {
  e.preventDefault();
  const list = JSON.parse(localStorage.getItem('emis_gallery') || JSON.stringify(defaultGallery));
  const i = document.getElementById('galIdx').value;
  const obj = { title: document.getElementById('galTitle').value, subtitle: document.getElementById('galSubtitle').value, color: document.getElementById('galColor').value };
  if (i === '') list.push(obj); else list[+i] = obj;
  localStorage.setItem('emis_gallery', JSON.stringify(list));
  closeModal('modalGallery');
  renderGallery();
  toast('Галерея обновлена', 'success');
}

/* ---------- SETTINGS ---------- */
function renderSettings() {
  const s = settings;
  document.getElementById('setPhone').value = s.phone;
  document.getElementById('setEmail').value = s.email;
  document.getElementById('setAddress').value = s.address;
  document.getElementById('setHours').value = s.workHours;
  document.getElementById('setInst').value = s.instagram;
  document.getElementById('setTiktok').value = s.tiktok;
  document.getElementById('setTitle').value = s.siteTitle;
  document.getElementById('setMeta').value = s.metaDescription;
}
function saveSettings(e) {
  e.preventDefault();
  settings.phone = document.getElementById('setPhone').value;
  settings.email = document.getElementById('setEmail').value;
  settings.address = document.getElementById('setAddress').value;
  settings.workHours = document.getElementById('setHours').value;
  settings.instagram = document.getElementById('setInst').value;
  settings.tiktok = document.getElementById('setTiktok').value;
  settings.siteTitle = document.getElementById('setTitle').value;
  settings.metaDescription = document.getElementById('setMeta').value;
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  toast('Настройки сохранены', 'success');
}

/* ---------- UTILS ---------- */
function esc(s) { const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function escCSV(s) { return `"${(s||'').replace(/"/g,'""')}"`; }
function fmtDate(d) { if(!d) return '—'; const dt=new Date(d); return dt.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }

/* Toast */
function toast(msg, type='info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const icon = type==='success'?'✓':type==='error'?'✕':type==='warning'?'⚠':'ℹ';
  t.innerHTML = `<span>${icon}</span><span>${esc(msg)}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(30px)'; setTimeout(()=>t.remove(),300); }, 3500);
}

/* Seed demo data */
if (!localStorage.getItem(LS_KEY)) {
  const demo = [
    {name:'Алексей', phone:'+375 29 123-45-67', msg:'Отмостка вокруг дома 10x12', status:'new', date:'2026-08-12T10:30:00'},
    {name:'Марина', phone:'+375 33 987-65-43', msg:'Дорожки в саду, около 25 м', status:'wait', date:'2026-08-11T14:15:00'},
    {name:'Дмитрий', phone:'+375 25 555-44-33', msg:'Парковка под 2 машины', status:'done', date:'2026-08-10T09:00:00'},
    {name:'Светлана', phone:'+375 29 111-22-33', msg:'Площадка под террасу', status:'new', date:'2026-08-12T16:45:00'},
  ];
  localStorage.setItem(LS_KEY, JSON.stringify(demo));
}

/* Init */
window.addEventListener('DOMContentLoaded', init);
