import re
import sys

def convert_to_instance_mode(script):
    # Replace 'let' with 'this.' for global variables
    script = re.sub(r'let (\w+) =', r'this.\1 =', script)
    # Replace 'function' with 'self.' for function definitions
    script = re.sub(r'function (\w+)\((.*)\) {', r'self.\1 = function(\2) {', script)
    # Fix missing 'self.' in function calls and global variable references
    script = re.sub(r'([^.\w])selectedTiles', r'\1self.selectedTiles', script)
    script = re.sub(r'([^.\w])reload', r'\1self.reload', script)
    script = re.sub(r'([^.\w])colorChangeFrameInterval', r'\1self.colorChangeFrameInterval', script)
    # Replace 'class' with 'function' and create object instance at the end
    script = script.replace('class Sketch {', 'function Sketch() {')
    script += '\n\nconst self = this;' # Add this line to define 'self'
    script += '\n\nconst sketch = new self.Sketch();' # Instantiate the Sketch function
    return script

if len(sys.argv) < 2:
    print("Usage: python convert_to_instance_mode.py <file_path> [<file_path> ...]")
    sys.exit(1)

for file_path in sys.argv[1:]:
    try:
        with open(file_path, 'r') as file:
            p5_script = file.read()
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        continue

    instance_mode_script = convert_to_instance_mode(p5_script)

    output_file_path = file_path.replace('.js', '_instance.js')
    with open(output_file_path, 'w') as file:
        file.write(instance_mode_script)

    print(f"Conversion successful. Instance mode script saved as '{output_file_path}'")
