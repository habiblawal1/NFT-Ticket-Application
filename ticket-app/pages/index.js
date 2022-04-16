import styles from "../styles/Home.module.scss";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";

import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  return (
    <div className={styles.container}>
      <h1> NFT Based tickets</h1>
      <p className="lead">
        Providing extra trust and security for attending events
      </p>
      <img src="/event.png" />
      <button
        onClick={() => {
          router.push("/events/create");
        }}
        className="btn btn-primary"
      >
        Create Event
      </button>
      <button
        type="button"
        onClick={() => {
          router.push("/events/");
        }}
        className="btn btn-outline-primary"
      >
        Find Event
      </button>
    </div>
  );
}
