/**
 * src/lib/avatar/sign-animations-lsb.ts
 *
 * Libras (Língua Brasileira de Sinais) — Brazilian Sign Language.
 * Converted from libras-animations.js using the same bone-rotation schema
 * as sign-animations-asl.ts and sign-animations-lsc.ts.
 *
 * 73 lexical signs + 26 fingerspelling letters (letra_a … letra_z)
 * 98 Portuguese word → sign-ID mappings
 */

import {
  C_HAND,
  FIST,
  HAND_Y,
  ILY,
  L_HAND,
  NATURAL_HAND,
  O_HAND,
  OPEN_HAND,
  POINT,
  REST_ARM_L,
  REST_ARM_R,
  V_HAND,
  W_HAND,
  hand,
  type ArmPose,
  type SignAnimation,
} from "./sign-core";

// ─── Named hand poses (aliases for readability) ───────────────────────────────

const Y_HAND = HAND_Y;  // thumb + pinky extended

// ─── Reference arm poses ─────────────────────────────────────────────────────
// All values calibrated to match libras-animations.js exactly.

// Arm beside the face (greeting / wave) — identical to HELLO_ARM in ASL
const FACE_ARM_R: ArmPose = {
  shoulder: [ 22,  63,  10],
  upperArm: [ 52,  13,   4],
  forearm:  [131,-180,  35],
  hand:     [ 10, -14,   5],
};

// Fist in front of chest — identical to FIST_CHEST in ASL
const CHEST_ARM_R: ArmPose = {
  shoulder: [ 16, -20, -27],
  upperArm: [ 45,  -5,   0],
  forearm:  [-12,  27,-133],
  hand:     [ -5,  61,   5],
};

// Hand in front, palm facing camera — identical to ILY_ARM in ASL
const FRONT_ARM_R: ArmPose = {
  shoulder: [ 40,  19, -32],
  upperArm: [ 36,  68,  -3],
  forearm:  [ 93, -39, -51],
  hand:     [ -9,-113,   0],
};

// Arm extended laterally — identical to NO_ARM in ASL
const SIDE_ARM_R: ArmPose = {
  shoulder: [ 35,  30, -20],
  upperArm: [ 42,  50,  -2],
  forearm:  [ 95, -60, -50],
  hand:     [ -8,-100,   0],
};

// Semi-raised frontal (chin/mouth signs) — unique to LSB
const CHIN_ARM_R: ArmPose = {
  shoulder: [ 30,  26, -34],
  upperArm: [ 47,  35,   9],
  forearm:  [110, -65, -44],
  hand:     [  0,   0,   0],
};

// ─── Fingerspelling arm variants ──────────────────────────────────────────────

const SPELL_ARM_R    = FRONT_ARM_R;
const SPELL_ARM_SIDE: ArmPose = { ...FRONT_ARM_R, hand: [-9,  -60, 0] };
const SPELL_ARM_DOWN: ArmPose = { ...FRONT_ARM_R, hand: [-9, -113, 30] };

// ─── Fingerspelling helper (450 ms) ──────────────────────────────────────────

function letra(
  l: string,
  t: number, i: number, m: number, r: number, p: number,
  arm: ArmPose = SPELL_ARM_R,
): SignAnimation {
  const h = hand(t, i, m, r, p);
  return {
    id: `letra_${l}`,
    name: l.toUpperCase(),
    duration: 450,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: h, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: arm, rightHand: h },
      { time: 0.85, rightArm: arm },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  };
}

// ─── LSB sign animations ──────────────────────────────────────────────────────

