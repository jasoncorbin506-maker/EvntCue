import styles from "../dashboard.module.css";

// Phase 3.2 ships this section as an empty-state. Real vendor cards land
// when the booking flow is wired in Phase 4+. The empty card sets the
// editorial-luxe expectation and points to the marketplace.
export function VendorGrid() {
  return (
    <div className={styles.vgrid}>
      <div className={styles.vendorEmpty}>
        <h3 className={styles.vendorEmptyTitle}>No vendors yet.</h3>
        <p className={styles.vendorEmptyBody}>
          Lock the venue first — every other vendor sequences from there. Once
          confirmed, Cue surfaces matched florists, caterers, and the rest of
          the lineup ranked against your visual brief.
        </p>
        <span className={styles.vendorEmptyCta} style={{ opacity: 0.7 }}>
          Browse the DFW marketplace — soon
        </span>
      </div>
    </div>
  );
}
