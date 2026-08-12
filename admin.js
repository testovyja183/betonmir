const ADMIN_PASSWORD = 'admin2026';
const LS_REQ = 'emis_requests';
const LS_SVC = 'emis_services';
const LS_GAL = 'emis_gallery';
const LS_SET = 'emis_settings';
const LS_CONTENT = 'emis_content';

let requests = [];
let settings = {};
let content = {};
let bc = null;

function init() {
  if (typeof BroadcastChannel !== 'undefined') {
    bc = new BroadcastChannel('emis_sync');
  }
  const token = localStorage.getItem('emis_admin_token');
  if (token === 'ok') { showDashboard(); loadData(); }
  else { showLogin(); }
}

/* ---------- SYNC ---------- */
function syncSite() {
  if (bc) bc.postMessage('reload');
  localStorage.setItem('emis_sync_ts', Date.now().toString());
  refreshPreview();
}
function refreshPreview() {
  const iframe = document.getElementById('sitePreview');
  if (iframe) iframe.src = iframe.src;
}

/* ---------- AUTH ---------- */
function showLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('adminLayout').classList.remove('active');
}
function doLogin(e) {
  e.preventDefault();
  if (document.getElementById('adminPass').value === ADMIN_PASSWORD) {
    localStorage.setItem('emis_admin_token', 'ok');
    showDashboard(); loadData();
    toast('Добро пожаловать!', 'success');
  } else { toast('Неверный пароль', 'error'); }
}
function logout() { localStorage.removeItem('emis_admin_token'); location.reload(); }

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
  const titles = { dashboard:'Дашборд', content:'Тексты сайта', requests:'Заявки', services:'Услуги', gallery:'Галерея', settings:'Настройки' };
  document.getElementById('pageTitle').textContent = titles[page] || 'Админ-панель';
  closeSidebar();
  const previewWrap = document.getElementById('livePreviewWrap');
  if (previewWrap) previewWrap.style.display = (page === 'dashboard') ? 'none' : 'block';
  if (page === 'dashboard') renderDashboard();
  if (page === 'content') renderContentEditor();
  if (page === 'requests') renderRequests();
  if (page === 'services') renderServices();
  if (page === 'gallery') renderGallery();
  if (page === 'settings') renderSettings();
}

