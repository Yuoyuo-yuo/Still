'use strict';
const KEY = 'still.diary.v1';
const $ = id => document.getElementById(id);
let entries = [], current = null, editing = false, dirty = false, writable = true, timer;
const dateFormat = new Intl.DateTimeFormat('en-US', {month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
const localDate = value => { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
function validEntry(e) { return e && typeof e.id === 'string' && e.id.length > 0 && typeof e.title === 'string' && typeof e.content === 'string' && typeof e.createdAt === 'string' && typeof e.updatedAt === 'string' && Number.isFinite(Date.parse(e.createdAt)) && Number.isFinite(Date.parse(e.updatedAt)); }
function notify(message) { clearTimeout(timer); $('status').textContent = message; timer = setTimeout(() => $('status').textContent = '', 5500); }
try {
  entries = JSON.parse(localStorage.getItem(KEY) || '[]');
  if (!Array.isArray(entries) || !entries.every(validEntry) || new Set(entries.map(e=>e.id)).size !== entries.length) throw new Error('Invalid data');
} catch { entries = []; writable = false; notify('Your saved journal could not be read. Storage has been left unchanged.'); }
function persist(next) {
  if (!writable) { notify('Storage is unavailable. Export your writing before closing.'); return false; }
  try { localStorage.setItem(KEY, JSON.stringify(next)); entries = next; return true; }
  catch { notify('Could not save. Storage may be full or disabled. Export your writing before closing.'); return false; }
}
function ask(title, message, action) {
  $('dialog-title').textContent = title; $('dialog-message').textContent = message; $('dialog-accept').textContent = action;
  return new Promise(resolve => { const dialog = $('confirm-dialog'); dialog.addEventListener('close', () => resolve(dialog.returnValue === 'accept'), {once:true}); dialog.showModal(); });
}
async function mayLeave() { return !dirty || await ask('Discard unsaved changes?', 'Your changes have not been saved. Stay here to save them, or discard them to continue.', 'Discard'); }
function renderArchive() {
  const query = $('search').value.trim().toLowerCase();
  const matches = entries.filter(e => [e.title,e.content,localDate(e.createdAt),dateFormat.format(new Date(e.createdAt))].join(' ').toLowerCase().includes(query)).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  $('count').textContent = query ? `${matches.length} / ${entries.length}` : entries.length;
  $('archive').replaceChildren(); let month = '';
  for (const entry of matches) {
    const heading = new Date(entry.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'});
    if (heading !== month) { const h = document.createElement('h3'); h.className = 'month'; h.textContent = heading; $('archive').append(h); month = heading; }
    const button = document.createElement('button'); button.className = 'entry' + (current?.id === entry.id ? ' active' : ''); button.setAttribute('aria-current',current?.id === entry.id ? 'true' : 'false');
    const title = document.createElement('strong'); title.textContent = entry.title;
    const excerpt = document.createElement('span'); excerpt.className='excerpt'; excerpt.textContent=entry.content.replace(/\s+/g,' ').slice(0,90) || 'A quiet moment.';
    const time = document.createElement('time'); time.dateTime = entry.createdAt; time.textContent = new Date(entry.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})+' · '+new Date(entry.createdAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    button.append(title,excerpt,time); button.onclick = async () => { if (await mayLeave()) openEntry(entry); }; $('archive').append(button);
  }
  if (!matches.length) { const p = document.createElement('p'); p.className='archive-empty'; p.textContent=query ? 'No entries found. Try another title, word, or date (YYYY-MM-DD).' : 'Your days will collect here, one entry at a time.'; $('archive').append(p); }
}
function updateWords() { const count = $('content').value.trim().split(/\s+/u).filter(Boolean).length; $('words').textContent = `${count} ${count === 1 ? 'word' : 'words'}`; }
function display() {
  $('empty').hidden = !!current; $('page').hidden = !current;
  $('save').hidden = !current || !editing; $('edit').hidden = !current || editing; $('delete').hidden = !current || !entries.some(e=>e.id === current.id);
  $('mode').textContent = current ? (editing ? 'Writing' : 'Reading') : 'A fresh page';
  if (current) {
    $('title').value=current.title; $('content').value=current.content;
    $('title').readOnly=$('content').readOnly=!editing;
    $('created').dateTime=current.createdAt; $('created').textContent=dateFormat.format(new Date(current.createdAt));
    $('modified').textContent=entries.some(e=>e.id===current.id) ? 'Last saved '+dateFormat.format(new Date(current.updatedAt)) : 'Not saved yet';
    updateWords();
  }
  renderArchive();
}
function openEntry(entry) { current={...entry}; editing=false; dirty=false; display(); }
async function newEntry() {
  if (!await mayLeave()) return;
  const now=new Date().toISOString(); current={id:crypto.randomUUID(),title:'',content:'',createdAt:now,updatedAt:now}; editing=true; dirty=false; display(); $('title').focus();
}
function save() {
  if (!current || !editing) return;
  if (!$('title').value.trim() && !$('content').value.trim()) { notify('Write a title or a few words before saving.'); $('content').focus(); return; }
  const next={...current,title:$('title').value.trim() || 'Untitled entry',content:$('content').value,updatedAt:new Date().toISOString()};
  if (persist([...entries.filter(e=>e.id!==next.id),next])) { openEntry(next); notify('Entry saved.'); }
}
$('new').onclick=$('start').onclick=newEntry; $('save').onclick=save;
$('edit').onclick=()=>{ editing=true; display(); $('content').focus(); };
$('delete').onclick=async()=>{
  if (!current || !await ask('Delete this entry?', 'This entry will be permanently removed from your journal.', 'Delete entry')) return;
  if (persist(entries.filter(e=>e.id!==current.id))) { current=null; dirty=false; editing=false; if (entries.length) openEntry([...entries].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))[0]); else display(); notify('Entry deleted.'); }
};
for (const id of ['title','content']) $(id).addEventListener('input',()=>{ dirty=true; updateWords(); $('modified').textContent='Unsaved changes'; });
$('search').oninput=renderArchive;
function setTheme(dark) { document.body.classList.toggle('dark',dark); $('theme').textContent=dark?'☀':'☾'; $('theme').setAttribute('aria-label',`Switch to ${dark?'light':'dark'} mode`); }
try { setTheme((localStorage.getItem('still.theme') || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))==='dark'); } catch { setTheme(false); }
$('theme').onclick=()=>{ const dark=!document.body.classList.contains('dark'); setTheme(dark); try{localStorage.setItem('still.theme',dark?'dark':'light');}catch{notify('Theme will apply for this session.');} };
$('export').onclick=()=>{
  let backup=[...entries];
  if (current && editing && ($('title').value.trim() || $('content').value.trim())) { const draft={...current,title:$('title').value.trim() || 'Untitled entry',content:$('content').value,updatedAt:new Date().toISOString()}; backup=[...backup.filter(e=>e.id!==draft.id),draft]; }
  const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,entries:backup},null,2)],{type:'application/json'}));
  const a=document.createElement('a'); a.href=url; a.download=`still-journal-${localDate(new Date())}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); notify('Journal exported, including your current writing.');
};
$('import').onclick=()=> $('import-file').click();
$('import-file').onchange=async event=>{
  const file=event.target.files[0]; event.target.value=''; if(!file)return;
  try {
    const parsed=JSON.parse(await file.text());
    if(parsed.version!==1 || !Array.isArray(parsed.entries) || !parsed.entries.every(validEntry) || new Set(parsed.entries.map(e=>e.id)).size!==parsed.entries.length) throw new Error('Invalid backup');
    if (!await mayLeave()) return;
    const map=new Map(entries.map(e=>[e.id,e])); let added=0;
    for(const e of parsed.entries) if(!map.has(e.id)) {map.set(e.id,{id:e.id,title:e.title,content:e.content,createdAt:e.createdAt,updatedAt:e.updatedAt}); added++;}
    if(persist([...map.values()])) {current=null;editing=false;dirty=false;display();notify(`${added} entries imported. Existing entries were kept.`);}
  }catch{notify('Could not import this file. Choose a valid Still JSON backup.');}
};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
window.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();save();}});
window.addEventListener('storage',event=>{if(event.key===KEY){writable=false;notify('Your journal changed in another tab. Export unsaved writing, then reload before saving.');}});
if(entries.length) openEntry([...entries].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))[0]); else display();
