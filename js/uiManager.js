// UI Manager Module
class UIManager {
    constructor() {
        this.activeModal = null;
        this.loadingVisible = false;
    }

    // Modal management
    showModal(modalId) {
        this.closeAllModals();
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            this.activeModal = modalId;
            
            // Focus first input if available
            setTimeout(() => {
                const firstInput = modal.querySelector('input, button');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('closing');
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('show', 'closing');
                if (this.activeModal === modalId) {
                    this.activeModal = null;
                }
            }, 300);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.style.display === 'flex' || modal.style.display === 'block') {
                this.closeModal(modal.id);
            }
        });
    }

    // Loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            this.loadingVisible = true;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            this.loadingVisible = false;
        }
    }

    // Notification system
    showNotification(title, message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Show with animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    // Confirmation dialog
    showConfirmDialog(title, message, onConfirm, onCancel = null) {
        const dialog = document.getElementById('confirmationDialog');
        const titleEl = document.getElementById('confirmationTitle');
        const messageEl = document.getElementById('confirmationMessage');
        const confirmBtn = document.getElementById('confirmButton');
        const cancelBtn = document.getElementById('cancelButton');
        
        if (!dialog || !titleEl || !messageEl || !confirmBtn || !cancelBtn) {
            console.error('Confirmation dialog elements not found');
            return;
        }
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        // Clear previous event listeners
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        
        confirmBtn.onclick = () => {
            dialog.style.display = 'none';
            if (onConfirm) onConfirm();
        };
        
        cancelBtn.onclick = () => {
            dialog.style.display = 'none';
            if (onCancel) onCancel();
        };
        
        dialog.style.display = 'flex';
    }

    // Game grid rendering
    renderGameGrid(games) {
        const gamesGrid = document.getElementById('gamesGrid');
        if (!gamesGrid) return;
        
        gamesGrid.innerHTML = '';

        if (games.length === 0) {
            this.renderEmptyState(gamesGrid);
        } else {
            games.forEach(game => {
                const gameCard = this.createGameCard(game);
                gamesGrid.appendChild(gameCard);
            });
        }
    }

    renderEmptyState(container) {
        container.innerHTML = `
            <div style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: #00ff00;
                font-family: 'Orbitron', monospace;
                font-size: 24px;
                border: 2px dashed #00ff00;
                border-radius: 10px;
                background: rgba(0, 255, 0, 0.05);
            ">
                <div style="margin-bottom: 20px; font-size: 48px;">🎮</div>
                <div style="margin-bottom: 10px; font-weight: bold;">GEEN GAMES GEVONDEN</div>
                <div style="font-size: 16px; opacity: 0.8;">
                    Ga naar het Admin Panel om games toe te voegen.
                </div>
            </div>
        `;
    }    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.gameId = game.id;
        
        const hasImage = game.image && game.image.trim() !== '';
        
        // Steam-like layout structure
        card.innerHTML = `
            <div class="game-card-image">
                ${hasImage ? 
                    `<img src="${game.image}" class="game-image" alt="${game.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="game-photo-placeholder" style="display: none;">NO IMAGE</div>` :
                    `<div class="game-photo-placeholder">NO IMAGE</div>`
                }
            </div>
            <div class="game-card-content">
                <div class="game-header">
                    <h3 class="game-title">${game.title}</h3>
                    <div class="game-author">${game.author || 'Unknown Developer'}</div>
                </div>
                <div class="game-description">${game.description || 'No description available for this game.'}</div>
                <div class="game-footer">
                    <span class="game-genre">${game.genre}</span>
                </div>
            </div>
        `;// Add event listeners
        card.addEventListener('click', async () => {
            if (window.gameManager && window.gameLauncher) {
                // Directly launch the game when clicked
                console.log('🎮 Game card clicked, launching:', game.title);
                
                // Add visual feedback - disable the card temporarily
                card.style.opacity = '0.6';
                card.style.pointerEvents = 'none';
                
                window.gameLauncher.selectedGame = game;
                window.gameManager.selectedGame = game;
                
                // Play click sound
                if (window.soundManager) window.soundManager.playClickSound();
                
                // Show launching notification
                if (window.uiManager) {
                    window.uiManager.showNotification(
                        'Game Starten',
                        `${game.title} wordt geladen...`,
                        'info',
                        2000
                    );
                }
                
                try {
                    // Launch the game directly
                    await window.gameLauncher.launchGame();
                } catch (error) {
                    console.error('Error launching game:', error);
                } finally {
                    // Re-enable the card
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.pointerEvents = 'auto';
                    }, 1000);
                }
            } else if (window.gameManager) {
                // Fallback for cases where gameLauncher isn't available
                window.gameManager.selectedGame = game;
                this.showGameModal(game);
            }
        });
        
        card.addEventListener('mouseenter', () => {
            if (window.soundManager) window.soundManager.playHoverSound();
        });
        
        return card;
    }

    showGameModal(game) {
        document.getElementById('gameTitle').textContent = game.title;
        document.getElementById('gameDescription').textContent = game.description;
        this.showModal('gameModal');
        if (window.soundManager) window.soundManager.playSelectSound();
    }
}

// Export for use in main renderer and testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}
