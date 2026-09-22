export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/proxy/')) {
      return new Response('CF Proxy (US via DO) is running.', { status: 200 });
    }
    const id = env.PROXY_DO.idFromName('us-proxy');
    const stub = env.PROXY_DO.get(id, { locationHint: 'enam' });
    return stub.fetch(request);
  },
};

export class ProxyDO {
  constructor(state, env) { this.state = state; }
  async fetch(request) {
    const url = new URL(request.url);
    const rest = url.pathname.slice('/proxy/'.length);
    const slashIdx = rest.indexOf('/');
    const targetHost = slashIdx === -1 ? rest : rest.slice(0, slashIdx);
    const targetPath = slashIdx === -1 ? '/' : rest.slice(slashIdx);
    const targetUrl = new URL('https://' + targetHost + targetPath + url.search);

    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', targetHost);
    ['cf-connecting-ip','cf-ipcountry','cf-ray','cf-visitor','x-forwarded-proto','x-real-ip']
      .forEach(h => newHeaders.delete(h));

    const init = { method: request.method, headers: newHeaders, redirect: 'manual' };
    if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;
    return fetch(targetUrl, init);
  },
}
