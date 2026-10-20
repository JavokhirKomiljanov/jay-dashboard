/* ---------- 🎓 Обучение: Jay's mentoring platform (2026-10-20) ----------
   Students · programs (track templates copied per student) · tasks/ТЗ with versioned hand-ins · review by rubric
   (+ prompt for an AI pre-check) · session log. Inlined into jos.tpl.html at the LEARN marker by build_jos.py.
   Cloud = JOS Tasks bridge, ns 'learn' (D.learnsync, LEARN_SECRET). Students hand in from ucheba.html#k=<key>
   (bridge ops learn-student / learn-submit see only their own slice). Same sync scheme as «Мои финансы»:
   localStorage at once, cloud ~1 s later, row-level merge by r.u on conflict, deletions win.
   Obsidian copy: Jay/Projects/Обучение/Ученики.md (build_jos.learn_note). */
const LKEY = 'jos7-learn', LSYNC = D.learnsync && D.learnsync.url ? D.learnsync : null;
const LPORTAL = (D.links && D.links.learn_page) || 'https://javokhirkomiljanov.github.io/jay-dashboard/ucheba.html';
document.head.insertAdjacentHTML('beforeend', `<style>
.le-card{display:block;color:inherit;text-decoration:none!important;transition:border-color .15s}.le-card:hover{border-color:var(--ink)}
.le-card h4{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.le-add{font:inherit;font-weight:600;color:var(--mint-dark);cursor:pointer;min-height:150px;background:#fff}
.le-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.le-form label{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600;display:flex;flex-direction:column;gap:3px;min-width:0}
.le-form .wide{grid-column:1/-1}.le-form .fi{border-color:var(--line);text-transform:none;letter-spacing:0;font-weight:400}
@media(max-width:900px){.le-form{grid-template-columns:repeat(2,minmax(0,1fr))}}
.le-ta{resize:vertical;font-family:var(--text);line-height:1.45}
.le-link{margin-top:12px;padding:10px 12px;background:var(--mint-tint);border:1px solid var(--mint-light);border-radius:10px;font-size:12.5px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.le-lesson,.le-task{background:#fff}
.le-lesson summary,.le-task summary{flex-wrap:wrap;font-weight:500}
.le-sub{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:10px 0;background:var(--card)}
.le-sub.wait{border-color:#ffd58a;background:#fffaf0}
.le-sub-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12.5px}
.le-rev{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:14px;margin-top:10px}
@media(max-width:1000px){.le-rev{grid-template-columns:1fr}}
.le-doc{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px;max-height:620px;overflow:auto}
.le-text{white-space:pre-wrap;font-size:13px;color:var(--ink);line-height:1.55}
.le-rub td{padding:6px 6px;vertical-align:middle}.le-rub td.num{white-space:nowrap}
.le-sc{min-width:30px;justify-content:center;margin-left:2px}.le-sc.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.le-total{margin:8px 0;font-size:13px}
.le-new{margin-top:10px;padding:10px;border:1px dashed var(--line-2);border-radius:10px;display:flex;flex-direction:column;gap:6px}
.le-new .fi,.le-sform .fi{border-color:var(--line-2);background:#fff}
.le-sform{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
</style>`);
const LE_RUBRIC = [
  ['goal','Цель и проблема','что болит и какой результат — в деньгах или часах',1],
  ['users','Пользователи и роли','кто пользуется, кто отвечает, кто принимает',0],
  ['flow','Сценарии и функции','что система делает — по шагам',0],
  ['data','Данные и источники','откуда информация; что нельзя загружать в ИИ',0],
  ['out','Результат и формат','как выглядит готовое',0],
  ['accept','Критерии приёмки','как проверить, что сделано',1],
  ['limits','Ограничения и риски','бюджет, сроки, безопасность данных',0],
  ['prio','Приоритеты','что в MVP, что потом',0]].map(([id, name, hint, crit]) => ({id, name, hint, crit}));
const LE_LST = {todo: ['⚪','впереди','grey'], now: ['🟡','идёт','warn'], done: ['✅','пройден','mint'], skip: ['⏭','пропущен','grey']};
const LE_TST = {open: ['задано','blue'], sub: ['сдано — проверить','warn'], rework: ['на доработке','bad'], done: ['принято','mint']};
const LE_SST = {active: 'учится', paused: 'пауза', done: 'закончил', archived: 'в архиве'};
const leBlank = () => ({students: [], programs: [], tasks: [], subs: [], sessions: [], rubric: clone(LE_RUBRIC), pass: {min: 12}, ru: 0, deleted: []});
function leNorm(o){ const b = leBlank(); Object.keys(b).forEach(k => { if(o[k] == null) o[k] = b[k]; }); return o; }
let LD; try{ LD = JSON.parse(localStorage.getItem(LKEY) || 'null'); }catch(e){ LD = null; }
LD = leNorm(LD && Array.isArray(LD.students) ? LD : {}); if(LD.rev == null) LD.rev = 0;
const le = {tab: 'students', sid: null, rid: null, pid: null, open: {}};
const leId = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const leNow = () => Date.now();
const leToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const leAgeH = at => at ? Math.max(0, (Date.now() - new Date(at).getTime()) / 36e5) : 0;
const leAge = at => { const h = leAgeH(at); return h < 1 ? 'только что' : h < 48 ? Math.round(h) + ' ч' : Math.round(h / 24) + ' дн'; };
const leDate = s => s ? String(s).slice(0, 10).split('-').reverse().join('.') : '—';
const leStu = id => LD.students.find(s => s.id === id);
const leTask = id => LD.tasks.find(t => t.id === id);
const leMax = () => LD.rubric.length * 2;
const leScore = sc => LD.rubric.reduce((s, c) => s + (+((sc || {})[c.id]) || 0), 0);
const lePassOk = sc => leScore(sc) >= (+LD.pass.min || 0) && LD.rubric.every(c => !c.crit || (+((sc || {})[c.id]) || 0) > 0);
const leWaiting = () => LD.subs.filter(s => !s.review && (leTask(s.tid) || {}).status !== 'done' && leStu(s.sid)).sort((a, b) => String(a.at).localeCompare(String(b.at)));
const leProg = s => { const L = (s.lessons || []).filter(l => l.status !== 'skip'); return L.length ? Math.round(100 * L.filter(l => l.status === 'done').length / L.length) : 0; };

/* seed: data/jos/learn.json → D.learn (first run only, when both the browser and the cloud are empty) */
function leSeed(){ const s = D.learn; if(!s) return false; ['students','programs','tasks','subs','sessions'].forEach(k => { LD[k] = clone(s[k] || []); }); if(s.rubric) LD.rubric = clone(s.rubric); return true; }
if(!LD.students.length && !LD.programs.length && !LD.rev && leSeed()) LD.dirty = true;
/* extra program templates: data/jos/*.program.json → D.learnPrograms; each one is added once (deleting it in JOS is final) */
(D.learnPrograms || []).forEach(p => { if(p && p.id && !LD.programs.some(x => x.id === p.id) && !LD.deleted.includes(p.id)){
  LD.programs.push(Object.assign(clone(p), {lessons: p.lessons || [], u: Date.now()})); LD.dirty = true; } });

