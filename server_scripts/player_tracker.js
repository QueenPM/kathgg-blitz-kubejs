// CONSTANTS

let $UUID = Java.loadClass("java.util.UUID");

let $ServerPlayer = Java.loadClass("net.minecraft.server.level.ServerPlayer");

let $ItemStack = Java.loadClass("net.minecraft.world.item.ItemStack");

let $Inventory = Java.loadClass("net.minecraft.world.entity.player.Inventory");

let $Entity = Java.loadClass("net.minecraft.world.entity.Entity");

// Cooldown in seconds
const COOLDOWN = 30;
// The distance at which start revealing the player's name.
const MAX_DISTANCE = 100;
// The distance at which the player's name will be fully revealed.
const REVEAL_DISTANCE = 30;

/**
 * @typedef TrackerData
 * @property {boolean} player_tracker - If the item is a player tracker
 * @property {boolean} autoTracker - If the tracker is set to auto track
 * @property {boolean} tracked - If the tracker is currently tracking a player
 * @property {UUID} target - The target entity to track
 * @property {string} cooldown - The cooldown for the tracker (in seconds). 0 means ready to use, otherwise its a timestamp to when it can be used again
 * @property {boolean} broken - If the tracker is broken. This is to prevent multiple trackers from being used at the same time
 */
const DEFAULT_CUSTOM_DATA = {
  player_tracker: true,
  autoTracker: true,
  tracked: false,
  target: "null",
  cooldown: "0",
  broken: false
}

/** @type {TextComponent[][]} */
const DEFAULT_COMPASS_LORE = [
  [
    {
      text: "Mode: ",
      italic: false
    },
    {
      text: "Auto Tracking",
      italic: false,
      color: "green"
    }
  ],
  [
    {
      text: ""
    },
  ],
  [
    {
      text: "Right click to track the nearest players last known location",
      color: "green",
      italic: true
    }
  ],
  [
    {
      text: "Shift + Right click to open Tracker GUI",
      italic: true
    }
  ]
]

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
      }
    }

    // Calculate distance and sort entities
    trackableEntities.sort((a, b) => {
      let distanceA = player.getDistance(a.blockPosition())
      let distanceB = player.getDistance(b.blockPosition())
      return distanceA - distanceB;
    });

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
  let obfuscatePercentage = 1 - Math.min(1, Math.max(0, (distance - MAX_DISTANCE) / (REVEAL_DISTANCE - MAX_DISTANCE)));
  username = username.toString();

  let unobfuscateLength = Math.floor(username.length() * (1 - obfuscatePercentage));
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
    obfuscatedString: obfuscatedString
  };
}

/**
 * Returns true or false if the currently held item is the tracker.
 * @param {$ItemStack_} tracker
 * @returns 
 */
function isItemTracker(tracker) {
  if (!tracker || tracker.id != "minecraft:compass" || !tracker.getCustomData().player_tracker) return false;
  return true;
}

/**
 * Updates the currently held tracker for the player
 * @param {$Player_} player
 * @param {$Entity_} entity
 * @param {TrackerData} currentTrackerData
 */
