/**
 * SoundManager Test Suite
 * Tests for audio management functionality
 */

const path = require('path');

// Mock DOM Audio API
global.Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(),
    pause: jest.fn(),
    currentTime: 0,
    volume: 1,
    paused: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
}));

// Import the SoundManager
const SoundManager = require('../js/soundManager');

describe('SoundManager', () => {
    let soundManager;
    let mockLogError;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock logError function
        mockLogError = jest.fn();
        global.logError = mockLogError;
        
        soundManager = new SoundManager();
        
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn()
            },
            writable: true
        });
    });

    afterEach(() => {
        soundManager.cleanup();
    });

    describe('Initialization', () => {
        test('should initialize with default settings', () => {
            expect(soundManager.enabled).toBe(true);
            expect(soundManager.volume).toBe(0.5);
            expect(soundManager.audioCache).toBeDefined();
            expect(soundManager.audioCache.size).toBe(0);
        });

        test('should initialize with provided settings', () => {
            const customManager = new SoundManager({ 
                enabled: false, 
                volume: 0.8 
            });
            
            expect(customManager.enabled).toBe(false);
            expect(customManager.volume).toBe(0.8);
        });
    });

    describe('loadSounds', () => {
        test('should load sounds from configuration', async () => {
            const mockConfig = {
                sounds: {
                    click: 'sounds/click.wav',
                    hover: 'sounds/hover.wav'
                }
            };

            await soundManager.loadSounds(mockConfig);

            expect(soundManager.audioCache.size).toBe(2);
            expect(soundManager.audioCache.has('click')).toBe(true);
            expect(soundManager.audioCache.has('hover')).toBe(true);
        });

        test('should handle missing sounds configuration', async () => {
            const mockConfig = {};

            await soundManager.loadSounds(mockConfig);

            expect(soundManager.audioCache.size).toBe(0);
        });

        test('should handle errors when loading sounds', async () => {
            // Mock Audio to throw error
            global.Audio = jest.fn().mockImplementation(() => {
                throw new Error('Failed to load audio');
            });

            const mockConfig = {
                sounds: {
                    click: 'sounds/invalid.wav'
                }
            };

            await soundManager.loadSounds(mockConfig);

            expect(mockLogError).toHaveBeenCalledWith(
                'SoundManager',
                expect.any(Error),
                expect.objectContaining({ soundName: 'click' })
            );
        });
    });

    describe('playSound', () => {
        beforeEach(async () => {
            const mockConfig = {
                sounds: {
                    click: 'sounds/click.wav',
                    hover: 'sounds/hover.wav'
                }
            };
            await soundManager.loadSounds(mockConfig);
        });

        test('should play sound when enabled', async () => {
            const mockAudio = soundManager.audioCache.get('click');
            
            await soundManager.playSound('click');

            expect(mockAudio.volume).toBe(0.5);
            expect(mockAudio.currentTime).toBe(0);
            expect(mockAudio.play).toHaveBeenCalled();
        });

        test('should not play sound when disabled', async () => {
            soundManager.enabled = false;
            const mockAudio = soundManager.audioCache.get('click');
            
            await soundManager.playSound('click');

            expect(mockAudio.play).not.toHaveBeenCalled();
        });

        test('should handle non-existent sound', async () => {
            await soundManager.playSound('nonexistent');

            expect(mockLogError).toHaveBeenCalledWith(
                'SoundManager',
                expect.any(Error),
                expect.objectContaining({ soundName: 'nonexistent' })
            );
        });

        test('should handle audio play errors', async () => {
            const mockAudio = soundManager.audioCache.get('click');
            mockAudio.play.mockRejectedValueOnce(new Error('Audio play failed'));
            
            await soundManager.playSound('click');

            expect(mockLogError).toHaveBeenCalledWith(
                'SoundManager',
                expect.any(Error),
                expect.objectContaining({ soundName: 'click' })
            );
        });

        test('should apply custom volume', async () => {
            const mockAudio = soundManager.audioCache.get('click');
            
            await soundManager.playSound('click', 0.8);

            expect(mockAudio.volume).toBe(0.8);
        });
    });

    describe('stopSound', () => {
        beforeEach(async () => {
            const mockConfig = {
                sounds: {
                    music: 'sounds/background.mp3'
                }
            };
            await soundManager.loadSounds(mockConfig);
        });

        test('should stop playing sound', () => {
            const mockAudio = soundManager.audioCache.get('music');
            mockAudio.paused = false;
            
            soundManager.stopSound('music');

            expect(mockAudio.pause).toHaveBeenCalled();
            expect(mockAudio.currentTime).toBe(0);
        });

        test('should handle non-existent sound', () => {
            soundManager.stopSound('nonexistent');

            expect(mockLogError).toHaveBeenCalledWith(
                'SoundManager',
                expect.any(Error),
                expect.objectContaining({ soundName: 'nonexistent' })
            );
        });
    });

    describe('setVolume', () => {
        beforeEach(async () => {
            const mockConfig = {
                sounds: {
                    click: 'sounds/click.wav',
                    music: 'sounds/music.mp3'
                }
            };
            await soundManager.loadSounds(mockConfig);
        });

        test('should update volume for all sounds', () => {
            soundManager.setVolume(0.7);

            expect(soundManager.volume).toBe(0.7);
            
            // Check that all cached audio objects have updated volume
            soundManager.audioCache.forEach(audio => {
                expect(audio.volume).toBe(0.7);
            });
        });

        test('should clamp volume to valid range', () => {
            soundManager.setVolume(1.5);
            expect(soundManager.volume).toBe(1);

            soundManager.setVolume(-0.5);
            expect(soundManager.volume).toBe(0);
        });

        test('should save volume to localStorage', () => {
            soundManager.setVolume(0.8);

            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'soundVolume',
                '0.8'
            );
        });
    });

    describe('toggleEnabled', () => {
        test('should toggle sound enabled state', () => {
            expect(soundManager.enabled).toBe(true);
            
            soundManager.toggleEnabled();
            expect(soundManager.enabled).toBe(false);
            
            soundManager.toggleEnabled();
            expect(soundManager.enabled).toBe(true);
        });

        test('should save enabled state to localStorage', () => {
            soundManager.toggleEnabled();

            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                'soundEnabled',
                'false'
            );
        });
    });

    describe('loadSettings', () => {
        test('should load volume from localStorage', () => {
            window.localStorage.getItem.mockImplementation(key => {
                if (key === 'soundVolume') return '0.3';
                if (key === 'soundEnabled') return 'true';
                return null;
            });

            soundManager.loadSettings();

            expect(soundManager.volume).toBe(0.3);
            expect(soundManager.enabled).toBe(true);
        });

        test('should load enabled state from localStorage', () => {
            window.localStorage.getItem.mockImplementation(key => {
                if (key === 'soundVolume') return '0.5';
                if (key === 'soundEnabled') return 'false';
                return null;
            });

            soundManager.loadSettings();

            expect(soundManager.enabled).toBe(false);
        });

        test('should use defaults when localStorage is empty', () => {
            window.localStorage.getItem.mockReturnValue(null);

            soundManager.loadSettings();

            expect(soundManager.volume).toBe(0.5);
            expect(soundManager.enabled).toBe(true);
        });

        test('should handle invalid localStorage values', () => {
            window.localStorage.getItem.mockImplementation(key => {
                if (key === 'soundVolume') return 'invalid';
                if (key === 'soundEnabled') return 'not_boolean';
                return null;
            });

            soundManager.loadSettings();

            expect(soundManager.volume).toBe(0.5);
            expect(soundManager.enabled).toBe(true);
        });
    });

    describe('preloadSound', () => {
        test('should preload individual sound', async () => {
            await soundManager.preloadSound('test', 'sounds/test.wav');

            expect(soundManager.audioCache.has('test')).toBe(true);
            expect(global.Audio).toHaveBeenCalledWith('sounds/test.wav');
        });

        test('should handle preload errors', async () => {
            global.Audio = jest.fn().mockImplementation(() => {
                throw new Error('Preload failed');
            });

            await soundManager.preloadSound('test', 'sounds/invalid.wav');

            expect(mockLogError).toHaveBeenCalledWith(
                'SoundManager',
                expect.any(Error),
                expect.objectContaining({ soundName: 'test' })
            );
        });
    });

    describe('cleanup', () => {
        beforeEach(async () => {
            const mockConfig = {
                sounds: {
                    click: 'sounds/click.wav',
                    music: 'sounds/music.mp3'
                }
            };
            await soundManager.loadSounds(mockConfig);
        });

        test('should stop and clear all sounds', () => {
            const mockAudio1 = soundManager.audioCache.get('click');
            const mockAudio2 = soundManager.audioCache.get('music');
            
            soundManager.cleanup();

            expect(mockAudio1.pause).toHaveBeenCalled();
            expect(mockAudio2.pause).toHaveBeenCalled();
            expect(soundManager.audioCache.size).toBe(0);
        });
    });

    describe('Error Handling', () => {
        test('should handle Audio constructor failures gracefully', async () => {
            global.Audio = jest.fn().mockImplementation(() => {
                throw new Error('Audio not supported');
            });

            const mockConfig = {
                sounds: {
                    test: 'sounds/test.wav'
                }
            };

            await soundManager.loadSounds(mockConfig);

            expect(mockLogError).toHaveBeenCalled();
            expect(soundManager.audioCache.size).toBe(0);
        });

        test('should handle malformed sound configuration', async () => {
            const mockConfig = {
                sounds: null
            };

            await soundManager.loadSounds(mockConfig);

            expect(soundManager.audioCache.size).toBe(0);
        });
    });
});
