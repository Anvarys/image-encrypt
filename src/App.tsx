import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { encode } from "./encoding";


export function App() {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isImageUploaded, setIsImageUploaded] = useState<boolean>(false)

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
      canvasRef.current.height = bitmap.height
      canvasRef.current.width = bitmap.width
      canvasContext.drawImage(bitmap, 0, 0)

      setIsImageUploaded(true)
  }

  function fileInputChange() {

  }

  function encodeButtonClicked() {
    if (!isImageUploaded) {
      toast.error("Please upload an image first", {duration: 8000});
      return;
    }

    const file = fileInputRef.current?.files?.[0]

    if (!file) {
      toast.error("Please upload a file first", {duration: 8000});
      return;
    }
    
    if (!canvasRef.current) return;

    encode(canvasRef.current, file, 1)
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
    <Label className="text-center hover:underline cursor-pointer text-muted-foreground">or choose from examples</Label>
    </div>
  </Button>

  <Button className="text-foreground cursor-pointer text-2xl p-10 border-3 border-blue-600 bg-blue-500 min-w-sm" onClick={() => {
    fileInputRef.current?.click();
  }}>
    <div className="items-center flex flex-col">
    Upload a file
    <Label className="text-center hover:underline cursor-pointer text-muted-foreground">or choose from examples</Label>
    </div>
  </Button>

  <canvas ref={canvasRef} className="w-auto h-auto border border-4 max-h-2xl max-w-2xl"/>

  <Button className="cursor-pointer text-foreground p-6 text-[1.2rem]" onClick={encodeButtonClicked}>Encode the file inside the image</Button>
</div>);
}

export default App;