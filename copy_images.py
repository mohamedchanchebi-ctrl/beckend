import os
import shutil
import glob

artifact_dir = r"C:\Users\MSI\.gemini\antigravity\brain\4edbdb0a-aaf4-46cb-8ff2-7666a7bf12a9"
dest_dir = r"c:\Users\MSI\Desktop\backend\frontend\public\images"

os.makedirs(dest_dir, exist_ok=True)

patterns = {
    "cyberpunk_cat": "cyberpunk_cat_*.png",
    "holographic_skull": "holographic_skull_*.png",
    "vaporwave_sunset": "vaporwave_sunset_*.png",
    "cute_astronaut": "cute_astronaut_*.png",
    "minimalist_coffee": "minimalist_coffee_*.png"
}

for name, pattern in patterns.items():
    files = glob.glob(os.path.join(artifact_dir, pattern))
    if files:
        # Take the most recent one if multiple
        latest_file = max(files, key=os.path.getmtime)
        dest_path = os.path.join(dest_dir, f"{name}.png")
        shutil.copy2(latest_file, dest_path)
        print(f"Copied {latest_file} -> {dest_path}")
    else:
        print(f"File not found for pattern {pattern}")
