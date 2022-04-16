import "../styles/globals.scss";
import "tailwindcss/tailwind.css";
import "bootstrap/dist/css/bootstrap.css"; // Add this line
import Layout from "../components/layout/Layout";
import Head from "next/head";
import { useEffect, useState } from "react";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap");
  }, []);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>NFTickets</title>
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default MyApp;
