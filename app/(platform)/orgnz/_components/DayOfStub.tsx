import styles from "../orgnz.module.css";

/** 3.2.A placeholder. Full Run-of-Show + 12-Min Bump land in 3.2.C. */
export function DayOfStub() {
  return (
    <section className={styles.dayofStub}>
      <div className={styles.dayofStubEye}>Day-of mode · preview</div>
      <h2 className={styles.dayofStubT}>
        Your <em>Run of Show</em> lives here.
      </h2>
      <p className={styles.dayofStubB}>
        Eighteen blocks · live clock · vendor pings · the 12-Min Bump on tap.
        Full build lands in <em>3.2.C</em>.
      </p>
    </section>
  );
}
