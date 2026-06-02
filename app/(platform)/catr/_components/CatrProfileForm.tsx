"use client";

import { useState, useTransition } from "react";
import { saveCatrProfile, saveCatrMenuTier, deleteCatrMenuTier } from "../_actions/catr-profile";
import { showToast } from "@/app/(platform)/orgnz/_lib/toast";
import type { CatrProfile, CatrMenuTierRow } from "@/lib/catr/profile";
import type { CatrPhoto } from "@/lib/catr/photos";
import { CatrPhotosGrid } from "./CatrPhotosGrid";
import s from "./CatrProfileForm.module.css";

/**
 * Lean caterer profile-edit surface (Lock 30 Phase C). Profile basics +
 * per-head menu tiers + publish. No photos (deferred), no multi-stage funnel.
 */

function dollars(cents: number | null): string {
  return cents == null ? "" : String(Math.round(cents / 100));
}

type Props = {
  initialProfile: CatrProfile;
  initialTiers: CatrMenuTierRow[];
  initialPhotos: CatrPhoto[];
};

export function CatrProfileForm({ initialProfile, initialTiers, initialPhotos }: Props) {
  const [name, setName] = useState(initialProfile.displayName ?? "");
  const [city, setCity] = useState(initialProfile.city ?? "");
  const [cuisines, setCuisines] = useState(initialProfile.cuisineTypes.join(", "));
  const [styles, setStyles] = useState(initialProfile.serviceStyles.join(", "));
  const [tiers, setTiers] = useState<CatrMenuTierRow[]>(initialTiers);
  const [published, setPublished] = useState(initialProfile.claimStatus === "published");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // New-tier draft
  const [tName, setTName] = useState("");
  const [tPrice, setTPrice] = useState("");
  const [tMin, setTMin] = useState("");

  function save(publish: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await saveCatrProfile({
        displayName: name,
        city,
        cuisineTypes: cuisines,
        serviceStyles: styles,
        publish,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (publish) setPublished(true);
      showToast(publish ? "<em>Published</em> to the marketplace." : "Profile saved.");
    });
  }

  function addTier() {
    if (!tName.trim()) {
      setError("Give the tier a name.");
      return;
    }
    setError(null);
    const perGuestCents = tPrice.trim() ? Math.round(Number(tPrice) * 100) : null;
    const minGuests = tMin.trim() ? Math.round(Number(tMin)) : null;
    startTransition(async () => {
      const res = await saveCatrMenuTier({ name: tName, perGuestCents, minGuests });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Optimistic; server is source of truth on next load.
      setTiers((prev) => [
        ...prev,
        { id: `tmp-${prev.length}`, name: tName.trim(), description: null, perGuestCents, minGuests, sortOrder: prev.length, active: true },
      ]);
      setTName("");
      setTPrice("");
      setTMin("");
      showToast("Tier added.");
    });
  }

  function removeTier(id: string) {
    startTransition(async () => {
      const res = await deleteCatrMenuTier(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setTiers((prev) => prev.filter((t) => t.id !== id));
    });
  }

  const inputProps = { autoComplete: "off" as const, "data-1p-ignore": true, "data-lpignore": "true", disabled: pending };

  return (
    <div className={s.wrap}>
      {published ? (
        <div className={s.statusLive}>● Live in the marketplace</div>
      ) : (
        <div className={s.statusDraft}>Draft — not yet visible to organizers</div>
      )}

      <label className={s.field}>
        <span className={s.label}>Catering business name</span>
        <input className={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hearth & Vine Catering" {...inputProps} />
      </label>

      <label className={s.field}>
        <span className={s.label}>City</span>
        <input className={s.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dallas" {...inputProps} />
      </label>

      <label className={s.field}>
        <span className={s.label}>Cuisines <span className={s.opt}>(comma-separated)</span></span>
        <input className={s.input} value={cuisines} onChange={(e) => setCuisines(e.target.value)} placeholder="Italian, BBQ, Vegan" {...inputProps} />
      </label>

      <label className={s.field}>
        <span className={s.label}>Service styles <span className={s.opt}>(comma-separated)</span></span>
        <input className={s.input} value={styles} onChange={(e) => setStyles(e.target.value)} placeholder="Plated, Buffet, Stations, Bar" {...inputProps} />
      </label>

      <div className={s.tiers}>
        <div className={s.tiersHead}>Photos <span className={s.opt}>first is your cover</span></div>
        <CatrPhotosGrid initial={initialPhotos} />
      </div>

      <div className={s.tiers}>
        <div className={s.tiersHead}>Menu tiers <span className={s.opt}>per guest</span></div>
        {tiers.map((t) => (
          <div key={t.id} className={s.tierRow}>
            <div>
              <div className={s.tierName}>{t.name}</div>
              <div className={s.tierMeta}>
                {[t.perGuestCents != null ? `$${dollars(t.perGuestCents)}/guest` : null, t.minGuests != null ? `${t.minGuests}+ guests` : null].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <button type="button" className={s.tierDel} onClick={() => removeTier(t.id)} disabled={pending || t.id.startsWith("tmp-")} aria-label="Remove tier">×</button>
          </div>
        ))}

        <div className={s.tierAdd}>
          <input className={s.input} value={tName} onChange={(e) => setTName(e.target.value)} placeholder="Tier name (Silver / Gold)" {...inputProps} />
          <div className={s.tierAddRow}>
            <input className={s.input} value={tPrice} onChange={(e) => setTPrice(e.target.value)} placeholder="$/guest" inputMode="numeric" {...inputProps} />
            <input className={s.input} value={tMin} onChange={(e) => setTMin(e.target.value)} placeholder="Min guests" inputMode="numeric" {...inputProps} />
            <button type="button" className={s.tierAddBtn} onClick={addTier} disabled={pending}>Add</button>
          </div>
        </div>
      </div>

      {error && <div className={s.error}>{error}</div>}

      <div className={s.actions}>
        <button type="button" className={s.saveBtn} onClick={() => save(false)} disabled={pending}>
          {pending ? "Saving…" : "Save draft"}
        </button>
        <button type="button" className={s.publishBtn} onClick={() => save(true)} disabled={pending}>
          {published ? "Save & keep live" : "Publish"}
        </button>
      </div>
    </div>
  );
}
