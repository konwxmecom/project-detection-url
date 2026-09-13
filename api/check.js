// Vercel Serverless Function
// File location matters here: anything inside /api/ becomes a live endpoint.
// This file automatically becomes: https://yourproject.vercel.app/api/check

// A small list of headers we care about, with a plain-English explanation
// of what each one protects against. This is the "knowledge base" of our tool.
const HEADER_CHECKS = [
  {
    key: 'strict-transport-security',
    name: 'HSTS (Strict-Transport-Security)',
    why: 'Forces browsers to only use HTTPS, preventing downgrade/MITM attacks.',
  },
  {
    key: 'content-security-policy',
    name: 'Content-Security-Policy',
    why: 'Restricts which scripts/resources can run, reducing XSS impact.',
  },
  {
    key: 'x-frame-options',
    name: 'X-Frame-Options',
    why: 'Prevents the site from being embedded in an iframe (clickjacking protection).',
  },
  {
    key: 'x-content-type-options',
    name: 'X-Content-Type-Options',
    why: 'Stops the browser from guessing file types, blocking some MIME-sniffing attacks.',
  },
  {
    key: 'referrer-policy',
    name: 'Referrer-Policy',
    why: 'Controls how much URL/referrer info leaks to other sites when users click links.',
  },
  {
    key: 'permissions-policy',
    name: 'Permissions-Policy',
    why: 'Restricts access to browser features like camera, mic, geolocation.',
  },
];

// Basic SSRF (Server-Side Request Forgery) protection.
// Since THIS server is the one making the request, a malicious user could try
// to make it fetch internal/private addresses (like 127.0.0.1 or 169.254.169.254,
// which is a cloud metadata endpoint). We block obviously private/internal hosts.
function isBlockedHost(hostname) {
  const blockedPatterns = [
    /^localhost$/i,
    /^127\./,
    /^0\.0\.0\.0$/,
    /^10\./,
    /^192\.168\./,
    /^169\.254\./, // cloud metadata range
    /^172\.(1[6-9]|2\d|3[0-1])\./,
  ];
  return blockedPatterns.some((pattern) => pattern.test(hostname));
}

export default async function handler(req, res) {
  // Only allow GET requests with a ?url= query param
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter.' });
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).json({ error: 'That is not a valid URL.' });
  }

  // Only allow http/https — block file://, ftp://, etc.
  if (!['http:', 'https:'].includes(target.protocol)) {
    return res.status(400).json({ error: 'Only http/https URLs are allowed.' });
  }

  if (isBlockedHost(target.hostname)) {
    return res.status(400).json({ error: 'That host is not allowed.' });
  }

  try {
    // We only need headers, not the full page body, so HEAD is enough.
    // Some servers don't support HEAD properly, so we fall back to GET.
    let response = await fetch(target.toString(), { method: 'HEAD', redirect: 'follow' });
    if (!response.ok && response.status === 405) {
      response = await fetch(target.toString(), { method: 'GET', redirect: 'follow' });
    }

    const results = HEADER_CHECKS.map((check) => {
      const value = response.headers.get(check.key);
      return {
        name: check.name,
        why: check.why,
        present: Boolean(value),
        value: value || null,
      };
    });

    const score = Math.round(
      (results.filter((r) => r.present).length / results.length) * 100
    );

    return res.status(200).json({
      target: target.toString(),
      statusCode: response.status,
      usesHttps: target.protocol === 'https:',
      score,
      results,
    });
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach that URL. Check it is online and try again.' });
  }
}
