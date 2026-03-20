import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  useConversations,
  usePreferences,
  useGetLikesReceived,
} from "./useQueries";

export function useNotifications(activeChatPrincipal: string | null) {
  const { data: conversations = [] } = useConversations();
  const { data: preferences } = usePreferences();
  const { data: likesReceived = [] } = useGetLikesReceived();

  const initialized = useRef(false);
  const prevPrincipals = useRef<Set<string>>(new Set());
  const prevUnreadCounts = useRef<Map<string, number>>(new Map());
  const prevLikePrincipals = useRef<Set<string>>(new Set());
  const likesInitialized = useRef(false);
  // Keep preferences in a ref so the effect closure always reads the latest value
  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  });

  useEffect(() => {
    if (!initialized.current) {
      // Seed state on first load — never fire notifications for existing data
      prevPrincipals.current = new Set(
        conversations.map((c) => String(c.withPrincipal)),
      );
      prevUnreadCounts.current = new Map(
        conversations.map((c) => [
          String(c.withPrincipal),
          Number(c.unreadCount),
        ]),
      );
      initialized.current = true;
      return;
    }

    const prefs = preferencesRef.current;
    const currentPrincipals = new Set(
      conversations.map((c) => String(c.withPrincipal)),
    );

    // New match detection
    if (prefs?.notifyMatches) {
      for (const convo of conversations) {
        const principal = String(convo.withPrincipal);
        if (!prevPrincipals.current.has(principal)) {
          const name = (convo.profile as any)?.name ?? "Someone";
          toast.success(`You matched with ${name}!`, {
            description: "Go say hello!",
            duration: 5000,
          });
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("New Match! 💕", {
              body: `You and ${name} liked each other.`,
            });
          }
        }
      }
    }

    // New message detection
    if (prefs?.notifyMessages) {
      for (const convo of conversations) {
        const principal = String(convo.withPrincipal);
        if (principal === activeChatPrincipal) continue; // suppress for open chat
        const prev = prevUnreadCounts.current.get(principal) ?? 0;
        const current = Number(convo.unreadCount);
        if (current > prev) {
          const name = (convo.profile as any)?.name ?? "Someone";
          const lastText: string = (convo.lastMessage as any)?.[0]?.text ?? "";
          toast(`New message from ${name}`, {
            description: lastText.slice(0, 80) || undefined,
            duration: 5000,
          });
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification(`Message from ${name}`, {
              body: lastText.slice(0, 120) || undefined,
            });
          }
        }
      }
    }

    // Update refs for next comparison
    prevPrincipals.current = currentPrincipals;
    prevUnreadCounts.current = new Map(
      conversations.map((c) => [
        String(c.withPrincipal),
        Number(c.unreadCount),
      ]),
    );
  }, [conversations]); // only re-run when conversation data changes

  // Likes notification — separate effect, seeded independently
  useEffect(() => {
    if (!likesInitialized.current) {
      prevLikePrincipals.current = new Set(
        likesReceived
          .filter((e) => !e.isMatched)
          .map((e) => String(e.profile.principal)),
      );
      likesInitialized.current = true;
      return;
    }

    const prefs = preferencesRef.current;
    if ((prefs as any)?.notifyLikes === false) {
      prevLikePrincipals.current = new Set(
        likesReceived
          .filter((e) => !e.isMatched)
          .map((e) => String(e.profile.principal)),
      );
      return;
    }

    for (const entry of likesReceived) {
      if (entry.isMatched) continue; // match notifications handled separately
      const principal = String(entry.profile.principal);
      if (!prevLikePrincipals.current.has(principal)) {
        const name = entry.profile.name ?? "Someone";
        toast(`${name} liked your profile!`, {
          description: "Check your Likes tab to see who's interested.",
          duration: 5000,
        });
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(`${name} liked you!`, {
            body: "Tap to see who's interested in you.",
          });
        }
      }
    }

    prevLikePrincipals.current = new Set(
      likesReceived
        .filter((e) => !e.isMatched)
        .map((e) => String(e.profile.principal)),
    );
  }, [likesReceived]);
}
