# mKast Arcade Launcher

Een retro-stijl game launcher speciaal ontworpen voor arcade kasten, gebouwd met Electron.

## Features

### 🎮 Core Functionaliteit
- **Fullscreen Kiosk Mode** - Volledig scherm zonder mogelijkheid om te sluiten
- **Retro Gaming UI** - Neon kleuren, pixel fonts, en 80s/90s arcade esthetiek
- **Game Grid** - Overzichtelijke weergave van beschikbare games
- **Keyboard Navigation** - Navigatie met pijltjestoetsen voor arcade joysticks

### 🔐 Beveiliging
- **Wachtwoord Exit** - Alleen met juist wachtwoord (`arcade2025`) kan de app afgesloten worden
- **Admin Panel** - Beveiligd admin panel (`admin123`) voor beheer
- **Kiosk Protection** - Alle system shortcuts zijn uitgeschakeld
- **No Cursor** - Cursor wordt verborgen voor volledige kiosk ervaring

### ⚙️ Admin Functies
- Games toevoegen/bewerken
- Statistieken bekijken
- Systeem instellingen
- Wachtwoorden wijzigen

### 🎨 Visual Effects
- Animerende sterren achtergrond
- Grid overlay effect
- Neon glow effecten
- Smooth hover animaties
- Loading screens met retro styling

## Installatie

```bash
# Dependencies installeren
npm install

# Development mode
npm run dev

# Production build
npm run build-win
```

## Development

### Project Structuur
```
mKastElectron/
├── main.js          # Electron main process
├── index.html       # Main UI
├── styles.css       # Retro styling
├── renderer.js      # Frontend logic
├── package.json     # Project config
└── README.md        # This file
```

### Configuratie

#### Wachtwoorden wijzigen
In `main.js`:
```javascript
// Exit wachtwoord
const correctPassword = 'arcade2025';

// Admin wachtwoord  
const adminPassword = 'admin123';
```

#### Games toevoegen
In `renderer.js` pas de `games` array aan:
```javascript
{
    id: 7,
    title: "NIEUWE GAME",
    description: "Game beschrijving...",  
    genre: "GENRE",
    executable: "game.exe",
    image: "games/game.jpg"
}
```

## Gebruik

1. **Start de app**: `npm start`
2. **Navigatie**: Gebruik muis of pijltjestoetsen
3. **Game selecteren**: Klik op game card of druk Enter
4. **Admin toegang**: Klik ADMIN knop, voer wachtwoord in
5. **Afsluiten**: Klik EXIT knop, voer wachtwoord in

## Arcade Kast Integratie

### Hardware Vereisten
- Windows PC (Windows 10/11 recommended)
- Monitor (1920x1080 of hoger)
- Arcade joystick/buttons met keyboard encoder
- Speakers voor geluid

### Setup voor Arcade Kast
1. Install als Windows service voor auto-start
2. Configureer Windows om direct naar launcher te gaan
3. Schakel Windows updates en notificaties uit
4. Test alle joystick inputs

### Joystick Mapping
- **Pijltjes**: Navigatie door games
- **Button 1**: Selecteren/Bevestigen  
- **Button 2**: Terug/Annuleren
- **Admin combo**: Speciale knop combinatie voor admin access

## Customization

### Styling Aanpassen
Bewerk `styles.css` voor:
- Kleuren schema (standaard: groen/cyan/roze neon)
- Fonts (standaard: Orbitron)
- Animatie snelheden
- Layout aanpassingen

### Sound Effects
Voeg audio bestanden toe en bewerk `renderer.js`:
```javascript
function playHoverSound() {
    const audio = new Audio('sounds/hover.wav');
    audio.play();
}
```

### Game Launch Integration
Pas `launchGame()` functie aan in `renderer.js` om echte games te starten:
```javascript
const { spawn } = require('child_process');
const gameProcess = spawn(selectedGame.executable);
```

## Security Notes

⚠️ **Belangrijk voor productie gebruik:**
- Wijzig standaard wachtwoorden
- Test alle security features
- Overweeg encrypted password storage
- Regular security updates

## Troubleshooting

### App sluit niet af
- Gebruik Task Manager als laatste redmiddel
- Check of exit wachtwoord correct is
- Herstart PC als app vastloopt

### Fullscreen issues
- Check display settings
- Mogelijk conflict met andere fullscreen apps
- Test op target hardware

### Games lanceren niet
- Controleer executable paths
- Verify game compatibility
- Check file permissions

## License

MIT License - Zie LICENSE bestand voor details.

## Support

Voor vragen of problemen:
1. Check troubleshooting sectie
2. Bekijk console logs (`Ctrl+Shift+I` in dev mode)
3. Create issue op GitHub repository