/* cloud sync (same protocol as «Мои финансы», ns 'learn') */
let leTimer = null, leBusy = false, lePending = false, leSync = LSYNC ? ['⏳ облако…','grey'] : ['облако не подключено — только этот браузер','grey'];
const leStore = () => { try{ localStorage.setItem(LKEY, JSON.stringify(LD)); }catch(e){} };
const LE_LOCAL = ['rev','dirty','ver','synced','replace'];
const leOut = () => { const o = {}; Object.keys(LD).forEach(k => { if(!LE_LOCAL.includes(k)) o[k] = LD[k]; }); return o; };
function leSave(){ LD.dirty = true; LD.ver = (LD.ver || 0) + 1;
  try{ localStorage.setItem(LKEY, JSON.stringify(LD)); }catch(e){ alert('Не удалось сохранить в браузере: ' + e.message); }
  const f = document.getElementById('le-saved'); if(f){ f.classList.add('on'); clearTimeout(f._t); f._t = setTimeout(() => f.classList.remove('on'), 1200); }
  learnBadge(); leQueue(); }
function leStatus(txt, cls){ leSync = [txt, cls]; const el = document.getElementById('le-sync'); if(el){ el.textContent = txt; el.className = 'pill ' + cls; } }
function leQueue(){ if(!LSYNC) return; clearTimeout(leTimer); leStatus('⏳ сохраняю…','warn'); leTimer = setTimeout(lePush, 900); }
async function leApi(body){ const r = await fetch(LSYNC.url, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(Object.assign({secret: LSYNC.secret, ns: 'learn'}, body))}); if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
function leMerge(srv, loc){
  const del = [...new Set([...(srv.deleted || []), ...(loc.deleted || [])])];
  const arr = k => { const map = new Map(); (srv[k] || []).forEach(r => map.set(r.id, r));
    (loc[k] || []).forEach(r => { const s = map.get(r.id); if(!s || (r.u || 0) >= (s.u || 0)) map.set(r.id, r); });
    const li = (loc[k] || []).map(r => r.id), ids = [...li, ...(srv[k] || []).map(r => r.id).filter(id => !li.includes(id))];
    return ids.filter(id => !del.includes(id)).map(id => map.get(id)); };
  return {...srv, ...loc, students: arr('students'), programs: arr('programs'), tasks: arr('tasks'), subs: arr('subs'), sessions: arr('sessions'), deleted: del,
    rubric: (loc.ru || 0) >= (srv.ru || 0) ? loc.rubric : srv.rubric, pass: (loc.ru || 0) >= (srv.ru || 0) ? loc.pass : srv.pass, ru: Math.max(loc.ru || 0, srv.ru || 0)};
}
function leSafeRender(){ const a = document.activeElement; if(a && a.closest && a.closest('#v-learn') && /INPUT|SELECT|TEXTAREA/.test(a.tagName)){ lePending = true; return; } lePending = false; leRender(); }
async function lePush(){
  if(!LSYNC || !LD.dirty) return; if(leBusy){ leQueue(); return; }
  leBusy = true; const v0 = LD.ver; let rerender = false;
  try{
    let res = await leApi({fin: 'put', rev: LD.rev || 0, state: leOut()});
    if(!res.ok && res.error === 'conflict'){
      const st = LD.replace ? leOut() : leMerge(leNorm(res.state || {}), leOut());
      res = await leApi({fin: 'put', rev: res.rev, state: st});
      if(res.ok && !LD.replace){ Object.assign(LD, st); rerender = true; }
    }
    if(!res.ok) throw new Error(res.error || 'ошибка');
    LD.rev = res.rev; LD.synced = res.at; LD.replace = false; if(LD.ver === v0) LD.dirty = false; leStore();
    leStatus(LD.dirty ? '⏳ сохраняю…' : '☁ сохранено в облаке', LD.dirty ? 'warn' : 'mint');
  }catch(e){ leStatus('⚠ нет связи — сохранено в браузере, отправлю позже', 'bad'); }
  leBusy = false; if(rerender){ leSafeRender(); learnBadge(); } if(LD.dirty && leSync[1] !== 'bad') leQueue();
}
async function learnPull(){
  if(!LSYNC || leBusy) return;
  try{
    const res = await leApi({fin: 'get'}); if(!res.ok) throw new Error(res.error);
    if(!res.state){ if(LD.students.length || LD.programs.length || LD.dirty){ LD.dirty = true; LD.ver = (LD.ver || 0) + 1; leStore(); return lePush(); } leStatus('☁ облако пустое', 'mint'); return; }
    if(LD.dirty) return lePush();
    if(res.rev !== LD.rev){ Object.assign(LD, leNorm(res.state)); LD.rev = res.rev; LD.synced = res.at; leStore(); leSafeRender(); learnBadge(); }
    leStatus('☁ синхронизировано', 'mint');
  }catch(e){ leStatus('⚠ облако недоступно — работаю в браузере', 'bad'); }
}
if(LSYNC){
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') learnPull(); });
  window.addEventListener('online', () => { LD.dirty ? lePush() : learnPull(); });
  document.addEventListener('focusout', () => setTimeout(() => { if(lePending) leSafeRender(); }, 50));
  setInterval(() => { if(document.visibilityState === 'visible' && document.getElementById('v-learn').classList.contains('on')) learnPull(); }, 30000);
}

/* edits */
function leUpd(coll, id, patch, rerender){ const r = LD[coll].find(x => x.id === id); if(!r) return; Object.assign(r, patch, {u: leNow()}); leSave(); if(rerender !== false) leRender(); }
function leF(coll, id, k, el){ leUpd(coll, id, {[k]: el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value}, el.tagName === 'SELECT'); }
function leDel(coll, id, what){ if(!confirm('Удалить ' + (what || 'запись') + '?')) return; LD[coll] = LD[coll].filter(x => x.id !== id); LD.deleted.push(id);
  if(coll === 'tasks'){ LD.subs.filter(s => s.tid === id).forEach(s => LD.deleted.push(s.id)); LD.subs = LD.subs.filter(s => s.tid !== id); }
  if(coll === 'students'){ ['tasks','subs','sessions'].forEach(k => { LD[k].filter(x => x.sid === id).forEach(x => LD.deleted.push(x.id)); LD[k] = LD[k].filter(x => x.sid !== id); }); le.sid = null; }
  if(coll === 'subs') LD.tasks.forEach(t => { if(t.status === 'sub' && !LD.subs.some(s => s.tid === t.id && !s.review)){ t.status = LD.subs.some(s => s.tid === t.id) ? 'rework' : 'open'; t.u = leNow(); } });
  leSave(); leRender(); }
