document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatIcon = document.getElementById('chatIcon');
    const chatContainer = document.getElementById('chatContainer');
    const closeChat = document.getElementById('closeChat');
    const clearChat = document.getElementById('clearChat');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const patientIdInput = document.getElementById('patientId');

    // Toggle chat window
    chatIcon.addEventListener('click', function() {
        chatContainer.classList.toggle('active');
    });

    closeChat.addEventListener('click', function() {
        chatContainer.classList.remove('active');
    });

    // Clear chat history
    clearChat.addEventListener('click', function() {
        // Clear all messages except the first bot message
        const initialMessage = chatMessages.querySelector('.bot-message');
        chatMessages.innerHTML = '';
        if (initialMessage) {
            chatMessages.appendChild(initialMessage);
        } else {
            // If no initial message exists, add one
            addMessage('Hello! I\'m your medical assistant. Please enter a patient ID and ask me anything about their records.', false);
        }
        
        // Clear the input field
        userInput.value = '';
        
        // Reset the patient ID input
        patientIdInput.value = '';
        
        // Focus on the patient ID input
        patientIdInput.focus();
    });

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const messageText = document.createElement('p');
        messageText.textContent = message;
        
        const timeStamp = document.createElement('div');
        timeStamp.className = 'message-time';
        timeStamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.appendChild(messageText);
        messageDiv.appendChild(timeStamp);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Function to send message to backend
    async function sendMessage() {
        const message = userInput.value.trim();
        const patientId = patientIdInput.value.trim();

        if (!patientId) {
            addMessage('Please enter a Patient ID first.', false);
            patientIdInput.focus();
            return;
        }

        if (!message) return;

        // Add user message to chat
        addMessage(message, true);
        userInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patient_id: patientId,
                    question: message
                })
            });

            const data = await response.json();

            // Hide typing indicator
            hideTypingIndicator();

            if (data.error) {
                addMessage(`Error: ${data.error}`, false);
            } else {
                addMessage(data.response, false);
            }
        } catch (error) {
            hideTypingIndicator();
            addMessage('Sorry, there was an error processing your request. Please try again.', false);
            console.error('Error:', error);
        }
    }
});

// Function to load statuses into the dropdown
async function loadStatuses() {
    try {
        const response = await fetch('/get_statuses');
        const statuses = await response.json();
        
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
    } catch (error) {
        console.error('Error loading statuses:', error);
    }
}

// Chart instance
let statusChart = null;

// Function to update pie chart
function updatePieChart(statusData) {
    const ctx = document.getElementById('statusPieChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (statusChart) {
        statusChart.destroy();
    }
    
    // Prepare data for the chart
    const labels = Object.keys(statusData);
    const data = Object.values(statusData);
    const backgroundColors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', 
        '#5a5c69', '#858796', '#3a3b45', '#00a3e0', '#8e44ad'
    ];
    
    // Create new chart
    statusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                hoverBackgroundColor: backgroundColors.slice(0, labels.length),
                hoverBorderColor: 'rgba(234, 236, 244, 1)',
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgb(255,255,255)',
                    bodyColor: '#858796',
                    borderColor: '#dddfeb',
                    borderWidth: 1,
                    padding: 15,
                    displayColors: true,
                    caretPadding: 10,
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
            cutout: '70%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load statuses first
    loadStatuses();
    
    // Then load providers
    fetch('/get_providers')
        .then(response => response.json())
        .then(providers => {
            const dropdown = document.getElementById('providerDropdown');
            providers.forEach(provider => {
                const option = document.createElement('option');
                option.value = provider.ProviderID;
                option.textContent = provider.ProviderName;
                dropdown.appendChild(option);
            });
        });

    // Handle provider selection
    document.getElementById('providerDropdown').addEventListener('change', function() {
        const providerId = this.value;
        if (providerId) {
            loadPatients(providerId);
        } else {
            document.getElementById('patientsTableBody').innerHTML = '';
        }
    });

    // Handle status filter
    document.getElementById('statusFilter').addEventListener('change', function() {
        const providerId = document.getElementById('providerDropdown').value;
        if (providerId) {
            loadPatients(providerId);
        }
    });
    
    // Handle patient ID filter with debounce
    const patientIdFilter = document.getElementById('patientIdFilter');
    patientIdFilter.addEventListener('input', debounce(function() {
        const providerId = document.getElementById('providerDropdown').value;
        if (providerId) {
            loadPatients(providerId);
        }
    }, 300));

    // Handle date sort
    document.getElementById('sortDate').addEventListener('click', function() {
        const currentSort = this.getAttribute('data-sort');
        const newSort = currentSort === 'asc' ? 'desc' : 'asc';
        this.setAttribute('data-sort', newSort);
        this.textContent = `Sort by Date (${newSort === 'asc' ? 'Oldest First' : 'Newest First'})`;
        
        const providerId = document.getElementById('providerDropdown').value;
        if (providerId) {
            loadPatients(providerId);
        }
    });
});

// Debounce function to limit how often the search is triggered
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

function loadPatients(providerId) {
    const statusFilter = document.getElementById('statusFilter').value;
    const patientIdFilter = document.getElementById('patientIdFilter').value;
    const sortOrder = document.getElementById('sortDate').getAttribute('data-sort');
    
    fetch(`/get_patient_data/${providerId}?status=${statusFilter}&patient_id=${encodeURIComponent(patientIdFilter)}&sort=${sortOrder}`)
        .then(response => response.json())
        .then(patients => {
            // Update pie chart with status distribution
            const statusCounts = {};
            patients.forEach(patient => {
                const status = patient.Status_x || 'Unknown';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });
            updatePieChart(statusCounts);
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
                const statusClass = `status-${patient.Status_x.toLowerCase()}`;
                
                row.innerHTML = `
                    <td>${patient.PatientID}</td>
                    <td>${patient.Name || 'N/A'}</td>
                    <td>${patient.VisitDate || 'N/A'}</td>
                    <td><span class="${statusClass}">${patient.Status_x || 'N/A'}</span></td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading patients:', error);
            const tbody = document.getElementById('patientsTableBody');
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading patient data</td></tr>';
        });
}