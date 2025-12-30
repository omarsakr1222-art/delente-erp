const fs = require('fs');
const path = process.argv[2];
if(!path){ console.error('Usage: node tools_check_syntax.js <file>'); process.exit(2); }
const s = fs.readFileSync(path,'utf8');
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m, idx=0, any=false;
while((m=re.exec(s)) !== null){
  idx++;
  const code = m[1];
  try{
    new Function(code);
  }catch(err){
    any=true;
    console.error('\n----- Syntax error in <script> block #'+idx+' -----');
    console.error('Error message:', err && err.message ? err.message : String(err));
    const pre = s.slice(0, m.index);
    const preLines = pre.split('\n').length;
    console.error('Script block start file line:', preLines+1);
    const codeLines = code.split('\n');
    console.error('--- Script snippet (first 200 lines) with file-line numbers ---');
    for(let i=0;i<Math.min(codeLines.length, 200);i++){
      const lineNo = preLines + i + 1;
      console.error(String(lineNo).padStart(6)+': '+codeLines[i]);
    }
    console.error('----- end snippet -----\n');
  }
}
if(!any) console.log('All <script> blocks parsed OK');
else process.exit(1);
