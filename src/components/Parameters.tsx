import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useEffect, useState, type ReactNode } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import InfoIcon from "@/components/info-icon";

interface ParameterSliderParams {
  parameter: keyof ParametersType,
  parametersRef: React.RefObject<ParametersType>,
  title: string,
  min: number,
  max: number,
  step: number,
  value2string?: (value: number) => string,
  onChange: () => void,
  tooltip: ReactNode
}

interface ParameterCheckboxParams {
  parameter: keyof ParametersType,
  parametersRef: React.RefObject<ParametersType>,
  title: string,
  onChange: () => void,
  tooltip: ReactNode
}

export type ParametersType = {
  color_bits_used: number,
  spacing: number,
  reset_before_encoding: boolean
}

interface ParametersParams {
  parametersRef: React.RefObject<ParametersType>
  onChange: () => void
}

export function Parameters({parametersRef, onChange}: ParametersParams) {
  return (<div className="flex-col flex gap-4 w-sm">
  <ParameterSlider
    parameter="color_bits_used"
    parametersRef={parametersRef}
    title="Color bits used"
    min={1}
    max={8}
    step={1}
    onChange={onChange}
    tooltip={<Label className="text-center">How many bits of each<br/>color of each pixel will<br/>be used to encode data</Label>}
  />
  <ParameterSlider
    parameter="spacing"
    parametersRef={parametersRef} 
    title="Spacing"
    min={-1}
    max={100}
    step={1}
    value2string={(v) => (v === -1 ? "Auto" : v.toString())}
    onChange={onChange}
    tooltip={<Label className="text-center">Spacing between pixels that store data. <br/>Auto mode will set this parameter<br/>to the biggest available option</Label>}
  />
  <ParameterCheckbox 
    parameter="reset_before_encoding"
    parametersRef={parametersRef}
    title="Reset image before encoding"
    onChange={onChange}
    tooltip={<Label className="text-center">Reset image to what it was<br/>without encoded data before<br/>encoding new data</Label>}
  />
  </div>)
}

function ParameterSlider({
  parameter,
  parametersRef,
  title,
  min,
  max,
  step,
  value2string = (v) => v.toString(),
  onChange,
  tooltip
}: ParameterSliderParams) {
  if (!(typeof parametersRef.current[parameter] === "number"))
    throw "wrong parameter type"

  const [parameterValue, setParameterValue] = useState<number>(parametersRef.current[parameter])

  useEffect(() => {
    (parametersRef.current as unknown as Record<typeof parameter, number>)[parameter] = parameterValue
    onChange()
  }, [parameterValue])

  return (<div className="flex w-full flex-col space-y-2">
    <div className="flex flex-row justify-between">
      <Label className="text-neutral-100 text-[1rem]">{title}
        <Tooltip>
          <TooltipTrigger><InfoIcon/></TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </Label>
      <Label className="text-violet-200 text-[1rem]">{value2string(parameterValue)}</Label>
    </div>
    <Slider
      value={[parameterValue]}
      onValueChange={([value]) => {setParameterValue(value)}}
      min={min}
      max={max}
      step={step}
      className="w-full"
    />
  </div>)
}

function ParameterCheckbox({
  parameter,
  parametersRef,
  title,
  onChange,
  tooltip
}: ParameterCheckboxParams) {
  if (!(typeof parametersRef.current[parameter] === "boolean"))
    throw "wrong parameter type"

  const [parameterValue, setParameterValue] = useState<boolean>(parametersRef.current[parameter])

  useEffect(() => {
    (parametersRef.current as unknown as Record<typeof parameter, boolean>)[parameter] = parameterValue
    onChange()
  }, [parameterValue])

  return (<div className="flex w-full flex-row justify-between">
    <Label className="text-neutral-100 text-[1rem]">{title}
      <Tooltip>
        <TooltipTrigger><InfoIcon/></TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </Label>
    <Checkbox checked={parameterValue} onCheckedChange={(v: boolean) => {setParameterValue(v)}}/>
  </div>)
}