let $SpellSlotMap = Java.loadClass(
  "com.hollingsworth.arsnouveau.api.spell.SpellSlotMap"
);
let $SpellCaster = Java.loadClass(
  "com.hollingsworth.arsnouveau.api.spell.SpellCaster"
);

const ARS_SPELLBOOK_IDS = [
  "ars_nouveau:creative_spell_book",
  "ars_nouveau:novice_spell_book",
  "ars_nouveau:apprentice_spell_book",
  "ars_nouveau:archmage_spell_book",
];

/**
 * @typedef {"Form" | "Augment" | "Effect"} SpellPartType
 */

/**
 * @type {Object<number, SpellPartType>}
 */
const TYPE_INDEX = {
  1: "Form",
  5: "Augment",
  10: "Effect",
};

/**
 * Returns the name of the spell part type
 * @param {number} typeIndex
 * @returns {string}
 */
function getSpellPartTypeName(typeIndex) {
  let partName = TYPE_INDEX[typeIndex];
  if (!partName) {
    print(`Unknown type index: ${typeIndex}`);
    return "Unknown";
  }
  return partName;
}

/**
 * @typedef {Object} Spell
 * @property {string} name
 * @property {string} glyphs
 * @property {SpellComponent[]} recipe
 */

/**
 * @typedef {Object} SpellComponent
 * @property {string} name
 * @property {$ItemStack_} item
 * @property {number} typeIndex
 * @property {SpellPartType} type,
 * @property {integer} tier
 */

/**
 * Returns the spell in string
 * @param {$ItemStackKJS_} spellbook
 * @returns {null|Spell}
 */
function getSelectedSpell(spellbook) {
  if (!spellbook || !isItemSpellbook(spellbook)) return null;

  /** @type {$SpellCaster_} */
  let spellcaster = spellbook.componentMap.get("ars_nouveau:spell_caster");
  let selectedSpell = spellcaster.getCurrentSlot();
  for (let i = 0; i < spellcaster.maxSlots; i++) {
    let spell = spellcaster.spells.get(i);
    if (!spell) continue;
    if (selectedSpell === i) {
      let recipe = [];
      for (const spellPart of spell.recipe()) {
        recipe.push({
          name: spellPart.getName(),
          item: spellPart.glyphItem,
          typeIndex: spellPart.getTypeIndex(),
          type: getSpellPartTypeName(spellPart.getTypeIndex()),
          tier: spellPart.getConfigTier().value,
        });
      }
      return {
        name: spell.name(),
        glyphs: spell.displayString,
        recipe: recipe,
      };
    }
  }

  return null;
}

/**
 * Returns true if the item is a spellbook
 * @param {$ItemStack_} item
 * @returns
 */
function isItemSpellbook(item) {
  for (let id of ARS_SPELLBOOK_IDS) {
    if (item.id === id) {
      return true;
    }
  }
  return false;
}

/**
 * Colors and returns text component
 * @param {SpellComponent[]} glyphs
 * @returns {TextComponent[]}
 */
function colorSpellGlyphs(glyphs) {
  /** @type {TextComponent[]} */
  let components = [];
  let currentMultiplier = 1;

  for (let i = 0; i < glyphs.length; i++) {
    let part = glyphs[i];
    let color = getPartTypeColor(part.type);

    if (i > 0 && part.name === glyphs[i - 1].name) {
      currentMultiplier++;
    } else {
      if (currentMultiplier > 1) {
        components.push({
          text: ` x${currentMultiplier}`,
          color: getPartTypeColor(glyphs[i - 1].type),
          italic: false,
        });
        currentMultiplier = 1;
      }
      if (i > 0) {
        components.push({ text: " -> ", color: "gray", italic: false });
      }
      components.push({ text: part.name, color: color, italic: false });
    }
  }

  // Handle the case where the last glyph is part of a repeated sequence
  if (currentMultiplier > 1) {
    components.push({
      text: ` x${currentMultiplier}`,
      color: getPartTypeColor(glyphs[glyphs.length - 1].type),
      italic: false,
    });
  }

  return components;
}

/**
 * Gets the color of the spell part type and returns the color name
 * @param {SpellPartType} type
 */
function getPartTypeColor(type) {
  switch (type) {
    case "Form":
      return "dark_purple";
    case "Augment":
      return "yellow";
    case "Effect":
      return "dark_aqua";
    default:
      return "gray";
  }
}

/**
 * Gets the player's favourite spell
 * @param {Kill[]} kills
 * @returns {favouriteSpellCount}
 */
function getFavouriteSpell(kills) {
  /**
   * @typedef {Object} favouriteSpellCount
   * @property {number} count
   * @property {Spell} spell
   * @property {number} timestamp
   */

  /** @type {favouriteSpellCount[]} */
  let spells = [];
  for (let i = 0; i < kills.length; i++) {
    let kill = kills[i];
    let weapon = Item.of(`${kill.weapon.id}${kill.weapon.components}`);
    if (!isItemSpellbook(weapon)) continue;
    let spell = getSelectedSpell(weapon);
    if (!spell) continue;

    let found = false;
    for (let j = 0; j < spells.length; j++) {
      if (spells[j].spell.glyphs === spell.glyphs) {
        spells[j].count++;
        found = true;
        if (kill.timestamp > spells[j].timestamp) {
          spells[j].timestamp = kill.timestamp;
          spells[j].spell.name = spell.name;
        }
        break;
      }
    }

    if (!found) {
      spells.push({
        count: 1,
        spell: spell,
        timestamp: kill.timestamp,
      });
    }
  }

  if (spells.length === 0) return null;

  let favourite = spells[0];
  for (let i = 1; i < spells.length; i++) {
    if (spells[i].count > favourite.count) {
      favourite = spells[i];
    }
  }

  return favourite;
}
