import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create or update admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apec-manager.com' },
    update: {},
    create: {
      email: 'admin@apec-manager.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create or update test user
  const userPassword = await bcrypt.hash('user123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@apec-manager.com' },
    update: {},
    create: {
      email: 'user@apec-manager.com',
      password: userPassword,
      name: 'Test User',
      role: 'USER',
    },
  })
  console.log('✅ Test user created:', user.email)

  console.log('🌱 Database seeded successfully!')
  console.log('')
  console.log('📝 Login credentials:')
  console.log('   Admin: admin@apec-manager.com / admin123')
  console.log('   User:  user@apec-manager.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
