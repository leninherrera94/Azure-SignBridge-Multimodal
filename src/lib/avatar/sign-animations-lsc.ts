import type { SignAnimation } from "./sign-core";

export const LSC_SIGN_ANIMATIONS: SignAnimation[] = [];
export const WORD_TO_SIGN_LSC: Record<string, string> = {};

export function getSignAnimationLSC(id: string): SignAnimation | undefined {
  return LSC_SIGN_ANIMATIONS.find((sign) => sign.id === id);
}
