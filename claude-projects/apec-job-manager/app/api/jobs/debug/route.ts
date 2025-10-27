import { NextResponse } from 'next/server'
import { apecService } from '@/lib/services/apecServicePlaywright'

/**
 * Debug endpoint to inspect APEC HTML structure
 * GET /api/jobs/debug
 */
export async function GET() {
  try {
    console.log('[Debug] Starting APEC HTML inspection...')

    // Initialize browser
    await apecService.initialize()

    // Authenticate
    await apecService.authenticate()

    // Get page content
    const page = (apecService as any).page

    if (!page) {
      throw new Error('Page not initialized')
    }

    // Navigate to job listings page
    console.log('[Debug] Navigating to job listings page...')

    // Try multiple navigation strategies
    try {
      // Strategy 1: Navigate directly to job listings
      await page.goto('https://www.apec.fr/recruteur/mon-espace/mes-offres.html', {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })

      // Wait for JavaScript to load
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Check if we're still logged in
      const isLoginForm = await page.evaluate(() => {
        const emailInput = document.querySelector('input#emailid')
        const passwordInput = document.querySelector('input#password')
        return !!(emailInput && passwordInput)
      })

      if (isLoginForm) {
        console.log('[Debug] Login form detected, trying alternative navigation...')

        // Strategy 2: Navigate via Mon Espace first
        await page.goto('https://www.apec.fr/recruteur/mon-espace.html', {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        })
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Then navigate to job listings
        await page.goto('https://www.apec.fr/recruteur/mon-espace/mes-offres.html', {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        })
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

      console.log('[Debug] Page loaded, capturing data...')
    } catch (navError) {
      console.error('[Debug] Navigation error:', navError)
      throw navError
    }

    // Take screenshot (base64)
    const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false })

    // Get current URL to verify where we are
    const currentUrl = page.url()

    // Get HTML content
    const htmlContent = await page.content()

    // Get visible text
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 5000) // First 5000 chars
    })

    // Try to find common job list patterns
    const possibleSelectors = await page.evaluate(() => {
      const results: any = {
        classes: [],
        ids: [],
        dataAttributes: [],
        tags: [],
      }

      // Find elements with 'job', 'offer', 'annonce' in class/id
      const allElements = document.querySelectorAll('*')
      const jobKeywords = ['job', 'offer', 'annonce', 'offre', 'post', 'liste', 'item']

      allElements.forEach((el) => {
        const className = el.className
        const id = el.id
        const tagName = el.tagName.toLowerCase()

        // Check classes
        if (typeof className === 'string') {
          jobKeywords.forEach((keyword) => {
            if (className.toLowerCase().includes(keyword)) {
              if (!results.classes.includes(className)) {
                results.classes.push(className)
              }
            }
          })
        }

        // Check IDs
        if (id) {
          jobKeywords.forEach((keyword) => {
            if (id.toLowerCase().includes(keyword)) {
              if (!results.ids.includes(id)) {
                results.ids.push(id)
              }
            }
          })
        }

        // Check data attributes
        const dataAttrs = Array.from(el.attributes).filter((attr) =>
          attr.name.startsWith('data-')
        )
        dataAttrs.forEach((attr) => {
          if (!results.dataAttributes.includes(attr.name)) {
            results.dataAttributes.push(attr.name)
          }
        })
      })

      return results
    })

    // Close browser
    await apecService.close()

    return NextResponse.json({
      success: true,
      debug: {
        targetUrl: 'https://www.apec.fr/recruteur/mon-espace/mes-offres.html',
        actualUrl: currentUrl,
        screenshot: `data:image/png;base64,${screenshot}`,
        bodyText: bodyText,
        possibleSelectors,
        htmlSnippet: htmlContent.substring(0, 10000), // First 10k chars
      },
    })
  } catch (error) {
    console.error('[Debug] Error:', error)

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
