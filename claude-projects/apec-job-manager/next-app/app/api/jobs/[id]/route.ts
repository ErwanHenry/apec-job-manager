import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const jobUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  contractType: z.string().optional(),
  salary: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'EXPIRED', 'DELETED']).optional(),
})

// GET /api/jobs/[id] - Get single job
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
    })

    if (!job || job.deletedAt) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ data: job })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/jobs/[id] - Update job
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = jobUpdateSchema.parse(body)

    const job = await prisma.job.findUnique({
      where: { id: params.id },
    })

    if (!job || job.deletedAt) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json({ success: true, data: updatedJob })
  } catch (error) {
    console.error('Error updating job:', error)

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

// DELETE /api/jobs/[id] - Soft delete job
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
    })

    if (!job || job.deletedAt) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    await prisma.job.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    })

    return NextResponse.json({ success: true, message: 'Job deleted' })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
