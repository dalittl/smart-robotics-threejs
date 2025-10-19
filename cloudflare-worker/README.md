Add-CORS Cloudflare Worker

Purpose

A tiny Cloudflare Worker that proxies your R2-hosted `robot.glb` and injects CORS headers so browsers can load the GLB from your site (e.g. https://www.apolloeve.com).

Files

- `add-cors-worker.js` - the worker script. Update `R2_URL` if you change the R2 location.

Quick deploy with Wrangler (recommended)

1. Install Wrangler: https://developers.cloudflare.com/workers/cli-wrangler/install

2. Authenticate and configure a Wrangler project in this folder:

```powershell
npm install -g wrangler
wrangler login
wrangler init add-cors-worker --yes
# Replace the generated worker script with add-cors-worker.js content (or point wrangler to this file)
```

3. Update `wrangler.toml` with a name and route (or use a custom domain):

- Example `wrangler.toml` (set your account_id and preferred settings):

```toml
name = "apolloeve-glb-proxy"
main = "./cloudflare-worker/add-cors-worker.js"
account_id = "<YOUR_ACCOUNT_ID>"
compatibility_date = "2025-10-18"

# Example for publishing to a worker subdomain
# (or you can bind to a custom domain or route in the Cloudflare dashboard)

[env.production]
route = "www.apolloeve.com/robot.glb"
```

4. Publish the worker:

```powershell
wrangler publish
```

Routing options

- Option A (recommended): publish to a worker route bound to `https://www.apolloeve.com/robot.glb` so the browser will fetch the GLB from your own origin and no CORS is required.

- Option B: publish to a worker subdomain (e.g. `https://apolloeve-glb-proxy.yourworkers.dev/robot.glb`) and point your app's production `modelUrl` to that address. That also works; the worker will add Access-Control-Allow-Origin: *.

Notes

- The script is intentionally small: it forwards GET/HEAD requests to the R2 public URL and adds CORS headers on the response. It preserves Content-Type and supports range requests as long as your R2 endpoint supports them.
- If you prefer a tighter policy, replace `respHeaders.set('Access-Control-Allow-Origin', '*')` with a specific origin like `https://www.apolloeve.com`.
- Make sure your R2 public URL is correct. If you rotate or move the object, update `R2_URL` in the worker or in your deployed worker configuration.

Security

- Using `'*'` as the allowed origin is permissive. Restrict to your origin if you want stricter control.

Troubleshooting

- If you still get CORS errors after deploying, check the worker route/URL and ensure your app is requesting the worker URL (or that the worker is bound to your site route in Cloudflare routes). Also inspect the network response headers in the browser devtools to verify the Access-Control-Allow-Origin header is present.