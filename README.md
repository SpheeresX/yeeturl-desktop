# yeeturl-desktop
CLI app for yeeturl

## Usage

[Download `yeeturl-desktop`](https://github.com/SpheeresX/yeeturl-desktop/releases)

`./yeeturl -s https://www.example.com/` - shortens a url

`./yeeturl -s https://www.example.com/ -i https://yeeturl.example.com/` - use a custom yeeturl instance (beta)

`./yeeturl -g https://yeeturl.glitch.me/#a9f/hdf` - gets the original (long) url

## Running (dev)

1. Clone this repository
2. `npm i`
3. `node index.js`

## Building

Install `nexe` as a global package and "compile" the script into a single executable for your target platform. If you intend to distribute the executables, it's recommended that you compress them.

```bash
npm i -g nexe
# for linux (x64)
nexe -t linux-x64-12.16.2 index.js
# for windows (x86 to reduce the file size of our executable)
nexe -t windows-x86-12.18.2 index.js
# for macos (x64)
nexe -t mac-x64-12.18.2 index.js
```