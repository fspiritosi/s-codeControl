'use client'
import Link from "next/link"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb"

import { usePathname } from "next/navigation"

export default function AdminBreadcrumb(){

    const path = usePathname()
    const cortePath = path.split('/')
    const pasos = cortePath.slice(2) 
 
    return(
        <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
        {pasos.map((paso, index) => (
            <BreadcrumbItem key={index}>
            <BreadcrumbLink asChild>
              <Link href={`/admin/${paso}`}>
              {paso}
              </Link>
              </BreadcrumbLink>
            <BreadcrumbSeparator /> 
            
          </BreadcrumbItem>
          
        ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
}