function leLesson(sid, lid, k, el){ const s = leStu(sid), l = (s.lessons || []).find(x => x.id === lid); if(!l) return; l[k] = el.value;
  if(k === 'status' && el.value === 'done' && !l.date) l.date = leToday(); s.u = leNow(); leSave(); if(el.tagName === 'SELECT') leRender(); }
function leLessonAdd(sid){ const s = leStu(sid); s.lessons = s.lessons || []; s.lessons.push({id: leId('l'), n: s.lessons.length + 1, title: 'Новый урок', goal: '', result: '', hw: '', link: '', status: 'todo', date: '', note: ''}); s.u = leNow(); leSave(); leRender(); }
function leLessonDel(sid, lid){ if(!confirm('Убрать урок из программы ученика?')) return; const s = leStu(sid); s.lessons = s.lessons.filter(x => x.id !== lid); s.u = leNow(); leSave(); leRender(); }
function leAssign(sid, pid){ const s = leStu(sid), p = LD.programs.find(x => x.id === pid); if(!p) return;
  if((s.lessons || []).length && !confirm('Заменить уроки ученика уроками программы «' + p.title + '»? Отметки пройденных уроков пропадут.')) return leRender();
  s.program = p.title; s.pid = p.id; s.lessons = p.lessons.map((l, i) => ({id: leId('l') + i, n: l.n || i + 1, title: l.title, goal: l.goal || '', result: l.result || '', hw: l.hw || '', tz: l.tz || 0, link: l.link || '', status: 'todo', date: '', note: ''}));
  s.u = leNow(); leSave(); leRender(); }
function leStudentAdd(){ const name = prompt('Имя ученика'); if(!name) return; const s = {id: leId('st'), name: name.trim(), biz: '', goal: '', lang: 'ru', start: leToday(), status: 'active', tg: '', notes: '', key: '', program: '', lessons: [], u: leNow()};
  LD.students.push(s); le.sid = s.id; le.tab = 'students'; leSave(); leRender(); }
function leKey(sid, fresh){ const s = leStu(sid); if(s.key && fresh && !confirm('Старая ссылка перестанет работать. Создать новую?')) return;
  if(!s.key || fresh){ s.key = (crypto.randomUUID ? crypto.randomUUID() : leId('k') + Math.random().toString(36).slice(2)).replace(/-/g, ''); s.u = leNow(); leSave(); }
  const url = LPORTAL + '#k=' + s.key; navigator.clipboard && navigator.clipboard.writeText(url); leRender(); return url; }
function leTaskAdd(sid, lid){ const s = leStu(sid), l = lid ? (s.lessons || []).find(x => x.id === lid) : null;
  const t = {id: leId('t'), sid, lid: lid || '', title: l ? (l.tz ? 'ТЗ: ' : 'ДЗ: ') + (l.hw || l.result || l.title) : 'Новое задание', brief: l ? (l.hw || l.result || '') : '', kind: l && l.tz ? 'tz' : 'hw', due: '', status: 'open', u: leNow()};
  LD.tasks.push(t); le.open[t.id] = 1; leSave(); leRender(); }
function leSubAdd(tid){ const t = leTask(tid), ta = document.getElementById('le-new-' + tid), li = document.getElementById('le-newl-' + tid);
  const text = (ta && ta.value || '').trim(), link = (li && li.value || '').trim(); if(!text && !link) return alert('Вставь текст ТЗ или ссылку');
  const v = LD.subs.filter(s => s.tid === tid).length + 1, s = {id: leId('sb'), sid: t.sid, tid, v, at: new Date().toISOString(), text, link, by: 'jay', u: leNow()};
  LD.subs.push(s); t.status = 'sub'; t.u = leNow(); le.rid = s.id; leSave(); leRender(); }
function leSessAdd(sid){ const g = id => (document.getElementById(id) || {}).value || ''; if(!g('le-s-topic').trim()) return alert('Тема встречи?');
  LD.sessions.push({id: leId('ss'), sid, date: g('le-s-date') || leToday(), topic: g('le-s-topic').trim(), notes: g('le-s-notes').trim(), next: g('le-s-next').trim(), u: leNow()}); leSave(); leRender(); }

/* review */
function leSc(rid, cid, v){ const s = LD.subs.find(x => x.id === rid); s.draft = s.draft || {sc: {}, fb: ''}; s.draft.sc[cid] = v; s.u = leNow(); leSave(); leRender(); }
function leFb(rid, el){ const s = LD.subs.find(x => x.id === rid); s.draft = s.draft || {sc: {}, fb: ''}; s.draft.fb = el.value; s.u = leNow(); leSave(); }
function leVerdict(rid, verdict){ const s = LD.subs.find(x => x.id === rid), d = s.draft || {sc: {}, fb: ''}, t = leTask(s.tid);
  if(t && t.kind === 'tz' && LD.rubric.some(c => d.sc[c.id] == null) && !confirm('Не все критерии оценены. Сохранить так?')) return;
  s.review = {verdict, sc: clone(d.sc), fb: d.fb || '', at: new Date().toISOString(), shared: true}; delete s.draft; s.u = leNow();
  if(t){ t.status = verdict === 'ok' ? 'done' : 'rework'; t.u = leNow();
    if(verdict === 'ok' && t.lid){ const st = leStu(t.sid), l = (st.lessons || []).find(x => x.id === t.lid); if(l && l.status !== 'done'){ l.status = 'done'; l.date = l.date || leToday(); st.u = leNow(); } } }
  leSave(); leRender(); }
function leReopen(rid){ const s = LD.subs.find(x => x.id === rid); if(!s.review) return; s.draft = {sc: clone(s.review.sc || {}), fb: s.review.fb || ''}; delete s.review; s.u = leNow();
  const t = leTask(s.tid); if(t){ t.status = 'sub'; t.u = leNow(); } leSave(); leRender(); }
function leFbText(s){ const st = leStu(s.sid) || {}, t = leTask(s.tid) || {}, r = s.review || s.draft || {sc: {}, fb: ''}, uz = st.lang === 'uz';
  const mark = v => v == null ? '·' : +v === 2 ? '✅' : +v === 1 ? '🟡' : '❌';
  const lines = (t.kind === 'tz' || Object.keys(r.sc || {}).length) ? LD.rubric.map(c => `${mark((r.sc || {})[c.id])} ${c.name}`).join('\n') + `\n${uz ? 'Jami' : 'Итого'}: ${leScore(r.sc)}/${leMax()}\n` : '';
  const verdict = s.review ? (s.review.verdict === 'ok' ? (uz ? '✅ Qabul qilindi' : '✅ Принято') : (uz ? '🔁 Qayta ishlash kerak' : '🔁 Нужна доработка')) : '';
  return `${String(st.name || '').split(/\s+/).slice(0, 2).join(' ')}, ${uz ? 'topshiriqni tekshirdim' : 'проверил'} «${t.title || ''}» (${uz ? 'versiya' : 'версия'} ${s.v}).\n${verdict}\n\n${lines}\n${r.fb || ''}`.replace(/\n{3,}/g, '\n\n').trim(); }
