'use client'
import { CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

interface Props {
  provinces: any[] | null
  cities: any[] | null
}

export default function CityInput({ provinces, cities }: Props) {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [cityFiltered, setCityFiltered] = useState<any[] | null>(
    cities?.filter(city => city?.province_id === 1) || [],
  )
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value)
    const filteredCities = cities?.filter(city => city?.province_id == value)
    setCityFiltered(filteredCities || [])
  }

  const handleCityChange = (value: string) => {
    setSelectedCity(value)
  }

  return (
    <>
      <div>
        <Label htmlFor="province_id">Seleccione una provincia</Label>
        <Select
          value={selectedProvince || ''}
          onValueChange={e => handleProvinceChange(e)}
          name="province_id"
        >
          <SelectTrigger
            id="province_id"
            name="province_id"
            className="max-w-[350px]  w-[300px]"
          >
            <SelectValue placeholder="Seleccionar Provincia" />
          </SelectTrigger>
          <SelectContent>
            {provinces?.map(prov => (
              <SelectItem key={prov?.id} value={prov?.id.toString()}>
                {prov?.name.trim()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CardDescription className="max-w-[300px]">
          Por favor selecciona tu provincia
        </CardDescription>
      </div>
      <div>
        <Label htmlFor="city">Seleccione una ciudad</Label>
        <Select
          value={selectedCity || undefined}
          onValueChange={handleCityChange}
          name="city"
        >
          <SelectTrigger
            id="city"
            name="city"
            className="max-w-[350px] w-[300px]"
          >
            <SelectValue placeholder="Seleccionar Ciudad" />
          </SelectTrigger>
          <SelectContent>
            {cityFiltered?.map(city => (
              <SelectItem key={city?.id} value={city?.id.toString()}>
                {city?.name.trim()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <CardDescription className="max-w-[300px]">
          Por favor selecciona tu ciudad
        </CardDescription>
      </div>
    </>
  )
}
