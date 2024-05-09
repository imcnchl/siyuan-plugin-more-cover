#!/bin/bash

npm run build

find ./dist -type f \( -name "icon.png" -o -name "preview.png" -o -name "LICENSE" -o -name "*.md" -o -name "template.json" \) -print > file-list.txt

# 打包所有文件为 package.zip
zip package.zip -@ < file-list.txt