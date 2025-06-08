// priority: 0

const BROADCAST_DISTANCE_MIN_LENGTH = 5;

const ONLY_PLAYER_KILLS = false;

// Death events during an active arena
EntityEvents.death((event)=>{
  if(!FEATURE_COMBAT_STATS) return;

  
  let killerPlayer = event.source.player ? event.server.getPlayer(event.source.player) : null;
  // If the killer is not a player, or the killer is the same as the dead player, return
  if(!killerPlayer || event.entity.username === killerPlayer.username) return
  
  // Get the dead entity
  
  let deadPlayer =  event.server.getPlayer(event.entity.username);
  // If the entity is not a player, return
  if(!deadPlayer && ONLY_PLAYER_KILLS) return;

  // Get the Kill Distance
  
  let deadPlayerPos = event.entity.position();
  let killerPlayerPos = killerPlayer.position();
  let distance = deadPlayerPos.distanceTo(killerPlayerPos);

  /**@type {$ItemStackKJS_} */
  let weaponUsed = killerPlayer.handSlots[0];

  // Add Stats for Killer and Killed
  addKill(killerPlayer, {
    uuid: event.entity.getStringUuid(),
    name: deadPlayer ? deadPlayer.username : event.entity.getEntityType().toString(),
    weapon: weaponUsed ? {
      id: weaponUsed.id,
      count: weaponUsed.count,
      components: weaponUsed.componentString
    } : {},
    tacz_id: getTacZItemId(killerPlayer.handSlots[0]),
    distance: distance,
    timestamp: Date.now()
  });

  if(deadPlayer){
    addDeath(deadPlayer, event.source);
  }
  
  // Create Tellraw Command
  
  /**
   * @type {TextComponent[]}
  */
 let tellRawComponents = [
  // { text: "☠ 🏹 ", color: "dark_red"},
  
   getPlayerChatName(killerPlayer), // Player Name Plate
   { text: " has slain ", color: "gray" },
   getPlayerChatName(deadPlayer || event.entity) // Killed Player/Entity Name Plate
  ];
  
  tellRawComponents.push(
    { text: ` using `, color: "gray" }
  )
  
  // Ars Nouveau
  const spellUsed = getSelectedSpell(weaponUsed);
  if(spellUsed){
    let glyphs = Item.of(`${spellUsed.recipe[0].item.id}[hide_additional_tooltip={},custom_name='${JSON.stringify({text:spellUsed.name || "Spell", italic: false})}',lore=['["", ${JSON.stringify(colorSpellGlyphs(spellUsed.recipe))}]']]`)
    tellRawComponents.push(
      { text: spellUsed.name || spellUsed.recipe[0].name, color: "dark_purple", hoverEvent: { action: "show_item", contents: glyphs.toJson()}}
    )
  }else{
    // Get the Mainhand Weapon
    let weaponName = weaponUsed.getDisplayName().getString()
    weaponName = weaponName.substring(1, weaponName.length() - 1);
    
    tellRawComponents.push(
      { text: weaponName, hoverEvent: { action: "show_item", contents: weaponUsed.toJson() }}
    )
  }
  
  // Get the distance for the kill and add it if its beyond BROADCAST_DISTANCE_MIN_LENGTH
  if(distance >= BROADCAST_DISTANCE_MIN_LENGTH){
    tellRawComponents.push(
      { text: ` §8(§e${distance.toFixed(2)} blocks§8)` }
    )
  }

  // Killstreak
  let playerData = getPlayerData(killerPlayer.uuid)
  if(playerData && playerData.killstreak){
    tellRawComponents.push(
      { text: " ★ x", color: "yellow"},
      { text: `${playerData.killstreak}`, color: "yellow"},
    )
  }

  const tellrawcmd = `tellraw @a {"text": "", "extra": ${JSON.stringify(tellRawComponents)}}`

  event.server.runCommandSilent(tellrawcmd)

  // In case Keep Inventory is ON! Drop All (Canceling event)
  if(deadPlayer && !event.server.getGameRules().get("keepInventory")) deadPlayer.inventory.dropAll();

  // Give Credits
  if (FEATURE_CREDITS) {
    // If players are NOT allies
    if (!arePlayersAllies(deadPlayer || event.entity, killerPlayer)){
      let creditsToGive;
      if(distance < MIN_DISTANCE_CREDITS_FOR_KILLS) {
        creditsToGive = CREDITS_FOR_KILLS
      }
      else if (distance >= MAX_DISTANCE_CREDITS_FOR_KILLS) {
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
})
