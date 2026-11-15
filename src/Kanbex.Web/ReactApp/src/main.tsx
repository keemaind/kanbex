import React from 'react'
import { createRoot } from 'react-dom/client'
import { Button, ThemeProvider } from 'm3-expressive-react'
import 'm3-expressive-react/styles.css'
import './styles.css'

function App() {
  return (
    <ThemeProvider seedColor="#6750a4" mode="light">
      <section className="demo-card" aria-labelledby="demo-title">
        <div className="demo-copy">
          <span className="eyebrow">Material 3 Expressive</span>
          <h1 id="demo-title">Кнопки с характером</h1>
          <p>Разные варианты компонента Button — наглядное знакомство с выразительной системой Material 3.</p>
        </div>
        <div className="button-showcase" aria-label="Варианты кнопок">
          <div className="button-example">
            <Button variant="filled" onClick={() => console.info('Filled button clicked')}>
              Filled
            </Button>
            <span>Filled</span>
          </div>
          <div className="button-example">
            <Button variant="tonal" onClick={() => console.info('Tonal button clicked')}>
              Tonal
            </Button>
            <span>Tonal</span>
          </div>
          <div className="button-example">
            <Button variant="outlined" onClick={() => console.info('Outlined button clicked')}>
              Outlined
            </Button>
            <span>Outlined</span>
          </div>
          <div className="button-example">
            <Button variant="text" onClick={() => console.info('Text button clicked')}>
              Text
            </Button>
            <span>Text</span>
          </div>
        </div>
      </section>
    </ThemeProvider>
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('React mount element #root was not found')

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
