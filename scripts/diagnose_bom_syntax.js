const fs = require('fs');
const path = 'h:/Link/index.html';
const s = fs.readFileSync(path,'utf8');
const marker = '// Costs / BOM feature (minimal, client-side only)';
const idx = s.indexOf(marker);
if(idx === -1){ console.error('marker not found'); process.exit(2); }
// find the opening <script> tag before marker
const scriptOpen = s.lastIndexOf('<script', idx);
if(scriptOpen === -1){ console.error('opening <script> not found'); process.exit(3); }
const openEnd = s.indexOf('>', scriptOpen);
const closeIdx = s.indexOf('</script>', idx);
if(closeIdx === -1){ console.error('closing </script> not found'); process.exit(4); }
const content = s.slice(openEnd+1, closeIdx);
// Try parse
try{
    new Function(content);
    console.log('PARSE_OK');
    process.exit(0);
}catch(e){
    console.error('PARSE_ERROR');
    console.error(e && e.stack);
    // Attempt to locate the offending 'try' by scanning for 'try {' occurrences
    const re = /try\s*\{/g;
    let m;
    while((m=re.exec(content))){
        const idx = m.index;
        const line = content.slice(0, idx).split('\n').length;
        console.log('TRY_AT index', idx, 'line', line);
    }
    process.exit(1);
}
