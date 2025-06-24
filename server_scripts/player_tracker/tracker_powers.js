/**
 * @typedef {Object} PowerConfig
 * @property {string} displayName
 * @property {string} description
 * @property {string} icon - A Minecraft ID for the icon
 * @property {() => boolean} activateFunction
 * @property {number} cooldown
 * @property {number} cost
 * @property {number} duration
 */

/**
 * Available power IDs
 * @readonly
 * @type {readonly Record<string, PowerConfig>}
 */
const POWER_IDS = Object.freeze({
  ghost: {
    displayName: "Ghost",
    description: "Activate to make yourself untrackable.",
    icon: "minecraft:structure_void",
    cooldown: 60 * 30 * 1000,
    duration: 60 * 5 * 1000,
    cost: 50,
    activateFunction: activateGhost,
  },
  glow: {
    displayName: "Glow",
    description: "Activate to apply the Glow effect on your current target",
    icon: "minecraft:glowstone_dust",
    cooldown: 60 * 5 * 1000,
    duration: 60 * 1 * 1000,
    cost: 5,
    activateFunction: activateGlow
  },
});

/**
 * Union type of all valid power IDs
 * @typedef {"ghost", "glow"} PowerId
 */

/**
 * @typedef {Object} PlayerPowers
 * @property {Date} lastUsed
 */

/**
 * @type {Map<string, Map<string, PlayerPowers>>}
 */
let TRACKER_POWERS = new Map();

/**
 * Check if a power is on cooldown
 * @param {string} playerId
 * @param {PowerId} powerId
 * @returns {boolean}
 */
function isPowerOnCooldown(playerId, powerId) {
  // Check if the Power has been used before
  const playerPowers = TRACKER_POWERS.get(playerId);
  if (!playerPowers || !playerPowers.has(powerId)) return false;

  // Get the last time that it has been used
  const power = playerPowers.get(powerId);
  const cooldown = POWER_IDS[powerId].cooldown;

  const timeSinceUsed = Date.now() - power.lastUsed.getTime();
  return timeSinceUsed < cooldown;
}

/**
 * Returns True if the power is currently active for the player
 * @param {string} playerId
 * @param {PowerId} powerId
 */
function isPowerActive(playerId, powerId) {
  // Check if the Power has been used before
  const playerPowers = TRACKER_POWERS.get(playerId);
  if (!playerPowers || !playerPowers.has(powerId)) return false;

  const power = playerPowers.get(powerId);
  const duration = POWER_IDS[powerId].duration;

  const timeSinceUsed = Date.now() - power.lastUsed.getTime();
  return timeSinceUsed < duration;
}

/**
 * Get remaining cooldown time in milliseconds
 * @param {string} playerId
 * @param {PowerId} powerId
 * @returns {number} 0 if not on cooldown
 */
function getRemainingCooldown(playerId, powerId) {
  const playerPowers = TRACKER_POWERS.get(playerId);
  if (!playerPowers || !playerPowers.has(powerId)) return 0;

  const power = playerPowers.get(powerId);
  const timeSinceUsed = Date.now() - power.lastUsed.getTime();
  const cooldown = POWER_IDS[powerId].cooldown;
  return Math.max(0, cooldown - timeSinceUsed);
}

/**
 * Get remaining duration for a power in milliseconds
 * @param {string} playerId 
 * @param {PowerId} powerId 
 * @returns {number}
 */
function getRemainingDuration(playerId, powerId) {
  const playerPowers = TRACKER_POWERS.get(playerId);
  if (!playerPowers || !playerPowers.has(powerId)) return 0;

  const power = playerPowers.get(powerId);
  const duration = POWER_IDS[powerId].duration;
  const timeSinceUsed = Date.now() - power.lastUsed.getTime();
  return Math.max(0, duration - timeSinceUsed);
}

/**
 * Puts a Power on cooldown for the player
 * @param {string} playerId
 * @param {PowerId} powerId
 */
function putPowerOnCooldown(playerId, powerId) {
  let playerPowers = TRACKER_POWERS.get(playerId);
  if (!playerPowers) {
    playerPowers = new Map();
    TRACKER_POWERS.set(playerId, playerPowers);
  }

  playerPowers.set(powerId, { lastUsed: new Date() });
}

/**
 * Helper function to activate a power. Will send Player messages if unsuccessful. Returns true if power has been activated
 * @param {$ServerPlayer_} player
 * @param {PowerId} powerId
 * @returns {boolean}
 */
function tryActivatePower(player, powerId) {
  // Get the Power Properties
  const power = POWER_IDS[powerId];
  if (!power) return false;

  // If the power is on cooldown, return false
  if (isPowerOnCooldown(`${player.stringUuid}`, powerId)) {
    player.server.runCommandSilent(
      `tellraw ${player.username} [{"text":"${power.displayName} is on cooldown.", "color":"dark_red"}]`
    );
    return false;
  }

  // If credits is enabled, checks if you can use the power
  if (FEATURE_CREDITS && !hasCredits(player, power.cost)) {
    player.server.runCommandSilent(
      `tellraw ${player.username} [{"text":"You cannot afford to activate ${power.displayName}", "color":"dark_red"}]`
    );
    return false;
  }

  // Run the activation function
  const result = power.activateFunction(player);
  
  if(result){
    // Pay for the Power
    takeCredits(player, power.cost)
    // Put the power on cooldown
    putPowerOnCooldown(`${player.stringUuid}`, powerId);
  }
}

/**
 * Gets a the Power Button for the GUI
 * @param {playerId} playerId
 * @param {PowerId} powerId 
 * @return {$ItemStack_}
 */
