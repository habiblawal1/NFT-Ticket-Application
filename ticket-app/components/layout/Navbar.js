import styles from "../../styles/Navbar.module.css";

import Link from "next/link";
const Navbar = () => {
  return (
    <div>
      <nav className="p-6 bg-secondary mb-5">
        {/*<nav className={styles.topnav}>*/}
        <Link href="/">
          <a className="mr-6 text-primary font-bold hover:underline">
            NFTickets
          </a>
        </Link>
        <Link href="/events/">
          <a className="mr-6 text-primary hover:text-white">All Events</a>
        </Link>
        <Link href="/tickets">
          <a className="mr-6 text-primary hover:text-white">My Tickets</a>
        </Link>
        <Link href="/events/my-events">
          <a className="mr-6 text-primary hover:text-white">Manage Events</a>
        </Link>
        <Link href="/resale">
          <a className="mr-6 text-primary hover:text-white">Resale</a>
        </Link>
      </nav>
    </div>
  );
};

export default Navbar;
