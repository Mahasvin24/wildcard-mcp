/**
 * Seed brands for the demo. The client is Dosaze (Wildcard's real flagship
 * case study — a sleep-supplement DTC brand). The rest are plausible
 * sleep-supplement competitors it fights for AI shopping visibility against.
 *
 * The numbers tell a deliberate story: Dosaze has strong sentiment but a
 * middling Brand Rank and low Share of Voice — i.e. shoppers *like* it once
 * they find it, but the AIs don't surface it enough. That gap is exactly what
 * the Track -> Act -> Publish -> Measure loop closes.
 */
import type { Brand } from "../types.js";

export const brands: Brand[] = [
  {
    id: "dosaze",
    name: "Dosaze",
    isClient: true,
    category: "Sleep supplements",
    brandRank: 6,
    shareOfVoice: 0.11,
    sentiment: {
      positive: 0.82,
      neutral: 0.14,
      negative: 0.04,
      sampleLanguage: [
        "gentle, non-habit-forming option",
        "customers report deeper sleep within a week",
        "clean ingredient list, no melatonin",
      ],
    },
  },
  {
    id: "olly",
    name: "OLLY Sleep",
    isClient: false,
    category: "Sleep supplements",
    brandRank: 1,
    shareOfVoice: 0.31,
    sentiment: {
      positive: 0.71,
      neutral: 0.2,
      negative: 0.09,
      sampleLanguage: [
        "widely available and affordable",
        "melatonin-based, popular gummy",
        "some find it too strong",
      ],
    },
  },
  {
    id: "calm",
    name: "Natural Vitality Calm",
    isClient: false,
    category: "Sleep supplements",
    brandRank: 2,
    shareOfVoice: 0.22,
    sentiment: {
      positive: 0.76,
      neutral: 0.18,
      negative: 0.06,
      sampleLanguage: [
        "well-known magnesium drink mix",
        "good for relaxation before bed",
      ],
    },
  },
  {
    id: "nested",
    name: "Nested Naturals Luna",
    isClient: false,
    category: "Sleep supplements",
    brandRank: 4,
    shareOfVoice: 0.14,
    sentiment: {
      positive: 0.79,
      neutral: 0.16,
      negative: 0.05,
      sampleLanguage: [
        "herbal blend, vegan-friendly",
        "third-party tested",
      ],
    },
  },
  {
    id: "natrol",
    name: "Natrol Melatonin",
    isClient: false,
    category: "Sleep supplements",
    brandRank: 3,
    shareOfVoice: 0.18,
    sentiment: {
      positive: 0.68,
      neutral: 0.22,
      negative: 0.1,
      sampleLanguage: ["classic melatonin brand", "budget pick"],
    },
  },
];

/** Convenience accessor for the brand we're optimizing. */
export const clientBrand = brands.find((b) => b.isClient)!;

export function getBrand(id: string): Brand | undefined {
  return brands.find((b) => b.id === id);
}
