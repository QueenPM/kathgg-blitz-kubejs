// priority: 0

const BROADCAST_DISTANCE_MIN_LENGTH = 5;

const ONLY_PLAYER_KILLS = false;

const ANNOUNCE_KILLSTREAK_INTERVAL = 5;


/**
 * @typedef {EntityStatsConfig}
 * @property {string} id
 * @property {boolean} giveStats
 * @property {boolean} giveCredits - Only if Credits module is enabled
*/

/**
 * An array of Entity IDs that should count as a "kill"
 * Can be configured to give Credits/Stats
 * @type {EntityStatsConfig[]}
*/
const ENTITIES_COUNT_AS_KILLS_IDS = [
  { id: "minecraft:pig", giveStats: true, giveCredits: true },
];

/**
 * Gets the config for the entity
 * @param {$LivingEntity_} entity 
 * @returns {EntityStatsConfig|null}
 */
function getEntitySettings(entity){
  if(entity.player) return { id:"player", giveStats: true, giveCredits: true}
  const ent = ENTITIES_COUNT_AS_KILLS_IDS.find((ent) => ent.id === entity.getType().toString())
  if(!ent) {
    // Check for a Pet. If its a Pet with an Owner, announce the death but give no stats
    if(entity.ownerUUID){
      return { id: entity.getType().toString(), giveStats: false, giveCredits: false }
    }
    return null;
  }
  return ent
}

/**
 * Helper function to use the player's full name plate
 * @param {$LivingEntity_} entity
 * @returns {TextComponent[]}
 */
