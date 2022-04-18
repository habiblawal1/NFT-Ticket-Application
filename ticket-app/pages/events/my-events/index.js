import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

import { signers } from "../../../components/contracts";

export default function myEvents() {
  const [events, setEvents] = useState([]);
  const [loadingState, setLoadingState] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const contracts = await signers();
    const { signedMarketContract } = contracts;

    const data = await signedMarketContract.getMyEvents();
    console.log(data);

    const allEvents = await Promise.all(
      data.map(async (i) => {
        const eventUri = await i.uri;
        if (!eventUri) {
          setErr(
            `Event URI does not exist for Event Id ${i.eventId.toNumber()}`
          );
          return;
        }
        const eventRequest = await axios.get(eventUri);
        const eventData = eventRequest.data;

        console.log("EVENT DATA = ", eventData);
        let currEvent = {
          eventId: i.eventId.toNumber(),
          name: eventData.name,
          description: eventData.description,
          imageUri: eventData.image,
          location: eventData.location,
          startDate: eventData.eventDate,
          ticketTotal: i.ticketTotal.toNumber(),
          ticketsSold: i.ticketsSold.toNumber(),
          owner: i.owner,
        };
        console.log("Event ", currEvent.eventId, " owner = ", currEvent.owner);
        return currEvent;
      })
    );

    console.log("ALL EVENTS: ", allEvents);
    setEvents(allEvents);
    setLoadingState(true);
  }

  if (!loadingState) {
    return <h1 className="display-1">Loading...</h1>;
  }

  if (err) {
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <h1>Your Events</h1>
        <p style={{ height: "64px" }} className="text-red font-semibold">
          {err}
        </p>
      </div>
    </div>;
  }

  if (!events.length) {
    return (
      <>
        <h1 className="px-20 py-10 text-3xl">You have created no events</h1>
        <div className="p-4">
          <p style={{ height: "64px" }} className="text-primary font-semibold">
            <Link href={`/events/create`}>
              <a className="mr-6">Create Event</a>
            </Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <h1>Your Events</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {events.map((event) => (
            <div
              key={event.eventId}
              className="border shadow rounded-l overflow-hidden"
            >
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-primary font-semibold"
                >
                  <Link href={`/events/validate/${event.eventId}`}>
                    Validate Event-&gt;
                  </Link>
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-primary font-semibold"
                >
                  <Link href={`/events/my-events/${event.eventId}`}>
                    View Event Details -&gt;
                  </Link>
                </p>
              </div>
              <img src={event.imageUri} />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Id: {event.eventId}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Name: {event.name}
                </p>
              </div>
              <div style={{ height: "70px", overflow: "hidden" }}>
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Description: {event.description}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Date: {event.startDate}
                </p>
              </div>
              <div style={{ height: "70px", overflow: "hidden" }}>
                <p
                  style={{ height: "64px" }}
                  className="text-3xl font-semibold"
                >
                  Location: {event.location}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-black font-semibold"
                >
                  Tickets Supplied: {event.ticketTotal}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-green font-semibold"
                >
                  Tickets Remaining: {event.ticketTotal - event.ticketsSold}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-primary font-semibold"
                >
                  <Link href={`/tickets/create/${event.eventId}`}>
                    <a className="mr-6">Create Ticket For Event</a>
                  </Link>
                </p>
              </div>
            </div>
          ))}
          <div className="p-4">
            <p
              style={{ height: "64px" }}
              className="text-primary font-semibold"
            >
              <Link href={`/events/create`}>
                <a className="mr-6">Create Event</a>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
