#!/bin/bash

# Deploy built files to gh-pages branch
cd '/c/Users/blkw/OneDrive/Documents/Github/Source 4 Industries'

# Copy all files from out folder
OUT_DIR='./Source 4 Dashboard/web/out'

if [ -d "$OUT_DIR" ]; then
    # Get all files from out directory
    find "$OUT_DIR" -type f -exec sh -c '
        SOURCE="$1"
        DEST="${SOURCE#'"'"'$OUT_DIR'"'"'/}"
        mkdir -p "$(dirname "$DEST")"
        cp "$SOURCE" "$DEST"
    ' _ {} \;

    echo "Files copied successfully"

    # Add all files to git
    git add .

    # Commit
    git commit -m "Deploy static dashboard to GitHub Pages" || echo "Nothing to commit"

    # Push
    git push -u origin gh-pages

    echo "Deployed to GitHub Pages!"
else
    echo "Error: $OUT_DIR not found"
    exit 1
fi
