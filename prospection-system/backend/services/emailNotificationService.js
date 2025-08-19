const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailNotificationService {
    constructor() {
        this.transporter = null;
        this.initialize();
    }

    async initialize() {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.log('⚠️ Email notifications disabled: GMAIL_USER and GMAIL_APP_PASSWORD not configured');
            return;
        }

        try {
            this.transporter = nodemailer.createTransporter({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            });

            // Test connection
            await this.transporter.verify();
            console.log('✅ Email notification service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize email service:', error.message);
        }
    }

    async sendWorkflowStartNotification(workflowData) {
        if (!this.transporter) {
            console.log('📧 Email notifications disabled - skipping workflow start notification');
            return;
        }

        try {
            const { prospects, config, workflowId } = workflowData;
            const timestamp = new Date().toLocaleString('fr-FR');

            const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .info-box { background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
        .config-item { margin: 8px 0; }
        .highlight { color: #4CAF50; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #4CAF50; color: white; }
        .footer { background: #f9f9f9; padding: 15px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Workflow de Prospection Démarré</h1>
        <p>ID: ${workflowId || 'N/A'} | ${timestamp}</p>
    </div>
    
    <div class="content">
        <div class="info-box">
            <h2>📊 Aperçu du Workflow</h2>
            <div class="config-item">👥 <span class="highlight">${prospects?.length || 0}</span> prospects sélectionnés</div>
            <div class="config-item">📧 Génération d'emails: <span class="highlight">${config?.actions?.generateEmails ? 'Activée' : 'Désactivée'}</span></div>
            <div class="config-item">🔗 Connexions LinkedIn: <span class="highlight">${config?.actions?.sendLinkedInConnections ? 'Activées' : 'Désactivées'}</span></div>
            <div class="config-item">📅 Relances automatiques: <span class="highlight">${config?.actions?.scheduleFollowups ? 'Activées' : 'Désactivées'}</span></div>
        </div>

        <div class="info-box">
            <h2>⚙️ Configuration</h2>
            <div class="config-item"><strong>Contexte Email:</strong></div>
            <div style="background: white; padding: 10px; border: 1px solid #ddd; margin: 5px 0;">
                ${config?.emailContext?.substring(0, 200)}...
            </div>
            
            <div class="config-item"><strong>Template LinkedIn:</strong></div>
            <div style="background: white; padding: 10px; border: 1px solid #ddd; margin: 5px 0;">
                ${config?.linkedinTemplate?.substring(0, 200)}...
            </div>
        </div>

        ${prospects && prospects.length > 0 ? `
        <div class="info-box">
            <h2>👥 Prospects (Premiers 10)</h2>
            <table>
                <tr>
                    <th>Nom</th>
                    <th>Entreprise</th>
                    <th>Poste</th>
                    <th>Localisation</th>
                </tr>
                ${prospects.slice(0, 10).map(p => `
                <tr>
                    <td>${p.name || 'N/A'}</td>
                    <td>${p.company || 'N/A'}</td>
                    <td>${p.title || 'N/A'}</td>
                    <td>${p.location || 'N/A'}</td>
                </tr>
                `).join('')}
                ${prospects.length > 10 ? `<tr><td colspan="4" style="text-align: center; font-style: italic;">... et ${prospects.length - 10} autres prospects</td></tr>` : ''}
            </table>
        </div>
        ` : ''}

        <div class="info-box">
            <h2>📋 Actions Prévues</h2>
            <ul>
                ${config?.actions?.generateEmails ? '<li>✅ Génération d\'emails personnalisés avec IA</li>' : ''}
                ${config?.actions?.sendLinkedInConnections ? '<li>✅ Envoi de demandes de connexion LinkedIn</li>' : ''}
                ${config?.actions?.scheduleFollowups ? '<li>✅ Programmation de relances automatiques</li>' : ''}
                <li>📊 Ajout/mise à jour dans le CRM Google Sheets</li>
                <li>📈 Tracking des performances et analytics</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p>🤖 Système de Prospection Automatisée | Graixl</p>
        <p>Ce workflow s'exécute maintenant. Vous recevrez un résumé à la fin du processus.</p>
    </div>
</body>
</html>
            `;

            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: process.env.GMAIL_USER, // Send to yourself
                subject: `🚀 Workflow Prospection Démarré - ${prospects?.length || 0} prospects`,
                html: emailContent
            };

            await this.transporter.sendMail(mailOptions);
            console.log('✅ Workflow start notification sent successfully');
        } catch (error) {
            console.error('❌ Failed to send workflow start notification:', error.message);
        }
    }

    async sendWorkflowEndNotification(results) {
        if (!this.transporter) {
            console.log('📧 Email notifications disabled - skipping workflow end notification');
            return;
        }

        try {
            const timestamp = new Date().toLocaleString('fr-FR');
            const duration = results.duration ? Math.round(results.duration / 1000) : 'N/A';

            const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .results-box { background: #f5f5f5; padding: 15px; margin: 10px 0; border-left: 4px solid #2196F3; }
        .success { color: #4CAF50; font-weight: bold; }
        .error { color: #f44336; font-weight: bold; }
        .warning { color: #FF9800; font-weight: bold; }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
        .metric-label { font-size: 0.9em; color: #666; }
        .logs { background: #1e1e1e; color: #fff; padding: 15px; font-family: monospace; font-size: 12px; overflow-x: auto; max-height: 300px; overflow-y: auto; }
        .footer { background: #f9f9f9; padding: 15px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Workflow de Prospection Terminé</h1>
        <p>${timestamp} | Durée: ${duration}s</p>
    </div>
    
    <div class="content">
        <div class="results-box">
            <h2>📊 Résultats Finaux</h2>
            <div style="text-align: center;">
                <div class="metric">
                    <div class="metric-value">${results.prospectsProcessed || 0}</div>
                    <div class="metric-label">Prospects Traités</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${results.emailsGenerated || 0}</div>
                    <div class="metric-label">Emails Générés</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${results.linkedinConnections || 0}</div>
                    <div class="metric-label">Connexions LinkedIn</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${results.followupsScheduled || 0}</div>
                    <div class="metric-label">Relances Programmées</div>
                </div>
            </div>
        </div>

        ${results.errors && results.errors.length > 0 ? `
        <div class="results-box">
            <h2>⚠️ Erreurs Rencontrées</h2>
            <ul>
                ${results.errors.map(error => `<li class="error">${error}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${results.warnings && results.warnings.length > 0 ? `
        <div class="results-box">
            <h2>⚠️ Avertissements</h2>
            <ul>
                ${results.warnings.map(warning => `<li class="warning">${warning}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="results-box">
            <h2>🎯 Prochaines Étapes Recommandées</h2>
            <ul>
                <li>📧 Vérifier les emails générés dans la section CRM</li>
                <li>🔗 Surveiller les acceptations de connexions LinkedIn</li>
                <li>📈 Suivre les taux de réponse dans les prochains jours</li>
                <li>🔄 Programmer des relances si nécessaire</li>
            </ul>
        </div>

        ${results.logs ? `
        <div class="results-box">
            <h2>📋 Logs du Workflow</h2>
            <div class="logs">
                ${results.logs.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}
    </div>

    <div class="footer">
        <p>🤖 Système de Prospection Automatisée | Graixl</p>
        <p>Workflow terminé avec succès. Consultez votre CRM pour plus de détails.</p>
    </div>
</body>
</html>
            `;

            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: process.env.GMAIL_USER,
                subject: `🎯 Workflow Terminé - ${results.prospectsProcessed || 0} prospects traités`,
                html: emailContent
            };

            await this.transporter.sendMail(mailOptions);
            console.log('✅ Workflow end notification sent successfully');
        } catch (error) {
            console.error('❌ Failed to send workflow end notification:', error.message);
        }
    }

    async sendErrorNotification(error, context) {
        if (!this.transporter) {
            console.log('📧 Email notifications disabled - skipping error notification');
            return;
        }

        try {
            const timestamp = new Date().toLocaleString('fr-FR');

            const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .error-box { background: #ffebee; padding: 15px; margin: 10px 0; border-left: 4px solid #f44336; }
        .code { background: #1e1e1e; color: #fff; padding: 15px; font-family: monospace; font-size: 12px; }
        .footer { background: #f9f9f9; padding: 15px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 Erreur Workflow de Prospection</h1>
        <p>${timestamp}</p>
    </div>
    
    <div class="content">
        <div class="error-box">
            <h2>❌ Détails de l'Erreur</h2>
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Contexte:</strong> ${context}</p>
            
            ${error.stack ? `
            <h3>Stack Trace:</h3>
            <div class="code">${error.stack.replace(/\n/g, '<br>')}</div>
            ` : ''}
        </div>

        <div class="error-box">
            <h2>🔧 Actions Recommandées</h2>
            <ul>
                <li>Vérifier les logs du serveur</li>
                <li>Contrôler les credentials et configurations</li>
                <li>Redémarrer le workflow si nécessaire</li>
                <li>Contacter le support technique si l'erreur persiste</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p>🤖 Système de Prospection Automatisée | Graixl</p>
        <p>Une erreur critique a été détectée et nécessite votre attention.</p>
    </div>
</body>
</html>
            `;

            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: process.env.GMAIL_USER,
                subject: `🚨 Erreur Workflow - ${error.message.substring(0, 50)}...`,
                html: emailContent
            };

            await this.transporter.sendMail(mailOptions);
            console.log('✅ Error notification sent successfully');
        } catch (err) {
            console.error('❌ Failed to send error notification:', err.message);
        }
    }
}

module.exports = new EmailNotificationService();