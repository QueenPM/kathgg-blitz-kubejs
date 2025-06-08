// CONSTANTS

let $Vec3 = Java.loadClass("net.minecraft.world.phys.Vec3")

let $UUID = Java.loadClass("java.util.UUID");

let $ServerPlayer = Java.loadClass("net.minecraft.server.level.ServerPlayer");

let $ItemStack = Java.loadClass("net.minecraft.world.item.ItemStack");

let $Inventory = Java.loadClass("net.minecraft.world.entity.player.Inventory");

let $Entity = Java.loadClass("net.minecraft.world.entity.Entity");

// Tracker Config
// Cooldown in seconds
const TRACKER_COOLDOWN = 30;
// The distance at which start revealing the player's name.
const MAX_DISTANCE = 20;
// The distance at which the player's name will be fully revealed.
const REVEAL_DISTANCE = 5;

const DEVIATION_MIN = 5;
const DEVIATION_MAX = 20;

// Ghost Mode Config
// Cooldown in seconds
const GHOST_COOLDOWN = 60 * 30;
// Duration in seconds
const GHOST_DURATION = 60 * 5;
// Cost in Credits (if enabled)
const GHOST_COST = 50;

/**
 * Keeps track of tracker cooldowns.
 * @type {Map<string, number>} */
let TrackerCooldownCache = new Map();

/**
 * @type {Map<string, number>}
 */
let GHOST_USED = new Map();

/**
 * @typedef TrackerUpgrades
 * @property {integer} ghost
 * @property {integer} cooldown_reduction
 */

/**
 * @typedef TrackerData
 * @property {boolean} player_tracker - If the item is a player tracker
 * @property {boolean} autoTracker - If the tracker is set to auto track
 * @property {boolean} tracked - If the tracker is currently tracking a player
 * @property {UUID} target - The target entity to track
 * @property {boolean} broken - If the tracker is broken. This is to prevent multiple trackers from being used at the same time
 * @property {TrackerUpgrades} upgrades - Tracker Upgrades
 */
const DEFAULT_CUSTOM_DATA = {
  player_tracker: true,
  autoTracker: true,
  tracked: false,
  target: "null",
  broken: false,
  upgrades: {
    ghost: 0,
    cooldown_reduction: 0,
  },
};

/** @type {TextComponent[][]} */
const DEFAULT_COMPASS_LORE = [
  [
    {
      text: "Mode: ",
      italic: false,
    },
    {
      text: "Auto Tracking",
      italic: false,
      color: "green",
    },
  ],
  [
    {
      text: "",
    },
  ],
  [
    {
      text: "Right click to track the nearest players last known location",
      color: "green",
      italic: true,
    },
  ],
  [
    {
      text: "Shift + Right click to open Tracker GUI",
      italic: true,
    },
  ],
];

// HELPER FUNCTIONS

/**
 * Gets an array of trackable entities
 * @param {$Player_} player
 * @returns {$Entity_[]}
 */
