// Kaspa Toolkit Deployment Manager - Frontend JavaScript

class KaspaToolkitDashboard {
    constructor() {
        this.socket = io();
        this.tools = {};
        this.milestones = {};
        this.initializeEventListeners();
        this.connectWebSocket();
        this.startClock();
    }

    initializeEventListeners() {
        // Événements pour les mises à jour de progression
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-deploy')) {
                const toolId = e.target.dataset.toolId;
                this.deployTool(toolId);
            }
            
            if (e.target.classList.contains('btn-update')) {
                const toolId = e.target.dataset.toolId;
                this.showUpdateModal(toolId);
            }
        });
    }

    connectWebSocket() {
        this.socket.on('connect', () => {
            console.log('🔌 Connecté au serveur de déploiement');
            this.loadInitialData();
        });

        this.socket.on('initialData', (data) => {
            this.tools = data.tools;
            this.milestones = data.milestones;
            this.productData = {
                launchReadiness: data.launchReadiness,
                kasPayments: data.kasPayments,
                marketingReadiness: data.marketingReadiness,
                roadmap: data.roadmap
            };
            this.updateUI();
        });

        this.socket.on('toolUpdate', (data) => {
            this.tools[data.toolId] = data.tool;
            this.updateToolCard(data.toolId, data.tool);
            this.updateOverallProgress();
        });

        this.socket.on('deploymentComplete', (data) => {
            this.showDeploymentNotification(data.toolId, data.success);
        });

        this.socket.on('urgentAlert', (alerts) => {
            this.updateAlerts(alerts);
            this.showUrgentNotification(alerts.length);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Déconnecté du serveur');
            this.showConnectionError();
        });
    }

    async loadInitialData() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            this.tools = data.tools;
            this.milestones = data.milestones;
            this.urgentTasks = data.urgentTasks;
            this.productData = {
                launchReadiness: data.launchReadiness,
                kasPayments: data.kasPayments,
                marketingReadiness: data.marketingReadiness,
                roadmap: data.roadmap
            };
            
            this.updateUI();
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            this.showError('Impossible de charger les données du serveur');
        }
    }

    updateUI() {
        this.updateMilestones();
        this.updateToolsGrid();
        this.updateOverallProgress();
        this.updateAlerts(this.urgentTasks);
        this.updateProductDashboard();
        this.updateBlockersGrid();
        this.updateCriticalPath();
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const parisTime = now.toLocaleString('fr-FR', {
                timeZone: 'Europe/Paris',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const clockElement = document.getElementById('current-time');
            if (clockElement) {
                clockElement.textContent = `Paris: ${parisTime}`;
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    updateMilestones() {
        const elements = {
            'tech-freeze-date': this.milestones.techFreeze?.date,
            'tech-freeze-countdown': this.milestones.techFreeze?.countdown,
            'berlin-launch-date': this.milestones.berlinLaunch?.date,
            'berlin-launch-countdown': this.milestones.berlinLaunch?.countdown,
            'full-delivery-date': this.milestones.fullDelivery?.date,
            'full-delivery-countdown': this.milestones.fullDelivery?.countdown
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.textContent = value;

                // Ajout d'animation si la deadline approche
                if (id.includes('countdown') && value.includes('j') && parseInt(value) <= 7) {
                    element.classList.add('pulsing');
                    element.style.color = 'var(--kaspa-red)';
                }
            }
        });

        // Update visual milestone progress bars
        this.updateMilestoneProgressBars();
    }

    updateMilestoneProgressBars() {
        const milestones = [
            { id: 'tech-freeze', countdown: this.milestones.techFreeze?.countdown, totalDays: 90 },
            { id: 'berlin-launch', countdown: this.milestones.berlinLaunch?.countdown, totalDays: 103 },
            { id: 'full-delivery', countdown: this.milestones.fullDelivery?.countdown, totalDays: 158 }
        ];

        milestones.forEach(milestone => {
            if (!milestone.countdown) return;

            const match = milestone.countdown.match(/(\d+)j/);
            if (!match) return;

            const daysRemaining = parseInt(match[1]);
            const progressPercent = Math.max(0, ((milestone.totalDays - daysRemaining) / milestone.totalDays) * 100);

            // Update progress bar
            const progressBar = document.getElementById(`${milestone.id}-progress`);
            if (progressBar) {
                progressBar.style.width = `${progressPercent}%`;
            }

            // Update urgency indicator
            const urgencyElement = document.getElementById(`${milestone.id}-urgency`);
            if (urgencyElement) {
                let urgencyClass = 'normal';
                let urgencyText = 'On Track';

                if (daysRemaining <= 7) {
                    urgencyClass = 'critical';
                    urgencyText = `🚨 CRITICAL - ${daysRemaining} DAYS LEFT`;
                } else if (daysRemaining <= 14) {
                    urgencyClass = 'warning';
                    urgencyText = `⚠️ WARNING - ${daysRemaining} Days Left`;
                } else {
                    urgencyText = `✅ ${daysRemaining} Days Remaining`;
                }

                urgencyElement.className = `milestone-urgency ${urgencyClass}`;
                urgencyElement.textContent = urgencyText;
            }
        });
    }

    updateToolsGrid() {
        const toolsGrid = document.getElementById('tools-grid');
        if (!toolsGrid) return;

        toolsGrid.innerHTML = '';

        Object.entries(this.tools).forEach(([toolId, tool]) => {
            const toolCard = this.createToolCard(toolId, tool);
            toolsGrid.appendChild(toolCard);
        });
    }

    createToolCard(toolId, tool) {
        const card = document.createElement('div');
        card.className = `tool-card priority-${tool.priority} slide-in`;
        card.id = `tool-${toolId}`;

        const completedTasks = tool.completed || [];
        const remainingTasks = tool.techFreezeTasks || [];
        
        card.innerHTML = `
            <div class="tool-header">
                <div class="tool-name">${tool.name}</div>
                <div class="tool-status ${tool.status}">${this.getStatusText(tool.status)}</div>
            </div>
            
            <div class="tool-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${tool.progress}%"></div>
                </div>
                <div class="progress-text">${tool.progress}% Complete • Lead: ${tool.lead}</div>
            </div>

            ${remainingTasks.length > 0 ? `
                <div class="tool-tasks">
                    <h4>🎯 Tâches Tech Freeze:</h4>
                    <ul class="task-list">
                        ${remainingTasks.map(task => `<li>${task}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${completedTasks.length > 0 ? `
                <div class="tool-tasks">
                    <h4>✅ Terminé:</h4>
                    <ul class="task-list">
                        ${completedTasks.slice(-3).map(task => `<li style="color: var(--kaspa-green);">${task}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="tool-actions">
                <button class="btn btn-deploy" data-tool-id="${toolId}">
                    <i class="fas fa-rocket"></i> Déployer
                </button>
                <button class="btn btn-update" data-tool-id="${toolId}">
                    <i class="fas fa-edit"></i> Mettre à jour
                </button>
            </div>
        `;

        return card;
    }

    updateToolCard(toolId, tool) {
        const existingCard = document.getElementById(`tool-${toolId}`);
        if (existingCard) {
            const newCard = this.createToolCard(toolId, tool);
            existingCard.replaceWith(newCard);
        }
    }

    updateOverallProgress() {
        if (!this.tools) return;

        const toolsArray = Object.values(this.tools);
        const totalProgress = toolsArray.reduce((sum, tool) => sum + tool.progress, 0);
        const overallProgress = Math.round(totalProgress / toolsArray.length);
        
        const readyTools = toolsArray.filter(tool => tool.progress >= 90).length;
        const urgentCount = this.urgentTasks ? this.urgentTasks.length : 0;

        // Mise à jour du cercle de progression
        const progressCircle = document.querySelector('.progress-circle');
        const progressInner = document.getElementById('overall-progress');
        const progressPercentage = document.getElementById('overall-percentage');

        if (progressCircle && progressInner && progressPercentage) {
            const angle = (overallProgress / 100) * 360;
            progressCircle.style.background = `conic-gradient(var(--kaspa-green) 0deg, var(--kaspa-green) ${angle}deg, var(--border-color) ${angle}deg)`;
            progressPercentage.textContent = `${overallProgress}%`;
        }

        // Mise à jour des statistiques
        const toolsReadyElement = document.getElementById('tools-ready');
        const urgentTasksElement = document.getElementById('urgent-tasks');

        if (toolsReadyElement) toolsReadyElement.textContent = readyTools;
        if (urgentTasksElement) urgentTasksElement.textContent = urgentCount;
        
        // Update product management stats
        if (this.productData) {
            const launchReadinessElement = document.getElementById('launch-readiness');
            const kasPaymentsReadyElement = document.getElementById('kas-payments-ready');
            
            if (launchReadinessElement) {
                launchReadinessElement.textContent = `${this.productData.launchReadiness}%`;
            }
            
            if (kasPaymentsReadyElement && this.productData.kasPayments) {
                const readyCount = Object.values(this.productData.kasPayments.tools)
                    .filter(tool => tool.status === 'live' || tool.status === 'testing').length;
                kasPaymentsReadyElement.textContent = `${readyCount}/7`;
            }
        }
    }

    updateProductDashboard() {
        if (!this.productData) return;

        // Update Launch Readiness
        const readinessScoreElement = document.getElementById('readiness-score');
        if (readinessScoreElement) {
            readinessScoreElement.textContent = `${this.productData.launchReadiness}%`;
            readinessScoreElement.className = `readiness-score ${this.getReadinessClass(this.productData.launchReadiness)}`;
        }

        // Update KAS Payments Status
        this.updateKASPaymentsGrid();

        // Update Marketing Readiness
        if (this.productData.marketingReadiness) {
            const copyReadyElement = document.getElementById('copy-ready');
            const socialReadyElement = document.getElementById('social-ready');
            
            if (copyReadyElement) {
                copyReadyElement.textContent = `${this.productData.marketingReadiness.overall.copyReady}/${this.productData.marketingReadiness.overall.totalTools}`;
            }
            
            if (socialReadyElement) {
                socialReadyElement.textContent = `${this.productData.marketingReadiness.overall.socialReady}/${this.productData.marketingReadiness.overall.totalTools}`;
            }
        }
    }

    updateKASPaymentsGrid() {
        const kasStatusGrid = document.getElementById('kas-status-grid');
        if (!kasStatusGrid || !this.productData.kasPayments) return;

        kasStatusGrid.innerHTML = '';

        Object.entries(this.productData.kasPayments.tools).forEach(([toolId, tool]) => {
            const statusItem = document.createElement('div');
            statusItem.className = `kas-status-item ${tool.status}`;
            statusItem.innerHTML = `
                <div class="kas-tool-name">${tool.name}</div>
                <div class="kas-status-badge ${tool.status}">${this.getKASStatusText(tool.status)}</div>
                ${tool.blockers.length > 0 ? `<div class="kas-blockers">${tool.blockers.length} blockers</div>` : ''}
            `;
            kasStatusGrid.appendChild(statusItem);
        });
    }

    getReadinessClass(score) {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        if (score >= 40) return 'low';
        return 'critical';
    }

    getKASStatusText(status) {
        const statusMap = {
            'live': 'Live',
            'testing': 'Testing',
            'in_progress': 'In Progress',
            'planning': 'Planning',
            'not_started': 'Not Started'
        };
        return statusMap[status] || status;
    }

    updateAlerts(urgentTasks) {
        const alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer || !urgentTasks) return;

        if (urgentTasks.length === 0) {
            alertsContainer.innerHTML = `
                <div class="alert" style="border-left-color: var(--kaspa-green);">
                    <i class="fas fa-check-circle alert-icon" style="color: var(--kaspa-green);"></i>
                    <div class="alert-content">
                        <div class="alert-tool">Excellent travail!</div>
                        <div class="alert-message">Aucune tâche urgente détectée</div>
                    </div>
                </div>
            `;
            return;
        }

        alertsContainer.innerHTML = urgentTasks.map(task => `
            <div class="alert ${task.severity} slide-in">
                <i class="fas fa-exclamation-triangle alert-icon"></i>
                <div class="alert-content">
                    <div class="alert-tool">${task.tool}</div>
                    <div class="alert-message">${task.issue}</div>
                </div>
            </div>
        `).join('');
    }

    async deployTool(toolId) {
        if (!this.tools[toolId]) return;

        try {
            const response = await fetch(`/api/deploy/${toolId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`🚀 Déploiement de ${this.tools[toolId].name} initié`, 'success');
            } else {
                this.showNotification(`❌ Erreur lors du déploiement`, 'error');
            }
        } catch (error) {
            console.error('Erreur de déploiement:', error);
            this.showNotification(`❌ Erreur de connexion`, 'error');
        }
    }

    showUpdateModal(toolId) {
        const tool = this.tools[toolId];
        if (!tool) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <h3>Mettre à jour ${tool.name}</h3>
                <div class="modal-form">
                    <label>Progression (%):
                        <input type="number" id="progress-input" value="${tool.progress}" min="0" max="100">
                    </label>
                    <label>Statut:
                        <select id="status-input">
                            <option value="pending" ${tool.status === 'pending' ? 'selected' : ''}>En attente</option>
                            <option value="in_progress" ${tool.status === 'in_progress' ? 'selected' : ''}>En cours</option>
                            <option value="completed" ${tool.status === 'completed' ? 'selected' : ''}>Terminé</option>
                        </select>
                    </label>
                    <label>Tâche terminée:
                        <select id="completed-task-input">
                            <option value="">Sélectionner une tâche...</option>
                            ${tool.techFreezeTasks.map(task => `<option value="${task}">${task}</option>`).join('')}
                        </select>
                    </label>
                    <div class="modal-actions">
                        <button onclick="this.closest('.modal-overlay').remove()" class="btn">Annuler</button>
                        <button onclick="dashboard.submitUpdate('${toolId}')" class="btn btn-update">Mettre à jour</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async submitUpdate(toolId) {
        const progressInput = document.getElementById('progress-input');
        const statusInput = document.getElementById('status-input');
        const completedTaskInput = document.getElementById('completed-task-input');

        const updateData = {
            progress: parseInt(progressInput.value),
            status: statusInput.value,
            completedTask: completedTaskInput.value || undefined
        };

        try {
            const response = await fetch(`/api/tools/${toolId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`✅ ${result.tool.name} mis à jour`, 'success');
                document.querySelector('.modal-overlay').remove();
            } else {
                this.showNotification(`❌ Erreur lors de la mise à jour`, 'error');
            }
        } catch (error) {
            console.error('Erreur de mise à jour:', error);
            this.showNotification(`❌ Erreur de connexion`, 'error');
        }
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'En attente',
            'in_progress': 'En cours',
            'completed': 'Terminé'
        };
        return statusMap[status] || status;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? 'var(--kaspa-green)' : 
                           type === 'error' ? 'var(--kaspa-red)' : 'var(--kaspa-blue)'
        });

        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showDeploymentNotification(toolId, success) {
        const tool = this.tools[toolId];
        const message = success ? 
            `🚀 ${tool.name} déployé avec succès!` : 
            `❌ Échec du déploiement de ${tool.name}`;
        
        this.showNotification(message, success ? 'success' : 'error');
    }

    showUrgentNotification(count) {
        if (count > 0) {
            this.showNotification(`⚠️ ${count} tâches urgentes détectées!`, 'error');
        }
    }

    showConnectionError() {
        this.showNotification('❌ Connexion perdue avec le serveur', 'error');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Critical Blockers Alert System with Auto-Prioritization
    updateBlockersGrid() {
        const blockersGrid = document.getElementById('blockers-grid');
        if (!blockersGrid) return;

        const blockers = this.collectAllBlockers();
        const prioritizedBlockers = this.prioritizeBlockers(blockers);

        if (prioritizedBlockers.length === 0) {
            blockersGrid.innerHTML = `
                <div class="blocker-card" style="border-left-color: var(--kaspa-green);">
                    <div class="blocker-header">
                        <div class="blocker-tool">✅ All Clear!</div>
                    </div>
                    <div class="blocker-description">No critical blockers detected. Excellent progress!</div>
                </div>
            `;
            return;
        }

        blockersGrid.innerHTML = prioritizedBlockers.map(blocker => `
            <div class="blocker-card priority-${blocker.priority}">
                <div class="blocker-header">
                    <div class="blocker-tool">${blocker.tool}</div>
                    <div class="blocker-priority ${blocker.priority}">${blocker.priority}</div>
                </div>
                <div class="blocker-description">${blocker.description}</div>
                <div class="blocker-impact-score">
                    <i class="fas fa-bolt"></i>
                    <span>Impact: ${blocker.impactScore} tools affected</span>
                </div>
                <div class="blocker-actions">
                    <button class="btn btn-resolve" onclick="dashboard.markBlockerResolved('${blocker.id}')">
                        <i class="fas fa-check"></i> Mark Resolved
                    </button>
                </div>
            </div>
        `).join('');
    }

    collectAllBlockers() {
        if (!this.tools) return [];

        const blockers = [];
        Object.entries(this.tools).forEach(([toolId, tool]) => {
            if (tool.kasPayments?.blockers) {
                tool.kasPayments.blockers.forEach((blocker, index) => {
                    blockers.push({
                        id: `${toolId}-${index}`,
                        toolId: toolId,
                        tool: tool.name,
                        description: blocker,
                        priority: tool.priority,
                        progress: tool.progress,
                        impactScore: this.calculateBlockerImpact(toolId, blocker)
                    });
                });
            }
        });

        return blockers;
    }

    calculateBlockerImpact(toolId, blockerText) {
        // Calculate how many tools are affected by this blocker
        let impact = 1; // At least the tool itself

        // Common blockers affect multiple tools
        const commonBlockers = ['Kasplex', 'API rate', 'Wallet integration', 'L2 escrow'];
        if (commonBlockers.some(common => blockerText.includes(common))) {
            impact = Object.values(this.tools).filter(tool =>
                tool.kasPayments?.blockers?.some(b => b.includes(blockerText.split(' ')[0]))
            ).length;
        }

        return impact;
    }

    prioritizeBlockers(blockers) {
        // Auto-prioritization algorithm:
        // Score = (tool priority weight) + (progress penalty) + (impact multiplier)
        return blockers.map(blocker => {
            const priorityWeight = blocker.priority === 'high' ? 100 : blocker.priority === 'medium' ? 50 : 25;
            const progressPenalty = (100 - blocker.progress); // Lower progress = higher priority
            const impactMultiplier = blocker.impactScore * 20;

            blocker.priorityScore = priorityWeight + progressPenalty + impactMultiplier;
            return blocker;
        }).sort((a, b) => b.priorityScore - a.priorityScore);
    }

    markBlockerResolved(blockerId) {
        this.showNotification('🎉 Blocker marked as resolved!', 'success');
        // In production, this would update the backend
        setTimeout(() => this.loadInitialData(), 500);
    }

    // Critical Path Analytics with Auto-Refresh
    updateCriticalPath() {
        if (!this.productData) return;

        // Time to Tech Freeze
        const techFreezeCountdown = this.milestones.techFreeze?.countdown;
        if (techFreezeCountdown) {
            const match = techFreezeCountdown.match(/(\d+)j/);
            if (match) {
                const daysToFreeze = parseInt(match[1]);
                const daysToFreezeElement = document.getElementById('days-to-freeze');
                if (daysToFreezeElement) {
                    daysToFreezeElement.textContent = daysToFreeze;
                    daysToFreezeElement.style.color = daysToFreeze <= 7 ? 'var(--kaspa-red)' :
                                                       daysToFreeze <= 14 ? 'var(--kaspa-orange)' :
                                                       'var(--kaspa-green)';
                }

                // Progress bar (inverted - time running out)
                const freezeProgressBar = document.getElementById('freeze-time-progress');
                if (freezeProgressBar) {
                    const progressPercent = Math.max(0, ((90 - daysToFreeze) / 90) * 100);
                    freezeProgressBar.style.width = `${progressPercent}%`;
                }
            }
        }

        // Priority Tasks Count
        const priorityTasks = this.calculatePriorityTasks();
        const priorityTasksElement = document.getElementById('priority-tasks-count');
        if (priorityTasksElement) {
            priorityTasksElement.textContent = priorityTasks.count;
            priorityTasksElement.style.color = priorityTasks.count > 10 ? 'var(--kaspa-red)' : 'var(--kaspa-orange)';
        }

        const priorityTasksList = document.getElementById('priority-tasks-list');
        if (priorityTasksList && priorityTasks.tasks.length > 0) {
            priorityTasksList.innerHTML = priorityTasks.tasks.slice(0, 3).map(task =>
                `<div class="priority-task-item">${task}</div>`
            ).join('');
        }

        // Active Blockers Count
        const blockers = this.collectAllBlockers();
        const blockersCountElement = document.getElementById('active-blockers-count');
        if (blockersCountElement) {
            blockersCountElement.textContent = blockers.length;
        }

        const blockerImpactElement = document.getElementById('blocker-impact');
        if (blockerImpactElement) {
            const totalImpact = blockers.reduce((sum, b) => sum + b.impactScore, 0);
            blockerImpactElement.textContent = totalImpact > 5 ? `⚠️ High Impact (${totalImpact} tools)` :
                                                totalImpact > 0 ? `⚠️ Medium Impact (${totalImpact} tools)` :
                                                '✅ No Impact';
        }

        // Velocity Trend
        const velocity = this.calculateVelocityTrend();
        const velocityElement = document.getElementById('velocity-trend');
        const velocityIndicator = document.getElementById('velocity-indicator');
        if (velocityElement && velocityIndicator) {
            velocityElement.textContent = velocity.rate.toFixed(1);
            velocityIndicator.textContent = velocity.trend === 'up' ? '↗️ Improving' :
                                           velocity.trend === 'down' ? '↘️ Slowing' :
                                           '→ Stable';
            velocityIndicator.className = `velocity-indicator ${velocity.trend}`;
        }
    }

    calculatePriorityTasks() {
        if (!this.tools) return { count: 0, tasks: [] };

        let count = 0;
        let tasks = [];

        Object.entries(this.tools).forEach(([toolId, tool]) => {
            if (tool.techFreezeTasks) {
                tool.techFreezeTasks.forEach(task => {
                    count++;
                    const taskName = typeof task === 'string' ? task : task.name;
                    if (taskName && tool.priority === 'high') {
                        tasks.push(`${tool.name}: ${taskName}`);
                    }
                });
            }
        });

        return { count, tasks };
    }

    calculateVelocityTrend() {
        // Simplified velocity calculation based on completed tasks
        if (!this.tools) return { rate: 0, trend: 'stable' };

        let completedCount = 0;
        let totalTasks = 0;

        Object.values(this.tools).forEach(tool => {
            if (tool.completed) completedCount += tool.completed.length;
            if (tool.techFreezeTasks) totalTasks += tool.techFreezeTasks.length;
            if (tool.completed) totalTasks += tool.completed.length;
        });

        const rate = totalTasks > 0 ? (completedCount / totalTasks) * 10 : 0; // Tasks per week (simulated)

        // Trend based on progress
        const avgProgress = Object.values(this.tools).reduce((sum, t) => sum + t.progress, 0) / Object.values(this.tools).length;
        const trend = avgProgress > 55 ? 'up' : avgProgress > 45 ? 'stable' : 'down';

        return { rate, trend };
    }

    // Auto-refresh critical path every 30 seconds
    startCriticalPathAutoRefresh() {
        setInterval(() => {
            this.loadInitialData();
        }, 30000); // 30 seconds
    }
}

// Initialize auto-refresh when dashboard loads
setTimeout(() => {
    if (dashboard) {
        dashboard.startCriticalPathAutoRefresh();
    }
}, 1000);

// Styles pour la modal et les notifications
const modalStyles = `
    <style>
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .modal h3 {
            margin-bottom: 1.5rem;
            color: var(--text-primary);
        }
        
        .modal-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .modal-form label {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            color: var(--text-secondary);
        }
        
        .modal-form input,
        .modal-form select {
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--dark-bg);
            color: var(--text-primary);
        }
        
        .modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', modalStyles);

// Initialisation de l'application
const dashboard = new KaspaToolkitDashboard();

// Export global pour les fonctions appelées depuis le HTML
window.dashboard = dashboard;