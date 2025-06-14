const STARTUP_CMDS = [
  "hiddennames blocksHideName true",
  "gamerule disableElytraMovementCheck true",
  "gamerule playersSleepingPercentage 50",
  "gamerule doInsomnia false",
  "gamerule mobGriefing false",
  "gamerule doFireTick false",
  // Cadmus Claims
  "gamerule maxChunkLoadedClaims 0",
  "gamerule maxClaims 50",
  "gamerule doClaimedBlockBreaking false",
  "gamerule doClaimedBlockExplosions false",
  "gamerule doClaimedBlockInteractions true",
  "gamerule doClaimedBlockPlacing false",
  "gamerule doClaimedEntityDamage true",
  "gamerule doClaimedEntityExplosions true",
  "gamerule doClaimedEntityInteractions true",
  "gamerule doClaimedItemPickup true",
  "gamerule doClaimedMobGriefing false",
];

ServerEvents.loaded((e) => {
  for (const cmd of STARTUP_CMDS) {
    e.server.runCommandSilent(cmd);
  }
});
