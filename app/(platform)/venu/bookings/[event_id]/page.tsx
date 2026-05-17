// Venu Event Detail — placeholder.
// Per the spine-of-the-platform principle in Venu_Locked_2026-05-13.md,
// everything event_id-scoped lives inside this view: BEO acknowledgment,
// seat chart, timeline, vendor roster, money for this event, messages
// with the Orgnz. Session 15.
export default async function VenuEventDetail({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;
  return (
    <main style={{ padding: 24 }}>
      <h1>Venu · Event Detail</h1>
      <p>Event ID: {event_id}</p>
      <p>BEO · seat chart · timeline · vendor roster · money · messages.</p>
    </main>
  );
}
