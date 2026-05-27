"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type {
  InquiryMessage,
  InquirySenderRole,
} from "@/lib/messaging/inquiry-thread-shared";
import { sendInquiryMessage } from "../_actions/send-inquiry-message";
import { deleteInquiryMessage } from "../_actions/delete-inquiry-message";
import { markInquiryMessagesRead } from "../_actions/mark-inquiry-messages-read";
import { loadInquiryThreadOrgnz } from "../_actions/load-inquiry-thread";
import s from "./OrgnzInquiries.module.css";

/**
 * Organizer-side inquiry message thread. Mirrors the vndr-side
 * InquiryThread; the only differences are viewerRole='orgnz', label
 * text for the counter-party ("Vendor"), and action imports point at
 * the orgnz server actions.
 */

type Props = {
  inquiryId: string;
};

const MAX_BODY = 4000;
const VIEWER_ROLE: InquirySenderRole = "orgnz";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function whoLabel(role: InquirySenderRole, isMine: boolean): string {
  if (isMine) return "You";
  if (role === "vndr") return "Vndr";
  if (role === "venue") return "Venu";
  if (role === "plnr") return "Plnr";
  return "Orgnz";
}

export function OrgnzInquiryThread({ inquiryId }: Props) {
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [composer, setComposer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const view = await loadInquiryThreadOrgnz(inquiryId);
      if (cancelled) return;
      setMessages(view.messages);
      setLoaded(true);
      void markInquiryMessagesRead(inquiryId);
    })();
    return () => {
      cancelled = true;
    };
  }, [inquiryId]);

  useEffect(() => {
    if (loaded) listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loaded]);

  async function refresh() {
    const view = await loadInquiryThreadOrgnz(inquiryId);
    setMessages(view.messages);
  }

  function handleSend() {
    setError(null);
    const body = composer.trim();
    if (!body) {
      setError("Type a message first.");
      return;
    }
    if (body.length > MAX_BODY) {
      setError(`Message too long (${MAX_BODY} max).`);
      return;
    }
    startTransition(async () => {
      const res = await sendInquiryMessage({ inquiryId, body });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setComposer("");
      await refresh();
    });
  }

  function handleDelete(messageId: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteInquiryMessage(messageId);
      if (!res.ok) {
        setError(res.error);
        setConfirmDeleteId(null);
        return;
      }
      setConfirmDeleteId(null);
      await refresh();
    });
  }

  return (
    <div className={s.threadWrap}>
      <div className={s.sectionLbl}>Messages</div>

      {!loaded ? (
        <div className={s.threadEmpty}>Loading…</div>
      ) : messages.length === 0 ? (
        <div className={s.threadEmpty}>
          No messages yet. Start the conversation with the vendor below.
        </div>
      ) : (
        <div className={s.threadList} role="log" aria-live="polite">
          {messages.map((m) => {
            const isMine = m.senderRole === VIEWER_ROLE;
            const confirming = confirmDeleteId === m.id;
            return (
              <div
                key={m.id}
                className={`${s.msg} ${isMine ? s.msgMine : s.msgTheirs}`.trim()}
              >
                <div className={s.msgMeta}>
                  <span className={s.msgWho}>{whoLabel(m.senderRole, isMine)}</span>
                  <span className={s.msgWhen}>{formatTimestamp(m.createdAt)}</span>
                </div>
                <div className={s.msgBody}>{m.body}</div>
                {isMine && !confirming && (
                  <button
                    type="button"
                    className={s.msgDelete}
                    onClick={() => setConfirmDeleteId(m.id)}
                    disabled={pending}
                    aria-label="Delete message"
                  >
                    Delete
                  </button>
                )}
                {isMine && confirming && (
                  <div className={s.deleteConfirm}>
                    <span className={s.deleteConfirmTxt}>
                      Delete this message? The vendor may have already read it.
                    </span>
                    <div className={s.deleteConfirmActions}>
                      <button
                        type="button"
                        className={s.deleteBtnGhost}
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={pending}
                      >
                        Keep
                      </button>
                      <button
                        type="button"
                        className={s.deleteBtnDanger}
                        onClick={() => handleDelete(m.id)}
                        disabled={pending}
                      >
                        {pending ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={listEndRef} />
        </div>
      )}

      <div className={s.composer}>
        <textarea
          className={s.composerInput}
          placeholder="Message the Vndr…"
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          rows={2}
          maxLength={MAX_BODY}
          disabled={pending}
          aria-label="Message body"
        />
        <button
          type="button"
          className={s.composerSend}
          onClick={handleSend}
          disabled={pending || composer.trim().length === 0}
        >
          {pending ? "…" : "Send"}
        </button>
      </div>

      {error && <div className={s.errMsg}>{error}</div>}
    </div>
  );
}
