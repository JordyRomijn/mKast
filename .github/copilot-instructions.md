<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# mKast Arcade Launcher - Copilot Instructions

## Project Context
This is an Electron-based arcade game launcher designed for Windows arcade cabinets with kiosk/fullscreen functionality and retro gaming aesthetics.

## Key Requirements
- **Fullscreen/Kiosk Mode**: Always fullscreen, prevent user exit without password
- **Retro Gaming Aesthetic**: Neon colors, pixel fonts, 80s/90s arcade styling
- **Security**: Password-protected exit and admin functions
- **Arcade Hardware Integration**: Keyboard navigation for joystick compatibility

## Code Style Guidelines
- Use ES6+ JavaScript features
- Follow retro gaming naming conventions (ALL_CAPS for titles/buttons)  
- Implement smooth animations and visual effects
- Ensure responsive design for various screen sizes
- Add sound effect placeholders for future audio integration

## Security Considerations
- All system shortcuts must be disabled
- No context menus or developer tools in production
- Password verification through IPC communication
- Prevent window closing/minimizing

## File Structure
- `main.js`: Electron main process with security configurations
- `renderer.js`: Frontend logic with game management
- `styles.css`: Retro arcade styling with neon effects
- `index.html`: Main UI structure with modals

## Development Preferences
- Prioritize visual effects and animations
- Use CSS Grid/Flexbox for layouts
- Implement keyboard navigation patterns
- Add comprehensive error handling
- Comment complex arcade-specific functionality

## Browser Compatibility
Target modern Chromium (Electron) features only - no legacy browser support needed.
