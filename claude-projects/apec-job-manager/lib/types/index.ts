import { Job, SyncHistory, Report } from '@prisma/client'

// Type definitions for enums that were converted to strings
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'EXPIRED' | 'DELETED'
export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

export type { Job, SyncHistory, Report }

export interface DashboardStats {
  totalJobs: number
  publishedJobs: number
  draftJobs: number
  totalViews: number
  totalApplications: number
  recentJobs: Job[]
  syncHistory: SyncHistory[]
}

export interface JobFormData {
  apecId: string
  title: string
  description?: string
  location?: string
  contractType?: string
  salary?: string
  requirements?: string
  benefits?: string
  status: JobStatus
}

export interface SyncResult {
  success: boolean
  message: string
  stats: {
    created: number
    updated: number
    deleted: number
    unchanged: number
    errors: string[]
  }
  duration: number
}

export interface ReportData {
  period: string
  jobs: {
    total: number
    byStatus: Record<JobStatus, number>
    byContractType: Record<string, number>
  }
  performance: {
    totalViews: number
    totalApplications: number
    conversionRate: number
  }
  trends: {
    date: string
    views: number
    applications: number
  }[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface FilterParams {
  status?: JobStatus
  contractType?: string
  location?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}
