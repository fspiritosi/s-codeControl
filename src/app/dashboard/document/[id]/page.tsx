
function page({params}: {params: {id: string}}) {
  return (
    <section>page {params.id}</section>
  )
}

export default page