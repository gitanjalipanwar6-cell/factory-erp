import { supabase } from '../lib/supabase'

export async function renderDispatch(container) {
    const { data: shipments } = await supabase.from('shipments').select('*, orders(po_number)')

    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800">Dispatch Tracking</h1>
                    <p class="text-slate-500">Track shipments and delivery timeline</p>
                </div>
                <button class="px-4 py-2 bg-factory-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 shadow-lg">+ New Dispatch</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Status Timeline Side -->
                <div class="lg:col-span-1 glass-card p-6">
                    <h3 class="font-bold text-slate-800 mb-6 uppercase text-sm tracking-widest">Live Timeline</h3>
                    <div class="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                        ${shipments?.length > 0 ? shipments.slice(0, 4).map(item => `
                            <div class="relative pl-8 flex flex-col">
                                <span class="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-sm"></span>
                                <time class="text-[10px] font-bold text-slate-400 uppercase">Today</time>
                                <p class="text-sm font-bold text-slate-900">${item.status}</p>
                                <p class="text-xs text-slate-500">PO: <span class="text-factory-blue font-semibold">${item.orders?.po_number || item.order_id}</span></p>
                            </div>
                        `).join('') : '<p class="text-slate-400 text-sm italic">No recent activity</p>'}
                    </div>
                </div>

                <!-- Dispatch Table -->
                <div class="lg:col-span-2 glass-card overflow-hidden">
                    <div class="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                        <h3 class="font-bold text-slate-800">Shipment Logs</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">PO Number</th>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Quantity</th>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Transporter</th>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="dispatch-table-body" class="divide-y divide-slate-100 bg-white">
                                ${shipments?.length > 0 ? shipments.map(log => `
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="px-6 py-4 text-sm text-slate-600 font-medium">Today</td>
                                        <td class="px-6 py-4 text-sm font-bold text-slate-900">${log.orders?.po_number || log.order_id}</td>
                                        <td class="px-6 py-4 text-sm font-black text-slate-900">${log.quantity?.toLocaleString() || '0'}</td>
                                        <td class="px-6 py-4 text-sm text-slate-600">${log.transporter || '-'}</td>
                                        <td class="px-6 py-4">
                                            <span class="px-3 py-1 text-[10px] font-black uppercase rounded-md bg-blue-100 text-blue-700">${log.status}</span>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <div class="flex justify-end gap-2">
                                                <button class="view-dispatch-btn p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-factory-blue" data-id="${log.id}" title="View">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                                                </button>
                                                <button class="edit-dispatch-btn p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-factory-blue" data-id="${log.id}" title="Edit">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                                </button>
                                                <button class="delete-dispatch-btn p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500" data-id="${log.id}" title="Delete">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="6" class="px-6 py-10 text-center text-slate-400 italic">No shipment logs found</td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `

    // Multi-action event listener
    const tableBody = container.querySelector('#dispatch-table-body')
    if (tableBody) {
        tableBody.onclick = async (e) => {
            const btn = e.target.closest('button')
            if (!btn) return
            
            const id = btn.dataset.id
            if (btn.classList.contains('delete-dispatch-btn')) {
                if (confirm('Delete this shipment record?')) {
                    await supabase.from('shipments').delete().eq('id', id)
                    renderDispatch(container)
                }
            } else {
                alert('Action not yet implemented for this module')
            }
        }
    }
}
