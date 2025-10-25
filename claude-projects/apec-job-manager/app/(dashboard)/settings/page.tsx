'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // TODO: Implement save logic
    setTimeout(() => setIsSaving(false), 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configurez votre compte et les paramètres de synchronisation
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="apec-label">
                  Nom
                </label>
                <Input id="name" type="text" placeholder="Votre nom" />
              </div>
              <div>
                <label htmlFor="email" className="apec-label">
                  Email
                </label>
                <Input id="email" type="email" placeholder="votre@email.com" />
              </div>
              <Button onClick={handleSave} isLoading={isSaving}>
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* APEC Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Identifiants APEC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="apec-email" className="apec-label">
                  Email APEC
                </label>
                <Input
                  id="apec-email"
                  type="email"
                  placeholder="votre@email.apec.fr"
                />
              </div>
              <div>
                <label htmlFor="apec-password" className="apec-label">
                  Mot de passe APEC
                </label>
                <Input
                  id="apec-password"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
              <Button onClick={handleSave} isLoading={isSaving}>
                Mettre à jour
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Synchronisation automatique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Synchronisation automatique
                  </p>
                  <p className="text-xs text-gray-500">
                    Synchroniser automatiquement les annonces
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-apec-blue focus:ring-apec-blue border-gray-300 rounded"
                />
              </div>
              <div>
                <label htmlFor="sync-frequency" className="apec-label">
                  Fréquence
                </label>
                <select id="sync-frequency" className="apec-input">
                  <option value="hourly">Toutes les heures</option>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>
              <Button onClick={handleSave} isLoading={isSaving}>
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Notifications par email
                  </p>
                  <p className="text-xs text-gray-500">
                    Recevoir des notifications par email
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-apec-blue focus:ring-apec-blue border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Alertes de synchronisation
                  </p>
                  <p className="text-xs text-gray-500">
                    Être notifié en cas d'erreur
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-apec-blue focus:ring-apec-blue border-gray-300 rounded"
                />
              </div>
              <Button onClick={handleSave} isLoading={isSaving}>
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
