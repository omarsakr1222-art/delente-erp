const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Thumbprint provided (from your environment)
const THUMBPRINT = '573BC8383DE59093F99096C5C238C3F89B0CC2E6';

// Canonicalize JSON: stable key order, recursive
function canonicalize(obj) {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

app.post('/sign-invoice', (req, res) => {
  try {
    const payload = req.body;
    const canonical = canonicalize(payload);

    const scriptPath = path.join(__dirname, 'sign.ps1');

    // Call PowerShell script: pass dataToSign and thumbprint as parameters
    const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-dataToSign', canonical, '-thumbprint', THUMBPRINT];
    const ps = spawn('powershell.exe', args, { windowsHide: true });

    let stdout = '';
    let stderr = '';

    ps.stdout.on('data', (data) => { stdout += data.toString(); });
    ps.stderr.on('data', (data) => { stderr += data.toString(); });

    ps.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Signing failed', detail: stderr.trim() });
      }
      const signature = stdout.trim();
      return res.json({ signature });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local signer listening on http://localhost:${PORT}`);
});
