/**
 * APEC Job Extractor Bookmarklet
 *
 * HOW TO USE:
 * 1. Log in to APEC and navigate to: https://www.apec.fr/recruteur/mon-espace/mes-offres.html
 * 2. Click this bookmarklet
 * 3. Jobs will be automatically sent to your dashboard
 *
 * TO INSTALL:
 * Create a new bookmark with this URL:
 * javascript:(function(){var s=document.createElement('script');s.src='YOUR_DOMAIN/apec-extractor-bookmarklet.js';document.body.appendChild(s);})()
 */

(function() {
  'use strict';

  const API_ENDPOINT = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/jobs/manual-import'
    : 'https://next-nqsmo5xwg-erwan-henrys-projects.vercel.app/api/jobs/manual-import';

  // Create overlay UI
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 10px;
    max-width: 600px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;

  const title = document.createElement('h2');
  title.textContent = 'Extraction des offres APEC';
  title.style.cssText = 'margin: 0 0 20px 0; color: #333;';

  const status = document.createElement('div');
  status.style.cssText = 'margin: 20px 0; color: #666;';
  status.innerHTML = '<p>Recherche des offres en cours...</p>';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Fermer';
  closeBtn.style.cssText = `
    background: #e74c3c;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    display: none;
  `;
  closeBtn.onclick = () => document.body.removeChild(overlay);

  modal.appendChild(title);
  modal.appendChild(status);
  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Extract job data from the page
  function extractJobs() {
    const jobs = [];

    // Strategy 1: Look for table rows
    const tableRows = document.querySelectorAll('tr[data-job-id], tr[class*="job"], tr[class*="offre"]');
    if (tableRows.length > 0) {
      status.innerHTML = `<p>✓ Trouvé ${tableRows.length} lignes de tableau</p>`;
      tableRows.forEach(row => {
        const job = extractFromTableRow(row);
        if (job) jobs.push(job);
      });
    }

    // Strategy 2: Look for card/article elements
    if (jobs.length === 0) {
      const cards = document.querySelectorAll('article, [class*="card"], [class*="item"], [class*="offre"]');
      status.innerHTML = `<p>✓ Trouvé ${cards.length} cartes</p>`;
      cards.forEach(card => {
        const job = extractFromCard(card);
        if (job) jobs.push(job);
      });
    }

    // Strategy 3: Try to find data in window object or API calls
    if (jobs.length === 0) {
      status.innerHTML += `<p>⚠ Tentative de récupération via les données JavaScript...</p>`;
      const apiData = window.__INITIAL_DATA__ || window.__NEXT_DATA__ || window.__data__;
      if (apiData) {
        // Try to extract from various possible data structures
        const jobsData = findJobsInObject(apiData);
        jobs.push(...jobsData);
      }
    }

    return jobs;
  }

  function extractFromTableRow(row) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) return null;

    return {
      id: row.dataset.jobId || `apec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: cells[0]?.textContent?.trim() || 'Sans titre',
      status: cells[1]?.textContent?.trim() || 'published',
      views: parseInt(cells[2]?.textContent?.trim()) || 0,
      applications: parseInt(cells[3]?.textContent?.trim()) || 0,
      publishedDate: cells[4]?.textContent?.trim() || new Date().toISOString().split('T')[0],
    };
  }

  function extractFromCard(card) {
    const title = card.querySelector('h2, h3, h4, [class*="title"]')?.textContent?.trim();
    if (!title) return null;

    const stats = card.querySelectorAll('[class*="stat"], [class*="count"]');

    return {
      id: card.dataset.id || `apec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title,
      status: 'published',
      views: parseInt(stats[0]?.textContent) || 0,
      applications: parseInt(stats[1]?.textContent) || 0,
      publishedDate: new Date().toISOString().split('T')[0],
    };
  }

  function findJobsInObject(obj, depth = 0) {
    if (depth > 5) return [];
    const jobs = [];

    for (const key in obj) {
      if (Array.isArray(obj[key]) && obj[key].length > 0) {
        // Check if this looks like job data
        if (obj[key][0]?.title || obj[key][0]?.titre) {
          obj[key].forEach(item => {
            jobs.push({
              id: item.id || `apec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: item.title || item.titre || 'Sans titre',
              status: item.status || item.statut || 'published',
              views: item.views || item.vues || 0,
              applications: item.applications || item.candidatures || 0,
              publishedDate: item.date || item.publishedDate || new Date().toISOString().split('T')[0],
            });
          });
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        jobs.push(...findJobsInObject(obj[key], depth + 1));
      }
    }

    return jobs;
  }

  // Extract jobs
  setTimeout(() => {
    try {
      const jobs = extractJobs();

      if (jobs.length === 0) {
        status.innerHTML = `
          <p style="color: #e74c3c;">❌ Aucune offre trouvée sur cette page.</p>
          <p style="font-size: 12px; color: #666;">
            Assurez-vous d'être sur la page "Mes offres" de l'APEC:<br>
            <code style="background: #f5f5f5; padding: 5px; border-radius: 3px;">
              https://www.apec.fr/recruteur/mon-espace/mes-offres.html
            </code>
          </p>
        `;
        closeBtn.style.display = 'block';
        return;
      }

      status.innerHTML = `
        <p>✓ ${jobs.length} offre(s) trouvée(s)</p>
        <p>📤 Envoi vers le serveur...</p>
      `;

      // Send to API
      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobs }),
      })
        .then(response => response.json())
        .then(data => {
          status.innerHTML = `
            <p style="color: #27ae60;">✓ Synchronisation réussie !</p>
            <p>Créées: ${data.created || 0}</p>
            <p>Mises à jour: ${data.updated || 0}</p>
            <p>Inchangées: ${data.unchanged || 0}</p>
          `;
          closeBtn.style.display = 'block';
        })
        .catch(error => {
          status.innerHTML = `
            <p style="color: #e74c3c;">❌ Erreur lors de l'envoi</p>
            <pre style="font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 3px; overflow: auto;">
              ${error.message}
            </pre>
          `;
          closeBtn.style.display = 'block';
        });

    } catch (error) {
      status.innerHTML = `
        <p style="color: #e74c3c;">❌ Erreur lors de l'extraction</p>
        <pre style="font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 3px; overflow: auto;">
          ${error.message}
        </pre>
      `;
      closeBtn.style.display = 'block';
    }
  }, 1000);
})();
