export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-medical-blue-50 to-security-green-50">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-medical-blue-900 mb-4">
            MUSIC
          </h1>
          <h2 className="text-2xl text-medical-blue-700 mb-8">
            Medical Universal Secure Identification Code
          </h2>

          <p className="text-lg text-gray-700 mb-6">
            Sécurisation d'ordonnances médicales par QR codes chiffrés autoporteurs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-medical-blue-600">
              <h3 className="text-xl font-semibold text-medical-blue-900 mb-3">
                🔐 Sécurité Maximale
              </h3>
              <p className="text-gray-700">
                Chiffrement ECIES hybride + signatures ECDSA P-256. Données sensibles protégées end-to-end.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-security-green-600">
              <h3 className="text-xl font-semibold text-security-green-900 mb-3">
                ✅ Conforme Réglementation
              </h3>
              <p className="text-gray-700">
                INS, RPPS, BDPM. Respect RGPD, audit trail complet, hébergement HDS.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-warning-orange-600">
              <h3 className="text-xl font-semibold text-warning-orange-900 mb-3">
                📱 QR Code Autonome
              </h3>
              <p className="text-gray-700">
                Ordonnance complète dans un QR scannable. Fonctionne online et offline.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-alert-red-600">
              <h3 className="text-xl font-semibold text-alert-red-900 mb-3">
                🚨 Anti-Fraude
              </h3>
              <p className="text-gray-700">
                Détection doctor shopping, rejeu d'ordonnance, alertes automatiques.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-medical-blue-900 mb-4">
              MVP - Phase 1
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center">
                <span className="text-security-green-600 font-bold mr-3">✓</span>
                Génération QR codes chiffrés (ECIES + ECDSA)
              </li>
              <li className="flex items-center">
                <span className="text-security-green-600 font-bold mr-3">✓</span>
                Interface prescripteur (création ordonnances)
              </li>
              <li className="flex items-center">
                <span className="text-security-green-600 font-bold mr-3">✓</span>
                Interface pharmacien (scan + vérification + délivrance)
              </li>
              <li className="flex items-center">
                <span className="text-security-green-600 font-bold mr-3">✓</span>
                Système anti-fraude (doctor shopping)
              </li>
              <li className="flex items-center">
                <span className="text-alert-red-600 font-bold mr-3">✗</span>
                <span className="text-gray-500">Médicaments stupéfiants (phase 2)</span>
              </li>
              <li className="flex items-center">
                <span className="text-alert-red-600 font-bold mr-3">✗</span>
                <span className="text-gray-500">Pro Santé Connect (phase 2)</span>
              </li>
            </ul>
          </div>

          <div className="bg-medical-blue-50 border border-medical-blue-200 rounded-lg p-6">
            <p className="text-medical-blue-900">
              <span className="font-semibold">Status:</span> Initialisation du projet en cours...
            </p>
            <p className="text-medical-blue-800 text-sm mt-2">
              Interface utilisateur en développement. Modules d'authentification et cryptographie en construction.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
