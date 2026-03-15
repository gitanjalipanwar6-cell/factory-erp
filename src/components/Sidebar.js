export function initSidebar(container, navigate) {
    container.innerHTML = `
        <div class="flex flex-col h-full">
            <div class="p-6 flex items-center gap-3">
                <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-factory-blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9h18V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4Z"/><path d="M12 12v6"/><path d="M8 12v6"/><path d="M16 12v6"/></svg>
                </div>
                <h1 class="text-xl font-bold tracking-tight">FACTORY ERP</h1>
            </div>
            
            <nav class="flex-1 px-4 py-4 space-y-1">
                <a href="#dashboard" class="sidebar-link active" data-page="dashboard">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                    Dashboard
                </a>
                <a href="#orders" class="sidebar-link" data-page="orders">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    Orders Database
                </a>
                <a href="#production" class="sidebar-link" data-page="production">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Production Planning
                </a>
                <a href="#dpr" class="sidebar-link" data-page="dpr">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M8 15h8"/></svg>
                    Daily Reports (DPR)
                </a>
                <a href="#inventory" class="sidebar-link" data-page="inventory">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                    Inventory
                </a>
                <a href="#dispatch" class="sidebar-link" data-page="dispatch">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2h-2"/><circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/><path d="M13 18h2"/><path d="M17 18h2c1.1 0 2-.9 2-2v-3l-3-4h-3v7c0 1.1.9 2 2 2z"/></svg>
                    Dispatch Tracking
                </a>
            </nav>
            
            <div class="p-4 border-t border-factory-blue/20">
                <div class="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
                    <div class="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">A</div>
                    <div>
                        <p class="text-sm font-semibold">Admin User</p>
                        <p class="text-xs text-white/60">Factory Manager</p>
                    </div>
                </div>
            </div>
        </div>
    `
    
    container.addEventListener('click', (e) => {
        const link = e.target.closest('.sidebar-link')
        if (link) {
            e.preventDefault()
            const page = link.getAttribute('href').substring(1)
            window.location.hash = page
            navigate(page)
        }
    })
}
