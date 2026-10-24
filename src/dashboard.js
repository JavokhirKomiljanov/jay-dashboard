/* ---------- 🏠 Главная: one dashboard over every tab (2026-10-20) ----------
   Inlined into jos.tpl.html at the DASH marker by build_jos.py; the template's renderToday() just calls renderDashboard().
   Server-fed tabs (sales, instagram, marketing, files, backup, agents, DM) come as D.kpi (build-time snapshot) and LIVE from
   kpi.html — a tiny page encrypted with the same salt (remember-me unlocks it) loaded in a hidden iframe; it posts its JSON
   here (same origin only) so the numbers follow the 3×/day server refresh without rebuilding index.
   Cloud tabs (📅 calendar CD, 👛 M, 🎓 LD, 💰 F) are read from their own live objects in this page. */
document.head.insertAdjacentHTML('beforeend', `<style>
.dash-top{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;margin:0 0 14px}
.dash-top .h2{margin:0}.dash-top .src{font-size:11.5px;color:var(--muted);margin-left:auto;text-align:right;line-height:1.5}
.dash-act{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:6px 16px;margin:0 0 16px}
.dash-act a{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);color:var(--ink);text-decoration:none}
.dash-act a:last-child{border-bottom:0}.dash-act a:hover .t{text-decoration:underline}
.dash-act .ic{width:24px;text-align:center;font-size:16px;flex:none}.dash-act .t{flex:1;min-width:0;font-size:13.5px}
.dash-act .t small{display:block;color:var(--muted);font-size:11.5px}.dash-act .n{font:600 12px var(--mono);padding:2px 9px;border-radius:999px;border:1px solid var(--line-2);background:var(--card);white-space:nowrap}
.dash-act .hot .n{background:#fff0eb;border-color:#ffc4b0;color:var(--coral-dark)}.dash-act .warn .n{background:#fff6e6;border-color:#ffd58a;color:#b36b00}.dash-act .go{color:var(--faint)}
.dash-act .ok{padding:10px 0;color:var(--mint-dark);font-weight:600}
.dash-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 20px}
@media(max-width:1100px){.dash-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.dash-grid{grid-template-columns:1fr}}
.tile{display:block;background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:13px 15px 12px;min-width:0;color:inherit;text-decoration:none!important;transition:border-color .15s;position:relative}
.tile:hover{border-color:var(--ink)}
.tile .hd{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--body);margin:0 0 6px}
.tile .hd .dot{width:7px;height:7px;border-radius:50%;background:var(--mint);margin-left:auto;flex:none}
.tile .hd .dot.warn{background:var(--gold)}.tile .hd .dot.bad{background:var(--coral-dark)}.tile .hd .dot.off{background:var(--faint)}
.tile .v{font-family:var(--head);font-weight:800;font-size:25px;color:var(--ink);letter-spacing:-.03em;line-height:1.05;word-break:break-word}
.tile .v small{font-size:12.5px;color:var(--muted);font-weight:600;margin-left:4px;letter-spacing:0}
.tile .v.neg{color:var(--coral-dark)}.tile .v.pos{color:var(--mint-dark)}
.tile .s{font-size:11.5px;color:var(--body);margin-top:5px;line-height:1.45}.tile .s b{font-weight:600}
.tile .at{font-size:10.5px;color:var(--faint);margin-top:6px;font-family:var(--mono)}
.tile.alert{border-color:#ffc4b0;background:#fffaf8}
.dash-cols{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:12px;margin:0 0 20px}
@media(max-width:900px){.dash-cols{grid-template-columns:1fr}}
.dash-cols .card h3{font-size:15px;font-weight:800;margin:0}
.dash-agenda .cal-ev{padding:7px 0}
.dash-strip{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}
.dash-strip .pill{cursor:pointer}
</style>`);
let KPI = D.kpi || null, KPI_LIVE = false, dashTimer = null;
const DASH_FRESH = {sales: 14, instagram: 14, marketing: 14, files: 14, backup: 30, dm: 14, agents: 24 * 8, cloud: 1};  // hours before a source counts as stale
const nz = v => v == null || v === '' || isNaN(+v) ? null : +v;
const fN = v => nz(v) == null ? '—' : Number(v).toLocaleString('ru-RU', {maximumFractionDigits: 1});
const ageH = t => { if(!t) return null; const ms = Date.parse(t); return isNaN(ms) ? null : (Date.now() - ms) / 36e5; };
const ageTxt = t => { const h = ageH(t); if(h == null) return '—'; if(h < 1) return 'только что'; if(h < 24) return Math.round(h) + ' ч назад'; return Math.round(h / 24) + ' дн назад'; };
const hmTxt = t => { if(!t) return '—'; const d = new Date(t); if(isNaN(d)) return esc(String(t).slice(0, 16)); const k = tzDay(d), td = tzDay(Date.now()); return (k === td ? '' : k.slice(5).split('-').reverse().join('.') + ' ') + tzHM(d); };
const dotCls = (t, lim) => { const h = ageH(t); return h == null ? 'off' : h <= lim ? '' : h <= lim * 2.5 ? 'warn' : 'bad'; };
const go = v => `href="#${v}" onclick="JOS.go('${v}');return false"`;

