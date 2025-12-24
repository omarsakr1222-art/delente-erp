const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const txt = fs.readFileSync(file, 'utf8');
function extractScripts(html){
  const scripts = [];
  let idx = 0;
  while(true){
    const sOpen = html.indexOf('<script', idx);
    if (sOpen === -1) break;
    const gt = html.indexOf('>', sOpen);
    if (gt === -1) break;
    const closeTag = '</script>';
    const sClose = html.indexOf(closeTag, gt+1);
    if (sClose === -1) {
      scripts.push({start: gt+1, end: html.length, content: html.slice(gt+1)});
      break;
    }
    scripts.push({start: gt+1, end: sClose, content: html.slice(gt+1, sClose)});
    idx = sClose + closeTag.length;
  }
  return scripts;
}
const scripts = extractScripts(txt);
const n = Number(process.argv[2] || 24);
if (n < 1 || n > scripts.length) {
  console.error('Invalid script number', n, 'available:', scripts.length); process.exit(1);
}
const s = scripts[n-1];
const startLine = txt.slice(0,s.start).split('\n').length + 1;
const out = path.join(__dirname, `script_${n}_startline_${startLine}.js`);
fs.writeFileSync(out, s.content, 'utf8');
console.log('Wrote', out);
