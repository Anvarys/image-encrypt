export async function encode_file(canvas: HTMLCanvasElement, file: File, color_bits_used: number, pixel_offset: number = 0) {
  const pixel_count = canvas.width * canvas.height - pixel_offset;
  const ctx = canvas.getContext("2d");

  if (!ctx) return;
  
  if (pixel_count < file.size * (8 / color_bits_used) / 3) {
    console.log("not enough pixels to encode data");
    return;
  }

  const bytes = await file.bytes()

  const sizes_bytes = new Uint8Array(6);
  const sizes_bytes_dv = new DataView(sizes_bytes.buffer);

  sizes_bytes_dv.setUint32(0, file.size);
  sizes_bytes_dv.setUint8(4, file.name.length);
  sizes_bytes_dv.setUint8(5, file.type.length);

  pixel_offset += await encode_bytes(canvas, sizes_bytes, color_bits_used, pixel_offset);
  console.log(pixel_offset)
  pixel_offset += await encode_bytes(canvas, string2Uint8Array(file.name), color_bits_used, pixel_offset);
  console.log(pixel_offset)
  pixel_offset += await encode_bytes(canvas, string2Uint8Array(file.type), color_bits_used, pixel_offset);
  console.log(pixel_offset)
  pixel_offset += await encode_bytes(canvas, bytes, color_bits_used, pixel_offset);

  return pixel_offset
}

async function encode_bytes(canvas: HTMLCanvasElement, bytes: Uint8Array, color_bits_used: number, pixel_offset: number, spacing: number = 1): Promise<number> {
  const ctx = canvas.getContext("2d")!;
  const color_bits_to_remove = 0xff - (0 << color_bits_used) - 1
  const pixel_data_count = 4;
  
  const img_data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data: Uint8ClampedArray = img_data.data

  let pixel: number = pixel_offset;
  let total_bits: number = 0;

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

  return pixel;
}

async function decode_part(data: Uint8ClampedArray, byte_count: number, color_bits_used: number, pixel_offset: number, spacing: number = 1): Promise<[Uint8Array<ArrayBuffer>, number]> {
  const bytes = new Uint8Array(byte_count);
  const pixel_data_count = 4;

  let pixel = pixel_offset
  let total_bits = 0

  while (total_bits < byte_count * 8) {
    for (let color = 0; color < 3; color++) {
      for (let bit = 0; bit < color_bits_used; bit++) {
        bytes[(total_bits + bit) >> 3] += ( data[pixel * pixel_data_count + color] & (1 << bit) ) << (7 - ((total_bits + bit) & 7))

        if (total_bits + bit + 1 >= byte_count * 8) break;
      }

      total_bits += color_bits_used
    }

    pixel += spacing
  }

  return [bytes, pixel];
}

export async function canvas2file(canvas: HTMLCanvasElement): Promise<File> {
  const data = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data!;

  const color_bits_used = 1;

  const sizes_size = 6;

  let pixel_offset = 0;

  const [sizes, sizes_pixel_count] = await decode_part(data, sizes_size, color_bits_used, pixel_offset);
  pixel_offset += sizes_pixel_count;

  console.log(pixel_offset)

  const sizes_dv = new DataView(sizes.buffer);
  const file_size = sizes_dv.getUint32(0);
  const file_name_size = sizes_dv.getUint8(4);
  const file_type_size = sizes_dv.getUint8(5);

  const [file_name_bytes, file_name_pixel_count] = await decode_part(data, file_name_size, color_bits_used, pixel_offset);
  pixel_offset += file_name_pixel_count;
  console.log(pixel_offset)
  const file_name = String.fromCharCode(...file_name_bytes);

  const [file_type_bytes, file_type_pixel_count] = await decode_part(data, file_type_size, color_bits_used, pixel_offset);
  pixel_offset += file_type_pixel_count
  console.log(pixel_offset)
  const file_type = String.fromCharCode(...file_type_bytes);

  const [file_bytes,] = await decode_part(data, file_size, color_bits_used, pixel_offset);

  return new File([file_bytes], file_name, {
    type: file_type
  })
}

function string2Uint8Array(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);

  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xFF;
  }

  return bytes;
}