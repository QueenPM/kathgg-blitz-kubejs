const KITS_PATH = "kubejs/data/kits.json";

/**
 * @typedef {Object} Kit
 * @property {string} name : The name of the kit
 * @property {string} icon : The icon of the Kit
 * @property {KitItem[]} items : The items in the kit
 */

/**
 * @typedef {Object} KitItem
 * @property {string} item : The item string
 * @property {number} slot : The slot
 */

/** @type {Record<string, Kit>|null} */
let kits = null;


/**
 * Gets a kit's description in the form of TextComponent
 * @param {Kit} kit 
 * @return {TextComponent[][]}
 */
function getKitDescription(kit) {
  /**
   * @type {TextComponent[][]}
   */
  let description = [];
  for (const item of kit.items) {
    let itemStack = Item.of(item.item);
    let displayName = itemStack.getDisplayName().getString().slice(1, -1).replace("'", "");
    let count = itemStack.getCount();

    let text = `§7${count}x ${displayName}`;

    description.push([
      {
        text: text,
      }
    ])
  }

  description.push(
    [{ text: "" }],
    [{
      text: `Left-click to view`,
      italic: true,
      color: "dark_purple"
    }],
    [{
      text: `Right-click to select`,
      italic: true,
      color: "green"
    }]
  )

  return description;
}

/**
 * Saves the kits to the kits.json file
 */
function saveKit() {
  JsonIO.write(KITS_PATH, kits);
}

/**
 * Loads the kits into memory from the kits.json file
 */
function loadKits() {
  kits = JsonIO.read(KITS_PATH);
  if (!kits) {
    JsonIO.write(KITS_PATH, "{}");
  }
  kits = JsonIO.read(KITS_PATH);
}

/**
 * Returns a kit by name
 * @param {string} name 
 */
function findKit(name) {
  if (!kits) loadKits();
  return kits[name.toLowerCase()];
}

/**
 * Returns an iterable array of kits
 * @returns {Kit[]}
 */
function getKits() {
  if (!kits) loadKits();
  return Object.values(kits);
}

/**
   * 
   * @param {$Player_} player 
   * @param {string} name 
   */
function createKit(player, name) {
  if (!name) {
    player.tell("Please provide a name")
    return 1
  }
  if (!kits) loadKits();

  let overwritten = findKit(name);

  let inventory = player.getInventory();
  let selectedItem = player.mainHandItem;
  /**
   * @type {KitItem[]}
   */
  let items = [];

  for (let i = 0; i < inventory.slots; i++) {
    let item = inventory.getStackInSlot(i);
    if (item.isEmpty()) continue;
    let itemString = item.toItemString().slice(1, -1);
    items.push({
      item: itemString,
      slot: i
    })
  }

  if (items.length == 0) {
    player.tell("Please provide items to save")
    return 1
  }

  kits[name.toLowerCase()] = {
    name: name,
    icon: selectedItem.isEmpty() ? items[0].item : selectedItem.toItemString().slice(1, -1),
    items: items
  };
  saveKit();
  if (overwritten) {
    player.tell(`Overwritten kit ${name}`)
  } else {
    player.tell(`Created kit ${name}`)
  }
  return 1;
}

/**
 * Gives a player a certain kit
 * @param {$Player_} player 
 * @param {string} name 
 */
function loadKit(player, name) {
  if (!name) {
    player.tell("Please provide a name")
    return 1
  }
  if (!kits) loadKits();
  let kit = findKit(name);
  if (!kit) {
    player.tell(`Kit ${name} not found`)
    return 1
  }

  // Delete the player's inventory
  player.inventory.clear();
  let inventory = player.getInventory();

  // Load the kit into inventory
  for (let i = 0; i < kit.items.length; i++) {
    let kitItem = kit.items[i];
    let item = kitItem.item
    inventory.setStackInSlot(kitItem.slot, Item.of(item));
  }
  return 1
}

/**
 * Deletes a kit by name
 * @param {$Player} player 
 * @param {string} name 
 * @returns 
 */
function deleteKit(player, name) {
  if (!name) {
    player.tell("Please provide a name")
    return 1
  }
  if (!kits) loadKits();
  let kit = findKit(name);
  if (!kit) {
    player.tell(`Kit ${name} not found`)
    return 1
  }
  let newKits = {};
  for (let key in kits) {
    if (key.toLowerCase() !== name.toLowerCase()) {
      newKits[key] = kits[key];
    }
  }
  kits = newKits;
  saveKit();
  player.tell(`Deleted kit ${name}`)
  return 1
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event

  if(!FEATURE_KITS) return;

  event.register(Commands.literal('kit')
    .executes(c => noCommand(c.source.player, c.source.player))
    .then(Commands.literal('save')
      .requires(s => s.hasPermission(2))
      .then(Commands.argument('name', Arguments.STRING.create(event))
        .executes(c => createKit(c.source.player, Arguments.STRING.getResult(c, 'name'))))
    )
    .then(Commands.literal('load')
      .then(Commands.argument('name', Arguments.STRING.create(event))
        .executes(c => loadKit(c.source.player, Arguments.STRING.getResult(c, 'name'))))
    )
  )

  event.register(Commands.literal('kits')
    .executes(c => {
      KitMenu.OpenMenu(c.source.player, "main");
      return 1;
    }))

  /**
   * 
   * @param {$Player} player 
   */
  function noCommand(player) {
    player.tell("No usage")
  }
})


