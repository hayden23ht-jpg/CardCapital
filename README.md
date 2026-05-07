# CardCapital — Pokémon Card Intelligence

A professional Pokémon card market intelligence dashboard. Search cards, track your portfolio, find grading opportunities, and score cards as BUY/HOLD/SELL.

## Quick Start

```bash
npm install
npx prisma db push
npm run seed    # optional — loads sample portfolio
npm run dev
```

Then open **http://localhost:3000**

## .env Setup

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL="file:./dev.db"
PRICECHARTING_API_TOKEN="your_token_here"   # Required
POKEMON_TCG_API_KEY=""                       # Optional (higher rate limits)
EBAY_CLIENT_ID=""                            # Optional
EBAY_CLIENT_SECRET=""                        # Optional
```

## Pages

| Page | Description |
|------|-------------|
| `/` | Dashboard — portfolio value, P&L, top opportunities |
| `/search` | Live card search with BUY/HOLD/SELL signals |
| `/sets` | Browse all Pokémon TCG sets |
| `/opportunities` | Best raw-to-PSA10 flip opportunities |
| `/portfolio` | Your inventory — add, edit, delete cards |
| `/watchlist` | Track cards with target buy/sell prices |
| `/settings` | Grading cost, eBay fee, ROI targets |

## Scoring Engine

Cards are scored 0-100 based on:
- PSA10 spread vs raw price (30%)
- Sales liquidity (20%)
- Card rarity (20%)
- Historical momentum (15%)
- Price volatility (10%)
- Data confidence (5%)

Score → Recommendation:
- 75+ = **BUY**
- 55-74 = **HOLD**
- 40-54 = **WATCH**
- <40 = **SELL**
