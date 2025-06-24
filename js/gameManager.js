// Game Management Module
class GameManager {
    constructor() {
        this.games = [];
        this.selectedGame = null;
        this.gameIdCounter = 1;
    }

    // Initialize games from localStorage
    initializeGames() {
        const savedGames = localStorage.getItem('arcadeLauncherGames');
        if (savedGames) {
            try {
                this.games = JSON.parse(savedGames);
                if (this.games.length > 0) {
                    this.gameIdCounter = Math.max(...this.games.map(g => g.id || 0)) + 1;
                }
            } catch (error) {
                console.error('Error loading saved games:', error);
                this.games = [];
            }
        }
    }    // Add new game
    addGame(gameData) {
        const newGame = {
            id: this.gameIdCounter++,
            title: gameData.title.toUpperCase(),
            description: gameData.description,
            author: gameData.author || 'Unknown Developer',
            genre: gameData.genre,
            type: gameData.type,
            executable: gameData.executable,
            image: gameData.image || ''
        };
        
        this.games.push(newGame);
        this.saveGames();
        return newGame;
    }

    // Update existing game
    updateGame(gameId, gameData) {
        const gameIndex = this.games.findIndex(g => g.id === gameId);
        if (gameIndex !== -1) {
            this.games[gameIndex] = { ...this.games[gameIndex], ...gameData };
            this.saveGames();
            return this.games[gameIndex];
        }
        return null;
    }

    // Delete game
    deleteGame(gameId) {
        const initialLength = this.games.length;
        this.games = this.games.filter(g => g.id !== gameId);
        if (this.games.length < initialLength) {
            this.saveGames();
            return true;
        }
        return false;
    }

    // Get game by ID
    getGame(gameId) {
        return this.games.find(g => g.id === gameId);
    }

    // Get all games
    getAllGames() {
        return [...this.games]; // Return copy to prevent mutation
    }

    // Save games to localStorage
    saveGames() {
        try {
            localStorage.setItem('arcadeLauncherGames', JSON.stringify(this.games));
        } catch (error) {
            console.error('Error saving games:', error);
            throw new Error('Failed to save games to localStorage');
        }
    }

    // Clear all games
    clearAllGames() {
        this.games = [];
        this.gameIdCounter = 1;
        this.saveGames();
    }

    // Check if game can be embedded
    canGameBeEmbedded(game) {
        if (!game || !game.executable) return false;
        
        const executable = game.executable.toLowerCase();
        
        // Check if it's a web-based game
        if (game.type === 'web' || game.type === 'browser') return true;
        if (executable.startsWith('http://') || executable.startsWith('https://')) return true;
        if (executable.endsWith('.html') || executable.endsWith('.htm')) return true;
        
        return false;
    }
}

// Export for use in main renderer and testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
} else {
    window.GameManager = GameManager;
}