function leAiPrompt(s){ const st = leStu(s.sid) || {}, t = leTask(s.tid) || {}, l = st.lessons && st.lessons.find(x => x.id === t.lid);
  const crit = LD.rubric.filter(c => c.crit).map(c => c.name).join(', ');
  return `Ты — опытный бизнес-аналитик и наставник по внедрению ИИ в бизнес. Проверь работу моего ученика строго по рубрике.

Ученик: ${st.name || ''} — ${st.biz || '[бизнес не указан]'}.
Цель обучения: ${st.goal || '[не указана]'}.
${l ? `Урок: ${l.n}. ${l.title}. Ожидаемый результат урока: ${l.result || '—'}.\n` : ''}Задание: ${t.title || ''}.
Что требовалось: ${t.brief || '—'}

Рубрика — каждый пункт 0 (нет), 1 (частично), 2 (хорошо):
${LD.rubric.map((c, i) => `${i + 1}. ${c.name} — ${c.hint}${c.crit ? ' (обязательный)' : ''}`).join('\n')}
Принято, если сумма ≥ ${LD.pass.min} из ${leMax()}${crit ? ` и нет нуля по пунктам: ${crit}` : ''}.

Ответь так:
1. Таблица: критерий · балл · почему (одно предложение + короткая цитата из работы).
2. Сумма и вердикт: принято / доработка.
3. Три главных исправления — конкретно, что дописать или переписать.
4. Фидбек ученику на ${st.lang === 'uz' ? 'узбекском (латиница)' : 'русском'}: 5–7 предложений, тёплый тон, сначала что получилось, потом что исправить.
Не выдумывай того, чего нет в тексте. Если текста нет, а есть только ссылка, — так и скажи.

Работа (версия ${s.v}, ${leDate(s.at)}):
"""
${s.text || '[текста нет]'}
"""
${s.link ? 'Ссылка: ' + s.link : ''}`.trim(); }
function leCopy(txt, btn){ (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { if(btn){ const o = btn.textContent; btn.textContent = '✓ скопировано'; setTimeout(() => btn.textContent = o, 1400); } }).catch(() => prompt('Скопируй:', txt)); }
function leTg(txt){ window.open('https://t.me/share/url?url=' + encodeURIComponent(' ') + '&text=' + encodeURIComponent(txt), '_blank'); }

