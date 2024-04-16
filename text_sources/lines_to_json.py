import json

def txt_to_json(txt_file_path, json_file_path):
    # Read lines from the text file
    with open(txt_file_path, 'r', encoding='utf-8') as file:
        lines = [line.strip() for line in file if line.strip()]  # Remove any extra whitespace and skip empty lines

    # Prepare the dictionary to be written into JSON
    data = {'poetryLines': lines}

    # Write to a JSON file
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4)


txt_file_path = 'corpus/saved_lines.txt'  # Replace with the path to your text file
json_file_path = '../public/data/texts/poemLines.json'  # Replace with your desired output path
txt_to_json(txt_file_path, json_file_path)
