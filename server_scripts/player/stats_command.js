/**
 * @typedef {Object} SortingOption
 * @property {string} display : Display name of the sorting option
 * @property {(a: PlayerStats, b: PlayerStats) => number} sort : Sorting function
 */

/**
 * @type {SortingOption[]}
 */
const COMBAT_LEADERBOARD_SORTING_OPTIONS = [
  { display: "KDR", sort: (a, b) => b.kdr - a.kdr },
  { display: "Kills", sort: (a, b) => b.kills - a.kills },
  { display: "Deaths", sort: (a, b) => b.player_deaths - a.player_deaths },
  {
    display: "Furthest Kill",
    sort: (a, b) => getLongestKill(b) - getLongestKill(a),
  },
  { display: "Killstreak", sort: (a, b) => b.killstreak - a.killstreak },
  {
    display: "Highest Killstreak",
    sort: (a, b) => b.highest_killstreak - a.highest_killstreak,
  },
];
const MAX_COLUMNS = 9;

ServerEvents.commandRegistry((event) => {
  const { commands: Commands, arguments: Arguments } = event;

  if (!FEATURE_COMBAT_STATS) return;

  event.register(
    Commands.literal("cs").executes((c) => {
      KDAMenu.OpenMenu(c.source.player, "main", { sort: 0 });
      return 1;
    })
  );

  event.register(
    Commands.literal("combatstats").executes((c) => {
      KDAMenu.OpenMenu(c.source.player, "main", { sort: 0 });
      return 1;
    })
  );

  event.register(
    Commands.literal("stats").executes((c) => {
      KDAMenu.OpenMenu(c.source.player, "main", { sort: 0 });
      return 1;
    })
  );

  event.register(
    Commands.literal("kills")
      .executes((c) => kills(c.source.player, c.source.player))
      .then(
        Commands.argument("target", Arguments.PLAYER.create(event)).executes(
          (c) => kills(c.source.player, Arguments.PLAYER.getResult(c, "target"))
        )
      )
  );

  event.register(
    Commands.literal("deaths")
      .executes((c) => deaths(c.source.player, c.source.player))
      .then(
        Commands.argument("target", Arguments.PLAYER.create(event)).executes(
          (c) =>
            deaths(c.source.player, Arguments.PLAYER.getResult(c, "target"))
        )
      )
  );

  /**
   * @param {$ServerPlayer_} source
   * @param {$ServerPlayer_} target
   * @returns
   */
  let kills = (source, target) => {
    let player = getPlayerData(target.uuid);
    if (!player) {
      source.tell("§cPlayer not found!");
      return 1;
    }
    KDAMenu.OpenMenu(source, "killHistory", { target: player, sort: 0 });
    return 1;
  };

  /**
   * @param {$ServerPlayer_} source
   * @param {$ServerPlayer_} target
   * @returns
   */
  let deaths = (source, target) => {
    let player = getPlayerData(target.uuid);
    if (!player) {
      source.tell("§cPlayer not found!");
      return 1;
    }
    KDAMenu.OpenMenu(source, "deathHistory", { target: player, sort: 0 });
    return 1;
  };
});

/**
 * Helper function to construct player information in item form
 * @param {PlayerStats} player
 */
