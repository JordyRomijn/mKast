#!/usr/bin/env python3
"""Main game launcher class for mKast Game Launcher."""

import os
import sys
import pygame
import subprocess
from pygame.locals import *

from src.utils.config import load_config, ensure_assets_directory
from src.utils.game_data import load_games, save_games
from src.utils.icon_extractor import extract_icon_from_exe
from src.ui.fonts import load_pixel_fonts
from src.ui.images import ImageManager
from src.ui.drawing import DrawingHelpers
from src.core.main_screen import MainScreen
from src.core.admin_panel import AdminPanel
from src.core.password_dialog import PasswordDialog

class GameLauncher:
    """Main Game Launcher class that manages the application."""
    
    def __init__(self, games_file="games.json"):
        """Initialize the game launcher.
        
        Args:
            games_file: Path to the games JSON file
        """
        # Initialize pygame
        pygame.init()
        
        # Ensure assets directories exist
        ensure_assets_directory()
        
        # Load configuration
        self.config = load_config()
        
        # Passwords for access control
        self.admin_password = self.config.get("admin_password", "admin123")
        self.exit_password = self.config.get("exit_password", "exit123")
        
        # Get configured resolution or use default
        configured_resolution = self.config.get("resolution", [1920, 1080])
        self.resolution = (configured_resolution[0], configured_resolution[1])
        
        # Calculate scale factors
        self.scale_x = self.resolution[0] / 1920  # Scale factor for x
        self.scale_y = self.resolution[1] / 1080  # Scale factor for y
        self.scale_min = min(self.scale_x, self.scale_y)  # Minimum scale
        
        # Set up fullscreen window
        os.environ['SDL_VIDEO_WINDOW_POS'] = "0,0"
        fullscreen = self.config.get("fullscreen", True)
        display_mode = pygame.NOFRAME if fullscreen else 0
        self.screen = pygame.display.set_mode(self.resolution, display_mode)
        pygame.display.set_caption("Game Launcher")
        
        # Initialize clock
        self.clock = pygame.time.Clock()
        
        # Get theme colors from config
        theme = self.config.get("theme", {})
        self.colors = {
            'background_color': tuple(theme.get("background_color", [10, 10, 40])),
            'button_color': tuple(theme.get("button_color", [80, 80, 200])),
            'button_hover_color': tuple(theme.get("button_hover_color", [120, 120, 255])),
            'text_color': tuple(theme.get("text_color", [255, 255, 255])),
            'header_color': tuple(theme.get("header_color", [255, 200, 0]))
        }
        
        # Load pixel fonts
        self.fonts = load_pixel_fonts(self.scale_min)
        
        # Create image manager
        self.image_manager = ImageManager(self.scale_min)
        
        # Create drawing helper
        self.drawer = DrawingHelpers(
            screen=self.screen, 
            fonts=self.fonts,
            scale_factors={'x': self.scale_x, 'y': self.scale_y, 'min': self.scale_min}
        )
        
        # Create UI screens
        self.main_screen = MainScreen(
            screen=self.screen,
            resolution=self.resolution,
            drawer=self.drawer,
            image_manager=self.image_manager,
            colors=self.colors,
            fonts=self.fonts
        )
        
        self.admin_panel = AdminPanel(
            screen=self.screen,
            resolution=self.resolution,
            drawer=self.drawer,
            fonts=self.fonts
        )
        
        self.password_dialog = PasswordDialog(
            screen=self.screen,
            resolution=self.resolution,
            drawer=self.drawer,
            fonts=self.fonts
        )
        
        # Application state
        self.state = "main"  # main, admin, password
        self.running = True
        
        # Game data
        self.games_file = games_file
        self.games_data = load_games(games_file)
        self.games = self.games_data.get("games", [])
        
        # Current page for main screen and admin panel
        self.current_page = 0
        self.games_per_page = 8  # Default games per page
    
    def activate_password(self, purpose):
        """Activate the password dialog for admin or exit.
        
        Args:
            purpose: Purpose of password ('admin' or 'exit')
        """
        self.password_dialog.set_purpose(purpose)
        self.state = "password"
    
    def check_password(self):
        """Check if the entered password is correct."""
        password_input = self.password_dialog.get_input()
        
        if self.password_dialog.password_purpose == 'admin' and password_input == self.admin_password:
            self.state = "admin"
            self.admin_panel.admin_edit_mode = False
            self.password_dialog.password_purpose = None
        elif self.password_dialog.password_purpose == 'exit' and password_input == self.exit_password:
            self.running = False
        else:
            # Reset password input for retry
            self.password_dialog.password_input = ""
    
    def launch_game(self, executable_path):
        """Launch a game executable.
        
        Args:
            executable_path: Path to the game executable
        """
        if os.path.exists(executable_path):
            try:
                # Launch the game in a subprocess
                subprocess.Popen([executable_path])
                # Minimize the launcher window (optional)
                pygame.display.iconify()
            except Exception as e:
                print(f"Error launching game: {e}")
    
    def change_page(self, direction):
        """Change the current page for the active screen.
        
        Args:
            direction: Direction to change page (1 for next, -1 for previous)
        """
        if self.state == "main":
            new_page = self.main_screen.current_page + direction
            if 0 <= new_page * self.main_screen.games_per_page < len(self.games):
                self.main_screen.set_current_page(new_page)
        elif self.state == "admin":
            new_page = self.admin_panel.current_page + direction
            if 0 <= new_page * self.admin_panel.games_per_page < len(self.games):
                self.admin_panel.set_current_page(new_page)
    
    def exit_admin_mode(self):
        """Exit admin mode and return to main screen."""
        self.state = "main"
    
    def start_game_edit(self, index):
        """Start editing a game or adding a new game.
        
        Args:
            index: Index of game to edit (-1 for new game)
        """
        if index == -1:
            # New game
            self.admin_panel.set_edit_mode(True, -1)
        else:
            # Edit existing game
            self.admin_panel.set_edit_mode(True, index, self.games[index])
    
    def save_admin_edit(self):
        """Save the edited/new game."""
        form_data = self.admin_panel.admin_form_data
        game = {
            'name': form_data['name'],
            'description': form_data['description'] or "No description",
            'executable_path': form_data['executable_path'],
            'image_path': form_data['image_path'] or ""
        }
        
        if self.admin_panel.admin_edit_index == -1:
            # Add new game
            self.games.append(game)
        else:
            # Update existing game
            self.games[self.admin_panel.admin_edit_index] = game
        
        # Update games.json
        self.games_data['games'] = self.games
        save_games(self.games_data, self.games_file)
        
        # Exit edit mode
        self.admin_panel.set_edit_mode(False)
    
    def delete_game_confirm(self, index):
        """Delete a game after confirmation.
        
        Args:
            index: Index of game to delete
        """
        # Direct deletion implementation
        del self.games[index]
        
        # Update games.json
        self.games_data['games'] = self.games
        save_games(self.games_data, self.games_file)
        
        # Adjust current page if needed
        max_pages = (len(self.games) - 1) // self.games_per_page + 1
        if self.admin_panel.current_page >= max_pages:
            self.admin_panel.current_page = max(0, max_pages - 1)
    
    def handle_events(self):
        """Handle pygame events."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            
            # Handle mouse events
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:  # Left mouse button
                    if self.state == "password":
                        action = self.password_dialog.handle_mouse(
                            event.pos,
                            lambda: self.check_password(),
                            lambda: self.exit_admin_mode()
                        )
                        if action:
                            action()
            
            # Handle keyboard events
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.state == "main":
                        # Require password to exit
                        self.activate_password('exit')
                    elif self.state == "admin":
                        if self.admin_panel.admin_edit_mode:
                            # If a field is active, deactivate it first
                            if self.admin_panel.admin_active_field:
                                # Save current input to form data
                                self.admin_panel.admin_form_data[self.admin_panel.admin_active_field] = self.admin_panel.admin_field_text
                                self.admin_panel.admin_active_field = None
                            else:
                                # Otherwise cancel the edit
                                self.admin_panel.cancel_admin_edit()
                        else:
                            self.state = "main"
                    elif self.state == "password":
                        self.state = "main"
                        
                # Handle password input
                elif self.state == "password":
                    if event.key == pygame.K_RETURN:
                        self.check_password()
                    elif event.key == pygame.K_BACKSPACE:
                        self.password_dialog.remove_char()
                    else:
                        # Only add printable characters
                        if event.unicode.isprintable():
                            self.password_dialog.add_char(event.unicode)
                
                # Handle admin text input
                elif self.state == "admin" and self.admin_panel.admin_edit_mode and self.admin_panel.admin_active_field:
                    if event.key == pygame.K_RETURN:
                        # Save current field content
                        self.admin_panel.admin_form_data[self.admin_panel.admin_active_field] = self.admin_panel.admin_field_text
                        print(f"Field {self.admin_panel.admin_active_field} saved on Enter: {self.admin_panel.admin_field_text}")
                        
                        # Go to next field if available
                        fields = ['name', 'description', 'executable_path', 'image_path']
                        if self.admin_panel.admin_active_field in fields:
                            current_index = fields.index(self.admin_panel.admin_active_field)
                            if current_index < len(fields) - 1:
                                # Go to next field
                                next_field = fields[current_index + 1]
                                self.admin_panel.admin_active_field = next_field
                                self.admin_panel.admin_field_text = self.admin_panel.admin_form_data.get(next_field, '')
                            else:
                                # If this is the last field, deactivate the field
                                self.admin_panel.admin_active_field = None
                        else:
                            # Unknown field, deactivate
                            self.admin_panel.admin_active_field = None
                    elif event.key == pygame.K_BACKSPACE:
                        self.admin_panel.admin_field_text = self.admin_panel.admin_field_text[:-1]
                    else:
                        # Add character to active field
                        if event.unicode.isprintable():
                            self.admin_panel.admin_field_text += event.unicode
    
    def run(self):
        """Main application loop."""
        while self.running:
            # Cap the frame rate
            self.clock.tick(60)
            
            # Handle events
            self.handle_events()
            
            # Draw current state
            if self.state == "main":
                # Main screen
                action = self.main_screen.draw(
                    self.games,
                    lambda: self.activate_password('admin'),
                    lambda: self.activate_password('exit'),
                    self.launch_game,
                    self.change_page
                )
                if action:
                    action()
            elif self.state == "admin":
                # Admin panel
                action = self.admin_panel.draw(
                    self.games,
                    self.exit_admin_mode,
                    self.start_game_edit,
                    self.delete_game_confirm,
                    self.change_page
                )
                if action:
                    action()
            elif self.state == "password":
                # Password dialog
                action = self.password_dialog.draw(
                    lambda: self.check_password(),
                    lambda: self.exit_admin_mode()
                )
                if action:
                    action()
            
            # Update display
            pygame.display.flip()
        
        # Clean up pygame
        pygame.quit()
        
        return 0  # Exit code
