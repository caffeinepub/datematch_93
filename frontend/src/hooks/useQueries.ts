import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

// ─── Profile ──────────────────────────────────────────────────────────────────

export type SetProfileInput = {
  name: string;
  birthday: bigint;
  bio: string;
  gender: string;
  genderPreference: string[];
  interests: string[];
  location: { lat: number; lng: number; city: string } | null;
  icebreakers: { prompt: string; answer: string }[];
  // Array of Files (new upload) or ExternalBlobs (keep existing)
  photos: (File | ExternalBlob)[];
  onProgress?: (pct: number) => void;
};

export function useMyProfile() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: () => actor!.getMyProfile(),
    enabled: !!actor,
  });
}

export function useSetProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetProfileInput) => {
      if (!actor) throw new Error("Not connected");

      const photos: ExternalBlob[] = [];
      const toUpload = input.photos.filter((p) => p instanceof File) as File[];
      const alreadyUploaded = input.photos.filter(
        (p) => !(p instanceof File),
      ) as ExternalBlob[];

      // Progress tracking for multiple files
      let totalBytes = 0;
      let uploadedBytes = 0;

      const fileBuffers = await Promise.all(
        toUpload.map((f) => f.arrayBuffer()),
      );
      totalBytes = fileBuffers.reduce((acc, b) => acc + b.byteLength, 0);

      const uploadedBlobs = await Promise.all(
        fileBuffers.map(async (buf, i) => {
          const bytes = new Uint8Array(buf);
          const blob = ExternalBlob.fromBytes(bytes);
          return blob.withUploadProgress((pct) => {
            if (input.onProgress) {
              // Very simplified aggregate progress
              const fileWeight = buf.byteLength / totalBytes;
              const currentTotal = uploadedBytes + buf.byteLength * (pct / 100);
              input.onProgress((currentTotal / totalBytes) * 100);
            }
          });
        }),
      );

      // Combine already uploaded and newly uploaded
      // This logic depends on how we want to order them (usually new first or keep order)
      // For now we just put them all together
      const finalPhotos = [...alreadyUploaded, ...uploadedBlobs];

      try {
        await actor.setProfile(
          input.name,
          input.birthday,
          input.bio,
          input.gender,
          input.genderPreference,
          input.interests,
          input.location,
          input.icebreakers,
          finalPhotos,
        );
      } catch (err) {
        console.error("SetProfile Error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function usePublicProfile(target: string | null) {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["publicProfile", target],
    queryFn: async () => {
      const { Principal } = await import("@dfinity/principal");
      return actor!.getPublicProfile(Principal.fromText(target!));
    },
    enabled: !!actor && !!target,
  });
}

export function useDeleteProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteProfile();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

// ─── Discovery & Swipe ────────────────────────────────────────────────────────

export function useDiscovery(limit = 20) {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["discovery"],
    queryFn: () => actor!.getDiscovery(BigInt(limit)),
    enabled: !!actor,
    staleTime: 5 * 60_000,
  });
}

export type SwipeInput = { target: string; action: "like" | "pass" };

export function useSwipe() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ target, action }: SwipeInput) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@dfinity/principal");
      const result = await actor.swipe(Principal.fromText(target), action);
      return Boolean(result);
    },
    onSuccess: (isMatch) => {
      if (isMatch) {
        queryClient.invalidateQueries({ queryKey: ["matches"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
  });
}

export function useUnmatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@dfinity/principal");
      await actor.unmatch(Principal.fromText(target));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export function useConversations() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => actor!.getConversations(),
    enabled: !!actor,
    refetchInterval: 15_000,
  });
}

export function useMessages(partnerPrincipal: string | null) {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["messages", partnerPrincipal],
    queryFn: async () => {
      const { Principal } = await import("@dfinity/principal");
      const msgs = await actor!.getMessages(
        Principal.fromText(partnerPrincipal!),
      );
      // Sort ascending by sentAt so newest is at bottom
      return [...msgs].sort((a, b) => Number(a.sentAt - b.sentAt));
    },
    enabled: !!actor && !!partnerPrincipal,
    refetchInterval: 8_000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ to, text }: { to: string; text: string }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@dfinity/principal");
      return actor.sendMessage(Principal.fromText(to), text);
    },
    onMutate: async ({ to, text }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", to] });
      const previous = queryClient.getQueryData(["messages", to]);
      const myProfile = queryClient.getQueryData<any>(["myProfile"]);
      const optimisticMsg = {
        id: BigInt(-Date.now()),
        fromPrincipal: myProfile?.principal ?? null,
        toPrincipal: null,
        text,
        sentAt: BigInt(Date.now()) * 1_000_000n,
        readAt: null,
      };
      queryClient.setQueryData<any[]>(["messages", to], (old) =>
        old ? [...old, optimisticMsg] : [optimisticMsg],
      );
      return { previous };
    },
    onError: (_err, { to }, context: any) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["messages", to], context.previous);
      }
    },
    onSuccess: (_data, { to }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", to] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Compatibility Quiz ───────────────────────────────────────────────────────

export function useMyQuizAnswers() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["myQuizAnswers"],
    queryFn: () => actor!.getMyQuizAnswers(),
    enabled: !!actor,
  });
}

