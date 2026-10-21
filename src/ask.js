/* ---------- ✋ Решения: one approvals inbox (2026-10-21) ----------
   Inlined into jos.tpl.html at the ASK marker by build_jos.py (after the dashboard).
   Any server job / agent / Claude session asks Jay a decision with Jay-Telegram-Automation/ask.py; it lands in the JOS bridge
   (Apps Script, ns 'ask', D.asksync = {url, secret} — gitignored, only inside the encrypted index) and in Jay AI bot with buttons.
   Jay answers here or in Telegram; the bridge keeps the FIRST answer (ask-answer is atomic), the bot edits its message within a minute.
   Shown: «🏠 Главная» top block (pending, with buttons) + view #ask (pending + history). Cache: localStorage jos7-ask. */
document.head.insertAdjacentHTML('beforeend', `<style>
.ask-list{display:grid;gap:10px;margin:0 0 16px}
.ask-c{background:#fff;border:1px solid #ffc4b0;border-left:4px solid var(--coral-dark);border-radius:var(--r);padding:12px 16px}
.ask-c.done{border-color:var(--line);border-left-color:var(--mint-dark);opacity:.85}
.ask-c .hd{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11.5px;color:var(--muted)}
.ask-c .hd .k{font-weight:600;color:var(--ink);background:var(--card);border:1px solid var(--line-2);border-radius:999px;padding:1px 8px}
.ask-c .t{font-size:15px;font-weight:700;margin:6px 0 4px;line-height:1.35}
.ask-c .d{font-size:13px;white-space:pre-wrap;color:var(--ink);margin:0 0 8px;max-height:7.5em;overflow:hidden}
.ask-c .d.open{max-height:none}.ask-c .more{font-size:12px;color:var(--muted);cursor:pointer;margin:-4px 0 8px;display:inline-block}
.ask-c .bt{display:flex;gap:8px;flex-wrap:wrap}.ask-c .bt button{font:600 13.5px var(--sans,inherit);padding:8px 14px;border-radius:10px;border:1px solid var(--line-2);background:#fff;cursor:pointer}
.ask-c .bt button.y{background:var(--mint,#07e7b7);border-color:var(--mint-dark);color:#053}.ask-c .bt button.n{background:#fff0eb;border-color:#ffc4b0;color:var(--coral-dark)}
.ask-c .bt button:disabled{opacity:.5;cursor:wait}.ask-c .rep{display:none;margin-top:8px}.ask-c .rep.on{display:flex;gap:8px}
.ask-c .rep textarea{flex:1;min-height:56px;font:13px inherit;padding:8px;border:1px solid var(--line-2);border-radius:8px}
.ask-c .res{font-size:13px;margin-top:4px}.ask-err{color:var(--coral-dark);font-size:12px;margin:4px 0 0}
.ask-h{width:100%;border-collapse:collapse;font-size:12.5px}.ask-h td,.ask-h th{border-bottom:1px solid var(--line);padding:7px 6px;text-align:left;vertical-align:top}
.ask-h th{font-size:11px;color:var(--muted);font-weight:600}
</style>`);
const ASYNC = D.asksync && D.asksync.url ? D.asksync : null, AKEY = 'jos7-ask';
const ASK_KINDS = {money: '💰 деньги', people: '👥 люди', family: '🏠 семья', send: '📤 отправка наружу', irreversible: '⚠️ необратимо', access: '🔑 доступы', other: '✋ решение'};
let AQ = (() => { try { return JSON.parse(localStorage.getItem(AKEY) || 'null') || {items: []}; } catch (e) { return {items: []}; } })();
let askBusy = {}, askErr = '', askOpen = {}, askRep = {};
async function askApi(body){ const r = await fetch(ASYNC.url, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(Object.assign({secret: ASYNC.secret, ns: 'ask'}, body))});
  if(!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json(); if(!d.ok) throw new Error(d.error || 'bridge'); return d; }
