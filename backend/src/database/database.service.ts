import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Node 22 built-in synchronous SQLite
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = require('node:sqlite');

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private sqliteDb: any = null;
  private isPostgres = false;
  private pgClient: any = null;

  async onModuleInit() {
    await this.initDatabase();
  }

  private async initDatabase() {
    const pgUrl = process.env.DATABASE_URL;
    if (pgUrl && pgUrl.startsWith('postgres')) {
      try {
        const { Client } = await import('pg');
        this.pgClient = new Client({ connectionString: pgUrl });
        await this.pgClient.connect();
        this.isPostgres = true;
        this.logger.log('Connected to PostgreSQL database with PostGIS support');
        await this.createPostgresTables();
        return;
      } catch (err) {
        this.logger.warn(`PostgreSQL connection failed (${(err as Error).message}), falling back to SQLite storage.`);
      }
    }

    // Default to zero-config local SQLite
    const backendDataDir = path.resolve(process.cwd(), 'backend', 'data');
    const localDataDir = path.resolve(process.cwd(), 'data');
    const dataDir = fs.existsSync(path.resolve(process.cwd(), 'backend')) ? backendDataDir : localDataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'surplus_food.db');
    this.sqliteDb = new DatabaseSync(dbPath);
    this.logger.log(`Initialized local SQLite database at: ${dbPath}`);
    this.createSqliteTables();
  }

  private createSqliteTables() {
    this.sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL, -- 'VENDOR', 'RECIPIENT', 'ADMIN'
        org_name TEXT,
        org_type TEXT,     -- 'RESTAURANT', 'BAKERY', 'CAFE', 'SUPERMARKET', 'NGO_SHELTER', 'COMMUNITY_KITCHEN', 'VOLUNTEER'
        phone TEXT,
        address TEXT,
        latitude REAL,
        longitude REAL,
        verified INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL, -- 'BAKERY', 'COOKED_MEALS', 'PRODUCE', 'DAIRY', 'PACKAGED'
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,     -- 'kg', 'portions', 'boxes', 'items'
        portion_estimate INTEGER NOT NULL,
        dietary_flags TEXT,     -- JSON array e.g. ["Vegetarian", "Vegan", "Halal"]
        safe_temperature TEXT DEFAULT 'ROOM', -- 'ROOM', 'REFRIGERATED', 'HEATED'
        packaging_type TEXT DEFAULT 'SEALED_CONTAINERS',
        allergen_info TEXT,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        pickup_start TEXT NOT NULL,
        pickup_deadline TEXT NOT NULL,
        status TEXT DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'CLAIMED', 'COLLECTED', 'EXPIRED', 'CANCELLED'
        handover_pin TEXT,      -- 4 digit code for secure pickup verification
        notes TEXT,
        food_safety_acknowledged INTEGER DEFAULT 1,
        image_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(vendor_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING_PICKUP', -- 'PENDING_PICKUP', 'COMPLETED', 'CANCELLED'
        claim_time TEXT NOT NULL,
        pickup_time TEXT,
        recipient_notes TEXT,
        volunteer_name TEXT,
        volunteer_phone TEXT,
        declaration_accepted INTEGER DEFAULT 1,
        handover_confirmed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(listing_id) REFERENCES listings(id),
        FOREIGN KEY(recipient_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        actor_id TEXT,
        listing_id TEXT,
        details TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL
      );
    `);
  }

  private async createPostgresTables() {
    await this.pgClient.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL,
        org_name VARCHAR(255),
        org_type VARCHAR(64),
        phone VARCHAR(64),
        address TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        geom GEOMETRY(Point, 4326),
        verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS listings (
        id VARCHAR(64) PRIMARY KEY,
        vendor_id VARCHAR(64) REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(64) NOT NULL,
        quantity DOUBLE PRECISION NOT NULL,
        unit VARCHAR(32) NOT NULL,
        portion_estimate INTEGER NOT NULL,
        dietary_flags JSONB,
        safe_temperature VARCHAR(32) DEFAULT 'ROOM',
        packaging_type VARCHAR(64) DEFAULT 'SEALED_CONTAINERS',
        allergen_info TEXT,
        address TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        geom GEOMETRY(Point, 4326),
        pickup_start TIMESTAMP WITH TIME ZONE NOT NULL,
        pickup_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(32) DEFAULT 'AVAILABLE',
        handover_pin VARCHAR(10),
        notes TEXT,
        food_safety_acknowledged BOOLEAN DEFAULT TRUE,
        image_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS claims (
        id VARCHAR(64) PRIMARY KEY,
        listing_id VARCHAR(64) REFERENCES listings(id),
        recipient_id VARCHAR(64) REFERENCES users(id),
        status VARCHAR(32) DEFAULT 'PENDING_PICKUP',
        claim_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        pickup_time TIMESTAMP WITH TIME ZONE,
        recipient_notes TEXT,
        volunteer_name VARCHAR(255),
        volunteer_phone VARCHAR(64),
        declaration_accepted BOOLEAN DEFAULT TRUE,
        handover_confirmed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        actor_id VARCHAR(64),
        listing_id VARCHAR(64),
        details JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(64) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_listings_geom ON listings USING GIST (geom);
    `);
  }

  /**
   * Universal parameterized query helper supporting SQLite and PostgreSQL
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    if (this.isPostgres && this.pgClient) {
      let pgSql = sql;
      // Convert ? to $1, $2, etc for postgres
      let paramIdx = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${paramIdx++}`);
      }
      const res = await this.pgClient.query(pgSql, params);
      return {
        rows: res.rows,
        rowCount: res.rowCount ?? res.rows.length,
      };
    }

    // SQLite
    try {
      const stmt = this.sqliteDb.prepare(sql);
      const isSelect = /^\s*SELECT/i.test(sql) || /^\s*WITH/i.test(sql);
      if (isSelect) {
        const rows = stmt.all(...params) as T[];
        return {
          rows,
          rowCount: rows.length,
        };
      } else {
        const info = stmt.run(...params);
        return {
          rows: [],
          rowCount: (info as any)?.changes ?? 1,
        };
      }
    } catch (err) {
      this.logger.error(`Database query error: ${(err as Error).message} \nSQL: ${sql}`);
      throw err;
    }
  }

  /**
   * Spatial Distance calculation using Haversine formula (km)
   */
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }
}

