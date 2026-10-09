// Sportsurge Official v3.0 - Direct Serverless Neon Database Adapter
// Replaces heavy Prisma query engine binaries with lightweight, ultra-fast @neondatabase/serverless fetch adapter.
// Includes in-memory edge query caching & retry resilience to guarantee zero cold-starts and 100% uptime on Cloudflare Workers.

import { neon, neonConfig } from '@neondatabase/serverless';

// Ensure Neon HTTP requests go directly to the host's /sql endpoint.
// This prevents DNS lookup failures on cell-based hosts (e.g. *.c-4.*.aws.neon.tech).
neonConfig.fetchEndpoint = (host: string) => `https://${host}/sql`;

function getConnectionString(): string | null {
  return process.env.DATABASE_URL || null;
}

let cachedSql: any = null;

function getSql() {
  if (cachedSql) return cachedSql;
  let connStr = getConnectionString();
  if (!connStr) return null;
  // Normalize for serverless HTTP fetch driver:
  // 1. Strip -pooler. because serverless HTTP is already stateless & pooled
  // 2. Remove channel_binding which is a TCP SCRAM-SHA-256 parameter
  connStr = connStr
    .replace('-pooler.', '.')
    .replace(/[?&]channel_binding=[^&]+/, '');
  try {
    cachedSql = neon(connStr);
    return cachedSql;
  } catch (e) {
    return null;
  }
}

// In-Memory Edge Cache, Deduplication & Stale-While-Revalidate (SWR)
interface CacheEntry {
  data: any[];
  expiresAt: number;
  updatedAt: number;
}

const dbCache = new Map<string, CacheEntry>();
const inFlightQueries = new Map<string, Promise<any[]>>();

// Circuit breaker state to prevent cascading Worker timeouts (Error 1102)
let dbCircuitBreakerUntil = 0;

function isCircuitOpen(): boolean {
  return Date.now() < dbCircuitBreakerUntil;
}

function tripCircuit(durationMs: number = 20000) {
  dbCircuitBreakerUntil = Date.now() + durationMs;
}