function getTrackableEntities(player) {
  try {
    let entities = server.getEntities();
    let trackableEntities = [];

    for (const entity of entities) {
      if (entity.hasCustomName() && entity.type == "minecraft:pig") {
        trackableEntities.push(entity);
        continue;
      }

      if(entity.player){
        // Ignore players in ghost mode
        if(GHOST_USED.get(`${entity.uuid}`)) continue;
        if(entity.uuid.toString() === player.uuid.toString()) continue;
        trackableEntities.push(entity);
      }
    }

    // Calculate distance and sort entities
    // trackableEntities.sort((a, b) => {
    //   let distanceA = player.getDistance(a.blockPosition());
    //   let distanceB = player.getDistance(b.blockPosition());
    //   return distanceA - distanceB;
    // });

    trackableEntities.sort((a, b) => a.username - b.username);

    return trackableEntities;
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * Obfuscates a username based on the distance
 * @param {string} username - The username to obfuscate
 * @param {number} distance - The distance from the player
 * @returns {Object} - An object containing the unobfuscated and obfuscated parts of the username
 */
function obfuscateUsername(username, distance) {
  let obfuscatePercentage =
    1 -
    Math.min(
      1,
      Math.max(0, (distance - MAX_DISTANCE) / (REVEAL_DISTANCE - MAX_DISTANCE))
    );
  username = username.toString();

  let unobfuscateLength = Math.floor(
    username.length() * (1 - obfuscatePercentage)
  );
  let obfuscateLength = username.length() - unobfuscateLength;

  let unobfuscatedString = "";
  for (let i = 0; i < unobfuscateLength; i++) {
    unobfuscatedString += username.charCodeAt(i);
  }

  let obfuscatedString = "";
  for (let i = 0; i < obfuscateLength; i++) {
    obfuscatedString += "*";
  }

  return {
    unobfuscatedString: unobfuscatedString,
    obfuscatedString: obfuscatedString,
  };
}

/**
 * Returns true or false if the currently held item is the tracker.
 * @param {$ItemStack_} tracker
 * @returns
 */
function isItemTracker(tracker) {
  if (
    !tracker ||
    tracker.id != "minecraft:compass" ||
    !tracker.getCustomData().player_tracker
  )
    return false;
  return true;
}

/**
 * Gets the player's tracker from all their possible inventory slots. Returns null if they dont have a tracker
 * @param {$ServerPlayer_} player
 * @returns {$ItemStack_|null}
 */
function getTrackerFromPlayer(player) {
  /** @type {$ItemStack_} */
  let tracker = null;
  let slot = 0;
  for (let item of player.inventory.items) {
    if(item.id === "minecraft:air") continue;
    if (isItemTracker(item)) {
      tracker = item;
      break;
    }
    slot++
  }
  return {slot: slot, tracker:tracker};
}

/**
 * Deviates block position
 * @param {$BlockPos_} position
 */
function deviatePosition(position){
  let deviation = Math.floor(Math.random() * (DEVIATION_MAX - DEVIATION_MIN + 1) + DEVIATION_MIN);
  let xPercent = Math.random() * 0.3;
  let zPercent = Math.random() * 0.3;
  let yPercent = 1 - xPercent - zPercent;
  if (yPercent < 0) yPercent = 0;

  let xDev = Math.round(deviation * xPercent) * (Math.random() < 0.5 ? 1 : -1);
  let zDev = Math.round(deviation * zPercent) * (Math.random() < 0.5 ? 1 : -1);
  let yDev = Math.round(deviation * yPercent) * (Math.random() < 0.5 ? 1 : -1);

  let x = position.x + xDev;
  let z = position.z + zDev;
  let y = position.y + yDev;

  let vec = new $Vec3(x, y, z)

  return vec
}

/**
 * Updates the currently held tracker for the player
 * @param {$Player_} player
 * @param {$Entity_} entity
 * @param {TrackerData} newTrackerData
 * @param {number} trackerSlotInt
 */
function updateTracker(player, entity, newTrackerData, trackerSlotInt) {
  if(typeof trackerSlotInt == "undefined") return;

  if(GHOST_USED.get(`${entity.uuid}`)){
    player.server.runCommandSilent(`tellraw ${player.username} [{"text":"You cannot track ${entity.username} because they are Ghosted", "color":"gray"}]`)
    return;
  }

  let position = deviatePosition(entity.blockPosition());

  let { unobfuscatedString, obfuscatedString } = obfuscateUsername(
    entity.username,
    player.getDistance(entity.blockPosition())
  );

  /** @type {TextComponent[]} */
  let textArray = [
    {
      text: "Tracking: ",
      color: "gray",
      italic: false,
    },
  ];

  if (unobfuscatedString.length > 0) {
    textArray.push({
      text: unobfuscatedString,
      color: "gold",
      italic: false,
    });
  }

  if (obfuscatedString.length > 0) {
    textArray.push({
      text: obfuscatedString,
      color: "gold",
      obfuscated: true,
      italic: false,
    });
  }

  /** @type {TrackerData} */
  newTrackerData.target = entity.getStringUuid();
  newTrackerData.tracked = true;
  if (!player.isCreative()) {
    TrackerCooldownCache.set(
      `${player.getStringUuid()}`,
      Date.now() + TRACKER_COOLDOWN * 1000
    );
  }

  let lore = DEFAULT_COMPASS_LORE;

  if (newTrackerData.autoTracker == true) {
    lore[0] = [
      { text: "Mode: ", italic: false },
      { text: "Auto Tracking", color: "green", italic: false },
    ];
  } else {
    lore[0] = [
      { text: "Mode: ", italic: false },
      { text: "Targeted", color: "green", italic: false },
    ];
    lore[2] = [
      {
        text: "Right click to track the target players last known location",
        color: "green",
        italic: true,
      },
    ];
  }

  let displayComponent = textDisplayComponent(textArray, lore);
  let newCompassString = `minecraft:compass[${displayComponent},lodestone_tracker={target:{dimension:"${entity.level.dimension}",pos:[I;${position.x},${position.y},${position.z}]}, tracked:false},custom_data=${newTrackerData}]`;
  player.inventory.setItem(trackerSlotInt, Item.of(newCompassString));
  player.playNotifySound("minecraft:block.note_block.bell", "master", 1, 1);

  if(entity.player){
    sendPlayerWarning(entity, "You're being Tracked!", "Someone has pinged your location.")
  }
}

/**
 * Sets the tracker mode from Auto to Specific player. Set the target to null if the mode is auto. This is for changing the component data, not the item's current function
 * @param {$ItemStack_} tracker
 * @param {$Entity_|null} target
 * @returns {TrackerData}
 */
function setTrackerMode(tracker, target) {
  if (!isItemTracker(tracker)) return;

  /** @type {TrackerData} */
  let customData = tracker.getCustomData();
  if (!target) {
    customData.autoTracker = true;
  } else {
    customData.autoTracker = false;
    customData.target = target.getStringUuid();
  }

  return customData;
}

/**
 * Resets the tracker to default values
 * @param {$ServerPlayer_} player
 * @param {TrackerData} data
 */
function resetTracker(player, data) {
  if (!data) {
    data = DEFAULT_CUSTOM_DATA;
  }
  let displayComponent = textDisplayComponent(
    [
      { text: "Tracking: ", color: "gray", italic: false },
      { text: "No players found", color: "red" },
    ],
    DEFAULT_COMPASS_LORE
  );
  let newCompassString = `minecraft:compass[minecraft:enchantment_glint_override=false,lodestone_tracker={target:{dimension:"minecraft:overworld",pos:[I;0,0,0]}},${displayComponent},custom_data=${JSON.stringify(
    data
  )}]`;
  player.server.runCommandSilent(
    `item replace entity ${player.username} weapon.mainhand with ${newCompassString}`
  );
}

// EVENTS

/**
 * Returns true if the tracker is on cooldown
 * @param {$Player_} player
 * @returns {boolean}
 */
function isTrackerOnCooldown(player) {
  if (player.isCreative()) return false;
  let cooldownPlayer = TrackerCooldownCache.get(`${player.uuid.toString()}`);
  if (!cooldownPlayer) return false;

  let left = cooldownPlayer - Date.now();
  let percentage = left / (TRACKER_COOLDOWN * 1000);
  let barLength = 25;
  let barIncomplete = barLength - Math.floor(percentage * barLength);

  /** @type {TextComponent[]} */
  let text = [
    { text: `[`, color: "red", bold: true },
    { text: `i`.repeat(barIncomplete), color: "yellow", bold: false },
    { text: `i`.repeat(barLength - barIncomplete), color: "gray", bold: false },
    { text: `]`, color: "red", bold: true },
  ];
  let command = `title ${player.username} actionbar [${JSON.stringify(text)}]`;
  player.server.runCommandSilent(command);
  return true;
}

/**
 * Returns true if the tracker is on cooldown
 * @param {$Player_} player
 * @param {TrackerData} customData
 * @returns {boolean}
 */
function isTrackerBroken(player, customData) {
  // Get all trackers in inventory
  let trackers = 0;
  let brokenTrackers = 0;
  for (const item of player.inventory.items) {
    if (isItemTracker(item)) {
      trackers++;
      let customData = item.getCustomData();
      if (customData && customData.broken == true) {
        brokenTrackers++;
      }
      continue;
    }
  }

  // If they dont have a working tracker, then reset the tracker
  if (brokenTrackers == trackers) {
    customData.broken = false;
    /** @type {TextComponent[]} */
    let text = [
      {
        text: `You were able to fix this tracker`,
        color: "aqua",
        italic: false,
      },
    ];
    let command = `title ${player.username} actionbar [${JSON.stringify(
      text
    )}]`;
    player.server.runCommandSilent(command);
    resetTracker(player, customData);
    return false;
  }

  /** @type {TrackerData} */
  let heldTracker = player.getItemInHand().getCustomData();
  if (heldTracker.broken) {
    /** @type {TextComponent[]} */
    let text = [
      {
        text: `Cosmic interference has broken this device.`,
        color: "dark_purple",
        italic: false,
      },
    ];
    let command = `title ${player.username} actionbar [${JSON.stringify(
      text
    )}]`;
    player.server.runCommandSilent(command);
    return true;
  }
}

/**
 * @typedef {Object} PlayerInventory
 * @property {number} slot
 * @property {$ItemStack_} item
 */

ItemEvents.rightClicked((e) => {
  if (!FEATURE_TRACKER) return;
  if (!isItemTracker(e.item)) return;
  /** @type {$ServerPlayer_} */
  let player = e.player;

  /** @type {TrackerData} */
  let customData = e.item.getCustomData();

  // Unused - Would check if a Tracker is broken to avoid using multiple trackers. Instead, cooldown has been made global amongst all trackers per player
  // if(isTrackerBroken(player, customData)) return;

  if (player.crouching) {
    let data = {
      selectedSlot: player.inventory.selected,
      tracker: player.getMainHandItem(),
    };
    TrackerMenu.OpenMenu(player, "main", data);
    return;
  }

  if (isTrackerOnCooldown(player)) return;
  // Update the current tracker

  /** @type {$Entity_|null} */
  let trackingEntity = null;
  let trackableEntities = getTrackableEntities(player);

  // If the tracker is set to auto track, find the closest player
  if (customData.autoTracker == true) {
    let closestDistance = Infinity;
    for (const entity of trackableEntities) {
      let distance = player.getDistance(entity.position());
      if (distance < closestDistance) {
        closestDistance = distance;
        trackingEntity = entity;
      }
    }
  } else {
    // If the tracker is set to track a specific player, find that player
    for (const entity of trackableEntities) {
      if (entity.getStringUuid() === customData.target) {
        trackingEntity = entity;
        break;
      }
    }
  }

  if (!trackingEntity) {
    let displayComponent = textDisplayComponent(
      [
        { text: "Tracking: ", color: "gray", italic: false },
        { text: "No players found", color: "red" },
      ],
      DEFAULT_COMPASS_LORE
    );
    let newCompassString = `minecraft:compass[minecraft:enchantment_glint_override=false,lodestone_tracker={target:{dimension:"minecraft:overworld",pos:[I;0,0,0]}},${displayComponent},custom_data=${JSON.stringify(
      DEFAULT_CUSTOM_DATA
    )}]`;
    e.server.runCommandSilent(
      `item replace entity ${player.username} weapon.mainhand with ${newCompassString}`
    );
    player.playNotifySound(
      "minecraft:block.note_block.basedrum",
      "master",
      1,
      1
    );
    return;
  }

  updateTracker(player, trackingEntity, customData, player.inventory.selected);
});

/**
 * Returns in string form the minecraft:compass item with the default tracker data
 * @returns
 */
function getDefaultTrackerNBTString() {
  let displayComponent = textDisplayComponent(
    [
      { text: "Tracking: ", color: "gray", italic: false },
      { text: "No players found", color: "red" },
    ],
    DEFAULT_COMPASS_LORE
  );
  return `minecraft:compass[max_stack_size=1,custom_data=${JSON.stringify(
    DEFAULT_CUSTOM_DATA
  )},${displayComponent}]]`;
}

ServerEvents.commandRegistry((event) => {
  const { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal("tracker")
      .requires((s) => s.hasPermission(2))
      .executes((c) => {
        /** @type {$ServerPlayer_} */
        let player = c.source.player;
        player.giveInHand(getDefaultTrackerNBTString());
        return 1;
      })
  );
});

// Crafting

ServerEvents.recipes((event) => {
  event.shaped(
    Item.of(getDefaultTrackerNBTString(), 1),
    [" I ", "ISI", " I "],
    {
      I: "minecraft:iron_ingot",
      S: "minecraft:diamond",
    }
  );
});

function coloredDimension(dimension) {
  switch (dimension) {
    case "The Nether":
      return "§cThe Nether";
    case "The End":
      return "§5The End";
    case "Overworld":
      return "§aOverworld";
    default:
      return `§f${dimension}`;
  }
}

// Ghost
/**
 * Activates Ghost Mode for a player
 * @param {$ServerPlayer_} player
 */
function activateGhost(player) {
  // Check if the player can use ghost
  let ghostLastUsed = GHOST_USED.get(`${player.uuid}`);

  if (ghostLastUsed && Date.now() - ghostLastUsed <= GHOST_COOLDOWN * 1000) {
    let endsAt = ghostLastUsed + GHOST_COOLDOWN * 1000;
    player.server.runCommandSilent(
      `tellraw ${
        player.username
      } [{"text":"Ghost is on cooldown for ${timeToString(
        endsAt - Date.now()
      )}", "color":"dark_red"}]`
    );
    return;
  }

  if (FEATURE_CREDITS) {
    let data = getPlayerData(player.uuid);
    if (data && hasCredits(player, GHOST_COST)) {
      takeCredits(player, GHOST_COST);
    } else {
      player.server.runCommandSilent(
        `tellraw ${player.username} [{"text":"You cannot afford to Ghost", "color":"dark_red"}]`
      );
      return;
    }
  }

  GHOST_USED.set(`${player.uuid}`, Date.now());
  player.server.runCommandSilent(
    `tellraw @a {"text":"", "extra": [${JSON.stringify(
      getPlayerChatName(player)
    )}, {"text":" has activated Ghost Organisation", "color":"gray"}]}`
  );

  player.server.runCommandSilent(`bossbar remove ghost_${player}`);
  player.server.runCommandSilent(
    `bossbar add ghost_${player.username.toLowerCase()} [{"text":"Ghost Duration: ${timeToString(
      GHOST_DURATION * 1000
    )}"}]`
  );
  player.server.runCommandSilent(
    `bossbar set ghost_${player.username.toLowerCase()} value 100`
  );
  player.server.runCommandSilent(
    `bossbar set ghost_${player.username.toLowerCase()} players ${
      player.username
    }`
  );
}

// Remove all Boss Bars on load
ServerEvents.loaded(e => {
  let players = getLeaderboard();
  for(const player of players){
    e.server.runCommandSilent(`bossbar remove ghost_${player.name.toLowerCase()}`);

  }
})

ServerEvents.tick((e) => {
  if (e.server.tickCount % 20 != 0) return;

  GHOST_USED.forEach((v, k) => {
    let endsAt = v + GHOST_DURATION * 1000;
    let now = Date.now();
    let player = getPlayerName(k).toLowerCase();
    if (endsAt > now) {
      let remaining = endsAt - now;
      let total = GHOST_DURATION * 1000;
      let progress = Math.floor((remaining / total) * 100);
      e.server.runCommandSilent(
        `bossbar set ghost_${player} value ${progress}`
      );
      e.server.runCommandSilent(
        `bossbar set ghost_${player} name [{"text":"Ghost Duration: ${timeToString(
          remaining
        )}"}]`
      );
    } else {
      GHOST_USED.delete(k);
      player = e.server.getPlayer(k)
      e.server.runCommandSilent(`bossbar remove ghost_${player.username.toLowerCase()}`);
      e.server.runCommandSilent(
    `tellraw @a {"text":"", "extra": [${JSON.stringify(
      getPlayerChatName(player)
    )}, {"text":" has left Ghost Organisation", "color":"gray"}]}`
  );
    }
  });
});

// GUI

let TrackerMenu = new Menu(
  {
    title: "Tracker",
    rows: 5,
    showPlayerInventory: false,
  },
  [
    {
      name: "main",
      load: function (menu, data) {
        let entities = getTrackableEntities(menu.player);
        let max_rows = 4;

        for (let i = 0; i < entities.length; i++) {
          let entity = entities[i];
          let row = Math.floor(i / MAX_COLUMNS);
          let column = i % MAX_COLUMNS;

          if (row >= max_rows) {
            break;
          }
          let { unobfuscatedString, obfuscatedString } = obfuscateUsername(
            entity.player ? entity.username : entity.name.string,
            menu.player.getDistance(entity.position())
          );

          let ghosted = GHOST_USED.get(`${entity.uuid}`)

          let distance = deviatePosition(entity.position()).distanceTo(menu.player.position()).toFixed(2)

          menu.gui.slot(column, 0, (slot) => {
            slot.item = createMenuButton({
              title: [
                { text: `${unobfuscatedString}`, obfuscated: ghosted},
                { text: `${obfuscatedString}`, obfuscated: true },
              ],
              description: [
                [
                  {
                    text: ghosted ? "§7Dimension: §8???" : `§7Dimension: ${coloredDimension(
                      cleanIDToName(entity.level.dimension)
                    )}`,
                  },
                ],
                [
                  {
                    text: ghosted ? "§7Distance: §8???" : `§7Distance: §f${distance} blocks`,
                  },
                ],
                [{ text: `Click to start tracking` }],
              ],
              itemID: "minecraft:player_head",
            });
            slot.leftClicked = (e) => {
              menu.close();
              menu.player.server.scheduleInTicks(2, () => {
                if (isTrackerOnCooldown(menu.player)) return;
                updateTracker(
                  menu.player,
                  entity,
                  setTrackerMode(data.tracker, entity),
                  data.selectedSlot
                );
              });
            };
          });
        }

        let tracker = getTrackerFromPlayer(menu.player);
        if (tracker) {
          let customData = tracker.tracker.getCustomData();
          if (customData.autoTracker == false) {
            // Auto Tracking
            menu.gui.slot(4, 4, (slot) => {
              slot.item = createMenuButton({
                title: [{ text: "Auto Track", color: "green", italic: false }],
                description: [
                  [
                    {
                      text: "§7Click to track the nearest player",
                      color: "green",
                      italic: false,
                    },
                  ],
                ],
                itemID: "minecraft:compass",
                components: {
                  lodestone_tracker: {
                    target: { dimension: "minecraft:end", pos: [0, 0, 0] },
                  },
                  enchantment_glint_override: false,
                },
              });

              slot.leftClicked = (e) => {
                menu.close();
                menu.player.server.scheduleInTicks(2, () => {
                  if (isTrackerOnCooldown(menu.player)) return;
                  updateTracker(
                    menu.player,
                    entities[0],
                    setTrackerMode(data.tracker, null),
                    data.selectedSlot
                  );
                });
              };
            });
          }

          // Special Powers

          menu.gui.slot(3, 4, (slot) => {
            let ghostLastUsed = GHOST_USED.get(`${menu.player.uuid}`);
            let cooldown = "";
            if (
              ghostLastUsed &&
              Date.now() - ghostLastUsed <= GHOST_COOLDOWN * 1000
            ) {
              let endsAt = ghostLastUsed + GHOST_COOLDOWN * 1000;
              cooldown = timeToString(endsAt - Date.now());
            }

            let description = [
              [
                {
                  text: "§7Activates Ghost",
                  color: "green",
                  italic: false,
                },
              ],
              [
                {
                  text: "§7You cannot be tracked during the duration",
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
                  text: `Cost: $${GHOST_COST}`,
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
                  text: timeToString(GHOST_DURATION * 1000),
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
                  text: timeToString(GHOST_COOLDOWN * 1000),
                  color: "red",
                  italic: false,
                },
              ]
            );

            slot.item = createMenuButton({
              title: [
                {
                  text: `Ghost${cooldown ? ` (${cooldown})` : ""}`,
                  color: "white",
                  italic: false,
                },
              ],
              description: description,
              itemID: "minecraft:structure_void",
            });

            slot.leftClicked = (e) => {
              menu.close();
              activateGhost(menu.player);
            };
          });
        }
      },
    },
  ]
);
