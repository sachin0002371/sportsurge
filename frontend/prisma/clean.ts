import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning dummy data (matches, standings, articles, votes)...');

  // Delete all transactional/dummy data while preserving Sports, Authors, and Teams
  await prisma.vote.deleteMany();
  await prisma.standing.deleteMany();
  await prisma.article.deleteMany();
  await prisma.match.deleteMany();

  console.log('✅ All dummy data removed successfully!');
  console.log('✨ Sports, authors, and teams have been preserved.');
  console.log('🚀 Now you can click the "Fetch Data" button in the UI to pull 100% real data from ESPN!');
}

main()
  .catch((e) => {
    console.error('Cleaning error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
