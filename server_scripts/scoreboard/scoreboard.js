
// function createScoreboard(){

// }

// let sbIndex = 0;


// const SCOREBOARDS_TO_SHOW = []

// ServerEvents.tick((e) => {
//   if (!FEATURE_CREDITS) return;
//   if (e.server.tickCount % 80 != 0) return;

//   let leaderboardData = getLeaderboard().sort((a, b) => a.credits < b.credits);

//   const objectiveName = "bb_leaderboard";
//   const objectiveDisplayName = `{"text":" Credits ", "color":"yellow"}`;

//   const setupCommands = [
//     `scoreboard objectives remove ${objectiveName}`,
//     `scoreboard objectives add ${objectiveName} dummy ${objectiveDisplayName}`,
//     `scoreboard objectives setdisplay sidebar ${objectiveName}`,
//   ];

//   for (const cmd of setupCommands) {
//     e.server.runCommandSilent(cmd);
//   }

//   if (leaderboardData && leaderboardData.length > 0) {
//     for (let i = 0; i < leaderboardData.length; i++) {
//       let entryData = leaderboardData[i];
//       let actualPlayerName = entryData.name;
//       let credits = entryData.credits;

//       /** @type {TextComponent[]} */
//       let displayNameJsonComponent = [
//         { text: `${actualPlayerName} ` },
//         { text: `◎${numbersWithCommas(credits)}`, color: "yellow" },
//       ];

//       let displayNameJsonString = JSON.stringify(displayNameJsonComponent);

//       let score = i;
//       e.server.runCommandSilent(
//         `scoreboard players set ${actualPlayerName} ${objectiveName} ${score}`
//       );
//       e.server.runCommandSilent(
//         `scoreboard players display name ${actualPlayerName} ${objectiveName} ${displayNameJsonString}`
//       );
//     }
//   }
// });