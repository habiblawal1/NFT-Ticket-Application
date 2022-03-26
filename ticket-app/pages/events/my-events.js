import Link from "next/link";

function myEvents() {
  return (
    <div>
      <h1>Manage Events Page</h1>
      <Link href="/tickets/create">
        <a className="mr-6">Create Ticket For Event</a>
      </Link>
    </div>
  );
}

export default myEvents;
