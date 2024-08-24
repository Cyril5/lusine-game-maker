import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
//import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/darkly/bootstrap.min.css';


import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faFontAwesome } from '@fortawesome/free-brands-svg-icons';
library.add(fas, faTwitter, faFontAwesome);

import './assets/css/index.scss';


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
)

// Assurez-vous que le code est exécuté après que le DOM est chargé
document.addEventListener('DOMContentLoaded', async () => {
  alert("KABOUM !");

  try {
      // Charger Pyodide
      const pyodide = await loadPyodide();
      console.warn("Pyodide chargé :", pyodide);

      // Rendre Pyodide disponible globalement
      (window as any).pyodide = pyodide;

      // Exemple d'exécution Python
      const result = pyodide.runPython("print('Hello from Python')");
      console.log(result);
  } catch (error) {
      console.error("Erreur lors du chargement de Pyodide :", error);
  }
});