export const LSB_SIGN_ANIMATIONS: SignAnimation[] = [

  // ── SAUDAÇÕES ────────────────────────────────────────────────────────────────

  // 1. Olá — acena ao lado do rosto
  {
    id: "ola", name: "Olá", duration: 1800,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: { ...FACE_ARM_R, hand: [10,-14, 5] }, rightHand: OPEN_HAND },
      { time: 0.32, rightArm: { ...FACE_ARM_R, hand: [10, 20, 5] } },
      { time: 0.50, rightArm: { ...FACE_ARM_R, hand: [10,-40, 5] } },
      { time: 0.68, rightArm: { ...FACE_ARM_R, hand: [10, 20, 5] } },
      { time: 0.85, rightArm: { ...FACE_ARM_R, hand: [10,-40, 5] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // 2. Bom dia — mão espalmada desce da testa
  {
    id: "bom_dia", name: "Bom Dia", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.20, rightArm: { shoulder:[28,70,15], upperArm:[58,15,5], forearm:[138,-175,38], hand:[8,-10,4] }, rightHand: OPEN_HAND },
      { time: 0.55, rightArm: { shoulder:[22,40,-5], upperArm:[45,10,0], forearm:[105,-100,20], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // 3. Boa tarde — mão espalmada move lateralmente
  {
    id: "boa_tarde", name: "Boa Tarde", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.20, rightArm: { shoulder:[22,40,-20], upperArm:[45,10,0], forearm:[100,-90,15], hand:[0,0,0] }, rightHand: OPEN_HAND },
      { time: 0.55, rightArm: { shoulder:[22,55,-20], upperArm:[45,15,0], forearm:[100,-90,15], hand:[0,0,0] } },
      { time: 0.80, rightArm: { shoulder:[22,40,-20], upperArm:[45,10,0], forearm:[100,-90,15], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // 4. Boa noite — braços cruzam e abrem
  {
    id: "boa_noite", name: "Boa Noite", duration: 1700,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.25,
        rightArm: { shoulder:[20, 5,-15], upperArm:[38,0,0], forearm:[85,-70,-30], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 5, 15], upperArm:[38,0,0], forearm:[85, 70, 30], hand:[0,0,0] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.60,
        rightArm: { shoulder:[20,20,-30], upperArm:[38,10,0], forearm:[85,-90,-50], hand:[0,0,0] },
        leftArm:  { shoulder:[20,20, 30], upperArm:[38,10,0], forearm:[85, 90, 50], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 5. Tchau — aceno de despedida
  {
    id: "tchau", name: "Tchau", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: { ...FACE_ARM_R, hand: [10,-14, 5] }, rightHand: OPEN_HAND },
      { time: 0.40, rightArm: { ...FACE_ARM_R, hand: [10, 30, 5] } },
      { time: 0.65, rightArm: { ...FACE_ARM_R, hand: [10,-30, 5] } },
      { time: 0.85, rightArm: { ...FACE_ARM_R, hand: [10, 30, 5] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── CORTESIA / RESPOSTAS ─────────────────────────────────────────────────────

  // 6. Obrigado — mão toca queixo e abre para frente
  {
    id: "obrigado", name: "Obrigado", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.28, rightArm: CHIN_ARM_R,
        leftArm: { shoulder:[27,-47,-1], upperArm:[35,61,14], forearm:[0,0,0], hand:[0,0,0] },
        rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.65,
        rightArm: { shoulder:[30,26,-34], upperArm:[47,44,17], forearm:[109,34,-39], hand:[-1,-42,0] },
        leftArm:  { shoulder:[27,-47,-1], upperArm:[35,61,14], forearm:[-4,0,0],    hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 7. Por favor — mão aberta faz círculo no peito
  {
    id: "por_favor", name: "Por Favor", duration: 1700,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.12, rightArm: { ...CHEST_ARM_R, hand:[-5,50,0] }, rightHand: OPEN_HAND },
      { time: 0.32, rightArm: { ...CHEST_ARM_R, shoulder:[21,-15,-27], hand:[-5,50,0] } },
      { time: 0.57, rightArm: { ...CHEST_ARM_R, shoulder:[11,-25,-27], hand:[-5,50,0] } },
      { time: 0.80, rightArm: { ...CHEST_ARM_R, shoulder:[21,-20,-27], hand:[-5,50,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // 8. Sim — punho faz gesto afirmativo vertical
  {
    id: "sim", name: "Sim", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: NATURAL_HAND },
      { time: 0.12, rightArm: { ...CHEST_ARM_R, hand:[-5,61,5] } },
      { time: 0.30, rightArm: { ...CHEST_ARM_R, hand:[ 20,61,5] } },
      { time: 0.48, rightArm: { ...CHEST_ARM_R, hand:[-20,61,5] } },
      { time: 0.65, rightArm: { ...CHEST_ARM_R, hand:[ 20,61,5] } },
      { time: 0.82, rightArm: { ...CHEST_ARM_R, hand:[-20,61,5] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // 9. Não — indicador+médio balançam horizontalmente
  {
    id: "nao", name: "Não", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: hand(60,0,0,90,90), leftHand: NATURAL_HAND },
      { time: 0.12, rightArm: SIDE_ARM_R },
      { time: 0.32, rightHand: hand(60,75,75,90,90) },
      { time: 0.52, rightHand: hand(60, 0, 0,90,90) },
      { time: 0.72, rightHand: hand(60,75,75,90,90) },
      { time: 0.88, rightHand: hand(60, 0, 0,90,90) },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // 10. Desculpe — punho fechado gira no peito
  {
    id: "desculpe", name: "Desculpe", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: NATURAL_HAND },
      { time: 0.12, rightArm: { ...CHEST_ARM_R, hand:[-5,55,0] } },
      { time: 0.32, rightArm: { ...CHEST_ARM_R, shoulder:[21,-15,-27], hand:[-5,55,0] } },
      { time: 0.57, rightArm: { ...CHEST_ARM_R, shoulder:[11,-25,-27], hand:[-5,55,0] } },
      { time: 0.80, rightArm: { ...CHEST_ARM_R, shoulder:[21,-20,-27], hand:[-5,55,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // 11. Ajuda — punho sobre palma, ambos sobem
  {
    id: "ajuda", name: "Ajuda", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: OPEN_HAND },
      { time: 0.22,
        rightArm: { shoulder:[30,26,-34], upperArm:[47,44,17], forearm:[108,36,-27], hand:[-1,-81,0] },
        leftArm:  { shoulder:[24,-43, 9], upperArm:[32,61,25], forearm:[ 21, 5, 70], hand:[ 2,-123,0] },
        rightHand: FIST, leftHand: OPEN_HAND },
      { time: 0.65,
        rightArm: { shoulder:[30,40,-46], upperArm:[46,44,17], forearm:[108,36,-27], hand:[-1,-81,0] },
        leftArm:  { shoulder:[23,-61, 9], upperArm:[40,63,25], forearm:[ 21, 5, 70], hand:[ 2,-123,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── PRONOMES ─────────────────────────────────────────────────────────────────

  // 12. Eu — dedo indicador aponta para o peito
  {
    id: "eu", name: "Eu", duration: 1100,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: POINT },
      { time: 0.30, rightArm: { ...CHEST_ARM_R, hand:[-5,61,5] }, rightHand: POINT },
      { time: 0.65, rightArm: { ...CHEST_ARM_R, hand:[-5,61,5] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 13. Você — indicador aponta para frente
  {
    id: "voce", name: "Você", duration: 1100,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: POINT },
      { time: 0.25, rightArm: { shoulder:[20,10,-20], upperArm:[30,10,0], forearm:[80,-90,-45], hand:[0,0,0] }, rightHand: POINT },
      { time: 0.60, rightArm: { shoulder:[20,15,-20], upperArm:[30,10,0], forearm:[80,-90,-45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 14. Nós — indicador faz arco da direita para esquerda
  {
    id: "nos", name: "Nós", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: POINT },
      { time: 0.20, rightArm: { shoulder:[20,30,-20], upperArm:[30,10,0], forearm:[80,-90,-45], hand:[0,0,0] }, rightHand: POINT },
      { time: 0.50, rightArm: { shoulder:[20,10,-10], upperArm:[30,10,0], forearm:[80,-90,-45], hand:[0,0,0] } },
      { time: 0.80, rightArm: { shoulder:[20,-10,-20], upperArm:[30,10,0], forearm:[80,-90,-45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 15. Ele / Ela — indicador aponta para o lado
  {
    id: "ele", name: "Ele", duration: 1100,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: POINT },
      { time: 0.30, rightArm: { shoulder:[20,40,-20], upperArm:[30,15,0], forearm:[80,-90,-45], hand:[0,0,0] }, rightHand: POINT },
      { time: 0.65, rightArm: { shoulder:[20,50,-20], upperArm:[30,15,0], forearm:[80,-90,-45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 16. Eles — indicador varre da esquerda para direita
  {
    id: "eles", name: "Eles", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: POINT },
      { time: 0.20, rightArm: { shoulder:[20,50,-20], upperArm:[30,10,0], forearm:[80,-90,-45], hand:[0,0,0] }, rightHand: POINT },
      { time: 0.60, rightArm: { shoulder:[20,10,-20], upperArm:[30,10,0], forearm:[80,-90,-45], hand:[0,0,0] } },
      { time: 0.80, rightArm: { shoulder:[20,-10,-20], upperArm:[30,10,0], forearm:[80,-90,-45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // ── EMOÇÕES / ESTADOS ────────────────────────────────────────────────────────

  // 17. Feliz — mão aberta faz círculo no peito
  {
    id: "feliz", name: "Feliz", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: { ...CHEST_ARM_R, shoulder:[21,-15,-27], hand:[-5,50,0] }, rightHand: OPEN_HAND },
      { time: 0.35, rightArm: { ...CHEST_ARM_R, shoulder:[16,-20,-27], hand:[-5,50,0] } },
      { time: 0.60, rightArm: { ...CHEST_ARM_R, shoulder:[21,-25,-27], hand:[-5,50,0] } },
      { time: 0.82, rightArm: { ...CHEST_ARM_R, shoulder:[21,-20,-27], hand:[-5,50,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // 18. Triste — mãos deslizam pelo rosto para baixo
  {
    id: "triste", name: "Triste", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.22,
        rightArm: { shoulder:[28, 68, 12], upperArm:[56,14, 5], forearm:[136,-178, 36], hand:[ 9,-12, 4] },
        leftArm:  { shoulder:[28, 68, -8], upperArm:[56,14,-5], forearm:[136, 178,-36], hand:[ 9, 12,-4] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.65,
        rightArm: { shoulder:[20,30,-5], upperArm:[42,10,0], forearm:[100,-90, 20], hand:[0,0,0] },
        leftArm:  { shoulder:[20,30, 5], upperArm:[42,10,0], forearm:[100,  90,-20], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 19. Amor — braços cruzados no peito
  {
    id: "amor", name: "Amor", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: FIST },
      { time: 0.25,
        rightArm: { shoulder:[20, 5,-15], upperArm:[38,0,0], forearm:[85,-60,-25], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 5, 15], upperArm:[38,0,0], forearm:[85, 60, 25], hand:[0,0,0] },
        rightHand: FIST, leftHand: FIST },
      { time: 0.70,
        rightArm: { shoulder:[20, 5,-10], upperArm:[38,0,0], forearm:[85,-50,-20], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 5, 10], upperArm:[38,0,0], forearm:[85, 50, 20], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 20. Cansado — braços caem, expressão de cansaço
  {
    id: "cansado", name: "Cansado", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.25,
        rightArm: { shoulder:[22, 5,-18], upperArm:[40,0,0], forearm:[90,-70,-30], hand:[0,0,0] },
        leftArm:  { shoulder:[22, 5, 18], upperArm:[40,0,0], forearm:[90, 70, 30], hand:[0,0,0] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.65,
        rightArm: { shoulder:[30, 5,-18], upperArm:[48,0,0], forearm:[90,-70,-30], hand:[0,0,0] },
        leftArm:  { shoulder:[30, 5, 18], upperArm:[48,0,0], forearm:[90, 70, 30], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 21. Com fome — mão em C toca o estômago
  {
    id: "com_fome", name: "Com Fome", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: C_HAND },
      { time: 0.30, rightArm: { shoulder:[20,-10,-20], upperArm:[35,-5,0], forearm:[80,-80,-40], hand:[0,0,0] }, rightHand: C_HAND },
      { time: 0.60, rightArm: { shoulder:[25,-10,-20], upperArm:[38,-5,0], forearm:[80,-80,-40], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // ── PERGUNTAS ────────────────────────────────────────────────────────────────

  // 22. Como — palmas para cima, questionamento
  {
    id: "como", name: "Como", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.30,
        rightArm: { shoulder:[20, 0,-20], upperArm:[30,0,0], forearm:[80, 90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 0, 20], upperArm:[30,0,0], forearm:[80,-90, 90], hand:[0,0,0] },
        rightHand: C_HAND, leftHand: C_HAND },
      { time: 0.70,
        rightArm: { shoulder:[20, 0,-20], upperArm:[30,0,0], forearm:[80,  0,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 0, 20], upperArm:[30,0,0], forearm:[80,  0, 90], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 23. O que — palmas balançam de lado
  {
    id: "o_que", name: "O Que", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.20,
        rightArm: { shoulder:[20,-10,-20], upperArm:[30,-10,0], forearm:[80,0,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20,-10, 20], upperArm:[30,-10,0], forearm:[80,0, 90], hand:[0,0,0] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.45,
        rightArm: { shoulder:[20,-20,-20], upperArm:[30,-10,0], forearm:[80,0,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20,-20, 20], upperArm:[30,-10,0], forearm:[80,0, 90], hand:[0,0,0] } },
      { time: 0.70,
        rightArm: { shoulder:[20,  0,-20], upperArm:[30,-10,0], forearm:[80,0,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20,  0, 20], upperArm:[30,-10,0], forearm:[80,0, 90], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 24. Onde — indicador balança de lado a lado
  {
    id: "onde", name: "Onde", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.20, rightArm: { shoulder:[20,20,-20], upperArm:[30,10,-10], forearm:[90,-90,-45], hand:[0,0,0] }, rightHand: POINT },
      { time: 0.42, rightArm: { shoulder:[20,20,-20], upperArm:[30,10,-10], forearm:[90,-120,-45], hand:[0,0,0] } },
      { time: 0.64, rightArm: { shoulder:[20,20,-20], upperArm:[30,10,-10], forearm:[90,-60,-45], hand:[0,0,0] } },
      { time: 0.84, rightArm: { shoulder:[20,20,-20], upperArm:[30,10,-10], forearm:[90,-120,-45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 25. Quando — indicador faz círculo
  {
    id: "quando", name: "Quando", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND },
      { time: 0.22,
        rightArm: { shoulder:[20,20,-20], upperArm:[30,10,-10], forearm:[80,0,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[20,20, 20], upperArm:[30,10, 10], forearm:[80,0, 45], hand:[0,0,0] },
        rightHand: POINT, leftHand: POINT },
      { time: 0.52, rightArm: { shoulder:[20,30,-20], upperArm:[40,20,-10], forearm:[80,0,-60], hand:[0,0,0] } },
      { time: 0.80, rightArm: { shoulder:[20,20,-20], upperArm:[30,10,-10], forearm:[80,0,-45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 26. Por que — dedo na testa, depois abre
  {
    id: "por_que", name: "Por Que", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.30, rightArm: { shoulder:[25,80,20], upperArm:[60,20,10], forearm:[150,-180,45], hand:[0,0,0] }, rightHand: POINT },
      { time: 0.70, rightArm: { shoulder:[25,50,-10], upperArm:[40,0,0], forearm:[100,-90,20], hand:[0,0,0] }, rightHand: Y_HAND },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 27. Quem — gancho indicador no queixo
  {
    id: "quem", name: "Quem", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.22, rightArm: { shoulder:[22,63,10], upperArm:[60,0,0], forearm:[140,-180,35], hand:[0,0,0] }, rightHand: hand(90,45,90,90,90) },
      { time: 0.42, rightHand: hand(90,90,90,90,90) },
      { time: 0.62, rightHand: hand(90,45,90,90,90) },
      { time: 0.80, rightHand: hand(90,90,90,90,90) },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // ── VERBOS COMUNS ────────────────────────────────────────────────────────────

  // 28. Ir — indicadores apontam para frente
  {
    id: "ir", name: "Ir", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND },
      { time: 0.30,
        rightArm: { shoulder:[20,30,-20], upperArm:[40,10,0], forearm:[80,-90,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[20,30, 20], upperArm:[40,10,0], forearm:[80, 90, 45], hand:[0,0,0] },
        rightHand: POINT, leftHand: POINT },
      { time: 0.65,
        rightArm: { shoulder:[20,10,-20], upperArm:[20,-10,0], forearm:[40,-90,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[20,-10,0], forearm:[40, 90, 45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 29. Vir — indicador puxa em direção ao corpo
  {
    id: "vir", name: "Vir", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND },
      { time: 0.30,
        rightArm: { shoulder:[20,30,-20], upperArm:[40,10,0], forearm:[80,-90,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[20,30, 20], upperArm:[40,10,0], forearm:[80, 90, 45], hand:[0,0,0] },
        rightHand: hand(90,0,90,90,90), leftHand: hand(90,0,90,90,90) },
      { time: 0.62,
        rightArm: { shoulder:[20,10,-10], upperArm:[20,0,0], forearm:[80,-90,-45], hand:[0,-90,0] },
        leftArm:  { shoulder:[20,10, 10], upperArm:[20,0,0], forearm:[80, 90, 45], hand:[0, 90,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 30. Comer — mão O leva comida à boca
  {
    id: "comer", name: "Comer", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.25, rightArm: { shoulder:[22,63,10], upperArm:[60,0,0], forearm:[140,-180,35], hand:[0,0,0] }, rightHand: O_HAND },
      { time: 0.52, rightArm: { shoulder:[20,50,10], upperArm:[55,0,0], forearm:[130,-180,35], hand:[0,0,0] } },
      { time: 0.72, rightArm: { shoulder:[22,63,10], upperArm:[60,0,0], forearm:[140,-180,35], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 31. Beber — mão C leva copo à boca
  {
    id: "beber", name: "Beber", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: C_HAND },
      { time: 0.30, rightArm: { shoulder:[22,63,10], upperArm:[60,0,0], forearm:[140,-180,35], hand:[0,0,0] }, rightHand: C_HAND },
      { time: 0.60, rightArm: { shoulder:[22,50,10], upperArm:[50,0,0], forearm:[120,-180,35], hand:[0,0,0] } },
      { time: 0.80, rightArm: { shoulder:[22,63,10], upperArm:[60,0,0], forearm:[140,-180,35], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 32. Falar — indicador em frente à boca, movimento
  {
    id: "falar", name: "Falar", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: POINT },
      { time: 0.20, rightArm: { shoulder:[22,63,10], upperArm:[56,13,4], forearm:[131,-180,35], hand:[10,-14,5] }, rightHand: POINT },
      { time: 0.42, rightArm: { ...FACE_ARM_R, hand:[10, 20, 5] } },
      { time: 0.62, rightArm: { ...FACE_ARM_R, hand:[10,-14, 5] } },
      { time: 0.80, rightArm: { ...FACE_ARM_R, hand:[10, 20, 5] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 33. Ver — V aponta para os olhos
  {
    id: "ver", name: "Ver", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: V_HAND },
      { time: 0.28, rightArm: { shoulder:[22,63,10], upperArm:[55,13,4], forearm:[128,-180,35], hand:[10,-14,5] }, rightHand: V_HAND },
      { time: 0.55, rightArm: { shoulder:[20,40,-10], upperArm:[40,10,0], forearm:[90,-90,15], hand:[0,0,0] } },
      { time: 0.75, rightArm: { shoulder:[22,63,10], upperArm:[55,13,4], forearm:[128,-180,35], hand:[10,-14,5] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 34. Ouvir — mão atrás da orelha
  {
    id: "ouvir", name: "Ouvir", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.30, rightArm: { shoulder:[24,68,14], upperArm:[54,15,5], forearm:[135,-178,38], hand:[10,-12,4] }, rightHand: OPEN_HAND },
      { time: 0.70, rightArm: { shoulder:[24,68,14], upperArm:[54,15,5], forearm:[135,-178,38], hand:[12,-10,4] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 35. Aprender — mão vai da testa para baixo, fechando
  {
    id: "aprender", name: "Aprender", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.28, rightArm: { shoulder:[28,70,15], upperArm:[58,15,5], forearm:[138,-175,38], hand:[8,-10,4] }, rightHand: OPEN_HAND },
      { time: 0.65, rightArm: { shoulder:[22,40,-5], upperArm:[45,10,0], forearm:[105,-100,20], hand:[0,0,0] }, rightHand: FIST },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 36. Trabalhar — punhos batem alternadamente
  {
    id: "trabalhar", name: "Trabalhar", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: FIST },
      { time: 0.25,
        rightArm: { shoulder:[20,20,-10], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20,20, 10], upperArm:[30,0,0], forearm:[80, 90, 90], hand:[0,0,0] } },
      { time: 0.50,
        rightArm: { shoulder:[15,10,-10], upperArm:[25,0,0], forearm:[80,-90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[15,10, 10], upperArm:[25,0,0], forearm:[80, 90, 90], hand:[0,0,0] } },
      { time: 0.75,
        rightArm: { shoulder:[20,20,-10], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20,20, 10], upperArm:[30,0,0], forearm:[80, 90, 90], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 37. Querer — mãos puxam em direção ao corpo
  {
    id: "querer", name: "Querer", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND },
      { time: 0.30,
        rightArm: { shoulder:[20,-10,-20], upperArm:[30,-10,0], forearm:[80,0,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20,-10, 20], upperArm:[30,-10,0], forearm:[80,0, 90], hand:[0,0,0] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.62,
        rightArm: { shoulder:[15,-20,-20], upperArm:[20,0,0], forearm:[100,0,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[15,-20, 20], upperArm:[20,0,0], forearm:[100,0, 90], hand:[0,0,0] },
        rightHand: hand(30,50,50,50,50), leftHand: hand(30,50,50,50,50) },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 38. Precisar — punho fechado toca o peito
  {
    id: "precisar", name: "Precisar", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: FIST },
      { time: 0.30, rightArm: { ...CHEST_ARM_R, hand:[-5,61,5] }, rightHand: FIST },
      { time: 0.55, rightArm: { ...CHEST_ARM_R, shoulder:[21,-20,-27], hand:[-5,61,5] } },
      { time: 0.80, rightArm: { ...CHEST_ARM_R, hand:[-5,61,5] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 39. Ter — mão fecha sobre si mesma
  {
    id: "ter", name: "Ter", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.30, rightArm: { ...CHEST_ARM_R }, rightHand: OPEN_HAND },
      { time: 0.60, rightArm: { ...CHEST_ARM_R }, rightHand: FIST },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 40. Fazer — punhos rodam um sobre o outro
  {
    id: "fazer", name: "Fazer", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: FIST },
      { time: 0.25,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 90], hand:[0,0,0] } },
      { time: 0.55,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0, 90,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 90], hand:[0,-90,0] } },
      { time: 0.80,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 90], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── SUBSTANTIVOS / PESSOAS / LUGARES ─────────────────────────────────────────

  // 41. Casa — mãos formam telhado
  {
    id: "casa", name: "Casa", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.28,
        rightArm: { shoulder:[22, 5,-15], upperArm:[40,0,0], forearm:[88,-65,-28], hand:[0,0,0] },
        leftArm:  { shoulder:[22, 5, 15], upperArm:[40,0,0], forearm:[88, 65, 28], hand:[0,0,0] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.60,
        rightArm: { shoulder:[15, 5,-20], upperArm:[32,0,0], forearm:[78,-90,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[15, 5, 20], upperArm:[32,0,0], forearm:[78, 90, 45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 42. Escola — mãos batem palmas
  {
    id: "escola", name: "Escola", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.28,
        rightArm: { shoulder:[20,10,-10], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 0, 10], upperArm:[30,0,0], forearm:[80, 90,  0], hand:[0,0,0] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.55,
        rightArm: { shoulder:[20,10,-10], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 0, 10], upperArm:[30,0,0], forearm:[80, 90,  0], hand:[0,0,0] } },
      { time: 0.80,
        rightArm: { shoulder:[20,10,-10], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 0, 10], upperArm:[30,0,0], forearm:[80, 90,  0], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 43. Médico — M toca o pulso
  {
    id: "medico", name: "Médico", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.30,
        rightArm: { shoulder:[20,20,-10], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 0, 10], upperArm:[30,0,0], forearm:[80, 90,  0], hand:[0,0,0] },
        rightHand: hand(80,70,70,70,90), leftHand: OPEN_HAND },
      { time: 0.60,
        rightArm: { shoulder:[20,15,-10], upperArm:[30,0,0], forearm:[80,-90,-90], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 44. Família — F vai de um lado para o outro
  {
    id: "familia", name: "Família", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND },
      { time: 0.25,
        rightArm: { shoulder:[20,30,-15], upperArm:[35,10,0], forearm:[82,-90,-42], hand:[0,0,0] },
        leftArm:  { shoulder:[20,30, 15], upperArm:[35,10,0], forearm:[82, 90, 42], hand:[0,0,0] },
        rightHand: hand(50,70,0,0,0), leftHand: hand(50,70,0,0,0) },
      { time: 0.60,
        rightArm: { shoulder:[20,50,-25], upperArm:[38,10,0], forearm:[82,-90,-42], hand:[0,0,0] },
        leftArm:  { shoulder:[20,50, 25], upperArm:[38,10,0], forearm:[82, 90, 42], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 45. Amigo — dedos indicadores entrelaçam
  {
    id: "amigo", name: "Amigo", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: POINT, leftHand: POINT },
      { time: 0.25,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 45], hand:[0,0,0] } },
      { time: 0.55,
        rightArm: { shoulder:[20,10,-10], upperArm:[30,0,0], forearm:[80,-90,-30], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 10], upperArm:[30,0,0], forearm:[80, 90, 30], hand:[0,0,0] } },
      { time: 0.80,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── TEMPO / DATAS ────────────────────────────────────────────────────────────

  // 46. Hoje — indicadores apontam para baixo (presente)
  {
    id: "hoje", name: "Hoje", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND },
      { time: 0.28,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-45], hand:[ 45,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 45], hand:[-45,0,0] },
        rightHand: POINT, leftHand: POINT },
      { time: 0.65,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-45], hand:[ 60,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 45], hand:[-60,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 47. Ontem — polegar aponta para trás
  {
    id: "ontem", name: "Ontem", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: L_HAND },
      { time: 0.30, rightArm: { shoulder:[22,63,10], upperArm:[52,13,4], forearm:[131,-180,35], hand:[10,-14,5] }, rightHand: hand(0,90,90,90,90) },
      { time: 0.65, rightArm: { shoulder:[20,50,10], upperArm:[45, 8,3], forearm:[120,-170,32], hand:[ 8,-12,4] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 48. Amanhã — polegar aponta para frente
  {
    id: "amanha", name: "Amanhã", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: hand(0,90,90,90,90) },
      { time: 0.30, rightArm: { shoulder:[22,63,10], upperArm:[52,13,4], forearm:[131,-180,35], hand:[10,-14,5] }, rightHand: hand(0,90,90,90,90) },
      { time: 0.65, rightArm: { shoulder:[20,55,12], upperArm:[48,12,3], forearm:[125,-175,33], hand:[ 8,-12,4] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 49. Agora — palmas para baixo descem levemente
  {
    id: "agora", name: "Agora", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND },
      { time: 0.28,
        rightArm: { shoulder:[20, 5,-18], upperArm:[38,0,0], forearm:[88,-75,-32], hand:[30,0,0] },
        leftArm:  { shoulder:[20, 5, 18], upperArm:[38,0,0], forearm:[88, 75, 32], hand:[30,0,0] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.62,
        rightArm: { shoulder:[25, 5,-18], upperArm:[43,0,0], forearm:[92,-75,-32], hand:[30,0,0] },
        leftArm:  { shoulder:[25, 5, 18], upperArm:[43,0,0], forearm:[92, 75, 32], hand:[30,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 50. Depois — mão move para frente
  {
    id: "depois", name: "Depois", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.30, rightArm: { shoulder:[20,10,-20], upperArm:[30,10,0], forearm:[80,-90,-45], hand:[0,0,0] }, rightHand: OPEN_HAND },
      { time: 0.65, rightArm: { shoulder:[20,20,-20], upperArm:[30,10,0], forearm:[70,-90,-45], hand:[0,-20,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // ── NÚMEROS 1–10 ─────────────────────────────────────────────────────────────

  { id: "um",     name: "1",  duration: 1200, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: hand(70, 0,90,90,90) },
    { time: 0.22, rightArm: FRONT_ARM_R },
    { time: 0.75, rightArm: FRONT_ARM_R },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  { id: "dois",   name: "2",  duration: 1200, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: hand(70, 0, 0,90,90) },
    { time: 0.22, rightArm: FRONT_ARM_R },
    { time: 0.75, rightArm: FRONT_ARM_R },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  { id: "tres",   name: "3",  duration: 1200, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: W_HAND },
    { time: 0.22, rightArm: FRONT_ARM_R },
    { time: 0.75, rightArm: FRONT_ARM_R },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  { id: "quatro", name: "4",  duration: 1200, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: hand(70, 0, 0, 0, 0) },
    { time: 0.22, rightArm: FRONT_ARM_R },
    { time: 0.75, rightArm: FRONT_ARM_R },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  { id: "cinco",  name: "5",  duration: 1200, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
    { time: 0.22, rightArm: FRONT_ARM_R },
    { time: 0.75, rightArm: FRONT_ARM_R },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  { id: "seis",   name: "6",  duration: 1200, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: hand( 0,90,90,90, 0) },
    { time: 0.22, rightArm: FRONT_ARM_R },
    { time: 0.75, rightArm: FRONT_ARM_R },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  { id: "sete",   name: "7",  duration: 1200, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: hand( 0, 0,90,90, 0) },
    { time: 0.22, rightArm: FRONT_ARM_R },
    { time: 0.75, rightArm: FRONT_ARM_R },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  { id: "oito",   name: "8",  duration: 1200, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: hand( 0, 0, 0,90, 0) },
    { time: 0.22, rightArm: FRONT_ARM_R },
    { time: 0.75, rightArm: FRONT_ARM_R },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  { id: "nove",   name: "9",  duration: 1200, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: hand(40,60, 0, 0, 0) },
    { time: 0.22, rightArm: FRONT_ARM_R },
    { time: 0.75, rightArm: FRONT_ARM_R },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  { id: "dez",    name: "10", duration: 1300, keyframes: [
    { time: 0.00, rightArm: REST_ARM_R, rightHand: FIST },
    { time: 0.22, rightArm: FRONT_ARM_R, rightHand: FIST },
    { time: 0.50, rightHand: hand(0,90,90,90,90) },
    { time: 0.75, rightHand: FIST },
    { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
  ]},

  // ── ADJETIVOS ────────────────────────────────────────────────────────────────

  // 62. Bom — polegar levantado
  {
    id: "bom", name: "Bom", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: hand(0,90,90,90,90) },
      { time: 0.22, rightArm: { shoulder:[30,26,-34], upperArm:[47,35,9], forearm:[110,-65,-44], hand:[0,0,0] } },
      { time: 0.65, rightArm: { shoulder:[30,26,-34], upperArm:[47,44,17], forearm:[109,34,-39], hand:[-1,-42,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 63. Ruim — polegar para baixo
  {
    id: "ruim", name: "Ruim", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: hand(0,90,90,90,90) },
      { time: 0.28, rightArm: FRONT_ARM_R, rightHand: hand(180,90,90,90,90) },
      { time: 0.68, rightArm: FRONT_ARM_R },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 64. Grande — mãos separam horizontalmente
  {
    id: "grande", name: "Grande", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.25,
        rightArm: { shoulder:[20,10,-15], upperArm:[35,0,0], forearm:[80,-90,-40], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 15], upperArm:[35,0,0], forearm:[80, 90, 40], hand:[0,0,0] } },
      { time: 0.60,
        rightArm: { shoulder:[20,20,-30], upperArm:[38,0,0], forearm:[80,-90,-55], hand:[0,0,0] },
        leftArm:  { shoulder:[20,20, 30], upperArm:[38,0,0], forearm:[80, 90, 55], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 65. Pequeno — mãos se aproximam
  {
    id: "pequeno", name: "Pequeno", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.25,
        rightArm: { shoulder:[20,20,-30], upperArm:[38,0,0], forearm:[80,-90,-55], hand:[0,0,0] },
        leftArm:  { shoulder:[20,20, 30], upperArm:[38,0,0], forearm:[80, 90, 55], hand:[0,0,0] } },
      { time: 0.62,
        rightArm: { shoulder:[20,10,-10], upperArm:[35,0,0], forearm:[80,-90,-30], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 10], upperArm:[35,0,0], forearm:[80, 90, 30], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 66. Novo — mão desliza sobre dorso da mão
  {
    id: "novo", name: "Novo", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.28,
        rightArm: { shoulder:[20,10,-20], upperArm:[32,0,0], forearm:[82,-90,-88], hand:[0,0,0] },
        leftArm:  { shoulder:[20, 0, 10], upperArm:[30,0,0], forearm:[80, 90,  0], hand:[0,0,0] } },
      { time: 0.65,
        rightArm: { shoulder:[15,10,-20], upperArm:[28,0,0], forearm:[78,-90,-88], hand:[-10,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 67. Muito — mãos balançam para fora
  {
    id: "muito", name: "Muito", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: O_HAND, leftHand: O_HAND },
      { time: 0.30,
        rightArm: { shoulder:[20,10,-15], upperArm:[35,0,0], forearm:[80,-90,-42], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 15], upperArm:[35,0,0], forearm:[80, 90, 42], hand:[0,0,0] } },
      { time: 0.60,
        rightArm: { shoulder:[20,15,-25], upperArm:[38,0,0], forearm:[80,-90,-50], hand:[0,0,0] },
        leftArm:  { shoulder:[20,15, 25], upperArm:[38,0,0], forearm:[80, 90, 50], hand:[0,0,0] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── COMUNICAÇÃO / TECNOLOGIA ─────────────────────────────────────────────────

  // 68. Telefone — mão Y na orelha
  {
    id: "telefone", name: "Telefone", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: Y_HAND },
      { time: 0.30, rightArm: { shoulder:[24,68,14], upperArm:[54,15,5], forearm:[135,-178,38], hand:[10,-12,4] }, rightHand: Y_HAND },
      { time: 0.70, rightArm: { shoulder:[24,68,14], upperArm:[54,15,5], forearm:[135,-178,38], hand:[12,-10,4] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 69. Computador — dedos "digitam" no ar
  {
    id: "computador", name: "Computador", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND },
      { time: 0.22,
        rightArm: { shoulder:[20,10,-15], upperArm:[35,-10,0], forearm:[80,  0,-88], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 15], upperArm:[35,-10,0], forearm:[80,  0, 88], hand:[0,0,0] },
        rightHand: hand(30,45,45,45,45), leftHand: hand(30,45,45,45,45) },
      { time: 0.50,
        rightArm: { shoulder:[20,10,-15], upperArm:[35,-10,0], forearm:[80, 20,-88], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 15], upperArm:[35,-10,0], forearm:[80,-20, 88], hand:[0,0,0] } },
      { time: 0.78,
        rightArm: { shoulder:[20,10,-15], upperArm:[35,-10,0], forearm:[80,  0,-88], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 15], upperArm:[35,-10,0], forearm:[80,  0, 88], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 70. Internet — dedos entrelaçam e giram
  {
    id: "internet", name: "Internet", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.25,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 45], hand:[0,0,0] },
        rightHand: hand(30,30,30,30,30), leftHand: hand(30,30,30,30,30) },
      { time: 0.55,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-45], hand:[0, 45,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 45], hand:[0,-45,0] } },
      { time: 0.80,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-45], hand:[0,-45,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 45], hand:[0, 45,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── NECESSIDADES / SAÚDE ─────────────────────────────────────────────────────

  // 71. Água — W toca o queixo
  {
    id: "agua", name: "Água", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: W_HAND },
      { time: 0.30, rightArm: { shoulder:[22,63,10], upperArm:[60,0,0], forearm:[140,-180,35], hand:[0,0,0] }, rightHand: W_HAND },
      { time: 0.65, rightArm: { shoulder:[22,63,10], upperArm:[60,0,0], forearm:[140,-180,35], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ],
  },

  // 72. Dor — dedos indicadores batem entre si
  {
    id: "dor", name: "Dor", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: POINT, leftHand: POINT },
      { time: 0.25,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 45], hand:[0,0,0] } },
      { time: 0.50,
        rightArm: { shoulder:[20,10,-15], upperArm:[30,0,0], forearm:[80,-90,-38], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 15], upperArm:[30,0,0], forearm:[80, 90, 38], hand:[0,0,0] } },
      { time: 0.75,
        rightArm: { shoulder:[20,10,-20], upperArm:[30,0,0], forearm:[80,-90,-45], hand:[0,0,0] },
        leftArm:  { shoulder:[20,10, 20], upperArm:[30,0,0], forearm:[80, 90, 45], hand:[0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // 73. Dormir — mão inclina a cabeça
  {
    id: "dormir", name: "Dormir", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND },
      { time: 0.28,
        rightArm: { shoulder:[24,68,14], upperArm:[54,15,5], forearm:[135,-178,38], hand:[10,-12,4] },
        leftArm:  { shoulder:[24,68,-8], upperArm:[54,15,-5], forearm:[135,178,-38], hand:[10,12,-4] },
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.65,
        rightArm: { shoulder:[28,68,14], upperArm:[58,15,5], forearm:[138,-178,40], hand:[12,-14,5] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── DATILOLOGIA A–Z ──────────────────────────────────────────────────────────

  letra("a", 10, 90, 90, 90, 90),
  letra("b", 90,  0,  0,  0,  0),
  letra("c", 30, 45, 45, 45, 45),
  letra("d", 50,  0, 80, 80, 80),
  letra("e", 50, 70, 70, 70, 70),
  letra("f", 50, 70,  0,  0,  0),
  letra("g",  0,  0, 90, 90, 90, SPELL_ARM_SIDE),
  letra("h", 60,  0,  0, 90, 90, SPELL_ARM_SIDE),
  letra("i", 70, 90, 90, 90,  0),
  letra("j", 70, 90, 90, 90,  0),
  letra("k", 30,  0,  0, 90, 90),
  letra("l",  0,  0, 90, 90, 90),
  letra("m", 80, 70, 70, 70, 90),
  letra("n", 80, 70, 70, 90, 90),
  letra("o", 40, 60, 60, 60, 60),
  letra("p", 30,  0,  0, 90, 90, SPELL_ARM_DOWN),
  letra("q",  0,  0, 90, 90, 90, SPELL_ARM_DOWN),
  letra("r", 70,  0,  0, 90, 90),
  letra("s", 60, 90, 90, 90, 90),
  letra("t", 50, 80, 90, 90, 90),
  letra("u", 70,  0,  0, 90, 90),
  letra("v", 70,  0,  0, 90, 90),
  letra("w", 70,  0,  0,  0, 90),
  letra("x", 70, 45, 90, 90, 90),
  letra("y",  0, 90, 90, 90,  0),
  letra("z", 70,  0, 90, 90, 90),
];

// ─── Word → sign-ID mapping (Portuguese) ─────────────────────────────────────

export const WORD_TO_SIGN_LSB: Record<string, string> = {
  // Saudações
  "olá":        "ola",
  "oi":         "ola",
  "ei":         "ola",
  "bom dia":    "bom_dia",
  "bomdia":     "bom_dia",
  "boa tarde":  "boa_tarde",
  "boatarde":   "boa_tarde",
  "boa noite":  "boa_noite",
  "boanoite":   "boa_noite",
  "tchau":      "tchau",
  "até logo":   "tchau",
  "até mais":   "tchau",
  "adeus":      "tchau",

  // Cortesia
  "obrigado":   "obrigado",
  "obrigada":   "obrigado",
  "valeu":      "obrigado",
  "grato":      "obrigado",
  "grata":      "obrigado",
  "por favor":  "por_favor",
  "pfv":        "por_favor",
  "sim":        "sim",
  "correto":    "sim",
  "exato":      "sim",
  "certo":      "sim",
  "não":        "nao",
  "nunca":      "nao",
  "desculpe":   "desculpe",
  "perdão":     "desculpe",
  "desculpa":   "desculpe",
  "sinto muito":"desculpe",
  "ajuda":      "ajuda",
  "socorro":    "ajuda",
  "auxílio":    "ajuda",

  // Pronomes
  "eu":         "eu",
  "mim":        "eu",
  "me":         "eu",
  "você":       "voce",
  "tu":         "voce",
  "te":         "voce",
  "nós":        "nos",
  "a gente":    "nos",
  "ele":        "ele",
  "ela":        "ele",
  "eles":       "eles",
  "elas":       "eles",

  // Emoções
  "feliz":      "feliz",
  "contente":   "feliz",
  "alegre":     "feliz",
  "triste":     "triste",
  "chateado":   "triste",
  "deprimido":  "triste",
  "amor":       "amor",
  "te amo":     "amor",
  "amo":        "amor",
  "cansado":    "cansado",
  "cansada":    "cansado",
  "exausto":    "cansado",
  "com fome":   "com_fome",
  "fome":       "com_fome",

  // Perguntas
  "como":       "como",
  "como assim": "como",
  "o que":      "o_que",
  "que":        "o_que",
  "onde":       "onde",
  "quando":     "quando",
  "por que":    "por_que",
  "porque":     "por_que",
  "por quê":    "por_que",
  "quem":       "quem",

  // Verbos
  "ir":         "ir",
  "vai":        "ir",
  "vou":        "ir",
  "vir":        "vir",
  "vem":        "vir",
  "venho":      "vir",
  "comer":      "comer",
  "come":       "comer",
  "comeu":      "comer",
  "beber":      "beber",
  "bebe":       "beber",
  "bebeu":      "beber",
  "tomar":      "beber",
  "falar":      "falar",
  "fala":       "falar",
  "falou":      "falar",
  "dizer":      "falar",
  "ver":        "ver",
  "olhar":      "ver",
  "veja":       "ver",
  "ouvir":      "ouvir",
  "escutar":    "ouvir",
  "aprender":   "aprender",
  "estudar":    "aprender",
  "trabalhar":  "trabalhar",
  "trabalho":   "trabalhar",
  "querer":     "querer",
  "quer":       "querer",
  "precisar":   "precisar",
  "precisa":    "precisar",
  "preciso":    "precisar",
  "ter":        "ter",
  "tenho":      "ter",
  "tem":        "ter",
  "fazer":      "fazer",
  "faz":        "fazer",
  "fiz":        "fazer",

  // Substantivos
  "casa":       "casa",
  "escola":     "escola",
  "colégio":    "escola",
  "médico":     "medico",
  "médica":     "medico",
  "doutor":     "medico",
  "família":    "familia",
  "amigo":      "amigo",
  "amiga":      "amigo",
  "amigos":     "amigo",
  "telefone":   "telefone",
  "celular":    "telefone",
  "computador": "computador",
  "notebook":   "computador",
  "internet":   "internet",

  // Tempo
  "hoje":       "hoje",
  "ontem":      "ontem",
  "amanhã":     "amanha",
  "agora":      "agora",
  "já":         "agora",
  "depois":     "depois",
  "mais tarde": "depois",

  // Números
  "1":          "um",
  "um":         "um",
  "uma":        "um",
  "2":          "dois",
  "dois":       "dois",
  "duas":       "dois",
  "3":          "tres",
  "três":       "tres",
  "4":          "quatro",
  "quatro":     "quatro",
  "5":          "cinco",
  "cinco":      "cinco",
  "6":          "seis",
  "seis":       "seis",
  "7":          "sete",
  "sete":       "sete",
  "8":          "oito",
  "oito":       "oito",
  "9":          "nove",
  "nove":       "nove",
  "10":         "dez",
  "dez":        "dez",

  // Adjetivos
  "bom":        "bom",
  "boa":        "bom",
  "ótimo":      "bom",
  "excelente":  "bom",
  "ruim":       "ruim",
  "mau":        "ruim",
  "péssimo":    "ruim",
  "grande":     "grande",
  "enorme":     "grande",
  "pequeno":    "pequeno",
  "pequena":    "pequeno",
  "novo":       "novo",
  "nova":       "novo",
  "muito":      "muito",
  "bastante":   "muito",

  // Saúde
  "água":       "agua",
  "dor":        "dor",
  "doendo":     "dor",
  "dormir":     "dormir",
  "dorme":      "dormir",
  "dormindo":   "dormir",
};
