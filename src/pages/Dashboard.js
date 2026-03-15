import Chart from 'chart.js/auto'
import { exportToExcel, downloadPDF } from '../lib/utils'
import { supabase } from '../lib/supabase'

export async function renderDashboard(container) {
    const { data: orders } = await supabase.from('orders').select('*')
    const { data: logs } = await supabase.from('production_logs').select('*')
    const { data: inventory } = await supabase.from('inventory').select('*')
    
    const totalOrders = orders?.length || 0
    const runningOrders = orders?.filter(o => o.order_status === 'Running').length || 0
    const completedOrders = orders?.filter(o => o.order_status === 'Completed').length || 0
    const pendingOrders = orders?.filter(o => o.order_status === 'Pending').length || 0
    const lowStockItems = inventory?.filter(i => (parseFloat(i.stock) || 0) <= (parseFloat(i.min) || 0)).length || 0

    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between no-print">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
                    <p class="text-slate-500">Real-time factory metrics and analytics</p>
                </div>
                <div class="flex gap-3">
                    <button id="download-csv" class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                        Excel / CSV
                    </button>
                    <button id="download-pdf" class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h3a2 2 0 0 1 0 4h-3v-4Z"/><path d="M9 12v6"/></svg>
                        Download PDF
                    </button>
                    <button id="clear-data" class="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        Clear All Data
                    </button>
                    <button id="refresh-dashboard" class="px-4 py-2 bg-factory-blue text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                        Refresh
                    </button>
                </div>
            </div>
 
            <!-- KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                ${renderStatsCard('Total Orders', totalOrders, 'Real-time', 'blue')}
                ${renderStatsCard('Running Orders', runningOrders, 'Live', 'orange')}
                ${renderStatsCard('Completed', completedOrders, 'Live', 'green')}
                ${renderStatsCard('Pending Orders', pendingOrders, 'Live', 'purple')}
                ${renderStatsCard('Low Stock Items', lowStockItems, 'Live', lowStockItems > 0 ? 'red' : 'green')}
            </div>

            <!-- Charts Row 1 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="glass-card p-6">
                    <h3 class="text-lg font-bold mb-4">Daily Production Trend (Last 7 Days)</h3>
                    <div class="h-[300px]">
                        <canvas id="productionTrendChart"></canvas>
                    </div>
                </div>
                <div class="glass-card p-6">
                    <h3 class="text-lg font-bold mb-4">Production Volume by Stage</h3>
                    <div class="h-[300px]">
                        <canvas id="deptPerformanceChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Charts Row 2 -->
             <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="glass-card p-6">
                    <h3 class="text-lg font-bold mb-4">Order Status Breakdown</h3>
                    <div class="h-[250px] relative">
                        ${orders.length === 0 ? `
                            <div class="absolute inset-0 flex items-center justify-center z-10">
                                <p class="text-slate-400 text-sm font-medium">No order data available</p>
                            </div>
                        ` : ''}
                        <canvas id="orderStatusChart"></canvas>
                    </div>
                </div>
                <div class="glass-card p-6 lg:col-span-2">
                    <h3 class="text-lg font-bold mb-4">Current Inventory Levels</h3>
                    <div class="h-[250px]">
                        <canvas id="inventoryUsageChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `

    initCharts({ orders, logs, inventory })
    setupEventListeners(container)
}

function setupEventListeners(container) {
    const refreshBtn = container.querySelector('#refresh-dashboard')
    const csvBtn = container.querySelector('#download-csv')
    const pdfBtn = container.querySelector('#download-pdf')

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.disabled = true
            refreshBtn.innerHTML = `
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
            `
            
            setTimeout(() => {
                renderDashboard(container)
            }, 800)
        })
    }

    if (csvBtn) {
        csvBtn.addEventListener('click', () => {
            alert('Exporting actual dashboard metrics to Excel...')
            // In a real app, we'd aggregate current stats here
            const data = [
                { Metric: 'Report Date', Value: new Date().toLocaleDateString() }
            ]
            exportToExcel(data, 'Factory_Dashboard_Report')
        })
    }

    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            downloadPDF()
        })
    }

    const clearBtn = container.querySelector('#clear-data')
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear ALL data? This action cannot be undone.')) {
                supabase.clearData()
                window.location.reload()
            }
        })
    }
}

