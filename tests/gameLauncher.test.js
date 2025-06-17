/**
 * GameLauncher Test Suite
 * Tests for game launching functionality (embedded and external)
 */

const { ipcRenderer } = require('electron');

// Mock Electron IPC
jest.mock('electron', () => ({
    ipcRenderer: {
        invoke: jest.fn(),
        send: jest.fn(),
        on: jest.fn(),
        removeListener: jest.fn()
    }
}));

// Import the GameLauncher
const GameLauncher = require('../js/gameLauncher');

describe('GameLauncher', () => {
    let gameLauncher;
    let mockUiManager;
    let mockSoundManager;
    let mockLogError;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock dependencies
        mockUiManager = {
            showNotification: jest.fn(),
            hideModal: jest.fn(),
            showModal: jest.fn()
        };
        
        mockSoundManager = {
            playSound: jest.fn()
        };
        
        mockLogError = jest.fn();
        global.logError = mockLogError;
        
        // Mock DOM elements
        const mockIframe = {
            src: '',
            style: { display: '' },
            contentWindow: {
                location: { href: '' }
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        
        global.document = {
            getElementById: jest.fn().mockImplementation(id => {
                if (id === 'gameFrame') return mockIframe;
                if (id === 'gameModal') return { style: { display: '' } };
                return null;
            }),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        
        gameLauncher = new GameLauncher();
        gameLauncher.initialize(mockUiManager, mockSoundManager);
    });

    describe('Initialization', () => {
        test('should initialize with dependencies', () => {
            expect(gameLauncher.uiManager).toBe(mockUiManager);
            expect(gameLauncher.soundManager).toBe(mockSoundManager);
            expect(gameLauncher.currentGame).toBeNull();
            expect(gameLauncher.gameFrame).toBeDefined();
        });

        test('should setup iframe event handlers', () => {
            expect(gameLauncher.gameFrame.addEventListener).toHaveBeenCalledWith(
                'load',
                expect.any(Function)
            );
        });
    });

    describe('launchGame', () => {
        const mockGame = {
            id: 'test-game',
            name: 'Test Game',
            path: 'games/test/index.html',
            isExternal: false
        };

        test('should launch embedded game successfully', async () => {
            ipcRenderer.invoke.mockResolvedValueOnce(true); // gameExists
            
            await gameLauncher.launchGame(mockGame);

            expect(gameLauncher.currentGame).toBe(mockGame);
            expect(gameLauncher.gameFrame.src).toContain(mockGame.path);
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('gameStart');
        });

        test('should launch external game successfully', async () => {
            const externalGame = { ...mockGame, isExternal: true };
            ipcRenderer.invoke.mockResolvedValueOnce(true); // gameExists
            ipcRenderer.invoke.mockResolvedValueOnce({ success: true }); // launchExternalGame
            
            await gameLauncher.launchGame(externalGame);

            expect(ipcRenderer.invoke).toHaveBeenCalledWith('launchExternalGame', externalGame.path);
            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Game Gestart',
                expect.stringContaining(externalGame.name),
                'success'
            );
        });

        test('should handle non-existent game', async () => {
            ipcRenderer.invoke.mockResolvedValueOnce(false); // gameExists
            
            await gameLauncher.launchGame(mockGame);

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Game Niet Gevonden',
                expect.any(String),
                'error'
            );
            expect(gameLauncher.currentGame).toBeNull();
        });

        test('should handle external game launch failure', async () => {
            const externalGame = { ...mockGame, isExternal: true };
            ipcRenderer.invoke.mockResolvedValueOnce(true); // gameExists
            ipcRenderer.invoke.mockResolvedValueOnce({ 
                success: false, 
                error: 'Launch failed' 
            }); // launchExternalGame
            
            await gameLauncher.launchGame(externalGame);

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Fout',
                expect.stringContaining('Launch failed'),
                'error'
            );
        });

        test('should handle IPC errors', async () => {
            ipcRenderer.invoke.mockRejectedValueOnce(new Error('IPC Error'));
            
            await gameLauncher.launchGame(mockGame);

            expect(mockLogError).toHaveBeenCalledWith(
                'GameLauncher',
                expect.any(Error),
                expect.objectContaining({ game: mockGame })
            );
        });

        test('should not launch game if already running', async () => {
            gameLauncher.currentGame = { id: 'existing-game' };
            
            await gameLauncher.launchGame(mockGame);

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Game Actief',
                expect.any(String),
                'warning'
            );
        });
    });

    describe('closeGame', () => {
        beforeEach(() => {
            gameLauncher.currentGame = {
                id: 'test-game',
                name: 'Test Game'
            };
        });

        test('should close embedded game', () => {
            gameLauncher.closeGame();

            expect(gameLauncher.gameFrame.src).toBe('about:blank');
            expect(gameLauncher.currentGame).toBeNull();
            expect(mockUiManager.hideModal).toHaveBeenCalledWith('gameModal');
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('gameEnd');
        });

        test('should close external game', async () => {
            gameLauncher.currentGame.isExternal = true;
            ipcRenderer.invoke.mockResolvedValueOnce({ success: true });
            
            await gameLauncher.closeGame();

            expect(ipcRenderer.invoke).toHaveBeenCalledWith('closeExternalGame');
            expect(gameLauncher.currentGame).toBeNull();
        });

        test('should handle external game close errors', async () => {
            gameLauncher.currentGame.isExternal = true;
            ipcRenderer.invoke.mockRejectedValueOnce(new Error('Close failed'));
            
            await gameLauncher.closeGame();

            expect(mockLogError).toHaveBeenCalledWith(
                'GameLauncher',
                expect.any(Error)
            );
        });

        test('should handle no current game', () => {
            gameLauncher.currentGame = null;
            
            gameLauncher.closeGame();

            expect(mockUiManager.hideModal).toHaveBeenCalledWith('gameModal');
        });
    });

    describe('restartGame', () => {
        const mockGame = {
            id: 'test-game',
            name: 'Test Game',
            path: 'games/test/index.html'
        };

        test('should restart current game', async () => {
            gameLauncher.currentGame = mockGame;
            ipcRenderer.invoke.mockResolvedValueOnce(true); // gameExists
            
            await gameLauncher.restartGame();

            expect(gameLauncher.gameFrame.src).toBe('about:blank');
            expect(gameLauncher.gameFrame.src).toContain(mockGame.path);
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('gameRestart');
        });

        test('should handle no current game', async () => {
            gameLauncher.currentGame = null;
            
            await gameLauncher.restartGame();

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Geen Game Actief',
                expect.any(String),
                'warning'
            );
        });
    });

    describe('isGameRunning', () => {
        test('should return true when game is running', () => {
            gameLauncher.currentGame = { id: 'test-game' };
            
            expect(gameLauncher.isGameRunning()).toBe(true);
        });

        test('should return false when no game is running', () => {
            gameLauncher.currentGame = null;
            
            expect(gameLauncher.isGameRunning()).toBe(false);
        });
    });

    describe('getCurrentGame', () => {
        test('should return current game', () => {
            const mockGame = { id: 'test-game' };
            gameLauncher.currentGame = mockGame;
            
            expect(gameLauncher.getCurrentGame()).toBe(mockGame);
        });

        test('should return null when no game is running', () => {
            gameLauncher.currentGame = null;
            
            expect(gameLauncher.getCurrentGame()).toBeNull();
        });
    });

    describe('handleGameLoad', () => {
        test('should handle successful game load', () => {
            const mockEvent = {
                target: {
                    contentWindow: {
                        location: { href: 'games/test/index.html' }
                    }
                }
            };
            
            gameLauncher.handleGameLoad(mockEvent);

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Game Geladen',
                expect.any(String),
                'success'
            );
        });

        test('should handle game load errors', () => {
            const mockEvent = {
                target: {
                    contentWindow: null
                }
            };
            
            gameLauncher.handleGameLoad(mockEvent);

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Laad Fout',
                expect.any(String),
                'error'
            );
        });
    });

    describe('setupKeyboardShortcuts', () => {
        test('should setup escape key handler', () => {
            gameLauncher.setupKeyboardShortcuts();

            expect(global.document.addEventListener).toHaveBeenCalledWith(
                'keydown',
                expect.any(Function)
            );
        });

        test('should handle escape key press', () => {
            gameLauncher.currentGame = { id: 'test-game' };
            gameLauncher.setupKeyboardShortcuts();
            
            // Get the event handler
            const keyHandler = global.document.addEventListener.mock.calls
                .find(call => call[0] === 'keydown')[1];
            
            // Simulate escape key press
            keyHandler({ key: 'Escape', preventDefault: jest.fn() });

            expect(gameLauncher.currentGame).toBeNull();
        });
    });

    describe('validateGamePath', () => {
        test('should validate embedded game path', async () => {
            ipcRenderer.invoke.mockResolvedValueOnce(true);
            
            const isValid = await gameLauncher.validateGamePath('games/test/index.html');

            expect(isValid).toBe(true);
            expect(ipcRenderer.invoke).toHaveBeenCalledWith('gameExists', 'games/test/index.html');
        });

        test('should validate external game path', async () => {
            ipcRenderer.invoke.mockResolvedValueOnce(true);
            
            const isValid = await gameLauncher.validateGamePath('C:\\Games\\test.exe');

            expect(isValid).toBe(true);
        });

        test('should handle validation errors', async () => {
            ipcRenderer.invoke.mockRejectedValueOnce(new Error('Validation failed'));
            
            const isValid = await gameLauncher.validateGamePath('invalid/path');

            expect(isValid).toBe(false);
            expect(mockLogError).toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        test('should cleanup resources', () => {
            gameLauncher.currentGame = { id: 'test-game' };
            
            gameLauncher.cleanup();

            expect(gameLauncher.gameFrame.src).toBe('about:blank');
            expect(gameLauncher.currentGame).toBeNull();
            expect(global.document.removeEventListener).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle missing gameFrame element', () => {
            global.document.getElementById.mockReturnValue(null);
            
            const newLauncher = new GameLauncher();
            newLauncher.initialize(mockUiManager, mockSoundManager);

            expect(mockLogError).toHaveBeenCalledWith(
                'GameLauncher',
                expect.any(Error)
            );
        });

        test('should handle iframe load errors gracefully', () => {
            const errorEvent = { type: 'error' };
            
            // Simulate iframe error
            gameLauncher.handleGameLoad(errorEvent);

            expect(mockUiManager.showNotification).toHaveBeenCalledWith(
                'Laad Fout',
                expect.any(String),
                'error'
            );
        });
    });
});
