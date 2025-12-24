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
      // take rest of file as script
      scripts.push({start: gt+1, end: html.length, content: html.slice(gt+1)});
      break;
    }
    scripts.push({start: gt+1, end: sClose, content: html.slice(gt+1, sClose)});
    idx = sClose + closeTag.length;
  }
  return scripts;
}

function analyzeScript(content, i){
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

    if (escaped){
      escaped = false;
      continue;
    }

    if (ch === "\\"){
      escaped = true; continue;
    }

    if (!inSingle && !inBack && ch === '"') { inDouble = !inDouble; continue; }
    if (!inDouble && !inBack && ch === "'") { inSingle = !inSingle; continue; }
    if (!inSingle && !inDouble && ch === '`') { inBack = !inBack; continue; }

    if (!inSingle && !inDouble && !inBack){
      if (ch === '{' || ch === '(' || ch === '[') stack.push(ch);
      if (ch === '}' || ch === ')' || ch === ']'){
        const last = stack.pop();
        if (!last){
          issues.push({pos:p, msg:'Closing token without opener: '+ch});
        } else {
          const pairs = {'{':'}','(':')','[':']'};
          if (pairs[last] !== ch) issues.push({pos:p, msg:'Mismatched '+last+' -> '+ch});
        }
      }
    }
  }
  if (inSingle) issues.push({pos:content.length, msg:"Unterminated single quote string"});
  if (inDouble) issues.push({pos:content.length, msg:"Unterminated double quote string"});
  if (inBack) issues.push({pos:content.length, msg:"Unterminated template literal (backtick)"});
  if (inLineComment) issues.push({pos:content.length, msg:"Unterminated line comment (EOF)"});
  if (inBlockComment) issues.push({pos:content.length, msg:"Unterminated block comment (EOF)"});
  if (stack.length) issues.push({pos:content.length, msg:'Unclosed tokens: '+stack.join('')});
  return issues;
}

const scripts = extractScripts(txt);
console.log('Found', scripts.length, 'script blocks');
let totalIssues = 0;
for (let i=0;i<scripts.length;i++){
  const s = scripts[i];
  const issues = analyzeScript(s.content, i);
  if (issues.length){
    console.log('\n--- Issues in script block', i+1, 'startLineApprox=', (txt.slice(0,s.start).split('\n').length+1), '---');
    issues.forEach(it=> console.log(' -', it.msg));
    totalIssues += issues.length;
  }
}
if (!totalIssues) console.log('No obvious unterminated strings/braces found in script blocks.');
else console.log('\nTotal issues found:', totalIssues);
