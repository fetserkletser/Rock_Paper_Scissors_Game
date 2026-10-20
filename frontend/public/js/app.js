const API_BASE_URL = '/api';
const appContainer = document.getElementById('app');
const navInfo = document.getElementById('nav-info');

// State management
let currentUser = null;
let token = localStorage.getItem('token');
let logInterval = null;

// Initialize app
async function init() {
    if (token) {
        try {
            await fetchCurrentUser();
            showDashboardView();
        } catch (err) {
            console.error('Failed to fetch user', err);
            logout();
        }
    } else {
        showLoginView();
    }
}

async function fetchCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unauthorized');
    currentUser = await response.json();
    updateNav();
}

function updateNav() {
    if (currentUser) {
        let adminBtn = '';
        if (currentUser.role === 'admin') {
            adminBtn = `<button onclick="showAdminView()" class="secondary" style="padding: 0.3rem 0.7rem; font-size: 0.8rem; margin-left: 1rem;">Admin Dashboard</button>`;
        }
        navInfo.innerHTML = `
            <span>Welcome, <strong>${currentUser.username}</strong> (${currentUser.role})</span>
            ${adminBtn}
            <button onclick="logout()" class="danger" style="padding: 0.3rem 0.7rem; font-size: 0.8rem; margin-left: 1rem;">Logout</button>
        `;
    } else {
        navInfo.innerHTML = '';
    }
}

function logout() {
    if (logInterval) clearInterval(logInterval);
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    updateNav();
    showLoginView();
}

// Views
function showLoginView() {
    appContainer.innerHTML = `
        <h2>[ TEST YOUR LUCK ]</h2>
        <div id="message"></div>
        <form id="login-form">
            <div class="form-group">
                <label for="username">Player Name</label>
                <input type="text" id="username" placeholder="ENTER INITIALS..." required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit">LOGIN PLAYER 1</button>
        </form>
        <a href="#" class="view-link" onclick="showRegisterView(); return false;">New Player? Register Here</a>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        await handleAuth('login', { username, password });
    });
}

function showRegisterView() {
    appContainer.innerHTML = `
        <h2>[ NEW CHALLENGER ]</h2>
        <div id="message"></div>
        <form id="register-form">
            <div class="form-group">
                <label for="username">Player Name</label>
                <input type="text" id="username" placeholder="CHOOSE INITIALS..." required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit">REGISTER PLAYER</button>
        </form>
        <a href="#" class="view-link" onclick="showLoginView(); return false;">Back to Login</a>
    `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        await handleAuth('register', { username, password });
    });
}

async function handleAuth(type, data) {
    const messageEl = document.getElementById('message');
    try {
        const response = await fetch(`${API_BASE_URL}/auth/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            token = result.token;
            localStorage.setItem('token', token);
            await fetchCurrentUser();
            showDashboardView();
        } else {
            messageEl.innerHTML = `<div class="error">SYSTEM ERROR: ${result.error || 'Authentication failed'}</div>`;
        }
    } catch (err) {
        messageEl.innerHTML = `<div class="error">LINK ERROR: ${err.message}</div>`;
    }
}

async function showDashboardView() {
    appContainer.innerHTML = `
        <h2>[ COMMAND CENTER ]</h2>
        <div id="dashboard-content">
            <div class="actions" id="game-actions">
                <button disabled>CONNECTING TO TOWER...</button>
            </div>
            <h3>[ HIGH SCORE TABLE ]</h3>
            <div id="leaderboard">UPDATING RANKINGS...</div>
        </div>
    `;

    checkActiveGame();
    fetchLeaderboard();
}

async function checkActiveGame() {
    const actionsEl = document.getElementById('game-actions');
    try {
        const response = await fetch(`${API_BASE_URL}/game/current`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const game = await response.json();
            if (game) {
                actionsEl.innerHTML = `
                    <button class="secondary" onclick="continueGame(${game.current_score})">RESUME ASCENT (SCORE: ${game.current_score})</button>
                    <button class="danger" onclick="quitGame()">ABANDON TOWER</button>
                `;
            } else {
                actionsEl.innerHTML = `<button onclick="startGame()">START ASCENT</button>`;
            }
        } else {
            actionsEl.innerHTML = `<div class="error">TOWER CONNECTION FAILED</div>`;
        }
    } catch (err) {
        actionsEl.innerHTML = `<div class="error">ERROR: ${err.message}</div>`;
    }
}

