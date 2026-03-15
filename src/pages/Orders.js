import { supabase } from '../lib/supabase'
import { getStatusColor, formatDate } from '../lib/utils'
import { initOrderModal } from '../components/OrderModal'

export async function renderOrders(container) {
    const { data: displayOrders, error } = await supabase
        .from('orders')
        .select('*')
        .order('delivery_date', { ascending: true })

    if (error) {
        console.error('Failed to fetch orders:', error)
        container.innerHTML = `<div class="p-6 text-red-500">Error loading orders. Please refresh.</div>`
        return
    }

    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800">Orders Database</h1>
                    <p class="text-slate-500">Manage and track all customer orders</p>
                </div>
                <button id="add-order-btn" class="px-4 py-2 bg-factory-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">+ New Order</button>
            </div>

            <div class="glass-card overflow-hidden">
                <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div class="flex gap-2">
                        <input type="text" id="order-search" placeholder="Search orders..." class="px-3 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                        <select id="status-filter" class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none">
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Running">Running</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <button class="text-sm text-factory-blue font-semibold px-3 py-1 hover:bg-blue-50 rounded-md transition-colors">Export CSV</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">PO Number</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Brand</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Buyer Name</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Quantity</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Style No.</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Priority</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="orders-table-body" class="divide-y divide-slate-100 bg-white">
                            ${displayOrders.map(order => `
                                <tr class="hover:bg-slate-50 transition-colors">
                                    <td class="px-6 py-4 text-sm font-medium text-slate-900">${order.po_number || '-'}</td>
                                    <td class="px-6 py-4 text-sm font-semibold text-slate-700">${order.brand_name || '-'}</td>
                                    <td class="px-6 py-4 text-sm text-slate-600">${order.buyer_name}</td>
                                    <td class="px-6 py-4 text-sm text-slate-600">${order.product_name}</td>
                                    <td class="px-6 py-4 text-sm text-slate-900 font-semibold">${order.quantity.toLocaleString()} units</td>
                                    <td class="px-6 py-4 text-sm text-slate-600 font-mono">${order.style_no || '-'}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(order.priority)}">
                                            ${order.priority}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(order.order_status)}">
                                            ${order.order_status}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="flex justify-end gap-2">
                                            <button class="view-order-btn p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-factory-blue" data-id="${order.id}" title="View">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                                            </button>
                                            <button class="edit-order-btn p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-factory-blue" data-id="${order.id}" title="Edit">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                            </button>
                                            <button class="delete-order-btn p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500" data-id="${order.id}" title="Delete">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `

    // Search and Filter Logic
    const searchInput = document.getElementById('order-search')
    const statusSelect = document.getElementById('status-filter')
    const tableBody = document.getElementById('orders-table-body')
    
    const filterOrders = () => {
        const query = searchInput.value.toLowerCase()
        const status = statusSelect.value
        const rows = tableBody.querySelectorAll('tr')
        
        rows.forEach(row => {
            const text = row.innerText.toLowerCase()
            const matchQuery = text.includes(query)
            const matchStatus = status === 'All' || text.includes(status.toLowerCase())
            row.style.display = matchQuery && matchStatus ? '' : 'none'
        })
    }

    searchInput.addEventListener('input', filterOrders)
    statusSelect.addEventListener('change', filterOrders)

    const { showModal } = initOrderModal(container, () => renderOrders(container))

    document.getElementById('add-order-btn').onclick = () => showModal('create')

    tableBody.onclick = async (e) => {
        const target = e.target.closest('button')
        if (!target) return
        
        const id = target.dataset.id
        if (!id) return

        if (target.classList.contains('delete-order-btn')) {
            if (confirm('Are you sure you want to delete this order?')) {
                const { error } = await supabase.from('orders').delete().eq('id', id)
                if (!error) await renderOrders(container)
            }
        } else if (target.classList.contains('edit-order-btn') || target.classList.contains('view-order-btn')) {
            const mode = target.classList.contains('edit-order-btn') ? 'edit' : 'view'
            const { data } = await supabase.from('orders').select('*')
            const order = data.find(o => o.id === id)
            if (order) showModal(mode, order)
        }
    }
}