let KitMenu = new Menu({
  title: "Kits",
  rows: 5
}, [{
  name: "main",
  load: function (menu, data) {
    let availableKits = getKits().sort((a, b) => a.name.localeCompare(b.name));
    availableKits.slice(0, 4 * MAX_COLUMNS).forEach((kit, i) => {
      const row = Math.floor(i / MAX_COLUMNS);
      const column = i % MAX_COLUMNS;

      menu.gui.slot(column, row, slot => {
        slot.item = createMenuButton({
          title: `§a${kit.name}`,
          description: getKitDescription(kit),
          itemID: Item.of(kit.icon).getId()
        });
        slot.rightClicked = () => {
          menu.close();
          menu.player.server.scheduleInTicks(2, () => {
            loadKit(menu.player, kit.name);
          });
        };
        slot.leftClicked = () => {
          menu.ShowPage("kit", { kit: kit.name, page: 1 });
        }
      });
    });

    // let sortItem = Item.of(`minecraft:arrow[${textDisplayComponent(
    //   [
    //     {
    //       text: `Sort by Options`,
    //       color: "green",
    //       italic: false
    //     }
    //   ],
    //   COMBAT_LEADERBOARD_SORTING_OPTIONS.map((option, index) => {
    //     return [{ text: `${index === sortInd ? "§a⋙ " : "§7"}${option.display}` }]
    //   })
    // )}]`);

    // menu.gui.slot(4, 4, slot => {
    //   slot.item = sortItem,
    //     slot.leftClicked = e => {
    //       sortInd++;
    //       if (sortInd >= COMBAT_LEADERBOARD_SORTING_OPTIONS.length) {
    //         sortInd = 0;
    //       }
    //       menu.ShowPage("main", { sort: sortInd });
    //     },
    //     slot.rightClicked = e => {
    //       sortInd--;
    //       if (sortInd < 0) {
    //         sortInd = COMBAT_LEADERBOARD_SORTING_OPTIONS.length - 1;
    //       }
    //       menu.ShowPage("main", { sort: sortInd });
    //     }
    // })
  }
}, {
  name: "kit",
  load: function (menu, data) {
    let selectedKit = data?.kit;

    let confirmDelete = data?.confirmDelete;

    menu.gui.slot(0, 4, slot => {
      slot.item = createMenuButton({
        title: [{ text: "Back", italic: false }],
        description: ["Return to the kits"],
        itemID: "minecraft:oak_sign"
      }),
        slot.leftClicked = e => {
          menu.ShowPage("main");
        }
    })

    const MAX_ROWS = 3;
    let kit = findKit(selectedKit);

    let kitPage = data?.page;
    let maxPages = Math.ceil(kit.items.length / (MAX_COLUMNS * MAX_ROWS));
    let itemsPerPage = MAX_COLUMNS * MAX_ROWS;


    let start = (kitPage - 1) * itemsPerPage;
    let end = Math.min(start + itemsPerPage, kit.items.length);

    for (let i = start; i < end; i++) {
      let row = Math.floor((i - start) / MAX_COLUMNS);
      let column = (i - start) % MAX_COLUMNS;

      let item = Item.of(kit.items[i].item);
      menu.gui.slot(column, row, slot => {
        slot.item = item;
      });
    }

    if (maxPages > 1) {
      menu.gui.slot(4, 3, slot => {
        slot.item = createMenuButton({
          title: [{ text: "Page", italic: false }],
          description: [`Page ${kitPage} of ${maxPages}`],
          itemID: "minecraft:arrow"
        }),
          slot.leftClicked = e => {
            if (kitPage === maxPages) {
              kitPage = 0;
            }
            menu.ShowPage("kit", { kit: selectedKit, page: kitPage + 1 });
          }
      })
    }


    menu.gui.slot(4, 4, slot => {
      slot.item = createMenuButton({
        title: [{ text: "Select", italic: false, color: "green" }],
        description: [{text:"Select the Kit", italic: false, color:"gray"}],
        itemID: "minecraft:emerald_block"
      }),
        slot.leftClicked = e => {
          menu.close();
          menu.player.server.scheduleInTicks(2, () => {
            loadKit(menu.player, kit.name);
          });
        }
    })

    if (menu.player.op) {
      menu.gui.slot(8, 4, slot => {
        slot.item = createMenuButton({
          title: [{ text: confirmDelete ? "Confirm Deletion" : "Delete", italic: false, color: "red" }],
          description: [{text:confirmDelete? "Are you sure you want to delete this kit?" : "Delete the Kit", italic: false, color:"gray"}],
          itemID: "minecraft:tnt"
        }),
          slot.leftClicked = e => {
            if(confirmDelete){
              deleteKit(menu.player, selectedKit);
              menu.ShowPage("main");
            }else{
              menu.ShowPage("kit", { kit: selectedKit, page: 1, confirmDelete: true });
            }
          }
      })
    }
  }
}])