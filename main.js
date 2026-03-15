import './style.css'
import { initNavbar } from './src/components/Navbar'
import { renderDashboard } from './src/pages/Dashboard'
import { renderOrders } from './src/pages/Orders'
import { renderProduction } from './src/pages/Production'
import { renderDPR } from './src/pages/DPR'
import { renderInventory } from './src/pages/Inventory'
import { renderDispatch } from './src/pages/Dispatch'
import { renderLogin, renderSignup } from './src/pages/Auth'

const app = document.querySelector('#app')

const routes = {
    'login': renderLogin,
    'signup': renderSignup,
    'dashboard': renderDashboard,
    'orders': renderOrders,
    'production': renderProduction,
    'dpr': renderDPR,
    'inventory': renderInventory,
    'dispatch': renderDispatch
}

async function navigate(page) {
    const isAuthenticated = localStorage.getItem('erp_currentUser')
    const authPages = ['login', 'signup']
    
    // Redirect logic
    let targetPage = page
    if (!isAuthenticated && !authPages.includes(page)) {
        targetPage = 'login'
        window.location.hash = 'login'
    } else if (isAuthenticated && authPages.includes(page)) {
        targetPage = 'dashboard'
        window.location.hash = 'dashboard'
    }

    const renderFunc = routes[targetPage] || renderDashboard
    const contentArea = document.querySelector('#main-content')
    const navContainer = document.querySelector('#nav-container')
    const footer = document.querySelector('#app-footer')

    if (contentArea) {
        // Handle Layout Visibility
        const isAuthPage = authPages.includes(targetPage)
        if (isAuthPage) {
            document.body.classList.add('auth-page')
            navContainer.style.display = 'none'
            footer.style.display = 'none'
        } else {
            document.body.classList.remove('auth-page')
            navContainer.style.display = 'block'
            footer.style.display = 'block'
        }

        contentArea.innerHTML = ''
        await renderFunc(contentArea)
        
        // Update active link in navbar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active')
            if (link.dataset.page === targetPage) {
                link.classList.add('active')
            }
        })
    }
}

function initApp() {
    app.innerHTML = `
        <header id="nav-container" class="sticky top-0 z-50"></header>
        <main id="main-content" class="flex-1 max-w-[1600px] mx-auto w-full p-6"></main>
        <footer id="app-footer" class="bg-white border-t border-slate-200 py-4 px-6 text-center text-slate-400 text-xs">
            &copy; 2024 Factory ERP Management System - All Rights Reserved
        </footer>
    `
    
    initNavbar(document.querySelector('#nav-container'), navigate)
    
    // Initial navigation
    const hash = window.location.hash.substring(1) || 'dashboard'
    navigate(hash)
    
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.substring(1) || 'dashboard'
        navigate(page)
    })
}

initApp()
