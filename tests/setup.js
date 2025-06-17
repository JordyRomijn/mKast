// Test setup for Jest
// Mock Electron APIs
global.ipcRenderer = {
    invoke: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn()
};

// Mock DOM APIs that might not be available in test environment
global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

global.Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    load: jest.fn(),
    volume: 0.5,
    currentTime: 0,
    duration: 100,
    preload: 'auto'
}));

// Mock console methods for cleaner test output
global.console.log = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();

// Set up DOM environment
document.body.innerHTML = `
    <div id="gamesGrid"></div>
    <div id="notificationContainer"></div>
    <div id="confirmationDialog">
        <div id="confirmationTitle"></div>
        <div id="confirmationMessage"></div>
        <button id="confirmButton">JA</button>
        <button id="cancelButton">NEE</button>
    </div>
    <div id="loadingScreen"></div>
`;

// Mock process.uptime for tests
global.process = {
    ...global.process,
    uptime: jest.fn(() => 3661) // 1 hour, 1 minute, 1 second
};
