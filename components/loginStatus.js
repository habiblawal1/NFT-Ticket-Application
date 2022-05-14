import Link from "next/link";

import { signers } from "./Contracts";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const loginStatus = (props) => {
  const [loggedIn, setLoggedIn] = useState(true);
  const [loadingState, setLoadingState] = useState(false);

  const router = useRouter();
  useEffect(() => {
    async function checkSigner() {
      try {
        await signers();
        setLoggedIn(true);
      } catch (error) {
        console.log(error);
        setLoggedIn(false);
      }
      setLoadingState(true);
    }
    checkSigner();
    router.events.on("routeChangeComplete", (url, { shallow }) => {
      checkSigner();
    });
  }, []);

  return (
    loadingState &&
    (loggedIn ? (
      props.children
    ) : (
      <div className="container min-vh-100 d-flex justify-content-center text-center align-items-center">
        <div className="col m-2">
          <h1> NFT Based tickets</h1>
          <p className="lead">
            Providing extra trust and security for attending events
          </p>
          <h2 className=" text-red">Failed to log into Metamask</h2>
          <h4 className="text-red">
            Please try logging in again and then{" "}
            <span className="fw-bold">REFRESH</span> the page
          </h4>
          <div className="mt-6">
            <p className="fw-bold">Not sure how to use Metamask?</p>
            <Link
              href={`https://medium.com/@decryptmedia/metamask-the-beginners-guide-6111143f2581`}
            >
              <a className="mr-6">
                Cick to learn more{" "}
                <i className="bi bi-arrow-right-circle-fill"></i>
              </a>
            </Link>
          </div>
        </div>
        <div className="col d-none d-md-block">
          <img className="img-fluid" src="/event.png" />
        </div>
      </div>
    ))
  );
};

export default loginStatus;
