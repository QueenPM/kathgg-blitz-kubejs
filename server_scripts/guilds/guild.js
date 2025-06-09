/** @type {Record<string, GuildInformation>} */
let GUILDS = null;
const GUILDS_PATH = "kubejs/data/guilds.json";

function loadGuilds() {
  console.log("Loading Guilds");
  GUILDS = {};
  let guildsData = JsonIO.read(GUILDS_PATH);
  if (!guildsData) {
    JsonIO.write(GUILDS_PATH, "{}");
  }
  guildsData = JsonIO.read(GUILDS_PATH);
  for (const g of guildsData.values()) {
    GUILDS[g.id] = g;
  }
}

function saveGuilds() {
  // console.log("Saving Guilds")
  if (!GUILDS) loadGuilds();
  JsonIO.write(GUILDS_PATH, GUILDS);
}

/**
 * Saves the Guild's data to memory. USE THIS INSTEAD OF CHANGING CACHE DIRECTLY
 * @param {GuildInformation} guild
 */
function saveGuildData(guild) {
  if (!guild) return;
  if (!GUILDS) loadGuilds();

  // If the guild doesnt exist, save it and return.
  if (!GUILDS[guild.id]) {
    GUILDS[guild.id] = guild;
    return;
  }

  // If it does exist, update the settings and member list
  let existingGuild = GUILDS[guild.id];

  existingGuild.settings = guild.settings;
  existingGuild.owner = guild.owner;
  existingGuild.members = guild.members;

  // Save the new details
  GUILDS[guild.id] = existingGuild;
}
