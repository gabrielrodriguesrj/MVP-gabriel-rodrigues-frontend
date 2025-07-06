// Global state management
const AppState = {
    users: [],
    subscriptions: [],
    expenses: [],
    isBackendOnline: false,
    currentUser: null
};

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    setupEventListeners();
    await checkBackendStatus();
    await loadInitialData();
    updateDashboard();
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // Form submissions
    document.getElementById('user-form').addEventListener('submit', handleUserSubmit);
    document.getElementById('subscription-form').addEventListener('submit', handleSubscriptionSubmit);
    document.getElementById('expense-form').addEventListener('submit', handleExpenseSubmit);

    // Modal close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
}

// Backend connectivity
async function checkBackendStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        AppState.isBackendOnline = response.ok;
        updateBackendStatus(true);
        console.log('Backend está online');
    } catch (error) {
        AppState.isBackendOnline = false;
        updateBackendStatus(false);
        console.log('Backend está offline, usando armazenamento local');
    }
}

function updateBackendStatus(isOnline) {
    const statusDot = document.getElementById('backend-status');
    const statusText = document.getElementById('backend-status-text');
    
    if (isOnline) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Backend Online';
    } else {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Modo Offline';
    }
}

// Data loading
async function loadInitialData() {
    if (AppState.isBackendOnline) {
        await loadDataFromAPI();
    } else {
        loadDataFromMemory();
    }
    
    renderAllData();
}

async function loadDataFromAPI() {
    try {
        // Load users
        const usersResponse = await fetch(`${API_BASE_URL}/users`);
        if (usersResponse.ok) {
            AppState.users = await usersResponse.json();
        }

        // Load subscriptions
        const subscriptionsResponse = await fetch(`${API_BASE_URL}/subscriptions`);
        if (subscriptionsResponse.ok) {
            AppState.subscriptions = await subscriptionsResponse.json();
        }

        // Load expenses
        const expensesResponse = await fetch(`${API_BASE_URL}/recurring-expenses`);
        if (expensesResponse.ok) {
            AppState.expenses = await expensesResponse.json();
        }
    } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
        loadDataFromMemory();
    }
}

function loadDataFromMemory() {
    // Load from sessionStorage (memory-based storage)
    const savedUsers = sessionStorage.getItem('users');
    const savedSubscriptions = sessionStorage.getItem('subscriptions');
    const savedExpenses = sessionStorage.getItem('expenses');

    AppState.users = savedUsers ? JSON.parse(savedUsers) : [];
    AppState.subscriptions = savedSubscriptions ? JSON.parse(savedSubscriptions) : [];
    AppState.expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
}

function saveDataToMemory() {
    sessionStorage.setItem('users', JSON.stringify(AppState.users));
    sessionStorage.setItem('subscriptions', JSON.stringify(AppState.subscriptions));
    sessionStorage.setItem('expenses', JSON.stringify(AppState.expenses));
}

// Tab management
function switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Load specific data if needed
    if (tabName === 'dashboard') {
        updateDashboard();
    }
}

// Modal management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    modal.style.display = 'flex';

    // Populate user selects if needed
    if (modalId === 'subscription-modal' || modalId === 'expense-modal') {
        populateUserSelect(modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    modal.style.display = 'none';
    
    // Reset form
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
}

function populateUserSelect(modalId) {
    const selectId = modalId === 'subscription-modal' ? 'subscription-user' : 'expense-user';
    const select = document.getElementById(selectId);
    
    // Clear existing options except the first one
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // Add user options
    AppState.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.username;
        select.appendChild(option);
    });
}

// Form handlers
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email')
    };

    try {
        if (AppState.isBackendOnline) {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const newUser = await response.json();
                AppState.users.push(newUser);
            } else {
                throw new Error('Erro ao salvar no backend');
            }
        } else {
            // Memory storage
            const newUser = {
                id: Date.now(),
                ...userData,
                created_at: new Date().toISOString()
            };
            AppState.users.push(newUser);
            saveDataToMemory();
        }

        renderUsers();
        updateDashboard();
        closeModal('user-modal');
        showNotification('Usuário criado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        showNotification('Erro ao criar usuário', 'error');
    }
}

