/**
 * KeyboardHandler Test Suite
 * Tests for keyboard navigation and input handling
 */

const { ipcRenderer } = require('electron');

// Mock Electron IPC
jest.mock('electron', () => ({
    ipcRenderer: {
        invoke: jest.fn(),
        send: jest.fn()
    }
}));

// Import the KeyboardHandler
const KeyboardHandler = require('../js/keyboardHandler');

describe('KeyboardHandler', () => {
    let keyboardHandler;
    let mockUiManager;
    let mockGameLauncher;
    let mockAdminPanel;
    let mockSoundManager;
    let mockLogError;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock dependencies
        mockUiManager = {
            showNotification: jest.fn(),
            hideModal: jest.fn(),
            showModal: jest.fn(),
            selectNextGame: jest.fn(),
            selectPreviousGame: jest.fn(),
            selectGameByIndex: jest.fn(),
            getCurrentSelectedGame: jest.fn().mockReturnValue({ id: 'test-game' }),
            getSelectedGameIndex: jest.fn().mockReturnValue(0)
        };
        
        mockGameLauncher = {
            launchGame: jest.fn(),
            closeGame: jest.fn(),
            restartGame: jest.fn(),
            isGameRunning: jest.fn().mockReturnValue(false),
            getCurrentGame: jest.fn().mockReturnValue(null)
        };
        
        mockAdminPanel = {
            showPanel: jest.fn(),
            hidePanel: jest.fn(),
            isVisible: jest.fn().mockReturnValue(false)
        };
        
        mockSoundManager = {
            playSound: jest.fn()
        };
        
        mockLogError = jest.fn();
        global.logError = mockLogError;
        
        // Mock DOM
        global.document = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            activeElement: { tagName: 'BODY' },
            querySelector: jest.fn().mockReturnValue(null)
        };
        
        global.window = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        
        keyboardHandler = new KeyboardHandler();
        keyboardHandler.initialize(
            mockUiManager,
            mockGameLauncher,
            mockAdminPanel,
            mockSoundManager
        );
    });

    describe('Initialization', () => {
        test('should initialize with dependencies', () => {
            expect(keyboardHandler.uiManager).toBe(mockUiManager);
            expect(keyboardHandler.gameLauncher).toBe(mockGameLauncher);
            expect(keyboardHandler.adminPanel).toBe(mockAdminPanel);
            expect(keyboardHandler.soundManager).toBe(mockSoundManager);
            expect(keyboardHandler.keySequence).toEqual([]);
        });

        test('should setup event listeners', () => {
            expect(global.document.addEventListener).toHaveBeenCalledWith(
                'keydown',
                expect.any(Function),
                true
            );
            expect(global.window.addEventListener).toHaveBeenCalledWith(
                'blur',
                expect.any(Function)
            );
        });
    });

    describe('handleKeyDown', () => {
        let keyHandler;

        beforeEach(() => {
            keyboardHandler.setupEventListeners();
            keyHandler = global.document.addEventListener.mock.calls
                .find(call => call[0] === 'keydown')[1];
        });

        test('should handle arrow key navigation', () => {
            const event = {
                key: 'ArrowDown',
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyHandler(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockUiManager.selectNextGame).toHaveBeenCalled();
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('navigation');
        });

        test('should handle Enter key for game launch', () => {
            const event = {
                key: 'Enter',
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyHandler(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockGameLauncher.launchGame).toHaveBeenCalledWith({ id: 'test-game' });
        });

        test('should handle Escape key for game close', () => {
            mockGameLauncher.isGameRunning.mockReturnValue(true);
            
            const event = {
                key: 'Escape',
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyHandler(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockGameLauncher.closeGame).toHaveBeenCalled();
        });

        test('should handle F5 for game restart', () => {
            mockGameLauncher.isGameRunning.mockReturnValue(true);
            
            const event = {
                key: 'F5',
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyHandler(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockGameLauncher.restartGame).toHaveBeenCalled();
        });

        test('should handle number keys for direct selection', () => {
            const event = {
                key: '1',
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyHandler(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(mockUiManager.selectGameByIndex).toHaveBeenCalledWith(0);
        });

        test('should handle admin key sequence', () => {
            // Simulate admin key sequence: A-D-M-I-N
            const keys = ['a', 'd', 'm', 'i', 'n'];
            
            keys.forEach(key => {
                const event = {
                    key,
                    preventDefault: jest.fn(),
                    stopPropagation: jest.fn()
                };
                keyHandler(event);
            });

            expect(mockAdminPanel.showPanel).toHaveBeenCalled();
        });

        test('should ignore keys when in input fields', () => {
            global.document.activeElement = { 
                tagName: 'INPUT',
                type: 'text'
            };
            
            const event = {
                key: 'ArrowDown',
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyHandler(event);

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(mockUiManager.selectNextGame).not.toHaveBeenCalled();
        });

        test('should handle disabled keys in production', () => {
            const event = {
                key: 'F12',
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyHandler(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
        });
    });

    describe('Navigation Methods', () => {
        test('should handle next game navigation', () => {
            keyboardHandler.handleNavigation('down');

            expect(mockUiManager.selectNextGame).toHaveBeenCalled();
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('navigation');
        });

        test('should handle previous game navigation', () => {
            keyboardHandler.handleNavigation('up');

            expect(mockUiManager.selectPreviousGame).toHaveBeenCalled();
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('navigation');
        });

        test('should handle right navigation', () => {
            keyboardHandler.handleNavigation('right');

            expect(mockUiManager.selectNextGame).toHaveBeenCalled();
        });

        test('should handle left navigation', () => {
            keyboardHandler.handleNavigation('left');

            expect(mockUiManager.selectPreviousGame).toHaveBeenCalled();
        });
    });

    describe('Game Actions', () => {
        test('should launch selected game', () => {
            keyboardHandler.handleGameAction('launch');

            expect(mockGameLauncher.launchGame).toHaveBeenCalledWith({ id: 'test-game' });
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('select');
        });

        test('should close current game', () => {
            keyboardHandler.handleGameAction('close');

            expect(mockGameLauncher.closeGame).toHaveBeenCalled();
        });

        test('should restart current game', () => {
            keyboardHandler.handleGameAction('restart');

            expect(mockGameLauncher.restartGame).toHaveBeenCalled();
        });

        test('should handle unknown game action', () => {
            keyboardHandler.handleGameAction('unknown');

            expect(mockLogError).toHaveBeenCalledWith(
                'KeyboardHandler',
                expect.any(Error),
                expect.objectContaining({ action: 'unknown' })
            );
        });
    });

    describe('Number Key Handling', () => {
        test('should handle number keys 1-9', () => {
            for (let i = 1; i <= 9; i++) {
                keyboardHandler.handleNumberKey(i.toString());
                expect(mockUiManager.selectGameByIndex).toHaveBeenCalledWith(i - 1);
            }
        });

        test('should handle number key 0 as index 9', () => {
            keyboardHandler.handleNumberKey('0');
            expect(mockUiManager.selectGameByIndex).toHaveBeenCalledWith(9);
        });

        test('should play sound for number selection', () => {
            keyboardHandler.handleNumberKey('5');
            expect(mockSoundManager.playSound).toHaveBeenCalledWith('navigation');
        });
    });

    describe('Key Sequence Handling', () => {
        test('should track key sequence', () => {
            keyboardHandler.addToKeySequence('a');
            keyboardHandler.addToKeySequence('d');
            
            expect(keyboardHandler.keySequence).toEqual(['a', 'd']);
        });

        test('should limit sequence length', () => {
            // Add more than MAX_SEQUENCE_LENGTH keys
            for (let i = 0; i < 15; i++) {
                keyboardHandler.addToKeySequence('x');
            }
            
            expect(keyboardHandler.keySequence.length).toBeLessThanOrEqual(10);
        });

        test('should clear sequence after timeout', (done) => {
            keyboardHandler.addToKeySequence('a');
            
            setTimeout(() => {
                expect(keyboardHandler.keySequence).toEqual([]);
                done();
            }, 2100); // Slightly more than SEQUENCE_TIMEOUT
        });

        test('should detect admin sequence', () => {
            const adminKeys = ['a', 'd', 'm', 'i', 'n'];
            adminKeys.forEach(key => keyboardHandler.addToKeySequence(key));
            
            const isAdminSequence = keyboardHandler.checkForAdminSequence();
            expect(isAdminSequence).toBe(true);
        });

        test('should detect exit sequence', () => {
            const exitKeys = ['e', 'x', 'i', 't'];
            exitKeys.forEach(key => keyboardHandler.addToKeySequence(key));
            
            const isExitSequence = keyboardHandler.checkForExitSequence();
            expect(isExitSequence).toBe(true);
        });
    });

    describe('isInInputField', () => {
        test('should detect input fields', () => {
            global.document.activeElement = { tagName: 'INPUT' };
            expect(keyboardHandler.isInInputField()).toBe(true);
            
            global.document.activeElement = { tagName: 'TEXTAREA' };
            expect(keyboardHandler.isInInputField()).toBe(true);
            
            global.document.activeElement = { tagName: 'SELECT' };
            expect(keyboardHandler.isInInputField()).toBe(true);
        });

        test('should detect contenteditable elements', () => {
            global.document.activeElement = { 
                tagName: 'DIV',
                contentEditable: 'true'
            };
            expect(keyboardHandler.isInInputField()).toBe(true);
        });

        test('should not detect regular elements', () => {
            global.document.activeElement = { tagName: 'BODY' };
            expect(keyboardHandler.isInInputField()).toBe(false);
        });
    });

    describe('shouldIgnoreKey', () => {
        test('should ignore keys in input fields', () => {
            global.document.activeElement = { tagName: 'INPUT' };
            expect(keyboardHandler.shouldIgnoreKey('ArrowDown')).toBe(true);
        });

        test('should not ignore keys in body', () => {
            global.document.activeElement = { tagName: 'BODY' };
            expect(keyboardHandler.shouldIgnoreKey('ArrowDown')).toBe(false);
        });

        test('should ignore modifier keys', () => {
            expect(keyboardHandler.shouldIgnoreKey('Control')).toBe(true);
            expect(keyboardHandler.shouldIgnoreKey('Alt')).toBe(true);
            expect(keyboardHandler.shouldIgnoreKey('Shift')).toBe(true);
            expect(keyboardHandler.shouldIgnoreKey('Meta')).toBe(true);
        });
    });

    describe('disableSystemShortcuts', () => {
        test('should disable F12 developer tools', () => {
            const event = {
                key: 'F12',
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyboardHandler.disableSystemShortcuts(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
        });

        test('should disable Ctrl+Shift+I', () => {
            const event = {
                key: 'I',
                ctrlKey: true,
                shiftKey: true,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyboardHandler.disableSystemShortcuts(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        test('should disable Alt+F4', () => {
            const event = {
                key: 'F4',
                altKey: true,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            
            keyboardHandler.disableSystemShortcuts(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });
    });

    describe('handleWindowBlur', () => {
        test('should clear key sequence on window blur', () => {
            keyboardHandler.keySequence = ['a', 'b', 'c'];
            
            const blurHandler = global.window.addEventListener.mock.calls
                .find(call => call[0] === 'blur')[1];
            
            blurHandler();

            expect(keyboardHandler.keySequence).toEqual([]);
        });
    });

    describe('cleanup', () => {
        test('should remove event listeners', () => {
            keyboardHandler.cleanup();

            expect(global.document.removeEventListener).toHaveBeenCalledWith(
                'keydown',
                expect.any(Function),
                true
            );
            expect(global.window.removeEventListener).toHaveBeenCalledWith(
                'blur',
                expect.any(Function)
            );
        });

        test('should clear key sequence', () => {
            keyboardHandler.keySequence = ['a', 'b'];
            keyboardHandler.cleanup();
            
            expect(keyboardHandler.keySequence).toEqual([]);
        });
    });

    describe('Error Handling', () => {
        test('should handle errors in key handling gracefully', () => {
            mockUiManager.selectNextGame.mockImplementation(() => {
                throw new Error('Navigation error');
            });
            
            keyboardHandler.handleNavigation('down');

            expect(mockLogError).toHaveBeenCalledWith(
                'KeyboardHandler',
                expect.any(Error),
                expect.objectContaining({ direction: 'down' })
            );
        });

        test('should handle errors in game actions gracefully', () => {
            mockGameLauncher.launchGame.mockImplementation(() => {
                throw new Error('Launch error');
            });
            
            keyboardHandler.handleGameAction('launch');

            expect(mockLogError).toHaveBeenCalledWith(
                'KeyboardHandler',
                expect.any(Error),
                expect.objectContaining({ action: 'launch' })
            );
        });
    });
});
