module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    rules: {
        // Code Quality
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-debugger': 'error',
        'no-alert': 'warn',
        
        // Style Consistency
        'indent': ['error', 4, { SwitchCase: 1 }],
        'quotes': ['error', 'single', { allowTemplateLiterals: true }],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'no-trailing-spaces': 'error',
        'eol-last': 'error',
        
        // Best Practices
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'all'],
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-arrow-callback': 'error',
        
        // Error Prevention
        'no-undef': 'error',
        'no-unreachable': 'error',
        'no-duplicate-case': 'error',
        'no-empty': 'error',
        'no-extra-boolean-cast': 'error',
        'no-extra-semi': 'error',
        
        // Arcade-specific Rules
        'max-len': ['warn', { code: 120, ignoreComments: true }],
        'complexity': ['warn', 10],
        'max-depth': ['warn', 4],
        'max-params': ['warn', 5]
    },
    globals: {
        // Electron globals
        'require': 'readonly',
        'module': 'readonly',
        'exports': 'writable',
        '__dirname': 'readonly',
        '__filename': 'readonly',
        
        // Browser globals
        'window': 'readonly',
        'document': 'readonly',
        'localStorage': 'readonly',
        'sessionStorage': 'readonly',
        'console': 'readonly',
        'alert': 'readonly',
        'confirm': 'readonly',
        'prompt': 'readonly',
        
        // Custom globals for arcade launcher
        'config': 'writable',
        'gameManager': 'writable',
        'uiManager': 'writable',
        'soundManager': 'writable',
        'gameLauncher': 'writable',
        'adminPanel': 'writable',
        'keyboardHandler': 'writable',
        'configManager': 'writable',
        'logError': 'readonly',
        'withErrorBoundary': 'readonly',
        'getUserFriendlyErrorMessage': 'readonly',
        
        // Global functions exposed for HTML onclick handlers
        'showAddGameModal': 'readonly',
        'showSettingsModal': 'readonly',
        'showAboutModal': 'readonly',
        'hideModal': 'readonly',
        'launchGame': 'readonly',
        'deleteGameConfirm': 'readonly',
        'saveGame': 'readonly',
        'saveSettings': 'readonly',
        'adminLogin': 'readonly',
        'adminLogout': 'readonly',
        'showAdminPanel': 'readonly',
        'exportGames': 'readonly',
        'importGames': 'readonly',
        'exitApp': 'readonly'
    },
    overrides: [
        {
            // Test files
            files: ['tests/**/*.js'],
            env: {
                jest: true
            },
            rules: {
                'no-console': 'off'
            }
        },
        {
            // Main process files
            files: ['main.js'],
            env: {
                node: true,
                browser: false
            },
            rules: {
                'no-console': 'off'
            }
        },
        {
            // Renderer process files
            files: ['renderer*.js', 'js/**/*.js'],
            env: {
                browser: true,
                node: true
            }
        }
    ]
};