async function handleSubscriptionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const subscriptionData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        billing_cycle: formData.get('billing_cycle'),
        next_billing_date: formData.get('next_billing_date'),
        category: formData.get('category'),
        user_id: parseInt(formData.get('user_id'))
    };

    try {
        if (AppState.isBackendOnline) {
            const response = await fetch(`${API_BASE_URL}/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriptionData)
            });

            if (response.ok) {
                const newSubscription = await response.json();
                AppState.subscriptions.push(newSubscription);
            } else {
                throw new Error('Erro ao salvar no backend');
            }
        } else {
            // Memory storage
            const newSubscription = {
                id: Date.now(),
                ...subscriptionData,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            AppState.subscriptions.push(newSubscription);
            saveDataToMemory();
        }

        renderSubscriptions();
        updateDashboard();
        closeModal('subscription-modal');
        showNotification('Assinatura criada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao criar assinatura:', error);
        showNotification('Erro ao criar assinatura', 'error');
    }
}

async function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expenseData = {
        name: formData.get('name'),
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        frequency: formData.get('frequency'),
        next_due_date: formData.get('next_due_date'),
        category: formData.get('category'),
        user_id: parseInt(formData.get('user_id'))
    };

    try {
        if (AppState.isBackendOnline) {
            const response = await fetch(`${API_BASE_URL}/recurring-expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });

            if (response.ok) {
                const newExpense = await response.json();
                AppState.expenses.push(newExpense);
            } else {
                throw new Error('Erro ao salvar no backend');
            }
        } else {
            // Memory storage
            const newExpense = {
                id: Date.now(),
                ...expenseData,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            AppState.expenses.push(newExpense);
            saveDataToMemory();
        }

        renderExpenses();
        updateDashboard();
        closeModal('expense-modal');
        showNotification('Gasto recorrente criado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao criar gasto recorrente:', error);
        showNotification('Erro ao criar gasto recorrente', 'error');
    }
}

// Rendering functions
function renderAllData() {
    renderUsers();
    renderSubscriptions();
    renderExpenses();
}

