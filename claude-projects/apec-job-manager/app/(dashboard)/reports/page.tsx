'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Analysez les performances de vos annonces
          </p>
        </div>
        <Button>Exporter en PDF</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Rapport hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Résumé de la semaine dernière
            </p>
            <Button variant="secondary" size="sm" fullWidth>
              Voir le rapport
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rapport mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Analyse mensuelle détaillée
            </p>
            <Button variant="secondary" size="sm" fullWidth>
              Voir le rapport
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rapport personnalisé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Créez votre propre rapport
            </p>
            <Button variant="secondary" size="sm" fullWidth>
              Créer un rapport
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance globale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            Graphiques et statistiques à venir
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
