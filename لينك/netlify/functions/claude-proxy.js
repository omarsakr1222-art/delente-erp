// Netlify Function: claude-proxy
// Proxies requests to Anthropic API with server-side API key
// Exposes POST /api/claude with { messages: [...], model?: string, max_tokens?: number, system?: string, stream?: boolean }

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Simple admin secret gate to prevent public abuse
  const adminSecret = process.env.ADMIN_API_SECRET || '';
  const hdrs = event.headers || {};
  const provided = hdrs['x-admin-secret'] || hdrs['X-Admin-Secret'] || hdrs['x-admin-secret'.toLowerCase()];
  if (adminSecret && provided !== adminSecret) {
    return {
      statusCode: 401,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    const defaultModel = process.env.CLAUDE_DEFAULT_MODEL || 'claude-3-5-sonnet-20241022';
    const forceModel = process.env.CLAUDE_FORCE_MODEL; // if set, overrides any client choice for all users

    const payload = {
      model: forceModel || body.model || defaultModel,
      max_tokens: body.max_tokens || 512,
      system: body.system,
      messages: body.messages || [],
      stream: !!body.stream
    };

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    // Pass through status and body
    const text = await resp.text();
    return {
      statusCode: resp.status,
      headers: { ...corsHeaders(), 'content-type': resp.headers.get('content-type') || 'application/json' },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Proxy error', details: String(err && err.stack || err) })
    };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