/* ---------- DATA ---------- */
function loadData() {
  requests = JSON.parse(localStorage.getItem(LS_REQ) || '[]');
  settings = JSON.parse(localStorage.getItem(LS_SET) || JSON.stringify(defaultSettings()));
  content = JSON.parse(localStorage.getItem(LS_CONTENT) || JSON.stringify(defaultContent()));
  // ГАРАНТИЯ: этапы всегда есть
  if (!content.process) content.process = {};
  if (!content.process.steps || !content.process.steps.length) {
    content.process.steps = JSON.parse(JSON.stringify(defaultContent().process.steps));
  }
}
function defaultSettings() {
  return { phone:'+375 29 662-52-66', email:'', address:'Минск и Минская область', workHours:'Ежедневно с 8:00 до 20:00', instagram:'https://www.instagram.com/emislavstroy', tiktok:'https://www.tiktok.com/@emislavstroy', siteTitle:'Бетонный Мир — Бетонные работы | Минск и область', metaDescription:'Бетонный Мир — бетонные работы в Минске и Минской области. Отмостки, дорожки, парковки, площадки из бетона.' };
}
function defaultContent() {
  return {
    hero:{ badge:'Минск и Минская область', title:'Благоустройство из бетона', titleAccent:'под ключ', subtitle:'Отмостки, дорожки, парковки и площадки из бетона. Надёжно, эстетично и с гарантией — как на фото в нашем Instagram.', btnPrimary:'Рассчитать стоимость', btnGhost:'Смотреть работы' },
    services:{ tag:'Наши услуги', title:'Что мы', titleAccent:'делаем', subtitle:'Полный комплекс бетонных работ для вашего участка — от дорожки до парковки' },
    about:{ title:'Почему выбирают', titleAccent:'Бетонный Мир', p1:'Мы специализируемся исключительно на бетонных работах — и делаем это профессионально. Каждый объект: от небольшой дорожки до большой парковки — выполняем аккуратно и на совесть.', p2:'Работаем по проверенным технологиям, используем качественный бетон и армирование, чтобы результат служил десятилетиями.', stats:{ big:'100+', label:'выполненных объектов в Минске и области' }, features:['Гарантия на работы','Своя техника и инструмент','Бесплатный выезд на замер','Честная смета без сюрпризов'] },
    process:{ tag:'Этапы работы', title:'Как мы', titleAccent:'работаем', subtitle:'Прозрачный процесс от звонка до готового результата', steps:[ {num:'1',title:'Заявка',desc:'Звоните или пишете нам — консультируем бесплатно'}, {num:'2',title:'Выезд и замер',desc:'Приезжаем на объект, оцениваем объём работ'}, {num:'3',title:'Смета и сроки',desc:'Называем точную стоимость и дату готовности'}, {num:'4',title:'Сдача объекта',desc:'Выполняем работы и убираем за собой территорию'} ] },
    gallery:{ tag:'Портфолио', title:'Наши', titleAccent:'работы', subtitle:'Больше фото и видео — в нашем Instagram <a href="https://www.instagram.com/emislavstroy" target="_blank" rel="noopener" style="color:var(--blue-dark);font-weight:600;">@emislavstroy</a>' },
    cta:{ title:'Нужна консультация?', subtitle:'Позвоните нам — ответим на все вопросы, подскажем решение и посчитаем стоимость вашего проекта бесплатно.' },
    contact:{ title:'Свяжитесь с нами', subtitle:'Оставьте заявку — перезвоним в течение 15 минут в рабочее время.', items:[ {icon:'📞',title:'Телефон',value:'+375 (29) 662-52-66',type:'phone'}, {icon:'📍',title:'География',value:'Минск и Минская область',type:'text'}, {icon:'📸',title:'Instagram',value:'@emislavstroy',type:'link',url:'https://www.instagram.com/emislavstroy'}, {icon:'🕐',title:'Режим работы',value:'Ежедневно с 8:00 до 20:00',type:'text'} ] },
    footer:{ desc:'Благоустройство территории из бетона в Минске и Минской области. Отмостки, дорожки, парковки, площадки.', copy:'© 2026 Бетонный Мир. Все права защищены.', geo:'Минск и Минская область 🇧' }
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
  document.getElementById('headerBadge').textContent = '● ' + newReq + ' новых';
  const tbody = document.getElementById('dashRecent');
  if (!requests.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty">Нет заявок</td></tr>'; }
  else { tbody.innerHTML = requests.slice(-5).reverse().map(r => `<tr><td class="td-name">${esc(r.name)}</td><td class="td-phone">${esc(r.phone)}</td><td>${statusBadge(r.status)}</td><td class="td-date">${fmtDate(r.date)}</td></tr>`).join(''); }
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
  const w = rect.width, h = rect.height, pad = 28;
  ctx.clearRect(0,0,w,h);
  const days = {}; for (let i=6; i>=0; i--) { const d = new Date(); d.setDate(d.getDate()-i); days[d.toISOString().slice(0,10)] = 0; }
  requests.forEach(r => { if (days[r.date.slice(0,10)] !== undefined) days[r.date.slice(0,10)]++; });
  const labels = Object.keys(days), vals = Object.values(days), max = Math.max(...vals, 1);
  const bw = (w - pad*2) / labels.length, gap = 10, barW = bw - gap;
  ctx.strokeStyle = '#27354f'; ctx.lineWidth = 1;
  for (let i=0; i<=4; i++) { const y = pad + (h - pad*2) * (i/4); ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w-pad, y); ctx.stroke(); }
  vals.forEach((v,i) => {
    const x = pad + i*bw + gap/2; const barH = (v/max) * (h - pad*2); const y = h - pad - barH;
    const grad = ctx.createLinearGradient(0,y,0,h-pad); grad.addColorStop(0,'#38bdf8'); grad.addColorStop(1,'rgba(56,189,248,.15)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 5); ctx.fill();
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(labels[i].slice(5), x + barW/2, h - 8);
    if (v > 0) { ctx.fillStyle = '#e2e8f0'; ctx.fillText(v, x + barW/2, y - 5); }
  });
}

/* ---------- CONTENT EDITOR ---------- */
function renderContentEditor() {
  const c = content;
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
  if (c.hero) { set('c_hero_badge', c.hero.badge); set('c_hero_title', c.hero.title); set('c_hero_accent', c.hero.titleAccent); set('c_hero_subtitle', c.hero.subtitle); set('c_hero_btn1', c.hero.btnPrimary); set('c_hero_btn2', c.hero.btnGhost); }
  if (c.services) { set('c_svc_tag', c.services.tag); set('c_svc_title', c.services.title); set('c_svc_accent', c.services.titleAccent); set('c_svc_subtitle', c.services.subtitle); }
  if (c.about) { set('c_about_title', c.about.title); set('c_about_accent', c.about.titleAccent); set('c_about_p1', c.about.p1); set('c_about_p2', c.about.p2); set('c_about_big', c.about.stats?.big); set('c_about_lbl', c.about.stats?.label); set('c_about_features', (c.about.features||[]).join('\n')); }
  if (c.process) { set('c_proc_tag', c.process.tag); set('c_proc_title', c.process.title); set('c_proc_accent', c.process.titleAccent); set('c_proc_subtitle', c.process.subtitle); }
  if (c.gallery) { set('c_gal_tag', c.gallery.tag); set('c_gal_title', c.gallery.title); set('c_gal_accent', c.gallery.titleAccent); set('c_gal_subtitle', c.gallery.subtitle); }
  if (c.cta) { set('c_cta_title', c.cta.title); set('c_cta_subtitle', c.cta.subtitle); }
  if (c.contact) { set('c_cont_title', c.contact.title); set('c_cont_subtitle', c.contact.subtitle); }
  if (c.footer) { set('c_foot_desc', c.footer.desc); set('c_foot_copy', c.footer.copy); set('c_foot_geo', c.footer.geo); }
  renderStepsEditor();
  renderContactsEditor();
}

/* ---------- DYNAMIC STEPS EDITOR ---------- */
function renderStepsEditor() {
  const wrap = document.getElementById('stepsEditor');
  const steps = (content.process && content.process.steps && content.process.steps.length) ? content.process.steps : JSON.parse(JSON.stringify(defaultContent().process.steps));
  wrap.innerHTML = steps.map((s,i) => `
    <div class="dyn-row" data-type="step" data-idx="${i}">
      <div class="dyn-fields">
        <div class="editor-group" style="flex:0 0 60px;"><label>№</label><input type="text" class="step-num" value="${esc(s.num)}" placeholder="1"></div>
        <div class="editor-group" style="flex:1;"><label>Заголовок</label><input type="text" class="step-title" value="${esc(s.title)}" placeholder="Заявка"></div>
        <div class="editor-group" style="flex:2;"><label>Описание</label><input type="text" class="step-desc" value="${esc(s.desc)}" placeholder="Описание этапа..."></div>
      </div>
      <button type="button" class="btn btn-sm btn-danger" onclick="removeStep(${i})" title="Удалить">✕</button>
    </div>
  `).join('');
}
function addStep() {
  if (!content.process) content.process = { tag:'', title:'', titleAccent:'', subtitle:'', steps:[] };
  content.process.steps.push({ num: String(content.process.steps.length + 1), title: '', desc: '' });
  renderStepsEditor();
}
function removeStep(i) {
  content.process.steps.splice(i, 1);
  renderStepsEditor();
}

/* ---------- DYNAMIC CONTACTS EDITOR ---------- */
function renderContactsEditor() {
  const wrap = document.getElementById('contactsEditor');
  const items = content.contact?.items || [];
  wrap.innerHTML = items.map((it,i) => `
    <div class="dyn-row" data-type="contact" data-idx="${i}">
      <div class="dyn-fields">
        <div class="editor-group" style="flex:0 0 50px;"><label>Иконка</label><input type="text" class="cont-icon" value="${esc(it.icon)}" placeholder="📞"></div>
        <div class="editor-group" style="flex:1;"><label>Название</label><input type="text" class="cont-title" value="${esc(it.title)}" placeholder="Телефон"></div>
        <div class="editor-group" style="flex:1.5;"><label>Значение</label><input type="text" class="cont-value" value="${esc(it.value)}" placeholder="+375..."></div>
        <div class="editor-group" style="flex:0 0 100px;"><label>Тип</label>
          <select class="cont-type">
            <option value="text" ${it.type==='text'?'selected':''}>Текст</option>
            <option value="phone" ${it.type==='phone'?'selected':''}>Телефон</option>
            <option value="link" ${it.type==='link'?'selected':''}>Ссылка</option>
          </select>
        </div>
        <div class="editor-group" style="flex:1.5;"><label>URL (для ссылки)</label><input type="text" class="cont-url" value="${esc(it.url||'')}" placeholder="https://..."></div>
      </div>
      <button type="button" class="btn btn-sm btn-danger" onclick="removeContact(${i})" title="Удалить">✕</button>
    </div>
  `).join('');
}
function addContact() {
  if (!content.contact) content.contact = { title:'', subtitle:'', items:[] };
  content.contact.items.push({ icon:'', title:'', value:'', type:'text', url:'' });
  renderContactsEditor();
}
function removeContact(i) {
  content.contact.items.splice(i, 1);
  renderContactsEditor();
}
function saveContent(e) {
  e.preventDefault();
  const get = id => document.getElementById(id)?.value || '';
  content.hero = { badge:get('c_hero_badge'), title:get('c_hero_title'), titleAccent:get('c_hero_accent'), subtitle:get('c_hero_subtitle'), btnPrimary:get('c_hero_btn1'), btnGhost:get('c_hero_btn2') };
  content.services = { tag:get('c_svc_tag'), title:get('c_svc_title'), titleAccent:get('c_svc_accent'), subtitle:get('c_svc_subtitle') };
  content.about = { title:get('c_about_title'), titleAccent:get('c_about_accent'), p1:get('c_about_p1'), p2:get('c_about_p2'), stats:{ big:get('c_about_big'), label:get('c_about_lbl') }, features:get('c_about_features').split('\n').map(s=>s.trim()).filter(Boolean) };

  // Собираем этапы из динамических полей
  const stepRows = document.querySelectorAll('#stepsEditor .dyn-row');
  const steps = [];
  stepRows.forEach(row => {
    steps.push({
      num: row.querySelector('.step-num').value,
      title: row.querySelector('.step-title').value,
      desc: row.querySelector('.step-desc').value
    });
  });
  // ГАРАНТИЯ: не сохраняем пустые этапы
  if (!steps.length) {
    steps.push(...JSON.parse(JSON.stringify(defaultContent().process.steps)));
  }
  content.process = { tag:get('c_proc_tag'), title:get('c_proc_title'), titleAccent:get('c_proc_accent'), subtitle:get('c_proc_subtitle'), steps };

  content.gallery = { tag:get('c_gal_tag'), title:get('c_gal_title'), titleAccent:get('c_gal_accent'), subtitle:get('c_gal_subtitle') };
  content.cta = { title:get('c_cta_title'), subtitle:get('c_cta_subtitle') };

  // Собираем контакты из динамических полей
  const contactRows = document.querySelectorAll('#contactsEditor .dyn-row');
  const items = [];
  contactRows.forEach(row => {
    items.push({
      icon: row.querySelector('.cont-icon').value,
      title: row.querySelector('.cont-title').value,
      value: row.querySelector('.cont-value').value,
      type: row.querySelector('.cont-type').value,
      url: row.querySelector('.cont-url').value
    });
  });
  content.contact = { title:get('c_cont_title'), subtitle:get('c_cont_subtitle'), items };

  content.footer = { desc:get('c_foot_desc'), copy:get('c_foot_copy'), geo:get('c_foot_geo') };
  localStorage.setItem(LS_CONTENT, JSON.stringify(content));
  syncSite();
  toast('Тексты сайта сохранены!', 'success');
}

/* ---------- REQUESTS ---------- */
let reqFilter = 'all';
function renderRequests() {
  const tbody = document.getElementById('reqTable');
  let list = [...requests].reverse();
  if (reqFilter !== 'all') list = list.filter(r => r.status === reqFilter);
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty"><div class="empty-icon">📭</div>Заявок не найдено</td></tr>'; return; }
  tbody.innerHTML = list.map((r,idx) => {
    const realIdx = requests.length - 1 - idx;
    return `<tr><td class="td-name">${esc(r.name)}</td><td class="td-phone"><a href="tel:${esc(r.phone)}" style="color:var(--primary)">${esc(r.phone)}</a></td><td class="td-msg" title="${esc(r.msg)}">${esc(r.msg || '—')}</td><td>${statusBadge(r.status)}</td><td class="td-date">${fmtDate(r.date)}</td><td><button class="btn btn-sm btn-ghost" onclick="editReq(${realIdx})">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteReq(${realIdx})">🗑</button></td></tr>`;
  }).join('');
}
function setFilter(f) { reqFilter = f; renderRequests(); }
function statusBadge(s) {
  const map = { new:'<span class="badge badge-new">● Новая</span>', wait:'<span class="badge badge-wait">● В работе</span>', done:'<span class="badge badge-done">✓ Выполнена</span>' };
  return map[s] || s;
}
function deleteReq(i) { if (!confirm('Удалить заявку?')) return; requests.splice(i,1); saveRequests(); renderRequests(); toast('Заявка удалена', 'success'); }
function editReq(i) {
  const r = requests[i]; document.getElementById('editIdx').value = i;
  document.getElementById('editName').value = r.name; document.getElementById('editPhone').value = r.phone;
  document.getElementById('editMsg').value = r.msg || ''; document.getElementById('editStatus').value = r.status;
  openModal('modalEdit');
}
function saveEdit(e) {
  e.preventDefault(); const i = +document.getElementById('editIdx').value;
  requests[i].name = document.getElementById('editName').value;
  requests[i].phone = document.getElementById('editPhone').value;
  requests[i].msg = document.getElementById('editMsg').value;
  requests[i].status = document.getElementById('editStatus').value;
  saveRequests(); closeModal('modalEdit'); renderRequests(); toast('Заявка обновлена', 'success');
}
function exportCSV() {
  if (!requests.length) { toast('Нет данных для экспорта', 'warning'); return; }
  const header = 'Имя,Телефон,Сообщение,Статус,Дата\n';
  const rows = requests.map(r => `${escCSV(r.name)},${escCSV(r.phone)},${escCSV(r.msg)},${r.status},${r.date}`).join('\n');
  const blob = new Blob(["\uFEFF" + header + rows], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'emis_requests.csv'; a.click();
  toast('CSV экспортирован', 'success');
}
function saveRequests() { localStorage.setItem(LS_REQ, JSON.stringify(requests)); }

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
  const list = JSON.parse(localStorage.getItem(LS_SVC) || JSON.stringify(defaultServices));
  const wrap = document.getElementById('servicesList');
  if (!list.length) { wrap.innerHTML = '<div class="empty">Нет услуг</div>'; return; }
  wrap.innerHTML = list.map((s,i) => {
    const thumb = s.image ? `<img src="${s.image}" class="thumb" alt="">` : `<div class="thumb-placeholder">${s.icon||'🔧'}</div>`;
    return `<div class="list-row">${thumb}<div class="info"><div class="t">${esc(s.title)}</div><div class="s">${esc(s.desc)}</div></div><div class="actions"><button class="btn btn-sm btn-ghost" onclick="editService(${i})">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteService(${i})">🗑</button></div></div>`;
  }).join('');
}
function editService(i) {
  const list = JSON.parse(localStorage.getItem(LS_SVC) || JSON.stringify(defaultServices));
  const s = list[i] || {icon:'',title:'',desc:'',image:''};
  document.getElementById('svcIdx').value = (i===''||i===null)?'':i;
  document.getElementById('svcTitle').value = s.title || '';
  document.getElementById('svcDesc').value = s.desc || '';
  document.getElementById('svcImage').value = s.image || '';
  const prev = document.getElementById('svcPreview');
  if (s.image) { prev.src = s.image; prev.classList.add('visible'); } else { prev.src = ''; prev.classList.remove('visible'); }
  openModal('modalService');
}
function deleteService(i) {
  if (!confirm('Удалить услугу?')) return;
  const list = JSON.parse(localStorage.getItem(LS_SVC) || JSON.stringify(defaultServices));
  list.splice(i,1); localStorage.setItem(LS_SVC, JSON.stringify(list));
  syncSite(); renderServices(); toast('Услуга удалена', 'success');
}
function saveService(e) {
  e.preventDefault();
  const list = JSON.parse(localStorage.getItem(LS_SVC) || JSON.stringify(defaultServices));
  const i = document.getElementById('svcIdx').value;
  const img = document.getElementById('svcImage').value.trim();
  const obj = { title: document.getElementById('svcTitle').value, desc: document.getElementById('svcDesc').value, image: img };
  if (i === '') list.push(obj); else list[+i] = obj;
  localStorage.setItem(LS_SVC, JSON.stringify(list));
  syncSite(); closeModal('modalService'); renderServices(); toast('Услуга сохранена', 'success');
}
function resetServices() {
  if (!confirm('Сбросить услуги к стандартным?')) return;
  localStorage.setItem(LS_SVC, JSON.stringify(defaultServices));
  syncSite(); renderServices(); toast('Услуги сброшены', 'success');
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
  const list = JSON.parse(localStorage.getItem(LS_GAL) || JSON.stringify(defaultGallery));
  const wrap = document.getElementById('galleryList');
  if (!list.length) { wrap.innerHTML = '<div class="empty">Нет элементов</div>'; return; }
  wrap.innerHTML = list.map((g,i) => {
    const thumb = g.image ? `<img src="${g.image}" class="thumb" alt="">` : `<div class="thumb-placeholder" style="font-size:.9rem;">🖼</div>`;
    return `<div class="list-row">${thumb}<div class="info"><div class="t">${esc(g.title)}</div><div class="s">${esc(g.subtitle)}</div></div><div class="actions"><button class="btn btn-sm btn-ghost" onclick="editGallery(${i})">✏️</button><button class="btn btn-sm btn-danger" onclick="deleteGallery(${i})">🗑</button></div></div>`;
  }).join('');
}
function editGallery(i) {
  const list = JSON.parse(localStorage.getItem(LS_GAL) || JSON.stringify(defaultGallery));
  const g = list[i] || {title:'',subtitle:'',color:'graphite',image:''};
  document.getElementById('galIdx').value = (i===''||i===null)?'':i;
  document.getElementById('galTitle').value = g.title || '';
  document.getElementById('galSubtitle').value = g.subtitle || '';
  document.getElementById('galImage').value = g.image || '';
  const prev = document.getElementById('galPreview');
  if (g.image) { prev.src = g.image; prev.classList.add('visible'); } else { prev.src = ''; prev.classList.remove('visible'); }
  openModal('modalGallery');
}
function deleteGallery(i) {
  if (!confirm('Удалить элемент галереи?')) return;
  const list = JSON.parse(localStorage.getItem(LS_GAL) || JSON.stringify(defaultGallery));
  list.splice(i,1); localStorage.setItem(LS_GAL, JSON.stringify(list));
  syncSite(); renderGallery(); toast('Элемент удалён', 'success');
}
function saveGallery(e) {
  e.preventDefault();
  const list = JSON.parse(localStorage.getItem(LS_GAL) || JSON.stringify(defaultGallery));
  const i = document.getElementById('galIdx').value;
  const img = document.getElementById('galImage').value.trim();
  const obj = { title: document.getElementById('galTitle').value, subtitle: document.getElementById('galSubtitle').value, image: img };
  if (i === '') list.push(obj); else list[+i] = obj;
  localStorage.setItem(LS_GAL, JSON.stringify(list));
  syncSite(); closeModal('modalGallery'); renderGallery(); toast('Галерея обновлена', 'success');
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
  localStorage.setItem(LS_SET, JSON.stringify(settings));
  syncSite();
  toast('Настройки сохранены', 'success');
}

/* ---------- FILE UPLOAD ---------- */
function handleFile(input, previewId, hiddenId) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('Файл слишком большой (макс 2 МБ)', 'error'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    const base64 = e.target.result;
    document.getElementById(hiddenId).value = base64;
    const prev = document.getElementById(previewId);
    prev.src = base64; prev.classList.add('visible');
  };
  reader.readAsDataURL(file);
}

/* ---------- UTILS ---------- */
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function escCSV(s) { return `"${(s || '').replace(/"/g, '""')}"`; }
function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }

