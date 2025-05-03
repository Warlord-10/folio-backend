import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Home from './Home.jsx'
import "./styles.css";

const rootElement = document.getElementById('userPageRoot')

// const root = hydrateRoot(rootElement, <Home />)

const root = createRoot(rootElement)
root.render(<Home />)