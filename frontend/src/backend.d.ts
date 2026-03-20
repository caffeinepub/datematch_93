import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Location {
    lat: number;
    lng: number;
    city: string;
}
export interface UserPreferences {
    incognito: boolean;
    notifyMatches: boolean;
    ageMax: bigint;
    ageMin: bigint;
    notifyLikes: boolean;
    notifyMessages: boolean;
    radiusKm: bigint;
}
export interface LikeEntry {
    isMatched: boolean;
    profile: UserProfile;
}
export interface QuizAnswers {
    answers: Array<bigint>;
    updatedAt: bigint;
}
export interface Message {
    id: bigint;
    text: string;
    sentAt: bigint;
    toPrincipal: Principal;
    fromPrincipal: Principal;
    readAt?: bigint;
}
export interface DiscoveryProfile {
    likedMe: boolean;
    distanceKm?: number;
    profile: UserProfile;
}
export interface Icebreaker {
    answer: string;
    prompt: string;
}
export interface ConversationSummary {
    lastMessage?: Message;
    withPrincipal: Principal;
    unreadCount: bigint;
    profile: UserProfile;
}
export interface UserProfile {
    bio: string;
    principal: Principal;
    interests: Array<string>;
    name: string;
    createdAt: bigint;
    icebreakers: Array<Icebreaker>;
    isVerified: boolean;
    genderPreference: Array<string>;
    birthday: bigint;
    gender: string;
    location?: Location;
    photos: Array<ExternalBlob>;
}
export interface backendInterface {
    blockUser(target: Principal): Promise<void>;
    deleteProfile(): Promise<void>;
    getBlockedUsers(): Promise<Array<Principal>>;
    getCompatibilityScore(target: Principal): Promise<bigint | null>;
    getConversations(): Promise<Array<ConversationSummary>>;
    getDiscovery(limit: bigint): Promise<Array<DiscoveryProfile>>;
    getFirstSharedAnswer(target: Principal): Promise<[bigint, bigint] | null>;
    getLikesReceived(): Promise<Array<LikeEntry>>;
    getLikesSent(): Promise<Array<LikeEntry>>;
    getMatchesCount(location: Location, radius: bigint): Promise<bigint>;
    getMessages(partner: Principal): Promise<Array<Message>>;
    getMyProfile(): Promise<UserProfile | null>;
    getMyQuizAnswers(): Promise<QuizAnswers | null>;
    getPreferences(): Promise<UserPreferences>;
    getPublicProfile(target: Principal): Promise<UserProfile | null>;
    markRead(partner: Principal): Promise<void>;
    reportUser(target: Principal, reason: string): Promise<void>;
    sendMessage(partner: Principal, text: string): Promise<bigint>;
    setPreferences(prefs: UserPreferences): Promise<void>;
    setProfile(name: string, birthday: bigint, bio: string, gender: string, genderPreference: Array<string>, interests: Array<string>, location: Location | null, icebreakers: Array<Icebreaker>, photos: Array<ExternalBlob>): Promise<void>;
    setQuizAnswers(answers: Array<bigint>): Promise<void>;
    swipe(target: Principal, action: string): Promise<boolean>;
    unblockUser(target: Principal): Promise<void>;
    unmatch(target: Principal): Promise<void>;
}
