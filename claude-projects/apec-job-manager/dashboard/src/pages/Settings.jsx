export default function Settings() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Paramètres</h1>

      <div className="space-y-6">
        {/* APEC Configuration */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Configuration APEC
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Gérez vos identifiants de connexion APEC</p>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email APEC
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-apec-blue focus:border-apec-blue sm:text-sm"
                  placeholder="votre.email@entreprise.fr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-apec-blue focus:border-apec-blue sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="mt-5">
              <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-apec-blue hover:bg-apec-lightblue">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>

        {/* Synchronization Settings */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Synchronisation automatique
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Configurez la fréquence de synchronisation avec APEC</p>
            </div>
            <div className="mt-5">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-apec-blue focus:ring-apec-blue border-gray-300 rounded"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-gray-700">
                  Activer la synchronisation automatique
                </span>
              </label>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Fréquence
                </label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-apec-blue focus:border-apec-blue sm:text-sm">
                  <option>Toutes les heures</option>
                  <option>Toutes les 6 heures</option>
                  <option>Toutes les 12 heures</option>
                  <option>Une fois par jour</option>
                </select>
              </div>
            </div>
            <div className="mt-5">
              <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-apec-blue hover:bg-apec-lightblue">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Notifications
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Gérez vos préférences de notification</p>
            </div>
            <div className="mt-5 space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-apec-blue focus:ring-apec-blue border-gray-300 rounded"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-gray-700">
                  Recevoir un email pour les nouvelles candidatures
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-apec-blue focus:ring-apec-blue border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Recevoir un rapport hebdomadaire
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-apec-blue focus:ring-apec-blue border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Alertes en cas d'erreur de synchronisation
                </span>
              </label>
            </div>
            <div className="mt-5">
              <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-apec-blue hover:bg-apec-lightblue">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
