import { toast } from "sonner";

export async function encode_file(canvas: HTMLCanvasElement, file: File, color_bits_used: number, spacing: number, pixel_offset: number = 0) {
  const pixel_count = canvas.width * canvas.height - pixel_offset;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const bytes = await file.bytes()

  const sizes_bytes = new Uint8Array(10);
  const sizes_bytes_dv = new DataView(sizes_bytes.buffer);

  sizes_bytes_dv.setUint32(0, file.size);
  sizes_bytes_dv.setUint8(4, file.name.length);
  sizes_bytes_dv.setUint8(5, file.type.length);

  if (spacing === -1) {
    spacing = Math.floor((pixel_count - estimatePixelCount(2, color_bits_used) - estimatePixelCount(10, color_bits_used)) / (estimatePixelCount(file.name.length,color_bits_used) + estimatePixelCount(file.type.length, color_bits_used) + estimatePixelCount(bytes.length, color_bits_used)))
  } else {
    spacing++
  }

  sizes_bytes_dv.setUint32(6, spacing) // spacing

  const img_data = ctx.getImageData(0, 0, canvas.width, canvas.height)


  pixel_offset += await encode_bytes(canvas, new Uint8Array([42,52]), color_bits_used, pixel_offset, 1)
  pixel_offset += await encode_bytes(canvas, sizes_bytes, color_bits_used, pixel_offset, 1);
  pixel_offset += await encode_bytes(canvas, string2Uint8Array(file.name), color_bits_used, pixel_offset, spacing);
  pixel_offset += await encode_bytes(canvas, string2Uint8Array(file.type), color_bits_used, pixel_offset, spacing);
  pixel_offset += await encode_bytes(canvas, bytes, color_bits_used, pixel_offset, spacing);

  if (pixel_count < pixel_offset) {
    toast.error(`Not enough pixels on the image to encode the file (${((pixel_count/pixel_offset)*100).toFixed(2)}%)`);
    ctx.putImageData(img_data, 0, 0);
    return null;
  }

  return pixel_offset
}

async function encode_bytes(canvas: HTMLCanvasElement, bytes: Uint8Array, color_bits_used: number, pixel_offset: number, spacing: number = 1): Promise<number> {
  const ctx = canvas.getContext("2d")!;
  const color_bits_to_remove = 0xff - (1 << color_bits_used) + 1
  const pixel_data_count = 4;
  const total_pixel_count = canvas.width * canvas.height
  const img_data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data: Uint8ClampedArray = img_data.data

  let pixel: number = pixel_offset;
  let total_bits: number = 0;

  while (total_bits < bytes.length*8) {
    if (data[pixel * pixel_data_count + 3] !== 255 && data[data[pixel * pixel_data_count + 3]] > 0) {
      data[pixel * pixel_data_count + 3] = 255
    }
    if (data[pixel * pixel_data_count + 3] === 255) {
      for (let color = 0; color < 3; color++) {
        data[pixel * pixel_data_count + color] = data[pixel * pixel_data_count + color] & color_bits_to_remove;

        for (let bit = 0; bit < color_bits_used; bit++) {
          data[pixel * pixel_data_count + color] += ( ( bytes[(total_bits+bit) >> 3] >> (7 - (total_bits+bit) & 7) ) & 1 ) << (color_bits_used - bit - 1);

        }

        total_bits += color_bits_used
      }
    }

    pixel += spacing;

    if (pixel > total_pixel_count) {
      return pixel;
    }
  }

  ctx.putImageData(img_data, 0, 0);

  return pixel;
}

async function decode_part(data: Uint8ClampedArray, byte_count: number, color_bits_used: number, pixel_offset: number, spacing: number = 1): Promise<[Uint8Array<ArrayBuffer>, number]> {
  const bytes = new Uint8Array(byte_count);
  const pixel_data_count = 4;

  const total_pixel_count = data.length >> 2
  let pixel = pixel_offset
  let total_bits = 0

  while (total_bits < byte_count * 8) {
    if (data[pixel * pixel_data_count + 3] === 255) {
      for (let color = 0; color < 3; color++) {
        for (let bit = 0; bit < color_bits_used; bit++) {
          bytes[(total_bits + bit) >> 3] += ( data[pixel * pixel_data_count + color] & (1 << (color_bits_used - bit - 1)) ) >> (color_bits_used - bit - 1) << (7 - ((total_bits + bit) & 7))

          if (total_bits + bit + 1 >= byte_count * 8) break;
        }
        total_bits += color_bits_used
      }
    }

    pixel += spacing

    if (pixel > total_pixel_count) {
      toast.error("An error occured during decoding")
      throw "not enough pixels"
    }
  }

  return [bytes, pixel];
}

export async function canvas2file(canvas: HTMLCanvasElement, color_bits_used: number): Promise<File> {
  const data = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data!;

  const sizes_size = 10;

  let pixel_offset = 0;

  const [validation_part, validation_part_pixel_count] = await decode_part(data, 2, color_bits_used, pixel_offset);
  pixel_offset += validation_part_pixel_count

  if (validation_part[0] != 42 || validation_part[1] != 52) {
    toast.error("This image does not contain any encoded data")
    throw "no data encoded"
  }

  const [sizes, sizes_pixel_count] = await decode_part(data, sizes_size, color_bits_used, pixel_offset);
  pixel_offset += sizes_pixel_count;

  const sizes_dv = new DataView(sizes.buffer);
  const file_size = sizes_dv.getUint32(0);
  const file_name_size = sizes_dv.getUint8(4);
  const file_type_size = sizes_dv.getUint8(5);
  const spacing = sizes_dv.getUint32(6);

  const [file_name_bytes, file_name_pixel_count] = await decode_part(data, file_name_size, color_bits_used, pixel_offset, spacing);
  pixel_offset += file_name_pixel_count;
  const file_name = String.fromCharCode(...file_name_bytes);

  const [file_type_bytes, file_type_pixel_count] = await decode_part(data, file_type_size, color_bits_used, pixel_offset, spacing);
  pixel_offset += file_type_pixel_count
  const file_type = String.fromCharCode(...file_type_bytes);

  const [file_bytes,] = await decode_part(data, file_size, color_bits_used, pixel_offset, spacing);

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


function estimatePixelCount(bytes: number, color_bits_used: number): number {
  return Math.floor( (bytes * 8) / (color_bits_used * 3) )
}