function getPlayerItemComponent(player) {
  /** @type {TextComponent} */
  let name = { text: player.name, italic: false, color: "gold" }; // Changed name color for the item itself

  /** @type {TextComponent[]} */
  let lore = [
    // PvP Stats (Kills, Deaths, KDR)
    {
      text: "PvP Stats: ",
      italic: false,
      color: "aqua",
      extra: [
        { text: `${player.kills}`, color: "green" },
        { text: " Kills", color: "gray" },
        { text: " / ", color: "dark_gray" },
        { text: `${player.player_deaths}`, color: "red" },
        { text: " Deaths", color: "gray" },
        { text: " (", color: "dark_gray" },
        { text: `${parseFloat(player.kdr).toFixed(2)}`, color: "light_purple" },
        { text: " KDR", color: "gray" },
        { text: ")", color: "dark_gray" },
      ],
    },
    { text: "" }, // Spacer

    // Killstreaks
    {
      text: "Killstreak: ",
      italic: false,
      color: "gray",
      extra: [
        { text: `${player.killstreak}`, color: "yellow" }, // Current
        { text: " / ", color: "dark_gray" },
        { text: `${player.highest_killstreak}`, color: "gold" }, // Highest (differentiated color)
        { text: " (Highest)", color: "gray" },
      ],
    },
    {
      text: "Furthest Kill: ",
      italic: false,
      color: "gray",
      extra: [{ text: `${getLongestKill(player)} blocks`, color: "yellow" }],
    },
    { text: "" }, // Spacer

    // Combat Relationships
    {
      text: "Nemesis: ",
      italic: false,
      color: "gray",
      // getNemesis() returns a string with pre-applied color codes
      extra: [{ text: `${getNemesis(player)}` }],
    },
    {
      text: "Victim: ",
      italic: false,
      color: "gray",
      // getVictim() returns a string with pre-applied color codes
      extra: [{ text: `${getVictim(player)}` }],
    },
    { text: "" }, // Spacer

    // Preferences
    {
      text: "Favourite Weapon: ",
      italic: false,
      color: "gray",
      // getFavouriteWeapon() returns a string with pre-applied color codes
      extra: [{ text: `${getFavouriteWeapon(player)}` }],
    },
  ];

  let favSpell = getFavouriteSpell(player.kill_history);
  if (favSpell) {
    if (favSpell.spell.name) {
      lore.push(
        {
          text: "Favourite Spell: ",
          italic: false,
          color: "gray",
          extra: [
            { text: favSpell.spell.name, color: "aqua" },
            { text: " (" },
            { text: `${favSpell.count}`, color: "green" },
            { text: " uses)", color: "gray" },
          ],
        },
        {
          text: "  Glyphs: ", // Indented
          italic: false,
          color: "gray",
          // flattenTextComponent(colorSpellGlyphs(...)) returns a string with pre-applied color codes
          extra: [
            {
              text: `${flattenTextComponent(
                colorSpellGlyphs(favSpell.spell.recipe)
              )}`,
            },
          ],
        }
      );
    } else {
      // Fallback if spell name isn't available
      lore.push({
        text: "Favourite Spell: ",
        italic: false,
        color: "gray",
        extra: [
          {
            text: `${favSpell.spell.glyphs}`, // Glyphs in Dark Aqua (or as per flattenTextComponent if used)
            color: "dark_aqua", // Assuming glyphs string doesn't have own colors here
          },
          { text: " (" },
          { text: `${favSpell.count}`, color: "green" },
          { text: " uses)", color: "gray" },
        ],
      });
    }
  }

  return {
    custom_name: name, // For the item's name (e.g., Player Head)
    lore: lore, // Lore for the item tooltip
    profile: player.name, // For player head texture
  };
}

/**
 * Helper function to use the Player's details in Item Form
 * @param {$LivingEntity_} player
 */
function getPlayerChatComponent(player) {
  // Check for entity
  if (!player.player) return { text: player.name.string };

  let playerData = getPlayerData(player.uuid);
  if (!playerData) return { text: player.name.string };

  let playerItem = getPlayerItemComponent(playerData);

  return {
    text: `${player.username}`,
    color: "white", // TODO ranks?
    hoverEvent: {
      action: "show_item",
      contents: {
        id: `player_head`,
        count: 1,
        components: {
          custom_name: JSON.stringify(playerItem.custom_name),
          lore: playerItem.lore.map((lore) => JSON.stringify(lore)),
          profile: playerItem.profile,
        },
      },
    },
  };
}

/**
 * @param {Kill} kill
 * @param {PlayerStats} killer
 * @returns {string[]}
 */
function getKillStats(kill, killer) {
  let itemID = kill.weapon.item.toString();

  let tacz = getTacZItemId(kill.weapon);
  if (tacz) {
    itemID = tacz;
  }

  return [
    `§e${kill.name}`,
    `§7◆ Killed by: §f${killer.name}`,
    `§7◆ Weapon: §a${cleanIDToName(itemID)}`,
    `§7◆ Distance: §e${parseFloat(kill.distance).toFixed(2)} blocks`,
    ``,
    `§7${getRelativeTimePast(kill.timestamp)}`,
  ];
}

/**
 * Returns the player that has killed the player the most.
 * @param {PlayerStats} player
 * @returns {string}
 */
function getNemesis(player) {
  let NONE = "§8None";
  if (!player) return NONE;
  let leaderboard = getLeaderboard();
  if (!leaderboard || leaderboard.length === 0) return NONE;
  let nemesis = leaderboard.reduce(
    (acc, p) => {
      if (
        !p ||
        p.uuid === player.uuid ||
        !p.kill_history ||
        p.kill_history.length == 0
      )
        return acc;
      let kills = p.kill_history.filter(
        (k) => k && k.uuid === player.uuid
      ).length;
      if (kills > acc.kills) {
        return { player: p, kills: kills };
      }
      return acc;
    },
    { player: null, kills: 0 }
  );

  if (!nemesis.player) {
    return NONE;
  } else {
    return `§4${nemesis.player.name} (${nemesis.kills})`;
  }
}

