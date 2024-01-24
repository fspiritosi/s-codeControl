import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from './ui/label'

type Props = {
  label: string
  placeholder: string
  options: string[] | undefined
}

export const SelectWithData = ({ label, placeholder, options }: Props) => {
  return (
    <>
      <Label className='ml-2' htmlFor={label}>{label}</Label>
      <Select required>
        <SelectTrigger className="">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent >
          {options?.map((option, index) => (
            <SelectItem key={index} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
