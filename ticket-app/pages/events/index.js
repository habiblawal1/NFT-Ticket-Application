import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

import { marketContract } from "../../components/contracts";

export default function allEvents() {
  const [events, setEvents] = useState([]);
  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);
  async function loadEvents() {
    const data = await marketContract.getAllEvents();
    //console.log(data);

    const allEvents = await Promise.all(
      data.map(async (i) => {
        const eventUri = await i.uri;
        if (!eventUri) {
          //TODO - Proper error msg for no URI
          let currEvent = {
            eventId: "NO EVENT URI",
            name: "NO EVENT URI",
            description: "NO EVENT URI",
            imageUri: "NO EVENT URI",
            location: "NO EVENT URI",
            startDate: "NO EVENT URI",
            owner: "NO EVENT URI",
          };
          return currEvent;
        }
        console.log("URI = ", eventUri);
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
          owner: i.owner,
        };
        return currEvent;
      })
    );

    console.log("ALL EVENTS: ", allEvents);
    setEvents(allEvents);
    setLoadingState(true);
  }

  if (!loadingState) {
    return (
      <div className="container">
        <p className="display-1">Loading...</p>
      </div>
    );
  }
  if (loadingState && !events.length) {
    return (
      <div className="container">
        <p className="display-4">No Events In the Marketplace</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <h1>All Events</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {events.map((event) => (
            <div
              key={event.eventId}
              className="border shadow rounded-l overflow-hidden"
            >
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
                  className="text-3xl font-semibold"
                >
                  Owner: {event.owner}
                </p>
              </div>
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-primary font-semibold"
                >
                  <Link href={`/events/${event.eventId}`}>
                    <a className="mr-6">Book Now</a>
                  </Link>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
