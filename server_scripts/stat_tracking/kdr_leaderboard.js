// priority: 9

let $ItemStackKJS = Java.loadClass("dev.latvian.mods.kubejs.core.ItemStackKJS");

const KDR_PATH = "kubejs/data/kdr_leaderboard.json";

/**
 * @typedef {Object} KDRPlayer
 * @property {string} uuid : UUID of the player
 * @property {string} name : Name of the player
 * @property {number} credits : Credits of the player
 * @property {number} kills : Number of kills
 * @property {number} player_deaths : Number of deaths
 * @property {number} natural_deaths : Number of deaths by natural or mob causes
 * @property {number} kdr : Kill Death Ratio
 * @property {number} killstreak : Current killstreak
 * @property {number} highest_killstreak : Highest killstreak
 * @property {Kill[]} kill_history : Array of kills
 * @property {Death[]} death_history : Array of deaths
 */

/**
 * @typedef {Object} Kill
 * @property {string} uuid : UUID of the player
 * @property {string} name : Name of the player
 * @property {Weapon} weapon : Weapon used
 * @property {string} tacz_id : TACZ ID of the weapon
 * @property {number} distance : Distance of the kill
 * @property {number} timestamp : Timestamp of the kill
 */

/**
 * @typedef {Object} Death
 * @property {string} source_type : Source of the Death
 * @property {string} source_entity : Name of the source of the death
 * @property {double[]} position : Position of the death. [x, y, z]
 * @property {number} timestamp : Timestamp of the death
 */

/**
 * @typedef {Object} Weapon
 * @property {string} id : Item ID of the weapon
 * @property {number} count : Count of the weapon. Typically 1
 * @property {Object} components : NBT of the weapon in JSON format.
 */

/** @type {Map<string, KDRPlayer>|null} */
let KDR_Leaderboard = null;

/**
 * Gets the kill weapon ID
 * @param {Kill} kill 
 */
function getKillWeaponID(kill) {
  let weapon = kill.weapon;
  if(kill.tacz_id) return kill.tacz_id;
  return weapon.item;
}

function loadLeaderboard() {
  KDR_Leaderboard = JsonIO.read(KDR_PATH);
  if (!KDR_Leaderboard) {
    JsonIO.write(KDR_PATH, "{}");
  }
  KDR_Leaderboard = JsonIO.read(KDR_PATH);
}

/**
 * @returns {KDRPlayer[]}
 */
function getLeaderboard() {
  if (!KDR_Leaderboard) loadLeaderboard();
  /** @type {KDRPlayer[]} */
  let array = [];
  KDR_Leaderboard.forEach((k, v) => {
    array.push(v);
  });
  return array;
}

function saveLeaderboard() {
  if (!KDR_Leaderboard) loadLeaderboard();
  syncCreditsWithLightman(server);
  JsonIO.write("kubejs/data/kdr_leaderboard.json", KDR_Leaderboard);
}

/**
 * @param {$ServerPlayer_} player - The player who got the kill
 * @param {Kill} kill 
 */
function addKill(player, kill) {
  if (kill.uuid == null) {
    kill.uuid = getPlayerUUID(kill.name);
  }
  let playerData = getPlayerData(player.uuid);
  playerData.kills++;
  playerData.killstreak++;
  playerData.highest_killstreak = Math.max(playerData.highest_killstreak, playerData.killstreak);
  playerData.kill_history.push(kill);
  let victimData = KDR_Leaderboard.get(kill.uuid);
  if (victimData) {
    victimData.deaths++;
  }
  playerData.kdr = playerData.kills / Math.max(1, playerData.player_deaths);
  KDR_Leaderboard[player.uuid] = playerData;
}

/**
 * @param {$ServerPlayer_} player - The player who died
 * @param {$DamageSource_} source - The source of the death
 */
function addDeath(player, source) {
  let playerData = getPlayerData(player.uuid);
  // If the source is a player, increment their deaths
  if(source.player){
    playerData.player_deaths++;
    playerData.killstreak = 0;
    playerData.kdr = playerData.kills / Math.max(1, playerData.player_deaths);
  }else{
    playerData.natural_deaths++;
  }

  try{
    let playerPosition = player.blockPosition();
  
    playerData.death_history.push({
      source_type: source.getType()||null,
      source_entity: source.actual?.type||null,
      position: [playerPosition.x, playerPosition.y, playerPosition.z],
      timestamp: Date.now()
    });
  
    KDR_Leaderboard[player.uuid] = playerData;
  }catch(e){
    print(e);
  }
}

