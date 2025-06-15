const $EntityType = Java.loadClass('net.minecraft.world.entity.EntityType');
const $SpawnEggItem = Java.loadClass('net.minecraft.world.item.SpawnEggItem');

/**
 * Returns the ItemStack of the player's head.
 * @param {string} playerName
 * @returns {$ItemStack_}
 */
function getPlayerHead(playerName) {
  return Item.of("minecraft:player_head", `{SkullOwner:"${playerName}"}`);
}

/**
 * Returns a number with commas in string format.
 * @param {number} x
 * @returns {string}
 */
function numbersWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Capitalises the first letter of each word in a string
 * @param string} string
 * @returns {string}
 */
function capitalizeFirstLetters(string) {
  return string
    .split(" ")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");
}

/**
 * Helper function to convert milliseconds to a human readable time format
 * @param ms
 * @returns
 */
function timeToString(ms) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let text = "";
  if (days > 0) text += `${days}d `;
  if (hours > 0) text += `${hours % 24}h `;
  if (minutes > 0) text += `${minutes % 60}m `;

  text += `${seconds % 60}s`;
  return text;
}

/**
 * Returns a string with the relative time to timestamp.
 * @param {number} timestamp
 * @returns {string}
 */
function getRelativeTimePast(timestamp) {
  let time = Date.now() - timestamp;
  let seconds = Math.floor(time / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let months = Math.floor(days / 30);
  let years = Math.floor(months / 12);

  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (seconds > 0) return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
  return "Just now";
}

/**
 * Returns a string with the relative time to timestamp.
 * @param {number} timestamp
 * @returns {string}
 */
function getRelativeTimeFuture(timestamp) {
  let time = timestamp - Date.now();
  let seconds = Math.floor(time / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let months = Math.floor(days / 30);
  let years = Math.floor(months / 12);

  if (years > 0) return `in ${years} year${years > 1 ? "s" : ""}`;
  if (months > 0) return `in ${months} month${months > 1 ? "s" : ""}`;
  if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `in ${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? "s" : ""}`;
  if (seconds > 0) return `in ${seconds} second${seconds > 1 ? "s" : ""}`;
  return "In a moment";
}

/**
 * Turns an item ID into a human-readable name.
 * @param {string} string
 * @returns {string}
 */
function cleanIDToName(string) {
  if (typeof string !== "string") {
    string = string.toString();
  }
  return string
    .split(":")
    .slice(1)
    .join("")
    .replace(/_/g, " ")
    .split(" ")
    .map((s) => s.substring(0, 1).toUpperCase() + s.slice(1))
    .join(" ");
}

/**
 * Turns an item name into a potential ID
 * @param {string} string
 * @returns {string}
 */
function nameToId(string) {
  if (typeof string !== "string") {
    string = string.toString();
  }
  return string.replace(/ /g, "_").toLowerCase();
}

/** @type {$MinecraftServer_|null} */
let server = null;

/**
 * Sends a global message to all players. Used to debug.
 * @param {string} text
 * @returns
 */
function print(text) {
  if (!server) return;
  server.tell(text);
}

ServerEvents.tick((e) => {
  if (server) return;
  server = e.server;
  console.log("SERVER LOADEDDDDDDDDDDDDDDDDDDDD");
});
/**
 * Converts an ItemStack to a chat component to be used in tellraw
 * @param {$ItemStack_} item
 * @returns {string}
 */
function itemToChatComponent(item) {
  if (item.id === "minecraft:air") return null;
  return item
    .toJson()
    .toString()
    .replace('"item"', '"id"')
    .replace('"count"', '"Count"')
    .replace("nbt", "tag");
}

/**
 * @typedef {Object} TextComponent
 * @property {string} text
 * @property {string} color
 * @property {boolean} italic
 * @property {boolean} bold
 * @property {boolean} underlined
 * @property {boolean} strikethrough
 * @property {boolean} obfuscated
 */

/**
 * Returns a JSON string to be used in the component array
 * @param {TextComponent[]} name
 * @param {TextComponent[][]} lore
 */
function textDisplayComponent(name, lore) {
  let components = [];

  if (name && name.length > 0) {
    components.push(`custom_name='["",${JSON.stringify(name)}]'`);
  }

  if (lore && lore.length > 0) {
    let loreLines = lore.map((line) => `'["",${JSON.stringify(line)}]'`);
    components.push(`lore=[${loreLines.join(",")}]`);
  }

  return components.join(",");
}

/**
 * Combines two objects into a new object (like {...a, ...b}).
 * @param {Object} a
 * @param {Object} b
 * @returns {Object}
 */
function combineObjects(a, b) {
  var result = {};
  for (var key in a) {
    if (Object.prototype.hasOwnProperty.call(a, key)) {
      result[key] = a[key];
    }
  }
  for (var key in b) {
    if (Object.prototype.hasOwnProperty.call(b, key)) {
      result[key] = b[key];
    }
  }
  return result;
}

const $ChatFormatting = Java.loadClass("net.minecraft.ChatFormatting");

/**
 * Flattens an Array of Text Component into a string and adds color codes
 * @param {TextComponent[]} textComponents
 * @returns {string}
 */
function flattenTextComponent(textComponents) {
  let resultString = "";
  for (const component of textComponents) {
    let formattingCode = "";
    if (component.color) {
      try {
        // Convert color name to uppercase to match ChatFormatting enum names
        let colorEnumName = component.color.toUpperCase();
        let chatFormatting = $ChatFormatting[colorEnumName];
        if (chatFormatting) {
          formattingCode = chatFormatting.toString();
        }
      } catch (e) {
        console.error(`KJS: Error parsing color '${component.color}': ${e}`);
        // Fallback or default color can be handled here if needed
      }
    }

    // Append formatting codes for boolean styles if they are true
    if (component.bold) formattingCode += $ChatFormatting.BOLD.toString();
    if (component.italic) formattingCode += $ChatFormatting.ITALIC.toString();
    if (component.underlined)
      formattingCode += $ChatFormatting.UNDERLINE.toString();
    if (component.strikethrough)
      formattingCode += $ChatFormatting.STRIKETHROUGH.toString();
    if (component.obfuscated)
      formattingCode += $ChatFormatting.OBFUSCATED.toString();

    resultString += formattingCode + component.text;

    // Add reset code if there was any formatting to prevent color bleed to next component
    // unless the next component also defines a color.
    // This is a common practice but might need adjustment based on how you build your components.
    if (formattingCode) {
      // Check if it's not the last component or if the next component doesn't have its own color
      let currentIndex = textComponents.indexOf(component);
      if (currentIndex < textComponents.length - 1) {
        let nextComponent = textComponents[currentIndex + 1];
        if (
          !nextComponent.color &&
          (component.color ||
            component.bold ||
            component.italic ||
            component.underlined ||
            component.strikethrough ||
            component.obfuscated)
        ) {
          resultString += $ChatFormatting.RESET.toString();
        }
      } else {
        // For the last component, if it had formatting, reset at the very end.
        resultString += $ChatFormatting.RESET.toString();
      }
    }
  }
  return resultString;
}

/**
 * Gets the item ID of the spawn egg for a given entity.
 * @param {$LivingEntity_} entity The entity for which to find the spawn egg.
 * @returns {string|null} The item ID of the spawn egg (e.g., "minecraft:pig_spawn_egg"), or null if not found.
 */
function getSpawnEggIdForEntity(entity) {
  if (!entity) return null;

  const entityTypeId = entity.getType();

  let spawnEggId = null;
  const entityTypeOptional = $EntityType.byString(entityTypeId);

  if (entityTypeOptional.isPresent()) {
    const type = entityTypeOptional.get();
    const spawnEggItemInstance = $SpawnEggItem.byId(type);

    if (spawnEggItemInstance) {
      spawnEggId = Item.of(spawnEggItemInstance).id;
    }
  }

  return spawnEggId;
}