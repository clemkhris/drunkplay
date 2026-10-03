import 'server-only';
export async function rpc<T>(op: string, body: object = {}): Promise<T> {
  const env = process.env.CLOUDBASE_ENV_ID;
  const key = process.env.CLOUDBASE_APIKEY;
  if (!env || !key) throw new Error('DATABASE_CONFIG_MISSING');
  const response = await fetch(`https://${env}.api.tcloudbasegateway.com/v1/rdb/rest/rpc/drunkplay_rpc`, {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_op: op, p_body: body }), cache: 'no-store', signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    const code = (await response.json().catch(() => ({}))).code;
    throw new Error(code === '23505' ? 'DUPLICATE' : 'DATABASE_REQUEST_FAILED');
  }
  return response.json();
}
