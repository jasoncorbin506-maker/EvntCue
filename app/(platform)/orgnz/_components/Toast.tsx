"use client";

import { useEffect, useState } from "react";
import styles from "../orgnz.module.css";
import { onToast } from "../_lib/toast";

export function Toast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const off = onToast((html) => {
      setMsg(html);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(null), 2400);
    });
    return () => {
      off();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!msg) return null;
  return (
    <div
      className={styles.toast}
      role="status"
      aria-live="polite"
      dangerouslySetInnerHTML={{ __html: msg }}
    />
  );
}
