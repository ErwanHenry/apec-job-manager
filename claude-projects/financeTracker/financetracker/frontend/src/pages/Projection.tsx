import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useProjection } from '../hooks/useProjection';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Projection() {
  const { projection, loading, months, setMonths } = useProjection(6);
  const [selectedScenario, setSelectedScenario] = useState<'pessimistic' | 'realistic' | 'optimistic'>('realistic');

  const handleMonthsChange = (newMonths: number) => {
    setMonths(newMonths);
  };

  const scenarios = [
    { id: 'pessimistic', label: 'Pessimiste', color: '#ef4444', icon: '📉' },
    { id: 'realistic', label: 'Réaliste', color: '#22c55e', icon: '📊' },
    { id: 'optimistic', label: 'Optimiste', color: '#3b82f6', icon: '📈' },
  ];

  const currentData = projection?.[selectedScenario];

  // Prepare chart data with all three scenarios
  const chartData = projection && projection.realistic.points
    ? projection.realistic.points.map((point, index) => ({
        date: point.date,
        pessimistic: projection.pessimistic.points[index]?.balance || 0,
        realistic: projection.realistic.points[index]?.balance || 0,
        optimistic: projection.optimistic.points[index]?.balance || 0,
      }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Projection de solde</h2>
        <p className="text-gray-600 mt-1">Visualisez l'évolution prévue de votre solde sur les prochains mois</p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <label htmlFor="months" className="input-label">
              Période de projection
            </label>
            <select
              id="months"
              value={months}
              onChange={(e) => handleMonthsChange(parseInt(e.target.value))}
              disabled={loading}
              className="input-field"
            >
              <option value="3">3 mois</option>
              <option value="6">6 mois</option>
              <option value="12">12 mois</option>
            </select>
          </div>

          <div>
            <p className="input-label mb-2">Scénario</p>
            <div className="flex gap-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id as any)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedScenario === scenario.id
                      ? `text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={
                    selectedScenario === scenario.id
                      ? { backgroundColor: scenario.color }
                      : undefined
                  }
                >
                  <span>{scenario.icon}</span>
                  {scenario.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="card h-96 bg-gray-100 rounded-lg animate-pulse" />
      ) : chartData.length > 0 ? (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du solde</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                formatter={(value: number) => formatCurrency(value, 'EUR')}
                labelFormatter={(date: string) => formatDate(date)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="pessimistic"
                stroke="#ef4444"
                name="Pessimiste"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="realistic"
                stroke="#22c55e"
                name="Réaliste"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="optimistic"
                stroke="#3b82f6"
                name="Optimiste"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-lg text-gray-600">Pas de données de projection disponibles</p>
        </div>
      )}

      {/* Scenario Details */}
      {currentData && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Détails du scénario {scenarios.find((s) => s.id === selectedScenario)?.label.toLowerCase()}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Solde actuel</p>
              <p className={`text-2xl font-bold mt-2 ${
                currentData.starting_balance >= 0 ? 'text-primary-600' : 'text-danger-600'
              }`}>
                {formatCurrency(currentData.starting_balance, 'EUR')}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Solde en fin de période</p>
              <p className={`text-2xl font-bold mt-2 ${
                currentData.ending_balance >= 0 ? 'text-primary-600' : 'text-danger-600'
              }`}>
                {formatCurrency(currentData.ending_balance, 'EUR')}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Variation</p>
              <p className={`text-2xl font-bold mt-2 ${
                (currentData.ending_balance - currentData.starting_balance) >= 0
                  ? 'text-primary-600'
                  : 'text-danger-600'
              }`}>
                {formatCurrency(
                  currentData.ending_balance - currentData.starting_balance,
                  'EUR'
                )}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Solde minimum</p>
              <p className="text-2xl font-bold mt-2 text-accent-600">
                {formatCurrency(currentData.min_balance, 'EUR')}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Solde maximum</p>
              <p className="text-2xl font-bold mt-2 text-primary-600">
                {formatCurrency(currentData.max_balance, 'EUR')}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Solde moyen</p>
              <p className="text-2xl font-bold mt-2 text-gray-900">
                {formatCurrency(currentData.average_balance, 'EUR')}
              </p>
            </div>
          </div>

          {/* Health Indicator */}
          <div className="mt-6 p-4 rounded-lg bg-primary-50 border border-primary-200">
            <p className="text-sm font-medium text-primary-900">
              ✓ Prévisions calculées sur {months} mois
            </p>
            <p className="text-xs text-primary-700 mt-1">
              Ces projections sont basées sur vos transactions historiques et transactions récurrentes
              configurées.
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 À propos des scénarios</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>
            <strong>Pessimiste:</strong> Exclut les revenus variables, ajoute une variance aux
            dépenses
          </li>
          <li>
            <strong>Réaliste:</strong> Utilise les montants moyens de vos transactions
          </li>
          <li>
            <strong>Optimiste:</strong> Inclut les revenus maximaux, réduit les dépenses variables
          </li>
        </ul>
      </div>
    </div>
  );
}
