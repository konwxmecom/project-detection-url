// Netlify Function version of our security header checker.
// Netlify's handler signature is different from Vercel's: it takes an
// `event` object and must RETURN a response object (instead of using res.status()).

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

function isBlockedHost(hostname) {
  const blockedPatterns = [
    /^localhost$/i,
    /^127\./,
    /^0\.0\.0\.0$/,
    /^10\./,
    /^192\.168\./,
    /^169\.254\./,
    /^172\.(1[6-9]|2\d|3[0-1])\./,
  ];
  return blockedPatterns.some((pattern) => pattern.test(hostname));
}

exports.handler = async (event) => {
  const url = event.queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing "url" query parameter.' }),
    };
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'That is not a valid URL.' }),
    };
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Only http/https URLs are allowed.' }),
    };
  }

  if (isBlockedHost(target.hostname)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'That host is not allowed.' }),
    };
  }

  try {
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        target: target.toString(),
        statusCode: response.status,
        usesHttps: target.protocol === 'https:',
        score,
        results,
      }),
    };
  } catch {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Could not reach that URL. Check it is online and try again.' }),
    };
  }
};
