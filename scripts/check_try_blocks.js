const fs = require('fs');
const s = fs.readFileSync('h:/Link/tmp_bom_script.js','utf8');
function isIdentChar(c){ return /[A-Za-z0-9_$]/.test(c); }
let i=0; const len=s.length;
while(i<len){
  if(s.startsWith('try', i) && !isIdentChar(s[i+3])){
    let j=i+3; while(j<len && /\s/.test(s[j])) j++;
    if(s[j] === '{'){
      // find matching brace
      let k=j+1; let depth=1;
      while(k<len && depth>0){
        const ch = s[k];
        if(ch === '{') depth++;
        else if(ch === '}') depth--;
        else if(ch === '"' || ch === "'" || ch === '`'){
          const quote = ch; k++;
          while(k<len){ if(s[k] === '\\'){ k+=2; continue; } if(s[k] === quote){ k++; break; } k++; }
          continue;
        } else if(ch === '/'){
          if(s[k+1] === '/') { k+=2; while(k<len && s[k] !== '\n') k++; continue; }
          if(s[k+1] === '*') { k+=2; while(k+1<len && !(s[k]==='*' && s[k+1]==='/')) k++; k+=2; continue; }
        }
        k++;
      }
      if(depth!==0){ console.log('Unmatched braces for try starting at', i); process.exit(1); }
      // skip whitespace/comments from k
      let m=k; while(m<len && /\s/.test(s[m])) m++;
      if(s[m]===';') m++;
      while(m<len && /\s/.test(s[m])) m++;
      const next = s.slice(m, m+8);
      if(next.startsWith('catch') || next.startsWith('finally')){
        // ok
      } else {
        const before = s.slice(Math.max(0,i-80), i+40);
        const ln = s.slice(0,i).split('\n').length;
        console.log('Found try without catch/finally at index', i, 'line', ln);
        console.log('Context:\n' + before);
        process.exit(0);
      }
      i = k;
      continue;
    }
  }
  i++;
}
console.log('No unpaired try found');
