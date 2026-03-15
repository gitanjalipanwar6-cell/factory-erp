import { supabase } from './supabase'

/**
 * Automations for Factory ERP
 */

// 1. When a dispatch is marked as 'Delivered', update the Order status to 'Completed'
export async function handleDispatchCompletion(orderId) {
    console.log(`Auto-updating order ${orderId} status to Completed...`)
    const { error } = await supabase
        .from('orders')
        .update({ order_status: 'Completed', dispatch_status: 'Delivered' })
        .eq('id', orderId)
    
    if (error) console.error('Auto-update failed:', error)
}

// 2. When production is reported, reduce inventory based on bill of materials (MOCK)
export async function reduceInventoryOnProduction(productName, quantity) {
    console.log(`Reducing inventory for ${productName} production of ${quantity} units...`)
    // Mock logic: reduction of stock based on production
    // In a real app, this would query a BOM (Bill of Materials) table
}

// 3. Real-time Dashboard Sync
export function syncDashboard(callback) {
    const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            console.log('Real-time change received:', payload)
            callback(payload)
        })
        .subscribe()
    
    return channel
}
