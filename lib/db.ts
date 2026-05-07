
import path from 'path'
import fs from 'fs'

// We use sql.js (pure JS) for server-side SQLite
// Users just run: npm run dev — no setup needed

let _db: any = null

function getDB() {
  if (_db) return _db
  try {
    const initSqlJs = require('sql.js')
    const dbPath = path.join(process.cwd(), 'cardcapital.db')
    
    let fileBuffer: Buffer | null = null
    if (fs.existsSync(dbPath)) {
      fileBuffer = fs.readFileSync(dbPath)
    }
    
    // sql.js is async but we need sync for Next.js — use the sync approach
    // Actually use better approach: node:sqlite (Node 22+) or fallback to JSON
    throw new Error('use-json-fallback')
  } catch {
    return null
  }
}

// Since we can't use native SQLite binaries in all envs,
// use a simple JSON file database that actually works everywhere
const DB_PATH = path.join(process.cwd(), 'cardcapital-db.json')

interface DB {
  portfolio: PortfolioItem[]
  watchlist: WatchlistItem[]
  settings: AppSettings
  priceSnapshots: PriceSnapshot[]
}

export interface PortfolioItem {
  id: string
  cardName: string
  setName: string | null
  cardNumber: string | null
  imageUrl: string | null
  condition: string
  gradeCompany: string | null
  grade: string | null
  quantity: number
  purchasePrice: number
  purchaseDate: string
  currentValue: number | null
  targetPrice: number | null
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface WatchlistItem {
  id: string
  cardName: string
  setName: string | null
  cardNumber: string | null
  imageUrl: string | null
  targetBuyPrice: number | null
  targetSellPrice: number | null
  currentPrice: number | null
  notes: string | null
  alertEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  gradingCost: number
  ebayFeePercent: number
  targetProfitPct: number
  minRoiPct: number
  preferredCondition: string
}

export interface PriceSnapshot {
  id: string
  cardPcId: string
  rawPrice: number | null
  psa9Price: number | null
  psa10Price: number | null
  fetchedAt: string
}

function defaultDB(): DB {
  return {
    portfolio: [],
    watchlist: [],
    settings: {
      gradingCost: 25,
      ebayFeePercent: 12.9,
      targetProfitPct: 30,
      minRoiPct: 20,
      preferredCondition: 'Near Mint',
    },
    priceSnapshots: [],
  }
}

function readDB(): DB {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8')
      return { ...defaultDB(), ...JSON.parse(raw) }
    }
  } catch { /* ignore */ }
  return defaultDB()
}

function writeDB(db: DB): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
  } catch (e) {
    console.error('DB write error:', e)
  }
}

function cuid(): string {
  return 'c' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Portfolio ─────────────────────────────────────────────────────────────────
export function portfolioGetAll(): PortfolioItem[] {
  return readDB().portfolio.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function portfolioCreate(data: Omit<PortfolioItem, 'id' | 'createdAt' | 'updatedAt'>): PortfolioItem {
  const db = readDB()
  const item: PortfolioItem = {
    ...data,
    id: cuid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.portfolio.push(item)
  writeDB(db)
  return item
}

export function portfolioUpdate(id: string, data: Partial<PortfolioItem>): PortfolioItem | null {
  const db = readDB()
  const idx = db.portfolio.findIndex(i => i.id === id)
  if (idx === -1) return null
  db.portfolio[idx] = { ...db.portfolio[idx], ...data, updatedAt: new Date().toISOString() }
  writeDB(db)
  return db.portfolio[idx]
}

export function portfolioDelete(id: string): boolean {
  const db = readDB()
  const len = db.portfolio.length
  db.portfolio = db.portfolio.filter(i => i.id !== id)
  writeDB(db)
  return db.portfolio.length < len
}

// ── Watchlist ─────────────────────────────────────────────────────────────────
export function watchlistGetAll(): WatchlistItem[] {
  return readDB().watchlist.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function watchlistCreate(data: Omit<WatchlistItem, 'id' | 'createdAt' | 'updatedAt'>): WatchlistItem {
  const db = readDB()
  const item: WatchlistItem = {
    ...data,
    id: cuid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.watchlist.push(item)
  writeDB(db)
  return item
}

export function watchlistUpdate(id: string, data: Partial<WatchlistItem>): WatchlistItem | null {
  const db = readDB()
  const idx = db.watchlist.findIndex(i => i.id === id)
  if (idx === -1) return null
  db.watchlist[idx] = { ...db.watchlist[idx], ...data, updatedAt: new Date().toISOString() }
  writeDB(db)
  return db.watchlist[idx]
}

export function watchlistDelete(id: string): boolean {
  const db = readDB()
  db.watchlist = db.watchlist.filter(i => i.id !== id)
  writeDB(db)
  return true
}

// ── Settings ──────────────────────────────────────────────────────────────────
export function settingsGet(): AppSettings {
  return readDB().settings
}

export function settingsUpdate(data: Partial<AppSettings>): AppSettings {
  const db = readDB()
  db.settings = { ...db.settings, ...data }
  writeDB(db)
  return db.settings
}

// ── Price Snapshots ───────────────────────────────────────────────────────────
export function snapshotSave(data: Omit<PriceSnapshot, 'id' | 'fetchedAt'>): void {
  const db = readDB()
  // Keep max 90 snapshots per card
  const existing = db.priceSnapshots.filter(s => s.cardPcId === data.cardPcId)
  if (existing.length >= 90) {
    db.priceSnapshots = db.priceSnapshots.filter(s => s.cardPcId !== data.cardPcId)
    db.priceSnapshots.push(...existing.slice(-89))
  }
  db.priceSnapshots.push({ ...data, id: cuid(), fetchedAt: new Date().toISOString() })
  writeDB(db)
}

export function snapshotGetByCard(cardPcId: string): PriceSnapshot[] {
  return readDB().priceSnapshots
    .filter(s => s.cardPcId === cardPcId)
    .sort((a, b) => a.fetchedAt.localeCompare(b.fetchedAt))
}
