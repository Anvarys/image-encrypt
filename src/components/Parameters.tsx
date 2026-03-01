import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

interface ParameterSliderParams {
  parameter: keyof ParametersType,
  parametersRef: React.RefObject<ParametersType>,
  title: string,
  min: number,
  max: number,
  step: number,
  value2string?: (value: number) => string
}

interface ParameterCheckboxParams {
  parameter: keyof ParametersType,
  parametersRef: React.RefObject<ParametersType>,
  title: string
}

export type ParametersType = {
  color_bits_used: number,
  spacing: number,
  reset_before_encoding: boolean
}

interface ParametersParams {
  parametersRef: React.RefObject<ParametersType>
}

export function Parameters({parametersRef}: ParametersParams) {
  return (<div className="flex-col flex gap-4 w-sm">
  <ParameterSlider
    parameter="color_bits_used"
    parametersRef={parametersRef}
    title="Color bits used"
    min={1}
    max={8}
    step={1}
  />
  <ParameterSlider
    parameter="spacing"
    parametersRef={parametersRef} 
    title="Spacing"
    min={-1}
    max={100}
    step={1}
    value2string={(v) => (v === -1 ? "Auto" : v.toString())}
  />
  <ParameterCheckbox 
    parameter="reset_before_encoding"
    parametersRef={parametersRef}
    title="Reset image before encoding again"
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
  value2string = (v) => v.toString()
}: ParameterSliderParams) {
  if (!(typeof parametersRef.current[parameter] === "number"))
    throw "wrong parameter type"

  const [parameterValue, setParameterValue] = useState<number>(parametersRef.current[parameter])

  useEffect(() => {
    (parametersRef.current as unknown as Record<typeof parameter, number>)[parameter] = parameterValue
  }, [parameterValue])

  return (<div className="flex w-full flex-col space-y-2">
    <div className="flex flex-row justify-between">
      <Label className="text-neutral-100 text-[1rem]">{title}</Label>
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
  title
}: ParameterCheckboxParams) {
  if (!(typeof parametersRef.current[parameter] === "boolean"))
    throw "wrong parameter type"

  const [parameterValue, setParameterValue] = useState<boolean>(parametersRef.current[parameter])

  useEffect(() => {
    (parametersRef.current as unknown as Record<typeof parameter, boolean>)[parameter] = parameterValue
  }, [parameterValue])

  return (<div className="flex w-full flex-row justify-between">
    <Label className="text-neutral-100 text-[1rem]">{title}</Label>
    <Checkbox checked={parameterValue} onCheckedChange={(v: boolean) => {setParameterValue(v)}}/>
  </div>)
}