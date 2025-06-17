/**
 * Basic Module Integration Test
 * Verifies that all modules can be loaded and instantiated correctly
 */

const path = require('path');

// Import modules individually for testing
const GameManager = require('./js/gameManager');
const UIManager = require('./js/uiManager');
const SoundManager = require('./js/soundManager');
const AdminPanelManager = require('./js/adminPanelManager');
const GameLauncher = require('./js/gameLauncher');
const KeyboardHandler = require('./js/keyboardHandler');
const ConfigManager = require('./js/configManager');
const SecurityManager = require('./js/securityManager');

describe('Module Integration Tests', () => {
    test('All modules can be imported', () => {
        expect(GameManager).toBeDefined();
        expect(UIManager).toBeDefined();
        expect(SoundManager).toBeDefined();
        expect(AdminPanelManager).toBeDefined();
        expect(GameLauncher).toBeDefined();
        expect(KeyboardHandler).toBeDefined();
        expect(ConfigManager).toBeDefined();
        expect(SecurityManager).toBeDefined();
    });

    test('All modules can be instantiated', () => {
        const gameManager = new GameManager();
        const uiManager = new UIManager();
        const soundManager = new SoundManager();
        const adminPanel = new AdminPanelManager();
        const gameLauncher = new GameLauncher();
        const keyboardHandler = new KeyboardHandler();
        const configManager = new ConfigManager();
        const securityManager = new SecurityManager();

        expect(gameManager).toBeInstanceOf(GameManager);
        expect(uiManager).toBeInstanceOf(UIManager);
        expect(soundManager).toBeInstanceOf(SoundManager);
        expect(adminPanel).toBeInstanceOf(AdminPanelManager);
        expect(gameLauncher).toBeInstanceOf(GameLauncher);
        expect(keyboardHandler).toBeInstanceOf(KeyboardHandler);
        expect(configManager).toBeInstanceOf(ConfigManager);
        expect(securityManager).toBeInstanceOf(SecurityManager);
    });

    test('GameManager basic functionality', () => {
        const gameManager = new GameManager();
        
        // Should start with empty games array
        expect(gameManager.getAllGames()).toEqual([]);
        
        // Should be able to add a game
        const gameData = {
            title: 'Test Game',
            description: 'A test game',
            genre: 'Action',
            executable: 'test.exe',
            type: 'external'
        };
        
        const gameId = gameManager.addGame(gameData);
        expect(gameId).toBeDefined();
        
        // Should have one game now
        expect(gameManager.getAllGames()).toHaveLength(1);
        
        // Should be able to get the game
        const retrievedGame = gameManager.getGame(gameId);
        expect(retrievedGame).toBeDefined();
        expect(retrievedGame.title).toBe('TEST GAME'); // Should be uppercase
    });

    test('UIManager basic functionality', () => {
        // Mock DOM elements
        global.document = {
            getElementById: jest.fn(),
            querySelectorAll: jest.fn(() => []),
            createElement: jest.fn(() => ({
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                addEventListener: jest.fn()
            }))
        };

        const uiManager = new UIManager();
        
        // Should have default properties
        expect(uiManager.activeModal).toBeNull();
        expect(uiManager.selectedGameIndex).toBe(0);
    });

    test('ConfigManager basic functionality', () => {
        const configManager = new ConfigManager();
        
        // Should be able to create default config
        const defaultConfig = configManager.createDefaultConfiguration();
        expect(defaultConfig).toBeDefined();
        expect(defaultConfig.branding).toBeDefined();
        expect(defaultConfig.security).toBeDefined();
        expect(defaultConfig.sounds).toBeDefined();
    });

    test('Module interdependencies work', () => {
        // Test that modules can be initialized together
        const gameManager = new GameManager();
        const uiManager = new UIManager();
        const soundManager = new SoundManager();
        const configManager = new ConfigManager();
        
        // Mock minimal DOM
        global.document = {
            getElementById: jest.fn(() => null),
            addEventListener: jest.fn(),
            querySelectorAll: jest.fn(() => [])
        };
        
        // Initialize admin panel with dependencies
        const adminPanel = new AdminPanelManager();
        const config = configManager.createDefaultConfiguration();
        
        expect(() => {
            adminPanel.initialize(gameManager, uiManager, soundManager, config);
        }).not.toThrow();
        
        expect(adminPanel.gameManager).toBe(gameManager);
        expect(adminPanel.uiManager).toBe(uiManager);
        expect(adminPanel.soundManager).toBe(soundManager);
    });
});
