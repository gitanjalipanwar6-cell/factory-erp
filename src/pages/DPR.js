import { supabase } from '../lib/supabase'
import { getStatusColor, formatDate, exportToExcel, downloadPDF } from '../lib/utils'
import { initOrderModal } from '../components/OrderModal'

export async function renderDPR(container) {
    let orders = []
    let logs = []
    let inventory = []
    let selectedOrderId = null
    let fabricStatus = 'Order Pending'
    
    // Filter states
    let styleSearch = ''
    let poSearch = ''
    let dateFilter = ''
    let stageFilter = 'All Stages'

    const { showModal: showOrderModal } = initOrderModal(container, () => updateView())

    function showProductionHistory(order, allLogs) {
        const modalId = 'history-modal'
        let modal = document.getElementById(modalId)
        if (!modal) {
            const html = `
                <div id="${modalId}" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform scale-95 transition-all duration-300 flex flex-col max-h-[90vh]">
                        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-factory-blue">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                </div>
                                <div>
                                    <h2 class="text-base font-black text-slate-800 uppercase tracking-tight">Production Summary</h2>
                                    <p id="history-po-number" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5"></p>
                                </div>
                            </div>
                            <button id="close-history-modal" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <div class="flex-1 overflow-auto p-6">
                            <div id="history-table-container"></div>
                        </div>
                        <div class="px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex justify-end">
                            <button id="history-done-btn" class="px-6 py-2 bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">Done</button>
                        </div>
                    </div>
                </div>
            `
            document.body.insertAdjacentHTML('beforeend', html)
            modal = document.getElementById(modalId)
        }

        const po = (order.po_number || order.order_number || '').trim()
        document.getElementById('history-po-number').textContent = `PO: ${po} | Style: ${order.style_no || '-'}`
        
        // Filter logs for this order - be very robust with matching
        const oLogs = allLogs.filter(l => {
            const logPO = (l.po_number || '').trim()
            const logOrder = (l.order_number || '').trim()
            return (logPO && logPO === po) || (logOrder && logOrder === po)
        })
        
        // Generate Size-wise Summary
        const orderSizes = order.sizes || []
        const summaryData = orderSizes.map(os => {
            const cleanSize = (os.size || '').split('-').pop().trim().toUpperCase()
            const sizeLogs = oLogs.filter(l => {
                const logSize = (l.size || '').split('-').pop().trim().toUpperCase()
                return logSize === cleanSize
            })
            
            const getQty = (type) => sizeLogs
                .filter(l => l.type?.toLowerCase() === type.toLowerCase())
                .reduce((sum, l) => sum + (l.quantity || 0), 0)

            return {
                sizeDisplay: cleanSize || os.size,
                orderQty: os.qty || 0,
                cutting: getQty('cutting'),
                stitching: getQty('stitching'),
                finishing: getQty('finishing'),
                packing: getQty('packing')
            }
        })

        // Calculate totals from ALL order logs, even those without sizes
        const getGrandTotal = (type) => oLogs
            .filter(l => l.type?.toLowerCase() === type.toLowerCase())
            .reduce((sum, l) => sum + (l.quantity || 0), 0)

        const grandTotals = {
            orderQty: summaryData.reduce((sum, s) => sum + s.orderQty, 0),
            cutting: getGrandTotal('cutting'),
            stitching: getGrandTotal('stitching'),
            finishing: getGrandTotal('finishing'),
            packing: getGrandTotal('packing')
        }
        grandTotals.balance = grandTotals.orderQty - grandTotals.packing

        const tableContainer = document.getElementById('history-table-container')
        tableContainer.innerHTML = `
            <table class="w-full text-left text-xs whitespace-nowrap border-collapse">
                <thead class="bg-slate-50 border-b border-slate-100 sticky top-0">
                    <tr>
                        <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Size</th>
                        <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-center border-r border-slate-100">Order Qty</th>
                        <th class="px-4 py-3 font-black text-blue-600 uppercase tracking-widest text-center">Cutting</th>
                        <th class="px-4 py-3 font-black text-indigo-600 uppercase tracking-widest text-center">Stitching</th>
                        <th class="px-4 py-3 font-black text-emerald-600 uppercase tracking-widest text-center">Finishing</th>
                        <th class="px-4 py-3 font-black text-purple-600 uppercase tracking-widest text-center border-r border-slate-100">Packing</th>
                        <th class="px-4 py-3 font-black text-slate-800 uppercase tracking-widest text-right">Balance</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    ${summaryData.map(s => `
                        <tr class="hover:bg-slate-50/50 transition-colors">
                            <td class="px-4 py-4 border-r border-slate-50">
                                <span class="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase tracking-tighter">${s.sizeDisplay}</span>
                            </td>
                            <td class="px-4 py-4 text-center font-bold text-slate-700 border-r border-slate-50">${s.orderQty.toLocaleString()}</td>
                            <td class="px-4 py-4 text-center">
                                <span class="font-black text-blue-600">${s.cutting.toLocaleString()}</span>
                            </td>
                            <td class="px-4 py-4 text-center">
                                <span class="font-black text-indigo-600">${s.stitching.toLocaleString()}</span>
                            </td>
                            <td class="px-4 py-4 text-center">
                                <span class="font-black text-emerald-600">${s.finishing.toLocaleString()}</span>
                            </td>
                        <td class="px-4 py-4 text-center border-r border-slate-50">
                                <span class="font-black text-purple-600">${s.packing.toLocaleString()}</span>
                            </td>
                            <td class="px-4 py-4 text-right">
                                <span class="font-black ${(s.orderQty - s.packing) > 0 ? 'text-rose-500' : 'text-emerald-500'}">
                                    ${(s.orderQty - s.packing).toLocaleString()}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                    ${oLogs.some(l => !l.size) ? `
                        <tr class="bg-slate-50/20 italic">
                            <td class="px-4 py-2 border-r border-slate-50 text-[10px] text-slate-400">Other/No Size</td>
                            <td class="px-4 py-2 text-center border-r border-slate-50">-</td>
                            <td class="px-4 py-2 text-center text-blue-400">${oLogs.filter(l => !l.size && l.type?.toLowerCase() === 'cutting').reduce((sum, l) => sum + (l.quantity || 0), 0)}</td>
                            <td class="px-4 py-2 text-center text-indigo-400">${oLogs.filter(l => !l.size && l.type?.toLowerCase() === 'stitching').reduce((sum, l) => sum + (l.quantity || 0), 0)}</td>
                            <td class="px-4 py-2 text-center text-emerald-400">${oLogs.filter(l => !l.size && l.type?.toLowerCase() === 'finishing').reduce((sum, l) => sum + (l.quantity || 0), 0)}</td>
                            <td class="px-4 py-2 text-center border-r border-slate-50 text-purple-400">${oLogs.filter(l => !l.size && l.type?.toLowerCase() === 'packing').reduce((sum, l) => sum + (l.quantity || 0), 0)}</td>
                            <td class="px-4 py-2 text-right">-</td>
                        </tr>
                    ` : ''}
                </tbody>
                <tfoot class="bg-slate-50 border-t-2 border-slate-200">
                    <tr class="font-black text-slate-800">
                        <td class="px-4 py-3 uppercase tracking-tighter border-r border-slate-100">TOTAL</td>
                        <td class="px-4 py-3 text-center border-r border-slate-100">${grandTotals.orderQty.toLocaleString()}</td>
                        <td class="px-4 py-3 text-center">${grandTotals.cutting.toLocaleString()}</td>
                        <td class="px-4 py-3 text-center">${grandTotals.stitching.toLocaleString()}</td>
                        <td class="px-4 py-3 text-center">${grandTotals.finishing.toLocaleString()}</td>
                        <td class="px-4 py-3 text-center border-r border-slate-100">${grandTotals.packing.toLocaleString()}</td>
                        <td class="px-4 py-3 text-right text-rose-600">${grandTotals.balance.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
        `

        const modalContent = modal.querySelector('div')
        modal.classList.remove('hidden')
        setTimeout(() => {
            modal.classList.remove('opacity-0')
            modal.classList.add('opacity-100')
            modalContent.classList.remove('scale-95')
            modalContent.classList.add('scale-100')
        }, 10)

        const close = () => {
            modal.classList.remove('opacity-100')
            modal.classList.add('opacity-0')
            modalContent.classList.remove('scale-100')
            modalContent.classList.add('scale-95')
            setTimeout(() => modal.classList.add('hidden'), 300)
        }

        document.getElementById('close-history-modal').onclick = close
        document.getElementById('history-done-btn').onclick = close
    }

    async function fetchData() {
        const { data: o } = await supabase.from('orders').select('*')
        const { data: l } = await supabase.from('production_logs').select('*')
        const { data: inv } = await supabase.from('inventory').select('*').order('name')
        orders = o || []
        logs = l || []
        inventory = inv || []
        if (!selectedOrderId && orders.length > 0) {
            selectedOrderId = orders[0].id
            fabricStatus = orders[0].order_status === 'Running' ? 'Fabric Inhouse' : 'Order Pending'
        }
    }

    async function updateView() {
        await fetchData()
        
        const totalCutting = logs.filter(l => l.type?.toLowerCase() === 'cutting').reduce((sum, l) => sum + (l.quantity || 0), 0)
        const totalStitching = logs.filter(l => l.type?.toLowerCase() === 'stitching').reduce((sum, l) => sum + (l.quantity || 0), 0)
        const totalFinishing = logs.filter(l => l.type?.toLowerCase() === 'finishing').reduce((sum, l) => sum + (l.quantity || 0), 0)
        const totalPacking = logs.filter(l => l.type?.toLowerCase() === 'packing').reduce((sum, l) => sum + (l.quantity || 0), 0)

        const selectedOrder = orders?.find(o => o.id === selectedOrderId)
        
        container.innerHTML = `
            <div class="space-y-8 p-6 bg-slate-50/50 min-h-screen pb-20">
                <!-- Section 7: Dashboard Summary -->
                <div class="flex items-center justify-between mb-2">
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 flex-1">
                        ${renderKPICard('Total Orders', orders?.length || 0, 'bg-blue-500')}
                        ${renderKPICard('Fabric Status', (orders?.reduce((sum, o) => sum + (parseFloat(o.fabric_meters_in_house) || 0) + (parseFloat(o.fabric_received) || 0), 0) || 0).toLocaleString() + 'm', 'bg-indigo-500')}
                        ${renderKPICard('Total Cutting', totalCutting.toLocaleString(), 'bg-violet-500')}
                        ${renderKPICard('Total Stitching', totalStitching.toLocaleString(), 'bg-purple-500')}
                        ${renderKPICard('Total Finishing', totalFinishing.toLocaleString(), 'bg-fuchsia-500')}
                        ${renderKPICard('Total Packing', totalPacking.toLocaleString(), 'bg-pink-500')}
                        ${renderKPICard('Dispatch Ready', totalPacking.toLocaleString(), 'bg-rose-500')}
                    </div>
                    <button id="dpr-entry-btn" class="ml-6 flex-shrink-0 bg-factory-blue text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-100 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                        DPR Entry
                    </button>
                </div>

                <!-- Section 6: DPR MASTER TABLE -->
                <div class="space-y-4">
                    <!-- Filters Relocated Here -->
                    <div class="glass-card p-4 flex flex-wrap gap-4 items-end shadow-sm border-b-2 border-slate-100">
                        <div class="flex-1 min-w-[200px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filter by Style</label>
                            <input type="text" id="filter-style" value="${styleSearch}" placeholder="Search Style..." class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-factory-blue/10 font-bold" />
                        </div>
                        <div class="flex-1 min-w-[200px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filter by Order</label>
                            <input type="text" id="filter-po" value="${poSearch}" placeholder="Search PO..." class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-factory-blue/10 font-bold" />
                        </div>
                        <div class="flex-1 min-w-[200px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filter by Date</label>
                            <input type="date" id="filter-date" value="${dateFilter}" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-factory-blue/10 font-bold" />
                        </div>
                        <div class="flex-1 min-w-[200px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Stage</label>
                            <select id="filter-stage" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-factory-blue/10 font-bold">
                                <option ${stageFilter === 'All Stages' ? 'selected' : ''}>All Stages</option>
                                <option ${stageFilter === 'Cutting' ? 'selected' : ''}>Cutting</option>
                                <option ${stageFilter === 'Stitching' ? 'selected' : ''}>Stitching</option>
                                <option ${stageFilter === 'Finishing' ? 'selected' : ''}>Finishing</option>
                                <option ${stageFilter === 'Packing' ? 'selected' : ''}>Packing</option>
                            </select>
                        </div>
                        <button id="clear-filters" class="px-4 py-2 text-[10px] font-black text-slate-400 uppercase hover:text-rose-500 transition-colors">Clear</button>
                    </div>

                    <div class="glass-card overflow-hidden shadow-2xl">
                    <div class="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 class="font-black text-slate-800 uppercase text-xs tracking-wider">DPR Dashboard Master Table</h3>
                            <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Consolidated Production Overview</p>
                        </div>
                        <!-- Section 9: EXTRA FEATURES -->
                        <div class="flex gap-2">
                            <button id="export-excel-btn" class="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                Excel
                            </button>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs whitespace-nowrap">
                            <thead class="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Date</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">PO Number</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Style No.</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-center">Image</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Fabric Name</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Fabric Status</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-center">Size</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Fabric Rec.</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Cutting</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Stitching</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Finishing</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Packing</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Balance</th>
                                    <th class="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 bg-white">
                                ${orders?.filter(o => {
                                    const po = (o.po_number || o.order_number || '').toLowerCase()
                                    const style = (o.style_no || '').toLowerCase()
                                    const date = o.po_date ? o.po_date.split('T')[0] : ''
                                    
                                    const matchStyle = style.includes(styleSearch.toLowerCase())
                                    const matchPO = po.includes(poSearch.toLowerCase())
                                    const matchDate = !dateFilter || date === dateFilter
                                    
                                    let matchStage = true
                                    if (stageFilter !== 'All Stages') {
                                        const oLogs = logs.filter(l => (l.po_number || l.order_number) === (o.po_number || o.order_number))
                                        matchStage = oLogs.some(l => l.type?.toLowerCase() === stageFilter.toLowerCase())
                                    }

                                    return matchStyle && matchPO && matchDate && matchStage
                                }).map(o => {
                                    const po = (o.po_number || o.order_number || '').trim()
                                    const oLogs = logs.filter(l => {
                                        const logPO = (l.po_number || '').trim()
                                        const logOrder = (l.order_number || '').trim()
                                        return (logPO && logPO === po) || (logOrder && logOrder === po)
                                    })
                                    const getQty = (type) => oLogs
                                        .filter(l => l.type?.toLowerCase() === type.toLowerCase())
                                        .reduce((sum, l) => sum + (l.quantity || 0), 0)

                                    const cutting = getQty('cutting')
                                    const stitching = getQty('stitching')
                                    const finishing = getQty('finishing')
                                    const packing = getQty('packing')
                                    const balance = (o.quantity || 0) - packing
                                    
                                    return `
                                        <tr class="hover:bg-slate-50/50 transition-colors">
                                            <td class="px-4 py-4 font-medium text-slate-400 font-mono text-[10px]">${formatDate(o.po_date || new Date())}</td>
                                            <td class="px-4 py-4 font-bold text-factory-blue underline decoration-dotted">${po}</td>
                                            <td class="px-4 py-4 font-mono text-slate-600">${o.style_no || '-'}</td>
                                            <td class="px-4 py-4">
                                                <div class="w-10 h-10 mx-auto rounded overflow-hidden border border-slate-100 bg-slate-50">
                                                    ${o.product_image ? `<img src="${o.product_image}" class="w-full h-full object-cover">` : ''}
                                                </div>
                                            </td>
                                            <td class="px-4 py-4 font-bold text-slate-600">${o.fabric_name || '-'}</td>
                                            <td class="px-4 py-4">
                                                <span class="px-2 py-0.5 rounded-full ${getStatusColor(o.order_status)} text-[10px] font-bold">
                                                    ${o.order_status}
                                                </span>
                                            </td>
                                            <td class="px-4 py-4 text-center">
                                                <span class="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                                                    ${[...new Set(oLogs.filter(l => l.size).map(l => l.size))].join(', ') || '-'}
                                                </span>
                                            </td>
                                            <td class="px-4 py-4 font-bold text-slate-700">
                                                <div class="flex flex-col gap-0.5">
                                                    ${(parseFloat(o.fabric_meters_in_house) || 0) > 0 ? `<span class="text-blue-600" title="Inhouse">${(parseFloat(o.fabric_meters_in_house) || 0).toLocaleString()} <span class="text-[8px] font-black uppercase">IH</span></span>` : ''}
                                                    ${(parseFloat(o.fabric_received) || 0) > 0 ? `<span class="text-indigo-600" title="Received">${(parseFloat(o.fabric_received) || 0).toLocaleString()} <span class="text-[8px] font-black uppercase">REC</span></span>` : ''}
                                                    ${!(parseFloat(o.fabric_meters_in_house) || 0) && !(parseFloat(o.fabric_received) || 0) ? '0' : ''}
                                                </div>
                                            </td>
                                            <td class="px-4 py-4 font-bold text-violet-600">${cutting.toLocaleString()}</td>
                                            <td class="px-4 py-4 font-bold text-purple-600">${stitching.toLocaleString()}</td>
                                            <td class="px-4 py-4 font-bold text-fuchsia-600">${finishing.toLocaleString()}</td>
                                            <td class="px-4 py-4 font-bold text-pink-600">${packing.toLocaleString()}</td>
                                            <td class="px-4 py-4">
                                                <span class="font-black ${balance > 0 ? 'text-rose-500' : 'text-emerald-500'}">${balance.toLocaleString()}</span>
                                            </td>
                                            <td class="px-4 py-4 text-right">
                                                <div class="flex justify-end gap-1.5">
                                                    <button class="view-order-btn p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-factory-blue transition-colors" title="View" data-id="${o.id}">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    </button>
                                                    <button class="pdf-order-btn p-1.5 hover:bg-purple-50 rounded text-slate-400 hover:text-purple-600 transition-colors" title="Download PDF" data-id="${o.id}">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                    </button>
                                                    <button class="edit-order-btn p-1.5 hover:bg-amber-50 rounded text-slate-400 hover:text-amber-600 transition-colors" title="Edit" data-id="${o.id}">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `

        // Packing auto-calc
        // removed from main view

        // Submit Listeners
        // moved to modal

        // Dashboard Listeners
        container.querySelector('#export-excel-btn')?.addEventListener('click', () => {
            const exportData = orders.map(o => {
                const po = o.po_number || o.order_number
                const oLogs = logs.filter(l => l.po_number === po)
                return {
                    Date: formatDate(o.po_date || new Date()),
                    PO_Number: po,
                    Style: o.style_no || '-',
                    Status: o.order_status,
                    Sizes: [...new Set(oLogs.filter(l => l.size).map(l => l.size))].join(' '),
                    Cutting: oLogs.filter(l => l.type === 'cutting').reduce((sum, l) => sum + (l.quantity || 0), 0),
                    Stitching: oLogs.filter(l => l.type === 'stitching').reduce((sum, l) => sum + (l.quantity || 0), 0),
                    Finishing: oLogs.filter(l => l.type === 'finishing').reduce((sum, l) => sum + (l.quantity || 0), 0),
                    Packing: oLogs.filter(l => l.type === 'packing').reduce((sum, l) => sum + (l.quantity || 0), 0)
                }
            })
            exportToExcel(exportData, 'DPR_Report')
        })

        container.querySelectorAll('.pdf-order-btn').forEach(btn => {
            btn.addEventListener('click', () => downloadPDF())
        })

        container.querySelectorAll('.view-order-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id')
                const order = orders.find(o => o.id === id)
                if (order) showProductionHistory(order, logs)
            })
        })

        container.querySelectorAll('.edit-order-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id')
                const order = orders.find(o => o.id === id)
                if (order) showDPREditModal(order)
            })
        })

        // Filter Listeners
        const filterStyle = container.querySelector('#filter-style')
        const filterPO = container.querySelector('#filter-po')
        const filterDate = container.querySelector('#filter-date')
        const filterStage = container.querySelector('#filter-stage')

        filterStyle?.addEventListener('input', (e) => {
            styleSearch = e.target.value
            updateView()
            document.getElementById('filter-style').focus()
        })
        filterPO?.addEventListener('input', (e) => {
            poSearch = e.target.value
            updateView()
            document.getElementById('filter-po').focus()
        })
        filterDate?.addEventListener('change', (e) => {
            dateFilter = e.target.value
            updateView()
        })
        filterStage?.addEventListener('change', (e) => {
            stageFilter = e.target.value
            updateView()
        })
        container.querySelector('#dpr-entry-btn')?.addEventListener('click', () => showDPREntryModal())
    }

    function showDPREntryModal() {
        const modalId = 'dpr-entry-modal'
        let modal = document.getElementById(modalId)
        if (modal) modal.remove()

        const html = `
            <div id="${modalId}" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center opacity-0 transition-opacity duration-300">
                <div class="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden transform scale-95 transition-all duration-300 flex flex-col max-h-[90vh]">
                    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-factory-blue rounded-lg flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                            </div>
                            <h2 class="text-base font-black text-slate-800 uppercase tracking-tight">DPR Production Entry</h2>
                        </div>
                        <button id="close-dpr-entry" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    
                    <div class="flex-1 overflow-auto p-6">
                        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div class="lg:col-span-4 space-y-6">
                                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Target Order</label>
                                    <select id="modal-order-select" class="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 focus:ring-4 focus:ring-factory-blue/10 outline-none mb-6">
                                        ${orders?.map(o => `<option value="${o.id}" ${o.id === selectedOrderId ? 'selected' : ''}>${o.po_number || o.order_number}</option>`).join('')}
                                    </select>
                                    <div id="modal-order-details"></div>
                                    <div class="mt-6 pt-6 border-t border-slate-50">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fabric Status</label>
                                        <select id="modal-fabric-status" class="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm font-bold bg-white focus:ring-4 focus:ring-factory-blue/10 outline-none">
                                            <option value="Fabric Inhouse" ${fabricStatus === 'Fabric Inhouse' ? 'selected' : ''}>Fabric Inhouse</option>
                                            <option value="Fabric Receive Pending" ${fabricStatus === 'Fabric Receive Pending' ? 'selected' : ''}>Fabric Receive Pending</option>
                                            <option value="Order Pending" ${fabricStatus === 'Order Pending' ? 'selected' : ''}>Order Pending</option>
                                        </select>
                                        <div id="modal-fabric-fields" class="mt-4"></div>
                                        <button id="modal-submit-fabric" class="w-full mt-4 py-3 bg-factory-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg">Update Fabric Status</button>
                                    </div>
                                </div>
                            </div>
                            <div class="lg:col-span-8 space-y-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-violet-500">
                                        <h3 class="font-black text-slate-800 mb-4 text-xs uppercase tracking-widest">Daily Cutting</h3>
                                        <div id="modal-cutting-fields" class="space-y-4"></div>
                                        <button id="modal-submit-cutting" class="w-full mt-4 py-2.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-violet-700 transition-all">Submit Cutting</button>
                                    </div>
                                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-purple-500">
                                        <h3 class="font-black text-slate-800 mb-4 text-xs uppercase tracking-widest">Daily Stitching</h3>
                                        <div id="modal-stitching-fields" class="space-y-4"></div>
                                        <button id="modal-submit-stitching" class="w-full mt-4 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-purple-700 transition-all">Submit Stitching</button>
                                    </div>
                                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-fuchsia-500">
                                        <h3 class="font-black text-slate-800 mb-4 text-xs uppercase tracking-widest">Daily Finishing</h3>
                                        <div id="modal-finishing-fields" class="space-y-4"></div>
                                        <button id="modal-submit-finishing" class="w-full mt-4 py-2.5 bg-fuchsia-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-fuchsia-700 transition-all">Submit Finishing</button>
                                    </div>
                                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-pink-500">
                                        <h3 class="font-black text-slate-800 mb-4 text-xs uppercase tracking-widest">Daily Packing</h3>
                                        <div id="modal-packing-fields" class="space-y-4"></div>
                                        <button id="modal-submit-packing" class="w-full mt-4 py-2.5 bg-pink-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-pink-700 transition-all">Submit Packing</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
        document.body.insertAdjacentHTML('beforeend', html)
        modal = document.getElementById(modalId); const modalContent = modal.querySelector('div')

        const updateModalView = () => {
            const order = orders.find(o => o.id === selectedOrderId); if (!order) return
            document.getElementById('modal-order-details').innerHTML = `
                <div class="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div class="w-20 h-24 bg-white rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                        ${order.product_image ? `<img src="${order.product_image}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-slate-300"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>'}
                    </div>
                    <div class="flex-1 space-y-1">
                        <p class="text-[10px] font-black text-slate-400 uppercase">Style No</p>
                        <p class="text-sm font-bold text-slate-800">${order.style_no || '-'}</p>
                        <p class="text-[10px] font-black text-slate-400 uppercase mt-2">Buyer</p>
                        <p class="text-sm font-bold text-slate-800">${order.buyer_name}</p>
                        <p class="text-[10px] font-black text-slate-400 uppercase mt-2">Order Qty</p>
                        <p class="text-sm font-black text-factory-blue">${order.quantity.toLocaleString()} units</p>
                    </div>
                </div>
            `
            document.getElementById('modal-fabric-fields').innerHTML = renderFabricFields(fabricStatus, order, inventory)
            const sizes = order.sizes || []
            const genSizeInputs = (cls, col) => sizes.map(os => {
                const s = (os.size || '').split('-').pop().trim()
                return `<div class="flex items-center justify-between gap-4 bg-slate-50 p-2 rounded-lg"><span class="text-[10px] font-black text-slate-600 w-12">${s}</span><input type="number" class="${cls} w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-black text-center focus:ring-2 focus:ring-${col}-200 outline-none" placeholder="0" data-size="${s}" /></div>`
            }).join('')
            document.getElementById('modal-cutting-fields').innerHTML = `<div class="grid grid-cols-2 gap-2">${genSizeInputs('m-cut-in', 'violet')}</div><div class="mt-4 pt-3 border-t flex justify-between items-center px-1"><span class="text-[10px] font-black text-slate-500 uppercase">Total</span><span id="m-tot-cut" class="text-sm font-black text-violet-600">0</span></div>`
            document.getElementById('modal-stitching-fields').innerHTML = `<div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Date</label><input type="date" id="m-st-dt" value="${new Date().toISOString().split('T')[0]}" class="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold" /></div><div><label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Size</label><select id="m-st-sz" class="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50">${sizes.map(os => `<option value="${os.size}">${os.size}</option>`).join('')}</select></div></div><input type="text" id="m-st-wk" placeholder="Karigar Name" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold" /><div class="grid grid-cols-2 gap-3"><input type="number" id="m-st-tot" placeholder="Total Output" class="m-st-clc w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold" /><input type="number" id="m-st-rej" placeholder="Rejections" class="m-st-clc w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold" /></div><div class="bg-purple-50 p-2 rounded-lg flex justify-between items-center px-3"><span class="text-[9px] font-black text-purple-700 uppercase">Net</span><span id="m-st-net" class="text-xs font-black text-purple-700">0</span></div></div>`
            document.getElementById('modal-finishing-fields').innerHTML = `<div class="grid grid-cols-2 gap-2">${genSizeInputs('m-fin-in', 'fuchsia')}</div>`
            document.getElementById('modal-packing-fields').innerHTML = `<div class="grid grid-cols-2 gap-2">${genSizeInputs('m-pk-in', 'pink')}</div>`
            modal.querySelectorAll('.m-cut-in').forEach(i => i.oninput = () => { let s = 0; modal.querySelectorAll('.m-cut-in').forEach(x => s += parseInt(x.value) || 0); modal.querySelector('#m-tot-cut').innerText = s.toLocaleString() })
            modal.querySelectorAll('.m-st-clc').forEach(i => i.oninput = () => { const t = parseInt(modal.querySelector('#m-st-tot').value) || 0; const r = parseInt(modal.querySelector('#m-st-rej').value) || 0; modal.querySelector('#m-st-net').innerText = (t - r).toLocaleString() })
        }
        modal.querySelector('#modal-order-select').onchange = (e) => { selectedOrderId = e.target.value; updateModalView() }
        modal.querySelector('#modal-fabric-status').onchange = (e) => { fabricStatus = e.target.value; updateModalView() }
        const showSuccess = (m) => { alert(`${m} logged!`); updateView(); updateModalView(); }
        modal.querySelector('#modal-submit-fabric').onclick = async () => {
            const d = { 
                order_status: fabricStatus === 'Fabric Inhouse' ? 'Running' : 'Pending',
                fabric_name: modal.querySelector('#fab-name-val')?.value
            }
            const ih = modal.querySelector('#fab-inhouse-val')?.value; const ord = modal.querySelector('#fab-ordered')?.value; const rec = modal.querySelector('#fab-received')?.value
            if (ih) d.fabric_meters_in_house = parseFloat(ih); if (ord) d.fabric_ordered = parseFloat(ord); if (rec) d.fabric_received = parseFloat(rec)
            const { error } = await supabase.from('orders').update(d).eq('id', selectedOrderId); if (!error) showSuccess('Fabric')
        }
        modal.querySelector('#modal-submit-cutting').onclick = async () => {
            const logs = []; const order = orders.find(o => o.id === selectedOrderId)
            modal.querySelectorAll('.m-cut-in').forEach(i => { const q = parseInt(i.value) || 0; if (q > 0) logs.push({ po_number: order.po_number || order.order_number, type: 'cutting', quantity: q, size: i.dataset.size, date: new Date().toISOString() }) })
            if (!logs.length) return alert('Enter quantites'); const { error } = await supabase.from('production_logs').insert(logs); if (!error) showSuccess('Cutting')
        }
        modal.querySelector('#modal-submit-stitching').onclick = async () => {
            const net = parseInt(modal.querySelector('#m-st-net').innerText) || 0; if (net <= 0) return alert('Enter output')
            const order = orders.find(o => o.id === selectedOrderId)
            const { error } = await supabase.from('production_logs').insert([{ po_number: order.po_number || order.order_number, type: 'stitching', quantity: net, worker_name: modal.querySelector('#m-st-wk').value, size: modal.querySelector('#m-st-sz').value, date: new Date(modal.querySelector('#m-st-dt').value).toISOString() }])
            if (!error) showSuccess('Stitching')
        }
        modal.querySelector('#modal-submit-finishing').onclick = async () => {
            const logs = []; const order = orders.find(o => o.id === selectedOrderId)
            modal.querySelectorAll('.m-fin-in').forEach(i => { const q = parseInt(i.value) || 0; if (q > 0) logs.push({ po_number: order.po_number || order.order_number, type: 'finishing', quantity: q, size: i.dataset.size, date: new Date().toISOString() }) })
            if (!logs.length) return alert('Enter quantites'); const { error } = await supabase.from('production_logs').insert(logs); if (!error) showSuccess('Finishing')
        }
        modal.querySelector('#modal-submit-packing').onclick = async () => {
            const logs = []; const order = orders.find(o => o.id === selectedOrderId)
            modal.querySelectorAll('.m-pk-in').forEach(i => { const q = parseInt(i.value) || 0; if (q > 0) logs.push({ po_number: order.po_number || order.order_number, type: 'packing', quantity: q, size: i.dataset.size, date: new Date().toISOString() }) })
            if (!logs.length) return alert('Enter quantites'); const { error } = await supabase.from('production_logs').insert(logs); if (!error) showSuccess('Packing')
        }
        updateModalView()
        setTimeout(() => { modal.classList.add('opacity-100'); modalContent.classList.add('scale-100'); }, 10)
        modal.querySelector('#close-dpr-entry').onclick = () => { modal.classList.remove('opacity-100'); modalContent.classList.remove('scale-100'); setTimeout(() => modal.remove(), 300) }
    }

    function showDPREditModal(order) {
        const modalId = 'dpr-edit-modal'
        let modal = document.getElementById(modalId)
        if (!modal) {
            const html = `
                <div id="${modalId}" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform scale-95 transition-all duration-300 flex flex-col max-h-[90vh]">
                        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 class="text-base font-black text-slate-800 uppercase tracking-tight">Edit Frame Details</h2>
                            <button id="close-dpr-edit" class="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <div class="flex-1 overflow-auto p-6 space-y-6">
                            <form id="dpr-edit-form" class="grid grid-cols-2 gap-4">
                                <div class="col-span-1">
                                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">PO Number</label>
                                    <input type="text" name="po_number" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold" />
                                </div>
                                <div class="col-span-1">
                                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Style No.</label>
                                    <input type="text" name="style_no" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold" />
                                </div>
                                <div class="col-span-1">
                                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Status</label>
                                    <select name="order_status" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold">
                                        <option value="Pending">Pending</option>
                                        <option value="Running">Running</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div class="col-span-1">
                                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Date</label>
                                    <input type="date" name="po_date" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold" />
                                </div>
                                
                                <div class="col-span-2 border-t pt-4 mt-2">
                                    <h3 class="text-[10px] font-black text-slate-800 uppercase mb-3">Fabric Inventory</h3>
                                    <div class="grid grid-cols-3 gap-4">
                                        <div>
                                            <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Inhouse (m)</label>
                                            <input type="number" step="0.01" name="fabric_meters_in_house" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Ordered (m)</label>
                                            <input type="number" step="0.01" name="fabric_ordered" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Received (m)</label>
                                            <input type="number" step="0.01" name="fabric_received" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div class="border-t pt-6">
                                <h3 class="text-[10px] font-black text-slate-800 uppercase mb-4 flex items-center justify-between">
                                    Production Log History
                                    <span class="text-slate-400 font-medium lowercase">Delete entries to correct table totals</span>
                                </h3>
                                <div id="dpr-log-list" class="space-y-2">
                                    <!-- Logs injected here -->
                                </div>
                            </div>
                        </div>
                        <div class="px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3">
                            <button id="cancel-dpr-edit" class="px-4 py-2 text-slate-600 text-xs font-black uppercase tracking-widest">Cancel</button>
                            <button id="save-dpr-edit" class="px-6 py-2 bg-factory-blue text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            `
            document.body.insertAdjacentHTML('beforeend', html)
            modal = document.getElementById(modalId)
        }

        const form = document.getElementById('dpr-edit-form')
        form.po_number.value = order.po_number || order.order_number
        form.style_no.value = order.style_no || ''
        form.order_status.value = order.order_status
        form.po_date.value = order.po_date ? order.po_date.split('T')[0] : ''
        form.fabric_meters_in_house.value = order.fabric_meters_in_house || 0
        form.fabric_ordered.value = order.fabric_ordered || 0
        form.fabric_received.value = order.fabric_received || 0

        // Render Logs
        const logList = document.getElementById('dpr-log-list')
        const oLogs = logs.filter(l => (l.po_number || l.order_number) === (order.po_number || order.order_number))
        
        logList.innerHTML = oLogs.length > 0 ? oLogs.map(l => `
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                <div class="flex items-center gap-4">
                    <span class="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black uppercase text-slate-500">${l.type}</span>
                    <span class="text-xs font-bold text-slate-700">${l.quantity} <span class="text-[10px] text-slate-400 font-medium">pcs</span></span>
                    ${l.size ? `<span class="text-[10px] bg-slate-200 text-slate-600 px-1 rounded font-black">${l.size}</span>` : ''}
                    <span class="text-[10px] text-slate-400">${formatDate(l.date)}</span>
                </div>
                <button class="delete-log-btn p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all" data-id="${l.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            </div>
        `).join('') : '<p class="text-center py-4 text-xs text-slate-400 italic">No production logs found for this order</p>'

        const modalContent = modal.querySelector('div')
        modal.classList.remove('hidden')
        setTimeout(() => {
            modal.classList.remove('opacity-0')
            modal.classList.add('opacity-100')
            modalContent.classList.remove('scale-95')
            modalContent.classList.add('scale-100')
        }, 10)

        const close = () => {
            modal.classList.remove('opacity-100')
            modal.classList.add('opacity-0')
            modalContent.classList.remove('scale-100')
            modalContent.classList.add('scale-95')
            setTimeout(() => modal.classList.add('hidden'), 300)
        }

        document.getElementById('close-dpr-edit').onclick = close
        document.getElementById('cancel-dpr-edit').onclick = close

        document.getElementById('save-dpr-edit').onclick = async () => {
            const formData = new FormData(form)
            const updateData = {
                po_number: formData.get('po_number'),
                style_no: formData.get('style_no'),
                order_status: formData.get('order_status'),
                po_date: formData.get('po_date'),
                fabric_meters_in_house: parseFloat(formData.get('fabric_meters_in_house')) || 0,
                fabric_ordered: parseFloat(formData.get('fabric_ordered')) || 0,
                fabric_received: parseFloat(formData.get('fabric_received')) || 0
            }

            const { error } = await supabase.from('orders').update(updateData).eq('id', order.id)
            if (!error) {
                close()
                updateView()
            } else {
                alert('Failed to update order details')
            }
        }

        logList.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Are you sure you want to delete this production entry? This will change the totals in the table.')) {
                    const logId = btn.getAttribute('data-id')
                    const { error } = await supabase.from('production_logs').delete().eq('id', logId)
                    if (!error) {
                        btn.closest('div').remove()
                        updateView()
                    }
                }
            }
        })
    }

    function renderKPICard(label, value, colorClass) {
        return `
            <div class="glass-card p-4 border-l-4 ${colorClass.replace('bg-', 'border-')} shadow-sm group hover:scale-[1.02] transition-transform">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-600">${label}</p>
                <div class="flex items-end justify-between">
                    <h4 class="text-lg font-black text-slate-800">${value}</h4>
                </div>
            </div>
        `
    }

    function renderFabricFields(status, order, inventoryList = []) {
        const fabricOptions = inventoryList.map(item => `<option value="${item.name}" ${item.name === order?.fabric_name ? 'selected' : ''}>${item.name}</option>`).join('')
        const fabricSelect = `
            <div class="mb-4">
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Fabric Name</label>
                <select id="fab-name-val" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-black focus:ring-2 focus:ring-factory-blue/20 outline-none bg-white">
                    <option value="">Select Fabric...</option>
                    ${fabricOptions}
                </select>
            </div>
        `

        if (status === 'Fabric Inhouse') {
            return `
                ${fabricSelect}
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Total Fabric Inhouse (Meters)</label>
                    <input type="number" id="fab-inhouse-val" value="${order?.fabric_meters_in_house || ''}" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-black focus:ring-2 focus:ring-factory-blue/20 outline-none" placeholder="0.00" />
                </div>
            `
        } else if (status === 'Fabric Receive Pending') {
            return `
                ${fabricSelect}
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2">
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Fabric Ordered Quantity</label>
                        <input type="number" id="fab-ordered" value="${order?.fabric_ordered || ''}" class="fab-calc w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-black outline-none" placeholder="0" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Received</label>
                        <input type="number" id="fab-received" value="${order?.fabric_received || ''}" class="fab-calc w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-black outline-none" placeholder="0" />
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Remaining</label>
                        <input type="number" id="fab-remaining" readonly value="${(order?.fabric_ordered || 0) - (order?.fabric_received || 0)}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-rose-500" placeholder="0" />
                    </div>
                </div>
            `
        }
        return `
            ${fabricSelect}
            <div class="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase">Status: Order Pending</p>
                <p class="text-[9px] text-slate-400 mt-1 italic">Waiting for purchase order to be initiated.</p>
            </div>
        `
    }

    await updateView()
}