/* live KPI feed */
function kpiLoad(){
  const old = document.getElementById('kpi-frame'); if(old) old.remove();
  if(/^file:/.test(location.protocol)) return;  // a file:// snapshot can't message itself; the build-time D.kpi stays
  const f = document.createElement('iframe'); f.id = 'kpi-frame'; f.title = 'kpi'; f.setAttribute('aria-hidden', 'true');
  f.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;left:-9999px';
  f.src = panelUrl('kpi') + '?t=' + Math.floor(Date.now() / 6e5); document.body.appendChild(f);
}
window.addEventListener('message', e => { if(e.origin !== location.origin) return; const m = e.data; if(!m || m.jos !== 'kpi' || !m.kpi || !m.kpi.generated) return;
  if(!KPI || String(m.kpi.generated) >= String(KPI.generated || '')){ KPI = m.kpi; KPI_LIVE = true; dashRefresh(); } });
setInterval(() => { if(document.visibilityState === 'visible') kpiLoad(); }, 30 * 60000);

/* what needs Jay today — one list, hottest first */
function dashActions(){
  const A = [], k0 = tzDay(Date.now()), now = Date.now(), K = KPI || {};
  const add = (sev, ic, text, n, sub, tab) => A.push({sev, ic, text, n, sub, tab});   // sev: 2 hot · 1 warn · 0 info
  const W = typeof leWaiting === 'function' ? leWaiting() : [];
  if(W.length) add(leAgeH(W[0].at) > 48 ? 2 : 1, '🎓', 'Проверить сданные работы учеников', W.length, 'самая старая ждёт ' + leAge(W[0].at), 'learn');
  if(CD && CD.at){
    const late = calOpen().filter(t => t.due && t.due < k0), today = calOpen().filter(t => t.due === k0);
    if(late.length) add(2, '📅', 'Просроченные задачи Google Tasks', late.length, esc(late[0].title) + (late.length > 1 ? ' и ещё ' + (late.length - 1) : ''), 'cal');
    if(today.length) add(1, '✅', 'Задачи на сегодня', today.length, today.slice(0, 2).map(t => esc(t.title)).join(' · '), 'cal');
    const ev = calEvents().filter(e => !e.free && evOn(e, k0) && (e.allDay || Date.parse(e.end) > now)).sort((a, b) => String(a.start).localeCompare(b.start));
    if(ev.length) add(0, '🗓', 'Встречи сегодня', ev.length, ev.slice(0, 3).map(e => (e.allDay ? 'весь день' : tzHM(e.start)) + ' ' + esc(e.title)).join(' · '), 'cal');
  }
  const s = K.sales || {};
  if(nz(s.waiting_24h)) add(2, '📇', 'Лиды ждут ответа больше суток', s.waiting_24h, `всего ждут ${fN(s.waiting)} · самый старый ${s.oldest_wait_h ? Math.round(s.oldest_wait_h / 24) + ' дн' : '—'}`, 'sales');
  else if(nz(s.waiting)) add(1, '📇', 'Лиды ждут ответа', s.waiting, 'все моложе суток', 'sales');
  if(s.agent && s.agent !== 'running') add(2, '🤖', 'CRM-агент не работает', s.agent, 'сервер · Jay CRM', 'agents');
  if(s.tg && s.tg !== 'connected') add(2, '📵', 'Telegram продаж не подключён к CRM', s.tg, '', 'sales');
  if(typeof meInbox === 'function'){ const n = meInbox().length; if(n) add(1, '📥', 'Разобрать траты с телефона', n, 'без категории · «Мои финансы»', 'me'); }
  if(typeof meMonth === 'function'){ const m = meMonth(ME_YM); if(m.fixedDue && m.fixedDue.length) add(1, '🧾', 'Фиксированные платежи месяца не отмечены', m.fixedDue.length, m.fixedDue.slice(0, 3).map(f => esc(f.n || f.name || '')).filter(Boolean).join(' · '), 'me');
    if(m.debtsDue && m.debtsDue.length) add(1, '🤝', 'Мои долги со сроком в этом месяце', m.debtsDue.length, m.debtsDue.slice(0, 3).map(d => esc(d.who || d.p || '')).filter(Boolean).join(' · '), 'me'); }
  const mk = K.marketing || {};
  if(nz(mk.li_token_days) != null && mk.li_token_days <= 14) add(mk.li_token_days <= 5 ? 2 : 1, '🔑', 'LinkedIn-токен истекает', mk.li_token_days + ' дн', 'обновить до истечения — иначе публикации встанут', 'marketing');
  (mk.todo || []).forEach(t => { const [head, ...rest] = String(t).split(/:\s/); add(1, '📣', 'Маркетинг: ' + esc(head.slice(0, 80)), '', esc(rest.join(': ').slice(0, 150)) + (rest.join(': ').length > 150 ? '…' : ''), 'marketing'); });
  Object.entries(mk.tasks || {}).forEach(([n, t]) => { if(nz(t.rc)) add(2, '⚠', 'Задача на сервере упала: ' + esc(n), 'rc ' + t.rc, 'последний запуск ' + hmTxt(t.last), 'marketing'); });
  const b = K.backup || {};
  if(b.ok === false) add(2, '🛟', 'Бэкап сервера не прошёл', '', 'последний успешный ' + hmTxt(b.last_ok), 'backup');
  else if(b.at && ageH(b.last_ok || b.at) > 30) add(1, '🛟', 'Бэкап старше суток', ageTxt(b.last_ok || b.at), '', 'backup');
  if(nz(b.errors)) add(1, '🛟', 'Ошибки бэкапа', b.errors, '', 'backup');
  if(nz(b.unwired)) add(0, '🔗', 'Папки сервера без GitHub-бэкапа', b.unwired, 'подключить в «Бэкап»', 'backup');
  const d = K.dm || {}; if(nz(d.failed)) add(1, '⚡', 'DM-автоматизации: ошибки отправки', d.failed, 'режим ' + (d.mode || '—'), 'auto');
  const adv = allTasks().filter(t => !E.done[t.id] && daysTo(t.due) != null && daysTo(t.due) <= 3);
  if(adv.length) add(adv.some(t => daysTo(t.due) <= 0) ? 2 : 1, '🧑‍💼', 'Задачи советников к сроку', adv.length, adv.slice(0, 2).map(t => esc(t.text).slice(0, 60)).join(' · '), 'advisors');
  const dls = deadlines().filter(x => x.n <= 3);
  if(dls.length) add(dls.some(x => x.n <= 0) ? 2 : 1, '⏰', 'Дедлайны стратегии', dls.length, dls.slice(0, 2).map(x => esc(x.what).slice(0, 60)).join(' · '), 'strategy');
  if(AG.checked && ageH(AG.checked.replace(' ', 'T')) > 24 * 10) add(0, '🤖', 'Снимок агентов устарел', AG.checked, 'обновить data/jos/agents.json с сервера', 'agents');
  if(typeof finOpen === 'function' && F && F.rows){ const open = F.rows.filter(r => r.status === 'Not paid' || r.status === 'In progress').length; if(open) add(0, '💰', 'Открытые расходы W2W', money(finOpen()), open + ' записей Not paid / In progress', 'finance'); }
  return A.sort((a, b) => b.sev - a.sev);
}
function dashBadge(){ const el = document.getElementById('cnt-today'); if(!el) return; const A = dashActions(), asks = typeof askPending === 'function' ? askPending().length : 0, hot = A.filter(a => a.sev === 2).length + asks, n = A.filter(a => a.sev > 0).length + asks;
  el.textContent = n || ''; el.style.cssText = hot ? 'background:#fff0eb;border-color:#ffc4b0;color:var(--coral-dark)' : n ? 'background:#fff6e6;border-color:#ffd58a;color:#b36b00' : ''; }

