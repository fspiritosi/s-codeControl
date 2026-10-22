import { NextRequest } from 'next/server'
import { handleStorageGet, handleStoragePost } from '@/shared/lib/storage/handlers.server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const GET = (req: NextRequest) => handleStorageGet(req)
export const POST = (req: NextRequest) => handleStoragePost(req)