function updateTracker(player, entity, currentTrackerData) {
  let tracker = player.getMainHandItem();
  if (!isItemTracker(tracker)) return;
  let position = entity.blockPosition();
  let distance = player.getDistance(position);

  let { unobfuscatedString, obfuscatedString } = obfuscateUsername(entity.username, distance);

  /** @type {TextComponent[]} */
  let textArray = [{
    text: "Tracking: ",
    color: "gray",
    italic: false,
  }];

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
  let customData = currentTrackerData
  customData.target = entity.getStringUuid();
  customData.tracked = true;
  if(!player.isCreative()){
    customData.cooldown = (Date.now() + COOLDOWN * 1000).toString();
  }

  let lore = DEFAULT_COMPASS_LORE;

  if (customData.autoTracker == true) {
    lore[0] = [
      { text: "Mode: ", italic: false },
      { text: "Auto Tracking", color: "green", italic: false }
    ]
  } else {
    lore[0] = [
      { text: "Mode: ", italic: false },
      { text: "Targeted", color: "green", italic: false }
      // {text:unobfuscatedString, color:"green", italic:false},
      // {text:obfuscatedString, color:"green", obfuscated:true, italic:false}
    ]
    lore[2] = [
      {
        text: "Right click to track the target players last known location",
        color: "green",
        italic: true
      }
    ]
  }

  let displayComponent = textDisplayComponent(textArray, lore);
  let newCompassString = `minecraft:compass[${displayComponent},lodestone_tracker={target:{dimension:"${entity.level.dimension}",pos:[I;${position.x},${position.y},${position.z}]}, tracked:false},custom_data=${customData}]`;
  player.server.runCommandSilent(`item replace entity ${player.username} weapon.mainhand with ${newCompassString}`);
  player.playNotifySound("minecraft:block.note_block.bell", "master", 1, 1);
}

/**
 * Sets the tracker mode from Auto to Specific player. Set the target to null if the mode is auto. This is for changing the component data, not the item's current function
 * @param {$Player_} player
 * @param {$Entity_|null} target
 * @returns {TrackerData}
 */
function setTrackerMode(player, target) {
  let tracker = player.getMainHandItem();
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
  if(!data){
    data = DEFAULT_CUSTOM_DATA;
  }
  let displayComponent = textDisplayComponent([{ text: "Tracking: ", color: "gray", italic: false }, { text: "No players found", color: "red" }], DEFAULT_COMPASS_LORE);
  let newCompassString = `minecraft:compass[minecraft:enchantment_glint_override=false,lodestone_tracker={target:{dimension:"minecraft:overworld",pos:[I;0,0,0]}},${displayComponent},custom_data=${JSON.stringify(data)}]`;
  player.server.runCommandSilent(`item replace entity ${player.username} weapon.mainhand with ${newCompassString}`);
}

// EVENTS

/**
 * Returns true if the tracker is on cooldown
 * @param {$Player_} player
 * @param {TrackerData} customData
 * @returns {boolean}
*/
function isTrackerOnCooldown(player, customData){
  let cooldown = parseInt(customData.cooldown.getAsString());
  if(isNaN(cooldown)) return false;
  if(cooldown == 0 || cooldown <= Date.now()){
    return false;
  }

  let left = cooldown - Date.now();
  let percentage = left / (COOLDOWN * 1000);
  let barLength = 25;
  let barIncomplete = barLength - Math.floor(percentage * barLength);

  /** @type {TextComponent[]} */
  let text = [
    {text: `[`, color: "red", bold:true},
    {text: `i`.repeat(barIncomplete), color: "yellow", bold:false},
    {text: `i`.repeat(barLength - barIncomplete), color: "gray", bold:false},
    {text: `]`, color: "red", bold: true}
  ]
  let command = `title ${player.username} actionbar [${JSON.stringify(text)}]`
  player.server.runCommandSilent(command);
  return true;
}

/**
 * Returns true if the tracker is on cooldown
 * @param {$Player_} player
 * @param {TrackerData} customData
 * @returns {boolean}
*/
function isTrackerBroken(player, customData){
  if(customData.broken == false){
    return false;
  }

  // Check if they still have nother tracker in their inventory
  let trackers = 0;
  let brokenTrackers = 0;
  for(const item of player.inventory.items){
    if(isItemTracker(item)){
      trackers++;
      let customData = item.getCustomData();
      if(customData && customData.broken == true){
        brokenTrackers++;
      }
      continue;
    }
  }

  // If they dont have a working tracker, then reset the tracker
  if(brokenTrackers == trackers){
    customData.broken = false;
    /** @type {TextComponent[]} */
    let text = [
      {text: `You were able to fix this tracker`, color: "aqua", italic:false}
    ]
    let command = `title ${player.username} actionbar [${JSON.stringify(text)}]`
    player.server.runCommandSilent(command);
    resetTracker(player, customData);
    return false;
  }

  /** @type {TextComponent[]} */
  let text = [
    {text: `Cosmic interference has broken this device.`, color: "dark_purple", italic:false}
  ]
  let command = `title ${player.username} actionbar [${JSON.stringify(text)}]`
  player.server.runCommandSilent(command);
  return true;
}

