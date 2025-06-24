/**
 * Activates Ghost Mode for a player
 * @param {$ServerPlayer_} player
 */
function activateGhost(player) {
  player.server.runCommandSilent(
    `tellraw @a {"text":"", "extra": [${JSON.stringify(
      getPlayerChatComponent(player)
    )}, {"text":" has activated Ghost Organisation", "color":"gray"}]}`
  );

  return true;
}