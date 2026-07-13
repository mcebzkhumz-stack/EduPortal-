/**
 * EduPortal GitHub-sync proxy (optional).
 *
 * A static page (like index.html in this repo) has nowhere safe to hide a
 * GitHub Personal Access Token — anyone with access to the browser's dev
 * tools can read it. This Worker holds the real token as a server-side
 * secret instead, and forwards only whitelisted GitHub API calls.
 *
 * Deploy:
 *   1. npm install -g wrangler   (if you don't have it already)
 *   2. cd proxy
 *   3. wrangler login
 *   4. wrangler secret put GITHUB_TOKEN      (paste your fine-grained PAT)
 *   5. wrangler secret put PROXY_KEY         (any shared secret you invent)
 *   6. wrangler deploy
 *   7. In EduPortal's Owner Console → GitHub Registry Sync → "Route through
 *      a proxy", set Proxy URL to the workers.dev URL wrangler prints, and
 *      Proxy key to the same value you set for PROXY_KEY above. Leave the
 *      token field in the app blank — the Worker holds it instead.
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return corsResponse();

    const suppliedKey = request.headers.get('X-Proxy-Key') || '';
    if (!env.PROXY_KEY || suppliedKey !== env.PROXY_KEY) {
      return corsResponse('Unauthorized', 401);
    }

    const url = new URL(request.url);
    // Only ever forward to GitHub's REST API, at the path the client asked
    // for — e.g. /repos/{owner}/{repo}/contents/{path}. Nothing else.
    const githubUrl = 'https://api.github.com' + url.pathname + url.search;

    const forwardedHeaders = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'eduportal-sync-proxy',
    };

    const init = {
      method: request.method,
      headers: forwardedHeaders,
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      init.body = await request.text();
    }

    const ghResponse = await fetch(githubUrl, init);
    const body = await ghResponse.text();
    return new Response(body, {
      status: ghResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Proxy-Key',
  };
}

function corsResponse(body = '', status = 204) {
  return new Response(body, { status, headers: corsHeaders() });
}