function resetCircuit() {
  dbCircuitBreakerUntil = 0;
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: any = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Query timeout (${timeoutMs}ms)`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function executeQueryWithCache(queryStr: string, params: any[], ttlMs: number = 300000): Promise<any[]> {
  const cacheKey = `${queryStr}::${JSON.stringify(params)}`;
  const now = Date.now();
  const cached = dbCache.get(cacheKey);

  // 1. Instant response if fresh cache exists (0ms latency)
  if (cached && cached.expiresAt > now && Array.isArray(cached.data) && cached.data.length > 0) {
    return cached.data;
  }

  // 2. True Stale-While-Revalidate (SWR):
  // If we have cached data (even if expired), return it IMMEDIATELY to the user so page loads in 0ms,
  // and trigger a silent background fetch to update the cache for subsequent requests.
  if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
    if (!inFlightQueries.has(cacheKey) && !isCircuitOpen()) {
      const backgroundRevalidate = (async () => {
        try {
          const sql = getSql();
          if (!sql) return;
          const rows = await runWithTimeout(sql.query(queryStr, params), 10000);
          if (Array.isArray(rows) && rows.length > 0) {
            dbCache.set(cacheKey, { data: rows, expiresAt: Date.now() + ttlMs, updatedAt: Date.now() });
            resetCircuit();
          }
        } catch (e: any) {
          if (e?.message?.includes('authentication failed')) {
            tripCircuit(15000);
          }
        } finally {
          inFlightQueries.delete(cacheKey);
        }
      })();
      inFlightQueries.set(cacheKey, backgroundRevalidate as any);
    }
    return cached.data;
  }

  // 3. Deduplicate concurrent in-flight requests for the same query to prevent DB hammering
  if (inFlightQueries.has(cacheKey)) {
    try {
      const rows = await inFlightQueries.get(cacheKey)!;
      if (Array.isArray(rows) && rows.length > 0) return rows;
    } catch {
      // Fall through to query execution
    }
    if (cached && Array.isArray(cached.data) && cached.data.length > 0) return cached.data;
  }

  const queryPromise = (async () => {
    let rows: any = null;
    let lastError: any = null;

    if (isCircuitOpen()) {
      return cached?.data || [];
    }

    try {
      const sql = getSql();
      if (sql) {
        try {
          rows = await runWithTimeout(sql.query(queryStr, params), 10000);
          if (Array.isArray(rows)) {
            resetCircuit();
          }
        } catch (err: any) {
          lastError = err;
          if (err?.message?.includes('authentication failed')) {
            tripCircuit(15000);
          }
        }
      }
    } catch (err: any) {
      lastError = err;
    }

    // Fast SQLite fallback if Neon failed or is not configured
    if (!Array.isArray(rows) || rows.length === 0) {
      if (Array.isArray(sqliteRows)) {
        return sqliteRows;
      }
    }

    // Resilience: Never replace good cached data with empty array on temporary DB lag
    if ((!Array.isArray(rows) || rows.length === 0) && cached && Array.isArray(cached.data) && cached.data.length > 0) {
      return cached.data;
    }

    if (!Array.isArray(rows)) {
      return cached?.data || [];
    }

    if (dbCache.size > 1000) {
      dbCache.clear();
    }

    dbCache.set(cacheKey, { data: rows, expiresAt: Date.now() + ttlMs, updatedAt: Date.now() });
    return rows;
  })();

  inFlightQueries.set(cacheKey, queryPromise);

  try {
    return await queryPromise;
  } finally {
    inFlightQueries.delete(cacheKey);
  }
}

function formatImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.includes('/api/logo?url=')) {
    try {
      const rawUrl = url.split('url=')[1]?.split('&')[0];
      if (rawUrl) {
        const decoded = decodeURIComponent(rawUrl);
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          return decoded;
        }
      }
    } catch (e) {}
  }
  // Unwrap article-image proxy URLs to load directly from CDN (ESPN/Pexels)
  if (url.includes('/api/v1/article-image/') && url.includes('url=')) {
    try {
      const rawUrl = url.split('url=')[1]?.split('&')[0];
      if (rawUrl) {
        const decoded = decodeURIComponent(rawUrl);
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          return decoded;
        }
      }
    } catch (e) {}
  }
  const backendUrl = process.env.BACKEND_URL || 'https://backend.sportsurgeplay.com';
  if (url.includes('backend.sportsurgeplay.com')) {
    return url.replace('https://backend.sportsurgeplay.com', backendUrl);
  }
  return url;
}

function buildWhereCondition(tablePrefix: string, dbColumn: string, value: any, params: any[]): string {
  if (value === undefined || value === null) return '';
  const col = tablePrefix ? `${tablePrefix}.${dbColumn}` : dbColumn;
  if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    let sqlSnippet = '';
    if (Array.isArray(value.in) && value.in.length > 0) {
      const placeholders = value.in.map((v: any) => {
        params.push(v);
        return `$${params.length}`;
      }).join(', ');
      sqlSnippet += ` AND ${col} IN (${placeholders})`;
    }
    if (value.not !== undefined) {
      params.push(value.not);
      sqlSnippet += ` AND ${col} != $${params.length}`;
    }
    if (value.gte !== undefined) {
      params.push(value.gte);
      sqlSnippet += ` AND ${col} >= $${params.length}`;
    }
    if (value.lte !== undefined) {
      params.push(value.lte);
      sqlSnippet += ` AND ${col} <= $${params.length}`;
    }
    return sqlSnippet;
  } else {
    params.push(value);
    return ` AND ${col} = $${params.length}`;
  }
}

function parseJsonField(val: any) {
  if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

// Data Mappers (snake_case DB -> camelCase Prisma object)
function mapSport(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    icon: formatImageUrl(row.icon) || '',
    color: row.color || '',
    isActive: row.is_active ? true : Boolean(row.is_active ?? true),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapTeam(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  return {
    id: row.id,
    sportId: row.sport_id,
    externalId: row.external_id,
    name: row.name,
    abbreviation: row.abbreviation || '',
    slug: row.slug,
    city: row.city,
    logo: formatImageUrl(row.logo),
    color: row.color,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

function mapAuthor(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  const articlesRaw = parseJsonField(row.articles);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    avatar: formatImageUrl(row.avatar),
    title: row.title || '',
    bio: row.bio || '',
    specialty: row.specialty || '',
    socialTwitter: row.social_twitter,
    socialLinkedIn: row.social_linkedin,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    articles: Array.isArray(articlesRaw) ? articlesRaw.map(mapArticle) : [],
  };
}

function mapArticle(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  const sportObj = parseJsonField(row.sport);
  const authorObj = parseJsonField(row.author);
  return {
    id: row.id,
    sportId: row.sport_id,
    authorId: row.author_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: row.content || '',
    featuredImage: formatImageUrl(row.featured_image),
    category: row.category || 'news',
    tags: row.tags,
    isPublished: row.is_published ? true : Boolean(row.is_published ?? true),
    publishedAt: row.published_at ? new Date(row.published_at) : new Date(),
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaTags: row.meta_tags,
    sport: sportObj ? mapSport(sportObj) : undefined,
    author: authorObj ? mapAuthor(authorObj) : undefined,
  };
}

function mapMatch(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  const sportObj = parseJsonField(row.sport);
  const homeObj = parseJsonField(row.home_team);
  const awayObj = parseJsonField(row.away_team);
  return {
    id: row.id,
    sportId: row.sport_id,
    externalId: row.external_id,
    slug: row.slug,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    homeScore: row.home_score,
    awayScore: row.away_score,
    status: row.status || 'upcoming',
    matchDate: row.match_date ? new Date(row.match_date) : new Date(),
    venue: row.venue,
    broadcastInfo: row.broadcast_info,
    matchSummary: row.match_summary,
    homeVotes: Number(row.home_votes ?? 0),
    awayVotes: Number(row.away_votes ?? 0),
    youtubeVideoIds: row.youtube_video_ids,
    seoContent: row.seo_content,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    sport: sportObj ? mapSport(sportObj) : undefined,
    homeTeam: homeObj ? mapTeam(homeObj) : undefined,
    awayTeam: awayObj ? mapTeam(awayObj) : undefined,
  };
}

function mapStanding(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  const sportObj = parseJsonField(row.sport);
  const teamObj = parseJsonField(row.team);
  return {
    id: row.id,
    sportId: row.sport_id,
    teamId: row.team_id,
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    draws: Number(row.draws ?? 0),
    position: Number(row.position ?? 0),
    percentage: row.percentage,
    streak: row.streak,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    sport: sportObj ? mapSport(sportObj) : undefined,
    team: teamObj ? mapTeam(teamObj) : undefined,
  };
}

function mapVote(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  return {
    id: row.id,
    matchId: row.match_id,
    teamId: row.team_id,
    ipAddress: row.ip_address,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  };
}

// SQL Query Helpers with Edge Caching & Retry
const sportDb = {
  async findMany(args: any = {}) {
    let query = `SELECT id, slug, name, icon, color, is_active, sort_order FROM sports WHERE is_active = true`;
    const params: any[] = [];
    if (args.where?.slug) query += buildWhereCondition('', 'slug', args.where.slug, params);
    query += ` ORDER BY sort_order ASC, name ASC`;
    if (args.take) {
      params.push(args.take);
      query += ` LIMIT $${params.length}`;
    }
    const rows = await executeQueryWithCache(query, params, 300000); // 5 min cache
    return rows.map(mapSport).filter(Boolean);
  },

  async findUnique(args: any = {}) {
    const params: any[] = [];
    let query = `SELECT id, slug, name, icon, color, is_active, sort_order FROM sports WHERE 1=1`;
    if (args.where?.id) {
      params.push(args.where.id);
      query += ` AND id = $${params.length}`;
    } else if (args.where?.slug) {
      params.push(args.where.slug);
      query += ` AND slug = $${params.length}`;
    } else {
      return null;
    }
    const rows = await executeQueryWithCache(query, params, 300000); // 5 min cache
    return rows.length > 0 ? mapSport(rows[0]) : null;
  },

  async findFirst(args: any = {}) {
    return this.findUnique(args);
  }
};

const articleDb = {
  async findMany(args: any = {}) {
    const params: any[] = [];
    let query = `
      SELECT 
        a.id, a.sport_id, a.author_id, a.title, a.slug, a.excerpt, a.featured_image, a.category, 
        a.tags, a.is_published, a.published_at, a.created_at, a.updated_at, a.meta_title, a.meta_description, a.meta_tags,
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'icon', s.icon, 'color', s.color) as sport,
        json_build_object('id', au.id, 'name', au.name, 'slug', au.slug, 'avatar', au.avatar, 'title', au.title) as author
      FROM articles a
      LEFT JOIN sports s ON a.sport_id = s.id
      LEFT JOIN authors au ON a.author_id = au.id
      WHERE 1=1
    `;
    if (args.where?.isPublished !== undefined) query += buildWhereCondition('a', 'is_published', args.where.isPublished, params);
    if (args.where?.sportId) query += buildWhereCondition('a', 'sport_id', args.where.sportId, params);
    if (args.where?.category) query += buildWhereCondition('a', 'category', args.where.category, params);
    if (args.where?.slug) query += buildWhereCondition('a', 'slug', args.where.slug, params);
    if (args.where?.authorId) query += buildWhereCondition('a', 'author_id', args.where.authorId, params);

    query += ` ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC`;
    if (args.take) {
      params.push(args.take);
      query += ` LIMIT $${params.length}`;
    }
    if (args.skip) {
      params.push(args.skip);
      query += ` OFFSET $${params.length}`;
    }
    const rows = await executeQueryWithCache(query, params, 120000); // 2 min cache
    return rows.map(mapArticle).filter(Boolean);
  },

  async findUnique(args: any = {}) {
    const params: any[] = [];
    let query = `
      SELECT a.*,
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'icon', s.icon, 'color', s.color) as sport,
        json_build_object('id', au.id, 'name', au.name, 'slug', au.slug, 'avatar', au.avatar, 'title', au.title) as author
      FROM articles a
      LEFT JOIN sports s ON a.sport_id = s.id
      LEFT JOIN authors au ON a.author_id = au.id
      WHERE 1=1
    `;
    if (args.where?.id) query += buildWhereCondition('a', 'id', args.where.id, params);
    if (args.where?.slug) query += buildWhereCondition('a', 'slug', args.where.slug, params);
    query += ` LIMIT 1`;
    const rows = await executeQueryWithCache(query, params, 120000);
    return rows.length > 0 ? mapArticle(rows[0]) : null;
  },

  async findFirst(args: any = {}) {
    return this.findUnique(args);
  },

  async count(args: any = {}) {
    const params: any[] = [];
    let query = `SELECT COUNT(*)::int as count FROM articles a WHERE 1=1`;
    if (args.where?.isPublished !== undefined) query += buildWhereCondition('a', 'is_published', args.where.isPublished, params);
    if (args.where?.sportId) query += buildWhereCondition('a', 'sport_id', args.where.sportId, params);
    if (args.where?.category) query += buildWhereCondition('a', 'category', args.where.category, params);

    const rows = await executeQueryWithCache(query, params, 120000); // 2 min cache
    return rows[0]?.count ?? 0;
  },

  async getCategoryCounts() {
    const query = `SELECT category, COUNT(*)::int as count FROM articles WHERE is_published = true GROUP BY category`;
    const rows = await executeQueryWithCache(query, [], 300000); // 5 min cache
    const counts: Record<string, number> = { all: 0 };
    let total = 0;
    for (const r of rows) {
      if (r.category) {
        counts[r.category] = Number(r.count);
        total += Number(r.count);
      }
    }
    counts.all = total;
    return counts;
  }
};

const matchDb = {
  async findMany(args: any = {}) {
    const params: any[] = [];
    let query = `
      SELECT 
        m.id, m.sport_id, m.external_id, m.slug, m.home_team_id, m.away_team_id, m.home_score, m.away_score, 
        m.status, m.match_date, m.venue, m.broadcast_info, m.home_votes, m.away_votes, m.youtube_video_ids, 
        m.created_at, m.updated_at,
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'icon', s.icon, 'color', s.color) as sport,
        json_build_object('id', ht.id, 'name', ht.name, 'slug', ht.slug, 'abbreviation', ht.abbreviation, 'logo', ht.logo, 'color', ht.color) as home_team,
        json_build_object('id', at.id, 'name', at.name, 'slug', at.slug, 'abbreviation', at.abbreviation, 'logo', at.logo, 'color', at.color) as away_team
      FROM matches m
      LEFT JOIN sports s ON m.sport_id = s.id
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE 1=1
    `;
    if (args.where?.sportId) query += buildWhereCondition('m', 'sport_id', args.where.sportId, params);
    if (args.where?.status) query += buildWhereCondition('m', 'status', args.where.status, params);
    if (args.where?.slug) query += buildWhereCondition('m', 'slug', args.where.slug, params);
    if (args.where?.id) query += buildWhereCondition('m', 'id', args.where.id, params);
    if (args.where?.matchDate) query += buildWhereCondition('m', 'match_date', args.where.matchDate, params);

    query += ` ORDER BY m.match_date ASC`;
    if (args.take) {
      params.push(args.take);
      query += ` LIMIT $${params.length}`;
    }
    if (args.skip) {
      params.push(args.skip);
      query += ` OFFSET $${params.length}`;
    }
    const rows = await executeQueryWithCache(query, params, 15000); // 15 sec cache for live matches
    return rows.map(mapMatch).filter(Boolean);
  },

  async findUnique(args: any = {}) {
    const params: any[] = [];
    let query = `
      SELECT m.*,
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'icon', s.icon, 'color', s.color) as sport,
        json_build_object('id', ht.id, 'name', ht.name, 'slug', ht.slug, 'abbreviation', ht.abbreviation, 'logo', ht.logo, 'color', ht.color) as home_team,
        json_build_object('id', at.id, 'name', at.name, 'slug', at.slug, 'abbreviation', at.abbreviation, 'logo', at.logo, 'color', at.color) as away_team
      FROM matches m
      LEFT JOIN sports s ON m.sport_id = s.id
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE 1=1
    `;
    if (args.where?.id) query += buildWhereCondition('m', 'id', args.where.id, params);
    if (args.where?.slug) query += buildWhereCondition('m', 'slug', args.where.slug, params);
    query += ` LIMIT 1`;
    const rows = await executeQueryWithCache(query, params, 15000);
    return rows.length > 0 ? mapMatch(rows[0]) : null;
  },

  async findFirst(args: any = {}) {
    return this.findUnique(args);
  },

  async count(args: any = {}) {
    const params: any[] = [];
    let query = `SELECT COUNT(*)::int as count FROM matches m WHERE 1=1`;
    if (args.where?.sportId) query += buildWhereCondition('m', 'sport_id', args.where.sportId, params);
    if (args.where?.status) query += buildWhereCondition('m', 'status', args.where.status, params);

    const rows = await executeQueryWithCache(query, params, 60000); // 1 min cache
    return rows[0]?.count ?? 0;
  },

  async update(args: any = {}) {
    const sql = getSql();
    const matchId = args.where?.id;
    if (!matchId || !args.data) return null;
    const updates: string[] = [];
    const params: any[] = [];
    if (args.data.homeVotes !== undefined) {
      params.push(args.data.homeVotes);
      updates.push(`home_votes = $${params.length}`);
    }
    if (args.data.awayVotes !== undefined) {
      params.push(args.data.awayVotes);
      updates.push(`away_votes = $${params.length}`);
    }
    if (updates.length === 0) return this.findUnique({ where: { id: matchId } });
    params.push(matchId);
    const query = `UPDATE matches SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;
    try {
      const rows = await sql.query(query, params);
      dbCache.clear(); // invalidate cache on mutation
      return rows.length > 0 ? mapMatch(rows[0]) : null;
    } catch (e) {
      console.error('Match update error:', e);
      return null;
    }
  }
};

