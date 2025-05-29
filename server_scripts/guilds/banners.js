// Cache for Guild Banners

/** @type {Map<string, $ItemStack_>} */
let GUILD_BANNER_CACHE = new Map();

// TODO save in file, rather than just in memory

ServerEvents.commandRegistry((event) => {
  const { commands: Commands, arguments: Arguments } = event;
  event.register(
    Commands.literal("banner")
      .then(
        Commands.literal("save").executes((c) => {
          /** @type {$ServerPlayer_} */
          let player = c.source.getPlayer();
          let guild = getPlayerGuild(player);
          if (!guild || !guild.owner.id === c.source.getPlayer().uuid) {
            player.tell("You need to be a guild owner to use this command!");
            return 1;
          }

          let heldItem = player.inventory.getStackInSlot(
            player.getSelectedSlot()
          );

          if (heldItem.id === "minecraft:air") {
            player.tell("You need to be holding a banner!");
            return 1;
          }

          let banner = false;

          for (const tag of heldItem.tags) {
            if (tag === "minecraft:banners") {
              banner = true;
              break;
            }
          }

          if (!banner) {
            player.tell("You need to be holding a banner!");
            return 1;
          }

          GUILD_BANNER_CACHE.set(guild.id, heldItem);
          player.tell(
            "Banner has been saved to your Guild! You can now grant it to yourself with /banner get <amount>"
          );

          return 1;
        })
      )
      .then(
        Commands.literal("get").then(
          Commands.argument(
            "amount",
            Arguments.INTEGER.create(event)
          ).executes((c) => giveBanner(c.source.getPlayer(), Arguments.INTEGER.getResult(c, "amount")))
        ).executes((c)=> giveBanner(c.source.getPlayer(), 16))
      )
  );
});

/**
 * Gives the player their guild banner
 * @param {$ServerPlayer_} player 
 * @param {number} amount 
 * @returns 
 */
function giveBanner(player, amount) {
  let guild = getPlayerGuild(player);
  if (!guild) {
    player.tell("You need to be in a guild to use this command!");
    return 1;
  }

  let banner = GUILD_BANNER_CACHE.get(guild.id);
  if (!banner) {
    player.tell("A banner hasnt been set for your Guild yet. Urge your Guild Owner to run /banner save whilst holding a banner.");
    return 1;
  }

  if(amount > 16) amount = 16;
  if(amount <= 0) amount = 1;

  banner.count = amount;

  player.give(banner)
  return 1;
}