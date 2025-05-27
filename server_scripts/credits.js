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
  let playerData = getPlayerData(player.uuid);
  if (playerData.credits >= credits) return true;
  return false;
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
  let msg = [
    { text: `$${CREDITS_FOR_KILLS}`, color: "yellow"}
  ]

  if(credits > CREDITS_FOR_KILLS){
    msg.push({
      text: ` + $${credits - CREDITS_FOR_KILLS} Bonus`,
      color: "yellow"
    })
  }

  player.server.runCommandSilent(`title ${player.username} actionbar ${JSON.stringify(msg)}`)
  player.playNotifySound("entity.experience_orb.pickup", "ambient", 1, 1)
}

/**
 * Takes away the player credits
 * @param {$ServerPlayer_} player
 * @param {number} credits
 */
function takeCredits(player, credits) {
  let playerData = getPlayerData(player.uuid);
  playerData.credits -= credits;
}

/**
 * Sets the player credits
 * @param {$ServerPlayer_} player
 * @param {number} credits
 */
function setCredits(player, credits) {
  let playerData = getPlayerData(player.uuid);
  playerData.credits = credits;
}

ServerEvents.tick((e) => {
  if (!FEATURE_CREDITS) return;
  if (e.server.tickCount % 20 != 0) return;

  let leaderboardData = getLeaderboard();

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
        { text: `$${credits}`, color: "yellow" },
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

EntityEvents.death((e) => {
  if (!FEATURE_CREDITS) return;

  let killedPlayer = e.entity;
  if(!killedPlayer.player) return;

  let killerPlayer = e.source.player;
  if (!killerPlayer) return;

  if (arePlayersAllies(killedPlayer, killerPlayer)) return;

  let distance = killedPlayer.position().distanceTo(killerPlayer.position());

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
