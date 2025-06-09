// priority: 10

// IN ORDER TO AVOID ABUSE, WHEN OPENING INVENTORIES, PLAYER INV IS SAVED AND RESUMED WHEN NECESSARY
/** @type {Map<string, number} */
let RecentlyHurtPlayers = new Map();

let InventoryCache = new Map();

const GUI_HURT_COOLDOWN = 5 * 1000;

/**
 * @typedef {Object} MenuButton
 * @property {TextComponent[]} title
 * @property {TextComponent[][]} description
 * @property {string} itemID
 * @property {$CompoundTag_} components
 */

/**
 * @param {MenuButton} button
 * @returns {$ItemStack_}
 */
function createMenuButton(button) {
  try {
    let components = [
      textDisplayComponent(button.title, button.description ?? []),
    ];

    if (button.components) {
      for (let key in button.components) {
        if (button.components.hasOwnProperty(key)) {
          if (key === "profile") {
            // Check if the profile name is longer than 16 characters, set it to unknown
            // This is so that testing data can be properly displayed
            let profileName = button.components[key];
            if (profileName.includes(".")) {
              // Do nothing
            } else {
              components.push(`profile="${profileName}"`);
            }
          } else {
            components.push(`${key}=${JSON.stringify(button.components[key])}`);
          }
        }
      }
    }

    let item = Item.of(
      `${button.itemID}[minecraft:attribute_modifiers=[],${components.join(
        ","
      )}]`
    );

    return item;
  } catch (e) {
    print(e);
    console.error(e);
    return Item.of("minecraft:barrier");
  }
}

/**
 * Clears all the items from the GUI
 * @param {$ChestMenuData_} gui
 */
function clearGUI(gui) {
  for (let i = 0; i < gui.rows; i++) {
    for (let j = 0; j < 9; j++) {
      gui.slot(j, i, (slot) => {
        slot.item = Item.of("minecraft:air");
        slot.resetClickHandlers();
      });
    }
  }
}

/**
 * @typedef {Object} MenuConfiguration
 * @property {string} title
 * @property {number} rows
 * @property {boolean} showPlayerInventory
 */

/**
 * @typedef {Object} ButtonConfiguration
 * @property {number} x
 * @property {number} y
 * @property {(event:$ChestMenuClickEvent_) => void} onClick
 */

/**
 * @typedef {Object} MenuPage
 * @property {string} name
 * @property {Array<ButtonConfiguration>} buttons
 * @property {(menu:Menu, data:any) => void} load
 */

/**
 * @param {MenuConfiguration} config
 * @param {Array<MenuPage>} pages
 */
let Menu = function (config, pages) {
  this.config = config;
  /** @type {string} */
  this.currentPage = pages.length > 0 ? pages[0].name : "";
  /** @type {Array<MenuPage>} */
  this.pages = pages;
  /** @type {$ChestMenuData_|null} */
  this.gui = null;
};

Menu.prototype.AddPage = function (page) {
  this.pages.push(page);
};

/**
 * @param {string} page
 * @param {any} data
 */
Menu.prototype.ShowPage = function (page, data) {
  // Find the page
  let pageIndex = this.pages.findIndex((v) => v.name === page);
  if (pageIndex === -1) {
    this.player.tell(`§4Page ${page} not found`);
    return;
  }
  let foundPage = this.pages[pageIndex];
  if (!foundPage) {
    this.player.tell(`§4Page ${page} not found`);
    return;
  }
  clearGUI(this.gui);
  try {
    foundPage.load(this, data);
  } catch (e) {
    this.player.tell(`§4Error loading page: ${e}`);
  }
};

/**
 * Redraws the current page
 */
Menu.prototype.Redraw = function () {
  this.ShowPage(this.currentPage);
};

/**
 * Opens a new Menu to the player
 * @param {$ServerPlayer_} player
 * @param {string|undefined} page
 * @param {string|undefined} data
 */
Menu.prototype.OpenMenu = function (player, page, data) {
  if (isRecentlyHurt(player)) return;

  if (!page && this.pages.length == 0) return;

  if (!page) {
    page = this.pages[0].name;
  }

  player.openChestGUI(Text.of(this.config.title), this.config.rows, (gui) => {
    gui.playerSlots = false;
    gui.player.sendInventoryUpdate();
    this.gui = gui;
    this.player = gui.player;

    InventoryCache.set(`${this.player.uuid}`, this.player.inventory);
    this.ShowPage(page, data);
  });
};

/**
 * Helper function to check if a player has been recently hurt
 * @param {$ServerPlayer_} player
 * @returns
 */
function isRecentlyHurt(player) {
  let recentlyHurt = RecentlyHurtPlayers.get(`${player.uuid}`);
  if (recentlyHurt) {
    let hurtAgo = Date.now() - recentlyHurt;
    if (hurtAgo <= GUI_HURT_COOLDOWN) {
      // player.tell(`You were hurt recently. Please wait ${((GUI_HURT_COOLDOWN - hurtAgo) / 1000).toFixed(1)} seconds...`)
      player.server.runCommandSilent(
        `title ${
          player.username
        } actionbar [{"text":"You were hurt recently. Please wait ${(
          (GUI_HURT_COOLDOWN - hurtAgo) /
          1000
        ).toFixed(1)} seconds...", "color":"dark_red"}]`
      );
      return true;
    }
  }
  return false;
}

/**
 * Closes the GUI
 */
Menu.prototype.close = function () {
  try {
    this.player.closeMenu();
  } catch (e) {
    print(e);
  }
};

EntityEvents.beforeHurt((e) => {
  let player = e.player;
  if (!player) return;

  RecentlyHurtPlayers.set(`${player.uuid}`, Date.now());

  // There isnt a container thats open
  if (player.openInventory.containerId == 0) return;

  // If its a ChestGUIMenu
  if (InventoryCache.get(`${player.uuid}`)) {
    // Add 1 shot protection
    player.closeMenu();

    // Check if the damage will potentially kill the player
    if (player.health - e.damage <= 0.5) {
      player.setHealth(0.5);
      player.playNotifySound("item.totem.use", "ambient", 1, 1);
      e.cancel();
    }
  } else {
    player.closeMenu();
  }
});

PlayerEvents.inventoryClosed((e) => {
  let cachedInventory = `${InventoryCache.get(e.player.uuid)}`;
  if (!cachedInventory) return;

  InventoryCache.delete(`${e.player.uuid}`);
});
