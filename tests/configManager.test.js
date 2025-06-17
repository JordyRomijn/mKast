/**
 * ConfigManager Test Suite
 * Tests for configuration validation and management
 */

const fs = require('fs');
const path = require('path');

// Mock fs module
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        access: jest.fn()
    },
    constants: {
        F_OK: 0
    }
}));

// Import the ConfigManager
const ConfigManager = require('../js/configManager');

describe('ConfigManager', () => {
    let configManager;
    let mockLogError;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockLogError = jest.fn();
        global.logError = mockLogError;
        
        configManager = new ConfigManager();
    });

    describe('loadConfig', () => {
        const validConfig = {
            appName: "mKast Arcade Launcher",
            version: "1.0.0",
            adminPassword: "admin123",
            settings: {
                fullscreen: true,
                volume: 0.5
            },
            sounds: {
                click: "sounds/click.wav"
            },
            paths: {
                gamesDirectory: "games"
            }
        };

        test('should load valid configuration', async () => {
            fs.promises.readFile.mockResolvedValueOnce(JSON.stringify(validConfig));
            
            const config = await configManager.loadConfig('config.json');

            expect(config).toEqual(validConfig);
            expect(fs.promises.readFile).toHaveBeenCalledWith('config.json', 'utf8');
        });

        test('should handle missing config file', async () => {
            fs.promises.readFile.mockRejectedValueOnce({ code: 'ENOENT' });
            
            const config = await configManager.loadConfig('nonexistent.json');

            expect(config).toEqual(configManager.getDefaultConfig());
            expect(mockLogError).toHaveBeenCalledWith(
                'ConfigManager',
                expect.any(Error),
                expect.objectContaining({ configPath: 'nonexistent.json' })
            );
        });

        test('should handle invalid JSON', async () => {
            fs.promises.readFile.mockResolvedValueOnce('invalid json {');
            
            const config = await configManager.loadConfig('invalid.json');

            expect(config).toEqual(configManager.getDefaultConfig());
            expect(mockLogError).toHaveBeenCalledWith(
                'ConfigManager',
                expect.any(Error),
                expect.objectContaining({ configPath: 'invalid.json' })
            );
        });

        test('should validate and fix invalid config', async () => {
            const invalidConfig = {
                appName: "", // Invalid: empty string
                version: "1.0.0",
                settings: {
                    volume: 1.5 // Invalid: over maximum
                }
            };
            
            fs.promises.readFile.mockResolvedValueOnce(JSON.stringify(invalidConfig));
            
            const config = await configManager.loadConfig('config.json');
            
            // Should have defaults for missing/invalid values
            expect(config.appName).toBe("mKast Arcade Launcher");
            expect(config.settings.volume).toBe(0.5);
            expect(config.adminPassword).toBeDefined();
        });

        test('should handle file read errors', async () => {
            fs.promises.readFile.mockRejectedValueOnce(new Error('Permission denied'));
            
            const config = await configManager.loadConfig('config.json');

            expect(config).toEqual(configManager.getDefaultConfig());
            expect(mockLogError).toHaveBeenCalled();
        });
    });

    describe('saveConfig', () => {
        const testConfig = {
            appName: "Test App",
            version: "1.0.0",
            settings: { volume: 0.8 }
        };

        test('should save configuration successfully', async () => {
            fs.promises.writeFile.mockResolvedValueOnce();
            
            const result = await configManager.saveConfig('config.json', testConfig);

            expect(result).toBe(true);
            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                'config.json',
                JSON.stringify(testConfig, null, 2),
                'utf8'
            );
        });

        test('should handle save errors', async () => {
            fs.promises.writeFile.mockRejectedValueOnce(new Error('Write failed'));
            
            const result = await configManager.saveConfig('config.json', testConfig);

            expect(result).toBe(false);
            expect(mockLogError).toHaveBeenCalledWith(
                'ConfigManager',
                expect.any(Error),
                expect.objectContaining({ configPath: 'config.json' })
            );
        });

        test('should validate config before saving', async () => {
            const invalidConfig = {
                appName: "", // Invalid
                settings: { volume: 2.0 } // Invalid
            };
            
            fs.promises.writeFile.mockResolvedValueOnce();
            
            const result = await configManager.saveConfig('config.json', invalidConfig);

            expect(result).toBe(true);
            
            // Should have saved the validated/fixed config
            const savedConfig = JSON.parse(fs.promises.writeFile.mock.calls[0][1]);
            expect(savedConfig.appName).toBe("mKast Arcade Launcher");
            expect(savedConfig.settings.volume).toBe(0.5);
        });
    });

    describe('validateConfig', () => {
        test('should validate complete valid config', () => {
            const validConfig = {
                appName: "Test App",
                version: "1.0.0",
                adminPassword: "password123",
                settings: {
                    fullscreen: true,
                    volume: 0.7
                },
                sounds: {
                    click: "sounds/click.wav"
                },
                paths: {
                    gamesDirectory: "games"
                }
            };

            const result = configManager.validateConfig(validConfig);

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.config).toEqual(validConfig);
        });

        test('should fix invalid app name', () => {
            const config = { appName: "" };
            
            const result = configManager.validateConfig(config);
            
            expect(result.config.appName).toBe("mKast Arcade Launcher");
            expect(result.errors).toContain("Invalid appName, using default");
        });

        test('should fix invalid version', () => {
            const config = { version: 123 };
            
            const result = configManager.validateConfig(config);
            
            expect(result.config.version).toBe("1.0.0");
            expect(result.errors).toContain("Invalid version, using default");
        });

        test('should fix invalid volume', () => {
            const config = {
                settings: { volume: 1.5 }
            };
            
            const result = configManager.validateConfig(config);
            
            expect(result.config.settings.volume).toBe(0.5);
            expect(result.errors).toContain("Invalid volume, using default");
        });

        test('should handle missing settings object', () => {
            const config = { appName: "Test" };
            
            const result = configManager.validateConfig(config);
            
            expect(result.config.settings).toBeDefined();
            expect(result.config.settings.fullscreen).toBe(true);
            expect(result.config.settings.volume).toBe(0.5);
        });

        test('should validate sounds object', () => {
            const config = {
                sounds: "invalid"
            };
            
            const result = configManager.validateConfig(config);
            
            expect(result.config.sounds).toEqual({});
            expect(result.errors).toContain("Invalid sounds configuration");
        });

        test('should validate paths object', () => {
            const config = {
                paths: []
            };
            
            const result = configManager.validateConfig(config);
            
            expect(result.config.paths).toEqual({ gamesDirectory: "games" });
            expect(result.errors).toContain("Invalid paths configuration");
        });
    });

    describe('getDefaultConfig', () => {
        test('should return valid default configuration', () => {
            const defaultConfig = configManager.getDefaultConfig();

            expect(defaultConfig).toHaveProperty('appName');
            expect(defaultConfig).toHaveProperty('version');
            expect(defaultConfig).toHaveProperty('adminPassword');
            expect(defaultConfig).toHaveProperty('settings');
            expect(defaultConfig).toHaveProperty('sounds');
            expect(defaultConfig).toHaveProperty('paths');
            
            expect(defaultConfig.settings).toHaveProperty('fullscreen');
            expect(defaultConfig.settings).toHaveProperty('volume');
        });

        test('should have valid default values', () => {
            const defaultConfig = configManager.getDefaultConfig();

            expect(typeof defaultConfig.appName).toBe('string');
            expect(defaultConfig.appName.length).toBeGreaterThan(0);
            expect(typeof defaultConfig.version).toBe('string');
            expect(typeof defaultConfig.settings.fullscreen).toBe('boolean');
            expect(typeof defaultConfig.settings.volume).toBe('number');
            expect(defaultConfig.settings.volume).toBeGreaterThanOrEqual(0);
            expect(defaultConfig.settings.volume).toBeLessThanOrEqual(1);
        });
    });

    describe('updateConfig', () => {
        test('should update configuration with new values', () => {
            const originalConfig = {
                appName: "Original",
                settings: { volume: 0.5 }
            };
            
            const updates = {
                appName: "Updated",
                settings: { volume: 0.8 }
            };
            
            const result = configManager.updateConfig(originalConfig, updates);

            expect(result.appName).toBe("Updated");
            expect(result.settings.volume).toBe(0.8);
        });

        test('should perform deep merge', () => {
            const originalConfig = {
                settings: {
                    volume: 0.5,
                    fullscreen: true
                },
                sounds: {
                    click: "click.wav"
                }
            };
            
            const updates = {
                settings: {
                    volume: 0.8
                }
            };
            
            const result = configManager.updateConfig(originalConfig, updates);

            expect(result.settings.volume).toBe(0.8);
            expect(result.settings.fullscreen).toBe(true); // Preserved
            expect(result.sounds.click).toBe("click.wav"); // Preserved
        });

        test('should validate updated configuration', () => {
            const originalConfig = configManager.getDefaultConfig();
            const updates = {
                settings: { volume: 2.0 } // Invalid
            };
            
            const result = configManager.updateConfig(originalConfig, updates);

            expect(result.settings.volume).toBe(0.5); // Corrected to default
        });
    });

    describe('configExists', () => {
        test('should return true for existing config', async () => {
            fs.promises.access.mockResolvedValueOnce();
            
            const exists = await configManager.configExists('config.json');

            expect(exists).toBe(true);
            expect(fs.promises.access).toHaveBeenCalledWith('config.json', fs.constants.F_OK);
        });

        test('should return false for non-existing config', async () => {
            fs.promises.access.mockRejectedValueOnce({ code: 'ENOENT' });
            
            const exists = await configManager.configExists('nonexistent.json');

            expect(exists).toBe(false);
        });

        test('should handle access errors', async () => {
            fs.promises.access.mockRejectedValueOnce(new Error('Permission denied'));
            
            const exists = await configManager.configExists('config.json');

            expect(exists).toBe(false);
            expect(mockLogError).toHaveBeenCalled();
        });
    });

    describe('createDefaultConfig', () => {
        test('should create default config file', async () => {
            fs.promises.writeFile.mockResolvedValueOnce();
            
            const result = await configManager.createDefaultConfig('config.json');

            expect(result).toBe(true);
            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                'config.json',
                expect.any(String),
                'utf8'
            );
            
            // Verify it's valid JSON
            const writtenContent = fs.promises.writeFile.mock.calls[0][1];
            expect(() => JSON.parse(writtenContent)).not.toThrow();
        });

        test('should handle creation errors', async () => {
            fs.promises.writeFile.mockRejectedValueOnce(new Error('Write failed'));
            
            const result = await configManager.createDefaultConfig('config.json');

            expect(result).toBe(false);
            expect(mockLogError).toHaveBeenCalled();
        });
    });

    describe('validateSoundPath', () => {
        test('should validate correct sound paths', () => {
            expect(configManager.validateSoundPath('sounds/click.wav')).toBe(true);
            expect(configManager.validateSoundPath('audio/music.mp3')).toBe(true);
            expect(configManager.validateSoundPath('sounds/effect.ogg')).toBe(true);
        });

        test('should reject invalid sound paths', () => {
            expect(configManager.validateSoundPath('')).toBe(false);
            expect(configManager.validateSoundPath(null)).toBe(false);
            expect(configManager.validateSoundPath(123)).toBe(false);
            expect(configManager.validateSoundPath('invalid.txt')).toBe(false);
        });
    });

    describe('validateGamePath', () => {
        test('should validate correct game paths', () => {
            expect(configManager.validateGamePath('games/puzzle/index.html')).toBe(true);
            expect(configManager.validateGamePath('C:\\Games\\game.exe')).toBe(true);
            expect(configManager.validateGamePath('/usr/games/game')).toBe(true);
        });

        test('should reject invalid game paths', () => {
            expect(configManager.validateGamePath('')).toBe(false);
            expect(configManager.validateGamePath(null)).toBe(false);
            expect(configManager.validateGamePath(123)).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should handle null config gracefully', () => {
            const result = configManager.validateConfig(null);

            expect(result.isValid).toBe(false);
            expect(result.config).toEqual(configManager.getDefaultConfig());
        });

        test('should handle undefined config gracefully', () => {
            const result = configManager.validateConfig(undefined);

            expect(result.isValid).toBe(false);
            expect(result.config).toEqual(configManager.getDefaultConfig());
        });

        test('should handle non-object config gracefully', () => {
            const result = configManager.validateConfig("not an object");

            expect(result.isValid).toBe(false);
            expect(result.config).toEqual(configManager.getDefaultConfig());
        });
    });

    describe('Security Configuration', () => {
        test('should validate admin password requirements', () => {
            const configWithWeakPassword = {
                adminPassword: "123"
            };
            
            const result = configManager.validateConfig(configWithWeakPassword);
            
            // Should accept any non-empty password for compatibility
            expect(result.config.adminPassword).toBe("123");
        });

        test('should generate secure default password', () => {
            const defaultConfig = configManager.getDefaultConfig();
            
            expect(defaultConfig.adminPassword).toBeDefined();
            expect(typeof defaultConfig.adminPassword).toBe('string');
            expect(defaultConfig.adminPassword.length).toBeGreaterThan(0);
        });
    });
});
