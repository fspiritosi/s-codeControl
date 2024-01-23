import { useEdgeFunctions } from '@/hooks/useEdgeFunctions'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { supabase } from '../../supabase/supabase'
// eslint-disable-next-line react-hooks/rules-of-hooks
const {errorTranslate} = useEdgeFunctions()

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchCountrys () {

let { data: countries, error } = await supabase
  .from('countries')
  .select('*')

  if (error) {
    const message = ( await errorTranslate(error.message))
    throw new Error( String(message).replaceAll('"', ''))
  }

  const onlyNames = countries?.map(country => country.name)

  return onlyNames
          
}
export async function fetchCitys (){ //Id de la provincia
  
let { data: cities, error } = await supabase
.from('cities')
.select('*')

if (error) {
  const message = ( await errorTranslate(error.message))
  throw new Error( String(message).replaceAll('"', ''))
}
const onlyNames = cities?.map(citie => citie.city_name)

return onlyNames            
}
export async function fetchProvinces (){
  
  let { data: provinces, error } = await supabase
  .from('provinces')
  .select('*')
          
if (error) {
  const message = ( await errorTranslate(error.message))
  throw new Error( String(message).replaceAll('"', ''))
}
const onlyNames = provinces?.map(province => province.name)

return onlyNames            
}
export async function fetchHierarchy(){
  
let { data: hierarchy, error } = await supabase
.from('hierarchy')
.select('*')
        
if (error) {
  const message = ( await errorTranslate(error.message))
  throw new Error( String(message).replaceAll('"', ''))
}
const onlyNames = hierarchy?.map(hierarchy => hierarchy.position_name)

return onlyNames 

}
export async function fetchworkDiagram(){
  
let { data, error } = await supabase
.from('work-diagram')
.select('*')
if (error) {
  const message = ( await errorTranslate(error.message))
  throw new Error( String(message).replaceAll('"', ''))
}
const onlyNames = data?.map(data => data.diagram_name)

return onlyNames 
}
export async function fetchContractors(){
  
let { data, error } = await supabase
.from('contractor-companies')
.select('*')
if (error) {
  const message = ( await errorTranslate(error.message))
  throw new Error( String(message).replaceAll('"', ''))
}
const onlyNames = data?.map(data => data.company_name)

return onlyNames 
        
}
