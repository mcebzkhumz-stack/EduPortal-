/**
 * EduPortal GitHub sync proxy
 * -----------------------------------------------------------------
 * Sits between the EduPortal app (running on GitHub Pages) and the
 * GitHub REST API, so the real Personal Access Token never has to
 * live in the browser. The app is configured with this Worker's URL
 * in the "Route through a proxy" field of the GitHub Registry Sync
 * panel, and sends requests like:
 *
 *   PUT https://your-worker.example.workers.dev/repos/OWNER/REPO/contents/eduportal-schools.json
 *
 * This Worker strips its own origin, forwards everything else
 * (method, path, query string, body) to the matching
 * https://api.github.com/... URL, attaches the real token from a
 * Worker secret, and relays the response back — with CORS headers
 * so the browser is allowed to read it.
 *
 * Deploy:
 *   1. wrangler login
 *   2. wrangler secret put GITHUB_TOKEN     (paste your fine-grained PAT)
 *   3. wrangler secret put PROXY_KEY        (optional — a password
 *      only this app knows, so randoms can't use your Worker as an
 *      open proxy to your repo even without a GitHub token)
 *   4. wrangler deploy
 *   5. Paste the resulting *.workers.dev URL into the app's
 *      "Route through a proxy" field, and the same PROXY_KEY (if
 *      you set one) into the "Proxy key" field next to it.
 */

const GITHUB_API = 'https://api.github.com';

// Restrict which paths this proxy will forward, so it can only ever
// be used to hit the GitHub Contents/Git-Data endpoints EduPortal
// actually needs — never an open relay to arbitrary GitHub API paths.
const ALLOWED_PATH_PREFIX = '/repos/';

function corsHeaders(origin) {
	return {
		'Access-Control-Allow-Origin': origin || '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Proxy-Key',
		'Access-Control-Max-Age': '86400',
	};
}

export default {
	async fetch(request, env) {
		const origin = request.headers.get('Origin') || '*';

		// Preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders(origin) });
		}

		const url = new URL(request.url);

		if (!url.pathname.startsWith(ALLOWED_PATH_PREFIX)) {
			return new Response('Not found', { status: 404, headers: corsHeaders(origin) });
		}

		// Optional shared-secret check. If PROXY_KEY is set as a Worker
		// secret, every request must carry a matching X-Proxy-Key header,
		// or it's rejected before ever touching GitHub.
		if (env.PROXY_KEY) {
			const provided = request.headers.get('X-Proxy-Key');
			if (provided !== env.PROXY_KEY) {
				return new Response('Unauthorized', { status: 401, headers: corsHeaders(origin) });
			}
		}

		if (!env.GITHUB_TOKEN) {
			return new Response(
				'Proxy is missing GITHUB_TOKEN. Run: wrangler secret put GITHUB_TOKEN',
				{ status: 500, headers: corsHeaders(origin) }
			);
		}

		const githubUrl = GITHUB_API + url.pathname + url.search;

		const forwardHeaders = new Headers();
		forwardHeaders.set('Authorization', `Bearer ${env.GITHUB_TOKEN}`);
		forwardHeaders.set('Accept', request.headers.get('Accept') || 'application/vnd.github+json');
		forwardHeaders.set('User-Agent', 'EduPortal-Sync-Proxy');
		const contentType = request.headers.get('Content-Type');
		if (contentType) forwardHeaders.set('Content-Type', contentType);
		// GitHub requires a specific API version header for some endpoints.
		forwardHeaders.set('X-GitHub-Api-Version', '2022-11-28');

		const init = {
			method: request.method,
			headers: forwardHeaders,
		};
		if (!['GET', 'HEAD'].includes(request.method)) {
			init.body = await request.text();
		}

		let githubResponse;
		try {
			githubResponse = await fetch(githubUrl, init);
		} catch (err) {
			return new Response(`Proxy fetch to GitHub failed: ${err.message}`, {
				status: 502,
				headers: corsHeaders(origin),
			});
		}

		const responseHeaders = new Headers(githubResponse.headers);
		Object.entries(corsHeaders(origin)).forEach(([k, v]) => responseHeaders.set(k, v));
		// Content-Encoding can cause double-decoding issues when the body
		// has already been read/re-served by fetch; strip it and let the
		// browser treat the body as plain text/json.
		responseHeaders.delete('Content-Encoding');
		responseHeaders.delete('Content-Length');

		const body = await githubResponse.text();
		return new Response(body, {
			status: githubResponse.status,
			headers: responseHeaders,
		});
	},
};
