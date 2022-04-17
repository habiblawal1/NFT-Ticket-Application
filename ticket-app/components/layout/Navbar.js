import "../../styles/Navbar.module.scss";

import Link from "next/link";
const Navbar = () => {
  return (
    <nav className="navbar sticky-top navbar-expand-sm navbar-light bg-cream">
      <Link href="/">
        <a className="navbar-brand fw-bold">NFTickets</a>
      </Link>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#toggleMobileMenu"
        aria-controls="toggleMobileMenu"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="toggleMobileMenu">
        <div className="navbar-nav">
          <Link href="/events/">
            <a className="nav-item nav-link">All Events</a>
          </Link>
          <Link href="/tickets">
            <a className="nav-item nav-link">My Tickets</a>
          </Link>
          <Link href="/events/my-events">
            <a className="nav-item nav-link">Manage Events</a>
          </Link>
          <Link href="/resale">
            <a className="nav-item nav-link">Resale</a>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
