export function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value)
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

export async function exportToExcel(data, fileName) {
    if (!data || !data.length) return;
    
    // Create CSV content
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function downloadPDF() {
    window.print();
}

export function calculateEfficiency(produced, planned) {
    if (!planned) return 0
    return ((produced / planned) * 100).toFixed(1)
}

export function getStatusColor(status) {
    const colors = {
        'Pending': 'bg-slate-100 text-slate-600',
        'Running': 'bg-blue-100 text-blue-600',
        'Completed': 'bg-green-100 text-green-600',
        'High': 'bg-red-100 text-red-600',
        'Medium': 'bg-orange-100 text-orange-600',
        'Low': 'bg-green-100 text-green-600'
    }
    return colors[status] || 'bg-slate-100 text-slate-600'
}