/* views */
const leJs = s => esc(String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));  // text inside onclick='…'
const leInp = (coll, id, k, v, ph, type) => `<input class="fi" ${type ? `type="${type}"` : ''} value="${esc(v || '')}" placeholder="${esc(ph || '')}" onchange="leF('${coll}','${id}','${k}',this)">`;
const leTa = (coll, id, k, v, ph, rows) => `<textarea class="fi le-ta" rows="${rows || 3}" placeholder="${esc(ph || '')}" onchange="leF('${coll}','${id}','${k}',this)">${esc(v || '')}</textarea>`;
const leSel = (coll, id, k, v, opts) => `<select class="fi" onchange="leF('${coll}','${id}','${k}',this)">${opts.map(([val, t]) => `<option value="${val}"${String(v) === val ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
function leStudents(){
  if(le.sid && leStu(le.sid)) return leStudent(leStu(le.sid));
  const act = LD.students.filter(s => s.status !== 'archived'), arch = LD.students.filter(s => s.status === 'archived'), W = leWaiting();
  const card = s => { const p = leProg(s), L = s.lessons || [], nx = L.find(l => l.status === 'now') || L.find(l => l.status === 'todo'),
      open = LD.tasks.filter(t => t.sid === s.id && t.status !== 'done').length, w = W.filter(x => x.sid === s.id).length,
      last = LD.sessions.filter(x => x.sid === s.id).sort((a, b) => String(b.date).localeCompare(a.date))[0];
    return `<a class="card white le-card" href="#learn" onclick="le.sid='${s.id}';leRender();return false">
      <h4>${esc(s.name)} <span class="pill ${s.status === 'active' ? 'mint' : 'grey'}">${LE_SST[s.status] || s.status}</span>${w ? ` <span class="pill warn">📥 ${w}</span>` : ''}</h4>
      <p class="small">${esc(s.biz || '— бизнес не заполнен')}</p>
      <p class="small muted">${esc(s.program || 'программа не назначена')}</p>
      <div class="me-bar" style="margin:8px 0 4px"><i style="width:${p}%"></i></div>
      <p class="small"><b>${p}%</b> программы · ${L.filter(l => l.status === 'done').length}/${L.filter(l => l.status !== 'skip').length} уроков · открытых заданий: ${open}</p>
      <p class="small muted">${nx ? 'Дальше: ' + esc(nx.n + '. ' + nx.title) : L.length ? 'все уроки пройдены' : 'уроков нет'}${last ? ' · встреча ' + leDate(last.date) : ''}</p></a>`; };
  return `<div class="grid g3">${act.map(card).join('')}
      <button class="card soft le-add" onclick="leStudentAdd()">＋ Новый ученик</button></div>
    ${arch.length ? `<details><summary>Архив · ${arch.length}</summary><div class="in grid g3">${arch.map(card).join('')}</div></details>` : ''}`;
}
function leStudent(s){
  const L = s.lessons || [], T = LD.tasks.filter(t => t.sid === s.id), S = LD.sessions.filter(x => x.sid === s.id).sort((a, b) => String(b.date).localeCompare(a.date)), p = leProg(s);
  const W = leWaiting().filter(x => x.sid === s.id), url = s.key ? LPORTAL + '#k=' + s.key : '';
  return `<p><a href="#learn" onclick="le.sid=null;leRender();return false">← все ученики</a></p>
  <div class="sect-h"><h3 class="h2" style="margin:0">${esc(s.name)}</h3><span class="tag">${p}% программы · старт ${leDate(s.start)}</span></div>
  <div class="grid g4" style="margin-bottom:14px">
    <div class="stat hl"><div class="v">${p}<small>%</small></div><div class="l">программы пройдено</div><div class="n">${L.filter(l => l.status === 'done').length} из ${L.filter(l => l.status !== 'skip').length} уроков</div></div>
    <div class="stat${W.length ? ' neg' : ''}"><div class="v">${W.length}</div><div class="l">ждут твоей проверки</div><div class="n">${W.length ? 'самая старая ' + leAge(W[0].at) : 'очередь пустая'}</div></div>
    <div class="stat"><div class="v">${T.filter(t => t.status !== 'done').length}</div><div class="l">открытых заданий</div><div class="n">принято ${T.filter(t => t.status === 'done').length}</div></div>
    <div class="stat"><div class="v">${S.length}</div><div class="l">встреч</div><div class="n">${S[0] ? 'последняя ' + leDate(S[0].date) : 'пока нет'}</div></div>
  </div>
  <div class="card white" style="margin-bottom:14px">
    <h4>Профиль</h4>
    <div class="le-form">
      <label>Имя${leInp('students', s.id, 'name', s.name)}</label>
      <label>Бизнес${leInp('students', s.id, 'biz', s.biz, 'чем занимается')}</label>
      <label>Цель обучения${leInp('students', s.id, 'goal', s.goal, 'что хочет получить')}</label>
      <label>Telegram / контакт${leInp('students', s.id, 'tg', s.tg, '@username')}</label>
      <label>Старт${leInp('students', s.id, 'start', s.start, '', 'date')}</label>
      <label>Язык страницы${leSel('students', s.id, 'lang', s.lang || 'ru', [['ru','Русский'],['uz',"O'zbekcha"]])}</label>
      <label>Статус${leSel('students', s.id, 'status', s.status, Object.entries(LE_SST))}</label>
      <label class="wide">Заметки (только тебе)${leTa('students', s.id, 'notes', s.notes, 'что важно помнить', 2)}</label>
    </div>
    <div class="le-link">🔗 <b>Страница ученика</b> — видит свою программу и задания, сдаёт ТЗ, читает твой фидбек.
      ${url ? `<span class="mono">${esc(url.slice(0, 64))}…</span> <button class="btn sm" onclick="leCopy('${url}',this)">Копировать</button> <a class="btn sm" href="${url}" target="_blank">Открыть ↗</a> <button class="btn sm" onclick="leTg('${s.lang === 'uz' ? 'Shaxsiy sahifangiz: dastur, topshiriqlar va TZ topshirish' : 'Ваша страница обучения: программа, задания и сдача ТЗ'}: ${url}')">✈ Telegram</button> <button class="btn sm" title="Старая ссылка перестанет работать" onclick="leKey('${s.id}',1)">♻ Новая ссылка</button>`
        : `<button class="btn sm mint" onclick="leKey('${s.id}')">Создать ссылку</button>`}
      ${s.tg && s.tg.replace(/[^\w]/g, '') ? `<a class="btn sm" href="https://t.me/${s.tg.replace(/[^\w]/g, '')}" target="_blank" rel="noopener">💬 Написать в Telegram</a>` : ''}
      <button class="xbtn" style="float:right" title="Удалить ученика со всеми заданиями" onclick="leDel('students','${s.id}','ученика «${leJs(s.name)}» и все его задания')">🗑</button></div>
  </div>
  <div class="me-cols">
    <div>
      <div class="sect-h"><h3>Программа</h3><span class="tag">${esc(s.program || 'не назначена')}</span></div>
      <div class="fin-bar"><select class="fi" style="max-width:320px;border-color:var(--line-2)" onchange="if(this.value)leAssign('${s.id}',this.value)"><option value="">${L.length ? '↻ Заменить на программу…' : 'Назначить программу…'}</option>${LD.programs.map(p => `<option value="${p.id}">${esc(p.title)} · ${p.lessons.length} ур.</option>`).join('')}</select>
        <button class="btn sm" onclick="leLessonAdd('${s.id}')">＋ урок</button></div>
      ${L.length ? L.map(l => leLessonRow(s, l)).join('') : `<p class="small muted">Уроков нет. Назначь программу из «📚 Программы» или добавь урок вручную.</p>`}
      <div class="sect-h" style="margin-top:22px"><h3>Задания и ТЗ</h3><button class="btn sm" onclick="leTaskAdd('${s.id}')">＋ задание</button></div>
      ${T.length ? T.map(t => leTaskBlock(t)).join('') : `<p class="small muted">Заданий нет. «＋ задание» у урока создаёт его из домашки урока.</p>`}
    </div>
    <div>
      <div class="sect-h"><h3>Встречи</h3><span class="tag">${S.length}</span></div>
      <div class="card mint le-sform">
        <input class="fi" type="date" id="le-s-date" value="${leToday()}">
        <input class="fi" id="le-s-topic" placeholder="Тема (например: Урок 2 — личный ассистент)">
        <textarea class="fi le-ta" id="le-s-notes" rows="2" placeholder="Что сделали, что заметил (видишь только ты)"></textarea>
        <textarea class="fi le-ta" id="le-s-next" rows="2" placeholder="Следующий шаг (ученик увидит)"></textarea>
        <button class="btn pri sm" onclick="leSessAdd('${s.id}')">＋ Записать встречу</button></div>
      ${S.map(x => `<div class="me-line" style="align-items:flex-start"><div class="grow"><b>${leDate(x.date)}</b> · ${esc(x.topic)}${x.notes ? `<div class="small">${esc(x.notes)}</div>` : ''}${x.next ? `<div class="small muted">→ ${esc(x.next)}</div>` : ''}</div><button class="xbtn" onclick="leDel('sessions','${x.id}','встречу')">✕</button></div>`).join('')}
    </div>
  </div>`;
}
function leLessonRow(s, l){ const st = LE_LST[l.status] || LE_LST.todo, has = LD.tasks.filter(t => t.lid === l.id);
  return `<details class="le-lesson"${le.open[l.id] ? ' open' : ''} ontoggle="le.open['${l.id}']=this.open?1:0"><summary><span>${st[0]}</span> <b>${esc(l.n)}. ${esc(l.title)}</b> <span class="pill ${st[2]}">${st[1]}</span>${l.tz ? ' <span class="pill lav">ТЗ</span>' : ''}${l.date ? ` <span class="small muted">${leDate(l.date)}</span>` : ''}${has.length ? ` <span class="small muted">· заданий ${has.length}</span>` : ''}</summary>
    <div class="in le-form">
      <label>Статус<select class="fi" onchange="leLesson('${s.id}','${l.id}','status',this)">${Object.entries(LE_LST).map(([k, v]) => `<option value="${k}"${l.status === k ? ' selected' : ''}>${v[0]} ${v[1]}</option>`).join('')}</select></label>
      <label>Дата<input class="fi" type="date" value="${esc(l.date || '')}" onchange="leLesson('${s.id}','${l.id}','date',this)"></label>
      <label>№<input class="fi" value="${esc(l.n)}" onchange="leLesson('${s.id}','${l.id}','n',this)"></label>
      <label class="wide">Название<input class="fi" value="${esc(l.title)}" onchange="leLesson('${s.id}','${l.id}','title',this)"></label>
      <label class="wide">О чём урок<textarea class="fi le-ta" rows="2" onchange="leLesson('${s.id}','${l.id}','goal',this)">${esc(l.goal || '')}</textarea></label>
      <label class="wide">Результат урока / домашка<textarea class="fi le-ta" rows="2" onchange="leLesson('${s.id}','${l.id}','hw',this)">${esc(l.hw || l.result || '')}</textarea></label>
      <label class="wide">Ссылка на материалы<input class="fi" value="${esc(l.link || '')}" placeholder="https://… (урок, презентация)" onchange="leLesson('${s.id}','${l.id}','link',this)"></label>
      <label class="wide">Заметка (только тебе)<textarea class="fi le-ta" rows="2" onchange="leLesson('${s.id}','${l.id}','note',this)">${esc(l.note || '')}</textarea></label>
      <div class="wide"><button class="btn sm" onclick="leTaskAdd('${s.id}','${l.id}')">＋ задание по уроку</button> <button class="xbtn" onclick="leLessonDel('${s.id}','${l.id}')">✕ убрать урок</button></div>
    </div></details>`; }
function leTaskBlock(t){ const st = leStu(t.sid), subs = LD.subs.filter(s => s.tid === t.id).sort((a, b) => (b.v || 0) - (a.v || 0)), ts = LE_TST[t.status] || LE_TST.open;
  const late = t.due && t.status !== 'done' && t.due < leToday();
  return `<details class="le-task"${le.open[t.id] ? ' open' : ''} ontoggle="le.open['${t.id}']=this.open?1:0"><summary><span class="pill ${t.kind === 'tz' ? 'lav' : 'grey'}">${t.kind === 'tz' ? 'ТЗ' : 'ДЗ'}</span> <b>${esc(t.title)}</b> <span class="pill ${ts[1]}">${ts[0]}</span>${t.due ? ` <span class="small ${late ? '' : 'muted'}" style="${late ? 'color:var(--coral-dark)' : ''}">до ${leDate(t.due)}</span>` : ''}${subs.length ? ` <span class="small muted">· версий ${subs.length}</span>` : ''}</summary>
    <div class="in">
      <div class="le-form">
        <label class="wide">Задание${leInp('tasks', t.id, 'title', t.title)}</label>
        <label>Тип${leSel('tasks', t.id, 'kind', t.kind, [['tz','ТЗ (по рубрике)'],['hw','Домашка']])}</label>
        <label>Срок${leInp('tasks', t.id, 'due', t.due, '', 'date')}</label>
        <label>Статус${leSel('tasks', t.id, 'status', t.status, Object.entries(LE_TST).map(([k, v]) => [k, v[0]]))}</label>
        <label>Урок<select class="fi" onchange="leF('tasks','${t.id}','lid',this)"><option value="">—</option>${(st.lessons || []).map(l => `<option value="${l.id}"${t.lid === l.id ? ' selected' : ''}>${esc(l.n + '. ' + l.title)}</option>`).join('')}</select></label>
        <label class="wide">Что нужно сделать (ученик видит)${leTa('tasks', t.id, 'brief', t.brief, 'условие задания, формат сдачи', 3)}</label>
      </div>
      ${subs.map(s => leSubCard(s)).join('')}
      ${t.status !== 'done' ? `<div class="le-new"><b class="small">＋ Сдача из Telegram</b> <span class="small muted">(если ученик прислал тебе, а не через свою страницу)</span>
        <textarea class="fi le-ta" id="le-new-${t.id}" rows="3" placeholder="Вставь текст ТЗ"></textarea>
        <input class="fi" id="le-newl-${t.id}" placeholder="или ссылка (Google Docs, Drive…)"> <button class="btn sm pri" onclick="leSubAdd('${t.id}')">Добавить версию</button></div>` : ''}
      <p style="text-align:right;margin:6px 0 0"><button class="xbtn" onclick="leDel('tasks','${t.id}','задание и все его версии')">✕ удалить задание</button></p>
    </div></details>`; }
function leSubCard(s){ const r = s.review, open = le.rid === s.id || (!r && le.rid == null && s.v === Math.max(...LD.subs.filter(x => x.tid === s.tid).map(x => x.v || 0)));
  return `<div class="le-sub${r ? '' : ' wait'}"><div class="le-sub-h"><b>Версия ${s.v}</b> · ${leDate(s.at)} · ${s.by === 'student' ? '🎓 сдал сам' : '✍ внесено тобой'} · ${r ? (r.verdict === 'ok' ? '<span class="pill mint">✅ принято</span>' : '<span class="pill bad">🔁 доработка</span>') + ` <span class="small muted">${leScore(r.sc)}/${leMax()}</span>` : `<span class="pill warn">ждёт проверки ${leAge(s.at)}</span>`}
      <span style="flex:1"></span>${open ? '' : `<button class="btn sm" onclick="le.rid='${s.id}';leRender()">${r ? 'Открыть' : 'Проверить'}</button>`}</div>
    ${open ? leReview(s) : ''}</div>`; }
function leReview(s){ const t = leTask(s.tid) || {}, r = s.review, d = r ? {sc: r.sc || {}, fb: r.fb} : (s.draft || {sc: {}, fb: ''}), tot = leScore(d.sc), ok = lePassOk(d.sc), done = LD.rubric.filter(c => d.sc[c.id] != null).length;
  return `<div class="le-rev">
    <div class="le-doc">${s.link ? `<p>🔗 <a href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.link)}</a></p>` : ''}${s.text ? `<div class="le-text">${esc(s.text)}</div>` : '<p class="small muted">Текста нет — только ссылка.</p>'}</div>
    <div>
      ${t.kind === 'tz' || Object.keys(d.sc).length ? `<table class="le-rub"><tbody>${LD.rubric.map(c => `<tr><td><b>${esc(c.name)}</b>${c.crit ? ' <span class="pill bad" title="0 = автоматически доработка">обяз.</span>' : ''}<div class="small muted">${esc(c.hint)}</div></td>
        <td class="num">${[0, 1, 2].map(v => `<button class="btn sm le-sc${d.sc[c.id] != null && +d.sc[c.id] === v ? ' on' : ''}" ${r ? 'disabled' : ''} onclick="leSc('${s.id}','${c.id}',${v})">${v}</button>`).join('')}</td></tr>`).join('')}</tbody></table>
        <p class="le-total"><b>${tot}/${leMax()}</b> · оценено ${done}/${LD.rubric.length} · ${ok ? '<span class="pill mint">проходит порог</span>' : `<span class="pill warn">ниже порога (${LD.pass.min}${LD.rubric.some(c => c.crit) ? ' и без 0 по обязательным' : ''})</span>`}</p>` : '<p class="small muted">Домашка — без рубрики, только фидбек.</p>'}
      <textarea class="fi le-ta" rows="5" placeholder="Фидбек ученику: что получилось, что исправить" ${r ? 'disabled' : ''} onchange="leFb('${s.id}',this)">${esc(d.fb || '')}</textarea>
      <div class="chip-row" style="margin-top:8px">
        ${r ? `<button class="btn sm" onclick="leReopen('${s.id}')">✏ Изменить оценку</button>`
          : `<button class="btn sm mint" onclick="leVerdict('${s.id}','ok')">✅ Принять</button><button class="btn sm" onclick="leVerdict('${s.id}','rework')">🔁 На доработку</button>`}
        <button class="btn sm" title="Промпт с ТЗ и рубрикой — вставь в Claude, получишь черновик проверки" onclick="leCopy(leAiPrompt(LD.subs.find(x=>x.id==='${s.id}')),this)">🤖 Промпт для AI-проверки</button>
        <button class="btn sm" onclick="leCopy(leFbText(LD.subs.find(x=>x.id==='${s.id}')),this)">📋 Фидбек</button>
        <button class="btn sm" onclick="leTg(leFbText(LD.subs.find(x=>x.id==='${s.id}')))">✈ Telegram</button>
        <button class="xbtn" onclick="leDel('subs','${s.id}','версию ${s.v}')">✕</button>
      </div>
      <p class="small muted" style="margin-top:6px">${r ? 'Оценка и фидбек видны ученику на его странице.' : 'Пока не нажал «Принять» / «На доработку», ученик оценку не видит.'}</p>
    </div></div>`; }
