// Netlify Function: ETA Invoice Upload Stub
// WARNING: This is a stub. For production you must implement proper CADES-BES signing using the provided PFX certificate.
// Environment variables expected:
// ETA_BASE_URL, ETA_CLIENT_ID, ETA_CLIENT_SECRET, ETA_TAX_ID, ETA_ACTIVITY_CODE,
// ETA_CERT_PASSWORD, ETA_CERT_BASE64

let tokenCache = { accessToken: null, expiresAt: 0 };

function getEnv(name, required = false) {
  const v = process.env[name];
  if (required && !v) throw new Error(`Missing env var: ${name}`);
  return v || '';
}

async function fetchToken() {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 5000) {
    return tokenCache.accessToken;
  }
  const baseUrl = getEnv('ETA_BASE_URL', true);
  const clientId = getEnv('ETA_CLIENT_ID', true);
  const clientSecret = getEnv('ETA_CLIENT_SECRET', true);

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });

  const resp = await fetch(baseUrl + '/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error('Token request failed: ' + txt);
  }
  const data = await resp.json();
  tokenCache.accessToken = data.access_token;
  // expires_in seconds
  tokenCache.expiresAt = Date.now() + (data.expires_in * 1000);
  return tokenCache.accessToken;
}

// Simple canonicalization: sort keys, remove null/empty
function canonicalize(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object') {
    if (value === '') return undefined;
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(v => canonicalize(v)).filter(v => v !== undefined);
  }
  const out = {};
  Object.keys(value).sort().forEach(k => {
    const v = canonicalize(value[k]);
    if (v !== undefined) out[k] = v;
  });
  return out;
}

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Stub signing: produce base64 of SHA256 hash (NOT a valid CADES-BES signature!)
async function stubSignInvoice(invoiceCanonicalJson) {
  const hex = await sha256Hex(invoiceCanonicalJson);
  // Return hex as base64 placeholder
  const base64 = Buffer.from(hex).toString('base64');
  return 'STUB-' + base64; // make clear it's a stub
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    // Admin secret gate
    const secret = process.env.ADMIN_API_SECRET || '';
    const provided = (event.headers && (event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'])) || '';
    if (secret && provided !== secret) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    const { invoice } = JSON.parse(event.body || '{}');
    if (!invoice) return { statusCode: 400, body: 'Missing invoice' };

    const canonicalObj = canonicalize(invoice);
    const canonicalJson = JSON.stringify(canonicalObj);

    // Sign stub
    const signature = await stubSignInvoice(canonicalJson);
    const signedInvoice = { ...invoice, signature };

    const accessToken = await fetchToken();
    const baseUrl = getEnv('ETA_BASE_URL', true);

    // Submit document(s)
    const submissionResp = await fetch(baseUrl + '/api/v1.0/documentsubmissions/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documents: [signedInvoice] })
    });

    const text = await submissionResp.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!submissionResp.ok && submissionResp.status !== 202) {
      return { statusCode: submissionResp.status || 500, body: text };
    }

    // Treat 202 Accepted as success; extract submissionUUID / acceptedDocuments
    const submissionUUID = json.submissionUUID || json.uuid || null;
    const accepted = !!(submissionResp.status === 202);

    return {
      statusCode: 200,
      body: JSON.stringify({ accepted, submissionUUID, raw: json })
    };
  } catch (e) {
    console.error('eta-upload error', e);
    return { statusCode: 500, body: 'Server error: ' + e.message };
  }
};
