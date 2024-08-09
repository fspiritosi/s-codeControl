This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Actualizar Supabase DB

Para sincronizar la Base de datos Local con la Deploy seguir los siguientes pasos.

##### Actualizar la rama local con dev

```bash
git pull origin dev

```

Esto asegura que tenemos la ultima migración que se encuentra en producción.

Una vez tengamos la ultima migración en nuestro local, se debe correr

```bash
npx supabase migration up

```

## Subir cambios a la DB - PREVIO SE DEBE ASEGURAR TENER LA DB ACTUALIZADA

Esto actualiza nuestra base de datos local igualandola con la de producción, pero mantiene los cambios que hayamos realizado en local.

##### Crear la migración de los ultimos cambios

```bash
npx supabase db diff -f nombreDeLaMigracion

```

##### Enviar los cambios de la migración a producción

```bash
npx supabase db push

```

##### Crear un commit de la rama con la nueva migración.

```bash
git  add .
git commit -m "nombre del Commit"
git push

```

##### Crear un PR para incluir los cambios de la migración en DEV.
