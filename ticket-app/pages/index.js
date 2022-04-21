import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  return (
    <div className="container min-vh-100 d-flex justify-content-center text-center align-items-center">
      <div className="col">
        <h1> NFT Based tickets</h1>
        <p className="lead">
          Providing extra trust and security for attending events
        </p>
        <button
          onClick={() => {
            router.push("/events/create");
          }}
          className="btn btn-lg btn-primary m-2"
        >
          Create Event
        </button>
        <button
          type="button"
          onClick={() => {
            router.push("/events/");
          }}
          className="btn btn-lg btn-outline-primary m-2"
        >
          Find Event
        </button>
      </div>
      <div className="col d-none d-md-block">
        <img className="img-fluid" src="/event.png" />
      </div>
    </div>
  );
}
