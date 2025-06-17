/**
 * AdminPanelManager Test Suite
 * Tests for admin panel functionality and authentication
 */

const { ipcRenderer } = require('electron');

// Mock Electron IPC
jest.mock('electron', () => ({
    ipcRenderer: {
        invoke: jest.fn(),
        send: jest.fn()
    }
}));

// Import the AdminPanelManager
const AdminPanelManager = require('../js/adminPanelManager');

describe('AdminPanelManager', () => {
    let adminPanel;
    let mockUiManager;
    let mockGameManager;
    let mockSoundManager;
    let mockLogError;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock dependencies
        mockUiManager = {
            showNotification: jest.fn(),
            showModal: jest.fn(),
            hideModal: jest.fn(),
            refreshGameGrid: jest.fn()
        };
        
        mockGameManager = {
            getAllGames: jest.fn().mockReturnValue([]),
            addGame: jest.fn(),
            updateGame: jest.fn(),
            deleteGame: jest.fn(),
            exportGames: jest.fn(),
            importGames: jest.fn()
        };
        
        mockSoundManager = {
            playSound: jest.fn(),
            setVolume: jest.fn(),
            toggleEnabled: jest.fn()
        };
        
        mockLogError = jest.fn();
        global.logError = mockLogError;
        
        // Mock DOM elements
        const mockElements = {
            adminPanel: { style: { display: 'none' } },
            adminPasswordInput: { value: '', focus: jest.fn() },
            adminLoginBtn: { addEventListener: jest.fn() },
            adminCloseBtn: { addEventListener: jest.fn() },
            adminLogoutBtn: { addEventListener: jest.fn() },
            gameListContainer: { innerHTML: '' },
            importGamesInput: { addEventListener: jest.fn(), click: jest.fn() },
            exportGamesBtn: { addEventListener: jest.fn() },
            settingsForm: { addEventListener: jest.fn() }
        };
        
        global.document = {
            getElementById: jest.fn().mockImplementation(id => mockElements[id] || null),
            addEventListener: jest.fn(),
            createElement: jest.fn().mockReturnValue({
                className: '',
                innerHTML: '',
                addEventListener: jest.fn(),
                appendChild: jest.fn()
            })
        };
        
        adminPanel = new AdminPanelManager();
        adminPanel.initialize(mockUiManager, mockGameManager, mockSoundManager);
    });

    describe('Initialization', () => {
        test('should initialize with dependencies', () => {
            expect(adminPanel.uiManager).toBe(mockUiManager);
            expect(adminPanel.gameManager).toBe(mockGameManager);
            expect(adminPanel.soundManager).toBe(mockSoundManager);
            expect(adminPanel.isAuthenticated).toBe(false);
            expect(adminPanel.isVisible).toBe(false);
        });

        test('should setup event listeners', () => {
            const mockBtn = { addEventListener: jest.fn() };
            global.document.getElementById.mockReturnValue(mockBtn);
            
            adminPanel.setupEventListeners();

            expect(mockBtn.addEventListener).toHaveBeenCalled();
        });
    });

    describe('showPanel', () => {
        test('should show login form when not authenticated', () => {
            adminPanel.showPanel();

            expect(mockUiManager.showModal).toHaveBeenCalledWith('adminPanel');
            expect(adminPanel.isVisible).toBe(true);
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('modalOpen');
        });

        test('should show admin interface when authenticated', () => {
            adminPanel.isAuthenticated = true;
            
            adminPanel.showPanel();

            expect(mockUiManager.showModal).toHaveBeenCalledWith('adminPanel');
            expect(adminPanel.isVisible).toBe(true);
        });
    });

    describe('hidePanel', () => {
        test('should hide admin panel', () => {
            adminPanel.isVisible = true;
            
            adminPanel.hidePanel();

            expect(mockUiManager.hideModal).toHaveBeenCalledWith('adminPanel');
            expect(adminPanel.isVisible).toBe(false);
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('modalClose');
        });
    });

    describe('authenticate', () => {
        beforeEach(() => {
            global.config = {
                adminPassword: 'testpassword'
            };
        });

        test('should authenticate with correct password', async () => {
            const mockPasswordInput = { value: 'testpassword' };
            global.document.getElementById.mockReturnValue(mockPasswordInput);
            
            await adminPanel.authenticate();

            expect(adminPanel.isAuthenticated).toBe(true);
            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Inloggen Gelukt',
                expect.any(String),
                'success'
            );
        });

        test('should reject incorrect password', async () => {
            const mockPasswordInput = { value: 'wrongpassword' };
            global.document.getElementById.mockReturnValue(mockPasswordInput);
            
            await adminPanel.authenticate();

            expect(adminPanel.isAuthenticated).toBe(false);
            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Fout Wachtwoord',
                expect.any(String),
                'error'
            );
        });

        test('should handle empty password', async () => {
            const mockPasswordInput = { value: '' };
            global.document.getElementById.mockReturnValue(mockPasswordInput);
            
            await adminPanel.authenticate();

            expect(adminPanel.isAuthenticated).toBe(false);
            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Wachtwoord Vereist',
                expect.any(String),
                'warning'
            );
        });

        test('should handle authentication errors', async () => {
            global.config = null; // Simulate missing config
            
            await adminPanel.authenticate();

            expect(adminPanel.isAuthenticated).toBe(false);
            expect(mockLogError).toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        test('should logout and clear authentication', () => {
            adminPanel.isAuthenticated = true;
            
            adminPanel.logout();

            expect(adminPanel.isAuthenticated).toBe(false);
            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Uitgelogd',
                expect.any(String),
                'info'
            );
        });
    });

    describe('loadGameList', () => {
        test('should load and display game list', () => {
            const mockGames = [
                { id: 'game1', name: 'Test Game 1', path: 'games/test1' },
                { id: 'game2', name: 'Test Game 2', path: 'games/test2' }
            ];
            
            mockGameManager.getAllGames.mockReturnValue(mockGames);
            
            const mockContainer = { innerHTML: '' };
            global.document.getElementById.mockReturnValue(mockContainer);
            
            adminPanel.loadGameList();

            expect(mockContainer.innerHTML).toContain('Test Game 1');
            expect(mockContainer.innerHTML).toContain('Test Game 2');
        });

        test('should handle empty game list', () => {
            mockGameManager.getAllGames.mockReturnValue([]);
            
            const mockContainer = { innerHTML: '' };
            global.document.getElementById.mockReturnValue(mockContainer);
            
            adminPanel.loadGameList();

            expect(mockContainer.innerHTML).toContain('Geen games gevonden');
        });

        test('should handle game list errors', () => {
            mockGameManager.getAllGames.mockImplementation(() => {
                throw new Error('Failed to load games');
            });
            
            adminPanel.loadGameList();

            expect(mockLogError).toHaveBeenCalledWith(
                'AdminPanelManager',
                expect.any(Error)
            );
        });
    });

    describe('editGame', () => {
        test('should populate form with game data', () => {
            const mockGame = {
                id: 'test-game',
                name: 'Test Game',
                path: 'games/test',
                description: 'Test description'
            };
            
            const mockElements = {
                editGameId: { value: '' },
                editGameName: { value: '' },
                editGamePath: { value: '' },
                editGameDescription: { value: '' }
            };
            
            global.document.getElementById.mockImplementation(id => mockElements[id] || null);
            
            adminPanel.editGame(mockGame);

            expect(mockElements.editGameId.value).toBe('test-game');
            expect(mockElements.editGameName.value).toBe('Test Game');
            expect(mockElements.editGamePath.value).toBe('games/test');
            expect(mockElements.editGameDescription.value).toBe('Test description');
            expect(mockUiManager.showModal).toHaveBeenCalledWith('editGameModal');
        });

        test('should handle missing form elements', () => {
            global.document.getElementById.mockReturnValue(null);
            
            const mockGame = { id: 'test' };
            adminPanel.editGame(mockGame);

            expect(mockLogError).toHaveBeenCalled();
        });
    });

    describe('deleteGame', () => {
        test('should delete game with confirmation', () => {
            global.confirm = jest.fn().mockReturnValue(true);
            
            adminPanel.deleteGame('test-game');

            expect(mockGameManager.deleteGame).toHaveBeenCalledWith('test-game');
            expect(mockUiManager.refreshGameGrid).toHaveBeenCalled();
            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Game Verwijderd',
                expect.any(String),
                'success'
            );
        });

        test('should cancel deletion when not confirmed', () => {
            global.confirm = jest.fn().mockReturnValue(false);
            
            adminPanel.deleteGame('test-game');

            expect(mockGameManager.deleteGame).not.toHaveBeenCalled();
        });

        test('should handle deletion errors', () => {
            global.confirm = jest.fn().mockReturnValue(true);
            mockGameManager.deleteGame.mockImplementation(() => {
                throw new Error('Delete failed');
            });
            
            adminPanel.deleteGame('test-game');

            expect(mockLogError).toHaveBeenCalledWith(
                'AdminPanelManager',
                expect.any(Error),
                expect.objectContaining({ gameId: 'test-game' })
            );
        });
    });

    describe('saveGame', () => {
        beforeEach(() => {
            const mockElements = {
                editGameId: { value: 'test-game' },
                editGameName: { value: 'Updated Game' },
                editGamePath: { value: 'games/updated' },
                editGameDescription: { value: 'Updated description' },
                editGameIcon: { value: 'icon.png' }
            };
            
            global.document.getElementById.mockImplementation(id => mockElements[id] || { value: '' });
        });

        test('should save game updates', () => {
            adminPanel.saveGame();

            expect(mockGameManager.updateGame).toHaveBeenCalledWith('test-game', {
                name: 'Updated Game',
                path: 'games/updated',
                description: 'Updated description',
                icon: 'icon.png'
            });
            expect(mockUiManager.hideModal).toHaveBeenCalledWith('editGameModal');
            expect(mockUiManager.refreshGameGrid).toHaveBeenCalled();
        });

        test('should handle missing game name', () => {
            global.document.getElementById.mockImplementation(id => {
                if (id === 'editGameName') return { value: '' };
                return { value: 'test' };
            });
            
            adminPanel.saveGame();

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Validatie Fout',
                'Game naam is verplicht',
                'error'
            );
        });

        test('should handle missing game path', () => {
            global.document.getElementById.mockImplementation(id => {
                if (id === 'editGamePath') return { value: '' };
                return { value: 'test' };
            });
            
            adminPanel.saveGame();

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Validatie Fout',
                'Game pad is verplicht',
                'error'
            );
        });

        test('should handle save errors', () => {
            mockGameManager.updateGame.mockImplementation(() => {
                throw new Error('Save failed');
            });
            
            adminPanel.saveGame();

            expect(mockLogError).toHaveBeenCalledWith(
                'AdminPanelManager',
                expect.any(Error)
            );
        });
    });

    describe('exportGames', () => {
        test('should export games successfully', async () => {
            ipcRenderer.invoke.mockResolvedValueOnce({ success: true, path: 'export.json' });
            
            await adminPanel.exportGames();

            expect(ipcRenderer.invoke).toHaveBeenCalledWith('exportGames');
            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Export Gelukt',
                expect.stringContaining('export.json'),
                'success'
            );
        });

        test('should handle export cancellation', async () => {
            ipcRenderer.invoke.mockResolvedValueOnce({ success: false, cancelled: true });
            
            await adminPanel.exportGames();

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Export Geannuleerd',
                expect.any(String),
                'info'
            );
        });

        test('should handle export errors', async () => {
            ipcRenderer.invoke.mockResolvedValueOnce({ 
                success: false, 
                error: 'Export failed' 
            });
            
            await adminPanel.exportGames();

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Export Fout',
                expect.stringContaining('Export failed'),
                'error'
            );
        });
    });

    describe('importGames', () => {
        test('should import games successfully', async () => {
            const mockFile = { path: 'import.json' };
            const mockInput = { files: [mockFile] };
            
            global.document.getElementById.mockReturnValue(mockInput);
            ipcRenderer.invoke.mockResolvedValueOnce({ 
                success: true, 
                importedCount: 5 
            });
            
            await adminPanel.importGames();

            expect(ipcRenderer.invoke).toHaveBeenCalledWith('importGames', 'import.json');
            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Import Gelukt',
                expect.stringContaining('5'),
                'success'
            );
        });

        test('should handle no file selected', async () => {
            const mockInput = { files: [] };
            global.document.getElementById.mockReturnValue(mockInput);
            
            await adminPanel.importGames();

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Geen Bestand',
                expect.any(String),
                'warning'
            );
        });

        test('should handle import errors', async () => {
            const mockFile = { path: 'import.json' };
            const mockInput = { files: [mockFile] };
            
            global.document.getElementById.mockReturnValue(mockInput);
            ipcRenderer.invoke.mockResolvedValueOnce({ 
                success: false, 
                error: 'Invalid file format' 
            });
            
            await adminPanel.importGames();

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Import Fout',
                expect.stringContaining('Invalid file format'),
                'error'
            );
        });
    });

    describe('saveSettings', () => {
        test('should save volume settings', () => {
            const mockVolumeInput = { value: '0.8' };
            global.document.getElementById.mockReturnValue(mockVolumeInput);
            
            adminPanel.saveSettings();

            expect(mockSoundManager.setVolume).toHaveBeenCalledWith(0.8);
            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Instellingen Opgeslagen',
                expect.any(String),
                'success'
            );
        });

        test('should handle invalid volume values', () => {
            const mockVolumeInput = { value: 'invalid' };
            global.document.getElementById.mockReturnValue(mockVolumeInput);
            
            adminPanel.saveSettings();

            expect(mockSoundManager.setVolume).toHaveBeenCalledWith(0.5); // Default
        });

        test('should handle missing form elements', () => {
            global.document.getElementById.mockReturnValue(null);
            
            adminPanel.saveSettings();

            expect(mockLogError).toHaveBeenCalled();
        });
    });

    describe('handleKeyPress', () => {
        test('should handle Enter key for login', () => {
            const mockEvent = {
                key: 'Enter',
                preventDefault: jest.fn()
            };
            
            adminPanel.authenticate = jest.fn();
            adminPanel.handleKeyPress(mockEvent);

            expect(adminPanel.authenticate).toHaveBeenCalled();
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        test('should handle Escape key for close', () => {
            const mockEvent = {
                key: 'Escape',
                preventDefault: jest.fn()
            };
            
            adminPanel.handleKeyPress(mockEvent);

            expect(adminPanel.isVisible).toBe(false);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        test('should ignore other keys', () => {
            const mockEvent = {
                key: 'a',
                preventDefault: jest.fn()
            };
            
            adminPanel.handleKeyPress(mockEvent);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        test('should cleanup resources', () => {
            adminPanel.isVisible = true;
            adminPanel.isAuthenticated = true;
            
            adminPanel.cleanup();

            expect(adminPanel.isVisible).toBe(false);
            expect(adminPanel.isAuthenticated).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            global.document.getElementById.mockReturnValue(null);
            
            adminPanel.showPanel();
            adminPanel.loadGameList();
            adminPanel.saveGame();

            // Should not throw errors
            expect(mockLogError).toHaveBeenCalled();
        });

        test('should handle IPC errors gracefully', async () => {
            ipcRenderer.invoke.mockRejectedValueOnce(new Error('IPC Error'));
            
            await adminPanel.exportGames();

            expect(mockLogError).toHaveBeenCalledWith(
                'AdminPanelManager',
                expect.any(Error)
            );
        });
    });
});
