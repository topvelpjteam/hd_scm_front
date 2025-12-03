import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App.tsx'
import './index.css'

// AG Grid 모듈 등록
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Register all community modules and TreeDataModule for tree data support
// Register AllCommunityModule and TreeDataModule for tree data support
ModuleRegistry.registerModules([
  AllCommunityModule
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
