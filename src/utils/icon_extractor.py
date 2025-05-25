#!/usr/bin/env python3
"""Icon extraction utility for mKast Game Launcher."""

import os
import win32api
import win32ui
import win32con
import win32gui
from PIL import Image

def extract_icon_from_exe(exe_path):
    """Extract icon from an executable file and save it to assets/game_images."""
    try:
        # Create game_images directory if it doesn't exist
        if not os.path.exists("assets/game_images"):
            os.makedirs("assets/game_images")
            
        # Generate a filename based on the exe name
        exe_name = os.path.splitext(os.path.basename(exe_path))[0]
        icon_path = os.path.join("assets/game_images", f"{exe_name}_icon.png")
        
        # Check if we've already extracted this icon
        if os.path.exists(icon_path):
            return icon_path
            
        # Get the large icon
        ico_x = win32api.GetSystemMetrics(win32con.SM_CXICON)
        ico_y = win32api.GetSystemMetrics(win32con.SM_CYICON)
        
        large_icon = win32ui.CreateIconFromHandle(
            win32api.ExtractIconEx(exe_path, 0)[0],
            (ico_x, ico_y)
        )
        
        # Create a bitmap to draw the icon on
        hdc = win32ui.CreateDCFromHandle(win32gui.GetDC(0))
        hbmp = win32ui.CreateBitmap()
        hbmp.CreateCompatibleBitmap(hdc, ico_x, ico_y)
        hdc = hdc.CreateCompatibleDC()
        
        # Draw the icon onto the bitmap
        hdc.SelectObject(hbmp)
        hdc.DrawIcon((0, 0), large_icon.GetHandle())
        
        # Convert the bitmap to a PIL Image and save it
        bmpinfo = hbmp.GetInfo()
        bmpstr = hbmp.GetBitmapBits(True)
        img = Image.frombuffer(
            "RGBA",
            (bmpinfo["bmWidth"], bmpinfo["bmHeight"]),
            bmpstr, "raw", "BGRA", 0, 1
        )
        
        # Save the image
        img.save(icon_path)
        
        # Clean up resources
        win32gui.DestroyIcon(large_icon.GetHandle())
        
        return icon_path
        
    except Exception as e:
        print(f"Error extracting icon from {exe_path}: {e}")
        return None
