const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to PostgreSQL via Prisma...");
  const sports = await prisma.sport.count();
  const matches = await prisma.match.count();
  const teams = await prisma.team.count();
  const articles = await prisma.article.count();
  const standings = await prisma.standing.count();

  console.log(`Sports: ${sports}`);
  console.log(`Matches: ${matches}`);
  console.log(`Teams: ${teams}`);
  console.log(`Articles: ${articles}`);
  console.log(`Standings: ${standings}`);
}

main()
  .catch((e) => {
    console.error("Error connecting to database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