/* Toast */
function toast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
  t.innerHTML = `<span>${icon}</span><span>${esc(msg)}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; setTimeout(() => t.remove(), 300); }, 3500);
}

/* Seed demo data */
if (!localStorage.getItem(LS_REQ)) {
  const demo = [
    { name: 'Алексей', phone: '+375 29 123-45-67', msg: 'Отмостка вокруг дома 10x12', status: 'new', date: '2026-08-12T10:30:00' },
    { name: 'Марина', phone: '+375 33 987-65-43', msg: 'Дорожки в саду, около 25 м', status: 'wait', date: '2026-08-11T14:15:00' },
    { name: 'Дмитрий', phone: '+375 25 555-44-33', msg: 'Парковка под 2 машины', status: 'done', date: '2026-08-10T09:00:00' },
    { name: 'Светлана', phone: '+375 29 111-22-33', msg: 'Площадка под террасу', status: 'new', date: '2026-08-12T16:45:00' },
  ];
  localStorage.setItem(LS_REQ, JSON.stringify(demo));
}
if (!localStorage.getItem(LS_SVC)) {
  localStorage.setItem(LS_SVC, JSON.stringify(defaultServices));
}
if (!localStorage.getItem(LS_GAL)) {
  localStorage.setItem(LS_GAL, JSON.stringify(defaultGallery));
}

/* Init */
window.addEventListener('DOMContentLoaded', init);