function getPlayerNamePlate(entity) {
  // Check for entity
  if (!entity.player) {
    // Get the Entity's Spawn Egg
    let spawnEggId = getSpawnEggIdForEntity(entity);
    let owner = entity.ownerUUID ? getPlayerName(entity.ownerUUID.toString()) : ""
    let lore = [];
    if(owner){
      lore.push({ text: `${owner}'s Pet`, italic: false, color: "gray"})
    }
    return [
      {
        text: entity.name.string,
        hoverEvent: {
          action: "show_item",
          contents: {
            id: spawnEggId ?? "minecraft:spawner",
            count: 1,
            components: {
              custom_name: JSON.stringify({ text: entity.name.string }),
              lore: lore.map((lore) => JSON.stringify(lore))
            },
          },
        },
      },
    ];
  }

  let components = [];

  const guildComp = getGuildChatComponent(entity);
  if (guildComp) {
    components.push({ text: "[", color: "white" }, guildComp, {
      text: "] ",
      color: "white",
    });
  }

  components.push(getPlayerChatComponent(entity));

  return components;
}

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
  if (deadPlayer && (!killerPlayer || event.entity.username === killerPlayer.username)) {
    // It is a natural death.

    tellRawComponents.push({ text: "☠ ", color: "white" });

    if (event.entity?.username === killerPlayer?.username) {
      tellRawComponents.push(
        getPlayerChatComponent(deadPlayer || event.entity),
        {
          text: " has killed themselves",
          color: "gray",
        }
      );
    } else {
      let deathMessage = event.source
        .getLocalizedDeathMessage(event.entity)
        .getString()
        .split(" ");

      for (const msg of deathMessage) {
        if (msg == deadPlayer.username) {
          tellRawComponents = tellRawComponents.concat(
            getPlayerNamePlate(deadPlayer || event.entity)
          );
          tellRawComponents.push({ text: " " });
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
  const entityConfig = getEntitySettings(event.entity)
  if (!entityConfig) return;

  // Get the Kill Distance

  let deadPlayerPos = event.entity.position();
  let killerPlayerPos = killerPlayer.position();
  let distance = deadPlayerPos.distanceTo(killerPlayerPos);

  /**@type {$ItemStackKJS_} */
  let weaponUsed = killerPlayer.handSlots[0];

  // If Stats should be given
  if (entityConfig.giveStats) {
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
  }

  tellRawComponents.push({ text: "🏹 ", color: "dark_red" });
  tellRawComponents = tellRawComponents.concat(
    getPlayerNamePlate(killerPlayer)
  );
  tellRawComponents.push({ text: " has slain ", color: "gray" });
  tellRawComponents = tellRawComponents.concat(
    getPlayerNamePlate(deadPlayer || event.entity)
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
  } else if (weaponUsed.id !== "minecraft:air") {
    // Get the Mainhand Weapon
    let weaponName = weaponUsed.getDisplayName().getString();
    weaponName = weaponName.substring(1, weaponName.length() - 1);

    tellRawComponents.push({
      text: weaponName,
      hoverEvent: { action: "show_item", contents: weaponUsed.toJson() },
    });
  } else {
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
  // if (
  //   playerData &&
  //   playerData.killstreak &&
  //   playerData.killstreak > ANNOUNCE_KILLSTREAK_INTERVAL
  // ) {
  //   tellRawComponents.push(
  //     { text: " ★ x", color: "yellow" },
  //     { text: `${playerData.killstreak}`, color: "yellow" }
  //   );
  // }

  const tellrawcmd = `tellraw @a {"text": "", "extra": ${JSON.stringify(
    tellRawComponents
  )}}`;

  event.server.runCommandSilent(tellrawcmd);

  // If stats have been given
  if (entityConfig.giveStats) {
    announceKillStreak(killerPlayer, playerData);
  }

  // In case Keep Inventory is ON! Drop All (Canceling event)
  if (deadPlayer && !event.server.getGameRules().get("keepInventory"))
    deadPlayer.inventory.dropAll();

  // Give Credits
  if (FEATURE_CREDITS && entityConfig.giveCredits) {
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

PlayerEvents.chat((event) => {
  const chat = event.getMessage();
  const player = event.getPlayer();

  let tellRawComponents = [];

  tellRawComponents = tellRawComponents.concat(getPlayerNamePlate(player));

  tellRawComponents.push({
    text: `: ${chat}`,
    color: "white",
  });

  let tellraw = `tellraw @a {"text": "", "extra": ${JSON.stringify(
    tellRawComponents
  )}}`;
  event.server.runCommandSilent(tellraw);
  event.cancel();
});

/**
 * Anounces a Killstreak to the server
 * @param {$ServerPlayer_} player
 * @param {PlayerStats} playerData
 */
function announceKillStreak(player, playerData) {
  if (playerData.killstreak % ANNOUNCE_KILLSTREAK_INTERVAL !== 0) return;
  /**
   * @type {TextComponent[]}
   */
  let tellRawComponents = [{ text: "★ ", color: "yellow" }];
  tellRawComponents = tellRawComponents.concat(getPlayerNamePlate(player));
  tellRawComponents.push([
    { text: ` is on a `, color: "yellow" },
    { text: `${playerData.killstreak}`, color: "yellow", italic: true },
    { text: ` Killstreak! `, color: "yellow" },
  ]);

  const tellrawcmd = `tellraw @a {"text": "", "extra": ${JSON.stringify(
    tellRawComponents
  )}}`;

  player.server.runCommandSilent(tellrawcmd);
}

/**
 * Anounces a lost Killstreak to the server
 * @param {$ServerPlayer_} killerPlayer
 * @param {$ServerPlayer_} killedPlayer
 * @param {number} lostKillstreak
 */
function announceLostkillstreak(killerPlayer, killedPlayer, lostKillstreak) {
  /**
   * @type {TextComponent[]}
   */
  let tellRawComponents = [{ text: "★ ", color: "yellow" }];
  tellRawComponents = tellRawComponents.concat(
    getPlayerNamePlate(killerPlayer)
  );
  tellRawComponents.push([{ text: ` has ended `, color: "yellow" }]);
  tellRawComponents = tellRawComponents.concat(
    getPlayerNamePlate(killedPlayer)
  );
  tellRawComponents.push([
    { text: `'s `, color: "yellow" },
    { text: `${lostKillstreak}`, color: "yellow", italic: true },
    { text: ` Killstreak! `, color: "yellow" },
  ]);

  const tellrawcmd = `tellraw @a {"text": "", "extra": ${JSON.stringify(
    tellRawComponents
  )}}`;

  player.server.runCommandSilent(tellrawcmd);
}
