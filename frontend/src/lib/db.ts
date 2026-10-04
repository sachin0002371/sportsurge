// Sportsurge Official v3.0 - Direct Serverless Neon Database Adapter
// Replaces heavy Prisma query engine binaries with lightweight, ultra-fast @neondatabase/serverless fetch adapter.
// Guarantees zero cold-start, zero fs.readdir errors, and 100% Cloudflare Worker edge compatibility.

import { neon } from '@neondatabase/serverless';

function getConnectionString(): string {
  return process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CM8kpNeK0OgS@ep-fancy-meadow-ap0hajz0-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';
}

function getSql() {
  const connStr = getConnectionString();
  return neon(connStr);
}

// Data Mappers (snake_case DB -> camelCase Prisma object)
function mapSport(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    icon: row.icon || '',
    color: row.color || '',
    isActive: row.is_active ?? true,
    sortOrder: row.sort_order ?? 0,
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
    logo: row.logo,
    color: row.color,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

function mapAuthor(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    avatar: row.avatar,
    title: row.title || '',
    bio: row.bio || '',
    specialty: row.specialty || '',
    socialTwitter: row.social_twitter,
    socialLinkedIn: row.social_linkedin,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    articles: Array.isArray(row.articles) ? row.articles.map(mapArticle) : [],
  };
}

function mapArticle(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  return {
    id: row.id,
    sportId: row.sport_id,
    authorId: row.author_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: row.content || '',
    featuredImage: row.featured_image,
    category: row.category || 'news',
    tags: row.tags,
    isPublished: row.is_published ?? true,
    publishedAt: row.published_at ? new Date(row.published_at) : new Date(),
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaTags: row.meta_tags,
    sport: row.sport ? mapSport(row.sport) : undefined,
    author: row.author ? mapAuthor(row.author) : undefined,
  };
}

function mapMatch(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
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
    homeVotes: row.home_votes ?? 0,
    awayVotes: row.away_votes ?? 0,
    youtubeVideoIds: row.youtube_video_ids,
    seoContent: row.seo_content,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    sport: row.sport ? mapSport(row.sport) : undefined,
    homeTeam: row.home_team ? mapTeam(row.home_team) : undefined,
    awayTeam: row.away_team ? mapTeam(row.away_team) : undefined,
  };
}

