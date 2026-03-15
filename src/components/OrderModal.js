import { supabase } from '../lib/supabase'
import { getStatusColor, formatDate } from '../lib/utils'

export const initOrderModal = (container, onUpdate) => {
    let modal = document.getElementById('order-modal')
    if (!modal) {
        const modalHtml = `
            <div id="order-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
                <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden transform scale-95 transition-transform duration-300">
                    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 id="modal-title" class="text-lg font-bold text-slate-800">Order Modal</h2>
                        <button id="close-modal" class="text-slate-400 hover:text-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    <form id="order-form" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        <!-- Form content injected dynamically -->
                    </form>
                </div>
            </div>
        `
        document.body.insertAdjacentHTML('beforeend', modalHtml)
        modal = document.getElementById('order-modal')
    }

    const modalContent = modal.querySelector('div')
    const closeBtn = document.getElementById('close-modal')
    const form = document.getElementById('order-form')
    const modalTitle = document.getElementById('modal-title')

    const hideModal = () => {
        modal.classList.remove('opacity-100')
        modal.classList.add('opacity-0')
        modalContent.classList.remove('scale-100')
        modalContent.classList.add('scale-95')
        setTimeout(() => {
            modal.classList.add('hidden')
        }, 300)
    }

    closeBtn.onclick = hideModal

    const renderViewMode = (order) => {
        form.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PO Number</span>
                        <h3 class="text-xl font-bold text-slate-800">${order.po_number || '-'}</h3>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                         <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                            <span class="px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(order.order_status)}">${order.order_status}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority:</span>
                            <span class="px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(order.priority)}">${order.priority}</span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-6">
                    <div class="col-span-8 space-y-6">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <h4 class="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    Buyer Info
                                </h4>
                                <div class="space-y-2">
                                    <p class="text-sm"><span class="text-slate-500">Name:</span> <span class="font-semibold text-slate-800">${order.buyer_name}</span></p>
                                    <p class="text-sm"><span class="text-slate-500">Brand:</span> <span class="font-semibold text-slate-800">${order.brand_name}</span></p>
                                    <p class="text-sm"><span class="text-slate-500">PO #:</span> <span class="font-mono bg-slate-50 px-1 rounded border border-slate-100">${order.po_number || '-'}</span></p>
                                </div>
                            </div>
                            <div>
                                <h4 class="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                                    Product Info
                                </h4>
                                <div class="space-y-2">
                                    <p class="text-sm"><span class="text-slate-500">Product:</span> <span class="font-semibold text-slate-800">${order.product_name}</span></p>
                                    <p class="text-sm"><span class="text-slate-500">Rate:</span> <span class="font-bold text-factory-blue">₹${order.product_rate?.toLocaleString() || '0'}</span></p>
                                    <p class="text-sm"><span class="text-slate-500">Fabric Avg:</span> <span class="font-bold text-slate-800">${order.fabric_avg || '-'}</span></p>
                                    <p class="text-sm"><span class="text-slate-500">Stitching Price:</span> <span class="font-bold text-slate-800">₹${order.stitching_price || '-'}</span></p>
                                    <p class="text-sm"><span class="text-slate-500">Total Qty:</span> <span class="font-semibold text-slate-800">${order.quantity?.toLocaleString() || '0'} units</span></p>
                                </div>
                            </div>
                        </div>

                        <div class="pt-4 border-t border-slate-50">
                            <h4 class="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Delivery Timeline
                            </h4>
                            <div class="grid grid-cols-4 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div class="text-center">
                                    <span class="block text-[9px] font-bold text-slate-400 uppercase">PO Date</span>
                                    <span class="text-xs font-semibold text-slate-700">${formatDate(order.po_date)}</span>
                                </div>
                                <div class="text-center border-l border-slate-200">
                                    <span class="block text-[9px] font-bold text-slate-400 uppercase">Expiry</span>
                                    <span class="text-xs font-semibold text-slate-700">${formatDate(order.po_expiry_date)}</span>
                                </div>
                                <div class="text-center border-l border-slate-200">
                                    <span class="block text-[9px] font-bold text-slate-400 uppercase">Extension</span>
                                    <span class="text-xs font-semibold text-slate-700">${order.extension_date ? formatDate(order.extension_date) : '-'}</span>
                                </div>
                                <div class="text-center border-l border-slate-200">
                                    <span class="block text-[9px] font-bold text-slate-400 uppercase">Status Update</span>
                                    <span class="text-xs font-semibold text-slate-700">${formatDate(new Date())}</span>
                                </div>
                            </div>
                        </div>

                        <div class="pt-4 border-t border-slate-50">
                            <h4 class="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center justify-between">
                                <span>Size breakdown</span>
                                <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">${order.sizes?.length || 0} Sizes</span>
                            </h4>
                            <div class="grid grid-cols-4 gap-2">
                                ${(order.sizes || []).map(s => `
                                    <div class="p-2 border border-slate-100 rounded bg-white text-center">
                                        <span class="block text-[10px] text-slate-400 font-bold">${s.size}</span>
                                        <span class="text-sm font-bold text-slate-800">${s.qty.toLocaleString()}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="col-span-4 space-y-4">
                        <h4 class="text-xs font-bold text-slate-400 uppercase mb-2">Product View</h4>
                        <div class="w-full bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center relative min-h-[300px] bg-white">
                            <img src="${order.product_image || '/api/placeholder/400/600'}" class="max-w-full max-h-[500px] object-contain hover:scale-105 transition-transform duration-500" alt="Product" />
                            <div class="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur p-2 rounded text-[10px] text-slate-500 font-medium border border-white/20">
                                ${order.product_image ? 'Production Sample' : 'Reference Placeholder'}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pt-6 flex gap-3 mt-6 border-t border-slate-100">
                    <button type="button" class="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors" onclick="document.getElementById('close-modal').click()">Close Details</button>
                    <button type="button" id="view-edit-btn" class="flex-1 px-4 py-2 bg-factory-blue text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition-colors shadow-lg shadow-factory-blue/20 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        Edit Order
                    </button>
                </div>
            </div>
        `
        document.getElementById('view-edit-btn').onclick = () => showModal('edit', order)
    }

    const renderFormMode = (mode, order) => {
        form.innerHTML = `
            <input type="hidden" name="order_id" />
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Buyer Name</label>
                    <input type="text" name="buyer_name" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Brand Name</label>
                    <input type="text" name="brand_name" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">PO Number</label>
                    <input type="text" name="po_number" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Product Name</label>
                    <input type="text" name="product_name" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Product Rate (₹)</label>
                    <input type="number" step="0.01" name="product_rate" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Style No.</label>
                    <input type="text" name="style_no" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Fabric Avg.</label>
                    <input type="number" step="0.01" name="fabric_avg" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" placeholder="0.00" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Stitching Price (₹)</label>
                    <input type="number" step="0.01" name="stitching_price" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" placeholder="0.00" />
                </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">PO Date</label>
                    <input type="date" name="po_date" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">PO Expiry Date</label>
                    <input type="date" name="po_expiry_date" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Extension Date</label>
                    <input type="date" name="extension_date" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20" />
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                    <select name="priority" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20">
                        <option value="Low">Low</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
                <div id="status-field-container">
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Order Status</label>
                    <select name="order_status" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-factory-blue/20">
                        <option value="Pending">Pending</option>
                        <option value="Running">Running</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            <div id="image-field-container">
                <label class="block text-sm font-semibold text-slate-700 mb-1">Product Image</label>
                <input type="file" id="product-image-input" name="product_image" accept="image/*" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none" />
            </div>

            <div id="image-preview-container" class="hidden mt-2 p-3 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">Full Image Preview</p>
                <div class="w-full flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden min-h-[200px]">
                    <img id="product-image-preview" src="" class="max-w-full max-h-[600px] object-contain p-1" />
                </div>
            </div>

            <div id="size-section" class="border-t border-slate-100 pt-4">
                <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                    Size wise Quantity
                    <button type="button" id="add-size-row" class="text-xs text-factory-blue hover:underline flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        Add Size
                    </button>
                </h3>
                <div id="size-qty-container" class="space-y-2">
                    <div class="flex gap-2 size-row">
                        <input type="text" name="size[]" placeholder="Size" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <input type="number" name="qty[]" placeholder="Qty" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <button type="button" class="remove-size-row p-2 text-slate-400 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="pt-4 flex gap-3">
                <button type="button" id="cancel-modal" class="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors" onclick="document.getElementById('close-modal').click()">Cancel</button>
                <button type="submit" id="submit-btn" class="flex-1 px-4 py-2 bg-factory-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">${mode === 'edit' ? 'Update Order' : 'Create Order'}</button>
            </div>
        `
        
        if (!order) {
            document.getElementById('status-field-container').classList.add('hidden')
        } else {
            form.order_id.value = order.id
            form.buyer_name.value = order.buyer_name
            form.brand_name.value = order.brand_name
            form.po_number.value = order.po_number || ''
            form.product_name.value = order.product_name
            form.product_rate.value = order.product_rate
            form.style_no.value = order.style_no || ''
            form.fabric_avg.value = order.fabric_avg || ''
            form.stitching_price.value = order.stitching_price || ''
            form.po_date.value = order.po_date
            form.po_expiry_date.value = order.po_expiry_date
            form.extension_date.value = order.extension_date || ''
            form.priority.value = order.priority
            form.order_status.value = order.order_status
            
            const sc = document.getElementById('size-qty-container')
            if (order.sizes && order.sizes.length > 0) {
                sc.innerHTML = order.sizes.map(s => `
                    <div class="flex gap-2 size-row">
                        <input type="text" name="size[]" value="${s.size}" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <input type="number" name="qty[]" value="${s.qty}" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <button type="button" class="remove-size-row p-2 text-slate-400 hover:text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                    </div>
                `).join('')
            }

            if (order.product_image) {
                const pc = document.getElementById('image-preview-container')
                const pi = document.getElementById('product-image-preview')
                pi.src = order.product_image
                pc.classList.remove('hidden')
            }
        }
        bindFormListeners()
    }

    const bindFormListeners = () => {
        const addBtn = document.getElementById('add-size-row')
        const sc = document.getElementById('size-qty-container')
        const im = document.getElementById('product-image-input')
        const pc = document.getElementById('image-preview-container')
        const pi = document.getElementById('product-image-preview')

        if (addBtn) {
            addBtn.onclick = () => {
                const r = document.createElement('div')
                r.className = 'flex gap-2 size-row'
                r.innerHTML = `
                    <input type="text" name="size[]" placeholder="Size" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    <input type="number" name="qty[]" placeholder="Qty" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    <button type="button" class="remove-size-row p-2 text-slate-400 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                `
                sc.appendChild(r)
            }
        }

        if (sc) {
            sc.onclick = (e) => {
                if (e.target.closest('.remove-size-row')) {
                    if (sc.querySelectorAll('.size-row').length > 1) e.target.closest('.size-row').remove()
                }
            }
        }

        if (im) {
            im.onchange = (e) => {
                const f = e.target.files[0]
                if (f) {
                    const u = URL.createObjectURL(f)
                    pi.src = u
                    pc.classList.remove('hidden')
                }
            }
        }

        form.onsubmit = async (e) => {
            e.preventDefault()
            const fd = new FormData(form)
            const id = fd.get('order_id')
            
            const sizes = []
            const sIn = form.querySelectorAll('input[name="size[]"]')
            const qIn = form.querySelectorAll('input[name="qty[]"]')
            let tQty = 0
            sIn.forEach((s, i) => {
                const v = parseInt(qIn[i].value) || 0
                if (s.value || v > 0) {
                    sizes.push({ size: s.value, qty: v })
                    tQty += v
                }
            })
            
            let img = null
            if (im?.files[0]) {
                img = await new Promise(r => {
                    const rd = new FileReader()
                    rd.onload = (ev) => r(ev.target.result)
                    rd.readAsDataURL(im.files[0])
                })
            } else if (id) {
                const { data } = await supabase.from('orders').select('product_image').eq('id', id)
                if (data?.[0]) img = data[0].product_image
            }

            const data = {
                buyer_name: fd.get('buyer_name'),
                brand_name: fd.get('brand_name'),
                po_number: fd.get('po_number'),
                product_name: fd.get('product_name'),
                product_rate: parseFloat(fd.get('product_rate')),
                style_no: fd.get('style_no'),
                fabric_avg: parseFloat(fd.get('fabric_avg')) || null,
                stitching_price: parseFloat(fd.get('stitching_price')) || null,
                po_date: fd.get('po_date'),
                po_expiry_date: fd.get('po_expiry_date'),
                extension_date: fd.get('extension_date'),
                priority: fd.get('priority'),
                quantity: tQty,
                sizes: sizes,
                product_image: img
            }

            if (id) {
                data.order_status = fd.get('order_status')
                await supabase.from('orders').update(data).eq('id', id)
            } else {
                data.order_number = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`
                data.order_status = 'Pending'
                await supabase.from('orders').insert([data])
            }
            hideModal()
            if (onUpdate) await onUpdate()
        }
    }

    const showModal = (mode = 'create', order = null) => {
        modal.classList.remove('hidden')
        modalTitle.innerText = mode === 'edit' ? 'Edit Order' : (mode === 'view' ? 'Order Details' : 'Create New Order')
        
        if (mode === 'view') renderViewMode(order)
        else renderFormMode(mode, order)

        setTimeout(() => {
            modal.classList.remove('opacity-0')
            modal.classList.add('opacity-100')
            modalContent.classList.remove('scale-95')
            modalContent.classList.add('scale-100')
        }, 10)
    }

    return { showModal, hideModal }
}
