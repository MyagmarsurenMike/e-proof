const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const userId = 'cmi5d1a0o0000kue7emtmdlou';
  console.log(`Checking for user: ${userId}`);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    console.log('User found:', user);
  } else {
    console.log('User NOT found in database.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.();
  });
