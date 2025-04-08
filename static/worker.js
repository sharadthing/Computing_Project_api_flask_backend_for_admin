document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const workersTableBody = document.getElementById('workersTableBody');
    const addWorkerBtn = document.getElementById('addWorkerBtn');
    const workerModal = document.getElementById('workerModal');
    const workerForm = document.getElementById('workerForm');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelWorkerBtn = document.getElementById('cancelWorkerBtn');
    const confirmModal = document.getElementById('confirmModal');
    const confirmActionBtn = document.getElementById('confirmAction');
    const confirmCancelBtn = document.getElementById('confirmCancel');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    // State variables
    let currentWorkerId = null;
    let currentTab = 'all-workers';
    let workersData = [];
    
    // Initialize the page
    loadWorkers();
    setupEventListeners();
    
    // Functions
    function setupEventListeners() {
        // Modal controls
        addWorkerBtn.addEventListener('click', () => openWorkerModal());
        closeModalBtn.addEventListener('click', () => closeWorkerModal());
        cancelWorkerBtn.addEventListener('click', () => closeWorkerModal());
        
        // Form submission
        workerForm.addEventListener('submit', handleFormSubmit);
        
        // Confirmation modal
        confirmActionBtn.addEventListener('click', executeConfirmedAction);
        confirmCancelBtn.addEventListener('click', () => confirmModal.classList.add('hidden'));
        
        // Tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTab = button.dataset.tab;
                filterWorkers();
            });
        });
    }
    
    async function loadWorkers() {
        try {
            const response = await fetch('/api/workers');
            if (!response.ok) throw new Error('Failed to fetch workers');
            
            workersData = await response.json();
            renderWorkersTable(workersData);
        } catch (error) {
            console.error('Error loading workers:', error);
            alert('Failed to load workers. Please try again.');
        }
    }
    
    function renderWorkersTable(workers) {
        workersTableBody.innerHTML = '';
        
        if (workers.length === 0) {
            workersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">No workers found</td>
                </tr>
            `;
            return;
        }
        
        workers.forEach(worker => {
            const status = worker.site_access.working_status;
            let statusClass, statusText;
            
            switch(status) {
                case 'on':
                    statusClass = 'bg-emerald-100 text-emerald-800';
                    statusText = 'On Site';
                    break;
                case 'off':
                    statusClass = 'bg-gray-100 text-gray-800';
                    statusText = 'Off Site';
                    break;
                case 'suspended':
                    statusClass = 'bg-red-100 text-red-800';
                    statusText = 'Suspended';
                    break;
                default:
                    statusClass = 'bg-gray-100 text-gray-800';
                    statusText = 'Unknown';
            }
            
            const row = document.createElement('tr');
            row.className = 'worker-table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img src="https://img.icons8.com/ios-filled/100/user-male-circle.png" alt="" class="h-10 w-10 rounded-full">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${worker.personal_info.full_name}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${worker.site_access.worker_id}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${worker.personal_info.job_title}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${worker.site_access.site_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(worker.site_access.last_active) || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button data-id="${worker._id}" class="edit-btn text-emerald-600 hover:text-emerald-900 mr-3">Edit</button>
                    <button data-id="${worker._id}" class="delete-btn text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
            
            workersTableBody.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workerId = e.target.dataset.id;
                editWorker(workerId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workerId = e.target.dataset.id;
                confirmDeleteWorker(workerId);
            });
        });
    }
    
    function filterWorkers() {
        let filteredWorkers = [...workersData];
        
        switch(currentTab) {
            case 'on-site':
                filteredWorkers = workersData.filter(w => w.site_access.working_status === 'on');
                break;
            case 'off-site':
                filteredWorkers = workersData.filter(w => w.site_access.working_status === 'off');
                break;
            case 'suspended':
                filteredWorkers = workersData.filter(w => w.site_access.working_status === 'suspended');
                break;
            // 'all-workers' shows all workers
        }
        
        renderWorkersTable(filteredWorkers);
    }
    
    function openWorkerModal(worker = null) {
        if (worker) {
            // Edit mode
            document.getElementById('modalTitle').textContent = 'Edit Worker';
            currentWorkerId = worker._id;
            
            // Fill the form with worker data
            document.getElementById('workerId').value = worker._id;
            document.getElementById('fullName').value = worker.personal_info.full_name || '';
            document.getElementById('dateOfBirth').value = worker.personal_info.date_of_birth || '';
            document.getElementById('jobTitle').value = worker.personal_info.job_title || '';
            document.getElementById('gender').value = worker.personal_info.gender || '';
            document.getElementById('nationality').value = worker.personal_info.nationality || '';
            document.getElementById('bloodGroup').value = worker.personal_info.blood_group || '';
            
            document.getElementById('phone').value = worker.contact_info.phone || '';
            document.getElementById('email').value = worker.contact_info.email || '';
            document.getElementById('address').value = worker.contact_info.address || '';
            
            document.getElementById('emergencyName').value = worker.emergency_contact.name || '';
            document.getElementById('emergencyNumber').value = worker.emergency_contact.phone || '';
            document.getElementById('emergencyRelationship').value = worker.emergency_contact.relationship || '';
            
            document.getElementById('siteId').value = worker.site_access.site_id || '';
            document.getElementById('workerIdInput').value = worker.site_access.worker_id || '';
            document.getElementById('siteName').value = worker.site_access.site_name || '';
            document.getElementById('workingStatus').value = worker.site_access.working_status || 'on';
        } else {
            // Add mode
            document.getElementById('modalTitle').textContent = 'Add New Worker';
            currentWorkerId = null;
            workerForm.reset();
        }
        
        workerModal.classList.remove('hidden');
    }
    
    function closeWorkerModal() {
        workerModal.classList.add('hidden');
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            personal_info: {
                full_name: document.getElementById('fullName').value,
                date_of_birth: document.getElementById('dateOfBirth').value,
                job_title: document.getElementById('jobTitle').value,
                gender: document.getElementById('gender').value,
                nationality: document.getElementById('nationality').value,
                blood_group: document.getElementById('bloodGroup').value
            },
            contact_info: {
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value
            },
            emergency_contact: {
                name: document.getElementById('emergencyName').value,
                phone: document.getElementById('emergencyNumber').value,
                relationship: document.getElementById('emergencyRelationship').value
            },
            site_access: {
                site_id: document.getElementById('siteId').value,
                worker_id: document.getElementById('workerIdInput').value,
                site_name: document.getElementById('siteName').value,
                working_status: document.getElementById('workingStatus').value,
                last_active: new Date().toISOString()
            }
        };
        
        try {
            let response;
            
            if (currentWorkerId) {
                // Update existing worker
                response = await fetch(`/api/workers/${currentWorkerId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new worker
                response = await fetch('/api/workers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
            }
            
            if (!response.ok) throw new Error('Failed to save worker');
            
            closeWorkerModal();
            loadWorkers();
            alert('Worker saved successfully!');
        } catch (error) {
            console.error('Error saving worker:', error);
            alert('Failed to save worker. Please try again.');
        }
    }
    
    async function editWorker(workerId) {
        try {
            const response = await fetch(`/api/workers/${workerId}`);
            if (!response.ok) throw new Error('Failed to fetch worker');
            
            const worker = await response.json();
            openWorkerModal(worker);
        } catch (error) {
            console.error('Error fetching worker:', error);
            alert('Failed to load worker data. Please try again.');
        }
    }
    
    function confirmDeleteWorker(workerId) {
        document.getElementById('confirmTitle').textContent = 'Delete Worker';
        document.getElementById('confirmMessage').textContent = 'Are you sure you want to delete this worker? This action cannot be undone.';
        
        confirmActionBtn.dataset.action = 'delete';
        confirmActionBtn.dataset.workerId = workerId;
        
        confirmModal.classList.remove('hidden');
    }
    
    async function executeConfirmedAction() {
        const action = confirmActionBtn.dataset.action;
        const workerId = confirmActionBtn.dataset.workerId;
        
        try {
            if (action === 'delete') {
                const response = await fetch(`/api/workers/${workerId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Failed to delete worker');
                
                loadWorkers();
                alert('Worker deleted successfully!');
            }
            
            confirmModal.classList.add('hidden');
        } catch (error) {
            console.error('Error performing action:', error);
            alert('Failed to perform action. Please try again.');
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
  });