function askSave(){ try { localStorage.setItem(AKEY, JSON.stringify(AQ)); } catch (e) {} }
function askPending(){ return (AQ.items || []).filter(x => x.st === 'pending'); }
async function askPull(){
  if(!ASYNC) return;
  try { const d = await askApi({fin: 'get'}); AQ = {items: ((d.state || {}).items) || [], rev: d.rev, synced: new Date().toISOString()}; askErr = ''; askSave(); }
  catch (e) { askErr = 'Облако недоступно: ' + e.message; }
  askRender();
}
async function askAnswer(id, ai, txt){
  const it = (AQ.items || []).find(x => x.id === id); if(!it || askBusy[id]) return;
  if(ai == null && !String(txt || '').trim()) return;
  askBusy[id] = 1; askRender();
  try { const d = await askApi({fin: 'ask-answer', id, st: 'done', ai: ai == null ? '' : ai, ans: ai == null ? 'Ответ текстом' : (it.opts || ['Да', 'Нет'])[ai], txt: txt || '', by: 'jos'});
    Object.assign(it, d.item); if(d.already) askErr = 'Уже было решено раньше: ' + (d.item.ans || d.item.st); else askErr = ''; delete askRep[id]; askSave(); }
  catch (e) { askErr = 'Не записалось: ' + e.message + ' — попробуй ещё раз'; }
  delete askBusy[id]; askRender();
}
function askLabels(it){ const o = it.opts || ['Да', 'Нет']; return o.length === 2 && o[0] === 'Да' && o[1] === 'Нет' ? ['✅ Да', '❌ Нет'] : o; }
function askWho(by){ return ({jai: 'в Jay AI', jos: 'в JOS', caller: 'снято источником', timeout: 'истёк срок'})[by] || by || ''; }
function askOutcome(it){
  if(it.st === 'expired') return '⌛ <b>Срок истёк</b> — ответа не было';
  if(it.st === 'cancelled') return '🚫 <b>Снято</b> источником';
  const ic = it.ai === 0 ? '✅' : it.ans === 'Нет' ? '❌' : it.ai == null ? '💬' : '☑️';
  return `${ic} <b>${esc(it.ans || 'ответил')}</b> — ${askWho(it.by)}, ${hmTxt(it.aat)}${it.txt ? `<br>💬 <i>${esc(it.txt)}</i>` : ''}`;
}
function askCard(it){
  const pend = it.st === 'pending', lines = String(it.d || '').split('\n'), long = lines.length > 5 || String(it.d || '').length > 420, busy = askBusy[it.id];
  return `<div class="ask-c${pend ? '' : ' done'}" data-ask="${esc(it.id)}">
    <div class="hd"><span class="k">${ASK_KINDS[it.kind] || ASK_KINDS.other}</span>${it.from ? `<span>от ${esc(it.from)}</span>` : ''}<span>${hmTxt(it.at)}</span>${pend && it.exp ? `<span>до ${hmTxt(it.exp)}</span>` : ''}<span class="mono">${esc(it.id)}</span></div>
    <div class="t">${esc(it.t)}</div>
    ${it.d ? `<div class="d${askOpen[it.id] ? ' open' : ''}">${esc(it.d)}</div>${long ? `<span class="more" data-more="${esc(it.id)}">${askOpen[it.id] ? 'свернуть ▲' : 'показать всё ▼'}</span>` : ''}` : ''}
    ${it.file ? '<p class="small muted" style="margin:0 0 8px">📎 полный текст — файлом в Jay AI</p>' : ''}
    ${pend ? `<div class="bt">${askLabels(it).map((l, i) => `<button class="${i === 0 ? 'y' : /Нет/.test(l) ? 'n' : ''}" data-ai="${i}" ${busy ? 'disabled' : ''}>${esc(l)}</button>`).join('')}<button data-rep ${busy ? 'disabled' : ''}>💬 Ответить</button></div>
      <div class="rep${askRep[it.id] != null ? ' on' : ''}"><textarea placeholder="Твой ответ / условия…">${esc(askRep[it.id] || '')}</textarea><button class="y" data-send ${busy ? 'disabled' : ''}>Отправить</button></div>`
      : `<div class="res">${askOutcome(it)}</div>`}
  </div>`;
}
function askBind(root){
  if(!root) return;
  root.querySelectorAll('[data-ask]').forEach(c => { const id = c.dataset.ask;
    c.querySelectorAll('[data-ai]').forEach(b => b.onclick = () => askAnswer(id, +b.dataset.ai, ''));
    const rp = c.querySelector('[data-rep]'); if(rp) rp.onclick = () => { askRep[id] = askRep[id] != null ? null : ''; if(askRep[id] == null) delete askRep[id]; askRender(); const t = document.querySelector(`[data-ask="${id}"] textarea`); if(t) t.focus(); };
    const ta = c.querySelector('textarea'); if(ta) ta.oninput = () => { askRep[id] = ta.value; };
    const sd = c.querySelector('[data-send]'); if(sd) sd.onclick = () => askAnswer(id, null, (c.querySelector('textarea') || {}).value || '');
    const mo = c.querySelector('[data-more]'); if(mo) mo.onclick = () => { askOpen[id] = !askOpen[id]; askRender(); };
  });
}
/* «🏠 Главная»: pending requests with buttons, above the «Нужно от тебя» list */
function askBlock(){
  const P = askPending();
  if(!P.length) return askErr ? `<p class="ask-err">✋ ${esc(askErr)}</p>` : '';
  return `<div id="ask-dash"><div class="sect-h"><h3>✋ Ждут твоего решения</h3><span class="tag">${P.length} · ответ здесь или в Jay AI — засчитывается первый · <a ${go('ask')}>все решения →</a></span></div>
    ${askErr ? `<p class="ask-err">${esc(askErr)}</p>` : ''}<div class="ask-list">${P.map(askCard).join('')}</div></div>`;
}
function askBadge(){ const el = document.getElementById('cnt-ask'); if(!el) return; const n = askPending().length;
  el.textContent = n || ''; el.style.cssText = n ? 'background:#fff0eb;border-color:#ffc4b0;color:var(--coral-dark)' : ''; }
