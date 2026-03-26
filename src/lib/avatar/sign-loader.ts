import { ASL_SIGN_ANIMATIONS, WORD_TO_SIGN_ASL } from "./sign-animations-asl";
import { LSC_SIGN_ANIMATIONS, WORD_TO_SIGN_LSC } from "./sign-animations-lsc";
import type { SignAnimation } from "./sign-core";
import type { SignLanguageCode } from "./sign-languages";

function getAnimations(lang: SignLanguageCode): SignAnimation[] {
  return lang === "LSC" ? LSC_SIGN_ANIMATIONS : ASL_SIGN_ANIMATIONS;
}

export function getSignAnimation(id: string, lang: SignLanguageCode): SignAnimation | undefined {
  return getAnimations(lang).find((sign) => sign.id === id);
}

export function getWordMap(lang: SignLanguageCode): Readonly<Record<string, string>> {
  return lang === "LSC" ? WORD_TO_SIGN_LSC : WORD_TO_SIGN_ASL;
}

export function getKnownSignIds(lang: SignLanguageCode): ReadonlySet<string> {
  return new Set(getAnimations(lang).map((sign) => sign.id));
}
