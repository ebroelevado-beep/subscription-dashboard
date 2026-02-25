import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log('Successfully queried user:', user);
  } catch (e) {
    if (e instanceof Error) {
        console.error('Prisma Error:', e.message);
    } else {
        console.error('Prisma Error:', e);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main();
