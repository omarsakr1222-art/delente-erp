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
console.log('Found', scripts.length, 'script blocks');
// Print indexes and start lines
for (let i=0;i<scripts.length;i++){
  const s = scripts[i];
  const startLine = txt.slice(0,s.start).split('\n').length + 1;
  console.log('\n--- Script', i+1, 'startLineApprox=', startLine, 'length=', s.content.length, 'chars ---');
  // print first 500 and last 200 chars
  const head = s.content.slice(0,500);
  const tail = s.content.slice(-200);
  console.log('HEAD:\n', head);
  console.log('\n...\nTAIL:\n', tail);
}
