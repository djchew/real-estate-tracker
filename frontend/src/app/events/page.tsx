import { getEvents, getProperties } from "@/lib/api";
import EventsClient from "@/components/EventsClient";

export default async function EventsPage() {
  const [events, properties] = await Promise.all([getEvents(), getProperties()]);
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Events & Reminders</h1>
        <p className="text-sm text-gray-500 mt-1">Track maintenance, lease renewals, and deadlines.</p>
      </div>
      <EventsClient initialEvents={events} properties={properties} />
    </div>
  );
}
