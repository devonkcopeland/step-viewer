import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted webfonts. Bundled by Vite so no third-party requests (Google
// Fonts etc.) are made at runtime — important for the "no data leaves your
// device" privacy claim. See Footer.tsx tooltip.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'

import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './lib/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
