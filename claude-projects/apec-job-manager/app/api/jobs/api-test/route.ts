import { NextResponse } from 'next/server'
import { apecService } from '@/lib/services/apecServicePlaywright'

/**
 * Test endpoint to try calling APEC API directly
 * GET /api/jobs/api-test
 */
export async function GET() {
  try {
    console.log('[API Test] Starting APEC API test...')

    // Initialize browser
    await apecService.initialize()

    // Authenticate
    await apecService.authenticate()

    // Get page content
    const page = (apecService as any).page

    if (!page) {
      throw new Error('Page not initialized')
    }

    console.log('[API Test] Trying to fetch job data from API endpoint...')

    // Try to fetch data from the API endpoint we found in the JavaScript
    const apiEndpoints = [
      '/cms/webservices/offre/pageRecruteur',
      '/cms/webservices/offre/mesOffres',
      '/recruteur/mon-espace/mes-offres.html',
    ]

    const results = []

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`[API Test] Testing endpoint: ${endpoint}`)

        // Navigate or fetch the endpoint
        const fullUrl = `https://www.apec.fr${endpoint}`

        const response = await page.evaluate(async (url) => {
          try {
            const res = await fetch(url, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
              },
            })

            const text = await res.text()

            return {
              success: true,
              status: res.status,
              statusText: res.statusText,
              contentType: res.headers.get('content-type'),
              bodySnippet: text.substring(0, 1000),
              bodyLength: text.length,
            }
          } catch (error: any) {
            return {
              success: false,
              error: error.message,
            }
          }
        }, fullUrl)

        results.push({
          endpoint,
          ...response,
        })

        console.log(`[API Test] Endpoint ${endpoint} result:`, response.success ? 'Success' : 'Failed')
      } catch (error) {
        console.error(`[API Test] Error testing ${endpoint}:`, error)
        results.push({
          endpoint,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Close browser
    await apecService.close()

    return NextResponse.json({
      success: true,
      message: 'API test completed',
      results,
    })
  } catch (error) {
    console.error('[API Test] Error:', error)

    // Try to close browser
    try {
      await apecService.close()
    } catch (e) {
      // Ignore
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
