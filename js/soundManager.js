// Sound Manager Module
class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.7;
        this.soundsCache = new Map();
    }

    // Initialize sound system
    initialize(config) {
        if (config && config.sounds) {
            this.enabled = config.sounds.enabled || true;
            this.volume = config.sounds.volume || 0.7;
        }
    }

    // Load sound file into cache
    async loadSound(name, path) {
        try {
            if (this.soundsCache.has(name)) {
                return this.soundsCache.get(name);
            }

            const audio = new Audio(path);
            audio.volume = this.volume;
            audio.preload = 'auto';
            
            this.soundsCache.set(name, audio);
            return audio;
        } catch (error) {
            console.warn(`Failed to load sound ${name}:`, error);
            return null;
        }
    }

    // Play a specific sound
    async playSound(name) {
        if (!this.enabled) return;

        try {
            const audio = this.soundsCache.get(name);
            if (audio) {
                audio.currentTime = 0; // Reset to start
                await audio.play();
            } else {
                console.log(`🎵 ${name} sound (placeholder)`);
            }
        } catch (error) {
            console.warn(`Failed to play sound ${name}:`, error);
        }
    }

    // Preload common sounds
    async preloadSounds() {
        const commonSounds = [
            { name: 'startup', path: './sounds/startup.wav' },
            { name: 'hover', path: './sounds/hover.wav' },
            { name: 'click', path: './sounds/click.wav' },
            { name: 'select', path: './sounds/select.wav' },
            { name: 'launch', path: './sounds/launch.wav' },
            { name: 'success', path: './sounds/success.wav' },
            { name: 'error', path: './sounds/error.wav' },
            { name: 'shutdown', path: './sounds/shutdown.wav' },
            { name: 'close', path: './sounds/close.wav' }
        ];

        const loadPromises = commonSounds.map(sound => 
            this.loadSound(sound.name, sound.path)
        );

        await Promise.allSettled(loadPromises);
    }

    // Specific sound methods for arcade launcher
    playStartupSound() {
        this.playSound('startup');
    }

    playHoverSound() {
        this.playSound('hover');
    }

    playClickSound() {
        this.playSound('click');
    }

    playSelectSound() {
        this.playSound('select');
    }

    playLaunchSound() {
        this.playSound('launch');
    }

    playSuccessSound() {
        this.playSound('success');
    }

    playErrorSound() {
        this.playSound('error');
    }

    playShutdownSound() {
        this.playSound('shutdown');
    }

    playCloseSound() {
        this.playSound('close');
    }

    // Volume control
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.soundsCache.forEach(audio => {
            audio.volume = this.volume;
        });
    }

    // Mute/unmute
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    // Stop all playing sounds
    stopAllSounds() {
        this.soundsCache.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }
}

// Export for use in main renderer and testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundManager;
} else {
    window.SoundManager = SoundManager;
}