function renderUsers() {
    const grid = document.getElementById('users-grid');
    
    if (AppState.users.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Nenhum usuário cadastrado</h3>
                <p>Clique em "Novo Usuário" para começar</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = AppState.users.map(user => `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">${user.username}</div>
                    <div class="card-subtitle">${user.email}</div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-meta">
                <span class="badge badge-success">Ativo</span>
                <small>ID: ${user.id}</small>
            </div>
        </div>
    `).join('');
}

function renderSubscriptions() {
    const grid = document.getElementById('subscriptions-grid');
    
    if (AppState.subscriptions.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sync-alt"></i>
                <h3>Nenhuma assinatura cadastrada</h3>
                <p>Clique em "Nova Assinatura" para começar</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = AppState.subscriptions.map(subscription => {
        const user = AppState.users.find(u => u.id === subscription.user_id);
        const userName = user ? user.username : 'Usuário não encontrado';
        
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">${subscription.name}</div>
                        <div class="card-subtitle">${subscription.description || 'Sem descrição'}</div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-danger" onclick="deleteSubscription(${subscription.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="price">R$ ${subscription.price.toFixed(2)}</div>
                    <p><strong>Ciclo:</strong> ${translateBillingCycle(subscription.billing_cycle)}</p>
                    <p><strong>Próxima cobrança:</strong> ${formatDate(subscription.next_billing_date)}</p>
                    <p><strong>Categoria:</strong> ${subscription.category || 'Sem categoria'}</p>
                    <p><strong>Usuário:</strong> ${userName}</p>
                </div>
                <div class="card-meta">
                    <span class="badge ${subscription.is_active ? 'badge-success' : 'badge-danger'}">
                        ${subscription.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function renderExpenses() {
    const grid = document.getElementById('expenses-grid');
    
    if (AppState.expenses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>Nenhum gasto recorrente cadastrado</h3>
                <p>Clique em "Novo Gasto" para começar</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = AppState.expenses.map(expense => {
        const user = AppState.users.find(u => u.id === expense.user_id);
        const userName = user ? user.username : 'Usuário não encontrado';
        
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">${expense.name}</div>
                        <div class="card-subtitle">${expense.description || 'Sem descrição'}</div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-danger" onclick="deleteExpense(${expense.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="price">R$ ${expense.amount.toFixed(2)}</div>
                    <p><strong>Frequência:</strong> ${translateFrequency(expense.frequency)}</p>
                    <p><strong>Próximo vencimento:</strong> ${formatDate(expense.next_due_date)}</p>
                    <p><strong>Categoria:</strong> ${expense.category || 'Sem categoria'}</p>
                    <p><strong>Usuário:</strong> ${userName}</p>
                </div>
                <div class="card-meta">
                    <span class="badge ${expense.is_active ? 'badge-success' : 'badge-danger'}">
                        ${expense.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Delete functions
async function deleteUser(userId) {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) {
        return;
    }

    try {
        if (AppState.isBackendOnline) {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao deletar no backend');
            }
        }

        AppState.users = AppState.users.filter(user => user.id !== userId);
        
        if (!AppState.isBackendOnline) {
            saveDataToMemory();
        }

        renderUsers();
        updateDashboard();
        showNotification('Usuário deletado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        showNotification('Erro ao deletar usuário', 'error');
    }
}

async function deleteSubscription(subscriptionId) {
    if (!confirm('Tem certeza que deseja deletar esta assinatura?')) {
        return;
    }

    try {
        if (AppState.isBackendOnline) {
            const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao deletar no backend');
            }
        }

        AppState.subscriptions = AppState.subscriptions.filter(sub => sub.id !== subscriptionId);
        
        if (!AppState.isBackendOnline) {
            saveDataToMemory();
        }

        renderSubscriptions();
        updateDashboard();
        showNotification('Assinatura deletada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao deletar assinatura:', error);
        showNotification('Erro ao deletar assinatura', 'error');
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Tem certeza que deseja deletar este gasto recorrente?')) {
        return;
    }

    try {
        if (AppState.isBackendOnline) {
            const response = await fetch(`${API_BASE_URL}/recurring-expenses/${expenseId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao deletar no backend');
            }
        }

        AppState.expenses = AppState.expenses.filter(expense => expense.id !== expenseId);
        
        if (!AppState.isBackendOnline) {
            saveDataToMemory();
        }

        renderExpenses();
        updateDashboard();
        showNotification('Gasto recorrente deletado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao deletar gasto recorrente:', error);
        showNotification('Erro ao deletar gasto recorrente', 'error');
    }
}

// Dashboard updates
function updateDashboard() {
    document.getElementById('total-users').textContent = AppState.users.length;
    document.getElementById('total-subscriptions').textContent = AppState.subscriptions.filter(s => s.is_active !== false).length;
    document.getElementById('total-expenses').textContent = AppState.expenses.filter(e => e.is_active !== false).length;
    
    // Calculate monthly total
    const monthlyTotal = calculateMonthlyTotal();
    document.getElementById('monthly-total').textContent = `R$ ${monthlyTotal.toFixed(2)}`;
}

function calculateMonthlyTotal() {
    let total = 0;
    
    // Add subscriptions
    AppState.subscriptions.forEach(sub => {
        if (sub.is_active !== false) {
            switch (sub.billing_cycle) {
                case 'monthly':
                    total += sub.price;
                    break;
                case 'yearly':
                    total += sub.price / 12;
                    break;
                case 'weekly':
                    total += sub.price * 4.33; // Average weeks per month
                    break;
            }
        }
    });
    
    // Add expenses
    AppState.expenses.forEach(expense => {
        if (expense.is_active !== false) {
            switch (expense.frequency) {
                case 'monthly':
                    total += expense.amount;
                    break;
                case 'yearly':
                    total += expense.amount / 12;
                    break;
                case 'weekly':
                    total += expense.amount * 4.33;
                    break;
                case 'daily':
                    total += expense.amount * 30;
                    break;
            }
        }
    });
    
    return total;
}

// Utility functions
function translateBillingCycle(cycle) {
    const translations = {
        'monthly': 'Mensal',
        'yearly': 'Anual',
        'weekly': 'Semanal'
    };
    return translations[cycle] || cycle;
}

function translateFrequency(frequency) {
    const translations = {
        'daily': 'Diário',
        'weekly': 'Semanal',
        'monthly': 'Mensal',
        'yearly': 'Anual'
    };
    return translations[frequency] || frequency;
}

function formatDate(dateString) {
    if (!dateString) return 'Data não definida';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

