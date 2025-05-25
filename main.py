#!/usr/bin/env python3
"""
mKast Game Launcher - A customizable game launcher with a retro arcade style interface.

Usage:
  python main.py [games_file]
  python main.py -g games_file

Options:
  -g, --games    Specify a games JSON file to load
"""

import sys
from src.core.game_launcher import GameLauncher

def main():
    """Main entry point for the application."""
    # Check for command line arguments
    games_file = 'games.json'
    if len(sys.argv) > 1:
        # Check for -g or --games argument
        if sys.argv[1] == '-g' or sys.argv[1] == '--games':
            if len(sys.argv) > 2:
                games_file = sys.argv[2]
                print(f"Loading games from: {games_file}")
        else:
            # Assume the first argument is the games file
            games_file = sys.argv[1]
            print(f"Loading games from: {games_file}")
    
    # Create and run the game launcher
    launcher = GameLauncher(games_file)
    return launcher.run()

if __name__ == "__main__":
    sys.exit(main())