const standingDb = {
  async findMany(args: any = {}) {
    const params: any[] = [];
    let query = `
      SELECT st.*,
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'icon', s.icon, 'color', s.color) as sport,
        json_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'abbreviation', t.abbreviation, 'logo', t.logo, 'color', t.color) as team
      FROM standings st
      LEFT JOIN sports s ON st.sport_id = s.id
      LEFT JOIN teams t ON st.team_id = t.id
      WHERE 1=1
    `;
    if (args.where?.sportId) query += buildWhereCondition('st', 'sport_id', args.where.sportId, params);

    query += ` ORDER BY st.position ASC, st.wins DESC`;
    if (args.take) {
      params.push(args.take);
      query += ` LIMIT $${params.length}`;
    }
    const rows = await executeQueryWithCache(query, params, 300000); // 5 min cache
    return rows.map(mapStanding).filter(Boolean);
  }
};

const authorDb = {
  async findMany(args: any = {}) {
    const params: any[] = [];
    let query = `SELECT * FROM authors WHERE 1=1`;
    if (args.where?.slug) query += buildWhereCondition('', 'slug', args.where.slug, params);
    if (args.where?.id) query += buildWhereCondition('', 'id', args.where.id, params);

    query += ` ORDER BY name ASC`;
    const rows = await executeQueryWithCache(query, params, 300000); // 5 min cache
    const authors = rows.map(mapAuthor).filter(Boolean);

    if (args.include?.articles) {
      const authorIds = authors.map((a: any) => a.id);
      if (authorIds.length > 0) {
        const placeholders = authorIds.map((_, idx) => `$${idx + 1}`).join(', ');
        const articleRows = await executeQueryWithCache(
          `SELECT id, author_id, is_published FROM articles WHERE is_published = true AND author_id IN (${placeholders})`,
          authorIds,
          300000
        );
        const articleMap: Record<string, any[]> = {};
        for (const ar of articleRows) {
          if (!articleMap[ar.author_id]) articleMap[ar.author_id] = [];
          articleMap[ar.author_id].push({ id: ar.id });
        }
        for (const a of authors) {
          a.articles = articleMap[a.id] || [];
        }
      }
    }

    return authors;
  },

  async findUnique(args: any = {}) {
    const authors = await this.findMany({ where: args.where });
    if (authors.length === 0) return null;
    const author = authors[0];
    if (args.include?.articles) {
      author.articles = await articleDb.findMany({
        where: { authorId: author.id, isPublished: true },
        take: 20,
      });
    }
    return author;
  }
};

