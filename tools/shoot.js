// Capture logged-in app screenshots with student/parent names blurred.
// Usage: node shoot.js [route ...]   (default: all)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = '/Users/tayfunusta/Documents/Projects/kardan-site/screenshots';
const token = fs.readFileSync(path.join(__dirname, '.token'), 'utf8').trim();
const user = fs.readFileSync(path.join(__dirname, '.user'), 'utf8').trim();

const PAGES = [
  { route: '/', nav: 'Ana Sayfa', file: 'dashboard.png' },
  { route: '/planning', nav: 'Aylık Planlama', file: 'planning.png' },
  { route: '/template', nav: 'Yıllık Planlama', file: 'template.png' },
  { route: '/students', nav: 'Öğrenciler', file: 'students.png' },
  { route: '/teachers', nav: 'Öğretmenler', file: 'teachers.png' },
  { route: '/rooms', nav: 'Eğitim Odaları', file: 'rooms.png' },
  { route: '/private-lessons', nav: 'Özel Dersler', file: 'private-lessons.png' },
  { route: '/settings', nav: 'Ayarlar', file: 'settings.png' },
];

async function studentNames() {
  const res = await fetch(`${BASE}/api/v1/students?activeOnly=false`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`students api ${res.status}`);
  const list = await res.json();
  const names = new Set();
  const add = (v) => { if (typeof v === 'string') v.trim().split(/\s+/).forEach(w => { if (w.length >= 3) names.add(w); }); };
  const KEYS = ['firstName', 'lastName', 'fullName', 'parentFirstName', 'parentLastName', 'parentFullName'];
  for (const s of list) for (const k of KEYS) add(s[k]);
  if (process.env.BLUR_TEACHERS) {
    const tr = await fetch(`${BASE}/api/v1/teachers?activeOnly=false`, { headers: { Authorization: `Bearer ${token}` } });
    for (const t of await tr.json()) for (const k of KEYS) add(t[k]);
  }
  // Common UI words that happen to be names; never blur these.
  for (const w of ['Özel', 'Eğitim', 'Ders', 'Dersler', 'Plan', 'Okul', 'Grup', 'Oda', 'Odaları', 'Servis', 'Hak', 'Kayıt', 'Aktif', 'Pasif']) names.delete(w);
  return [...names];
}

// Wraps every occurrence of a name token (whole word, case-sensitive) in a blurred span.
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

(async () => {
  const only = process.argv.slice(2);
  const pages = only.length ? PAGES.filter(p => only.includes(p.route)) : PAGES;
  const tokens = await studentNames();
  console.log(`name tokens: ${tokens.length}`);
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'tr-TR', colorScheme: 'light' });
  await ctx.addInitScript(([t, u]) => { localStorage.setItem('kardan_token', t); localStorage.setItem('kardan_user', u); }, [token, user]);
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  for (const p of pages) {
    await page.getByRole('link', { name: p.nav, exact: true }).or(page.getByText(p.nav, { exact: true })).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.locator('[role="progressbar"]').first().waitFor({ state: 'detached', timeout: 60000 }).catch(() => {});
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const n = await page.evaluate(blurInPage, tokens);
    await page.screenshot({ path: path.join(OUT, p.file) });
    console.log(`${p.route} -> ${p.file} (blurred ${n})`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
