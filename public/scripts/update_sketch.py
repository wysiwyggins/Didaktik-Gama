import re

def update_sketch_with_globals(globals_js_path, sketch_js_path, output_path):
    # Extract variable names from globals.js
    variable_names = []
    capturing = False
    with open(globals_js_path, 'r') as file:
        for line in file:
            # Check if we are within the globalVars object
            if 'globalVars = {' in line:
                capturing = True
            elif '};' in line and capturing:
                capturing = False
            
            # Capture variable names within the globalVars object
            if capturing and ':' in line:
                var_name = line.split(':')[0].strip()
                if var_name not in variable_names:
                    variable_names.append(var_name)

    print("Variable names extracted:", variable_names)

    # Read the entire sketch file
    with open(sketch_js_path, 'r') as file:
        sketch_content = file.read()

    # Replace each variable name in the sketch with its global reference
    replacements = {}
    for var_name in variable_names:
        if var_name in sketch_content:
            new_reference = f'globalVars.{var_name}'
            sketch_content = sketch_content.replace(var_name, new_reference)
            replacements[var_name] = new_reference

    print("Replacements made:", replacements)

    # Write the updated content to a new file
    with open(output_path, 'w') as file:
        file.write(sketch_content)

    print(f"Updated {sketch_js_path} with global variables from {globals_js_path}")

# Example usage
globals_js_path = 'globals.js'
sketch_js_path = 'patterns.js'
output_path = 'patterns_updated.js'

update_sketch_with_globals(globals_js_path, sketch_js_path, output_path)