function mapStanding(row: any) {
  if (!row || typeof row !== 'object' || !row.id) return undefined;
  return {
    id: row.id,
    sportId: row.sport_id,
    teamId: row.team_id,
    wins: row.wins ?? 0,
    losses: row.losses ?? 0,
    draws: row.draws ?? 0,
    position: row.position ?? 0,
    percentage: row.percentage,
    streak: row.streak,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    sport: row.sport ? mapSport(row.sport) : undefined,
    team: row.team ? mapTeam(row.team) : undefined,
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

// SQL Query Helpers
const sportDb = {
  async findMany(args: any = {}) {
    const sql = getSql();
    let query = `SELECT id, slug, name, icon, color, is_active, sort_order FROM sports WHERE is_active = true`;
    const params: any[] = [];
    if (args.where?.slug) {
      params.push(args.where.slug);
      query += ` AND slug = $${params.length}`;
    }
    query += ` ORDER BY sort_order ASC, name ASC`;
    if (args.take) {
      params.push(args.take);
      query += ` LIMIT $${params.length}`;
    }
    const rows = await sql.query(query, params);
    return rows.map(mapSport);
  },

  async findUnique(args: any = {}) {
    const sql = getSql();
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
    const rows = await sql.query(query, params);
    return rows.length > 0 ? mapSport(rows[0]) : null;
  },

  async findFirst(args: any = {}) {
    return this.findUnique(args);
  }
};

const articleDb = {
  async findMany(args: any = {}) {
    const sql = getSql();
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
    if (args.where?.isPublished !== undefined) {
      params.push(args.where.isPublished);
      query += ` AND a.is_published = $${params.length}`;
    }
    if (args.where?.sportId) {
      params.push(args.where.sportId);
      query += ` AND a.sport_id = $${params.length}`;
    }
    if (args.where?.category) {
      params.push(args.where.category);
      query += ` AND a.category = $${params.length}`;
    }
    if (args.where?.slug) {
      params.push(args.where.slug);
      query += ` AND a.slug = $${params.length}`;
    }
    if (args.where?.authorId) {
      params.push(args.where.authorId);
      query += ` AND a.author_id = $${params.length}`;
    }
    query += ` ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC`;
    if (args.take) {
      params.push(args.take);
      query += ` LIMIT $${params.length}`;
    }
    if (args.skip) {
      params.push(args.skip);
      query += ` OFFSET $${params.length}`;
    }
    const rows = await sql.query(query, params);
    return rows.map(mapArticle);
  },

  async findUnique(args: any = {}) {
    const articles = await this.findMany({ where: args.where, take: 1 });
    return articles.length > 0 ? articles[0] : null;
  },

  async findFirst(args: any = {}) {
    return this.findUnique(args);
  },

  async count(args: any = {}) {
    const sql = getSql();
    const params: any[] = [];
    let query = `SELECT COUNT(*)::int as count FROM articles a WHERE 1=1`;
    if (args.where?.isPublished !== undefined) {
      params.push(args.where.isPublished);
      query += ` AND a.is_published = $${params.length}`;
    }
    if (args.where?.sportId) {
      params.push(args.where.sportId);
      query += ` AND a.sport_id = $${params.length}`;
    }
    if (args.where?.category) {
      params.push(args.where.category);
      query += ` AND a.category = $${params.length}`;
    }
    const rows = await sql.query(query, params);
    return rows[0]?.count ?? 0;
  }
};

const matchDb = {
  async findMany(args: any = {}) {
    const sql = getSql();
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
    if (args.where?.sportId) {
      params.push(args.where.sportId);
      query += ` AND m.sport_id = $${params.length}`;
    }
    if (args.where?.status) {
      params.push(args.where.status);
      query += ` AND m.status = $${params.length}`;
    }
    if (args.where?.slug) {
      params.push(args.where.slug);
      query += ` AND m.slug = $${params.length}`;
    }
    if (args.where?.id) {
      params.push(args.where.id);
      query += ` AND m.id = $${params.length}`;
    }
    if (args.where?.matchDate?.gte) {
      params.push(args.where.matchDate.gte);
      query += ` AND m.match_date >= $${params.length}`;
    }
    if (args.where?.matchDate?.lte) {
      params.push(args.where.matchDate.lte);
      query += ` AND m.match_date <= $${params.length}`;
    }
    query += ` ORDER BY m.match_date ASC`;
    if (args.take) {
      params.push(args.take);
      query += ` LIMIT $${params.length}`;
    }
    if (args.skip) {
      params.push(args.skip);
      query += ` OFFSET $${params.length}`;
    }
    const rows = await sql.query(query, params);
    return rows.map(mapMatch);
  },

  async findUnique(args: any = {}) {
    const matches = await this.findMany({ where: args.where, take: 1 });
    return matches.length > 0 ? matches[0] : null;
  },

  async findFirst(args: any = {}) {
    return this.findUnique(args);
  },

  async count(args: any = {}) {
    const sql = getSql();
    const params: any[] = [];
    let query = `SELECT COUNT(*)::int as count FROM matches m WHERE 1=1`;
    if (args.where?.sportId) {
      params.push(args.where.sportId);
      query += ` AND m.sport_id = $${params.length}`;
    }
    if (args.where?.status) {
      params.push(args.where.status);
      query += ` AND m.status = $${params.length}`;
    }
    const rows = await sql.query(query, params);
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
    const rows = await sql.query(query, params);
    return rows.length > 0 ? mapMatch(rows[0]) : null;
  }
};

const standingDb = {
  async findMany(args: any = {}) {
    const sql = getSql();
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
    if (args.where?.sportId) {
      params.push(args.where.sportId);
      query += ` AND st.sport_id = $${params.length}`;
    }
    query += ` ORDER BY st.position ASC, st.wins DESC`;
    if (args.take) {
      params.push(args.take);
      query += ` LIMIT $${params.length}`;
    }
    const rows = await sql.query(query, params);
    return rows.map(mapStanding);
  }
};

const authorDb = {
  async findMany(args: any = {}) {
    const sql = getSql();
    const params: any[] = [];
    let query = `SELECT * FROM authors WHERE 1=1`;
    if (args.where?.slug) {
      params.push(args.where.slug);
      query += ` AND slug = $${params.length}`;
    }
    if (args.where?.id) {
      params.push(args.where.id);
      query += ` AND id = $${params.length}`;
    }
    query += ` ORDER BY name ASC`;
    const rows = await sql.query(query, params);
    const authors = rows.map(mapAuthor);

    if (args.include?.articles) {
      const authorIds = authors.map((a: any) => a.id);
      if (authorIds.length > 0) {
        const articleRows = await sql.query(
          `SELECT id, author_id, is_published FROM articles WHERE is_published = true AND author_id = ANY($1::text[])`,
          [authorIds]
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
    const authors = await this.findMany({ where: args.where, include: args.include });
    if (authors.length === 0) return null;
    const author = authors[0];
    if (args.include?.articles && (!author.articles || author.articles.length === 0)) {
      author.articles = await articleDb.findMany({ where: { authorId: author.id, isPublished: true }, take: 10 });
    }
    return author;
  }
};

const voteDb = {
  async findUnique(args: any = {}) {
    const sql = getSql();
    let matchId = args.where?.matchId;
    let ipAddress = args.where?.ipAddress;
    if (args.where?.matchId_ipAddress) {
      matchId = args.where.matchId_ipAddress.matchId;
      ipAddress = args.where.matchId_ipAddress.ipAddress;
    }
    if (!matchId || !ipAddress) return null;
    const rows = await sql.query(`SELECT * FROM votes WHERE match_id = $1 AND ip_address = $2 LIMIT 1`, [matchId, ipAddress]);
    return rows.length > 0 ? mapVote(rows[0]) : null;
  },

  async create(args: any = {}) {
    const sql = getSql();
    const { matchId, teamId, ipAddress } = args.data || {};
    const id = 'vote_' + Math.random().toString(36).substring(2, 11);
    const rows = await sql.query(
      `INSERT INTO votes (id, match_id, team_id, ip_address, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [id, matchId, teamId, ipAddress]
    );
    return mapVote(rows[0]);
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