import { useRouter } from "next/router";

export default function adminEvent() {
  const router = useRouter();
  const eventId = router.query["id"];
  return <div>View Admin Details about Event {eventId}</div>;
}