/**
 * @param {$UUID_} uuid - The player to get the data for
 * @returns {KDRPlayer}
 */
function getPlayerData(uuid) {
  if (!KDR_Leaderboard) loadLeaderboard();
  let playerData = KDR_Leaderboard[uuid];
  if (!playerData) {
    let playerName = getPlayerName(uuid);
    playerData = {
      uuid: uuid.toString(),
      name: playerName,
      credits: 0,
      kills: 0,
      player_deaths: 0,
      natural_deaths: 0,
      kdr: 0,
      killstreak: 0,
      highest_killstreak: 0,
      kill_history: [],
      death_history: []
    }
    KDR_Leaderboard[uuid] = playerData;
  }

  // Refresh name if its null
  if(playerData.name == null){
    playerData.name = getPlayerName(uuid);
  }

  return playerData;
}

/**
 * Creates new data for the player if it doesnt exist. This is used on first login.
 * @param {string} uuid 
 * @param {string} name 
 * @returns 
 */
function createPlayerData(uuid, name) {
  // Check if the player already exists
  let leaderboard = getLeaderboard();
  for (let player of leaderboard) {
    if (player.uuid === uuid) {
      // Check if the name is the same, if not, update the name
      if (player.name !== name) {
        player.name = name;
      }
      return;
    }
  }
  let data = {
    uuid: uuid,
    name: name,
    kills: 0,
    player_deaths: 0,
    natural_deaths: 0,
    kdr: 0,
    killstreak: 0,
    highest_killstreak: 0,
    kill_history: [],
    death_history: []
  }
  leaderboard.push(data);
}

/**
 * @param {$ItemStack_} item : The item to check
 */
function getTacZItemId(item) {
  let id = item.id ?? item.item;
  if (!item || id != "tacz:modern_kinetic_gun") return "";
  let nbt = item.nbt;
  if (!nbt) return "";
  if (typeof nbt === "string" || nbt instanceof String) {
    try {
      let match = nbt.match(/GunId:"([^"]+)"/)
      return match ? match[1] : "";
    } catch (e) {
      print(e);
      return "";
    }
  }
  if (!nbt.GunId) return "";
  return nbt.GunId;
}

// UUID to player name map
let PLAYER_NAME_MAP = new Map();

/**
 * Gets a player Name from UUID
 * @param {string} uuid 
 * @returns 
 */
function getPlayerName(uuid) {
  let name = PLAYER_NAME_MAP[uuid];
  if (name) return name;

  // Search the leaderboard
  let leaderboard = getLeaderboard();
  for (let player of leaderboard) {
    if (player.uuid === uuid) {
      return player.name;
    }
  }

  let players = server.getPlayers();
  for (let player of players) {
    if (player.uuid === uuid) {
      return player.name.string;
    }
  }
}

/**
 * Gets a player UUID from Name
 * @param {string} name 
 * @returns 
 */
function getPlayerUUID(name) {
  let leaderboard = getLeaderboard();
  for (let player of leaderboard) {
    if (player.name === name) {
      return player.uuid;
    }
  }
}

/**
 * Returns a Kill's Icon in ItemStack form
 * @param {Kill} kill 
 * @returns {$ItemStackKJS_}
 */
function getKillIcon(kill){
  /** @type {TextComponent[]} */
  let lore = [];

    // Specials
  // // TODO testing for now
  // lore.push([
  //   {text:"☆", color: "yellow", italic: false},
  //   {text:" Ended QueenPM", color: "yellow", italic:false},
  //   {text:" 13 ", color: "green", italic:false},
  //   {text:"Killstreak!", color: "yellow", italic: true},
  //   {text: ""}
  // ])

  // Add weapon
  lore.push([
    {text:"Using: ", color:"gray", italic:false},
    {text:cleanIDToName(kill.weapon.id), color:"green", italic:false}
  ])

  // Check for Ars Nouveau Spellbook
  if(isItemSpellbook(kill.weapon)){
    // Add the spell information
    let spell = getSelectedSpell(Item.of(`${kill.weapon.id}${kill.weapon.components}`));
    if(spell){
      if(spell.name){
        lore.push([
          {text:"Spell: ", color:"gray", italic:false},
          {text:spell.name, color:"aqua", italic:true}
        ], [{text:"Glyphs: ", color:"gray", italic: false}].concat(colorSpellGlyphs(spell.recipe)))
      }else{
        // lore.push([
        //   {text:"Spell: ", color:"gray", italic:false},
        //   {text:spell.glyphs, color:"aqua", italic:false}
        // ])
        lore.push([{text:"Spell: ", color:"gray", italic: false}].concat(colorSpellGlyphs(spell.recipe)));
      }
    }
  }

  // Add Distance & timestamp
  lore.push([
    {text:"Distance: ", color:"gray", italic:false},
    {text:kill.distance.toFixed(2), color:"gold", italic:false},
  ],
  [ {text:""}],
  [
    {text:getRelativeTimePast(kill.timestamp), color:"gray", italic:false},
  ])

  let displayComponent = textDisplayComponent([
    {
      text:`${kill.name}`,
      italic:false,
      color:"dark_purple"
    }
  ], lore);
  return Item.of(`minecraft:player_head[${displayComponent}]`);
}

