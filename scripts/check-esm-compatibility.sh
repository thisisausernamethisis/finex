#!/bin/bash
# Shell script for checking ESM compatibility issues
# Scans for CommonJS module patterns that could cause issues in ESM environments

# Exit on error
set -e

# Function for colored output
print_colored() {
  local color_code message
  
  case "$1" in
    "red")    color_code="31" ;;
    "green")  color_code="32" ;;
    "yellow") color_code="33" ;;
    "blue")   color_code="34" ;;
    "cyan")   color_code="36" ;;
    *)        color_code="0"  ;;
  esac
  
  message="$2"
  echo -e "\033[${color_code}m${message}\033[0m"
}

print_colored "cyan" "Scanning for CommonJS module patterns..."

# Define exclude directories
EXCLUDE_DIRS="node_modules|.next|dist|build|out"

# Search patterns
PATTERNS=("module.exports" "exports\.")
FILES_WITH_CJS=()

for pattern in "${PATTERNS[@]}"; do
  print_colored "yellow" "Searching for pattern: $pattern"
  
  # Find files with the pattern, excluding specific directories
  readarray -t matching_files < <(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) \
                                 -not -path "*node_modules*" \
                                 -not -path "*.next*" \
                                 -not -path "*dist*" \
                                 -not -path "*build*" \
                                 -not -path "*out*" \
                                 -exec grep -l "$pattern" {} \;)
  
  if [ ${#matching_files[@]} -gt 0 ]; then
    FILES_WITH_CJS+=("${matching_files[@]}")
    print_colored "yellow" "Found ${#matching_files[@]} files with pattern '$pattern':"
    
    for file in "${matching_files[@]}"; do
      echo "  - $file"
    done
  else
    print_colored "green" "No files found with pattern '$pattern'."
  fi
done

# Remove duplicates by creating a sorted unique array
UNIQUE_FILES=($(printf "%s\n" "${FILES_WITH_CJS[@]}" | sort -u))

# Summary
if [ ${#UNIQUE_FILES[@]} -gt 0 ]; then
  print_colored "red" "\nTotal: Found ${#UNIQUE_FILES[@]} files with CommonJS patterns that may need to be updated for ESM compatibility."
  echo "Consider converting these to use ESM syntax: import/export statements."
  exit 1
else
  print_colored "green" "\nNo CommonJS patterns found! Your codebase appears to be ESM-compatible."
  exit 0
fi
