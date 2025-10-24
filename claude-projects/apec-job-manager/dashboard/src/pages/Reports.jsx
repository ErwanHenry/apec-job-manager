import { useEffect, useState } from 'react'
import axios from 'axios'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'

const reportTypeLabels = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuel',
  CUSTOM: 'Personnalisé'
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports')
      setReports(response.data.data.reports)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      setLoading(false)
    }
  }

  const generateReport = async (type) => {
    setGenerating(true)
    try {
      await axios.get(`/api/reports/${type}`)
      await fetchReports()
      alert('Rapport généré avec succès!')
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Échec de la génération du rapport')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rapports</h1>
          <p className="mt-2 text-sm text-gray-700">
            Générez et consultez vos rapports d'activité
          </p>
        </div>
      </div>

      {/* Generate Report Buttons */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Générer un nouveau rapport
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => generateReport('daily')}
              disabled={generating}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-apec-blue hover:bg-apec-lightblue disabled:opacity-50"
            >
              Rapport quotidien
            </button>
            <button
              onClick={() => generateReport('weekly')}
              disabled={generating}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-apec-blue hover:bg-apec-lightblue disabled:opacity-50"
            >
              Rapport hebdomadaire
            </button>
            <button
              onClick={() => generateReport('monthly')}
              disabled={generating}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-apec-blue hover:bg-apec-lightblue disabled:opacity-50"
            >
              Rapport mensuel
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {reports.map((report) => (
            <li key={report.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-apec-blue">
                        {reportTypeLabels[report.type]} - {report.period}
                      </p>
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Disponible
                      </span>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Généré le {new Date(report.generatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {report.data && (
                      <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Annonces créées:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {report.data.summary?.jobsCreated || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Vues totales:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {report.data.summary?.totalViews || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Candidatures:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {report.data.summary?.totalApplications || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Taux moyen:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {report.data.summary?.jobsCreated > 0
                              ? ((report.data.summary?.totalApplications / report.data.summary?.totalViews) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-5 flex-shrink-0">
                    <a
                      href={`/api/reports/${report.id}/export?format=pdf`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
                      Export PDF
                    </a>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
