import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import cookie from 'js-cookie'



export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('email', session?.user.email)

  const { data: Companies, error } = await supabase
    .from('company')
    .select(`*`)
    .eq('owner_id', data?.[0]?.id)

  const theme = res.cookies.get('theme')
  const actualCompanyId = req.cookies.get('actialCompanyId')
  //const actualNoOwner :string | null = req.cookies.get('actualComp')?.value
  const actualNoOwnerValue: string | null =req.cookies.get('actualComp')?.value ?? null
  const actualNoOwner = actualNoOwnerValue ? actualNoOwnerValue.replace(/^"|"$/g, ''): null;
  console.log("actualcompanyId: ",actualCompanyId)
  console.log("actualNoOwner: ",actualNoOwner)
 
  const actualNow  = actualNoOwner //!== null ? parseInt(actualNoOwner as string, 10) : null
  console.log("actualNow: ",actualNoOwner)    
      const {data : guestRole} = await supabase 
        .from('share_company_users')
        .select("role")
        .eq('profile_id ',data?.[0]?.id )
        .eq('company_id', actualNow)
      
      
        console.log("guestRoles: ", guestRole?.[0]?.role)
   
  const userRole = data?.[0]?.role
  console.log("user id: ", data?.[0].id)
  console.log("userRole: ", userRole )

  const guestUser = [
                  '/dashboard/employee/action?action=edit&',
                  '/dashboard/employee/action?action=new',
                  '/dashboard/equipment/action?action=edit&',
                  '/dashboard/equipment/action?action=new',
                  '/dashboard/company/new',
                ]

  if (!theme) {
    res.cookies.set('theme', 'light')
  }

  if (!actualCompanyId) {
    const companiesId = Companies?.filter(
      company => company.by_defect === true,
    )[0]?.id
    res.cookies.set('actualCompanyId', companiesId)
  }

  const isAuditor = data?.[0]?.role === 'Auditor'
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (userRole === 'Admin') {
    return res; // Permitir acceso sin restricciones para los usuarios con rol 'Admin'
}else{
  if (isAuditor && !req.url.includes('/auditor')) {
    return NextResponse.redirect(new URL('/auditor', req.url))
  }
  if (!isAuditor && req.url.includes('/auditor')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if((guestRole?.[0]?.role === 'Invitado' )&& guestUser.some(url => req.url.includes(url))){
          return NextResponse.redirect(new URL('/dashboard', req.url))

  }
  if((guestRole?.[0]?.role === 'CodeControlCLient' || guestRole?.[0]?.role === 'User' || userRole === 'CodeControlCLient')&& guestUser.some(url => req.url.includes(url))){
          return NextResponse.redirect(new URL('/dashboard', req.url))

  }
}
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auditor/:path*'],
}






// // // /////////////////////////////////////////////////////////////////////////

// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
// import { NextRequest, NextResponse } from 'next/server'
// import cookies from 'js-cookie'

// export async function middleware(req: NextRequest) {
//   const res = NextResponse.next()
//   const supabase = createMiddlewareClient({ req, res })
//   //console.log("esta es la cooki en el middleware: ",req.cookies.get('actialCompanyId'))
//   const {
//     data: { session },
//   } = await supabase.auth.getSession()

//   const { data } = await supabase
//     .from('profile')
//     .select('*')
//     .eq('email', session?.user.email)

//     const rolProfile = data?.[0]?.role
    
//     const { data: Companies, error } = await supabase
//     .from('company')
//     .select(`*`)
//     .eq('owner_id', data?.[0]?.id)
//     //.eq('id', actualCompanyId)
//     //console.log("Companies: ",Companies)
//     const theme = res.cookies.get('theme')
//     const actualCompanyId = cookies.get('actualCompanyId')

    
//     console.log("actualcompanyId: ", actualCompanyId)
//     //console.log("Prueba Actualcompani: ",req.cookies.get('actualComp'));
//     if (!theme) {
//       res.cookies.set('theme', 'light')
//     }
  
    
//     if (!actualCompanyId) {
//       const companiesId = Companies?.filter(
//         company => company.by_defect === true,
//       )[0]?.id
//       req.cookies.set('actualCompanyId', companiesId)
//       console.log('actualcompany: ',companiesId)
//     }
  

    
  
//     //const comp = Companies?.find()
//     //let guestRole = null
//    // if(actualCompanyId){
//     const { data : guestRoles  } = await supabase
//         .from('share_company_users')
//         .select('role')
//         .eq('profile_id', data?.[0]?.id)
//         .eq('company_id', actualCompanyId)
//         console.log("user: ", data?.[0]?.id)
//         console.log("actual company: ", actualCompanyId)
//         console.log("guestRoles: ", guestRoles)
//        let guestRole = guestRoles?.[0]?.role
//       // // } 
//       // // else{
//       //   const { data : guestRoles  } = await supabase
//       //   .from('share_company_users')
//       //   .select('role')
//       //   .eq('profile_id', data?.[0]?.id)
//       //   //console.log("guestRole: ", guestRoles)
//       //   //guestRole = ""
//       // }
       
        
        
     
//          const rolShared = guestRole
//         const guestUser = [
//               '/dashboard/employee/action?action=edit&',
//               '/dashboard/employee/action?action=new',
//               '/dashboard/equipment/action?action=edit&',
//               '/dashboard/equipment/action?action=new',
//               '/dashboard/company/new',
//             ]
  
  
  
//   console.log("rolProfile: ", rolProfile)
//   console.log("rolShared: ", rolShared)
  
  
//   const isAuditor = data?.[0]?.role === 'Auditor'
//   if (!session) {
//     return NextResponse.redirect(new URL('/login', req.url))
//   }
//   if (isAuditor && !req.url.includes('/auditor')) {
//     return NextResponse.redirect(new URL('/auditor', req.url))
//   }
//   // if (!isAuditor && req.url.includes('/auditor')) {
//   //   return NextResponse.redirect(new URL('/dashboard', req.url))
//   // }
  

//   if ((rolShared === "Invitado") && guestUser.some(url => req.url.includes(url))){
//         return NextResponse.redirect(new URL('/dashboard', req.url))

//   }

//   if ((rolProfile === "Admin" && rolShared === null) && guestUser.some(url => req.url.includes(url))){
//     return res

// }


//   return res
// }

// export const config = {
//   matcher: ['/dashboard/:path*', '/auditor/:path*'],
// }
