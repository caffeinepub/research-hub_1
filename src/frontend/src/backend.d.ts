import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Message {
    id: bigint;
    gif?: string;
    createdAt: Time;
    room: bigint;
    text: string;
    author: Principal;
    image?: string;
}
export type Time = bigint;
export interface ChatRoom {
    id: bigint;
    topic: string;
    name: string;
    createdAt: Time;
}
export interface User {
    bio: string;
    username: string;
    researchInterests: string;
    avatarColor: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMessage(roomId: bigint, text: string, image: string | null, gif: string | null): Promise<bigint>;
    addRoom(name: string, topic: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteMessage(id: bigint): Promise<void>;
    getAllRooms(): Promise<Array<ChatRoom>>;
    getCallerUserProfile(): Promise<User | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMessages(roomId: bigint, page: bigint, pageSize: bigint): Promise<Array<Message>>;
    getRoomById(id: bigint): Promise<ChatRoom | null>;
    getUserProfile(user: Principal): Promise<User | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(username: string, bio: string, interests: string, color: string): Promise<void>;
}
