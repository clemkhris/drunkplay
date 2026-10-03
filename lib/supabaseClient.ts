// Same-origin CloudBase adapter. No database credential is sent to the browser.
export interface AppUser { id: string; email: string; user_metadata: { username: string } }
interface GameRecord { id: number; title: string; duration: string; setup: string; tools: string; description: string; winning_conditions: string; players: string; video: string; scene: string; dimensions: string[]; score: number; image: string }
interface CocktailRecord { id: number; name: string; category: string; main_alcohol: string; materials: string[]; steps: string[]; taste: string; strength: number; difficulty: string; image: string; tips: string }
interface RatingRecord { rating: number; game_id: number; user_id: string }
type Tables = { games: GameRecord; cocktails: CocktailRecord; game_ratings: RatingRecord };
type Result<T> = { data: T | null; count: number | null; error: { message: string } | null };
async function request<T>(operation: string, body: object = {}): Promise<Result<T>> {
  try {
    const response = await fetch(`/drunkplay/api/${operation}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
    return await response.json();
  } catch { return { data: null, count: null, error: { message: '网络连接失败，请稍后重试' } }; }
}
class Query<T> implements PromiseLike<Result<T[]>> {
  private filters: Record<string, unknown> = {};
  private value?: object;
  constructor(private table: keyof Tables) {}
  select(_fields = '*', _options?: { count: string }) { return this; }
  eq(key: string, value: unknown) { this.filters[key] = value; return this; }
  insert(value: object) { this.value = value; return this; }
  async maybeSingle(): Promise<Result<T>> {
    const result = await this.run(); return { ...result, data: result.data?.[0] ?? null };
  }
  private run() { return request<T[]>('query', { table: this.table, filters: this.filters, insert: this.value }); }
  then<TResult1 = Result<T[]>, TResult2 = never>(onfulfilled?: ((value: Result<T[]>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> { return this.run().then(onfulfilled, onrejected); }
}
const listeners = new Set<(event: string, session: { user: AppUser } | null) => void>();
const emit = (user: AppUser | null) => listeners.forEach(fn => fn(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null));
export const supabase = {
  from<K extends keyof Tables>(table: K) { return new Query<Tables[K]>(table); },
  auth: {
    async getUser() { const r = await request<AppUser>('user'); return { data: { user: r.data }, error: r.error }; },
    onAuthStateChange(fn: (event: string, session: { user: AppUser } | null) => void) { listeners.add(fn); return { data: { subscription: { unsubscribe: () => { listeners.delete(fn); } } } }; },
    async signInWithPassword(value: { email: string; password: string }) { const r = await request<AppUser>('login', value); if (r.data) emit(r.data); return r; },
    async signUp(value: { email: string; password: string; options: { data: { username: string } } }) { const r = await request<AppUser>('signup', { email: value.email, password: value.password, username: value.options.data.username }); if (r.data) emit(r.data); return r; },
    async signOut() { const r = await request<null>('logout'); if (!r.error) emit(null); return r; }
  },
  storage: {
    from(_bucket: string) { return {
      async upload(_path: string, file: File) {
        if (file.size > 2 * 1024 * 1024) return { data: null, error: { message: '图片不能超过 2 MB' } };
        const data = new Uint8Array(await file.arrayBuffer()); let binary = ''; for (const byte of data) binary += String.fromCharCode(byte);
        return request<{ path: string }>('upload', { mime: file.type, data: btoa(binary) });
      },
      getPublicUrl(path: string) { return { data: { publicUrl: path } }; }
    }; }
  }
};