function leQueueView(){ const W = leWaiting();
  if(!W.length) return `<div class="card mint"><h4>📥 Очередь пустая</h4><p class="small">Всё сданное проверено. Новые сдачи со страниц учеников появятся здесь сами (обновление каждые 30 с, пока вкладка открыта).</p></div>`;
  return `<p class="small muted">Сначала самые старые. Цель — ответ ≤ 48 ч.</p>` + W.map(s => { const st = leStu(s.sid), t = leTask(s.tid) || {}, h = leAgeH(s.at);
    return `<div class="card white" style="margin-bottom:10px"><div class="le-sub-h"><b>${esc(st.name)}</b> · ${esc(t.title || '')} <span class="pill ${t.kind === 'tz' ? 'lav' : 'grey'}">${t.kind === 'tz' ? 'ТЗ' : 'ДЗ'}</span> · версия ${s.v}
      <span class="pill ${h > 48 ? 'bad' : h > 24 ? 'warn' : 'grey'}">ждёт ${leAge(s.at)}</span><span style="flex:1"></span>${le.rid === s.id ? '' : `<button class="btn sm pri" onclick="le.rid='${s.id}';leRender()">Проверить</button>`}</div>
      ${le.rid === s.id ? leReview(s) : ''}</div>`; }).join(''); }
