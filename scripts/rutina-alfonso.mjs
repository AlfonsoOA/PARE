// Rutina de 5 días de Alfonso (PDF del 15/10/2026), en el formato de PARE.
// [id, series, repMin, repMax, unirConSiguiente, nota]
const SOLA = 150, BISERIE = 75;
export const SESIONES = [
  ['Día 1 · Empuje', false, [
    ['EJ0044', 4, 6, 8, false, 'Top set RPE 9 (RIR 1) / back-off RPE 8', SOLA],
    ['EJ0344', 3, 10, 12, false, 'Press superior. Top set RPE 9 (RIR 1) / back-off RPE 8', SOLA],
    ['EJ0209', 3, 10, 12, true, 'RPE 9 (RIR 1)'], ['EJ0937', 3, 12, 15, false, 'RPE 9-10'],
    ['EJ0342', 3, 12, 12, true, 'RPE 9-10'], ['EJ0458', 4, 12, 12, false, 'RPE 9-10. Mismo banco; la 4.ª serie va sola'],
    ['EJ0829', 3, 12, 12, true, 'RPE 9-10'], ['EJ0112', 3, 12, 15, false, 'RPE 8-9'],
  ]],
  ['Día 2 · Tirón', false, [
    ['EJ0845', 4, 6, 8, false, 'Jalón o dominadas, agarre neutro. Top set RPE 9. Controla el estiramiento', SOLA],
    ['EJ0486', 3, 12, 12, true, 'RPE 9'], ['EJ0112', 3, 12, 15, false, 'RPE 8-9'],
    ['EJ0457', 3, 12, 12, true, 'RPE 9'], ['EJ0542', 3, 30, 45, false, 'Técnica'],
    ['EJ0253', 3, 10, 12, true, 'RPE 9-10'], ['EJ0267', 3, 15, 15, false, 'RPE 8-9 (RIR 2)'],
    ['EJ0114', 3, 12, 12, false, 'Martillo en bayesiano. RPE 9-10', BISERIE],
  ]],
  ['Día 3 · Piernas', true, [
    ['EJ0415', 3, 10, 12, true, 'RPE 9, sin bloquear rodillas'], ['EJ0136', 4, 12, 15, false, 'RPE 10'],
    ['EJ0308', 4, 8, 10, false, 'Jaca. RPE 9. Sin bloquear rodillas, mantén tensión', SOLA],
    ['EJ0413', 3, 10, 12, true, 'RPE 9-10'], ['EJ0647', 4, 10, 12, false, 'RPE 9-10'],
    ['EJ0775', 3, 10, 12, true, 'RPE 9 (RIR 1)'], ['EJ0052', 3, 10, 12, false, 'RPE 9 (RIR 1)'],
    ['EJ0818', 3, 12, 12, true, 'RPE 9-10'], ['EJ0819', 3, 12, 12, false, 'RPE 9-10'],
    ['EJ0060', 3, 12, 12, false, 'Con barra Z. RPE 9-10', BISERIE],
  ]],
  ['Día 4 · Torso', false, [
    ['EJ0709', 4, 8, 8, false, 'Top set RPE 9', SOLA],
    ['EJ0936', 4, 8, 8, false, 'Remo frontal. Top set RPE 9', SOLA],
    ['EJ0111', 3, 12, 12, true, 'RPE 9-10'], ['EJ0749', 3, 12, 12, false, 'Bíceps en polea. RPE 9-10'],
    ['EJ0829', 4, 12, 12, true, 'RPE 9-10'], ['EJ0124', 3, 12, 15, false, 'Vuelos posteriores. RPE 9-10'],
    ['EJ0854', 3, 6, 10, true, 'RPE 9-9,5'], ['EJ0668', 3, 12, 15, false, 'RPE 9-10'],
    ['EJ0591', 3, 12, 12, false, 'Abdominales inferiores, al final. RPE 8-9', BISERIE],
  ]],
  ['Día 5 · Extra', true, [
    ['EJ0884', 3, 8, 8, false, 'RPE 8-9. Equilibrio y técnica', SOLA],
    ['EJ0413', 3, 12, 12, true, 'RPE 9'], ['EJ0451', 3, 12, 12, false, 'RPE 9'],
    ['EJ0771', 3, 10, 12, true, 'Curl femoral a una pierna. RPE 9'], ['EJ0267', 3, 15, 15, false, 'RPE 8-9 (RIR 2)'],
    ['EJ0004', 3, 10, 12, true, 'Control total'], ['EJ0749', 2, 10, 12, false, 'Curl en bayesiano. RPE 9'],
    ['EJ0192', 3, 15, 15, true, 'Control total, calidad'], ['EJ0940', 3, 15, 15, false, 'Control total, calidad. Al final, 2-3 min de estiramiento de espalda y psoas'],
  ]],
];
