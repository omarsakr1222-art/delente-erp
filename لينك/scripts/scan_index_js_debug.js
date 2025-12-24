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

function analyzeScript(content){
  const issues = [];
  let inSingle = false, inDouble = false, inBack = false, escaped = false, inLineComment = false, inBlockComment = false;
  const stack = [];
  for (let p=0;p<content.length;p++){
    const ch = content[p];
    const next = content[p+1];
    if (inLineComment){
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment){
      if (ch === '*' && next === '/') { inBlockComment = false; p++; continue; }
      continue;
    }
    if (!inSingle && !inDouble && !inBack){
      if (ch === '/' && next === '/') { inLineComment = true; p++; continue; }
      if (ch === '/' && next === '*') { inBlockComment = true; p++; continue; }
    }

    if (escaped){ escaped = false; continue; }
    if (ch === '\\'){ escaped = true; continue; }
    if (!inSingle && !inBack && ch === '"') { inDouble = !inDouble; continue; }
    if (!inDouble && !inBack && ch === "'") { inSingle = !inSingle; continue; }
    if (!inSingle && !inDouble && ch === '`') { inBack = !inBack; continue; }

    if (!inSingle && !inDouble && !inBack){
      if (ch === '{' || ch === '(' || ch === '[') stack.push({ch, pos:p});
      if (ch === '}' || ch === ')' || ch === ']'){
        const last = stack.pop();
        if (!last){ issues.push({pos:p, msg:'Closing token without opener: '+ch}); }
        else {
          const pairs = {'{':'}','(':')','[':']'};
          if (pairs[last.ch] !== ch) issues.push({pos:p, msg:'Mismatched '+last.ch+' -> '+ch, openPos:last.pos});
        }
      }
    }
  }
  if (inSingle) issues.push({pos:content.length, msg:"Unterminated single quote string"});
  if (inDouble) issues.push({pos:content.length, msg:"Unterminated double quote string"});
  if (inBack) issues.push({pos:content.length, msg:"Unterminated template literal (backtick)"});
  if (inLineComment) issues.push({pos:content.length, msg:"Unterminated line comment (EOF)"});
  if (inBlockComment) issues.push({pos:content.length, msg:"Unterminated block comment (EOF)"});
  if (stack.length) issues.push({pos:content.length, msg:'Unclosed tokens: '+stack.map(s=>s.ch).join('')});
  return issues;
}

const scripts = extractScripts(txt);
for (let i=0;i<scripts.length;i++){
  const s = scripts[i];
  const issues = analyzeScript(s.content);
  if (issues.length){
    const startLine = txt.slice(0,s.start).split('\n').length + 1;
    console.log('\n=== Script', i+1, 'startLine=', startLine, 'issues=', issues.length, 'length=', s.content.length, 'chars ===');
    issues.forEach((it,j)=>{
      const pos = it.pos;
      const before = Math.max(0,pos-60);
      const after = Math.min(s.content.length,pos+60);
      const snippet = s.content.slice(before, after).replace(/\n/g,'\\n');
      const line = s.content.slice(0,pos).split('\n').length + startLine - 1;
      console.log('\nIssue', j+1, ':', it.msg, 'pos=', pos, 'approxLine=', line);
      console.log('Context snippet:');
      console.log('...'+snippet+'...');
    });
  }
}

console.log('\nDone.');
