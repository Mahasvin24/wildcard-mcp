/**
 * The client's product catalog.
 *
 * The important idea: AI shopping engines only recommend products whose
 * attributes they can parse and trust. Each product declares the
 * `requiredAttributes` that AI surfaces expect for this category, but the
 * `attributes` map is deliberately *incomplete*. The difference is a catalog
 * gap — the root cause behind several lost prompts.
 *
 * `enrich_product` (src/tools/act.ts) mutates these records in place, so within
 * a single demo session the founder sees a gap get filled and a follow-up
 * `list_opportunities` reflect the fix. (In the real product this write would
 * push back to Shopify/BigCommerce/etc.)
 */
import type { Product } from "../types.js";

/** The attribute schema AI shopping surfaces expect for sleep supplements. */
export const REQUIRED_ATTRIBUTES = [
  "active_ingredients",
  "dosage_mg",
  "melatonin_free",
  "third_party_tested",
  "vegan",
  "form",
  "servings_per_container",
  "certifications",
];

/**
 * Mutable catalog. Exported as `let` via a holder object so `enrich_product`
 * can update records and every other tool sees the change in the same session.
 */
export const catalog: Product[] = [
  {
    sku: "DZ-SLEEP-01",
    brandId: "dosaze",
    title: "Dosaze Sleep Complex",
    price: 34.0,
    description:
      "Nightly capsule blend designed to help you fall asleep and stay asleep, without melatonin.",
    requiredAttributes: REQUIRED_ATTRIBUTES,
    attributes: {
      form: "capsule",
      servings_per_container: 30,
      dosage_mg: 400,
      vegan: true,
      // MISSING (on purpose): active_ingredients, melatonin_free,
      // third_party_tested, certifications. This is the flagship gap.
    },
  },
  {
    sku: "DZ-MAG-02",
    brandId: "dosaze",
    title: "Dosaze Magnesium Glycinate",
    price: 28.0,
    description:
      "Highly-absorbable magnesium glycinate to support relaxation and deeper sleep.",
    requiredAttributes: REQUIRED_ATTRIBUTES,
    attributes: {
      form: "capsule",
      servings_per_container: 60,
      dosage_mg: 350,
      active_ingredients: ["Magnesium Glycinate"],
      vegan: true,
      // MISSING: melatonin_free, third_party_tested, certifications
    },
  },
  {
    sku: "DZ-CALM-03",
    brandId: "dosaze",
    title: "Dosaze Calm + Focus",
    price: 32.0,
    description:
      "Daytime calm without drowsiness, featuring L-Theanine and Ashwagandha.",
    requiredAttributes: REQUIRED_ATTRIBUTES,
    attributes: {
      form: "capsule",
      servings_per_container: 45,
      active_ingredients: ["L-Theanine", "Ashwagandha"],
      // MISSING: dosage_mg, melatonin_free, third_party_tested, vegan, certifications
    },
  },
];

export function getProduct(sku: string): Product | undefined {
  return catalog.find((p) => p.sku === sku);
}

/** Attributes required for the category but absent from a product. */
export function getMissingAttributes(product: Product): string[] {
  return product.requiredAttributes.filter(
    (attr) => !(attr in product.attributes),
  );
}