/**
 * @typedef {Object} PlayerInventory
 * @property {number} slot
 * @property {$ItemStack_} item
 */

ItemEvents.rightClicked(e => {
  if(!FEATURE_TRACKER) return;
  if (!isItemTracker(e.item)) return;
  /** @type {$ServerPlayer_} */
  let player = e.player;

  /** @type {TrackerData} */
  let customData = e.item.getCustomData();

  // if(isTrackerBroken(player, customData) == true) return;
  if(isTrackerOnCooldown(player, customData) == true) return;

  if (player.crouching) {
    /** @type {Array<PlayerInventory>} */
    let data = [];
    let slot = 0;
    for (let item of player.inventory.items) {
      data.push({
        slot: slot,
        item: item
      });
      slot++;
    }
    TrackerMenu.OpenMenu(player, "main", data);
    return;
  }

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
    let displayComponent = textDisplayComponent([{ text: "Tracking: ", color: "gray", italic: false }, { text: "No players found", color: "red" }], DEFAULT_COMPASS_LORE);
    let newCompassString = `minecraft:compass[minecraft:enchantment_glint_override=false,lodestone_tracker={target:{dimension:"minecraft:overworld",pos:[I;0,0,0]}},${displayComponent},custom_data=${JSON.stringify(DEFAULT_CUSTOM_DATA)}]`;
    e.server.runCommandSilent(`item replace entity ${player.username} weapon.mainhand with ${newCompassString}`);
    player.playNotifySound("minecraft:block.note_block.basedrum", "master", 1, 1);
    return;
  }

  updateTracker(player, trackingEntity, customData);
})

// /** @type {string[]} */
// let breakingCurrentTrackers = [];

// PlayerEvents.inventoryChanged(e => {
//   let newItem = e.getItem();
//   if(!isItemTracker(newItem)) return;
//   // If its already broken, then dont do anything
//   if(newItem.getCustomData().broken == true) return;

//   // TODO is the issue here?
//   for(const breakingTrackers of breakingCurrentTrackers){
//     if(breakingTrackers === `${e.player.getStringUuid()}:${e.slot}`){
//       print("Tracker is currently breaking")
//       e.exit();
//       return;
//     }
//   }

//   let trackers = 0;
//   let brokenTrackers = 0;
//   for(const item of e.player.inventory.items){
//     if(isItemTracker(item)){
//       trackers++;
//       let customData = item.getCustomData();
//       if(customData && customData.broken == true){
//         brokenTrackers++;
//       }
//       continue;
//     }
//   }

//   // If there are more than 1 trackers and at least 1 is working, then break the current one
//   if(trackers > 1 && trackers - brokenTrackers > 1){
//     print("Breaking new tracker")

//     // Add the tracker to the breaking list
//     breakingCurrentTrackers.push(`${e.player.getStringUuid()}:${e.slot}`);

//     let customData = newItem.getCustomData();
//     customData.broken = true;
//     newItem.setLore([Text.of("Cosmic interference has broken this device.").darkPurple()])
//     newItem.setCustomData(customData);
//     newItem.setItemName(Text.of("Broken Tracker"))

//     // Remove the breaking process
//     e.server.scheduleInTicks(20, () => {
//       breakingCurrentTrackers = breakingCurrentTrackers.filter(tracker => tracker !== `${e.player.getStringUuid()}:${e.slot}`);
//       print("Removed tracker from breaking list")
//     });
//   }
// })

