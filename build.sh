#!/bin/bash

set -e #exit on errors

# This is an "internal" script used by me to effortlessly build yeeturl-desktop.
# It may require a specific configuration for it to work for you.

echo "Building yeeturl for linux, windows, and mac"

nexe -t linux-x64-12.16.2 -o yeeturl-linux index.js
nexe -t windows-x86-12.18.2 -o yeeturl-windows.exe index.js
nexe -t mac-x64-12.18.2 -o yeeturl-mac index.js

echo "Compressing executables"
7z a -mx=9 yeeturl-linux.7z yeeturl-linux
7z a -mx=9 yeeturl-windows.7z yeeturl-windows.exe
7z a -mx=9 yeeturl-mac.7z yeeturl-mac

echo "Removing uncompressed executables"
rm yeeturl-linux yeeturl-windows.exe yeeturl-mac

echo "Success"