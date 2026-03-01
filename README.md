This project is a website that encodes data from a file (including filename, file type) inside an image.

#### Summary

To be precise the data is split into groups of 3 bits which are encoded in a single pixel, 1 bit in each RGB color. This way it changes a single bit of the colors which is a 0-0.4% change in color (almost impossible to spot if not looking for it). It increases the image's file size dramatically, because on all the pixels that changed PNG compression will not work that well, and also it is noted that the only file type that you can obtain as the image output is .png because of it's lossless compression which is required for such method to work.

Also any pixels that have opacity lower than 100% will be skipped

## What is encoded and where?

1. 0th -> 1st Bytes - arbitrary values to identify images that contain any encoded data
2. 2nd -> 5th Bytes - A Uint32 specifying the file's content size (let's name this value FCS)
3. 6th Byte - A Uint8 specifying the filename's size (let's name this value FNS)
4. 7th Byte - A Uint8 specifying the file type's size (let's name this value FTS)
5. 8th -> 11th Bytes - A Uint specifying the spacing between pixels containing data
5. 8th -> {FNS+8} - Filename
6. {9+FNS} -> {9+FNS+FTS} - File type
6. {10+FNS+FTS} -> {10+FNS+FTS+FCS} - File's content

## Technical details

This website is built on [React](https://react.dev/), [Typescript](https://www.typescriptlang.org/), with [Vite](https://vite.dev/) as the bundler. It uses [shadcn-ui](https://ui.shadcn.com/) and [tailwindcss](https://tailwindcss.com/) for UI. And all the processing of data/images is done completely in the browser with pure canvas HTML element (no libraries).

### Running the project locally

You need to clone the repo and run it via npm

```bash
git clone https://github.com/Anvarys/image-encrypt.git
cd image-encrypt
npm run dev 
```