async function fetchLeaderboard() {
    const leaderboardEl = document.getElementById('leaderboard');
    try {
        const response = await fetch(`${API_BASE_URL}/game/leaderboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.length === 0) {
                leaderboardEl.innerHTML = '<p>THE TOWER IS UNCONQUERED. BE THE FIRST!</p>';
                return;
            }

            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>RANK</th>
                            <th>PLAYER</th>
                            <th>SCORE</th>
                            <th>DATE</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.forEach((entry, index) => {
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${entry.username}</td>
                        <td>${entry.current_score}</td>
                        <td>${new Date(entry.created_at).toLocaleDateString()}</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            leaderboardEl.innerHTML = html;
        } else {
            leaderboardEl.innerHTML = '<div class="error">DATA RETRIEVAL FAILED</div>';
        }
    } catch (err) {
        leaderboardEl.innerHTML = `<div class="error">ERROR: ${err.message}</div>`;
    }
}

// Game Logic and Views for Phase 6
async function startGame() {
    try {
        const response = await fetch(`${API_BASE_URL}/game/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const game = await response.json();
        if (response.ok) {
            showArenaView(game.current_score);
        } else {
            alert('SYSTEM ERROR: ' + (game.error || 'Unknown error'));
        }
    } catch (err) {
        alert('ERROR: ' + err.message);
    }
}

function continueGame(score) {
    showArenaView(score);
}

function showArenaView(score) {
    appContainer.innerHTML = `
        <div class="arena">
            <div class="arena-header">
                <h2>[ THE CLIMB ]</h2>
                <div class="current-score">ASCENSION LEVEL: <span id="arena-score">${score}</span></div>
            </div>
            
            <div id="round-display" class="round-display">
                <p>READY YOUR HAND... SELECT A MOVE!</p>
            </div>

            <div class="move-buttons">
                <button onclick="playRound('rock')">ROCK</button>
                <button onclick="playRound('paper')">PAPER</button>
                <button onclick="playRound('scissors')">SCISSORS</button>
            </div>

            <div class="arena-footer">
                <button class="secondary" onclick="showDashboardView()">SAVE & BANK SCORE</button>
            </div>
        </div>
    `;
}

async function playRound(move) {
    const roundDisplay = document.getElementById('round-display');
    const scoreEl = document.getElementById('arena-score');
    
    // Disable buttons during play
    const buttons = document.querySelectorAll('.move-buttons button');
    buttons.forEach(b => b.disabled = true);

    roundDisplay.innerHTML = `<p>YOU CHOSE <strong>${move.toUpperCase()}</strong>. CPU IS CALCULATING...</p>`;

    try {
        const response = await fetch(`${API_BASE_URL}/game/play`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ move })
        });

        const result = await response.json();

        if (response.ok) {
            let resultClass = '';
            let resultText = '';
            let resultImg = '';

            // Map result to image suffix
            const imgResultMap = {
                'win': 'win',
                'loss': 'loss',
                'draw': 'tie'
            };

            // Map user move to image prefix (handle scissors plural)
            const imgMovePrefix = result.userMove === 'scissors' ? 'scissor' : result.userMove;
            const imgPath = `rps_images/${imgMovePrefix}${imgResultMap[result.result]}.jpg`;

            if (result.result === 'win') {
                resultClass = 'result-win';
                resultText = 'VICTORY!';
                scoreEl.innerText = result.currentScore;
            } else if (result.result === 'loss') {
                resultClass = 'result-loss';
                resultText = 'DEFEATED!';
            } else {
                resultClass = 'result-draw';
                resultText = 'STALEMATE!';
            }

            roundDisplay.innerHTML = `
                <div class="${resultClass}">
                    <img src="${imgPath}" alt="${result.result}" class="combat-img">
                    <p>PLAYER: <strong>${result.userMove.toUpperCase()}</strong></p>
                    <p>CPU: <strong>${result.cpuMove.toUpperCase()}</strong></p>
                    <h3>${resultText}</h3>
                </div>
            `;

            if (result.status === 'finished') {
                setTimeout(() => {
                    showGameOverView(result.currentScore);
                }, 1500);
            } else {
                // Re-enable buttons
                buttons.forEach(b => b.disabled = false);
            }
        } else {
            roundDisplay.innerHTML = `<p class="error">${result.error || 'COMBAT ERROR'}</p>`;
            buttons.forEach(b => b.disabled = false);
        }
    } catch (err) {
        roundDisplay.innerHTML = `<p class="error">ERROR: ${err.message}</p>`;
        buttons.forEach(b => b.disabled = false);
    }
}

