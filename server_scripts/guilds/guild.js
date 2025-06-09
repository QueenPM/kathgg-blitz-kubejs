/** @type {Record<string, GuildInformation>} */
let GUILDS = null
const GUILDS_PATH = "kubejs/data/guilds.json";

function loadGuilds() {
  console.log("Loading Guilds")
  GUILDS = {};
  let guildsData = JsonIO.read(GUILDS_PATH);
  if (!guildsData) {
    JsonIO.write(GUILDS_PATH, "{}");
  }
  guildsData = JsonIO.read(GUILDS_PATH);
  for(const g of guildsData.values()){
    GUILDS[g.id] = g
  }
}

function saveGuilds() {
  // console.log("Saving Guilds")
  if (!GUILDS) loadGuilds();
  syncGuilds();
  JsonIO.write(GUILDS_PATH, GUILDS);
}

/**
 * Syncs any changes to the guilds into memory such as new Guilds, disbanded guilds, new members etc.
 */
function syncGuilds() {
  let guilds = getAllGuilds();

  // Clear any Guilds that no longer exist
  let toClear = [];
  for(const guildId in GUILDS){
    if(guilds.some(g=>g.id !== guildId)){
      toClear.push(guildId)
    }
  }

  for(const guildIdToClear of toClear){
    // console.log("DELETING")
    delete GUILDS[guildIdToClear]
  }

  // Go through all guilds and compare it to the one in memory
  for(const guild of guilds){
    console.log(GUILDS)
    let guildExists = GUILDS[guild.id];

    // If the guild does not exist, add it to memory
    if(!guildExists){
      // console.log("MAKING NEW")
      GUILDS[guild.id] = guild
      continue;
    }

    // Update the Guild Details
    guildExists.settings = guild.settings;
    guildExists.owner = guild.owner;
    guildExists.members = guild.members;

    // console.log("updating :)")
  }
}

/**
 * Saves the Guild's data to memory
 * @param {GuildInformation} guild 
 */
function saveGuildData(guild){
  if(!GUILDS) loadGuilds();
  // Race conditions but w/e really.
  GUILDS[guild.id] = guild;
  // console.log(GUILDS)
}