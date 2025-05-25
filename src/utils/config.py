#!/usr/bin/env python3
"""Configuration utilities for mKast Game Launcher."""

import os
import json

def load_config():
    """Load configuration from config.json or create default if not found."""
    try:
        with open('config.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Config file not found. Creating default config...")
        default_config = {
            "admin_password": "admin123",
            "exit_password": "exit123",
            "fullscreen": True,
            "resolution": [1920, 1080],
            "theme": {
                "background_color": [10, 10, 40],
                "button_color": [80, 80, 200],
                "button_hover_color": [120, 120, 255],
                "text_color": [255, 255, 255],
                "header_color": [255, 200, 0]
            }
        }
        with open('config.json', 'w') as f:
            json.dump(default_config, f, indent=4)
        return default_config

def ensure_assets_directory():
    """Ensure required asset directories exist."""
    # Create main assets directory if it doesn't exist
    if not os.path.exists("assets"):
        os.makedirs("assets")
    
    # Create fonts subdirectory if it doesn't exist
    if not os.path.exists("assets/fonts"):
        os.makedirs("assets/fonts")
    
    # Create game_images subdirectory if it doesn't exist
    if not os.path.exists("assets/game_images"):
        os.makedirs("assets/game_images")
