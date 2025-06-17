// Simple test to verify modules work
const GameManager = require('../js/gameManager');

test('GameManager can be imported and instantiated', () => {
    const gameManager = new GameManager();
    expect(gameManager).toBeDefined();
    expect(gameManager.games).toEqual([]);
});
