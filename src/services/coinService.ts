import { storage } from '../utils/storage';

export const STEP_COIN_RATE = 100;

const normalizeSteps = (steps: number) => Math.max(0, Math.floor(steps));

export const getClaimedSteps = (): number =>
  storage.getNumber('claimed_steps') ?? 0;

export const setClaimedSteps = (steps: number) => {
  const normalizedSteps = normalizeSteps(steps);
  storage.set('claimed_steps', normalizedSteps);
  return normalizedSteps;
};

export const applyStepCoins = (currentSteps: number, currentBalance = 0) => {
  const normalizedSteps = normalizeSteps(currentSteps);
  const lastClaimedSteps = getClaimedSteps();
  const totalStepCoins = Math.floor(normalizedSteps / STEP_COIN_RATE);
  const claimedStepCoins = Math.floor(lastClaimedSteps / STEP_COIN_RATE);
  const deltaSteps = Math.max(0, normalizedSteps - lastClaimedSteps);
  const earnedCoins = Math.max(0, totalStepCoins - claimedStepCoins);

  // Persist the latest claimed steps so only newly walked blocks are converted,
  // while preserving partial remainders and preventing any loss of uncollected coins.
  setClaimedSteps(normalizedSteps);

  return {
    deltaSteps,
    earnedCoins,
    claimedSteps: normalizedSteps,
    totalCoins: currentBalance + earnedCoins,
  };
};
