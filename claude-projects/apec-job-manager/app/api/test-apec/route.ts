import { NextResponse } from 'next/server'

/**
 * Simple test endpoint to check APEC domain accessibility
 * GET /api/test-apec
 */
export async function GET() {
  try {
    console.log('[Test] Testing APEC domain accessibility...')

    // Test 1: Simple fetch
    const response = await fetch('https://www.apec.fr/recruteur.html', {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    console.log('[Test] Fetch response:', {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    })

    return NextResponse.json({
      success: true,
      test: 'APEC domain reachable',
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    })
  } catch (error) {
    console.error('[Test] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
