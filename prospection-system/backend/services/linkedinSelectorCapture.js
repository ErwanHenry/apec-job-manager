/**
 * LinkedIn Selector Capture Service
 * Uses our working Brave scraper to capture current LinkedIn DOM structure
 */

const linkedinScraper = require('./linkedinScraper'); // Use our enhanced scraper
const fs = require('fs').promises;

class LinkedInSelectorCapture {
  async captureCurrentSelectors() {
    console.log('🔍 Capturing LinkedIn selectors using working Brave scraper...');

    try {
      // Initialize the enhanced scraper
      const initialized = await linkedinScraper.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize enhanced scraper');
      }

      // Modify the search method temporarily to capture DOM
      const originalEvaluate = linkedinScraper.page.evaluate;
      let capturedData = null;

      // Perform a search to get to LinkedIn search results
      console.log('🔍 Performing test search to capture DOM...');
      
      // Navigate and set up session (reuse working logic)
      await linkedinScraper.page.goto('https://www.linkedin.com', { 
        waitUntil: 'load',
        timeout: 30000 
      });

      await linkedinScraper.page.setCookie({
        name: 'li_at',
        value: linkedinScraper.cookie,
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      });

      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=software%20engineer`;
      await linkedinScraper.page.goto(searchUrl, { 
        waitUntil: 'load',
        timeout: 45000 
      });

      await new Promise(resolve => setTimeout(resolve, 5000));

      // Take screenshot
      await linkedinScraper.page.screenshot({ 
        path: 'linkedin_working_capture.png', 
        fullPage: true 
      });

      const currentUrl = linkedinScraper.page.url();
      const pageTitle = await linkedinScraper.page.title();
      console.log('📍 Successfully reached:', currentUrl);
      console.log('📄 Page title:', pageTitle);

      // Capture detailed DOM analysis
      const selectorAnalysis = await linkedinScraper.page.evaluate(() => {
        const analysis = {
          pageInfo: {
            url: window.location.href,
            title: document.title,
            bodyClasses: document.body.className
          },
          profileLinks: [],
          allElements: {},
          workingSelectors: {},
          detailedAnalysis: []
        };

        // 1. Find all profile links
        const profileLinks = document.querySelectorAll('a[href*="/in/"]');
        console.log(`🔗 Found ${profileLinks.length} profile links`);
        
        for (let i = 0; i < Math.min(profileLinks.length, 10); i++) {
          const link = profileLinks[i];
          analysis.profileLinks.push({
            index: i,
            href: link.href,
            text: link.textContent.trim().substring(0, 100),
            className: link.className,
            parentInfo: {
              tagName: link.parentElement?.tagName,
              className: link.parentElement?.className,
              id: link.parentElement?.id
            },
            grandParentInfo: {
              tagName: link.parentElement?.parentElement?.tagName,
              className: link.parentElement?.parentElement?.className,
              id: link.parentElement?.parentElement?.id
            }
          });
        }

        // 2. Test all possible selectors
        const selectorsToTest = [
          // Current selectors we're using
          'div[data-view-name="search-entity-result"]',
          '.reusable-search__result-container',
          '.entity-result',
          '.search-result',
          '[data-testid="search-result"]',
          '.search-results-container .artdeco-entity-lockup',
          'li[data-view-name]',
          'div[data-view-name]',
          '.artdeco-entity-lockup',
          '[class*="entity-result"]',
          '[class*="search-result"]',
          
          // Additional modern selectors
          '[data-chameleon-result-urn]',
          '[data-test-id]',
          '[data-testid]',
          '.search-noresults__container',
          '.search-result__wrapper',
          'main [role="main"]',
          '.search-results__container',
          '.srp-results',
          '.pvs-list__outer-container',
          
          // Generic but potentially useful
          'article',
          'li[class*="result"]',
          'div[class*="result"]',
          'section',
          '.org-results__list li',
          '.people-results__list li'
        ];

        selectorsToTest.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            const hasProfileLinks = elements.length > 0 ? 
              Array.from(elements).some(el => el.querySelector('a[href*="/in/"]')) : false;
            
            analysis.workingSelectors[selector] = {
              count: elements.length,
              hasProfileLinks: hasProfileLinks,
              sample: elements.length > 0 ? {
                tagName: elements[0].tagName,
                className: elements[0].className,
                textPreview: elements[0].textContent.trim().substring(0, 150) + '...'
              } : null
            };
          } catch (error) {
            analysis.workingSelectors[selector] = { error: error.message };
          }
        });

        // 3. Detailed analysis of promising elements
        const promisingSelectors = Object.entries(analysis.workingSelectors)
          .filter(([_, data]) => data.hasProfileLinks && data.count > 0 && data.count < 50)
          .slice(0, 5);

        promisingSelectors.forEach(([selector, data]) => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            const firstElement = elements[0];
            const detailAnalysis = {
              selector: selector,
              elementInfo: {
                tagName: firstElement.tagName,
                className: firstElement.className,
                id: firstElement.id,
                attributes: {}
              },
              profileInfo: {},
              childStructure: []
            };

            // Get all attributes
            Array.from(firstElement.attributes).forEach(attr => {
              detailAnalysis.elementInfo.attributes[attr.name] = attr.value;
            });

            // Find profile link within this element
            const profileLink = firstElement.querySelector('a[href*="/in/"]');
            if (profileLink) {
              detailAnalysis.profileInfo = {
                href: profileLink.href,
                text: profileLink.textContent.trim(),
                className: profileLink.className,
                nameSpan: profileLink.querySelector('span[aria-hidden="true"]')?.textContent.trim() || 'NOT_FOUND'
              };
            }

            // Analyze child structure for titles/locations
            const children = firstElement.querySelectorAll('*');
            const interestingChildren = Array.from(children)
              .filter(child => 
                (child.className && typeof child.className === 'string' && (
                  child.className.includes('subtitle') ||
                  child.className.includes('subline') ||
                  child.className.includes('headline') ||
                  child.className.includes('caption')
                )) ||
                (child.textContent && child.textContent.trim().length > 5)
              )
              .slice(0, 10);

            interestingChildren.forEach(child => {
              detailAnalysis.childStructure.push({
                tagName: child.tagName,
                className: child.className,
                textContent: child.textContent.trim().substring(0, 100)
              });
            });

            analysis.detailedAnalysis.push(detailAnalysis);
          }
        });

        return analysis;
      });

      // Save the analysis
      await fs.writeFile(
        'linkedin_working_analysis.json', 
        JSON.stringify(selectorAnalysis, null, 2)
      );

      console.log('\n📊 ANALYSIS COMPLETE:');
      console.log(`📸 Screenshot: linkedin_working_capture.png`);
      console.log(`📄 Analysis: linkedin_working_analysis.json`);
      console.log(`🔗 Found ${selectorAnalysis.profileLinks.length} profile links`);
      
      // Show working selectors
      const workingSelectors = Object.entries(selectorAnalysis.workingSelectors)
        .filter(([_, data]) => data.hasProfileLinks && data.count > 0)
        .sort((a, b) => b[1].count - a[1].count);

      console.log('\n✅ WORKING SELECTORS (with profile links):');
      workingSelectors.slice(0, 5).forEach(([selector, data]) => {
        console.log(`  ${selector}: ${data.count} elements`);
      });

      if (selectorAnalysis.detailedAnalysis.length > 0) {
        console.log('\n🎯 BEST CANDIDATE:');
        const best = selectorAnalysis.detailedAnalysis[0];
        console.log(`  Selector: ${best.selector}`);
        console.log(`  Element: <${best.elementInfo.tagName} class="${best.elementInfo.className}">`);
        if (best.profileInfo.nameSpan !== 'NOT_FOUND') {
          console.log(`  Name found: "${best.profileInfo.nameSpan}"`);
        }
      }

      await linkedinScraper.close();
      return selectorAnalysis;

    } catch (error) {
      console.error('❌ Error capturing selectors:', error.message);
      await linkedinScraper.close();
      throw error;
    }
  }
}

module.exports = new LinkedInSelectorCapture();