/**
 * Returns the player that the player has killed the most.
 * @param {PlayerStats} player
 * @returns {string}
 */
function getVictim(player) {
  const NONE = "§8None";
  if (!player) return NONE;
  let victims = {};
  for (const kill of player.kill_history) {
    if (!kill) continue;
    let victim = kill.name;
    if (!victims[victim]) {
      victims[victim] = 1;
    } else {
      victims[victim]++;
    }
  }
  let victimArray = [];
  for (let name in victims) {
    if (victims.hasOwnProperty(name)) {
      victimArray.push({ name: name, kills: victims[name] });
    }
  }
  victimArray.sort(function (a, b) {
    return b.kills - a.kills;
  });
  if (victimArray.length === 0) return NONE;
  return "§4" + victimArray[0].name + " (" + victimArray[0].kills + ")";
}

/**
 *
 * @param {PlayerStats} player
 * @returns
 */
function getFavouriteWeapon(player) {
  /**
   * @type {Map<string, number>}
   */
  let weapons = {};
  for (const kill of player.kill_history) {
    let weapon = kill.weapon.id;
    if (weapon) {
      let id = weapon;
      if (kill.tacz_id) {
        id = kill.tacz_id;
      }
      if (!id) continue;
      // Check if the weapon already exists in the map
      let foundWeapon = weapons[id];
      if (!foundWeapon) {
        weapons[id] = 1;
      } else {
        weapons[id] = foundWeapon + 1;
      }
    }
  }
  /**
   * @type {string|null}
   */
  let favouriteWeapon = null;
  let favouriteWeaponKills = 0;
  for (const weapon in weapons) {
    if (weapons[weapon] > favouriteWeaponKills) {
      favouriteWeapon = weapon;
      favouriteWeaponKills = weapons[weapon];
    }
  }

  if (!favouriteWeapon) return "§8None";
  let weaponName = cleanIDToName(favouriteWeapon);
  if (favouriteWeapon.startsWith("tacz")) {
    weaponName = weaponName.toUpperCase();
  }
  return `${weaponName} §f(§a${favouriteWeaponKills}§f)`;
}

/**
 * @param {PlayerStats} player
 */
function getLongestKill(player) {
  let longestKill = 0;
  for (const kill of player.kill_history) {
    if (kill.distance > longestKill) {
      longestKill = kill.distance;
    }
  }
  return parseFloat(longestKill).toFixed(2);
}

