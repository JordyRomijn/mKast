// Configuration Manager Module
class ConfigManager {
    constructor() {
        this.config = null;
        this.defaultConfig = {
            security: {
                exitPassword: "arcade2025",
                adminPassword: "admin123"
            },
            display: { 
                cursorMode: 'auto',
                fullscreen: true
            },
            branding: { 
                instituteName: 'Haagse Hogeschool',
                projectName: 'mKast Arcade Launcher',
                version: '1.0.0'
            },
            sounds: {
                enabled: true,
                volume: 0.7
            }
        };
    }

    // Load configuration from main process
    async loadConfig() {
        try {
            this.config = await ipcRenderer.invoke('get-config');
            
            // Validate configuration
            const configErrors = this.validateConfig(this.config);
            if (configErrors.length > 0) {
                console.warn('Configuration validation errors:', configErrors);
                // Could show admin notification about config issues
            }
            
            return this.config;
        } catch (error) {
            console.error('LoadConfig error:', error);
            // Use fallback config
            this.config = { ...this.defaultConfig };
            return this.config;
        }
    }

    // Save configuration to main process
    async saveConfig(newConfig) {
        try {
            this.config = { ...this.config, ...newConfig };
            const result = await ipcRenderer.invoke('save-config', this.config);
            return result;
        } catch (error) {
            console.error('SaveConfig error:', error);
            return false;
        }
    }

    // Validate configuration structure and values
    validateConfig(config) {
        const required = {
            'security.exitPassword': 'string',
            'security.adminPassword': 'string',
            'branding.instituteName': 'string',
            'branding.projectName': 'string',
            'display.fullscreen': 'boolean'
        };
        
        const errors = [];
        
        for (const [path, type] of Object.entries(required)) {
            const value = this.getNestedProperty(config, path);
            if (value === undefined) {
                errors.push(`Missing required config: ${path}`);
            } else if (typeof value !== type) {
                errors.push(`Invalid type for ${path}: expected ${type}, got ${typeof value}`);
            }
        }
        
        // Password strength validation
        if (config.security?.exitPassword && config.security.exitPassword.length < 6) {
            errors.push('Exit password must be at least 6 characters');
        }
        
        if (config.security?.adminPassword && config.security.adminPassword.length < 6) {
            errors.push('Admin password must be at least 6 characters');
        }
        
        // Volume validation
        if (config.sounds?.volume !== undefined) {
            const volume = config.sounds.volume;
            if (typeof volume !== 'number' || volume < 0 || volume > 1) {
                errors.push('Sound volume must be a number between 0 and 1');
            }
        }
        
        return errors;
    }

    // Get nested property using dot notation
    getNestedProperty(obj, path) {
        return path.split('.').reduce((o, p) => o?.[p], obj);
    }

    // Set nested property using dot notation
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((o, k) => {
            if (!(k in o)) o[k] = {};
            return o[k];
        }, obj);
        target[lastKey] = value;
    }

    // Get current configuration
    getConfig() {
        return this.config;
    }

    // Get specific configuration value
    get(path, defaultValue = undefined) {
        const value = this.getNestedProperty(this.config, path);
        return value !== undefined ? value : defaultValue;
    }

    // Set specific configuration value
    async set(path, value) {
        const newConfig = { ...this.config };
        this.setNestedProperty(newConfig, path, value);
        return await this.saveConfig(newConfig);
    }

    // Update multiple configuration values
    async update(updates) {
        const newConfig = { ...this.config };
        
        for (const [path, value] of Object.entries(updates)) {
            this.setNestedProperty(newConfig, path, value);
        }
        
        return await this.saveConfig(newConfig);
    }

    // Password management
    async updateExitPassword(newPassword) {
        if (newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        
        return await this.set('security.exitPassword', newPassword);
    }

    async updateAdminPassword(newPassword) {
        if (newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        
        return await this.set('security.adminPassword', newPassword);
    }

    // Display settings
    async updateCursorMode(mode) {
        const validModes = ['auto', 'none', 'hidden'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid cursor mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
        }
        
        return await this.set('display.cursorMode', mode);
    }

    async updateFullscreenMode(enabled) {
        return await this.set('display.fullscreen', Boolean(enabled));
    }

    // Sound settings
    async updateSoundSettings(enabled, volume = null) {
        const updates = {
            'sounds.enabled': Boolean(enabled)
        };
        
        if (volume !== null) {
            if (typeof volume !== 'number' || volume < 0 || volume > 1) {
                throw new Error('Volume must be a number between 0 and 1');
            }
            updates['sounds.volume'] = volume;
        }
        
        return await this.update(updates);
    }

    // Branding settings
    async updateBranding(instituteName, projectName) {
        return await this.update({
            'branding.instituteName': instituteName,
            'branding.projectName': projectName
        });
    }

    // Reset configuration to defaults
    async resetToDefaults() {
        this.config = { ...this.defaultConfig };
        return await this.saveConfig(this.config);
    }

    // Export configuration for backup
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }

    // Import configuration from backup
    async importConfig(configJson) {
        try {
            const importedConfig = JSON.parse(configJson);
            const errors = this.validateConfig(importedConfig);
            
            if (errors.length > 0) {
                throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
            }
            
            return await this.saveConfig(importedConfig);
        } catch (error) {
            throw new Error(`Failed to import configuration: ${error.message}`);
        }
    }

    // Get configuration schema for forms
    getConfigSchema() {
        return {
            security: {
                exitPassword: { type: 'password', label: 'Exit Wachtwoord', minLength: 6 },
                adminPassword: { type: 'password', label: 'Admin Wachtwoord', minLength: 6 }
            },
            display: {
                cursorMode: { 
                    type: 'select', 
                    label: 'Cursor Modus',
                    options: [
                        { value: 'auto', label: 'Automatisch' },
                        { value: 'none', label: 'Verborgen' },
                        { value: 'hidden', label: 'Volledig verborgen' }
                    ]
                },
                fullscreen: { type: 'checkbox', label: 'Volledig scherm' }
            },
            sounds: {
                enabled: { type: 'checkbox', label: 'Geluid inschakelen' },
                volume: { type: 'range', label: 'Volume', min: 0, max: 1, step: 0.1 }
            },
            branding: {
                instituteName: { type: 'text', label: 'Instituut Naam' },
                projectName: { type: 'text', label: 'Project Naam' }
            }
        };
    }
}

// Export for use in main renderer and testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
} else {
    window.ConfigManager = ConfigManager;
}
