// Admin Panel Manager Module
class AdminPanelManager {
    constructor() {
        this.currentEditingGameId = null;
        this.isAdminMode = false;
    }

    // Initialize admin panel
    initialize(gameManager, uiManager, soundManager, config) {
        this.gameManager = gameManager;
        this.uiManager = uiManager;
        this.soundManager = soundManager;
        this.config = config;
    }

    // Verify admin password
    async verifyAdminPassword() {
        const passwordField = document.getElementById('adminPassword');
        const password = passwordField.value;
        
        try {
            const isValid = await ipcRenderer.invoke('verify-admin-password', password);
            
            if (isValid) {
                this.uiManager.closeModal('passwordModal');
                this.uiManager.showModal('adminModal');
                this.isAdminMode = true;
                this.loadAdminPanel();
                this.soundManager.playSuccessSound();
            } else {
                this.soundManager.playErrorSound();
                passwordField.value = '';
                passwordField.focus();
                
                const errorMsg = document.createElement('div');
                errorMsg.textContent = 'Onjuist wachtwoord!';
                errorMsg.style.color = '#ff0080';
                errorMsg.style.marginTop = '10px';
                passwordField.parentNode.appendChild(errorMsg);
                
                setTimeout(() => {
                    if (errorMsg.parentNode) {
                        errorMsg.remove();
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('VerifyAdminPassword error:', error);
            passwordField.value = '';
            passwordField.focus();
        }
    }

    // Load admin panel data
    loadAdminPanel() {
        this.showAdminSection('games');
        this.loadAdminGamesList();
        this.loadAdminStats();
        this.loadCursorSettings();
    }

    // Show different admin sections
    showAdminSection(section) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.style.display = 'none';
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected section
        const sectionElement = document.getElementById(`admin${section.charAt(0).toUpperCase() + section.slice(1)}`);
        if (sectionElement) {
            sectionElement.style.display = 'block';
        }
        
        // Add active class to clicked button (need to find the button that was clicked)
        const activeButton = document.querySelector(`[onclick*="${section}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    // Load games list in admin panel
    loadAdminGamesList() {
        const gamesList = document.getElementById('adminGamesList');
        if (!gamesList) return;
        
        gamesList.innerHTML = '';
        const games = this.gameManager.getAllGames();
        
        if (games.length === 0) {
            gamesList.innerHTML = `
                <div style="
                    text-align: center;
                    padding: 40px 20px;
                    color: #00ff00;
                    font-family: 'Orbitron', monospace;
                    border: 2px dashed #00ff00;
                    border-radius: 10px;
                    background: rgba(0, 255, 0, 0.05);
                ">
                    <div style="font-size: 24px; margin-bottom: 15px;">📱</div>
                    <div style="font-weight: bold; margin-bottom: 10px;">GEEN GAMES BESCHIKBAAR</div>
                    <div style="font-size: 14px; opacity: 0.8;">
                        Klik op "NIEUWE GAME TOEVOEGEN" om te beginnen.
                    </div>
                </div>
            `;
        } else {
            games.forEach(game => {
                const gameItem = document.createElement('div');
                gameItem.className = 'admin-game-item';
                gameItem.innerHTML = `
                    <div class="admin-game-info">
                        <div class="admin-game-title">${game.title}</div>
                        <div class="admin-game-details">${game.genre} | ${game.executable}</div>
                    </div>
                    <div class="admin-game-actions">
                        <button class="retro-btn small" onclick="window.adminPanel.editGame(${game.id})">BEWERKEN</button>
                        <button class="retro-btn small danger" onclick="window.adminPanel.deleteGame(${game.id})">VERWIJDEREN</button>
                    </div>
                `;
                gamesList.appendChild(gameItem);
            });
        }
    }

    // Show add game form
    showAddGameForm() {
        this.uiManager.showModal('addGameModal');
        
        setTimeout(() => {
            const titleField = document.getElementById('newGameTitle');
            if (titleField) {
                titleField.focus();
                titleField.select();
            }
        }, 150);
    }    // Add new game
    addNewGame() {
        const title = document.getElementById('newGameTitle').value.trim();
        const author = document.getElementById('newGameAuthor').value.trim();
        const description = document.getElementById('newGameDescription').value.trim();
        const genre = document.getElementById('newGameGenre').value;
        const type = document.getElementById('newGameType').value;
        const executable = document.getElementById('newGameExecutable').value.trim();
        const image = document.getElementById('newGameImage').value.trim();
        
        if (!title || !description || !genre || !type || !executable) {
            this.uiManager.showNotification(
                'Validatie Fout',
                'Vul alle verplichte velden in.',
                'error',
                3000
            );
            return;
        }
        
        const gameData = {
            title,
            author: author || 'Unknown Developer',
            description,
            genre,
            type,
            executable,
            image
        };
        
        const newGame = this.gameManager.addGame(gameData);
        this.refreshGamesList();
        this.closeAddGameModal();
        
        this.uiManager.showNotification(
            'Game Toegevoegd',
            `"${title}" is succesvol toegevoegd!`,
            'success',
            3000
        );
        this.soundManager.playSuccessSound();
    }    // Edit game
    editGame(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (game) {
            this.currentEditingGameId = gameId;
            
            // Fill the edit form with current game data
            document.getElementById('editGameTitle').value = game.title;
            document.getElementById('editGameAuthor').value = game.author || 'Unknown Developer';
            document.getElementById('editGameDescription').value = game.description;
            document.getElementById('editGameGenre').value = game.genre;
            document.getElementById('editGameType').value = game.type || 'executable';
            document.getElementById('editGameExecutable').value = game.executable;
            document.getElementById('editGameImage').value = game.image || '';
            
            this.uiManager.showModal('editGameModal');
        }
    }    // Save edited game
    saveEditedGame() {
        if (!this.currentEditingGameId) return;
        
        const title = document.getElementById('editGameTitle').value.trim();
        const author = document.getElementById('editGameAuthor').value.trim();
        const description = document.getElementById('editGameDescription').value.trim();
        const genre = document.getElementById('editGameGenre').value;
        const type = document.getElementById('editGameType').value;
        const executable = document.getElementById('editGameExecutable').value.trim();
        const image = document.getElementById('editGameImage').value.trim();
        
        if (!title || !description || !genre || !type || !executable) {
            this.uiManager.showNotification(
                'Validatie Fout',
                'Vul alle verplichte velden in.',
                'error',
                3000
            );
            return;
        }
        
        const gameData = {
            title,
            author: author || 'Unknown Developer',
            description,
            genre,
            type,
            executable,
            image: image || ''
        };
        
        const updatedGame = this.gameManager.updateGame(this.currentEditingGameId, gameData);
        if (updatedGame) {
            this.refreshGamesList();
            this.closeEditGameModal();
            
            this.uiManager.showNotification(
                'Game Bijgewerkt',
                `"${title}" is succesvol bijgewerkt.`,
                'success',
                3000
            );
            this.soundManager.playSuccessSound();
        }
    }

    // Delete game
    deleteGame(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (game) {
            this.uiManager.showConfirmDialog(
                'Game Verwijderen',
                `Weet je zeker dat je "${game.title}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`,
                () => {
                    if (this.gameManager.deleteGame(gameId)) {
                        this.refreshGamesList();
                        this.uiManager.showNotification(
                            'Game Verwijderd',
                            `"${game.title}" is succesvol verwijderd.`,
                            'success',
                            4000
                        );
                        this.soundManager.playSuccessSound();
                    }
                }
            );
        }
    }

    // Clear all games
    clearAllGames() {
        this.uiManager.showConfirmDialog(
            'Alle Games Verwijderen',
            'Weet je zeker dat je ALLE games wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
            () => {
                this.gameManager.clearAllGames();
                this.refreshGamesList();
                this.uiManager.showNotification(
                    'Games Gewist',
                    'Alle games zijn succesvol verwijderd.',
                    'success',
                    4000
                );
            }
        );
    }

    // File browser functions
    async browseForExecutable() {
        try {
            const result = await ipcRenderer.invoke('browse-for-file', 'executable');
            if (result && result.path) {
                document.getElementById('newGameExecutable').value = result.path;
                
                if (result.warning) {
                    this.uiManager.showNotification(
                        'Let Op',
                        result.warning,
                        'warning',
                        5000
                    );
                }
                
                // Auto-fill title if empty
                const titleField = document.getElementById('newGameTitle');
                if (!titleField.value.trim()) {
                    const fileName = result.path.split('\\').pop().split('/').pop();
                    const baseName = fileName.replace(/\.[^/.]+$/, "");
                    titleField.value = baseName.toUpperCase().replace(/[_-]/g, ' ');
                }
            }
        } catch (error) {
            console.error('BrowseForExecutable error:', error);
            this.uiManager.showNotification(
                'Fout',
                'Er is een fout opgetreden bij het selecteren van een bestand.',
                'error',
                3000
            );
        }
    }

    async browseForImage() {
        try {
            const result = await ipcRenderer.invoke('browse-for-file', 'image');
            if (result && result.path) {
                document.getElementById('newGameImage').value = result.path;
            }
        } catch (error) {
            console.error('BrowseForImage error:', error);
            this.uiManager.showNotification(
                'Fout',
                'Er is een fout opgetreden bij het selecteren van een afbeelding.',
                'error',
                3000
            );
        }
    }

    async browseForEditExecutable() {
        try {
            const result = await ipcRenderer.invoke('browse-for-file', 'executable');
            if (result && result.path) {
                document.getElementById('editGameExecutable').value = result.path;
                
                if (result.warning) {
                    this.uiManager.showNotification(
                        'Let Op',
                        result.warning,
                        'warning',
                        5000
                    );
                }
            }
        } catch (error) {
            console.error('BrowseForEditExecutable error:', error);
            this.uiManager.showNotification(
                'Fout',
                'Er is een fout opgetreden bij het selecteren van een bestand.',
                'error',
                3000
            );
        }
    }

    async browseForEditImage() {
        try {
            const result = await ipcRenderer.invoke('browse-for-file', 'image');
            if (result && result.path) {
                document.getElementById('editGameImage').value = result.path;
            }
        } catch (error) {
            console.error('BrowseForEditImage error:', error);
            this.uiManager.showNotification(
                'Fout',
                'Er is een fout opgetreden bij het selecteren van een afbeelding.',
                'error',
                3000
            );
        }
    }

    // Load admin statistics
    loadAdminStats() {
        const statsContent = document.getElementById('statsContent');
        if (!statsContent) return;
        
        const games = this.gameManager.getAllGames();
        const stats = {
            totalGames: games.length,
            totalGenres: [...new Set(games.map(g => g.genre))].length,
            lastUpdated: new Date().toLocaleDateString('nl-NL'),
            systemUptime: this.formatUptime()
        };
        
        statsContent.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.totalGames}</div>
                <div class="stat-label">Totaal Games</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalGenres}</div>
                <div class="stat-label">Genres</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.lastUpdated}</div>
                <div class="stat-label">Laatst Bijgewerkt</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.systemUptime}</div>
                <div class="stat-label">Systeem Uptime</div>
            </div>
        `;
    }

    // Helper methods
    formatUptime() {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    loadCursorSettings() {
        if (this.config && this.config.display && this.config.display.cursorMode) {
            this.applyCursorMode(this.config.display.cursorMode);
            const cursorSelect = document.getElementById('cursorModeSetting');
            if (cursorSelect) {
                cursorSelect.value = this.config.display.cursorMode;
            }
        }
    }

    applyCursorMode(mode) {
        const body = document.body;
        body.classList.remove('cursor-auto', 'cursor-none', 'cursor-hidden');
        
        switch (mode) {
            case 'auto':
                body.classList.add('cursor-auto');
                break;
            case 'none':
                body.classList.add('cursor-none');
                break;
            case 'hidden':
                body.classList.add('cursor-hidden');
                break;
        }
    }

    refreshGamesList() {
        this.loadAdminGamesList();
        // Also refresh the main game grid
        if (window.gameManager && window.uiManager) {
            window.uiManager.renderGameGrid(window.gameManager.getAllGames());
        }
    }

    closeEditGameModal() {
        this.uiManager.closeModal('editGameModal');
        this.currentEditingGameId = null;
        
        const form = document.getElementById('editGameForm');
        if (form) form.reset();
    }

    closeAddGameModal() {
        this.uiManager.closeModal('addGameModal');
        const form = document.getElementById('addGameForm');
        if (form) form.reset();
    }

    closeAdmin() {
        this.uiManager.closeModal('adminModal');
        this.isAdminMode = false;
    }
}

// Export for use in main renderer and testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanelManager;
} else {
    window.AdminPanelManager = AdminPanelManager;
}