function initCharts(data = {}) {
    const { orders = [], logs = [], inventory = [] } = data

    setTimeout(() => {
        // 1. Daily Production Trend
        const trendCtx = document.getElementById('productionTrendChart')
        if (trendCtx) {
            const labels = []
            const values = []
            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]
                const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' })
                
                labels.push(dayLabel)
                const dailyTotal = logs
                    .filter(l => l.date && l.date.split('T')[0] === dateStr)
                    .reduce((sum, l) => sum + (parseInt(l.quantity) || 0), 0)
                values.push(dailyTotal)
            }
            
            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Production Volume',
                        data: values,
                        borderColor: '#1e3a8a',
                        backgroundColor: 'rgba(30, 58, 138, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            })
        }

        // 2. Department Performance
        const deptCtx = document.getElementById('deptPerformanceChart')
        if (deptCtx) {
            const stages = ['Cutting', 'Stitching', 'Finishing', 'Packing']
            const stageValues = stages.map(stage => 
                logs.filter(l => l.type?.toLowerCase() === stage.toLowerCase())
                    .reduce((sum, l) => sum + (parseInt(l.quantity) || 0), 0)
            )

            new Chart(deptCtx, {
                type: 'bar',
                data: {
                    labels: stages,
                    datasets: [{
                        label: 'Total Output',
                        data: stageValues,
                        backgroundColor: ['#3b82f6', '#f97316', '#10b981', '#a855f7'],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            })
        }

        // 3. Order Status
        const statusCtx = document.getElementById('orderStatusChart')
        if (statusCtx) {
            const pending = orders.filter(o => o.order_status === 'Pending').length
            const running = orders.filter(o => o.order_status === 'Running').length
            const completed = orders.filter(o => o.order_status === 'Completed').length
            
            new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'Running', 'Completed'],
                    datasets: [{
                        data: orders.length > 0 ? [pending, running, completed] : [1],
                        backgroundColor: orders.length > 0 ? ['#cbd5e1', '#3b82f6', '#10b981'] : ['#f1f5f9'],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            })
        }

        // 4. Inventory Levels
        const invCtx = document.getElementById('inventoryUsageChart')
        if (invCtx) {
            // Take top 8 items or all
            const items = inventory.slice(0, 8)
            const labels = items.length > 0 ? items.map(i => i.name) : ['No Items']
            const values = items.length > 0 ? items.map(i => parseFloat(i.stock) || 0) : [0]
            const minLevels = items.length > 0 ? items.map(i => parseFloat(i.min) || 0) : [0]

            new Chart(invCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Current Stock',
                            data: values,
                            backgroundColor: '#1e3a8a'
                        },
                        {
                            label: 'Min Level Alert',
                            data: minLevels,
                            backgroundColor: '#f97316'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            })
        }
    }, 0)
}


function renderStatsCard(title, value, trend, color) {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        orange: 'text-orange-600 bg-orange-50',
        green: 'text-green-600 bg-green-50',
        purple: 'text-purple-600 bg-purple-50',
        red: 'text-red-600 bg-red-50'
    }

    const isPositive = trend.startsWith('+')

    return `
        <div class="glass-card p-5">
            <p class="text-sm font-medium text-slate-500 mb-1">${title}</p>
            <div class="flex items-end justify-between">
                <h3 class="text-2xl font-bold text-slate-800">${value}</h3>
                <span class="text-xs font-bold px-2 py-1 rounded-full ${colorClasses[color]} flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="${isPositive ? '' : 'rotate-180'}"><polyline points="18 15 12 9 6 15"/></svg>
                    ${trend}
                </span>
            </div>
        </div>
    `
}