/**
 * Returns a Death's icon in ItemStack form
 * @param {Death} death
 * @returns {$ItemStack_}
 */
function getDeathIcon(death){
  let defaultLore = [
    [
      {text:"Position XYZ: ", color:"gray", italic:false},
      {text:death.position.join(" "), color:"gold", italic:false},
    ],
    [ {text:""}],
    [
      {text:getRelativeTimePast(death.timestamp), color:"gray", italic:false},
    ]
  ];
  let displayComponent = "{}";
  switch(death.source_type){
    case "mob":
      defaultLore.unshift([
        {text:"Source: ", color:"gray", italic:false},
        {text:cleanIDToName(death.source_entity), color:"gold", italic:false}
      ])
      displayComponent = textDisplayComponent([
        {
          text:`${capitalizeFirstLetters(death.source_type)}`,
          italic:false,
          color:"red"
        }
      ], defaultLore);
      // tood get the spawn egg
      return Item.of(`${death.source_entity}_spawn_egg[${displayComponent}]`);
    case "fall":
      displayComponent = textDisplayComponent([
        {
          text:`${capitalizeFirstLetters(death.source_type)}`,
          italic:false,
          color:"white"
        }
      ], defaultLore);
      return Item.of(`minecraft:feather[${displayComponent}]`);
    case "drown":
      displayComponent = textDisplayComponent([
        {
          text:`${capitalizeFirstLetters(death.source_type)}`,
          italic:false,
          color:"aqua"
        }
      ], defaultLore);
      return Item.of(`minecraft:water_bucket[${displayComponent}]`);
    case "lava":
      displayComponent = textDisplayComponent([
        {
          text:`${capitalizeFirstLetters(death.source_type)}`,
          italic:false,
          color:"red"
        }
      ], defaultLore);
      return Item.of(`minecraft:lava_bucket[${displayComponent}]`);
    case "inFire":
      displayComponent = textDisplayComponent([
        {
          text:`Fire`,
          italic:false,
          color:"red"
        }
      ], defaultLore);
      return Item.of(`minecraft:blaze_powder[${displayComponent}]`);
    case "inWall":
      displayComponent = textDisplayComponent([
        {
          text:`Suffocated`,
          italic:false,
          color:"gray"
        }
      ], defaultLore);
      return Item.of(`minecraft:sand[${displayComponent}]`);
    case "outOfWorld":
      displayComponent = textDisplayComponent([
        {
          text:`Fell out of World`,
          italic:false,
          color:"dark_gray"
        }
      ], defaultLore);
      return Item.of(`minecraft:ender_pearl[${displayComponent}]`);
    case "freeze":
      displayComponent = textDisplayComponent([
        {
          text:`Frozen`,
          italic:false,
          color:"aqua"
        }
      ], defaultLore);
      return Item.of(`minecraft:packed_ice[${displayComponent}]`);
    default:
      displayComponent = textDisplayComponent([
        {
          text:`${capitalizeFirstLetters(death.source_type)}`,
          italic:false,
          color:"red"
        }
      ], defaultLore);
      return Item.of(`minecraft:skeleton_skull[${displayComponent}]`);
  }
}

PlayerEvents.loggedIn(e => {
  // Generate an empty file data for them.
  getPlayerData(e.player.uuid);

  PLAYER_NAME_MAP.set(e.player.uuid, e.player.name.string);
}
);

// Save to file every 250 ticks
ServerEvents.tick(event => {
  if (event.server.tickCount % 250 === 0) {
    saveLeaderboard();
    saveGuilds();
  }
})

ServerEvents.loaded(_ => {
  loadLeaderboard();
  loadGuilds();
})

// Save to file when the server is unloaded
ServerEvents.unloaded(_ => {
  saveLeaderboard();
  saveGuilds()
})