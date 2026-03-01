import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { canvas2file, encode_file } from "./encoding";
import { GithubIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Parameters, type ParametersType } from "@/components/Parameters";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import InfoIcon from "@/components/info-icon";


export function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isImageUploaded, setIsImageUploaded] = useState<boolean>(false)
  const [filename, setFilename] = useState<string | null>(null)
  const [imagesSampleDialogOpen, setImagesSampleDialogOpen] = useState<boolean>(false);
  const [fileSampleDialogOpen, setFileSampleDialogOpen] = useState<boolean>(false);
  const [fileSampleSelected, setFileSampleSelected] = useState<File | null>(null);
  const [imageSampleFilename, setImageSampleFilename] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const [savedImageBitmap, setSavedImageBitmap] = useState<CanvasImageSource | null>(null);

  const parametersRef = useRef<ParametersType>({
    color_bits_used: 1,
    spacing: -1,
    reset_before_encoding: true,
    opaque_threshold: 200
  })

  async function imageFileInputChange() {
    const file = imageFileInputRef.current?.files?.[0]

    if (!file || !canvasContext || !canvasRef.current) {setIsImageUploaded(false); return;}
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image, file you uploaded is not supported", {duration: 8000});
      imageFileInputRef.current!.value = ""
      setIsImageUploaded(false)
      return;
    }

    const bitmap = await createImageBitmap(file);
    canvasRef!.current!.height = bitmap.height
    canvasRef!.current!.width = bitmap.width
    canvasContext!.drawImage(bitmap, 0, 0)

    setSavedImageBitmap(bitmap)
    setIsImageUploaded(true)
  }

  async function onImageSampleClick(e: React.MouseEvent<HTMLImageElement, MouseEvent>, filename: string) {
    const imgElement = e.currentTarget;
    if (!canvasRef.current || !canvasContext) return;

    canvasRef.current.width = imgElement.naturalWidth; 
    canvasRef.current.height = imgElement.naturalHeight;
    canvasContext.drawImage(imgElement, 0, 0)

    setSavedImageBitmap(imgElement)
    setImagesSampleDialogOpen(false)
    setIsImageUploaded(true)
    setImageSampleFilename(filename)
  }

  function fileInputChange() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return;
    if (file.name.length > 255) {
      fileInputRef.current!.value = "";
      toast.error("Your file's name is longer than 255 characters", {duration: 8000});
      setFilename(null);
      return;
    }
    setFilename(file.name)
    setFileSampleSelected(null)
  }

  async function encodeButtonClicked() {
    if (!isImageUploaded) {
      toast.error("Please upload an image first", {duration: 8000});
      return;
    }

    const file = fileInputRef.current?.files?.[0]

    if (!(file || fileSampleSelected)) {
      toast.error("Please upload a file first", {duration: 8000});
      return;
    }
    
    if (!canvasRef.current || !canvasContext) return;

    if (parametersRef.current.reset_before_encoding && savedImageBitmap)
    canvasContext.drawImage(savedImageBitmap, 0, 0);
    const result = await encode_file(canvasRef.current, (file || fileSampleSelected)!, parametersRef.current.color_bits_used, parametersRef.current.spacing, parametersRef.current.opaque_threshold)

    if (!result) {return;}

    const url = canvasRef.current.toDataURL("image/png")
    const anchor = document.createElement("a");

    anchor.href = url;
    if (imageFileInputRef.current?.files?.[0])
    anchor.download = imageFileInputRef.current?.files?.[0]!.name! ;
    else
    anchor.download = imageSampleFilename!
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  async function decodeButtonClicked() {
    if (!isImageUploaded) {
      toast.error("Please upload an image first", {duration: 8000});
      return;
    }

    const file = await canvas2file(canvasRef.current!, parametersRef.current.color_bits_used)

    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  async function setFileFromUrl(url: string, filename: string) {
    const response = await fetch(url);
    const blob = await response.blob()


    const file = new File([blob], filename, {
      type: response.headers.get("content-type")!,
      lastModified: Date.now(),
    });

    fileInputRef.current!.files
    setFilename(filename)
    setFileSampleSelected(file)
    setFileSampleDialogOpen(false)
  }

  function getImageCapacity() {
    if (!canvasRef.current || !isImageUploaded)
    return null

    const pixels = canvasRef.current.height * canvasRef.current.width 
    const byte_count = Math.floor(pixels * 3 * parametersRef.current.color_bits_used / 8) - 10
    return byte_count / (parametersRef.current.spacing === -1 ? 1 : (parametersRef.current.spacing+1))
  }

  function getByteCountString(byte_count: number): string {
    if (byte_count < 0) {
      return "<0 bytes"
    } else if (byte_count < 1000) {
      return byte_count + " bytes"
    } else if (byte_count < 1_000_000) {
      return (byte_count / 1000).toFixed(1)+" KB"
    } else {
      return (byte_count / 1_000_000).toFixed(1)+" MB"
    }
  }

  function getTotalFileSize() {
    if ((!fileInputRef.current || !fileInputRef.current.files || !fileInputRef.current.files[0]) && !fileSampleSelected) return;
    const file = fileSampleSelected ? fileSampleSelected : fileInputRef.current!.files![0]
    return file.size + file.name.length + file.type.length
  }

  useEffect(() => {
    setCanvasContext(canvasRef.current?.getContext("2d")!)
  }, [])

return (<div className="text-foreground flex flex-col items-center p-4 gap-4">
  <input type="file" accept="image/" ref={fileInputRef} onChange={fileInputChange} hidden/>
  <input type="file" accept="image/" ref={imageFileInputRef} onChange={imageFileInputChange} hidden/>

  <Button className="text-foreground cursor-pointer text-2xl p-10 border-3 border-teal-600 min-w-sm" onClick={() => {
    imageFileInputRef.current?.click();
  }}>
    <div className="items-center flex flex-col">
    Upload an image
    <Label className="text-center hover:underline cursor-pointer text-muted-foreground" onClick={(e) => {e.stopPropagation(); setImagesSampleDialogOpen(true)}}>or choose from examples</Label>
    </div>
  </Button>

  <Button className="text-foreground cursor-pointer text-2xl p-10 border-3 border-blue-600 bg-blue-500 min-w-sm" onClick={() => {
    fileInputRef.current?.click();
  }}>
    <div className="items-center flex flex-col">
    Upload a file
    <Label className="text-center hover:underline cursor-pointer text-muted-foreground" onClick={(e) => {e.stopPropagation(); setFileSampleDialogOpen(true)}}>or choose from examples</Label>
    </div>
  </Button>
  
  <canvas ref={canvasRef} className="max-w-sm max-h-sm h-sm border border-4" hidden={!isImageUploaded}></canvas>
  {filename && <Label>File: {filename}</Label>}

  <div className="flex flex-col gap-4 w-sm w-max-sm">
    <div className="flex flex-row gap-4 justify-center">
    <Button className="cursor-pointer text-foreground p-6 text-[1.2rem] border-violet-600 bg-violet-500 flex-1" onClick={encodeButtonClicked}>Encode</Button>
    <Button className="cursor-pointer text-foreground p-6 text-[1.2rem] border-green-600 bg-green-500 flex-1" onClick={decodeButtonClicked}>Decode</Button>
    </div>
    <div className="flex flex-row gap-4 justify-center">
    <a href='https://github.com/Anvarys/image-encrypt' className="flex-1/2" target='_blank'>
      <div className='bg-neutral-800 p-2 rounded-[0.5rem] border-neutral-900 border flex flex-row w-full h-full items-center justify-center'>
        <GithubIcon className="mr-1"/>
        <Label className='text-center cursor-pointer text-[1rem]'>GitHub</Label>
      </div>
    </a>
    </div>
  </div>

  <Dialog open={imagesSampleDialogOpen} onOpenChange={setImagesSampleDialogOpen}>
  <DialogContent className="min-w-[80%] max-w-[80%] min-h-[80%] max-h-[80%] bg-neutral-900 border-neutral-800 overflow-auto">
    <DialogTitle hidden>Image sample</DialogTitle>
    <div className="flex flex-wrap gap-10 justify-start items-start content-start">
    <img src="samples/images/banana_big.png" className="w-full max-w-[384px] h-auto object-contain border-2 rounded-sm border-neutral-900 hover:border-cyan-500 cursor-pointer" onClick={(e) => {onImageSampleClick(e, "banana.png")}}/>
    <img src="samples/images/cat.jpg" className="w-full max-w-[384px] h-auto object-contain border-2 rounded-sm border-neutral-900 hover:border-cyan-500 cursor-pointer" onClick={(e) => {onImageSampleClick(e, "cat.jpg")}}/>
    <img src="samples/images/matrix.jpeg" className="w-full max-w-[384px] h-auto object-contain border-2 rounded-sm border-neutral-900 hover:border-cyan-500 cursor-pointer" onClick={(e) => {onImageSampleClick(e, "matrix.jpeg")}}/>
    <img src="samples/images/infinity.png" className="w-full max-w-[384px] h-auto object-contain border-2 rounded-sm border-neutral-900 hover:border-cyan-500 cursor-pointer" onClick={(e) => {onImageSampleClick(e, "infinity.png")}}/>
    <img src="samples/images/blank640.png" className="w-full max-w-[384px] h-auto object-contain border-2 rounded-sm border-neutral-900 hover:border-cyan-500 cursor-pointer" onClick={(e) => {onImageSampleClick(e, "blank640.png")}}/>
    </div>
  </DialogContent></Dialog>

  <Dialog open={fileSampleDialogOpen} onOpenChange={setFileSampleDialogOpen}>
  <DialogContent className="min-w-[90%] max-w-[90%] min-h-[80%] max-h-[80%] bg-neutral-900 border-neutral-800 overflow-auto">
    <DialogTitle hidden>File sample</DialogTitle>
    <div className="flex flex-wrap gap-4 justify-start items-start content-start">
    <div className="border w-[92.5%] flex flex-col items-center bg-neutral-800 border-2 border-neutral-700 rounded-sm p-2 cursor-pointer hover:border-blue-500" onClick={() =>
      setFileFromUrl("https://raw.githubusercontent.com/Anvarys/image-encrypt/refs/heads/master/public/samples/files/helloworld.txt", "helloworld.txt")
    }>
      <Label className="text-violet-300 text-[1.1rem]">helloworld.txt<Label className="text-cyan-300 text-[0.8rem]">52 bytes</Label></Label>
      <p>A plain text file with "hello world!" in it</p>
    </div>
    <div className="border w-[92.5%] flex flex-col items-center bg-neutral-800 border-2 border-neutral-700 rounded-sm p-2 cursor-pointer hover:border-blue-500" onClick={() => 
      setFileFromUrl("https://raw.githubusercontent.com/Anvarys/image-encrypt/refs/heads/master/public/samples/files/banana.png", "banana.png")
    }>
      <Label className="text-violet-300 text-[1.1rem]">banana.png <Label className="text-cyan-300 text-[0.8rem]">22KB</Label></Label>
      <p>The banana image</p>
    </div>
    <div className="border w-[92.5%] flex flex-col items-center bg-neutral-800 border-2 border-neutral-700 rounded-sm p-2 cursor-pointer hover:border-blue-500" onClick={() =>
      setFileFromUrl("https://raw.githubusercontent.com/Anvarys/image-encrypt/refs/heads/master/public/samples/files/mysterious-audio.mp3", "mysterious-audio.mp3")
    }>
      <Label className="text-violet-300 text-[1.1rem]">mysterious-audio.mp3<Label className="text-cyan-300 text-[0.8rem]">132KB</Label></Label>
      <p>Some random audio mp3 file</p>
    </div>
    </div>
  </DialogContent></Dialog>
  
  <Label className="text-transparent bg-clip-text bg-radial from-violet-300 to-violet-600 w-sm mt-3 text-center">Privacy: All the processing is done completely in your browser, nothing gets sent or logged anywhere</Label>

  <div className="lg:absolute lg:top-4 lg:left-4">
    <Label className="text-xl mb-5 text-cyan-200">Parameters:</Label>
    <Parameters 
      parametersRef={parametersRef} 
      onChange={() => forceUpdate(v => v+1)}
    />
    { ((filename && fileInputRef.current && fileInputRef.current.files) || (canvasRef.current && isImageUploaded) )&&
    <Label className="text-xl mb-5 mt-5 text-cyan-200">Additional info:</Label> }
    { ((filename && fileInputRef.current && fileInputRef.current.files) || (canvasRef.current && isImageUploaded)) &&
    <div className="flex flex-col space-y-4">
      { canvasRef.current && isImageUploaded &&
      <div className="flex flex-row justify-between">
        <Label className="text-neutral-100 text-[1rem]">Image resolution
          <Tooltip>
            <TooltipTrigger><InfoIcon/></TooltipTrigger>
            <TooltipContent><Label className="text-center">Image resolution in pixels<br/>width x height</Label></TooltipContent>
          </Tooltip>
        </Label>
        <Label className="text-violet-200 text-[1rem]">{canvasRef.current.width}x{canvasRef.current.height}</Label>
      </div>
      }
      { canvasRef.current && isImageUploaded &&
      <div className="flex flex-row justify-between">
        <Label className="text-neutral-100 text-[1rem]">Image encoding capacity
          <Tooltip>
            <TooltipTrigger><InfoIcon/></TooltipTrigger>
            <TooltipContent><Label className="text-center">How many bytes you can encode into this<br/>image (including filename & file type)</Label></TooltipContent>
          </Tooltip>
        </Label>
        <Label className="text-violet-200 text-[1rem]">{getByteCountString(getImageCapacity()!)}</Label>
      </div>
      }
      { filename && fileInputRef.current && fileInputRef.current.files &&
      <div className="flex flex-row justify-between">
        <Label className="text-neutral-100 text-[1rem]">Total file size
          <Tooltip>
            <TooltipTrigger><InfoIcon/></TooltipTrigger>
            <TooltipContent><Label className="text-center">Total file size including<br/>the filename and the<br/>file type</Label></TooltipContent>
          </Tooltip>
        </Label>
        <Label className={`text-[1rem]`} style={{color: `${getImageCapacity() ? (getTotalFileSize()! <= getImageCapacity()! ? "oklch(87.1% 0.15 154.449)" : "oklch(63.7% 0.237 25.331)") : "oklch(89.4% 0.057 293.283)"}`}}>{getByteCountString(getTotalFileSize()!)}</Label>
      </div>
      }
    </div>
    }
  </div>
  
</div>);
}

export default App;