function showGameOverView(finalScore) {
    appContainer.innerHTML = `
        <div class="game-over">
            <h2>GAME OVER</h2>
            <p>FINAL SCORE: <strong>${finalScore}</strong></p>
            <div class="actions">
                <button onclick="startGame()">TEST YOUR LUCK, AGAIN!</button>
                <button class="secondary" onclick="showDashboardView()">BACK TO BASE</button>
            </div>
        </div>
    `;
}


async function quitGame() {
    if (!confirm('Are you sure?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/game/quit`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            checkActiveGame();
        } else {
            alert('Failed to quit game');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function showAdminView() {
    appContainer.innerHTML = `
        <div class="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <div class="admin-tabs">
                <button onclick="loadAdminTab('users')">Manage Users</button>
                <button onclick="loadAdminTab('games')">Manage Games</button>
                <button onclick="loadAdminTab('logs')">System Logs</button>
                <button class="secondary" onclick="showDashboardView()">Back to Player Dashboard</button>
            </div>
            <div id="admin-content" class="admin-content">
                <p>Select a tab to manage the system.</p>
            </div>
        </div>
    `;
}

async function loadAdminTab(tab) {
    const contentEl = document.getElementById('admin-content');
    contentEl.innerHTML = '<p>Loading...</p>';
    
    // Clear any existing polling
    if (logInterval) {
        clearInterval(logInterval);
        logInterval = null;
    }

    try {
        if (tab === 'users') {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await response.json();
            
            let html = '<h3>User Management</h3><table><thead><tr><th>Username</th><th>Role</th><th>Action</th></tr></thead><tbody>';
            users.forEach(u => {
                html += `<tr>
                    <td>${u.username}</td>
                    <td>${u.role}</td>
                    <td>${u.role !== 'admin' ? `<button class="danger" onclick="deleteUser('${u.id}')">Delete</button>` : 'N/A'}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            contentEl.innerHTML = html;

        } else if (tab === 'games') {
            const response = await fetch(`${API_BASE_URL}/admin/games`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const games = await response.json();
            
            let html = '<h3>Game History</h3><table><thead><tr><th>Player</th><th>Score</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>';
            games.forEach(g => {
                html += `<tr>
                    <td>${g.username}</td>
                    <td>${g.current_score}</td>
                    <td>${g.status}</td>
                    <td>${new Date(g.created_at).toLocaleString()}</td>
                    <td><button class="danger" onclick="deleteGame('${g.id}')">Delete</button></td>
                </tr>`;
            });
            html += '</tbody></table>';
            contentEl.innerHTML = html;

        } else if (tab === 'logs') {
            const fetchLogs = async () => {
                const response = await fetch(`${API_BASE_URL}/admin/logs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                
                let html = '<h3>Central Logs</h3><div class="log-viewer">';
                data.logs.forEach(line => {
                    let className = 'log-line';
                    if (line.includes('frontend')) className += ' log-frontend';
                    else if (line.includes('backend')) className += ' log-backend';
                    else if (line.includes('storage')) className += ' log-storage';
                    
                    html += `<div class="${className}">${line}</div>`;
                });
                html += '</div>';
                contentEl.innerHTML = html;
            };

            await fetchLogs(); // Initial load
            logInterval = setInterval(fetchLogs, 3000); // Poll every 3 seconds
        }
    } catch (err) {
        contentEl.innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure? This will delete the user and all their games.')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) loadAdminTab('users');
        else alert('Failed to delete user');
    } catch (err) { alert('Error: ' + err.message); }
}

async function deleteGame(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/admin/games/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) loadAdminTab('games');
        else alert('Failed to delete game');
    } catch (err) { alert('Error: ' + err.message); }
}

// Start the app
init();
