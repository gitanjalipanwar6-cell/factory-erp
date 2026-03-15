import { supabase } from '../lib/supabase'
import { exportToExcel } from '../lib/utils'

export async function renderInventory(container) {
    let inventory = []

    async function fetchData() {
        const { data } = await supabase.from('inventory').select('*').order('name')
        inventory = data || []
    }

    async function updateView() {
        await fetchData()
        const totalItems = inventory.length
        const lowStockItems = inventory.filter(i => i.stock <= i.min).length
        const stockValue = inventory.reduce((sum, i) => sum + (i.stock * (i.rate || 0)), 0)

        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Inventory Management</h1>
                        <p class="text-slate-500">Track raw materials and stock levels</p>
                    </div>
                    <div class="flex gap-3">
                        <button id="download-inventory" class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download Report
                        </button>
                        <button id="add-stock-btn" class="px-4 py-2 bg-factory-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 shadow-md transition-all hover:translate-y-[-1px] active:translate-y-[0px]">+ Add Stock</button>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-card p-6 border-l-4 border-factory-blue shadow-sm">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-1">Total Items</p>
                        <div class="flex items-center justify-between">
                            <h3 class="text-3xl font-black text-slate-900">${totalItems}</h3>
                            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                            </div>
                        </div>
                    </div>
                    <div class="glass-card p-6 border-l-4 border-orange-500 shadow-sm">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-1">Low Stock Alert</p>
                        <div class="flex items-center justify-between">
                            <h3 class="text-3xl font-black text-orange-600">${lowStockItems}</h3>
                            <div class="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            </div>
                        </div>
                    </div>
                    <div class="glass-card p-6 border-l-4 border-green-600 shadow-sm">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-1">Stock Value</p>
                        <div class="flex items-center justify-between">
                            <h3 class="text-3xl font-black text-green-700">₹${stockValue.toLocaleString()}</h3>
                            <div class="p-2 bg-green-50 text-green-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="glass-card overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Image</th>
                                <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Width</th>
                                <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Fold L</th>
                                <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-factory-blue">Style No</th>
                                <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-factory-blue">Item ID</th>
                                <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Name</th>
                                <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase text-center tracking-widest">Stock Level</th>
                                <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th class="px-6 py-4 text-xs font-black text-slate-500 uppercase text-right tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body" class="divide-y divide-slate-100 bg-white">
                            ${inventory.length > 0 ? inventory.map(item => `
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="px-6 py-4 flex justify-center">
                                        <div class="w-[60px] h-[40px] bg-slate-100 rounded border border-slate-200 overflow-hidden group relative">
                                            ${item.image_url ? 
                                                `<img src="${item.image_url}" class="w-full h-full object-cover transition-transform group-hover:scale-125" alt="${item.name}">` : 
                                                `<div class="w-full h-full flex items-center justify-center text-[10px] text-slate-300 font-bold italic">No Pic</div>`
                                            }
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-sm font-bold text-slate-700">${item.width || '-'}</td>
                                    <td class="px-6 py-4 text-sm font-bold text-slate-700">${item.fold_l || '-'}</td>
                                    <td class="px-6 py-4 text-sm font-black text-factory-blue">${item.style_no || '-'}</td>
                                    <td class="px-6 py-4 text-sm font-medium text-slate-600">#${item.id.substring(0,6).toUpperCase()}</td>
                                    <td class="px-6 py-4 text-sm font-bold text-slate-800">${item.name}</td>
                                    <td class="px-6 py-4 text-sm text-center font-black text-slate-900">${item.stock} ${item.unit || 'unit'}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 text-[10px] font-black uppercase rounded-md ${item.stock <= item.min ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}">
                                            ${item.stock <= item.min ? 'Low Stock' : 'Healthy'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="flex justify-end gap-2">
                                            <button class="p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-factory-blue action-btn transition-colors" data-action="view" data-id="${item.id}" title="View">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                                            </button>
                                            <button class="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 action-btn transition-colors" data-action="delete" data-id="${item.id}" title="Delete">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="9" class="px-6 py-12 text-center text-slate-400 italic">No inventory records found. Add stock to begin.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `

        // Add Listeners
        container.querySelector('#download-inventory')?.addEventListener('click', () => {
            const exportData = inventory.map(i => ({
                Style_No: i.style_no || '-',
                Name: i.name,
                Width: i.width || '-',
                Fold_L: i.fold_l || '-',
                Stock: i.stock,
                Unit: i.unit || 'units',
                Min_Level: i.min,
                Rate: i.rate || 0,
                Total_Value: (i.stock * (i.rate || 0))
            }))
            exportToExcel(exportData, 'Inventory_Report')
        })

        container.querySelector('#add-stock-btn')?.addEventListener('click', () => showAddStockModal())

        container.querySelector('#inventory-table-body')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('.action-btn')
            if (!btn) return
            const { action, id } = btn.dataset
            if (action === 'delete') {
                if (confirm('Are you sure?')) {
                    await supabase.from('inventory').delete().eq('id', id)
                    updateView()
                }
            } else if (action === 'view') {
                const item = inventory.find(i => i.id === id)
                showItemDetailsModal(item)
            }
        })
    }

    function showItemDetailsModal(item) {
        const modalId = 'item-details-modal'
        let modal = document.getElementById(modalId)
        if (modal) modal.remove()

        const html = `
            <div id="${modalId}" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden transform scale-100 transition-all flex flex-col md:flex-row h-[600px]">
                    <!-- Left Side: Image -->
                    <div class="md:w-3/5 bg-slate-100 flex items-center justify-center p-8 border-r border-slate-100 relative group">
                        ${item.image_url ? 
                            `<img src="${item.image_url}" class="w-full h-full object-contain drop-shadow-2xl" alt="${item.name}">` : 
                            `<div class="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                <span class="font-black uppercase tracking-widest text-xs">No Image Available</span>
                            </div>`
                        }
                        <div class="absolute bottom-6 left-6 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest border border-white/50 shadow-sm">Full View Mode</div>
                    </div>
                    
                    <!-- Right Side: Details -->
                    <div class="md:w-2/5 p-12 flex flex-col relative bg-white">
                        <button id="close-details-modal" class="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-600 rounded-full bg-slate-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>

                        <div class="mb-8">
                            <span class="text-[10px] font-black text-factory-blue uppercase tracking-[0.2em] mb-2 block">Inventory Detail</span>
                            <h2 class="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">${item.name}</h2>
                            <p class="text-slate-400 font-bold mt-2">Item ID: #${item.id.substring(0,8).toUpperCase()}</p>
                        </div>

                        <div class="grid grid-cols-2 gap-8 mb-10">
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Style Number</label>
                                <p class="text-lg font-black text-factory-blue">${item.style_no || 'N/A'}</p>
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</label>
                                <p class="text-lg font-black text-slate-800">${item.stock} <span class="text-sm text-slate-400 lowercase">${item.unit || 'units'}</span></p>
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fabric Width</label>
                                <p class="text-lg font-bold text-slate-700">${item.width || '-'}</p>
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fabric Fold L</label>
                                <p class="text-lg font-bold text-slate-700">${item.fold_l || '-'}</p>
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Min Alert Level</label>
                                <p class="text-lg font-bold text-slate-700">${item.min} ${item.unit || ''}</p>
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rate / Unit</label>
                                <p class="text-lg font-black text-slate-800">₹${item.rate || '0'}</p>
                            </div>
                        </div>

                        <div class="mt-auto flex gap-4">
                            <button id="close-details-btn" class="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Close</button>
                            <button id="edit-item-btn" class="px-6 py-4 bg-factory-blue text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 shadow-lg transition-all transform hover:scale-105">Edit Item</button>
                        </div>
                    </div>
                </div>
            </div>
        `
        document.body.insertAdjacentHTML('beforeend', html)
        const modalEl = document.getElementById(modalId)
        const close = () => modalEl.remove()
        
        modalEl.querySelector('#close-details-modal').onclick = close
        modalEl.querySelector('#close-details-btn').onclick = close
        modalEl.querySelector('#edit-item-btn').onclick = () => {
            close()
            showAddStockModal(item)
        }
        modalEl.addEventListener('click', (e) => { if(e.target === modalEl) close() })
    }

    function showAddStockModal(editItem = null) {
        const isEdit = !!editItem
        const modalId = 'add-stock-modal'
        let modal = document.getElementById(modalId)
        if (modal) modal.remove()

        const html = `
            <div id="${modalId}" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center">
                <div class="bg-white rounded-[40px] shadow-2xl overflow-hidden transform scale-100 transition-all p-12 flex flex-col" style="width: 1300px; height: 700px;">
                    <div class="flex items-center justify-between mb-10">
                        <h2 class="text-4xl font-black text-slate-800 uppercase tracking-tighter">${isEdit ? 'Edit Item' : 'Add New Stock'}</h2>
                        <button id="close-modal" class="p-3 text-slate-400 hover:text-slate-600 rounded-full bg-slate-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    
                    <form id="add-stock-form" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div class="space-y-6">
                                <div>
                                    <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fabric Image</label>
                                    <div class="flex items-center gap-6">
                                        <div id="image-preview-container" class="w-[200px] h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                                            ${isEdit && editItem.image_url ? 
                                                `<img src="${editItem.image_url}" class="w-full h-full object-cover" />` :
                                                `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`
                                            }
                                        </div>
                                        <div class="flex-1">
                                            <input type="file" id="fabric-image-input" accept="image/*" class="hidden" />
                                            <button type="button" onclick="document.getElementById('fabric-image-input').click()" class="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm">Choose File</button>
                                        </div>
                                    </div>
                                    <input type="hidden" name="image_url" id="image-url-hidden" value="${editItem?.image_url || ''}" />
                                </div>
                                <div class="grid grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-xs font-black text-factory-blue uppercase tracking-widest mb-2">Style No</label>
                                        <input type="text" name="style_no" value="${editItem?.style_no || ''}" class="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-factory-blue/10 outline-none transition-all shadow-sm" placeholder="e.g. STY-101" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                                        <input type="text" name="name" value="${editItem?.name || ''}" class="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-factory-blue/10 outline-none transition-all shadow-sm" placeholder="e.g. Cotton" />
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fabric Width</label>
                                        <input type="text" name="width" value="${editItem?.width || ''}" class="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-factory-blue/10 outline-none transition-all shadow-sm" placeholder='58"' />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fabric Fold L</label>
                                        <input type="text" name="fold_l" value="${editItem?.fold_l || ''}" class="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-factory-blue/10 outline-none transition-all shadow-sm" placeholder="Single" />
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-6">
                                <div class="grid grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
                                        <input type="number" name="stock" value="${editItem?.stock || ''}" step="any" class="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-factory-blue/10 outline-none transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                                        <select name="unit" class="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base font-bold bg-slate-50 outline-none transition-all shadow-sm appearance-none cursor-pointer">
                                            <option value="meters" ${editItem?.unit === 'meters' ? 'selected' : ''}>Meters</option>
                                            <option value="pcs" ${editItem?.unit === 'pcs' ? 'selected' : ''}>Pieces</option>
                                            <option value="kg" ${editItem?.unit === 'kg' ? 'selected' : ''}>KG</option>
                                            <option value="rolls" ${editItem?.unit === 'rolls' ? 'selected' : ''}>Rolls</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Min Level</label>
                                        <input type="number" name="min" value="${editItem?.min || ''}" step="any" class="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-factory-blue/10 outline-none transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="10" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Rate (per unit)</label>
                                        <input type="number" name="rate" value="${editItem?.rate || ''}" step="0.01" class="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base font-bold focus:ring-4 focus:ring-factory-blue/10 outline-none transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
                                    </div>
                                </div>
                                <div class="pt-6">
                                    <button type="submit" class="w-full py-5 bg-factory-blue text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]">${isEdit ? 'Update Item' : 'Save Item'}</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `
        document.body.insertAdjacentHTML('beforeend', html)
        const modalEl = document.getElementById(modalId)
        
        // Image Handling
        const imageInput = modalEl.querySelector('#fabric-image-input')
        const imagePreview = modalEl.querySelector('#image-preview-container')
        const imageUrlHidden = modalEl.querySelector('#image-url-hidden')

        imageInput.onchange = (e) => {
            const file = e.target.files[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (re) => {
                    imagePreview.innerHTML = `<img src="${re.target.result}" class="w-full h-full object-cover" />`
                    imageUrlHidden.value = re.target.result
                }
                reader.readAsDataURL(file)
            }
        }

        modalEl.querySelector('#close-modal').onclick = () => modalEl.remove()
        modalEl.querySelector('#add-stock-form').onsubmit = async (e) => {
            e.preventDefault()
            const formData = new FormData(e.target)
            const data = Object.fromEntries(formData.entries())
            
            const submissionData = {
                name: data.name,
                stock: parseFloat(data.stock),
                min: parseFloat(data.min),
                unit: data.unit,
                rate: parseFloat(data.rate) || 0,
                width: data.width,
                fold_l: data.fold_l,
                style_no: data.style_no,
                image_url: data.image_url
            }

            const { error } = isEdit ? 
                await supabase.from('inventory').update(submissionData).eq('id', editItem.id) :
                await supabase.from('inventory').insert([submissionData])
            
            if (!error) {
                modalEl.remove()
                updateView()
            } else {
                alert('Error: ' + error.message)
            }
        }
    }

    updateView()
}
