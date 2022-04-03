import { useRouter } from "next/router";

export default function ticketDetails() {
  const router = useRouter();
  const ticketId = router.query["id"];
  // TODO - Add message for if a user who doesn't own the token tries to access the page
  return <h1>Ticket ID: {ticketId}</h1>;
}