function getPowerButton(playerId, powerId) {
  const power = POWER_IDS[powerId]

  let description = [
    [
      {
        text: `Activates ${power.displayName}`,
        color: "green",
        italic: false,
      },
    ],
    [
      {
        text: power.description,
        color: "green",
        italic: false,
      },
    ],
    [
      {
        text: "",
        color: "green",
        italic: false,
      },
    ],
  ];

  if (FEATURE_CREDITS) {
    description.push([
      {
        text: `Cost: ◎${power.cost}`,
        color: "yellow",
        italic: false,
      },
    ]);
  }

  description.push(
    [
      {
        text: "Duration: ",
        color: "green",
        italic: false,
      },
      {
        text: timeToString(power.duration),
        color: "green",
        italic: false,
      },
    ],
    [
      {
        text: "Cooldown: ",
        color: "red",
        italic: false,
      },
      {
        text: timeToString(power.cooldown),
        color: "red",
        italic: false,
      },
    ]
  );

  return createMenuButton({
    title: [
      {
        text: `${power.displayName}${isPowerOnCooldown(playerId, powerId) ? ` (${timeToString(getRemainingCooldown(playerId, powerId))})` : ""}`,
        color: "white",
        italic: false,
      },
    ],
    description: description,
    itemID: power.icon,
  });
}

/**
 * Get all active powers for a player
 * @param {string} playerId
 * @returns {PowerId[]}
 */
function getActivePowers(playerId) {
  const activePowers = [];
  for (const powerId of Object.keys(POWER_IDS)) {
    if (isPowerActive(playerId, powerId)) {
      activePowers.push(powerId);
    }
  }
  return activePowers;
}

/**
 * @type {Map<string, number>} playerId -> current display index
 */
let POWER_DISPLAY_INDEX = new Map();

/**
 * Create or update boss bar for a power
 * @param {Internal.MinecraftServer} server
 * @param {string} playerId
 * @param {PowerId} powerId
 * @param {number} remaining
 * @param {number} total
 */
function updatePowerBossBar(server, playerId, powerId, remaining, total) {
  const playerName = getPlayerName(playerId).toLowerCase();
  const barId = `power_${playerName}`;
  const progress = Math.floor((remaining / total) * 100);
  const powerDisplayName = powerId.charAt(0).toUpperCase() + powerId.slice(1);

  // Create or update the boss bar
  server.runCommandSilent(
    `bossbar add ${barId} [{"text":"${powerDisplayName}: ${timeToString(
      remaining
    )}"}]`
  );
  server.runCommandSilent(`bossbar set ${barId} players ${playerName}`);
  server.runCommandSilent(`bossbar set ${barId} value ${progress}`);
  server.runCommandSilent(`bossbar set ${barId} color purple`);
  server.runCommandSilent(
    `bossbar set ${barId} name [{"text":"${powerDisplayName}: ${timeToString(
      remaining
    )}"}]`
  );
}

/**
 * Remove boss bar for a player
 * @param {Internal.MinecraftServer} server
 * @param {string} playerId
 */
function removePowerBossBar(server, playerId) {
  const playerName = getPlayerName(playerId).toLowerCase();
  const barId = `power_${playerName}`;
  server.runCommandSilent(`bossbar remove ${barId}`);
}

// Remove all Boss Bars on load
ServerEvents.loaded((e) => {
  let players = getLeaderboard();
  for (const player of players) {
    const playerName = player.name.toLowerCase();
    // Remove the unified power boss bar
    e.server.runCommandSilent(`bossbar remove power_${playerName}`);

    // Also remove old individual power boss bars (for cleanup)
    for (const power of Object.keys(POWER_IDS)) {
      e.server.runCommandSilent(`bossbar remove ${power}_${playerName}`);
    }
  }

  // Clear display indices
  POWER_DISPLAY_INDEX.clear();
});

ServerEvents.tick((e) => {
  if (e.server.tickCount % 20 != 0) return; // Run every second

  // Get all players with active powers
  const playersWithActivePowers = new Set();

  // Iterate through all tracked powers to find active ones
  for (const [playerId, playerPowers] of TRACKER_POWERS.entries()) {
    const activePowers = getActivePowers(playerId);

    if (activePowers.length > 0) {
      playersWithActivePowers.add(playerId);

      // Get or initialize display index for this player
      let displayIndex = POWER_DISPLAY_INDEX.get(playerId) || 0;

      // Cycle through active powers (change every 3 seconds)
      if (e.server.tickCount % 60 === 0) {
        // Every 3 seconds
        displayIndex = (displayIndex + 1) % activePowers.length;
        POWER_DISPLAY_INDEX.set(playerId, displayIndex);
      }

      // Display the current power
      const currentPower = activePowers[displayIndex];
      const remaining = getRemainingDuration(playerId, currentPower);
      const total = POWER_IDS[currentPower].duration;

      if (remaining > 0) {
        updatePowerBossBar(e.server, playerId, currentPower, remaining, total);
      }
    } else {
      // No active powers, remove boss bar and display index
      removePowerBossBar(e.server, playerId);
      POWER_DISPLAY_INDEX.delete(playerId);

      // Send message if player just finished using powers
      const player = e.server.getPlayer(playerId);
      if (player) {
        // Only send message if they had powers before (optional)
        // You might want to track this state separately to avoid spam
      }
    }
  }

  // Clean up display indices for players who no longer have active powers
  for (const [playerId] of POWER_DISPLAY_INDEX.entries()) {
    if (!playersWithActivePowers.has(playerId)) {
      POWER_DISPLAY_INDEX.delete(playerId);
      removePowerBossBar(e.server, playerId);
    }
  }
});

PlayerEvents.loggedOut((event) => {
  const playerId = `${event.player.stringUuid}`
  POWER_DISPLAY_INDEX.delete(playerId);
  removePowerBossBar(event.server, playerId);
});