function leProgramsView(){
  const P = LD.programs;
  return `<p class="small muted">Программа — шаблон-трек. При назначении ученику уроки копируются, дальше у каждого своя копия (правки шаблона учеников не трогают).</p>
  ${P.map(p => `<details class="le-lesson"${le.open[p.id] ? ' open' : ''} ontoggle="le.open['${p.id}']=this.open?1:0"><summary><b>${esc(p.title)}</b> <span class="small muted">· ${p.lessons.length} уроков · учеников ${LD.students.filter(s => s.pid === p.id).length}</span></summary>
    <div class="in"><div class="le-form"><label class="wide">Название${leInp('programs', p.id, 'title', p.title)}</label><label class="wide">Для кого и зачем${leTa('programs', p.id, 'desc', p.desc, '', 2)}</label><label class="wide">Источник${leInp('programs', p.id, 'src', p.src, 'где лежат материалы')}</label></div>
    <div class="tbl" style="margin-top:8px"><table><thead><tr><th>№</th><th>Урок</th><th>О чём</th><th>Результат / домашка</th><th>ТЗ</th><th>Ссылка</th><th></th></tr></thead><tbody>
    ${p.lessons.map((l, i) => `<tr><td style="width:46px"><input class="fi" value="${esc(l.n)}" onchange="lePl('${p.id}',${i},'n',this)"></td><td><input class="fi" value="${esc(l.title)}" onchange="lePl('${p.id}',${i},'title',this)"></td>
      <td><textarea class="fi le-ta" rows="2" onchange="lePl('${p.id}',${i},'goal',this)">${esc(l.goal || '')}</textarea></td><td><textarea class="fi le-ta" rows="2" onchange="lePl('${p.id}',${i},'hw',this)">${esc(l.hw || l.result || '')}</textarea></td>
      <td><input type="checkbox" ${l.tz ? 'checked' : ''} onchange="lePl('${p.id}',${i},'tz',this)"></td><td><input class="fi" value="${esc(l.link || '')}" onchange="lePl('${p.id}',${i},'link',this)"></td>
      <td><button class="xbtn" onclick="lePlDel('${p.id}',${i})">✕</button></td></tr>`).join('')}</tbody></table></div>
    <p class="chip-row" style="margin-top:8px"><button class="btn sm" onclick="lePlAdd('${p.id}')">＋ урок</button><button class="btn sm" onclick="leProgCopy('${p.id}')">⧉ Копия программы</button><span style="flex:1"></span><button class="xbtn" onclick="leDel('programs','${p.id}','программу «${leJs(p.title)}» (у учеников уроки останутся)')">✕ удалить программу</button></p></div></details>`).join('')}
  <button class="btn" onclick="leProgAdd()">＋ Новая программа</button>`; }
