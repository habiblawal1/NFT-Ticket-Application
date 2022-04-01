import "../styles/globals.css";
import Layout from "../src/compontents/layout/Layout";
import Head from "next/head";
import Link from "next/link";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default MyApp;
