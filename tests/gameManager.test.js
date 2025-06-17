// GameManager Tests
describe('GameManager', () => {
    let gameManager;

    beforeEach(() => {
        // Clear localStorage mock
        localStorage.clear();
        localStorage.getItem.mockReturnValue(null);
        localStorage.setItem.mockClear();
        
        // Load the GameManager class
        require('../js/gameManager.js');
        gameManager = new GameManager();
    });

    describe('Initialization', () => {
        test('should initialize with empty games array', () => {
            expect(gameManager.games).toEqual([]);
            expect(gameManager.selectedGame).toBeNull();
            expect(gameManager.gameIdCounter).toBe(1);
        });

        test('should load games from localStorage', () => {
            const savedGames = [
                { id: 1, title: 'TEST GAME', genre: 'ARCADE' }
            ];
            localStorage.getItem.mockReturnValue(JSON.stringify(savedGames));
            
            gameManager.initializeGames();
            
            expect(gameManager.games).toEqual(savedGames);
            expect(gameManager.gameIdCounter).toBe(2);
        });

        test('should handle corrupted localStorage data', () => {
            localStorage.getItem.mockReturnValue('invalid json');
            
            gameManager.initializeGames();
            
            expect(gameManager.games).toEqual([]);
            expect(gameManager.gameIdCounter).toBe(1);
        });
    });

    describe('Adding Games', () => {
        test('should add a new game correctly', () => {
            const gameData = {
                title: 'test game',
                description: 'Test description',
                genre: 'ARCADE',
                type: 'executable',
                executable: 'test.exe',
                image: 'test.jpg'
            };

            const newGame = gameManager.addGame(gameData);

            expect(newGame.id).toBe(1);
            expect(newGame.title).toBe('TEST GAME'); // Should be uppercase
            expect(newGame.description).toBe('Test description');
            expect(gameManager.games).toHaveLength(1);
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'arcadeLauncherGames',
                JSON.stringify([newGame])
            );
        });

        test('should increment game ID counter', () => {
            gameManager.addGame({
                title: 'Game 1',
                description: 'First game',
                genre: 'ARCADE',
                type: 'executable',
                executable: 'game1.exe'
            });

            gameManager.addGame({
                title: 'Game 2',
                description: 'Second game',
                genre: 'PUZZLE',
                type: 'executable',
                executable: 'game2.exe'
            });

            expect(gameManager.games[0].id).toBe(1);
            expect(gameManager.games[1].id).toBe(2);
            expect(gameManager.gameIdCounter).toBe(3);
        });
    });

    describe('Updating Games', () => {
        beforeEach(() => {
            gameManager.addGame({
                title: 'Original Game',
                description: 'Original description',
                genre: 'ARCADE',
                type: 'executable',
                executable: 'original.exe'
            });
        });

        test('should update existing game', () => {
            const updates = {
                title: 'Updated Game',
                description: 'Updated description'
            };

            const updatedGame = gameManager.updateGame(1, updates);

            expect(updatedGame.title).toBe('Updated Game');
            expect(updatedGame.description).toBe('Updated description');
            expect(updatedGame.genre).toBe('ARCADE'); // Should preserve other fields
        });

        test('should return null for non-existent game', () => {
            const result = gameManager.updateGame(999, { title: 'Test' });
            expect(result).toBeNull();
        });
    });

    describe('Deleting Games', () => {
        beforeEach(() => {
            gameManager.addGame({
                title: 'Game to Delete',
                description: 'Will be deleted',
                genre: 'ARCADE',
                type: 'executable',
                executable: 'delete.exe'
            });
        });

        test('should delete existing game', () => {
            const result = gameManager.deleteGame(1);

            expect(result).toBe(true);
            expect(gameManager.games).toHaveLength(0);
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'arcadeLauncherGames',
                JSON.stringify([])
            );
        });

        test('should return false for non-existent game', () => {
            const result = gameManager.deleteGame(999);
            expect(result).toBe(false);
        });
    });

    describe('Game Retrieval', () => {
        beforeEach(() => {
            gameManager.addGame({
                title: 'Test Game',
                description: 'Test description',
                genre: 'ARCADE',
                type: 'executable',
                executable: 'test.exe'
            });
        });

        test('should get game by ID', () => {
            const game = gameManager.getGame(1);
            expect(game.title).toBe('TEST GAME');
        });

        test('should return undefined for non-existent game', () => {
            const game = gameManager.getGame(999);
            expect(game).toBeUndefined();
        });

        test('should get all games as copy', () => {
            const games = gameManager.getAllGames();
            expect(games).toHaveLength(1);
            
            // Should be a copy, not the original array
            games.push({ id: 999, title: 'Fake Game' });
            expect(gameManager.games).toHaveLength(1);
        });
    });

    describe('Embedded Game Detection', () => {
        test('should detect web games', () => {
            const webGame = { type: 'web', executable: 'anything' };
            expect(gameManager.canGameBeEmbedded(webGame)).toBe(true);

            const browserGame = { type: 'browser', executable: 'anything' };
            expect(gameManager.canGameBeEmbedded(browserGame)).toBe(true);
        });

        test('should detect HTTP URLs', () => {
            const httpGame = { executable: 'http://example.com/game' };
            expect(gameManager.canGameBeEmbedded(httpGame)).toBe(true);

            const httpsGame = { executable: 'https://example.com/game' };
            expect(gameManager.canGameBeEmbedded(httpsGame)).toBe(true);
        });

        test('should detect HTML files', () => {
            const htmlGame = { executable: 'game.html' };
            expect(gameManager.canGameBeEmbedded(htmlGame)).toBe(true);

            const htmGame = { executable: 'game.htm' };
            expect(gameManager.canGameBeEmbedded(htmGame)).toBe(true);
        });

        test('should not detect executable files as embeddable', () => {
            const exeGame = { executable: 'game.exe' };
            expect(gameManager.canGameBeEmbedded(exeGame)).toBe(false);
        });

        test('should handle invalid input', () => {
            expect(gameManager.canGameBeEmbedded(null)).toBe(false);
            expect(gameManager.canGameBeEmbedded({})).toBe(false);
            expect(gameManager.canGameBeEmbedded({ executable: '' })).toBe(false);
        });
    });

    describe('Clear All Games', () => {
        beforeEach(() => {
            gameManager.addGame({
                title: 'Game 1',
                description: 'First game',
                genre: 'ARCADE',
                type: 'executable',
                executable: 'game1.exe'
            });
            gameManager.addGame({
                title: 'Game 2',
                description: 'Second game',
                genre: 'PUZZLE',
                type: 'executable',
                executable: 'game2.exe'
            });
        });

        test('should clear all games and reset counter', () => {
            gameManager.clearAllGames();

            expect(gameManager.games).toHaveLength(0);
            expect(gameManager.gameIdCounter).toBe(1);
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'arcadeLauncherGames',
                JSON.stringify([])
            );
        });
    });

    describe('Save Games', () => {
        test('should handle localStorage errors gracefully', () => {
            localStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            expect(() => {
                gameManager.addGame({
                    title: 'Test',
                    description: 'Test',
                    genre: 'ARCADE',
                    type: 'executable',
                    executable: 'test.exe'
                });
            }).toThrow('Failed to save games to localStorage');
        });
    });
});
