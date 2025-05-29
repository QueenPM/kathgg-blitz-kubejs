// priority: 0

const $GuildAPI = Java.loadClass(
  "earth.terrarium.odyssey_allies.api.teams.guild.GuildApi"
).API;

const $ClaimsManager = Java.loadClass(
  "earth.terrarium.cadmus.api.claims.ClaimApi"
).API;

/**
 * @typedef GuildPermissions - These are synced
 * @property {boolean} managePermissions
 * @property {boolean} operator
 * @property {boolean} teleport
 * @property {boolean} manageSettings
 * @property {boolean} manageMembers
 */

/**
 * @typedef GuildMember - These are synced
 * @property {string} id
 * @property {string} name
 * @property {boolean} isOwner
 * @property {GuildPermissions} permissions
 * @property {string} status
 */

/**
 * @typedef GuildSettings - This is synced
 * @property {string} name
 * @property {string} color
 * @property {string} motd
*/

/**
 * @typedef GuildStats - These are not synced
 * @property {number} kills
 * @property {number} deaths
 */

/**
 * @typedef GuildInformation
 * @property {string} id
 * @property {GuildSettings} settings
 * @property {GuildMember} owner
 * @property {GuildStats} stats
 * @property {$ItemStack_|null} banner
 * @property {GuildMember[]} members
 */

/**
 * Helper function to get Guild Data in a clean format with JSDocs
 * @returns {GuildInformation}
*/ 
function getGuildData(guild){
  let settings = guild.settings();

  /** @type {GuildMember[]} */
  let members = [];

  let iterator = guild.members().entrySet().iterator();
  while (iterator.hasNext()) {
    let entry = iterator.next();

    let playerId = entry.getKey();
    let member = entry.getValue();

    members.push({
      id: playerId.toString(),
      name: getPlayerName(playerId),
      isOwner: member.isOwner(),
      permissions:member.permissions(),
      status: member.status().getDisplayName().string
    })
  }

  
  /** @type {GuildInformation} */
  let guildInformation = {
    id: guild.id().toString(),
    settings: {
      name: settings.displayName.toString(),
      color: guild.color().getTextColor().toString(),
      motd: settings.motd ? settings.motd.toString() : "",
    },
    stats: {
      kills: 0,
      deaths: 0
    },
    owner: members.find(m => m.isOwner),
    members: members,
    banner: null
  }
  
  return guildInformation;
}

/**
 * Gets all Guilds of the Server
 * @returns {GuildInformation[]}
 */
function getAllGuilds(){
  let guilds = $GuildAPI.getAll(server.getAllLevels().iterator().next())
  let guildsArray = [];
  for(const guild of guilds){
    guildsArray.push(getGuildData(guild))
  }
  return guildsArray;
}

/**
 * Gets a Player's Odessy Guild
 * @param {$ServerPlayer_} player
 * @returns {null|GuildInformation}
 */
function getPlayerGuild(player){
  if(!player.player) return null;
  if(!GUILDS) loadGuilds()
  for(const guildId in GUILDS){
    let guild = GUILDS[guildId]
    if(guild.members.some(m => m.id === `${player.uuid}`)){
      return GUILDS[guild.id];
    }
  }

  // If there still wasnt a Guild. Access the API to check.
  try{
    let guildOptional = $GuildAPI.getPlayerGuild(player);
    if(!guildOptional || !guildOptional.isPresent()) return null;
  
    return getGuildData(guildOptional.get());
  }catch(e) {
    console.log(e)
    return null;
  }
}

/**
 * Helper function to check if both players are in the same guild or are allies
 * @param {$ServerPlayer_} playerOne 
 * @param {$ServerPlayer_} playerTwo 
 */
function arePlayersAllies(playerOne, playerTwo){
  const playerOneGuild = getPlayerGuild(playerOne);
  if(!playerOneGuild) return false;
  for(const member of playerOneGuild.members){
    if(member.id == playerOne.uuid.toString()) continue;
    if(member.id == playerTwo.uuid.toString()){
      return true;
    }
  }

  // TODO check allies

  return false;
}

/**
 * Helper function to construct guild information in item form
 * @param {GuildInformation} guild
 * @param {string|undefined} playerId?
 */
function getGuildItemComponent(guild, playerId){
  /** @type {TextComponent} */
  let name = {text:`${guild.settings.name}`, italic: false, color: guild.settings.color};

  /** @type {TextComponent[]} */
  let lore = [
    {text:"Owner: ", italic: false, color: "yellow", extra:[{text: `${guild.owner.name}`, color: "white"}]},
  ]
  
  if(playerId){
    let gPlayer = guild.members.find(m => m.id == playerId)
    if(gPlayer){
      lore.push({text:"Rank: ", italic: false, color: "yellow", extra:[{text: `${gPlayer.status}`}]})
    }
  }

  lore.push({text:"Members: ", italic: false, color: "dark_gray", extra:[{text: `${guild.members.length}`, color: "white"}]})

  // Divider for stats
  lore.push({text:""})
  
  // Get the KDR & wealth for guild members.
  let k = 0;
  let d = 0;

  let wealth = 0;
  for(const member of guild.members){
    let data = getPlayerData(member.id);
    if(!data) continue;
    k += data.kills;
    d += data.player_deaths;
    wealth += data.credits;
  }
  let kdr = d == 0 ? k : k == 0 ? 0 : k / d
  
  // Wealth
  lore.push({text:"Wealth: ", italic: false, color: "yellow", extra:[{text: `$${numbersWithCommas(wealth)}`, color: "gold"}]})
  lore.push({text:"KDR: ", italic: false, color: "gray", extra:[{text: `${k}`, color: "green"}, {text: `/`, color: "white"}, {text: `${d}`, color: "red"}, {text: ` (`, color: "white"}, {text: `${kdr}`, color: "green"}, {text: ` KDR)`, color: "white"}]})

  return {
    custom_name: JSON.stringify(name),
    lore: lore.map(i => JSON.stringify(i))
  }
}

/**
 * Helper function to use the Player's name with Guild Information to be used in Chat
 * @param {$LivingEntity_} player
 */
function getPlayerChatName(player) {
  // Check for entity
  if(!player.player) return { text: player.name.string}
  
  let guild = getPlayerGuild(player);
  if(!guild) return { text: player.username }

  let guildItem = getGuildItemComponent(guild, player.uuid.toString())
  return {
    text: player.username,
    color: guild.settings.color,
    hoverEvent: {
        action: "show_item",
        contents: {
          id: guild.banner ? guild.banner.id : `minecraft:white_banner`,
          count: 1,
          components: guild.banner.components ? combineObjects(guild.banner.components, guildItem) : guildItem
      },
    }
  }
}

PlayerEvents.chat((event) => {
  let chat = event.getMessage();
  let player = event.getPlayer();

  let tellraw = `tellraw @a {"text": "<", "extra": [${JSON.stringify(getPlayerChatName(player))}, {"text":"> ${chat}"}]}`;
  event.server.runCommandSilent(tellraw);
  event.cancel();
});
