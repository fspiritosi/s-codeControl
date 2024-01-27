import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from './ui/label'

type Province = {
  id: number
  name: string
}
type Props = {
  label?: string
  placeholder: string
  options: string[] | undefined | Province[]
  onChange: (value: string) => void
  value: string
}

export const SelectWithData = ({ label, placeholder, options, onChange, value  }: Props) => {
  let dataToRender = options

  if ((options?.[0] as Province)?.name) {
    dataToRender = (options as Province[]).map(
      (option: Province) => option.name,
    )
  }
  return (
    <>
      <Label className="ml-2" htmlFor={label}>
        {label}
      </Label>
      <Select required value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {dataToRender?.map((option, index) => (
            <SelectItem key={index} value={String(option)}>
              {String(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
