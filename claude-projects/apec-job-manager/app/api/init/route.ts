import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'L\'utilisateur admin existe déjà',
        user: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role,
        },
      })
    }

    // Créer l'utilisateur admin
    // Hash bcrypt pour "admin123": $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfQs9kKgU6
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfQs9kKgU6',
        name: 'Admin',
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Utilisateur admin créé avec succès!',
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      credentials: {
        email: 'admin@example.com',
        password: 'admin123',
        warning: 'Changez ce mot de passe après la première connexion!',
      },
    })
  } catch (error: any) {
    console.error('Error initializing database:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'initialisation de la base de données',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
