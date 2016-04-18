#!/bin/bash 

TARGET="~/nxt/html/ui/plugins/slackchat/"

cp -Rfv ./css "$TARGET" 
cp -Rfv ./html "$TARGET" 
cp -Rfv ./js     "$TARGET"
cp -fv ./manifest.json "$TARGET"