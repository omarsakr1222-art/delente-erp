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
const n = 24 - 1;
if (n < 0 || n >= scripts.length) { console.error('Script not found'); process.exit(1); }
const s = scripts[n];
const content = s.content;
let inSingle=false,inDouble=false,inBack=false,escaped=false,inLine=false,inBlock=false;
const stack = [];
for (let p=0;p<content.length;p++){
  const ch = content[p];
  const next = content[p+1];
  if (inLine){ if (ch==='\n') inLine=false; continue; }
  if (inBlock){ if (ch==='*' && next==='/'){ inBlock=false; p++; continue; } continue; }
  if (!inSingle && !inDouble && !inBack){ if (ch==='/' && next==='/'){ inLine=true; p++; continue;} if (ch==='/' && next==='*'){ inBlock=true; p++; continue;} }
  if (escaped){ escaped=false; continue; }
  if (ch==='\\'){ escaped=true; continue; }
  if (!inSingle && !inBack && ch==='"'){ inDouble=!inDouble; continue; }
  if (!inDouble && !inBack && ch==="'"){ inSingle=!inSingle; continue; }
  if (!inSingle && !inDouble && ch==='`'){ inBack=!inBack; continue; }
  if (!inSingle && !inDouble && !inBack){ if (ch==='{'||ch==='('||ch==='[') stack.push({ch,pos:p}); if (ch==='}'||ch===')'||ch===']'){ const last = stack.pop(); if (!last){ console.log('closing without opener at',p,'char',ch); } else { const pairs={'{':'}','(':')','[':']'}; if (pairs[last.ch] !== ch) console.log('mismatch open', last.ch, 'at', last.pos, 'closed by', ch, 'at', p); } } }
}
if (stack.length){ console.log('Unclosed stack length', stack.length); stack.slice(-10).forEach(it=>{
  const pos = it.pos; const snippet = content.slice(Math.max(0,pos-40), Math.min(content.length,pos+40)).replace(/\n/g,'\\n');
  console.log(' open', it.ch, 'pos', pos, 'line approx', content.slice(0,pos).split('\n').length, 'context:', snippet);
}); } else { console.log('No unclosed tokens'); }
