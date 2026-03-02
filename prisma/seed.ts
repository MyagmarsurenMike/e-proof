import { PrismaClient } from '../src/generated/prisma/client'
import type { User } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear all tables in dependency order
  await prisma.auditLog.deleteMany()
  await prisma.blockchainTransaction.deleteMany()
  await prisma.sharedAccess.deleteMany()
  await prisma.verificationStep.deleteMany()
  await prisma.document.deleteMany()
  await prisma.file.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('Database cleared.')

  const password = await bcrypt.hash('password123', 10)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@eproof.mn',
        name: 'Admin User',
        password,
        role: 'admin',
        organization: 'E-Proof',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'bayar@example.mn',
        name: 'Bayaraa Gantulga',
        password,
        role: 'user',
        organization: 'Монгол Банк',
        phone: '+976-9911-0001',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'enkhjin@example.mn',
        name: 'Enkhjin Bold',
        password,
        role: 'user',
        organization: 'НБД',
        phone: '+976-9922-0002',
        emailVerified: new Date(),
      },
    }),
  ])

  console.log(`Seeded ${users.length} users:`)
  users.forEach((u: User) => console.log(`  - ${u.email} (${u.role})`))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
