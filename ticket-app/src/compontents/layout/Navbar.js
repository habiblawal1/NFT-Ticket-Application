import Link from "next/link";
const Navbar = () => {
  return (
    <div>
      <nav className="border-b p-6">
        {/*<nav className={styles.topnav}>*/}
        <Link href="/">
          <a className="mr-6 text-pink-500 font-bold">nfTickets</a>
        </Link>
        <Link href="/events/">
          <a className="mr-6 text-pink-500">All Events</a>
        </Link>
        <Link href="/tickets">
          <a className="mr-6 text-pink-500">My Tickets</a>
        </Link>
        <Link href="/events/my-events">
          <a className="mr-6 text-pink-500">Manage Events</a>
        </Link>
        <Link href="/resale">
          <a className="mr-6 text-pink-500">Resale</a>
        </Link>
      </nav>
    </div>
  );
};

export default Navbar;
