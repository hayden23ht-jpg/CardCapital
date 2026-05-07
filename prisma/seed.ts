import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding CardCapital database...')

  // Default settings
  await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id:'singleton', gradingCost:25, ebayFeePercent:12.9, targetProfitPct:30, minRoiPct:20, preferredCondition:'Near Mint' }
  })

  // Sample portfolio items
  const cards = [
    { cardName:'Charizard', setName:'Base Set', condition:'Raw', quantity:1, purchasePrice:320, currentValue:420, status:'Holding', notes:'Shadowless candidate' },
    { cardName:'Lugia', setName:'Neo Genesis', condition:'Raw', quantity:2, purchasePrice:250, currentValue:280, status:'Holding' },
    { cardName:'Umbreon Gold Star', setName:'POP Series 5', condition:'PSA 9', gradeCompany:'PSA', grade:'9', quantity:1, purchasePrice:1800, currentValue:2400, status:'Holding' },
  ]
  for (const c of cards) {
    await prisma.portfolioItem.create({ data: c as any })
  }

  // Sample watchlist
  await prisma.watchlistItem.createMany({ data: [
    { cardName:'Pikachu Illustrator', targetBuyPrice:100000, targetSellPrice:400000, notes:'Grail card — watch for deals' },
    { cardName:'Charizard ex 151', setName:'Pokémon 151', targetBuyPrice:60, targetSellPrice:120, notes:'Modern holo — watch PSA10 spread' },
  ]})

  console.log('✓ Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
