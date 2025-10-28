import { NextResponse } from 'next/server'
import { apecService } from '@/lib/services/apecServicePlaywright'

/**
 * Inspect page structure WITHOUT authentication
 * GET /api/inspect-page
 */
export async function GET() {
  try {
    console.log('[Inspect] Starting page inspection...')

    // Initialize browser
    await apecService.initialize()

    // Get page
    const page = (apecService as any).page

    if (!page) {
      throw new Error('Page not initialized')
    }

    // Navigate to APEC page WITHOUT authentication
    console.log('[Inspect] Navigating to https://www.apec.fr/recruteur.html')
    await page.goto('https://www.apec.fr/recruteur.html', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Wait a bit for any JS to load
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Take screenshot
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: true  // Full page screenshot
    })

    // Get HTML content
    const htmlContent = await page.content()

    // Get all input fields
    const inputs = await page.evaluate(() => {
      const allInputs = document.querySelectorAll('input')
      return Array.from(allInputs).map(input => ({
        type: input.type,
        name: input.name || '',
        id: input.id || '',
        placeholder: input.placeholder || '',
        className: input.className || '',
      }))
    })

    // Get all buttons
    const buttons = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button')
      return Array.from(allButtons).map(button => ({
        type: button.type,
        id: button.id || '',
        className: button.className || '',
        text: button.textContent?.trim() || '',
      }))
    })

    // Get page title
    const title = await page.title()

    // Close browser
    await apecService.close()

    return NextResponse.json({
      success: true,
      page: {
        url: 'https://www.apec.fr/recruteur.html',
        title,
        screenshot: `data:image/png;base64,${screenshot}`,
        inputs,
        buttons,
        htmlSnippet: htmlContent.substring(0, 15000), // First 15k chars
      },
    })
  } catch (error) {
    console.error('[Inspect] Error:', error)

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
