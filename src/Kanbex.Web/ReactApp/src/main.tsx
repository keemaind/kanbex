import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.js'
import '@kanbex/ui/styles.css'
import './styles.css'

const container = document.getElementById('root')
if (!container) throw new Error('React mount element #root was not found')

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