function lePl(pid, i, k, el){ const p = LD.programs.find(x => x.id === pid); p.lessons[i][k] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value; p.u = leNow(); leSave(); }
function lePlAdd(pid){ const p = LD.programs.find(x => x.id === pid); p.lessons.push({n: p.lessons.length + 1, title: 'Новый урок', goal: '', hw: '', tz: 0, link: ''}); p.u = leNow(); leSave(); leRender(); }
function lePlDel(pid, i){ if(!confirm('Удалить урок из программы?')) return; const p = LD.programs.find(x => x.id === pid); p.lessons.splice(i, 1); p.u = leNow(); leSave(); leRender(); }
function leProgAdd(){ const t = prompt('Название программы'); if(!t) return; const p = {id: leId('p'), title: t.trim(), desc: '', src: '', lessons: [], u: leNow()}; LD.programs.push(p); le.open[p.id] = 1; leSave(); leRender(); }
function leProgCopy(pid){ const o = LD.programs.find(x => x.id === pid), p = Object.assign(clone(o), {id: leId('p'), title: o.title + ' (копия)', u: leNow()}); LD.programs.push(p); le.open[p.id] = 1; leSave(); leRender(); }
function leRubricView(){
  return `<p class="small muted">По этой рубрике оцениваются задания с типом «ТЗ». Каждый пункт 0 / 1 / 2. «Обязательный» с нулём = доработка при любой сумме. Формула — из урока 1: промпт = техзадание.</p>
  <div class="tbl"><table><thead><tr><th>Критерий</th><th>Что проверяем</th><th>Обязательный</th><th></th></tr></thead><tbody>
  ${LD.rubric.map((c, i) => `<tr><td><input class="fi" value="${esc(c.name)}" onchange="leRb(${i},'name',this)"></td><td><input class="fi" value="${esc(c.hint)}" onchange="leRb(${i},'hint',this)"></td><td><input type="checkbox" ${c.crit ? 'checked' : ''} onchange="leRb(${i},'crit',this)"></td><td><button class="xbtn" onclick="leRbDel(${i})">✕</button></td></tr>`).join('')}
  </tbody></table></div>
  <p class="chip-row" style="margin-top:10px;align-items:center"><button class="btn sm" onclick="LD.rubric.push({id:leId('c'),name:'Новый критерий',hint:'',crit:0});LD.ru=leNow();leSave();leRender()">＋ критерий</button>
    <span class="small">Порог «принято»: <input class="fi" type="number" style="width:70px;display:inline-block;border-color:var(--line-2)" value="${esc(LD.pass.min)}" onchange="LD.pass.min=+this.value;LD.ru=leNow();leSave();leRender()"> из ${leMax()}</span>
    <button class="btn sm" onclick="if(confirm('Вернуть рубрику по умолчанию?')){LD.rubric=clone(LE_RUBRIC);LD.pass={min:12};LD.ru=leNow();leSave();leRender()}">↺ По умолчанию</button></p>`; }
function leRb(i, k, el){ LD.rubric[i][k] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value; LD.ru = leNow(); leSave(); }
function leRbDel(i){ if(!confirm('Удалить критерий? Старые оценки по нему перестанут считаться.')) return; LD.rubric.splice(i, 1); LD.ru = leNow(); leSave(); leRender(); }
function leBaView(){
  return `<div class="grid g2">
  <div class="card white"><h4>Что это за бизнес</h4><p class="small">Персональное наставничество 1:1 по ИИ для владельцев бизнеса: у каждого своя программа на примерах его бизнеса, уроки по 90 мин, после урока — готовый инструмент и домашка. Главная домашка уровня L2 — <b>ТЗ</b> на автоматизацию, которое ты проверяешь.</p></div>
  <div class="card white"><h4>Где болело</h4><p class="small">Уроки и ТЗ жили в Telegram, прогресс — в голове, фидбек писался с нуля, критериев не было → на 5–10 учеников ты становишься узким местом.</p></div>
  <div class="card mint"><h4>Цикл</h4><p class="small">Приём → программа из шаблона → встреча → задание/ТЗ → ученик сдаёт (сам по ссылке или ты из Telegram) → проверка по рубрике (+ 🤖 черновик от Claude) → ✅ принято / 🔁 доработка → урок закрыт → итог.</p></div>
  <div class="card mint"><h4>Метрики</h4><p class="small">% программы · задания в срок / на доработке · <b>время твоего ответа ≤ 48 ч</b> · встреч в месяц.</p></div>
  <div class="card white"><h4>Дальше (решить)</h4><p class="small">Оплата и пакеты · напоминания ученикам через Jay AI bot · авто-AI-проверка на сервере с черновиком фидбека · программа для Джахонгира (личный бренд + недвижимость).</p></div>
  <div class="card white"><h4>Данные</h4><p class="small">Облако — bridge, отдельное хранилище <span class="mono">learn</span>. Тексты ТЗ до 20 000 знаков, файлы — ссылками. Ученик видит только своё; ссылку можно отозвать (♻). Копия — Obsidian <span class="mono">Projects/Обучение/</span>.</p></div>
  </div><p class="small muted" style="margin-top:12px">Полный бизнес-анализ: Obsidian <span class="mono">Jay/Projects/Обучение/Бизнес-анализ платформы.md</span></p>`; }
function renderLearn(){
  const nW = leWaiting().length;
  document.getElementById('v-learn').innerHTML = `<div class="wrap">
    <div class="fin-tabs">
      ${[['students','👥 Ученики'],['queue','📥 На проверке'],['programs','📚 Программы'],['rubric','📏 Рубрика ТЗ'],['ba','📋 Бизнес-анализ']].map(([k, t]) => `<button class="btn${le.tab === k ? ' on' : ''}" onclick="le.tab='${k}';${k === 'students' ? '' : "le.sid=null;"}leRender()">${t}${k === 'queue' && nW ? ` <span class="pill warn">${nW}</span>` : ''}</button>`).join('')}
      <span style="flex:1"></span><span class="saved-flash" id="le-saved">✓ сохранено</span><span class="pill ${leSync[1]}" id="le-sync">${leSync[0]}</span>
      <button class="btn sm" onclick="learnPull()" title="Забрать новые сдачи">↻</button>
    </div>
    ${le.tab === 'queue' ? leQueueView() : le.tab === 'programs' ? leProgramsView() : le.tab === 'rubric' ? leRubricView() : le.tab === 'ba' ? leBaView() : leStudents()}
    <p class="small muted" style="margin-top:16px">${LSYNC ? `Всё сохраняется в облако и видно на всех устройствах · версия ${LD.rev || 0}${LD.synced ? ' от ' + esc(String(LD.synced).slice(0, 16).replace('T', ' ')) + ' UTC' : ''}` : 'Облако не подключено — правки живут в этом браузере.'} · копия в Obsidian 3 раза в день
      <button class="btn sm" onclick="leExport()">⬇ JSON</button></p></div>`;
}
function leRender(){ const y = window.scrollY; renderLearn(); window.scrollTo(0, y); learnBadge(); }
function leExport(){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(leOut(), null, 2)], {type: 'application/json'})); a.download = 'jos-learn-' + leToday() + '.json'; a.click(); }
function learnBadge(){ const el = document.getElementById('cnt-learn'); if(!el) return; const w = leWaiting().length, n = LD.students.filter(s => s.status === 'active').length;
  el.textContent = w ? '📥 ' + w : n + ' уч.'; el.style.cssText = w ? 'background:#fff6e6;border-color:#ffd58a;color:#b36b00' : ''; }
function learnTodayTxt(){ const W = leWaiting(), n = LD.students.filter(s => s.status === 'active').length;
  return `Учеников: <b>${n}</b>. ${W.length ? `На проверке: <b>${W.length}</b> (самая старая ждёт ${leAge(W[0].at)}).` : 'Очередь проверки пустая.'} Программы, задания, ТЗ по рубрике.`; }
