import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

/**
 * Test endpoint to verify APEC authentication
 * GET /api/jobs/test-auth
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = process.env.APEC_EMAIL
    const password = process.env.APEC_PASSWORD

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'APEC credentials not configured',
        details: {
          hasEmail: !!email,
          hasPassword: !!password,
        },
      })
    }

    console.log('Starting APEC authentication test...')

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })

    const page = await browser.newPage()

    // Step 1: Navigate to APEC recruiter page
    console.log('Navigating to APEC recruiter page...')
    await page.goto('https://www.apec.fr/recruteur.html', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const step1Url = page.url()
    console.log('Current URL after navigation:', step1Url)

    // Step 2: Look for login form
    console.log('Looking for login form...')
    const emailSelector = 'input#emailid'
    const passwordSelector = 'input#password'
    const buttonSelector = 'button.popin-btn-primary'

    try {
      await page.waitForSelector(emailSelector, { timeout: 10000 })
      console.log('Email field found')
    } catch (e) {
      console.log('Email field NOT found')

      // Take a screenshot for debugging
      const screenshot = await page.screenshot({ encoding: 'base64' })
      const html = await page.content()

      await browser.close()

      return NextResponse.json({
        success: false,
        error: 'Login form not found',
        details: {
          currentUrl: step1Url,
          emailSelectorFound: false,
          htmlLength: html.length,
          screenshot: screenshot.substring(0, 100) + '...', // First 100 chars
        },
      })
    }

    // Step 3: Fill in credentials
    console.log('Filling in email...')
    await page.type(emailSelector, email)

    console.log('Filling in password...')
    await page.type(passwordSelector, password)

    // Step 4: Click login button
    console.log('Clicking login button...')
    await page.evaluate(() => {
      const button = document.querySelector('button.popin-btn-primary')
      if (button && button.textContent?.includes('Se connecter')) {
        (button as HTMLElement).click()
      }
    })

    // Step 5: Wait and check for successful login
    console.log('Waiting for login to complete...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    const finalUrl = page.url()
    const cookies = await page.cookies()
    const hasSessionCookie = cookies.some(c =>
      c.name.toLowerCase().includes('session') ||
      c.name.toLowerCase().includes('auth') ||
      c.name.toLowerCase().includes('token')
    )

    console.log('Final URL:', finalUrl)
    console.log('Session cookies found:', hasSessionCookie)
    console.log('Total cookies:', cookies.length)

    await browser.close()

    // Check if login was successful
    const loginSuccessful =
      finalUrl !== step1Url &&
      (hasSessionCookie || finalUrl.includes('recruteur') || finalUrl.includes('dashboard'))

    return NextResponse.json({
      success: loginSuccessful,
      message: loginSuccessful
        ? 'APEC authentication successful'
        : 'APEC authentication may have failed',
      details: {
        initialUrl: step1Url,
        finalUrl: finalUrl,
        urlChanged: finalUrl !== step1Url,
        sessionCookiesFound: hasSessionCookie,
        totalCookies: cookies.length,
        cookieNames: cookies.map(c => c.name),
      },
    })
  } catch (error) {
    console.error('Error testing APEC auth:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
