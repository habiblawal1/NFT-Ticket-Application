import styles from "../styles/Home.module.css";
import Link from "next/link";

import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  return (
    <div className={styles.container}>
      <h1 className="font-bold"> NFT Based tickets</h1>
      <h4>Providing extra trust and security for attending events</h4>
      <button
        onClick={() => {
          router.push("/events/create");
        }}
        className="font-bold mt-4 mr-4 bg-primary text-white rounded p-4 shadow-lg"
      >
        Create Event
      </button>
      <button
        onClick={() => {
          router.push("/events/");
        }}
        className="font-bold mt-4 mr-4 bg-white text-primary border rounded p-4 shadow-lg"
      >
        Find Event
      </button>
    </div>
  );
}
