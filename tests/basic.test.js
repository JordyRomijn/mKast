/**
 * Simple working test to verify modular architecture
 */

describe('mKast Arcade Launcher - Modular Architecture', () => {
    test('Modules can be imported correctly', () => {
        // Test GameManager
        const GameManager = require('../js/gameManager');
        expect(GameManager).toBeDefined();
        
        const gameManager = new GameManager();
        expect(gameManager).toBeDefined();
        expect(gameManager.games).toEqual([]);
        
        // Test UIManager  
        const UIManager = require('../js/uiManager');
        expect(UIManager).toBeDefined();
        
        const uiManager = new UIManager();
        expect(uiManager).toBeDefined();
        
        // Test ConfigManager
        const ConfigManager = require('../js/configManager');
        expect(ConfigManager).toBeDefined();
        
        const configManager = new ConfigManager();
        expect(configManager).toBeDefined();
    });
    
    test('GameManager basic operations work', () => {
        const GameManager = require('../js/gameManager');
        const gameManager = new GameManager();
        
        // Add a game
        const gameData = {
            title: 'Test Game',
            description: 'A test game',
            genre: 'Action',
            executable: 'test.exe',
            type: 'external'
        };
        
        const gameId = gameManager.addGame(gameData);
        expect(gameId).toBeDefined();
        
        // Check if game was added
        const games = gameManager.getAllGames();
        expect(games).toHaveLength(1);
        expect(games[0].title).toBe('TEST GAME');
        
        // Get specific game
        const game = gameManager.getGame(gameId);
        expect(game).toBeDefined();
        expect(game.title).toBe('TEST GAME');
    });
});