/**
 * Returns in string form the minecraft:compass item with the default tracker data
 * @returns 
 */
function getDefaultTrackerNBTString(){
  let displayComponent = textDisplayComponent([{ text: "Tracking: ", color: "gray", italic: false }, { text: "No players found", color: "red" }], DEFAULT_COMPASS_LORE);
  return `minecraft:compass[max_stack_size=1,custom_data=${JSON.stringify(DEFAULT_CUSTOM_DATA)},${displayComponent}]]`
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event

  event.register(Commands.literal('tracker')
    .requires(s => s.hasPermission(2))
    .executes(c => {
      /** @type {$ServerPlayer_} */
      let player = c.source.player;
      player.giveInHand(getDefaultTrackerNBTString());
      return 1;
    })
  )
})

// Crafting

ServerEvents.recipes(event => {
  event.shaped(
    Item.of(getDefaultTrackerNBTString(), 1),
    [
      ' I ',
      'ISI',
      ' I '
    ],
    {
      I: 'minecraft:iron_ingot',
      S: 'minecraft:diamond',
    }
  )
})

function coloredDimension(dimension){
  switch(dimension){
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

// GUI

let TrackerMenu = new Menu({
  title: "Tracker",
  rows: 5,
  showPlayerInventory: true
}, [{
  name: "main",
  load: function (menu, data) {
    let entities = getTrackableEntities(menu.player);
    let max_rows = 4;
    /** @type {Array<PlayerInventory>} */
    let playerInventory = data;
    for (let i = 0; i < entities.length; i++) {
      let entity = entities[i];
      let row = Math.floor(i / MAX_COLUMNS);
      let column = i % MAX_COLUMNS;

      if (row >= max_rows) {
        break;
      }
      let { unobfuscatedString, obfuscatedString } = obfuscateUsername(entity.username, menu.player.getDistance(entity.position()))
      menu.gui.slot(column, 0, slot => {
        slot.item = createMenuButton({
          title: [
            { text: `${unobfuscatedString}` },
            { text: `${obfuscatedString}`, obfuscated: true },
          ],
          description: [
            [
              {text: `§7Dimension: ${coloredDimension(cleanIDToName(entity.level.dimension))}`},
            ],
            [
              { text: `§7Distance: §f${entity.position().distanceTo(menu.player.position()).toFixed(2)} blocks` },
            ]
          ],
          itemID: "minecraft:player_head",
          // components: {
          //   profile: entity.username
          // }
        });
        slot.leftClicked = e => {
          menu.close();
          // TODO temporary fix until I can figure out how to keep player inventory or access the inventory thats being given back on close
          menu.player.server.scheduleInTicks(10, () => {
            updateTracker(menu.player, entity, setTrackerMode(menu.player, entity));
          });
        }
      })
    }

    /** @type {$ItemStack_} */
    let tracker = null;
    for (let i = 0; i < playerInventory.length; i++) {
      let slot = playerInventory[i];
      let item = slot.item;
      if (isItemTracker(item)) {
        tracker = item;
        break;
      }
    }
    if (tracker) {
      let customData = tracker.getCustomData();
      if(customData.autoTracker == false){
        menu.gui.slot(4, 4, slot => {
          slot.item = createMenuButton({
            title: [
              { text: "Auto Track", color: "green", italic: false }
            ],
            description: [
              [
                { text: "§7Click to track the nearest player", color: "green", italic: false }
              ]
            ],
            itemID: "minecraft:compass",
            components: {
              lodestone_tracker:{target:{dimension:"minecraft:end",pos:[0,0,0]}},
              enchantment_glint_override:false
            }
          });

          slot.leftClicked = e => {
            menu.close();
            menu.player.server.scheduleInTicks(10, () => {
              updateTracker(menu.player, entities[0], setTrackerMode(menu.player, null));
            });
          }
        })
      }
    }

  }
}
]);