import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const jobSchema = z.object({
  apecId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  contractType: z.string().optional(),
  salary: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'EXPIRED', 'DELETED']).default('DRAFT'),
})

// GET /api/jobs - List jobs with filters
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = { deletedAt: null }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ])

    return NextResponse.json({
      data: jobs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Create job
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = jobSchema.parse(body)

    // Check if job with apecId already exists
    const existingJob = await prisma.job.findUnique({
      where: { apecId: validatedData.apecId },
    })

    if (existingJob) {
      return NextResponse.json(
        { error: 'Une annonce avec cet ID APEC existe déjà' },
        { status: 400 }
      )
    }

    const job = await prisma.job.create({
      data: validatedData,
    })

    return NextResponse.json(
      { success: true, data: job },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating job:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