/* tiles */
function tile(tab, ic, name, at, lim, v, vcls, lines, alert){
  return `<a class="tile${alert ? ' alert' : ''}" ${go(tab)}><div class="hd"><span>${ic}</span>${esc(name)}<span class="dot ${dotCls(at, lim)}" title="${at ? 'данные ' + ageTxt(at) : 'нет данных'}"></span></div>
    <div class="v${vcls ? ' ' + vcls : ''}">${v}</div>${lines.filter(Boolean).map(l => `<div class="s">${l}</div>`).join('')}<div class="at">${at ? hmTxt(at) : 'нет данных'}</div></a>`;
}
function dashTiles(){
  const K = KPI || {}, k0 = tzDay(Date.now()), now = Date.now();
  const s = K.sales || {}, i = K.instagram || {}, mk = K.marketing || {}, f = K.files || {}, b = K.backup || {}, d = K.dm, ag = K.agents || {};
  const W = typeof leWaiting === 'function' ? leWaiting() : [], stu = typeof LD !== 'undefined' ? LD.students.filter(x => x.status === 'active') : [];
  const nxt = stu.map(x => { const l = (x.lessons || []).find(l => l.status === 'now') || (x.lessons || []).find(l => l.status === 'todo'); return l ? `${esc(x.name.split(' ')[0])}: ${esc(l.n + '. ' + l.title).slice(0, 38)}` : ''; }).filter(Boolean);
  const ev = CD && CD.at ? calEvents().filter(e => !e.free && evOn(e, k0)) : null, evLeft = ev ? ev.filter(e => e.allDay || Date.parse(e.end) > now) : [];
  const late = CD && CD.at ? calOpen().filter(t => t.due && t.due < k0).length : 0, tdy = CD && CD.at ? calOpen().filter(t => t.due === k0).length : 0;
  const m = typeof meMonth === 'function' ? meMonth(ME_YM) : null, cards = typeof M !== 'undefined' ? Object.values(M.cards || {}) : [];
  const finRows = F && F.rows ? F.rows.filter(r => r.status === 'Not paid' || r.status === 'In progress').length : 0;
  const three = (S.summary.three_numbers_end_2027_base || [])[0], gate = (S.targets.gates || []).map(g => ({...g, n: daysTo(g.date)})).filter(g => g.n != null && g.n >= 0).sort((a, b) => a.n - b.n)[0];
  const st = ag.states || {}, agRun = st.running != null ? st.running : AG.agents.filter(a => a.state === 'running').length, agAll = ag.total || AG.agents.length;
  return `<div class="dash-grid">
    ${tile('sales', '📇', 'Продажи · CRM', s.at, DASH_FRESH.sales, `${fN(s.active)}<small>лидов</small>`, '', [`ждут ответа <b>${fN(s.waiting)}</b>${nz(s.waiting_24h) ? ` · >24 ч <b style="color:var(--coral-dark)">${fN(s.waiting_24h)}</b>` : ''}`, `медиана ответа <b>${fN(s.median_resp_h)} ч</b> · новых за 7 дн <b>${fN(s.new_7d)}</b> · 🔥 ${fN(s.hot)}`], nz(s.waiting_24h) > 0 || (s.agent && s.agent !== 'running'))}
    ${tile('instagram', '📷', 'Instagram', i.at, DASH_FRESH.instagram, `${fN(i.followers)}<small>подписчиков</small>`, '', [`<b style="color:var(--mint-dark)">${nz(i.delta) >= 0 ? '+' : ''}${fN(i.delta)}</b> с ${i.since ? dateRu(i.since) : '—'} · постов за 7 дн <b>${fN(i.posts_7d)}</b>`, `reels ср. <b>${fN(i.reel_avg)}</b> просм. (${fN(i.reels_30d)} за 30 дн) · карусели ср. ${fN(i.car_avg)}`])}
    ${tile('marketing', '📣', 'Маркетинг', mk.at, DASH_FRESH.marketing, `${fN(mk.tg_members)}<small>в TG-канале</small>`, '', [`LinkedIn <b>${fN(mk.li_posts_30d)}</b> постов/30 дн · токен <b>${fN(mk.li_token_days)} дн</b>`, (mk.broken || []).length ? `не подключено: <b style="color:#b36b00">${mk.broken.map(esc).join(', ')}</b>` : 'все каналы подключены', (mk.todo || []).length ? `задач: <b>${mk.todo.length}</b>` : ''], nz(mk.li_token_days) != null && mk.li_token_days <= 7)}
    ${tile('learn', '🎓', 'Обучение', typeof LD !== 'undefined' ? LD.synced : null, DASH_FRESH.cloud, `${stu.length}<small>${stu.length === 1 ? 'ученик' : stu.length < 5 ? 'ученика' : 'учеников'}</small>`, '', [W.length ? `<b style="color:var(--coral-dark)">на проверке ${W.length}</b> · самая старая ${leAge(W[0].at)}` : 'очередь проверки пустая', nxt.slice(0, 2).join('<br>')], W.length > 0)}
    ${tile('cal', '📅', 'Календарь', CD && CD.at, DASH_FRESH.cloud, ev ? `${evLeft.length}<small>встреч${ev.length !== evLeft.length ? ' осталось' : ' сегодня'}</small>` : '—', '', [ev ? `задач на сегодня <b>${tdy}</b>${late ? ` · <b style="color:var(--coral-dark)">просрочено ${late}</b>` : ''}` : 'календарь ещё не загружен', evLeft[0] ? `дальше: <b>${evLeft[0].allDay ? 'весь день' : tzHM(evLeft[0].start)}</b> ${esc(evLeft[0].title).slice(0, 40)}` : ev ? 'встреч больше нет' : ''], late > 0)}
    ${tile('me', '👛', 'Мои финансы', typeof M !== 'undefined' ? M.synced : null, DASH_FRESH.cloud, m ? (MU.hide ? '•••' : `${meFmt(m.exp)}`) : '—', '', [m ? `${ymRu(ME_YM)}: ⚡ неожиданные <b>${MU.hide ? '•••' : meFmt(m.unexp)}</b> · доход ${MU.hide ? '•••' : meFmt(m.income)}` : '', cards.length ? `на картах <b>${MU.hide ? '•••' : meFmt(meSum(cards, c => meV(c.bal, c.c || 'UZS')))}</b>` : '', typeof meInbox === 'function' && meInbox().length ? `📥 с телефона: <b>${meInbox().length}</b>` : ''])}
    ${tile('finance', '💰', 'Финансы W2W', F && F.synced, DASH_FRESH.cloud, F && F.rows ? money(finOpen()) : '—', finRows ? 'neg' : '', [`открыто <b>${finRows}</b> записей (Not paid + In progress)`, F && F.rows ? `всего записей ${F.rows.length}` : ''])}
    ${tile('agents', '🤖', 'Агенты на сервере', ag.checked || (AG.checked || '').replace(' ', 'T'), DASH_FRESH.agents, `${fN(agRun)}<small>из ${agAll} работают</small>`, 'pos', [Object.entries(st).filter(([k]) => k !== 'running').map(([k, n]) => `${esc(k)} <b>${n}</b>`).join(' · ') || `по расписанию ${AG.agents.filter(a => a.state === 'ready').length}`, `сервер ${esc(L.server)}`])}
    ${tile('auto', '⚡', 'DM-автоматизации', d && d.at, DASH_FRESH.dm, d ? `${fN(d.sent7)}<small>DM за 7 дн</small>` : '—', '', [d ? `режим <b>${esc(d.mode || '—')}</b> · активных <b>${fN(d.active)}</b>/${fN(d.autos)} · всего DM ${fN(d.sent)}` : 'нет данных из облака', d && nz(d.failed) ? `<b style="color:var(--coral-dark)">ошибок ${fN(d.failed)}</b>` : d ? `комментариев за 7 дн ${fN(d.seen7)}` : ''], d && nz(d.failed) > 0)}
    ${tile('files', '🗂', 'Файлы', f.at, DASH_FRESH.files, `${fN(f.new_7d)}<small>новых за 7 дн</small>`, '', [`за сутки <b>${fN(f.new_1d)}</b> · проектов активно <b>${fN(f.projects_7d)}</b>`, f.last ? `последний: ${esc(f.last.name || '').slice(0, 34)} <span class="muted">(${esc(f.last.project || f.last.machine || '')})</span>` : ''])}
    ${tile('backup', '🛟', 'Бэкап', b.at, DASH_FRESH.backup, b.ok == null ? '—' : b.ok ? '✅ ok' : '❌ fail', b.ok === false ? 'neg' : '', [`успешный <b>${hmTxt(b.last_ok)}</b> · ${fN(b.seconds)} с${nz(b.errors) ? ` · <b style="color:var(--coral-dark)">ошибок ${b.errors}</b>` : ''}`, `vault ${esc(b.vault || '—')} · ${fN(b.enc_mb)} МБ · репо ${fN(b.repos)}${nz(b.unwired) ? ` · без бэкапа <b>${b.unwired}</b>` : ''}`], b.ok === false)}
    ${tile('strategy', '🧭', 'Стратегия', S.meta.generated, 24 * 60, three ? `${fmt(three.value)}<small>млн сум</small>` : '—', three && three.value < 0 ? 'neg' : 'hl', [three ? `${esc(three.name)} · база, модель` : '', gate ? `ворота: <b>${esc(gate.kind)}</b> через ${gate.n} дн (${dateRu(gate.date)})` : 'ближайших ворот нет'])}
  </div>`;
}

