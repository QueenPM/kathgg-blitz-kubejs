const BANNED_ITEMS = [
  // { id: "minecraft:elytra", display: "Elytra" },
  // { id: "tacz:modern_kinetic_gun", display: "RPG", nbt: { GunId:"tacz:rpg7"}}
];

PlayerEvents.inventoryChanged((event) => {
  if (!FEATURE_BANNED_ITEMS) return;

  let item = event.getItem();
  let player = event.server.getPlayer(event.player.name.getString());
  if (!player) return;
  let foundBannedItem = BANNED_ITEMS.find(
    (bannedItem) => bannedItem.id === item.id
  );
  if (!foundBannedItem) return;

  // If there is no NBT specified
  if (foundBannedItem.nbt) {
    let nbt = item.getNbt();
    if (!nbt) return;
    if (nbt.getString("GunId") != foundBannedItem.nbt.GunId) return;
  }
  event.server.tell(
    `§4${player.name.getString()}, you are not allowed to have §f${
      foundBannedItem.display
    }§4!`
  );
});

ServerEvents.commandRegistry((event) => {
  const { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal("banneditems").executes((c) => {
      /**
       * @type {$Player}
       */
      let player = c.source.player;
      if (BANNED_ITEMS.length === 0) {
        player.tell("§8There are no banned items on this server!");
      } else {
        player.tell("§8Here are the §4Banned Items§8 on this server:");
        for (const bannedItem of BANNED_ITEMS) {
          player.tell(`§4- §f${bannedItem.display}`);
        }
      }
      return 1;
    })
  );
});