function renderAsk(){
  const v = document.getElementById('v-ask'); if(!v) return;
  const P = askPending(), H = (AQ.items || []).filter(x => x.st !== 'pending');
  v.innerHTML = `<div class="sect-h"><h3>Ждут ответа</h3><span class="tag">${ASYNC ? 'облако ' + (AQ.synced ? hmTxt(AQ.synced) : '—') + ' · обновляется каждые 30 с' : 'облако не подключено (нет data/jos/ask-sync.json)'}</span></div>
    ${askErr ? `<p class="ask-err">${esc(askErr)}</p>` : ''}
    <div class="ask-list">${P.length ? P.map(askCard).join('') : '<div class="card white"><p style="margin:0;color:var(--mint-dark);font-weight:600">✓ Ничего не ждёт твоего решения.</p></div>'}</div>
    <div class="sect"><div class="sect-h"><h3>Решено</h3><span class="tag">последние 14 дней · копия в Obsidian: Jay/Projects/JOS/Решения.md</span></div>
    ${H.length ? `<div style="overflow-x:auto"><table class="ask-h"><tr><th>Когда</th><th>Вопрос</th><th>Ответ</th><th>От кого</th></tr>
      ${H.map(it => `<tr><td class="mono">${hmTxt(it.aat || it.at)}</td><td><b>${esc(it.t)}</b><br><span class="small muted">${ASK_KINDS[it.kind] || ''}</span></td><td>${askOutcome(it)}</td><td>${esc(it.from || '—')}</td></tr>`).join('')}</table></div>`
      : '<p class="small muted">Пока пусто.</p>'}</div>
    <p class="small muted" style="margin-top:14px">Как это работает: любой агент на сервере или сессия Claude вызывает <span class="mono">ask.py new "вопрос"</span> → сообщение с кнопками в Jay AI + карточка здесь. Ответ в любом месте — второе место покажет «решено» (бот обновляет сообщение в течение минуты), источник получает ответ.</p>`;
  askBind(v);
}
function askRender(){
  askBadge(); renderAsk();
  const d = document.getElementById('ask-dash'), v = document.getElementById('v-today');
  if(v && v.classList.contains('on')){ const a = document.activeElement; if(a && a.tagName === 'TEXTAREA' && d && d.contains(a)) return;
    if(typeof dashRefresh === 'function') dashRefresh(); }
}
setInterval(() => { if(document.visibilityState === 'visible') askPull(); }, 30000);
window.addEventListener('focus', () => askPull());
