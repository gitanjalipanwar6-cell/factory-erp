export function initHeader(container) {
    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    container.innerHTML = `
        <div class="flex items-center justify-between h-full px-6">
            <div class="flex items-center gap-4">
                <h2 class="text-xl font-bold text-slate-800">Global Manufacturing Plant #1</h2>
                <span class="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">${today}</span>
            </div>
            
            <div class="flex items-center gap-6">
                <div class="relative">
                    <button class="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>
                
                <div class="flex items-center gap-3 pl-6 border-l border-slate-200">
                    <div class="text-right">
                        <p class="text-sm font-semibold text-slate-800">Amit Panwar</p>
                        <p class="text-xs text-slate-500">Super Admin</p>
                    </div>
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Amit" class="w-9 h-9 rounded-full bg-slate-100" />
                </div>
            </div>
        </div>
    `
}
