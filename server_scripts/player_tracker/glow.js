/**
 * Activates Ghost Mode for a player
 * @param {$ServerPlayer_} player
 */
function activateGlow(player) {
  // Get the Player's Tracked Target
  const tracker = getTrackerFromPlayer(player)
  if(!tracker) return false;

  /**
   * @type {TrackerData}
   */
  const trackerData = tracker.tracker.getCustomData();
  if(!trackerData) return false;
  if(!trackerData.target) {
    player.server.runCommandSilent(
      `tellraw ${player.username} [{"text":"You need to be tracking to apply glow!", "color":"dark_red"}]`
    );
    return false;
  }

  /**
   * @type {$LivingEntity_|null}
   */
  let targetEntity = null;
  // Find the entity by id
  for(const entity of player.server.getEntities()){
    if(`${entity.uuid}` == trackerData.target){
      targetEntity = entity;
      break;
    }
  }
  if(!targetEntity) return false;

  const glowDuration = POWER_IDS.glow.duration;
  
  player.server.runCommandSilent(
    `effect give ${targetEntity.stringUuid} minecraft:glowing ${Math.floor(glowDuration)} 0 true`
  );
  
  player.server.runCommandSilent(
    `tellraw ${player.username} [{"text":"Applied glow to your target!", "color":"yellow"}]`
  );

  if(targetEntity.player){
    sendPlayerWarning(targetEntity, "You're Glowing!", "A Player has applied the Glow Effect on you.")
  }

  return true;
}