function renderDashboard(){
  const A = dashActions(), k0 = tzDay(Date.now()), now = Date.now();
  const dls = deadlines().slice(0, 8), tasks = allTasks().filter(t => !E.done[t.id]).sort((a, b) => (daysTo(a.due) ?? 99) - (daysTo(b.due) ?? 99)).slice(0, 7);
  const ev = CD && CD.at ? calEvents().filter(e => !e.free && evOn(e, k0)).sort((a, b) => String(a.start).localeCompare(b.start)) : [];
  const dt = CD && CD.at ? calOpen().filter(t => t.due === k0) : [], lateN = CD && CD.at ? calOpen().filter(t => t.due && t.due < k0).length : 0;
  const cadence = S.org.cadence || [], wd = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'], dow = (TODAY.getDay() + 6) % 7;
  const week = wd.map((n, i) => ({n, i, ev: []})), put = (i, txt, cls = '') => week[i].ev.push({txt, cls});
  cadence.forEach(c => { const w = c.when.toLowerCase(); const txt = c.what.split(/[:;]/)[0].slice(0, 70); if(w.startsWith('понедельник')) put(0, txt, 'mint'); else if(w.startsWith('среда')) put(2, txt, 'mint'); });
  put(1, '17:30 LinkedIn (агент)'); put(2, '17:30 LinkedIn (агент)'); put(3, '17:30 LinkedIn (агент)'); for(let i = 0; i < 7; i++) put(i, '19:00 IG-карусель (агент)');
  dls.filter(x => x.n >= 0 && x.n < 7).forEach(x => { const d = new Date(TODAY); d.setDate(d.getDate() + x.n); put((d.getDay() + 6) % 7, '⏰ ' + x.what.slice(0, 60), ''); });
  const K = KPI || {}, srcAt = K.generated ? `сервер ${hmTxt(K.generated)}${KPI_LIVE ? '' : ' (снимок сборки)'}` : 'сервер: нет данных';
  document.getElementById('v-today').innerHTML = `
  <div class="dash-top"><div><div class="eyebrow">${TODAY.toLocaleDateString('ru-RU', {weekday: 'long', day: 'numeric', month: 'long'})}</div>
    <h2 class="h2">Фокус: ${E_('today.focus', '<span class="hl">W2W</span> — агенты, Company Brain, сбор денег')}</h2></div>
    <div class="src">${srcAt}<br>облако: календарь ${CD && CD.at ? hmTxt(CD.at) : '—'} · обучение ${typeof LD !== 'undefined' && LD.synced ? hmTxt(LD.synced) : '—'} · финансы ${typeof M !== 'undefined' && M.synced ? hmTxt(M.synced) : '—'}</div></div>

  ${typeof askBlock === 'function' ? askBlock() : ''}
  ${(L.meeting_files || []).length ? `<div class="sect-h"><h3>📎 Файлы к встрече</h3><span class="tag">открываются с любого устройства</span></div><div class="chip-row" style="margin:0 0 16px">${L.meeting_files.map(f => `<a class="btn" href="${esc(f.u)}" target="_blank">${f.ic} ${esc(f.t)} ↗</a>`).join('')}</div>` : ''}
  <div class="sect-h"><h3>Нужно от тебя</h3><span class="tag">${A.filter(a => a.sev > 0).length ? A.filter(a => a.sev === 2).length + ' срочных · ' + A.filter(a => a.sev === 1).length + ' в работу' : 'ничего не горит'}</span></div>
  <div class="dash-act">${A.length ? A.map(a => `<a class="${a.sev === 2 ? 'hot' : a.sev === 1 ? 'warn' : ''}" ${go(a.tab)}><span class="ic">${a.ic}</span><span class="t">${a.text}${a.sub ? `<small>${a.sub}</small>` : ''}</span>${a.n !== '' && a.n != null ? `<span class="n">${a.n}</span>` : ''}<span class="go">→</span></a>`).join('') : '<div class="ok">✓ Всё чисто — очередей нет, просрочек нет.</div>'}</div>

  <div class="sect-h"><h3>Отделы</h3><span class="tag">точка = свежесть данных · клик открывает вкладку</span></div>
  ${dashTiles()}

  <div class="dash-cols">
    <div class="card white dash-agenda"><div class="sect-h"><h3>Сегодня в календаре</h3><span class="tag">${CD && CD.at ? 'данные ' + hmTxt(CD.at) : 'ещё не загружено'}</span></div>
      ${ev.length || dt.length ? ev.map(e => calEvRow(e, now)).join('') + dt.map(t => calTaskRow(t, k0)).join('') : `<p class="small muted" style="margin:6px 0">${CD && CD.at ? 'Встреч и задач на сегодня нет.' : 'Календарь загружается…'}</p>`}
      <p class="small muted" style="margin:10px 0 0">${lateN ? `<a ${go('cal')} style="color:var(--coral-dark);font-weight:600">просрочено ${lateN} задач →</a> · ` : ''}<a ${go('cal')}>вся неделя и задачи →</a> · <a href="${esc(MEET_URL)}" target="_blank">ссылка /meet ↗</a></p></div>
    <div class="card white"><div class="sect-h"><h3>Задачи от советников</h3><span class="tag">${allTasks().filter(t => !E.done[t.id]).length} открытых</span></div>
      ${tasks.length ? tasks.map(taskRow).join('') : '<p class="small muted">Открытых задач нет.</p>'}
      <p class="small muted" style="margin-top:10px"><a ${go('advisors')}>все задачи и отчёты советников →</a></p></div>
  </div>

  <div class="sect"><div class="sect-h"><h3>Ближайшие дедлайны</h3><span class="tag">из решений и ворот стратегии</span></div>
    <div class="dl">${dls.length ? dls.map(x => `<div class="d ${x.n <= 3 ? 'hot' : ''} ${x.n < 0 ? 'past' : ''}"><div class="when">${dateRu(x.date)} · ${esc(x.src)}</div><div class="days">${x.n < 0 ? 'просрочено' : x.n === 0 ? 'сегодня' : x.n + ' дн'}</div><div class="what">${esc(brief(x.what).t)}</div><div class="lt-s">${srcChips(x.ref)}</div></div>`).join('') : '<p class="small muted">Дедлайнов в ближайшее время нет.</p>'}</div></div>

  <div class="sect"><div class="sect-h"><h3>Ритм недели</h3><span class="tag">org.cadence · 20 ч/нед, 10 из них продажи</span></div>
    <div class="week">${week.map(w => `<div class="day ${w.i === dow ? 'today' : ''}"><h5>${w.n}</h5>${w.ev.map(e => `<div class="ev ${e.cls}">${esc(e.txt)}</div>`).join('')}</div>`).join('')}</div></div>

  <div class="grid g4 sect">
    <a class="card white" href="${esc(L.strategy_page)}" target="_blank"><h4>📄 Полная стратегия ↗</h4><p class="small">12 разделов, 3 сценария, допущения, действия 30/60/90</p></a>
    <a class="card white" href="${esc(L.w2w_map)}" target="_blank"><h4>🗺 Карта компании ↗</h4><p class="small">Оргсхема, роли, доли, KPI, партнёрская программа</p></a>
    <a class="card white" ${go('brain')}><h4>🧠 Company Brain →</h4><p class="small">${BR.totals.clients} клиентов · демо-вопросы · что продаём</p></a>
    <a class="card white" href="${esc(L.archive_page)}" target="_blank"><h4>🗄 Архив ↗</h4><p class="small">Home Alliance, Venture Studios, Apollo/US, отчёты, ROI</p></a>
  </div>`;
  if(typeof askBind === 'function') askBind(document.getElementById('ask-dash'));
  bindTasks(); document.querySelectorAll('#v-today [data-done]').forEach(cb => cb.addEventListener('change', dashBadge));
  dashBadge(); JOS.applyEdit();
}
function dashRefresh(){ dashBadge(); const v = document.getElementById('v-today'); if(!v || !v.classList.contains('on')) return;
  const a = document.activeElement; if(a && v.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName) || (a && a.isContentEditable)) return;
  const y = window.scrollY; renderDashboard(); window.scrollTo(0, y); }
/* re-render when the cloud tabs' data arrive (their badge functions run after every pull/edit) */
['calBadge', 'meBadge', 'learnBadge'].forEach(n => { const orig = window[n]; if(typeof orig !== 'function') return;
  window[n] = function(){ const r = orig.apply(this, arguments); clearTimeout(dashTimer); dashTimer = setTimeout(dashRefresh, 150); return r; }; });
setInterval(() => { if(document.visibilityState === 'visible') dashRefresh(); }, 60000);
