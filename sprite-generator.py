import os
from PIL import Image
import concurrent.futures

output_folder = "/Users/jonatan/Downloads/misc/TREEVERSEZIP/spritesheets"
parent_folder = "/Users/jonatan/Downloads/misc/TREEVERSEZIP/Extracted/"
max_iterations = 50  # Change this to 0 to iterate through all folders.
batch_size = 2
frame_width = 64
frame_height = 64
frames_per_row = 10  # Number of frames per row in the spritesheet

iteration = 0
batch_count = 0

child_folders = os.listdir(parent_folder)

def process_folder(folder):
    folder_path = os.path.join(parent_folder, folder)
    if os.path.isdir(folder_path):
        folder_name = os.path.basename(folder_path)

        # Read the animation frames in the child ID folder
        frames = [f for f in os.listdir(folder_path) if f.endswith(".png")]
        frames.sort()  # Sort frames by their names

        # Calculate the spritesheet dimensions
        num_frames = len(frames)
        num_columns = frames_per_row
        num_rows = (num_frames + num_columns - 1) // num_columns
        sheet_width = num_columns * frame_width
        sheet_height = num_rows * frame_height

        # Create a new blank spritesheet image
        spritesheet = Image.new("RGBA", (sheet_width, sheet_height))

        # Load and paste each frame onto the spritesheet
        for i, frame in enumerate(frames):
            frame_path = os.path.join(folder_path, frame)
            image = Image.open(frame_path)

            row = i // num_columns
            column = i % num_columns
            x = column * frame_width
            y = row * frame_height
            spritesheet.paste(image, (x, y))

        # Save the spritesheet as PNG
        spritesheet_name = f"{folder_name}.png"
        spritesheet_path = os.path.join(output_folder, spritesheet_name)

        # Apply image compression with a desired quality level (0-100, higher value means better quality)
        spritesheet.save(spritesheet_path, optimize=True, quality=100)

        global iteration, batch_count
        iteration += 1
        if iteration % batch_size == 0:
            batch_count += 1
        if max_iterations > 0 and batch_count == max_iterations:
            return None

def process_folders():
    print("Generating spritesheets...")
    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = executor.map(process_folder, child_folders)
        for result in results:
            if result is None:
                break
    print("Spritesheets generated successfully.")

process_folders()
