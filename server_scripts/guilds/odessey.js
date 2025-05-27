// const $GuildAPI = Java.loadClass(
//   "earth.terrarium.odyssey_allies.api.teams.guild.GuildApi"
// ).API;

// const $ClaimsManager = Java.loadClass(
//   "earth.terrarium.cadmus.api.claims.ClaimApi"
// ).API;

// PlayerEvents.chat((event) => {
//   let chat = event.getMessage();
//   let player = event.getPlayer();

//   let data = getPlayerData(player.uuid);
//   let cs = getCombatStats(data);

//   // Create a components array
//   let texts = [];

//   // Get guild
//   let guildOpt = $GuildAPI.getPlayerGuild(player);
//   if (guildOpt && guildOpt.isPresent()) {
//     const guild = guildOpt.get();

//     const guildName = guild.settings().displayName;

//     const color = guild.color();

//     texts.push({
//       text: `[ `,
//       color: "white",
//     });

//     texts.push({
//       text: `${guildName}`,
//       color: color.getTextColor().toString(),
//       // hoverEvent: {
//       //   action: "show_item",
//       //   contents: {
//       //     id: "minecraft:stick",
//       //     count: 1,
//       //     components: {
//       //       custom_name: `{"text":"${guildName}"}`
//       //     }
//       //   },
//       // },
//     });

//     texts.push({
//       text: ` ] `,
//       color: "white",
//     });
//   }

//   // Add player name
//   texts.push({
//     text: `${player.username}: `,
//     color: "white",
//   });

//   // Add message
//   texts.push({
//     text: chat,
//     color: "white",
//   });

//   // Convert to JSON for tellraw
//   let tellraw = `tellraw @a ${JSON.stringify(texts)}`;
//   event.server.runCommandSilent(tellraw);
//   event.cancel();
// });
