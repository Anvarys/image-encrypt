This project is a website that encodes data from a file (including filename, file type) inside an image.

#### Summary

To be precise the data is encoded into each color of each pixel used in storing data, each pixel contains 3 colors with 8 bit each, you can specify how many bits will be used in the process. So on default 1 bit / color the color is changed It increases the image's file size dramatically, because on all the pixels that changed PNG compression will not work that well, and also it is noted that the only file type that you can obtain as the image output is .png because of it's lossless compression which is required for such method to work (.bmp is also a lossless image file type, but it's not supported yet).

Also any pixels that have opacity lower than 100% will be skipped

## What is encoded and where?

these are byte ids/slices, starting from 0

1. `0` - A Uint8 specifing the amount of bits / color
1. `1 -> 2` - arbitrary values to identify images that contain any encoded data
2. `3 -> 6` - A Uint32 specifying the file's content size (let's name this value `FCS`)
3. `7` - A Uint8 specifying the filename's size (let's name this value `FNS`)
4. `8` - A Uint8 specifying the file type's size (let's name this value `FTS`)
5. `9 -> 12` - A Uint32 specifying the spacing between pixels containing data
5. `13 -> {FNS+13}` - Filename
6. `{14+FNS} -> {14+FNS+FTS}` - File type
6. `{15+FNS+FTS} -> {15+FNS+FTS+FCS}` - File's content

## Technical details

This website is built on [React](https://react.dev/), [Typescript](https://www.typescriptlang.org/), with [Vite](https://vite.dev/) as the bundler. It uses [shadcn-ui](https://ui.shadcn.com/) and [tailwindcss](https://tailwindcss.com/) for UI. And all the processing of data/images is done completely in the browser with pure canvas HTML element (no libraries).

### Running the project locally

You need to clone the repo and run it via npm

```bash
git clone https://github.com/Anvarys/image-encrypt.git
cd image-encrypt
npm run dev 
```