let KDAMenu = new Menu(
  {
    title: "Combat Stats",
    rows: 5,
  },
  [
    {
      name: "main",
      load: function (menu, data) {
        let sortInd = data?.sort || 0;
        let leaderboard = getLeaderboard().sort(
          COMBAT_LEADERBOARD_SORTING_OPTIONS[sortInd].sort
        );
        // TODO perhaps make a helper function to paginate
        leaderboard.slice(0, 4 * MAX_COLUMNS).forEach((statPlayer, i) => {
          const row = Math.floor(i / MAX_COLUMNS);
          const column = i % MAX_COLUMNS;

          menu.gui.slot(column, row, (slot) => {
            slot.item = createMenuButton({
              title: `§6${i + 1}) §a${statPlayer.name}`,
              description: getPlayerItemComponent(statPlayer).lore,
              itemID: "minecraft:player_head",
              components: { profile: statPlayer.name },
            });
            slot.leftClicked = () =>
              menu.ShowPage("personal", { target: statPlayer, sort: sortInd });
          });
        });

        let sortItem = Item.of(
          `minecraft:arrow[${textDisplayComponent(
            [
              {
                text: `Sort by Options`,
                color: "green",
                italic: false,
              },
            ],
            COMBAT_LEADERBOARD_SORTING_OPTIONS.map((option, index) => {
              return [
                {
                  text: `${index === sortInd ? "§a⋙ " : "§7"}${option.display}`,
                },
              ];
            })
          )}]`
        );

        menu.gui.slot(4, 4, (slot) => {
          (slot.item = sortItem),
            (slot.leftClicked = (e) => {
              sortInd++;
              if (sortInd >= COMBAT_LEADERBOARD_SORTING_OPTIONS.length) {
                sortInd = 0;
              }
              menu.ShowPage("main", { sort: sortInd });
            }),
            (slot.rightClicked = (e) => {
              sortInd--;
              if (sortInd < 0) {
                sortInd = COMBAT_LEADERBOARD_SORTING_OPTIONS.length - 1;
              }
              menu.ShowPage("main", { sort: sortInd });
            });
        });
      },
    },
    {
      name: "personal",
      load: function (menu, data) {
        if (!data.target) return;
        let statPlayer = data.target;

        menu.gui.slot(4, 2, (slot) => {
          slot.item = createMenuButton({
            title: `§a${statPlayer.name}`,
            description: getPlayerItemComponent(statPlayer).lore,
            itemID: "minecraft:player_head",
            components: {
              profile: statPlayer.name,
            },
          });
        });

        menu.gui.slot(0, 4, (slot) => {
          (slot.item = createMenuButton({
            title: [{ text: "Back", italic: false }],
            description: ["Return to the leaderboard"],
            itemID: "minecraft:oak_sign",
          })),
            (slot.leftClicked = (e) => {
              menu.ShowPage("main", { sort: data.sort });
            });
        });

        menu.gui.slot(0, 0, (slot) => {
          (slot.item = createMenuButton({
            title: [{ text: "Kill History", italic: false, color: "yellow" }],
            description: ["View kill history"],
            itemID: "minecraft:iron_sword",
          })),
            (slot.leftClicked = (e) => {
              menu.ShowPage("killHistory", {
                target: statPlayer,
                sort: data.sort,
                viewType: "heads",
              });
            });
        });
        menu.gui.slot(1, 0, (slot) => {
          (slot.item = createMenuButton({
            title: [{ text: "Death History", italic: false, color: "red" }],
            description: ["View death history"],
            itemID: "minecraft:skeleton_skull",
          })),
            (slot.leftClicked = (e) => {
              menu.ShowPage("deathHistory", {
                target: statPlayer,
                sort: data.sort,
                viewType: "heads",
              });
            });
        });
        // TODO
        // menu.gui.slot(2, 0, (slot) => {
        //   (slot.item = createMenuButton({
        //     title: [{ text: "Advancements", italic: false, color: "yellow" }],
        //     description: ["View advancements"],
        //     itemID: "minecraft:book",
        //   })),
        //     (slot.leftClicked = (e) => {
        //       menu.ShowPage("advancements", {
        //         target: statPlayer,
        //       });
        //     });
        // });
      },
    },
    {
      name: "killHistory",
      load: function (menu, data) {
        if (!data.target) return;
        /**
         * @type {PlayerStats}
         */
        let statPlayer = data.target;
        let viewType = data?.viewType || "heads";
        let max_rows = 4;

        let currentPage = data?.page || 0;
        let killsPerPage = MAX_COLUMNS * max_rows;

        let pages = Math.ceil(statPlayer.kill_history.length / killsPerPage);

        statPlayer.kill_history.sort((a, b) => b.timestamp - a.timestamp);
        let killHistory = statPlayer.kill_history;
        // TODO improve pagination
        if (killHistory && killHistory.length != 0) {
          for (let i = 0; i < killHistory.length; i++) {
            // Skip entries from previous pages
            if (i < currentPage * killsPerPage) {
              continue;
            }
            // Break if the entry belongs to a page after the current page
            if (i >= (currentPage + 1) * killsPerPage) {
              break;
            }
            let kill = killHistory[i];
            let row = Math.floor((i % killsPerPage) / MAX_COLUMNS);
            let column = (i % killsPerPage) % MAX_COLUMNS;

            if (row >= max_rows) {
              break;
            }

            menu.gui.slot(column, row, (slot) => {
              slot.item =
                viewType == "heads"
                  ? getKillIcon(kill)
                  : Item.of(
                      `${kill.weapon.id}${
                        kill.weapon.components
                          ? `${kill.weapon.components}`
                          : ""
                      }`
                    );
            });
          }
        }

        menu.gui.slot(0, 4, (slot) => {
          (slot.item = createMenuButton({
            title: [{ text: "Back", italic: false }],
            description: ["Return to player stats"],
            itemID: "minecraft:oak_sign",
          })),
            (slot.leftClicked = (e) => {
              menu.ShowPage("personal", {
                target: statPlayer,
                sort: data.sort,
              });
            });
        });

        menu.gui.slot(4, 4, (slot) => {
          (slot.item = createMenuButton({
            title: "§aKill Icon",
            itemID: "minecraft:arrow",
            description:
              viewType === "heads"
                ? ["§a⋙ Heads", "§7Weapons"]
                : ["§7Heads", "§a⋙ Weapons"],
          })),
            (slot.leftClicked = (e) => {
              viewType = viewType === "heads" ? "weapons" : "heads";
              menu.ShowPage("killHistory", {
                target: statPlayer,
                sort: data.sort,
                viewType: viewType,
                page: currentPage,
              });
            });
        });

        menu.gui.slot(5, 4, (slot) => {
          (slot.item = createMenuButton({
            title: `§aNext Page (${currentPage + 1}/${pages == 0 ? 1 : pages})`,
            itemID: "minecraft:arrow",
            description: ["View next page of kills"],
          })),
            (slot.leftClicked = (e) => {
              currentPage++;
              if (currentPage >= pages) {
                currentPage = 0;
              }
              menu.ShowPage("killHistory", {
                target: statPlayer,
                sort: data.sort,
                viewType: viewType,
                page: currentPage,
              });
            });
        });

        menu.gui.slot(3, 4, (slot) => {
          (slot.item = createMenuButton({
            title: `§aPrevious Page (${currentPage + 1}/${
              pages == 0 ? 1 : pages
            })`,
            itemID: "minecraft:arrow",
            description: ["View previous page of kills"],
          })),
            (slot.leftClicked = (e) => {
              currentPage--;
              if (currentPage < 0) {
                currentPage = pages - 1;
              }
              menu.ShowPage("killHistory", {
                target: statPlayer,
                sort: data.sort,
                viewType: viewType,
                page: currentPage,
              });
            });
        });
      },
    },
    {
      name: "deathHistory",
      load: function (menu, data) {
        if (!data.target) return;
        /**
         * @type {PlayerStats}
         */
        let statPlayer = data.target;
        let max_rows = 4;

        let currentPage = data?.page || 0;
        let deathsPerPage = MAX_COLUMNS * max_rows;

        let pages = Math.ceil(statPlayer.death_history.length / deathsPerPage);

        statPlayer.death_history.sort((a, b) => b.timestamp - a.timestamp);
        let deathHistory = statPlayer.death_history;

        if (deathHistory && deathHistory.length != 0) {
          for (let i = 0; i < deathHistory.length; i++) {
            // Skip entries from previous pages
            if (i < currentPage * deathsPerPage) {
              continue;
            }
            // Break if the entry belongs to a page after the current page
            if (i >= (currentPage + 1) * deathsPerPage) {
              break;
            }
            let death = deathHistory[i];
            let row = Math.floor((i % deathsPerPage) / MAX_COLUMNS);
            let column = (i % deathsPerPage) % MAX_COLUMNS;

            if (row >= max_rows) {
              break;
            }

            menu.gui.slot(column, row, (slot) => {
              slot.item = getDeathIcon(death);
            });
          }
        }

        menu.gui.slot(0, 4, (slot) => {
          (slot.item = createMenuButton({
            title: [{ text: "Back", italic: false }],
            description: ["Return to player stats"],
            itemID: "minecraft:oak_sign",
          })),
            (slot.leftClicked = (e) => {
              menu.ShowPage("personal", {
                target: statPlayer,
                sort: data.sort,
              });
            });
        });

        // menu.gui.slot(4, 4, slot => {
        //   slot.item = createMenuButton({
        //     title: "§aKill Icon",
        //     itemID: "minecraft:arrow",
        //     description: viewType === "heads" ? ["§a⋙ Heads", "§7Weapons"] : ["§7Heads", "§a⋙ Weapons"]
        //   }),
        //     slot.leftClicked = e => {
        //       viewType = viewType === "heads" ? "weapons" : "heads";
        //       menu.ShowPage("killHistory", { target: statPlayer, sort: data.sort, viewType: viewType, page:currentPage });
        //     }
        // })

        menu.gui.slot(5, 4, (slot) => {
          (slot.item = createMenuButton({
            title: `§aNext Page (${currentPage + 1}/${pages == 0 ? 1 : pages})`,
            itemID: "minecraft:arrow",
            description: ["View next page of deaths"],
          })),
            (slot.leftClicked = (e) => {
              currentPage++;
              if (currentPage >= pages) {
                currentPage = 0;
              }
              menu.ShowPage("deathHistory", {
                target: statPlayer,
                sort: data.sort,
                viewType: viewType,
                page: currentPage,
              });
            });
        });

        menu.gui.slot(3, 4, (slot) => {
          (slot.item = createMenuButton({
            title: `§aPrevious Page (${currentPage + 1}/${
              pages == 0 ? 1 : pages
            })`,
            itemID: "minecraft:arrow",
            description: ["View previous page of deaths"],
          })),
            (slot.leftClicked = (e) => {
              currentPage--;
              if (currentPage < 0) {
                currentPage = pages - 1;
              }
              menu.ShowPage("deathHistory", {
                target: statPlayer,
                sort: data.sort,
                viewType: viewType,
                page: currentPage,
              });
            });
        });
      },
    },
    {
      name: "advancements",
      load: advancementMenu,
    },
  ]
);
