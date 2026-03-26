import { ASL_SIGN_ANIMATIONS, WORD_TO_SIGN_ASL } from "./sign-animations-asl";
import { LSB_SIGN_ANIMATIONS, WORD_TO_SIGN_LSB } from "./sign-animations-lsb";
import { LSC_SIGN_ANIMATIONS, WORD_TO_SIGN_LSC } from "./sign-animations-lsc";
import type { SignAnimation } from "./sign-core";
import type { SignLanguageCode } from "./sign-languages";

export const LETTER_PREFIX: Record<SignLanguageCode, string> = {
  ASL: "letter_",
  LSC: "lsc_letra_",
  LSB: "letra_",
};

function getAnimations(lang: SignLanguageCode): SignAnimation[] {
  if (lang === "LSC") return LSC_SIGN_ANIMATIONS;
  if (lang === "LSB") return LSB_SIGN_ANIMATIONS;
  return ASL_SIGN_ANIMATIONS;
}

export function getSignAnimation(id: string, lang: SignLanguageCode): SignAnimation | undefined {
  return getAnimations(lang).find((sign) => sign.id === id);
}

export function getWordMap(lang: SignLanguageCode): Readonly<Record<string, string>> {
  if (lang === "LSC") return WORD_TO_SIGN_LSC;
  if (lang === "LSB") return WORD_TO_SIGN_LSB;
  return WORD_TO_SIGN_ASL;
}

export function getKnownSignIds(lang: SignLanguageCode): ReadonlySet<string> {
  return new Set(getAnimations(lang).map((sign) => sign.id));
}
