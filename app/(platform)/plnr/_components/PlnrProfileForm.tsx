"use client";

import { useState, useTransition } from "react";
import { savePlnrProfile } from "../_actions/plnr-profile";
import { showToast } from "@/app/(platform)/orgnz/_lib/toast";
import type { PlnrProfile } from "@/lib/plnr/profile";
import type { PlnrPhoto } from "@/lib/plnr/photos";
import { PlnrPhotosGrid } from "./PlnrPhotosGrid";
import s from "./PlnrProfileForm.module.css";

/**
 * Lean planner profile-edit surface (Lock 30 Phase C pt 2). Profile basics +
 * service levels (fixed chip set) + free specialty chips + founding story +
 * inline photo gallery + publish. No menu tiers — a planner sells service, not
 * per-head pricing. Mirrors CatrProfileForm otherwise.
 */

const SERVICE_LEVELS: { value: string; label: string }[] = [
  { value: "full-service", label: "Full-service" },
  { value: "partial", label: "Partial" },
  { value: "day-of", label: "Day-of" },
];

type Props = {
  initialProfile: PlnrProfile;
  initialPhotos: PlnrPhoto[];
};

export function PlnrProfileForm({ initialProfile, initialPhotos }: Props) {
  const [name, setName] = useState(initialProfile.displayName ?? "");
  const [city, setCity] = useState(initialProfile.city ?? "");
  const [levels, setLevels] = useState<string[]>(initialProfile.serviceLevels);
  const [specialties, setSpecialties] = useState(initialProfile.specialties.join(", "));
  const [story, setStory] = useState(initialProfile.foundingStory ?? "");
  const [published, setPublished] = useState(initialProfile.claimStatus === "published");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleLevel(value: string) {
    setLevels((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function save(publish: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await savePlnrProfile({
        displayName: name,
        city,
        serviceLevels: levels.join(", "),
        specialties,
        foundingStory: story,
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

  const inputProps = { autoComplete: "off" as const, "data-1p-ignore": true, "data-lpignore": "true", disabled: pending };

  return (
    <div className={s.wrap}>
      {published ? (
        <div className={s.statusLive}>● Live in the marketplace</div>
      ) : (
        <div className={s.statusDraft}>Draft — not yet visible to organizers</div>
      )}

      <label className={s.field}>
        <span className={s.label}>Planning studio name</span>
        <input className={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vine & Veil Events" {...inputProps} />
      </label>

      <label className={s.field}>
        <span className={s.label}>City</span>
        <input className={s.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dallas" {...inputProps} />
      </label>

      <div className={s.field}>
        <span className={s.label}>Service levels</span>
        <div className={s.chips}>
          {SERVICE_LEVELS.map((lvl) => {
            const on = levels.includes(lvl.value);
            return (
              <button
                key={lvl.value}
                type="button"
                className={on ? s.chipOn : s.chip}
                onClick={() => toggleLevel(lvl.value)}
                aria-pressed={on}
                disabled={pending}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className={s.field}>
        <span className={s.label}>Specialties <span className={s.opt}>(comma-separated)</span></span>
        <input className={s.input} value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Weddings, Corporate, Destination" {...inputProps} />
      </label>

      <label className={s.field}>
        <span className={s.label}>Your story <span className={s.opt}>optional</span></span>
        <textarea
          className={s.textarea}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="How you got started and what makes your planning different."
          {...inputProps}
        />
      </label>

      <div className={s.tiers}>
        <div className={s.tiersHead}>Photos <span className={s.opt}>first is your cover</span></div>
        <PlnrPhotosGrid initial={initialPhotos} />
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
