/**
 * Netlify Function: ETA Egyptian E-Invoicing submission (Sandbox skeleton)
 * NOTE: This is a skeleton. You must supply real credentials and signing logic.
 * SECURITY: Never expose client_secret or private key to the browser.
 */

const fetch = require('node-fetch');
const forge = require('node-forge');

// Expected environment variables (set in Netlify dashboard):
// ETA_BASE_URL=https://api.invoicing.eta.gov.eg (or sandbox URL)
// ETA_CLIENT_ID=xxxxx
// ETA_CLIENT_SECRET=xxxxx
// ETA_TAX_ID=your seller tax id
// ETA_ACTIVITY_CODE=standard activity code
// ETA_CERT_BASE64=base64 of .pfx or private key (if using client side signing, else use HSM)
// ETA_CERT_PASSWORD=pfx password

// In-memory token cache (persists within warm function instance)
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
    const { sale } = body;
    if (!sale) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing sale payload' }) };
    }

    // 1. Transform internal sale to ETA invoice JSON
    const invoice = transformSaleToEtaInvoice(sale);

    // 2. Obtain OAuth2 token (client_credentials)
    const token = await getEtaToken();

    // 3. Sign invoice using PKCS#7 detached signature (CMS)
    try {
      const signatureValue = await signInvoicePkcs7(invoice);
      if (signatureValue) {
        invoice.signatures = [ {
          signatureType: 'I', // Invoice signature
          protocol: 'EGS',
          value: signatureValue
        } ];
      }
    } catch (signErr) {
      console.warn('Signing failed; continuing without signature (sandbox may reject)', signErr);
    }

    // 4. Submit invoice (v1.0 endpoint) with retry on 429
    const submitResp = await fetchWithRetry(`${process.env.ETA_BASE_URL}/api/v1.0/documentsubmissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documents: [invoice] })
    });

    const submitJson = await submitResp.json();
    if (!submitResp.ok) {
      return { statusCode: submitResp.status, body: JSON.stringify({ error: 'Submission failed', details: submitJson }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, etaResponse: submitJson }) };
  } catch (e) {
    console.error('eta-einvoice-submit error', e);
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

function transformSaleToEtaInvoice(sale) {
  // Minimal skeleton mapping. Extend with full ETA spec fields.
  const now = new Date().toISOString();
  const internalId = sale.id || sale._id || `local-${Date.now()}`;
  const supplierTaxId = requiredEnv('ETA_TAX_ID');
  const activityCode = requiredEnv('ETA_ACTIVITY_CODE');

  const lines = (sale.items || []).map((it, idx) => ({
    internalCode: it.productId || it.pid || String(idx+1),
    description: it.name || it.productName || 'صنف',
    itemCode: it.gs1 || it.itemCode || it.productCode || 'DUMMY-CODE',
    itemCodeType: 'GS1',
    unitType: it.unitType || 'EA', // map to ETA standard (EA, KGM, etc.)
    quantity: Number(it.quantity || it.qty || 0),
    unitValue: { currencySold: 'EGP', amountEGP: Number(it.unitPrice || it.price || 0) },
    totalAmount: Number(it.unitPrice || it.price || 0) * Number(it.quantity || it.qty || 0),
    salesTotal: Number(it.unitPrice || it.price || 0) * Number(it.quantity || it.qty || 0),
    valueDifference: 0,
    netTotal: Number(it.unitPrice || it.price || 0) * Number(it.quantity || it.qty || 0),
    itemsDiscount: 0,
    taxes: [
      // Example VAT line (T1). Adjust rate and subtype per requirements.
      {
        taxType: 'T1', // VAT
        subType: 'V001',
        amount: 0,
        rate: 0
      }
    ]
  }));

  const total = lines.reduce((a,l)=>a + l.netTotal,0);

  return {
    internalId,
    documentType: 'I', // Invoice
    documentTypeVersion: '1.0',
    dateTimeIssued: now,
    taxpayerActivityCode: activityCode,
    currency: 'EGP',
    exchangeRate: 1,
    seller: {
      tin: supplierTaxId,
      type: 'B', // Business
      name: 'اسم الشركة', // replace with real seller name
      address: { branchId: '0', country: 'EG', governate: 'Cairo', regionCity: 'Cairo', street: 'Street', buildingNumber: '1' }
    },
    receiver: {
      type: 'B', // or 'P' for person
      tin: sale.customerTaxId || '000000000',
      name: sale.customerName || 'عميل عام'
    },
    paymentMethod: 'C', // Cash (adjust if needed)
    invoiceLines: lines,
    totalSalesAmount: total,
    totalDiscountAmount: 0,
    netAmount: total,
    taxTotals: [ { taxType: 'T1', amount: 0 } ],
    extraDiscountAmount: 0,
    totalAmount: total,
  };
}

// ===== PKCS#7 (CMS) signing helpers =====
// Prune null/empty string fields for canonicalization
function pruneForCanonical(input) {
  if (input === null || input === undefined) return undefined;
  if (Array.isArray(input)) {
    const arr = input.map(pruneForCanonical).filter(v => v !== undefined);
    return arr;
  }
  if (typeof input === 'object') {
    const out = {};
    Object.keys(input).forEach(k => {
      if (k === 'signatures') return; // never include signatures in the signed content
      const v = pruneForCanonical(input[k]);
      if (v === undefined) return;
      out[k] = v;
    });
    return out;
  }
  if (typeof input === 'string') {
    if (input === '') return undefined; // drop empty strings
    return input;
  }
  if (typeof input === 'number') {
    return isFinite(input) ? input : undefined;
  }
  if (typeof input === 'boolean') return input;
  return undefined;
}

function stableCanonical(obj){
  if (obj === null) return 'null';
  if (Array.isArray(obj)) return '[' + obj.map(stableCanonical).join(',') + ']';
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k)+':'+stableCanonical(obj[k])).join(',') + '}';
  }
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number') return isFinite(obj) ? String(obj) : 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  return 'null';
}

async function signInvoicePkcs7(invoice){
  const pfxBase64 = process.env.ETA_CERT_BASE64;
  const pfxPassword = process.env.ETA_CERT_PASSWORD;
  if (!pfxBase64 || !pfxPassword) throw new Error('Missing ETA_CERT_BASE64 or ETA_CERT_PASSWORD');
  // Canonical representation: prune null/empty strings, exclude signatures, sort keys, UTF-8 bytes
  const cleaned = pruneForCanonical(invoice);
  const canonical = stableCanonical(cleaned);
  const der = forge.util.decode64(pfxBase64);
  let asn1;
  try { asn1 = forge.asn1.fromDer(der); } catch(e){ throw new Error('PFX DER parse failed: '+ e.message); }
  let p12;
  try { p12 = forge.pkcs12.pkcs12FromAsn1(asn1, pfxPassword); } catch(e){ throw new Error('PFX decrypt failed: '+ e.message); }
  let privateKey = null, certificate = null;
  p12.safeContents.forEach(sc => sc.safeBags.forEach(sb => {
    if (sb.type === forge.pki.oids.pkcs8ShroudedKeyBag) privateKey = sb.key;
    if (sb.type === forge.pki.oids.certBag) certificate = sb.cert;
  }));
  if (!privateKey || !certificate) throw new Error('Key or certificate not found in PFX');
  const pkcs7 = forge.pkcs7.createSignedData();
  pkcs7.content = forge.util.createBuffer(canonical, 'utf8');
  pkcs7.addCertificate(certificate);
  pkcs7.addSigner({
    key: privateKey,
    certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    signedAttrs: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.signingTime, value: new Date() },
      { type: forge.pki.oids.messageDigest }
    ]
  });
  pkcs7.sign({ detached: true });
  const derBytes = forge.asn1.toDer(pkcs7.toAsn1()).getBytes();
  return Buffer.from(derBytes, 'binary').toString('base64');
}

// Basic retry for 429 Too Many Requests (respect Retry-After if present)
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
