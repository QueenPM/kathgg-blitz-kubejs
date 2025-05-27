// priority: 10

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
      textDisplayComponent(button.title, button.description ?? [])
    ];
    
    
    if (button.components) {
      for (let key in button.components) {
        if (button.components.hasOwnProperty(key)) {
          if(key === "profile"){
            // Check if the profile name is longer than 16 characters, set it to unknown
            // This is so that testing data can be properly displayed
            let profileName = button.components[key];
            if(profileName.includes(".")){
              // Do nothing
            }else{
              components.push(`profile="${profileName}"`);
            }
          }else{
            components.push(`${key}=${JSON.stringify(button.components[key])}`);
          }
        }
      }
    }

    let item = Item.of(`${button.itemID}[minecraft:attribute_modifiers=[],${components.join(",")}]`);
    
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
      gui.slot(j, i, slot => {
        slot.item = Item.of("minecraft:air");
        slot.resetClickHandlers();
      })
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
  this.pages = pages
  /** @type {$ChestMenuData_|null} */
  this.gui = null;
}

Menu.prototype.AddPage = function (page) {
  this.pages.push(page);
}

/**
 * @param {string} page 
 * @param {any} data
 */
Menu.prototype.ShowPage = function (page, data) {
  // Find the page
  let pageIndex = this.pages.findIndex(v => v.name === page);
  if (pageIndex === -1) {
    this.player.tell(`§4Page ${page} not found`);
    return
  }
  let foundPage = this.pages[pageIndex];
  if (!foundPage) {
    this.player.tell(`§4Page ${page} not found`);
    return
  }
  clearGUI(this.gui);
  try {
    foundPage.load(this, data);
  } catch (e) {
    this.player.tell(`§4Error loading page: ${e}`);
  }
}

/**
 * Redraws the current page
 */
Menu.prototype.Redraw = function () {
  this.ShowPage(this.currentPage);
}

/**
 * Opens a new Menu to the player
 * @param {$ServerPlayer_} player
 * @param {string|undefined} page
 * @param {string|undefined} data
 */
Menu.prototype.OpenMenu = function (player, page, data) {
  if (!page && this.pages.length == 0) return;

  if (!page) {
    page = this.pages[0].name;
  }

  player.openChestGUI(Text.of(this.config.title), this.config.rows, gui => {
    gui.playerSlots = this.config.showPlayerInventory || false;
    this.gui = gui;
    this.player = gui.player;
    this.ShowPage(page, data);
  });
}

/**
 * Closes the GUI
 */
Menu.prototype.close = function () {
  try{
    this.player.closeMenu()
  }catch(e){
    print(e)
  }
}