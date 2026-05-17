// /venues/claim/[token] — Ghost-profile claim entry (Door A) — placeholder.
//
// Per Venu_Locked_2026-05-13.md: warm-intro recipient gets an unguessable
// invite link. Token is hashed in venues.invite_token_hash (migration 025);
// this page validates the hash, checks expiry + non-consumption, drops user
// directly into a working dashboard with a soft welcome strip.
//
// Session 15 wires:
//   - Token validation (lookup by sha256(token), check expires_at, not consumed)
//   - Single-use enforcement (set invite_token_consumed_at on claim attempt)
//   - Tenant + user_role creation on successful claim
//   - Redirect to /venu/discover with the welcome strip flag set
//   - Failure states (expired / consumed / invalid)
export default async function VenuClaim({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main style={{ padding: 24 }}>
      <h1>Welcome to EvntCue</h1>
      <p>Claiming venue (token prefix {token.slice(0, 6)}...)</p>
      <p>(Claim flow — full port in session 15.)</p>
    </main>
  );
}
