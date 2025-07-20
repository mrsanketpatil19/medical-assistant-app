// Format status with appropriate badge
function formatStatus(status) {
    if (!status) return '';
    
    const statusLower = status.toLowerCase();
    let statusClass = 'status-badge';
    
    if (statusLower.includes('active') || statusLower.includes('in progress')) {
        statusClass += ' status-active';
    } else if (statusLower.includes('pending') || statusLower.includes('waiting')) {
        statusClass += ' status-pending';
    } else if (statusLower.includes('complete') || statusLower.includes('done')) {
        statusClass += ' status-completed';
    } else if (statusLower.includes('cancel') || statusLower.includes('reject')) {
        statusClass += ' status-cancelled';
    }
    
    return `<span class="${statusClass}">${status}</span>`;
}

// Update the table with patient data
function updatePatientsTable(patients) {
    const tbody = document.getElementById('patientsTableBody');
    tbody.innerHTML = '';
    
    if (patients.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">No patients found</td>';
        tbody.appendChild(row);
        return;
    }
    
    patients.forEach(patient => {
        const row = document.createElement('tr');
        const statusBadge = formatStatus(patient.Status_x);
        
        row.innerHTML = `
            <td>${patient.PatientID || 'N/A'}</td>
            <td>${patient.Name || 'N/A'}</td>
            <td>${patient.VisitDate ? new Date(patient.VisitDate).toLocaleDateString() : 'N/A'}</td>
            <td>${statusBadge}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Initialize the status pie chart
let statusChart = null;

function updatePieChart(statusData) {
    const canvas = document.getElementById('statusPieChart');
    const ctx = canvas.getContext('2d');
    const legendContainer = document.getElementById('chartLegend');
    
    // Destroy existing chart if it exists
    if (statusChart) {
        statusChart.destroy();
    }
    
    // Clear existing legend
    legendContainer.innerHTML = '';
    
    // Prepare data for the chart
    const labels = Object.keys(statusData);
    const data = Object.values(statusData);
    
    // Define colors based on status - using CSS variables for consistency
    const statusColorMap = [
        { pattern: 'cancelled', color: 'var(--danger)' },          // Red
        { pattern: 'no[- ]?show', color: '#fca5a5' },              // Light red
        { pattern: 'completed', color: 'var(--success)' },         // Green
        { pattern: 'follow[ -]?up', color: 'var(--accent-secondary)' }, // Yellow
        { pattern: 'pending', color: 'var(--warning)' },           // Yellow-orange
    ];
    
    // Default color for any unmatched statuses
    const defaultColor = 'var(--primary)';  // Primary blue
    
    // Map each status to its corresponding color
    const backgroundColors = labels.map(label => {
        const lowerLabel = label.toLowerCase();
        // Find the first matching pattern
        const match = statusColorMap.find(item => 
            new RegExp(`^${item.pattern}$`, 'i').test(lowerLabel.replace(/[ -]/g, ''))
        );
        
        const color = match ? match.color : defaultColor;
        
        // Debug log
        console.log(`Status: "${label}" => Color: ${color} (${match ? 'matched' : 'default'})`);
        
        return color;
    });
    
    // Debug: Log the final mapping
    console.log('Status to color mapping:', 
        labels.map((label, i) => ({
            status: label, 
            color: backgroundColors[i]
        }))
    );
    
    // Create custom legend with dark theme
    labels.forEach((label, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.style.color = '#e2e8f0';
        legendItem.style.margin = '4px 0';
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.fontSize = '0.85rem';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = backgroundColors[index];
        colorBox.style.width = '12px';
        colorBox.style.height = '12px';
        colorBox.style.borderRadius = '3px';
        colorBox.style.marginRight = '8px';
        colorBox.style.flexShrink = '0';
        
        const labelText = document.createElement('span');
        const value = data[index];
        const total = data.reduce((a, b) => a + b, 0);
        const percentage = Math.round((value / total) * 100);
        labelText.textContent = `${label}: ${value} (${percentage}%)`;
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(labelText);
        legendContainer.appendChild(legendItem);
    });
    
    // Set canvas size to maintain aspect ratio
    const container = canvas.parentElement;
    const size = Math.min(container.offsetWidth, container.offsetHeight);
    canvas.width = size;
    canvas.height = size;
    
    // Create new chart with responsive settings
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#1a1d28', // Match the dark background
                borderWidth: 2,
                hoverOffset: 10,
                hoverBorderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false // We're using custom legend
                },
                tooltip: {
                    backgroundColor: '#1a1d28',
                    titleColor: '#ffffff',
                    bodyColor: '#e2e8f0',
                    borderColor: '#2d3748',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
    
    // Handle window resize
    const resizeObserver = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        const newSize = Math.min(width, height);
        
        // Only update if size actually changed
        if (canvas.width !== newSize) {
            canvas.width = newSize;
            canvas.height = newSize;
            statusChart.update();
        }
    });
    
    // Start observing the container
    resizeObserver.observe(container);
    
    // Store the observer so we can disconnect it later
    canvas._resizeObserver = resizeObserver;
    
    // Clean up previous observer if it exists
    if (canvas._previousResizeObserver) {
        canvas._previousResizeObserver.disconnect();
    }
    canvas._previousResizeObserver = resizeObserver;
}

// Load patients data
function loadPatients(providerId) {
    const statusFilter = document.getElementById('statusFilter').value;
    const patientIdFilter = document.getElementById('patientIdFilter').value;
    const sortOrder = document.getElementById('sortDate').getAttribute('data-sort');
    
    fetch(`/get_patient_data/${providerId}?status=${statusFilter}&patient_id=${encodeURIComponent(patientIdFilter)}&sort=${sortOrder}`)
        .then(response => response.json())
        .then(patients => {
            // Update patients table
            updatePatientsTable(patients);
            
            // Calculate status distribution for pie chart
            const statusCounts = {};
            patients.forEach(patient => {
                const status = patient.Status_x || 'Unknown';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            
            updatePieChart(statusCounts);
        })
        .catch(error => {
            console.error('Error loading patients:', error);
            const tbody = document.getElementById('patientsTableBody');
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #ef476f;">Error loading patient data</td></tr>';
        });
}

// Load statuses for filter dropdown
function loadStatuses() {
    fetch('/get_statuses')
        .then(response => response.json())
        .then(statuses => {
            const statusFilter = document.getElementById('statusFilter');
            // Clear existing options except the first one (All Statuses)
            while (statusFilter.options.length > 1) {
                statusFilter.remove(1);
            }
            
            // Add status options
            statuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status.toLowerCase();
                option.textContent = status;
                statusFilter.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading statuses:', error);
        });
}

// Load providers for dropdown
function loadProviders() {
    fetch('/get_providers')
        .then(response => response.json())
        .then(providers => {
            const dropdown = document.getElementById('providerDropdown');
            // Clear existing options except the first one
            while (dropdown.options.length > 1) {
                dropdown.remove(1);
            }
            
            // Add provider options
            providers.forEach(provider => {
                const option = document.createElement('option');
                option.value = provider.ProviderID;
                option.textContent = provider.ProviderName;
                dropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading providers:', error);
        });
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadProviders();
    loadStatuses();
    
    // Set up event listeners
    document.getElementById('providerDropdown').addEventListener('change', function() {
        const providerId = this.value;
        if (providerId) {
            loadPatients(providerId);
        } else {
            document.getElementById('patientsTableBody').innerHTML = '';
        }
    });
    
    document.getElementById('statusFilter').addEventListener('change', function() {
        const providerId = document.getElementById('providerDropdown').value;
        if (providerId) {
            loadPatients(providerId);
        }
    });
    
    document.getElementById('patientIdFilter').addEventListener('input', debounce(function() {
        const providerId = document.getElementById('providerDropdown').value;
        if (providerId) {
            loadPatients(providerId);
        }
    }, 300));
    
    document.getElementById('sortDate').addEventListener('click', function() {
        const currentSort = this.getAttribute('data-sort');
        const newSort = currentSort === 'asc' ? 'desc' : 'asc';
        this.setAttribute('data-sort', newSort);
        this.innerHTML = `<i class="fas fa-sort-amount-${newSort === 'asc' ? 'down' : 'up'}"></i> Sort by Date`;
        
        const providerId = document.getElementById('providerDropdown').value;
        if (providerId) {
            loadPatients(providerId);
        }
    });
});

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
