export async function encode(canvas: HTMLCanvasElement, file: File, color_bits_used: number) {
  const spacing = 1;
  const pixel_count = canvas.width * canvas.height;
  const ctx = canvas.getContext("2d");
  const color_bits_to_remove = 0xff - (0 << color_bits_used) - 1
  const pixel_data_count = 4;

  if (!ctx) return;
  
  if (pixel_count < file.size * (8 / color_bits_used) / 3) {
    console.log("not enough pixels to encode data");
    return;
  }

  const img_data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data: Uint8ClampedArray = img_data.data

  let pixel: number = 0;
  let total_bits: number = 0;
  const bytes: Uint8Array = await file.bytes();

  while (total_bits < bytes.length*8) {
    for (let color = 0; color < 3; color++) {
      data[pixel * pixel_data_count + color] = data[pixel * pixel_data_count + color] & color_bits_to_remove;

      for (let bit = 0; bit < color_bits_used; bit++) {
        data[pixel * pixel_data_count + color] += ( ( bytes[(total_bits+bit) >> 3] >> (7 - (total_bits+bit) & 7) ) & 1 ) << (color_bits_used - bit - 1);
      }

      total_bits += color_bits_used
    }

    pixel += spacing;
  }

  ctx.putImageData(img_data, 0, 0);
}