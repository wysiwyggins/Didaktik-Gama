import sys
import re
import string

import re

def clean_text(text):
    
    # Convert to lowercase
    #text = text.lower()
    
    # Replace various sentence-ending punctuation with a period followed by a single space
    text = re.sub(r'\.\s+', '. ' , text)
    text = re.sub(r'\?\s+', '? ', text)
    text = re.sub(r'!\s+', '! ', text)
    text = re.sub(r'[^\w\s.?!]', ' ', text)
    text = re.sub(r'[1234567890]', ' ', text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def main(input_file_path, output_file_path):
    # Read the input file
    try:
        with open(input_file_path, 'r', encoding='utf-8') as file:
            text = file.read()
    except FileNotFoundError:
        print(f"Error: The file {input_file_path} was not found.")
        sys.exit(1)
    
    # Clean the text
    cleaned_text = clean_text(text)
    
    # Write the cleaned text to the specified output file
    with open(output_file_path, 'w', encoding='utf-8') as output_file:
        output_file.write(cleaned_text)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python clean_text.py <input_file_path> <output_file_path>")
        sys.exit(1)
    
    input_file_path = sys.argv[1]
    output_file_path = sys.argv[2]
    main(input_file_path, output_file_path)
