/**
 * Netlify Function: ETA Egyptian E-Invoicing document/submission status
 */
const fetch = require('node-fetch');

let __etaToken = null;
let __etaTokenExp = 0; // epoch ms

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    // Admin secret gate
    const secret = process.env.ADMIN_API_SECRET || '';
    const provided = (event.headers && (event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'])) || '';
    if (secret && provided !== secret) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const body = JSON.parse(event.body || '{}');
    const { submissionUuid, documentUuid } = body;
    if (!submissionUuid && !documentUuid) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Provide submissionUuid or documentUuid' }) };
    }

    const base = requiredEnv('ETA_BASE_URL');
    const token = await getEtaToken();

    let statusJson = null;
    if (submissionUuid) {
      const resp = await fetchWithRetry(`${base}/api/v1.0/documentsubmissions/${encodeURIComponent(submissionUuid)}`, {
        method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
      });
      statusJson = await resp.json();
      if (!resp.ok) {
        return { statusCode: resp.status, body: JSON.stringify({ error: 'Submission status failed', details: statusJson }) };
      }
    } else if (documentUuid) {
      const resp = await fetchWithRetry(`${base}/api/v1.0/documents/${encodeURIComponent(documentUuid)}`, {
        method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
      });
      statusJson = await resp.json();
      if (!resp.ok) {
        return { statusCode: resp.status, body: JSON.stringify({ error: 'Document status failed', details: statusJson }) };
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, status: statusJson }) };
  } catch (e) {
    console.error('eta-einvoice-status error', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

async function getEtaToken() {
  const base = requiredEnv('ETA_BASE_URL');
  const clientId = requiredEnv('ETA_CLIENT_ID');
  const clientSecret = requiredEnv('ETA_CLIENT_SECRET');
  const now = Date.now();
  if (__etaToken && (__etaTokenExp - 15_000) > now) {
    return __etaToken;
  }
  const resp = await fetch(`${base}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'InvoicingAPI'
    })
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`Token error: ${resp.status} ${JSON.stringify(json)}`);
  if (!json.access_token) throw new Error('No access_token in token response');
  __etaToken = json.access_token;
  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  __etaTokenExp = Date.now() + (expiresIn * 1000);
  return __etaToken;
}

async function fetchWithRetry(url, options, attempt = 1) {
  const resp = await fetch(url, options);
  if (resp.status !== 429) return resp;
  if (attempt >= 3) return resp;
  const retryAfter = resp.headers && (resp.headers.get('Retry-After') || resp.headers.get('retry-after'));
  let delayMs = 1000 * attempt;
  if (retryAfter) {
    const asInt = parseInt(retryAfter, 10);
    if (!Number.isNaN(asInt)) delayMs = Math.max(500, asInt * 1000);
  }
  await new Promise(r => setTimeout(r, delayMs));
  return fetchWithRetry(url, options, attempt + 1);
}
