// priority: 0

const MIN_LENGTH = 0;

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
  if(deadPlayer){
    addDeath(deadPlayer, event.source);
  }
  // Get the source, aka the killer
  
  let deadPlayerPos = event.entity.position();
  let killerPlayerPos = killerPlayer.position();
  let distance = deadPlayerPos.distanceTo(killerPlayerPos);
  
  let uuid = "";
  let name = "";
  if(deadPlayer){
    uuid = deadPlayer.getStringUuid();
    name = deadPlayer.username;
  }else{
    uuid = event.entity.getStringUuid();
    name = event.entity.getEntityType().toString();
  }
  
  if(!uuid || !name) return;

  /**@type {$ItemStack_} */
  let weaponUsed = killerPlayer.handSlots[0];

  addKill(killerPlayer, {
    uuid:uuid,
    name:name,
    weapon: weaponUsed ? {
      id: weaponUsed.id,
      count: weaponUsed.count,
      components: weaponUsed.componentString
    } : {},
    tacz_id: getTacZItemId(killerPlayer.handSlots[0]),
    distance: distance,
    timestamp: Date.now()
  });

  if(distance < MIN_LENGTH) return;
  
  let itemComponent = itemToChatComponent(killerPlayer.handSlots[0]);
  let glyphs = "";
  let spellUsed = getSelectedSpell(weaponUsed);
  if(spellUsed){
    let displayComponent = `lore=['["", {"text":"${spellUsed.glyphs}"}]']`
    let item = Item.of(`${killerPlayer.handSlots[0].id}[${displayComponent}]`);
    glyphs = `, {"text": " §8(Spell§8)", "hoverEvent": { "action": "show_item", "contents":${itemToChatComponent(item)}}}`
  }
  let tellraw = `tellraw @a {"text": "", "extra": [${JSON.stringify(getPlayerChatName(killerPlayer))},{"text":" has slain ", "color":"dark_red"}, ${JSON.stringify(getPlayerChatName(deadPlayer || event.entity))}, {"text": " §8(§e${distance.toFixed(2)} blocks§8)", "hoverEvent": { "action": "show_item", "contents":${itemComponent}}}${glyphs}]}`
  event.server.runCommandSilent(tellraw)
  if(deadPlayer) deadPlayer.inventory.dropAll();
  event.cancel();
})
