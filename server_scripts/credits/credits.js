// The minimum amount of credits given per player kill
const CREDITS_FOR_KILLS = 1;
// The maximum amount of credits given per player kill for distance bonus
const CREDITS_FOR_KILLS_MAX = 25;
// The max distance to scale it up. (CREDITS_FOR_KILLS_MAX for this or beyond distance)
const MAX_DISTANCE_CREDITS_FOR_KILLS = 30;
const MIN_DISTANCE_CREDITS_FOR_KILLS = 4;

/**
 * Checks if the player has the amount in credits
 * @param {$ServerPlayer_} player
 * @param {number} credits
 */
function hasCredits(player, credits) {
  // let playerData = getPlayerData(player.uuid);
  // if (playerData.credits >= credits) return true;
  // return false;

  // Get Lightman's Currency Wallet via API
  let wallet = getPlayerMoney(player);

  // If it failed get the credits from Player Store
  if(!wallet) {
    let pData = getPlayerData(player.uuid);
    if(!pData) return false;
    return pData.credits >= credits
  }
  return wallet.wallet.value >= credits
}

/**
 * Awards the player credits
 * @param {$ServerPlayer_} player
 * @param {number} credits
 */
function giveCredits(player, credits) {
  let playerData = getPlayerData(player.uuid);
  playerData.credits += credits;

  /** @type {TextComponent[]} */
  let msg = [{ text: `§e+§6$${CREDITS_FOR_KILLS}` }];

  if (credits > CREDITS_FOR_KILLS) {
    msg.push({
      text: ` §e(+§6$${credits - CREDITS_FOR_KILLS} §eBonus)`,
    });
  }

  givePlayerMoney(player, credits);

  player.server.runCommandSilent(
    `title ${player.username} actionbar ${JSON.stringify(msg)}`
  );
  player.playNotifySound("lightmanscurrency:coins_clinking", "ambient", 1, 1);
}

/**
 * Takes away the player credits
 * @param {$ServerPlayer_} player
 * @param {number} credits
 */
function takeCredits(player, credits) {
  if(!Platform.isLoaded("lightmanscurrency")){
    takePlayerMoney(player, credits);
  }else{
    let playerData = getPlayerData(player.uuid);
    playerData.credits -= credits;
  }
}

/**
 * Sets the player credits
 * @param {$ServerPlayer_} player
 * @param {number} credits
 */
function setCredits(player, credits) {
  if(!Platform.isLoaded("lightmanscurrency")){
    let playerMoney = getPlayerMoney(player);
    let difference = credits - playerMoney.wallet.value;
    
    if (credits <= 0 || difference == 0) return;
    
    if (difference > 0) {
      takePlayerMoney(player, difference * -1);
    } else {
      givePlayerMoney(player, difference);
    }
  }else{
    let playerData = getPlayerData(player.uuid);
    playerData.credits = credits;
  }
}

ServerEvents.tick((e) => {
  if (!FEATURE_CREDITS) return;
  if (e.server.tickCount % 80 != 0) return;

  let leaderboardData = getLeaderboard().sort((a, b) => a.credits < b.credits);

  const objectiveName = "bb_leaderboard";
  const objectiveDisplayName = `{"text":" Credits ", "color":"yellow"}`;

  const setupCommands = [
    `scoreboard objectives remove ${objectiveName}`,
    `scoreboard objectives add ${objectiveName} dummy ${objectiveDisplayName}`,
    `scoreboard objectives setdisplay sidebar ${objectiveName}`,
  ];

  for (const cmd of setupCommands) {
    e.server.runCommandSilent(cmd);
  }

  if (leaderboardData && leaderboardData.length > 0) {
    for (let i = 0; i < leaderboardData.length; i++) {
      let entryData = leaderboardData[i];
      let actualPlayerName = entryData.name;
      let credits = entryData.credits;

      /** @type {TextComponent[]} */
      let displayNameJsonComponent = [
        { text: `${actualPlayerName} ` },
        { text: `$${numbersWithCommas(credits)}`, color: "yellow" },
      ];

      let displayNameJsonString = JSON.stringify(displayNameJsonComponent);

      let score = i;
      e.server.runCommandSilent(
        `scoreboard players set ${actualPlayerName} ${objectiveName} ${score}`
      );
      e.server.runCommandSilent(
        `scoreboard players display name ${actualPlayerName} ${objectiveName} ${displayNameJsonString}`
      );
    }
  }
});


ServerEvents.commandRegistry((event) => {
  const { commands: Commands, arguments: Arguments } = event;

  if (!FEATURE_CREDITS) return;

  event.register(
    Commands.literal("credits")
      .requires((s) => s.hasPermission(2))
      .then(
        Commands.argument("target", Arguments.PLAYER.create(event)).then(
          Commands.argument("amount", Arguments.INTEGER.create(event)).executes(
            (c) => {
              /** @type {$ServerPlayer_} */
              let targetPlayer = Arguments.PLAYER.getResult(c, "target");
              /** @type {number} */
              let amount = Arguments.INTEGER.getResult(c, "amount");

              setCredits(targetPlayer, amount);
              return 1;
            }
          )
        )
      )
  );
});
