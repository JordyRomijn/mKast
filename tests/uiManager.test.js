// UIManager Tests
describe('UIManager', () => {
    let uiManager;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="gamesGrid"></div>
            <div id="notificationContainer"></div>
            <div id="confirmationDialog" style="display: none;">
                <div id="confirmationTitle"></div>
                <div id="confirmationMessage"></div>
                <button id="confirmButton">JA</button>
                <button id="cancelButton">NEE</button>
            </div>
            <div id="loadingScreen" style="display: none;"></div>
            <div id="testModal" class="modal" style="display: none;">
                <div class="modal-content">Test Modal</div>
            </div>
        `;

        // Load the UIManager class
        require('../js/uiManager.js');
        uiManager = new UIManager();
    });

    describe('Initialization', () => {
        test('should initialize with default state', () => {
            expect(uiManager.activeModal).toBeNull();
            expect(uiManager.loadingVisible).toBe(false);
        });
    });

    describe('Modal Management', () => {
        test('should show modal correctly', () => {
            uiManager.showModal('testModal');

            const modal = document.getElementById('testModal');
            expect(modal.style.display).toBe('flex');
            expect(modal.classList.contains('show')).toBe(true);
            expect(uiManager.activeModal).toBe('testModal');
        });

        test('should close modal correctly', () => {
            // First show the modal
            uiManager.showModal('testModal');
            
            // Then close it
            uiManager.closeModal('testModal');

            const modal = document.getElementById('testModal');
            expect(modal.classList.contains('closing')).toBe(true);
            expect(uiManager.activeModal).toBe('testModal'); // Still active during animation

            // Simulate animation completion
            setTimeout(() => {
                expect(modal.style.display).toBe('none');
                expect(modal.classList.contains('show')).toBe(false);
                expect(modal.classList.contains('closing')).toBe(false);
                expect(uiManager.activeModal).toBeNull();
            }, 300);
        });

        test('should close all modals', () => {
            // Create multiple modals
            document.body.innerHTML += `
                <div id="modal1" class="modal" style="display: flex;">Content 1</div>
                <div id="modal2" class="modal" style="display: block;">Content 2</div>
            `;

            uiManager.closeAllModals();

            const modal1 = document.getElementById('modal1');
            const modal2 = document.getElementById('modal2');
            
            expect(modal1.classList.contains('closing')).toBe(true);
            expect(modal2.classList.contains('closing')).toBe(true);
        });
    });

    describe('Loading Screen', () => {
        test('should show loading screen', () => {
            uiManager.showLoadingScreen();

            const loadingScreen = document.getElementById('loadingScreen');
            expect(loadingScreen.style.display).toBe('flex');
            expect(uiManager.loadingVisible).toBe(true);
        });

        test('should hide loading screen', () => {
            // First show it
            uiManager.showLoadingScreen();
            
            // Then hide it
            uiManager.hideLoadingScreen();

            const loadingScreen = document.getElementById('loadingScreen');
            expect(loadingScreen.style.display).toBe('none');
            expect(uiManager.loadingVisible).toBe(false);
        });
    });

    describe('Notification System', () => {
        test('should create notification correctly', () => {
            uiManager.showNotification('Test Title', 'Test Message', 'info', 1000);

            const container = document.getElementById('notificationContainer');
            const notification = container.querySelector('.notification');
            
            expect(notification).toBeTruthy();
            expect(notification.classList.contains('info')).toBe(true);
            expect(notification.querySelector('.notification-title').textContent).toBe('Test Title');
            expect(notification.querySelector('.notification-message').textContent).toBe('Test Message');
        });

        test('should handle missing notification container', () => {
            document.getElementById('notificationContainer').remove();
            
            // Should not throw error
            expect(() => {
                uiManager.showNotification('Test', 'Test');
            }).not.toThrow();
        });

        test('should auto-remove notification after duration', (done) => {
            uiManager.showNotification('Test', 'Test', 'info', 100);

            const container = document.getElementById('notificationContainer');
            
            setTimeout(() => {
                const notification = container.querySelector('.notification');
                expect(notification.classList.contains('show')).toBe(false);
                done();
            }, 200);
        });
    });

    describe('Confirmation Dialog', () => {
        test('should show confirmation dialog', () => {
            const onConfirm = jest.fn();
            const onCancel = jest.fn();

            uiManager.showConfirmDialog('Test Title', 'Test Message', onConfirm, onCancel);

            const dialog = document.getElementById('confirmationDialog');
            const title = document.getElementById('confirmationTitle');
            const message = document.getElementById('confirmationMessage');

            expect(dialog.style.display).toBe('flex');
            expect(title.textContent).toBe('Test Title');
            expect(message.textContent).toBe('Test Message');
        });

        test('should handle confirm button click', () => {
            const onConfirm = jest.fn();
            
            uiManager.showConfirmDialog('Test', 'Test', onConfirm);

            const confirmBtn = document.getElementById('confirmButton');
            confirmBtn.click();

            expect(onConfirm).toHaveBeenCalled();
        });

        test('should handle cancel button click', () => {
            const onCancel = jest.fn();
            
            uiManager.showConfirmDialog('Test', 'Test', null, onCancel);

            const cancelBtn = document.getElementById('cancelButton');
            cancelBtn.click();

            expect(onCancel).toHaveBeenCalled();
        });

        test('should handle missing dialog elements', () => {
            document.getElementById('confirmationDialog').remove();
            
            // Should not throw error
            expect(() => {
                uiManager.showConfirmDialog('Test', 'Test', jest.fn());
            }).not.toThrow();
        });
    });

    describe('Game Grid Rendering', () => {
        test('should render games correctly', () => {
            const games = [
                { id: 1, title: 'Game 1', genre: 'ARCADE', image: 'game1.jpg' },
                { id: 2, title: 'Game 2', genre: 'PUZZLE', image: '' }
            ];

            uiManager.renderGameGrid(games);

            const grid = document.getElementById('gamesGrid');
            const gameCards = grid.querySelectorAll('.game-card');

            expect(gameCards).toHaveLength(2);
            expect(gameCards[0].dataset.gameId).toBe('1');
            expect(gameCards[1].dataset.gameId).toBe('2');
        });

        test('should render empty state when no games', () => {
            uiManager.renderGameGrid([]);

            const grid = document.getElementById('gamesGrid');
            expect(grid.innerHTML).toContain('GEEN GAMES GEVONDEN');
        });

        test('should handle missing games grid element', () => {
            document.getElementById('gamesGrid').remove();
            
            // Should not throw error
            expect(() => {
                uiManager.renderGameGrid([]);
            }).not.toThrow();
        });
    });

    describe('Game Card Creation', () => {
        test('should create game card with image', () => {
            const game = {
                id: 1,
                title: 'Test Game',
                genre: 'ARCADE',
                image: 'test.jpg'
            };

            const card = uiManager.createGameCard(game);

            expect(card.classList.contains('game-card')).toBe(true);
            expect(card.dataset.gameId).toBe('1');
            expect(card.querySelector('.game-title').textContent).toBe('Test Game');
            expect(card.querySelector('.game-genre').textContent).toBe('ARCADE');
            expect(card.querySelector('.game-image')).toBeTruthy();
        });

        test('should create game card without image', () => {
            const game = {
                id: 2,
                title: 'Test Game 2',
                genre: 'PUZZLE',
                image: ''
            };

            const card = uiManager.createGameCard(game);

            expect(card.querySelector('.game-photo-placeholder')).toBeTruthy();
            expect(card.querySelector('.game-image')).toBeFalsy();
        });

        test('should handle image load errors', () => {
            const game = {
                id: 1,
                title: 'Test Game',
                genre: 'ARCADE',
                image: 'broken.jpg'
            };

            const card = uiManager.createGameCard(game);
            const img = card.querySelector('.game-image');
            
            // Simulate image error
            img.onerror();

            expect(img.style.display).toBe('none');
        });
    });

    describe('Game Modal', () => {
        beforeEach(() => {
            document.body.innerHTML += `
                <div id="gameModal" class="modal" style="display: none;">
                    <div id="gameTitle"></div>
                    <div id="gameDescription"></div>
                </div>
            `;
        });

        test('should show game modal with correct data', () => {
            // Mock sound manager
            window.soundManager = {
                playSelectSound: jest.fn()
            };

            const game = {
                title: 'Test Game',
                description: 'Test Description'
            };

            uiManager.showGameModal(game);

            expect(document.getElementById('gameTitle').textContent).toBe('Test Game');
            expect(document.getElementById('gameDescription').textContent).toBe('Test Description');
            expect(window.soundManager.playSelectSound).toHaveBeenCalled();
        });
    });
});
