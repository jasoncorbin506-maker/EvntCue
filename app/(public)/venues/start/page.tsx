// /venues/start — Self-serve front door (Door B) — placeholder.
// Source mockup: 02_Locked_Prototypes/Venu/EvntCue_Venu_FrontDoor_v1.html
// Session 15 ports the 3-screen flow:
//   1. Form (venue name, legal business name, address, email, COI upload)
//   2. Verification in progress (property record + COI parallel checks)
//   3. Failure state with offline recourse (email team@evntcue.com)
// Both verification checks must pass to advance; either fails → clean failure
// state with offline recourse to staff via email.
export default function VenuStart() {
  return (
    <main style={{ padding: 24 }}>
      <h1>List your venue</h1>
      <p>Two-source verification: property record + Certificate of Insurance.</p>
      <p>(Front-door form — full port in session 15.)</p>
    </main>
  );
}