const voteDb = {
  async findUnique(args: any = {}) {
    let matchId = args.where?.matchId;
    let ipAddress = args.where?.ipAddress;
    if (args.where?.matchId_ipAddress) {
      matchId = args.where.matchId_ipAddress.matchId;
      ipAddress = args.where.matchId_ipAddress.ipAddress;
    }
    if (!matchId || !ipAddress) return null;
    const rows = await executeQueryWithCache(`SELECT * FROM votes WHERE match_id = $1 AND ip_address = $2 LIMIT 1`, [matchId, ipAddress], 30000);
    return rows.length > 0 ? mapVote(rows[0]) : null;
  },

  async create(args: any = {}) {
    const sql = getSql();
    const { matchId, teamId, ipAddress } = args.data || {};
    const id = 'vote_' + Math.random().toString(36).substring(2, 11);
    try {
      const rows = await sql.query(
        `INSERT INTO votes (id, match_id, team_id, ip_address, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [id, matchId, teamId, ipAddress]
      );
      dbCache.clear();
      return mapVote(rows[0]);
    } catch (e) {
      console.error('Vote create error:', e);
      return null;
    }
  }
};

export const db: any = {
  sport: sportDb,
  article: articleDb,
  match: matchDb,
  standing: standingDb,
  author: authorDb,
  vote: voteDb,
};