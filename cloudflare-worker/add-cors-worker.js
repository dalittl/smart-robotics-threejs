// Cloudflare Worker: simple proxy to add CORS for a single R2-hosted GLB
// Deploy with wrangler and route it to something like https://pub-yourdomain.workers.dev/robot.glb

addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

const R2_URL = 'https://pub-63db098fc98c4445b67e76b821321f72.r2.dev/robot.glb'

async function handle(request) {
  // Only allow GET/HEAD
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const originReq = new Request(R2_URL, { method: request.method, headers: request.headers })
    const r2res = await fetch(originReq)

    // if upstream returned a redirect/html error, just forward status
    const contentType = r2res.headers.get('content-type') || ''
    if (!r2res.ok) {
      return new Response(await r2res.text(), { status: r2res.status, headers: { 'content-type': contentType } })
    }

    // Clone response so we can modify headers
    const respHeaders = new Headers(r2res.headers)
    // Ensure the content-type is preserved but we override CORS
    respHeaders.set('Access-Control-Allow-Origin', '*')
    respHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range')

    // Also allow range requests by forwarding the Range header from the original request
    // The original R2 will handle partial content if supported.

    const body = r2res.body
    return new Response(body, { status: r2res.status, headers: respHeaders })
  } catch (e) {
    return new Response('Upstream fetch failed', { status: 502 })
  }
}
