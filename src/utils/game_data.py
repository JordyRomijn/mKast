#!/usr/bin/env python3
"""Game data management utilities for mKast Game Launcher."""

import os
import json

def load_games(games_file='games.json'):
    """Load games data from file or create default if not found."""
    try:
        with open(games_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Games file {games_file} not found. Creating default games file...")
        default_games = {"games": []}
        with open(games_file, 'w') as f:
            json.dump(default_games, f, indent=4)
        return default_games

def save_games(games_data, games_file='games.json'):
    """Save games data to file."""
    with open(games_file, 'w') as f:
        json.dump(games_data, f, indent=4)

def save_game_image(image_path):
    """Copy a game image to assets/game_images directory."""
    if not image_path:
        return None
        
    # Create game_images directory if it doesn't exist
    if not os.path.exists("assets/game_images"):
        os.makedirs("assets/game_images")
    
    # Get filename from path
    filename = os.path.basename(image_path)
    destination = os.path.join("assets/game_images", filename)
    
    # Copy the file (simple copy operation)
    try:
        # Read source image
        with open(image_path, 'rb') as src:
            image_data = src.read()
            
        # Write to destination
        with open(destination, 'wb') as dest:
            dest.write(image_data)
            
        return os.path.join("assets/game_images", filename)
    except Exception as e:
        print(f"Error copying image: {e}")
        return None
