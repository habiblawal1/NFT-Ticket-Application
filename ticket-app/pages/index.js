import Head from "next/head";
import Image from "next/image";
import Navbar from "../src/compontents/layout/Navbar";
import styles from "../styles/Home.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.container}>
      <h1> NFT Based tickets</h1>
      <h4>Providing extra trust and security for attending events</h4>
      <Link href="/events/create">
        <a className="mr-6">Create Event</a>
      </Link>
      <Link href="/events/">
        <a className="mr-6">Find Event</a>
      </Link>
    </div>
  );
}
