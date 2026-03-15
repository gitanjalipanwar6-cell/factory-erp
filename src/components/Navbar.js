export function initNavbar(container, navigate) {
    const user = JSON.parse(localStorage.getItem('erp_currentUser') || '{}')
    const userName = user.name || 'Admin User'
    const userInitial = userName.charAt(0).toUpperCase()

    container.innerHTML = `
        <div class="bg-factory-blue text-white shadow-lg">
            <div class="max-w-[1600px] mx-auto">
                <!-- Top Strip -->
                <div class="flex items-center justify-between px-6 py-3 border-b border-white/10">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-white rounded flex items-center justify-center text-factory-blue">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9h18V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4Z"/><path d="M12 12v6"/><path d="M8 12v6"/><path d="M16 12v6"/></svg>
                        </div>
                        <h1 class="text-xl font-black tracking-tight uppercase">Factory ERP</h1>
                        <span class="ml-4 px-3 py-0.5 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/70 border border-white/55 shadow-sm">Global Plant #1</span>
                    </div>
                    
                    <div class="flex items-center gap-5">
                        <div class="hidden md:flex flex-col text-right">
                             <span class="text-[10px] font-bold uppercase text-white/50 leading-none">${userName}</span>
                             <button id="logout-btn" class="text-xs font-bold leading-tight text-white/80 hover:text-white transition-colors text-right">Logout</button>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-orange-500 border-2 border-white/20 flex items-center justify-center font-bold text-sm shadow-inner">${userInitial}</div>
                    </div>
                </div>

                <!-- Navigation Bar -->
                <nav class="flex items-center px-4 overflow-x-auto no-scrollbar">
                    <a href="#dashboard" class="nav-link active" data-page="dashboard">Dashboard</a>
                    <a href="#orders" class="nav-link" data-page="orders">Orders Database</a>
                    <a href="#production" class="nav-link" data-page="production">Production Planning</a>
                    <a href="#dpr" class="nav-link" data-page="dpr">Daily Reports (DPR)</a>
                    <a href="#inventory" class="nav-link" data-page="inventory">Inventory</a>
                    <a href="#dispatch" class="nav-link" data-page="dispatch">Dispatch Tracking</a>
                </nav>
            </div>
        </div>
    `
    
    container.addEventListener('click', (e) => {
        const logoutBtn = e.target.closest('#logout-btn')
        if (logoutBtn) {
            localStorage.removeItem('erp_currentUser')
            window.location.hash = 'login'
            return
        }

        const link = e.target.closest('.nav-link')
        if (link) {
            e.preventDefault()
            const page = link.getAttribute('href').substring(1)
            window.location.hash = page
            navigate(page)
        }
    })
}
