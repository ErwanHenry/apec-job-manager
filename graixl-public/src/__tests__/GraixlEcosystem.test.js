const { GraixlEcosystem } = require('../GraixlEcosystem');

describe('GraixlEcosystem', () => {
  let ecosystem;

  beforeEach(() => {
    ecosystem = new GraixlEcosystem();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(ecosystem).toBeDefined();
      expect(ecosystem.engines).toBeDefined();
      expect(ecosystem.config).toBeDefined();
    });

    test('should have all 6 AI engines', () => {
      const engines = ecosystem.engines;
      expect(engines.intelligence).toBeDefined();
      expect(engines.analytics).toBeDefined();
      expect(engines.orchestration).toBeDefined();
      expect(engines.recommendations).toBeDefined();
      expect(engines.workflows).toBeDefined();
      expect(engines.agents).toBeDefined();
    });

    test('should initialize with correct status', () => {
      expect(ecosystem.status).toBe('initializing');
    });
  });

  describe('AI Engines', () => {
    test('intelligence engine should process data correctly', async () => {
      const result = await ecosystem.engines.intelligence.process({ test: 'data' });
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
    });

    test('analytics engine should generate metrics', async () => {
      const metrics = await ecosystem.engines.analytics.generateMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.collaborationIndex).toBeGreaterThanOrEqual(0);
      expect(metrics.collaborationIndex).toBeLessThanOrEqual(100);
    });

    test('orchestration engine should coordinate tasks', async () => {
      const task = { type: 'test', priority: 'high' };
      const result = await ecosystem.engines.orchestration.coordinate(task);
      expect(result).toBeDefined();
      expect(result.assigned).toBe(true);
    });

    test('recommendations engine should provide suggestions', async () => {
      const context = { user: 'test', activity: 'prospection' };
      const recommendations = await ecosystem.engines.recommendations.suggest(context);
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('workflows engine should execute workflows', async () => {
      const workflow = { name: 'test-workflow', steps: [] };
      const result = await ecosystem.engines.workflows.execute(workflow);
      expect(result).toBeDefined();
      expect(result.completed).toBe(true);
    });

    test('agents engine should manage agent pool', () => {
      const agentCount = ecosystem.engines.agents.getActiveAgents().length;
      expect(agentCount).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Cross-Engine Coordination', () => {
    test('should coordinate between intelligence and analytics', async () => {
      const intelligenceResult = await ecosystem.engines.intelligence.process({ test: 'data' });
      const analyticsResult = await ecosystem.engines.analytics.analyzeResult(intelligenceResult);
      expect(analyticsResult).toBeDefined();
      expect(analyticsResult.insights).toBeDefined();
    });

    test('should coordinate between orchestration and workflows', async () => {
      const task = { type: 'workflow', workflowId: 'test-123' };
      const orchestrationResult = await ecosystem.engines.orchestration.coordinate(task);
      const workflowResult = await ecosystem.engines.workflows.execute(orchestrationResult.workflow);
      expect(workflowResult.completed).toBe(true);
    });

    test('should have high collaboration index', async () => {
      const metrics = await ecosystem.engines.analytics.generateMetrics();
      expect(metrics.collaborationIndex).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Resilience', () => {
    test('should handle engine failures gracefully', async () => {
      // Simulate engine failure
      ecosystem.engines.intelligence.process = jest.fn().mockRejectedValue(new Error('Engine failure'));

      const result = await ecosystem.handleEngineFailure('intelligence');
      expect(result).toBeDefined();
      expect(result.recovered).toBe(true);
    });

    test('should maintain service with degraded engines', async () => {
      // Disable one engine
      ecosystem.engines.intelligence.disabled = true;

      const healthCheck = await ecosystem.getSystemHealth();
      expect(healthCheck.status).toBe('degraded');
      expect(healthCheck.activeEngines).toBe(5);
    });

    test('should restart failed engines', async () => {
      const beforeCount = ecosystem.engines.agents.getActiveAgents().length;
      await ecosystem.restartEngine('agents');
      const afterCount = ecosystem.engines.agents.getActiveAgents().length;
      expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
    });
  });

  describe('Performance Metrics', () => {
    test('should track response times', async () => {
      const startTime = Date.now();
      await ecosystem.engines.intelligence.process({ test: 'data' });
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond in < 1s
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map((_, i) =>
        ecosystem.engines.intelligence.process({ id: i })
      );
      const results = await Promise.all(requests);
      expect(results.length).toBe(10);
      expect(results.every(r => r.status === 'success')).toBe(true);
    });

    test('should optimize resource usage', async () => {
      const memBefore = process.memoryUsage().heapUsed;
      await ecosystem.engines.analytics.generateMetrics();
      const memAfter = process.memoryUsage().heapUsed;
      const memIncrease = (memAfter - memBefore) / 1024 / 1024; // MB
      expect(memIncrease).toBeLessThan(50); // Should use < 50MB
    });
  });

  describe('Event System', () => {
    test('should emit events on engine actions', (done) => {
      ecosystem.on('engine:processed', (data) => {
        expect(data).toBeDefined();
        expect(data.engine).toBe('intelligence');
        done();
      });
      ecosystem.engines.intelligence.process({ test: 'data' });
    });

    test('should handle event errors gracefully', async () => {
      ecosystem.on('error', (error) => {
        expect(error).toBeDefined();
      });
      await ecosystem.emitError(new Error('Test error'));
    });
  });
});
