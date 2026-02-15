import { CollisionFilter } from "@perplexdotgg/bounce";

export const physicGroupFlags = CollisionFilter.createBitFlags(["Player", "Ground", "Item"] as const);