export function useSetQuizAnswers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (answers: number[]) => {
      if (!actor) throw new Error("Not connected");
      await actor.setQuizAnswers(answers.map(BigInt));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myQuizAnswers"] });
    },
  });
}

export function useCompatibilityScore(targetPrincipal: string | null) {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["compatibility", targetPrincipal],
    queryFn: async () => {
      const { Principal } = await import("@dfinity/principal");
      const result = await actor!.getCompatibilityScore(
        Principal.fromText(targetPrincipal!),
      );
      return result !== null ? Number(result) : null;
    },
    enabled: !!actor && !!targetPrincipal,
    staleTime: 60_000,
  });
}

export function useFirstSharedAnswer(targetPrincipal: string | null) {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["firstSharedAnswer", targetPrincipal],
    queryFn: async () => {
      const { Principal } = await import("@dfinity/principal");
      const result = await (actor as any).getFirstSharedAnswer(
        Principal.fromText(targetPrincipal!),
      );
      if (result === null) return null;
      return {
        questionIndex: Number(result[0]),
        answerIndex: Number(result[1]),
      };
    },
    enabled: !!actor && !!targetPrincipal,
    staleTime: 60_000,
  });
}

export function useMarkRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partnerPrincipal: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@dfinity/principal");
      await actor.markRead(Principal.fromText(partnerPrincipal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ─── Settings & Privacy ───────────────────────────────────────────────────────

export function usePreferences() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => actor!.getPreferences(),
    enabled: !!actor,
  });
}

export type SetPreferencesInput = {
  ageMin: number;
  ageMax: number;
  incognito: boolean;
  radiusKm: number;
  notifyMatches: boolean;
  notifyMessages: boolean;
  notifyLikes: boolean;
};

export function useSetPreferences() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: SetPreferencesInput) => {
      if (!actor) throw new Error("Not connected");
      await actor.setPreferences({
        ageMin: BigInt(prefs.ageMin),
        ageMax: BigInt(prefs.ageMax),
        incognito: prefs.incognito,
        radiusKm: BigInt(prefs.radiusKm),
        notifyMatches: prefs.notifyMatches,
        notifyMessages: prefs.notifyMessages,
        notifyLikes: prefs.notifyLikes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      queryClient.invalidateQueries({ queryKey: ["discovery"] });
    },
  });
}

export function useMatchesCount(
  location: { lat: number; lng: number; city: string } | null,
  radius: number,
) {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["matchesCount", location, radius],
    queryFn: async () => {
      if (!actor || !location) return BigInt(0);
      return actor.getMatchesCount(location, BigInt(radius));
    },
    enabled: !!actor && !!location,
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@dfinity/principal");
      await actor.blockUser(Principal.fromText(target));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@dfinity/principal");
      await actor.unblockUser(Principal.fromText(target));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["discovery"] });
    },
  });
}

export function useBlockedUsers() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["blockedUsers"],
    queryFn: () => actor!.getBlockedUsers(),
    enabled: !!actor,
  });
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export type LikeEntry = {
  profile: {
    principal: unknown;
    name: string;
    birthday: bigint;
    photos?: { getDirectURL(): string }[] | null;
    isVerified?: boolean;
    gender?: string;
  };
  isMatched: boolean;
};

export function useGetLikesReceived() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["likesReceived"],
    queryFn: async () => {
      const result = await (actor as any).getLikesReceived();
      return result as LikeEntry[];
    },
    enabled: !!actor,
    refetchInterval: 30_000,
  });
}

export function useGetLikesSent() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["likesSent"],
    queryFn: async () => {
      const result = await (actor as any).getLikesSent();
      return result as LikeEntry[];
    },
    enabled: !!actor,
    refetchInterval: 60_000,
  });
}

export function useReportUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      target,
      reason,
    }: {
      target: string;
      reason: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@dfinity/principal");
      await actor.reportUser(Principal.fromText(target), reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
  });
}
