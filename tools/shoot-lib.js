const BASE='http://localhost:3000';
async function names(token, teachers) {
  const res = await fetch(`${BASE}/api/v1/students?activeOnly=false`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`students api ${res.status}`);
  const list = await res.json();
  const names = new Set();
  const add = (v) => { if (typeof v === 'string') v.trim().split(/\s+/).forEach(w => { if (w.length >= 3) names.add(w); }); };
  const KEYS = ['firstName', 'lastName', 'fullName', 'parentFirstName', 'parentLastName', 'parentFullName'];
  for (const s of list) for (const k of KEYS) add(s[k]);
  if (teachers) {
    const tr = await fetch(`${BASE}/api/v1/teachers?activeOnly=false`, { headers: { Authorization: `Bearer ${token}` } });
    for (const t of await tr.json()) for (const k of KEYS) add(t[k]);
  }
  // Common UI words that happen to be names; never blur these.
  for (const w of ['Özel', 'Eğitim', 'Ders', 'Dersler', 'Plan', 'Okul', 'Grup', 'Oda', 'Odaları', 'Servis', 'Hak', 'Kayıt', 'Aktif', 'Pasif']) names.delete(w);
  return [...names];
}
function blurInPage(tokens) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?<!\\p{L})(' + tokens.map(esc).join('|') + ')(?!\\p{L})', 'gu');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && !['SCRIPT', 'STYLE'].includes(n.parentElement.tagName) && re.test(n.nodeValue)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let count = 0;
  for (const n of nodes) {
    const frag = document.createDocumentFragment();
    let last = 0; re.lastIndex = 0; let m;
    while ((m = re.exec(n.nodeValue))) {
      frag.appendChild(document.createTextNode(n.nodeValue.slice(last, m.index)));
      const span = document.createElement('span');
      span.textContent = m[1];
      span.style.cssText = 'filter: blur(5px); display: inline-block;';
      frag.appendChild(span); last = m.index + m[0].length; count++;
    }
    frag.appendChild(document.createTextNode(n.nodeValue.slice(last)));
    n.parentNode.replaceChild(frag, n);
  }
  return count;
}
module.exports={names, blurInPage};
