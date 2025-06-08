// priority: 0

const BROADCAST_DISTANCE_MIN_LENGTH = 5;

const ONLY_PLAYER_KILLS = false;

const ANNOUNCE_KILLSTREAK_INTERVAL = 5;

// Death events during an active arena
EntityEvents.death((event) => {
  if (!FEATURE_COMBAT_STATS) return;
  let killerPlayer = event.source.player
    ? event.server.getPlayer(event.source.player)
    : null;

  // Get the dead entity

  let deadPlayer = event.server.getPlayer(event.entity.username);
  if (deadPlayer) {
    addDeath(deadPlayer, event.source);
  }

  /**
   * @type {TextComponent[]}
   */
  let tellRawComponents = [];

  // If the killer is not a player, or the killer is the same as the dead player
  if (!killerPlayer || event.entity.username === killerPlayer.username) {
    // It is a natural death.

    tellRawComponents.push({ text: "☠ ", color: "white" });

    if (event.entity?.username === killerPlayer?.username) {
      tellRawComponents.push(getPlayerChatComponent(deadPlayer || event.entity), {
        text: " has killed themselves",
        color: "gray",
      });
    } else {
      let deathMessage = event.source
        .getLocalizedDeathMessage(event.entity)
        .getString()
        .split(" ");

      for (const msg of deathMessage) {
        if (msg == deadPlayer.username) {
          tellRawComponents.push(
            getPlayerChatComponent(deadPlayer || event.entity),
            { text: " " }
          );
          continue;
        }

        tellRawComponents.push({ text: msg + " ", color: "gray" });
      }
    }

    // In case Keep Inventory is ON! Drop All (Canceling event)
    if (deadPlayer && !event.server.getGameRules().get("keepInventory"))
      deadPlayer.inventory.dropAll();

    const tellrawcmd = `tellraw @a {"text": "", "extra": ${JSON.stringify(
      tellRawComponents
    )}}`;

    event.server.runCommandSilent(tellrawcmd);

    event.cancel();
  }

  // If the dead entity is not a player, return
  if (!deadPlayer && ONLY_PLAYER_KILLS) return;

  // Get the Kill Distance

  let deadPlayerPos = event.entity.position();
  let killerPlayerPos = killerPlayer.position();
  let distance = deadPlayerPos.distanceTo(killerPlayerPos);

  /**@type {$ItemStackKJS_} */
  let weaponUsed = killerPlayer.handSlots[0];

  // Add Stats for Killer and Killed
  addKill(killerPlayer, {
    uuid: event.entity.getStringUuid(),
    name: deadPlayer
      ? deadPlayer.username
      : event.entity.getEntityType().toString(),
    weapon: weaponUsed
      ? {
          id: weaponUsed.id,
          count: weaponUsed.count,
          components: weaponUsed.componentString,
        }
      : {},
    tacz_id: getTacZItemId(killerPlayer.handSlots[0]),
    distance: distance,
    timestamp: Date.now(),
  });

  tellRawComponents.push(
    { text: "🏹 ", color: "dark_red" },
    getPlayerChatComponent(killerPlayer), // Player Name Plate
    { text: " has slain ", color: "gray" },
    getPlayerChatComponent(deadPlayer || event.entity) // Killed Player/Entity Name Plate
  );

  tellRawComponents.push({ text: ` using `, color: "gray" });

  // Ars Nouveau
  const spellUsed = getSelectedSpell(weaponUsed);
  if (spellUsed) {
    let glyphs = Item.of(
      `${
        spellUsed.recipe[0].item.id
      }[hide_additional_tooltip={},custom_name='${JSON.stringify({
        text: spellUsed.name || "Spell",
        italic: false,
      })}',lore=['["", ${JSON.stringify(
        colorSpellGlyphs(spellUsed.recipe)
      )}]']]`
    );
    tellRawComponents.push({
      text: spellUsed.name || spellUsed.recipe[0].name,
      color: "dark_purple",
      hoverEvent: { action: "show_item", contents: glyphs.toJson() },
    });
  } else if(weaponUsed.id !== "minecraft:air"){
    // Get the Mainhand Weapon
    let weaponName = weaponUsed.getDisplayName().getString();
    weaponName = weaponName.substring(1, weaponName.length() - 1);

    tellRawComponents.push({
      text: weaponName,
      hoverEvent: { action: "show_item", contents: weaponUsed.toJson() },
    });
  }else{
    // Using Fists
    tellRawComponents.push({
      text: "Fists",
    });
  }

  // Get the distance for the kill and add it if its beyond BROADCAST_DISTANCE_MIN_LENGTH
  if (distance >= BROADCAST_DISTANCE_MIN_LENGTH) {
    tellRawComponents.push({ text: ` §8(§e${distance.toFixed(2)} blocks§8)` });
  }

  // Killstreak
  let playerData = getPlayerData(killerPlayer.uuid);
  if (
    playerData &&
    playerData.killstreak &&
    playerData.killstreak > ANNOUNCE_KILLSTREAK_INTERVAL
  ) {
    tellRawComponents.push(
      { text: " ★ x", color: "yellow" },
      { text: `${playerData.killstreak}`, color: "yellow" }
    );
  }

  const tellrawcmd = `tellraw @a {"text": "", "extra": ${JSON.stringify(
    tellRawComponents
  )}}`;

  event.server.runCommandSilent(tellrawcmd);

  announceKillStreak(killerPlayer, playerData)

  // In case Keep Inventory is ON! Drop All (Canceling event)
  if (deadPlayer && !event.server.getGameRules().get("keepInventory"))
    deadPlayer.inventory.dropAll();

  // Give Credits
  if (FEATURE_CREDITS) {
    // If players are NOT allies
    if (!arePlayersAllies(deadPlayer || event.entity, killerPlayer)) {
      let creditsToGive;
      if (distance < MIN_DISTANCE_CREDITS_FOR_KILLS) {
        creditsToGive = CREDITS_FOR_KILLS;
      } else if (distance >= MAX_DISTANCE_CREDITS_FOR_KILLS) {
        creditsToGive = CREDITS_FOR_KILLS_MAX;
      } else {
        creditsToGive =
          CREDITS_FOR_KILLS +
          (CREDITS_FOR_KILLS_MAX - CREDITS_FOR_KILLS) *
            (distance / MAX_DISTANCE_CREDITS_FOR_KILLS);
      }
      creditsToGive = Math.round(creditsToGive);

      giveCredits(killerPlayer, creditsToGive);
    }
  }

  event.cancel();
});

/**
 * Anounces a Killstreak to the server
 * @param {$ServerPlayer_} player
 * @param {KDRPlayer} playerData
 */
function announceKillStreak(player, playerData) {
  if (playerData.killstreak % ANNOUNCE_KILLSTREAK_INTERVAL !== 0) return;
  /**
   * @type {TextComponent[]}
   */
  let tellRawComponents = [
    { text: "★ ", color: "yellow" },
    getPlayerChatComponent(player),
    { text: ` is on a `, color: "yellow" },
    { text: `${playerData.killstreak}`, color: "yellow", italic: true },
    { text: ` Killstreak! `, color: "yellow" },
  ];

  const tellrawcmd = `tellraw @a {"text": "", "extra": ${JSON.stringify(
    tellRawComponents
  )}}`;

  player.server.runCommandSilent(tellrawcmd);
}
