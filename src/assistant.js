/* ---------- 🤖 Ассистент: Claude Code on the server, inside Jay OS (2026-11-03) ----------
   Inlined into jos.tpl.html at the ASSIST marker by build_jos.py (after ask.js).
   Backend: Jay-Telegram-Automation/jos_assistant.py = the Jay AI bot's engine, polling the JOS cloud bridge.
   Transport: bridge ns 'ui' (D.finsync, the same store as the hidden-tabs map), key `chat`:
     in[]  requests this page wrote (server takes them)   cmd[] stop/model/reset   out[] transcript tail   st{} heartbeat.
   The page polls: 3 s while a request is pending or the agent works, 15 s idle on the tab, 90 s otherwise (unread badge).
   Nothing new is exposed on the server; files from the agent arrive in Jay AI (Telegram), the chat shows a note. */
document.head.insertAdjacentHTML('beforeend', `<style>
#v-assist .as-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px}
#v-assist .as-st{font-size:12px;color:var(--muted);display:flex;gap:6px;align-items:center;flex-wrap:wrap;min-width:0}
#v-assist .as-st i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--faint);flex:none}
#v-assist .as-st i.on{background:var(--mint)}#v-assist .as-st i.work{background:var(--gold);animation:as-blink 1s infinite}
@keyframes as-blink{50%{opacity:.3}}
#v-assist .as-models{display:inline-flex;border:1px solid var(--line-2);border-radius:10px;overflow:hidden}
#v-assist .as-models button{border:0;background:var(--surface,#fff);color:var(--body);padding:5px 10px;font:600 12px var(--text);cursor:pointer}
#v-assist .as-models button+button{border-left:1px solid var(--line-2)}
#v-assist .as-models button.on{background:var(--ink);color:var(--bg)}
#v-assist .as-log{display:flex;flex-direction:column;gap:10px;min-height:40vh;padding:0 0 12px}
#v-assist .as-m{max-width:min(760px,92%);min-width:min(220px,70%);border-radius:16px;padding:10px 14px;font-size:14px;line-height:1.5;overflow-wrap:break-word;word-break:break-word;position:relative}
#v-assist .as-m.jay{align-self:flex-end;background:var(--mint-tint);border:1px solid var(--mint-light);color:var(--ink);white-space:pre-wrap}
#v-assist .as-m.jay.wait{opacity:.6}
#v-assist .as-m.bot{align-self:flex-start;background:var(--card);border:1px solid var(--line);color:var(--ink)}
#v-assist .as-m.note{align-self:center;background:transparent;border:0;color:var(--muted);font-size:12px;padding:2px 8px;text-align:center}
#v-assist .as-m .ts{display:block;font:500 10.5px var(--mono);color:var(--muted);margin-top:6px}
#v-assist .as-m p{margin:0 0 8px}#v-assist .as-m p:last-child{margin:0}
#v-assist .as-m pre{background:var(--surface,#fff);border:1px solid var(--line);border-radius:10px;padding:10px 12px;overflow:auto;font:12px/1.45 var(--mono);margin:6px 0}
#v-assist .as-m code{font:12.5px var(--mono);background:var(--surface,#fff);border:1px solid var(--line);border-radius:5px;padding:0 4px}
#v-assist .as-m pre code{border:0;padding:0;background:transparent}
#v-assist .as-m ul,#v-assist .as-m ol{margin:4px 0 8px 18px;padding:0}#v-assist .as-m li{margin:2px 0}
#v-assist .as-m h3{font-size:14.5px;margin:8px 0 4px}
#v-assist .as-m a{color:var(--blue);text-decoration:underline}
#v-assist .as-files{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
#v-assist .as-files span{display:inline-flex;gap:6px;align-items:center;font-size:12.5px;font-weight:600;border:1px solid var(--line-2);border-radius:10px;padding:6px 10px;background:var(--surface,#fff);color:var(--ink)}
#v-assist .as-files span.err{color:var(--coral-dark)}
#v-assist .as-job{align-self:flex-start;font-size:12px;color:var(--muted);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#v-assist .as-job button{border:1px solid var(--line-2);background:var(--surface,#fff);color:var(--coral-dark);border-radius:8px;padding:3px 9px;font:600 11.5px var(--text);cursor:pointer}
#v-assist .as-in{position:sticky;bottom:0;display:flex;gap:8px;align-items:flex-end;padding:10px 0 12px;background:linear-gradient(180deg,transparent,var(--bg) 30%)}
#v-assist .as-in textarea{flex:1;min-height:46px;max-height:40vh;resize:vertical;border:1px solid var(--line-2);border-radius:14px;padding:11px 14px;font:14.5px/1.4 var(--text);color:var(--ink);background:var(--surface,#fff);outline:none}
#v-assist .as-in textarea:focus{border-color:var(--mint-dark)}
#v-assist .as-in button{height:46px;min-width:54px;border:0;border-radius:14px;background:var(--mint);color:#131313;font:700 15px var(--text);cursor:pointer}
#v-assist .as-in button:disabled{opacity:.5;cursor:default}
#v-assist .as-err{font-size:12.5px;color:var(--coral-dark);margin:0 0 8px}
#v-assist .as-empty{color:var(--muted);font-size:13.5px;padding:24px 0;text-align:center}
@media(max-width:700px){#v-assist .as-m{max-width:94%;font-size:14.5px}
  body.has-mbar #v-assist .as-in{bottom:calc(84px + env(safe-area-inset-bottom,0px))}
  #v-assist .as-top .btn{padding:5px 9px;font-size:12px}}
html[data-theme=dark] #v-assist .as-m.jay{background:#0f2a24;border-color:#1f8f73}
</style>`);
const ASB = D.finsync && D.finsync.url ? D.finsync : null, ASKEY = 'jos7-assist', AS_KEEP = 150, AS_ONLINE = 90;
let AS = (() => { try { return Object.assign({items: [], unread: 0}, JSON.parse(localStorage.getItem(ASKEY) || '{}')); } catch (e) { return {items: [], unread: 0}; } })();
AS.items = (AS.items || []).slice(-AS_KEEP);
let asSt = {}, asErr = '', asBusy = false, asSending = false, asPending = [], asLoop = 0, asLast = 0, asRev = null;
function asSave(){ try { localStorage.setItem(ASKEY, JSON.stringify({items: AS.items.slice(-AS_KEEP), unread: AS.unread})); } catch (e) {} }
function asOpen(){ const v = document.getElementById('v-assist'); return !!v && v.classList.contains('on'); }
function asOnline(){ return !!asSt.at && (Date.now() / 1000 - asSt.at) < AS_ONLINE; }
async function asBridge(body){
  if(!ASB) throw new Error('мост JOS не настроен в этой сборке');
  const r = await fetch(ASB.url, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(Object.assign({secret: ASB.secret, ns: 'ui'}, body))});
  if(!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json(); if(!d.ok && d.error !== 'conflict') throw new Error(d.error || 'bridge'); return d;
}
function asMerge(chat){
  const out = chat.out || [], known = new Set(AS.items.map(x => x.id)); let fresh = 0;
  for(const it of out){ if(!known.has(it.id)){ AS.items.push(it); known.add(it.id); if(it.role === 'bot' && (!asOpen() || document.visibilityState !== 'visible')) AS.unread++; fresh++; } }
  AS.items = AS.items.filter(x => !x.local || !out.some(o => o.id === x.id)).sort((a, b) => a.t - b.t).slice(-AS_KEEP);
  const inIds = new Set((chat.in || []).map(x => x.id)); asPending = AS.items.filter(x => x.local && inIds.has(x.id)).map(x => x.id);
  AS.items.forEach(x => { if(x.local && !inIds.has(x.id) && out.some(o => o.id === x.id)) delete x.local; });
  asSt = chat.st || asSt; asBusy = !!(asSt.busy || asPending.length);
  if(fresh) asSave(); asBadge(); if(asOpen()) asRender();
}
async function asPull(){
  try { const d = await asBridge({fin: 'get'}); asRev = d.rev; asErr = ''; asMerge((d.state || {}).chat || {}); asLast = Date.now(); return true; }
  catch (e) { asErr = 'Облако недоступно: ' + e.message; if(asOpen()) asRender(); return false; }
}
async function asWrite(mutate){
  for(let i = 0; i < 4; i++){
    const d = await asBridge({fin: 'get'}); const st = d.state || {}; const chat = st.chat = st.chat || {}; ['in', 'cmd', 'out'].forEach(k => chat[k] = chat[k] || []);
    mutate(chat); const r = await asBridge({fin: 'put', rev: d.rev, state: st});
    if(r.ok){ asMerge(chat); return r; } if(r.error !== 'conflict') throw new Error(r.error || 'put'); await new Promise(x => setTimeout(x, 600 + Math.random() * 600));
  }
  throw new Error('облако занято, попробуй ещё раз');
}
async function asLoopRun(){
  const my = ++asLoop;
  while(my === asLoop){
    const open = asOpen(), vis = document.visibilityState === 'visible';
    const every = !vis ? 120000 : open ? ((asBusy || asPending.length) ? 3000 : 15000) : 90000;
    if(Date.now() - asLast >= every - 200) await asPull();
    await new Promise(r => setTimeout(r, 1000));
  }
}
function asBadge(){ const el = document.getElementById('cnt-assist'); if(!el) return; el.textContent = asBusy ? '⏳' : (AS.unread ? String(AS.unread) : ''); }
function assistOpen(){ AS.unread = 0; asSave(); asBadge(); asRender(); asPull().then(() => { asRender(); asScroll(); }); asLoopRun(); }
async function asSend(){
  const ta = document.getElementById('as-text'); const text = (ta.value || '').trim().slice(0, 4000); if(!text || asSending) return;
  ta.value = '';   // clear BEFORE the re-render (asRender re-creates the textarea and keeps its current value as the draft)
  const it = {id: Math.random().toString(36).slice(2, 12), t: Date.now() / 1000, text, role: 'jay', local: true};
  asSending = true; asErr = ''; AS.items.push(it); asPending.push(it.id); asRender(); asScroll();   // optimistic: show at once, the bridge write takes ~4 s
  try { await asWrite(chat => { chat.in.push({id: it.id, t: it.t, text}); }); asSave(); }
  catch (e) { asErr = 'Не отправилось: ' + e.message; AS.items = AS.items.filter(x => x !== it); asPending = asPending.filter(x => x !== it.id); const t2 = document.getElementById('as-text'); if(t2) t2.value = text; }
  asSending = false; asBusy = true; asRender(); asScroll(); asLast = 0; if(!matchMedia('(max-width:700px)').matches){ const t = document.getElementById('as-text'); if(t) t.focus(); }
}
async function asCmd(op, extra){ try { await asWrite(chat => { chat.cmd.push(Object.assign({id: Math.random().toString(36).slice(2, 12), t: Date.now() / 1000, op}, extra || {})); }); asLast = 0; } catch (e) { asErr = e.message; asRender(); } }
function asStop(n){ asCmd('stop', n ? {n} : {}); }
function asSetModel(t){ asSt = Object.assign({}, asSt, {model: t}); asRender(); asCmd('model', {tier: t}); }
function asReset(){ if(confirm('Начать новый диалог? Контекст текущего разговора сбросится.')) asCmd('reset'); }
function asMd(src){
  /* tiny safe Markdown: escape first, then fences, inline code, bold/italic, links, headings, lists, paragraphs */
  const e = esc(String(src || '')); const blocks = []; let s = e.replace(/```(\w*)\n([\s\S]*?)```/g, (m, l, c) => { blocks.push('<pre><code>' + c.replace(/\n$/, '') + '</code></pre>'); return '\u0000' + (blocks.length - 1) + '\u0000'; });
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
       .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
       .replace(/(^|[\s(])((?:https?:\/\/)[^\s<)]+)/g, (m, p, u) => p + '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>');
  const out = [];
  for(const para of s.split(/\n{2,}/)){ let html = '', list = null;
    for(const ln of para.split('\n')){ const h = ln.match(/^(#{1,3})\s+(.*)$/), li = ln.match(/^\s*[-*•]\s+(.*)$/), ol = ln.match(/^\s*\d+[.)]\s+(.*)$/);
      if(h){ if(list){ html += '</' + list + '>'; list = null; } html += '<h3>' + h[2] + '</h3>'; }
      else if(li || ol){ const tag = li ? 'ul' : 'ol'; if(list !== tag){ if(list) html += '</' + list + '>'; html += '<' + tag + '>'; list = tag; } html += '<li>' + (li || ol)[1] + '</li>'; }
      else { if(list){ html += '</' + list + '>'; list = null; } html += (html && !/>$/.test(html) ? '<br>' : '') + ln; } }
    if(list) html += '</' + list + '>'; out.push(/^<(h3|ul|ol)/.test(html) || /^\u0000\d+\u0000$/.test(html) ? html : '<p>' + html + '</p>'); }
  return out.join('').replace(/\u0000(\d+)\u0000/g, (m, i) => blocks[+i]);
}
function asTime(t){ const d = new Date(t * 1000); return d.toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit'}) + ' ' + d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}); }
function asFiles(fs){ if(!fs || !fs.length) return ''; return '<div class="as-files">' + fs.map(f => f.error ? `<span class="err">📎 ${esc(f.name)} · ${esc(f.error)}</span>` : `<span>📎 ${esc(f.name)} · ${f.tg ? 'отправлен в Jay AI (Telegram)' : 'не удалось отправить в Telegram'}</span>`).join('') + '</div>'; }
function asRender(){
  const v = document.getElementById('v-assist'); if(!v) return;
  const jobs = asSt.jobs || [], queue = asSt.queue || [], models = asSt.models || {};
  const st = !ASB ? '<i></i>мост не настроен' : !asOnline() ? `<i></i>${asErr ? esc(asErr) : (asSt.at ? 'сервер не отвечает ' + Math.round((Date.now() / 1000 - asSt.at) / 60) + ' мин' : 'подключаюсь…')}` :
    (asSt.busy || asPending.length) ? `<i class="work"></i>работает${jobs.map(j => ` #${j.n} · ${j.mins} мин${j.tool ? ' · <code>' + esc(j.tool) + '</code>' : ''}`).join(',') || (asPending.length ? ' · сервер забирает запрос' : '')}` : '<i class="on"></i>онлайн · сервер';
  const mdl = Object.keys(models).length ? `<div class="as-models">${Object.entries(models).map(([k, n]) => `<button type="button" data-tier="${k}" class="${k === asSt.model ? 'on' : ''}" title="${esc(n)}">${k}</button>`).join('')}</div>` : '';
  const log = AS.items.length ? AS.items.map(it => it.role === 'note' ? `<div class="as-m note">${asMd(it.text)}</div>` :
      `<div class="as-m ${it.role}${it.local ? ' wait' : ''}">${it.role === 'jay' ? esc(it.text) : asMd(it.text)}${asFiles(it.files)}<span class="ts">${asTime(it.t)}${it.local ? ' · отправляется' : ''}</span></div>`).join('')
    : '<div class="as-empty">Тот же ассистент, что в Jay AI боте: Claude Code на сервере — задачи, код, файлы, видео, твои проекты и vault.<br>Напиши, что сделать.</div>';
  const jl = jobs.map(j => `<div class="as-job">⏳ #${j.n} · ${j.mins} мин · ${esc(j.text)}${j.tool ? ' · <code>' + esc(j.tool) + '</code>' : ''} <button type="button" data-stop="${j.n}">🛑 стоп</button></div>`).join('')
    + queue.map(j => `<div class="as-job">🕓 #${j.n} ждёт место · ${esc(j.text)}</div>`).join('');
  const draft = (document.getElementById('as-text') || {}).value || '';
  v.innerHTML = `<div class="as-top"><div class="as-st">${st}</div><span style="flex:1"></span>${mdl}
      <button class="btn sm" type="button" id="as-reset" title="новый диалог">🔄</button>${asSt.busy ? '<button class="btn sm" type="button" id="as-stopall">🛑 стоп</button>' : ''}</div>
    ${asErr && asOnline() ? `<div class="as-err">${esc(asErr)}</div>` : ''}
    <div class="as-log" id="as-log">${log}${jl}</div>
    <div class="as-in"><textarea id="as-text" rows="1" placeholder="Напиши задачу или вопрос… (Ctrl+Enter — отправить)"></textarea><button type="button" id="as-send" ${asSending ? 'disabled' : ''}>➤</button></div>`;
  const ta = v.querySelector('#as-text'); ta.value = draft; v.querySelector('#as-send').onclick = asSend;
  ta.onkeydown = e => { if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){ e.preventDefault(); asSend(); } };
  ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, innerHeight * .4) + 'px'; };
  v.querySelector('#as-reset').onclick = asReset; const sa = v.querySelector('#as-stopall'); if(sa) sa.onclick = () => asStop();
  v.querySelectorAll('[data-stop]').forEach(b => b.onclick = () => asStop(+b.dataset.stop));
  v.querySelectorAll('[data-tier]').forEach(b => b.onclick = () => asSetModel(b.dataset.tier));
}
function asScroll(){ const l = document.getElementById('as-log'); if(!l) return; const last = l.lastElementChild; if(last) last.scrollIntoView({block: 'end'}); }
asBadge(); if(ASB){ asPull(); asLoopRun(); }
window.addEventListener('focus', () => { if(ASB) asLast = 0; });
