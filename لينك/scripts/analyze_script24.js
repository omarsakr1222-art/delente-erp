const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'script_24_startline_4446.js');
let txt = fs.readFileSync(file, 'utf8');
// Remove the code block backticks if present
txt = txt.replace(/^```javascript\s*/,'').replace(/\s*```$/,'');

let inSingle=false,inDouble=false,inBack=false,escaped=false,inLine=false,inBlock=false;
const stack=[];
for(let i=0;i<txt.length;i++){
  const ch = txt[i];
  const next = txt[i+1];
  if(inLine){ if(ch==='\n') inLine=false; continue; }
  if(inBlock){ if(ch==='*' && next==='/' ){ inBlock=false; i++; continue;} continue; }
  if(!inSingle && !inDouble && !inBack){ if(ch==='/' && next==='/' ){ inLine=true; i++; continue;} if(ch==='/' && next==='*'){ inBlock=true; i++; continue;} }
  if(escaped){ escaped=false; continue; }
  if(ch==='\\'){ escaped=true; continue; }
  if(!inSingle && !inBack && ch==='"'){ inDouble=!inDouble; continue; }
  if(!inDouble && !inBack && ch==="'"){ inSingle=!inSingle; continue; }
  if(!inSingle && !inDouble && ch==='`'){ inBack=!inBack; continue; }
  if(!inSingle && !inDouble && !inBack){
    if(ch==='{'||ch==='('||ch==='[') stack.push({ch,pos:i});
    if(ch==='}'||ch===')'||ch===']'){
      const last=stack.pop();
      if(!last){ console.log('Closing without opener at pos',i,'char',ch); }
      else{
        const pairs={'{':'}','(':')','[':']'};
        if(pairs[last.ch]!==ch) console.log('MISMATCH open',last.ch,'pos',last.pos,'closed by',ch,'pos',i);
      }
    }
  }
}
console.log('Stack remaining:', stack.length);
stack.forEach(s=>{
  const pos = s.pos;
  const before = Math.max(0,pos-60);
  const after = Math.min(txt.length,pos+120);
  const snippet = txt.slice(before,after).replace(/\n/g,'\\n');
  const line = txt.slice(0,pos).split('\n').length;
  console.log('Unclosed',s.ch,'at pos',pos,'approxLine',line); 
  console.log('Context: ...'+snippet+'...\n');
});
