import Head from "next/head";

export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_VERCEL_URL ||
  "http://localhost:3000";

export function SEO(props: {
  title: string;
  desc: string;
  imageUrl?: string;
  url?: string;
}) {
  return (
    <Head>
      <meta property="og:url" content={props.url ?? BASE_URL} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={props.title} />
      <meta property="og:description" content={props.desc} />

      {props.imageUrl && <meta property="og:image" content={props.imageUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={props.url ?? BASE_URL} />
      <meta name="twitter:title" content={props.title} />
      <meta name="twitter:description" content={props.desc} />
      {props.imageUrl && (
        <meta property="twitter:image" content={props.imageUrl} />
      )}
    </Head>
  );
}
