// Cache for Guild Banners

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

          let patterns = [];
          // Remove the tooltips. Create a new item
          /** @type {$Tag} */
          let components = heldItem.toNBT()["components"];
          if (components) {
            let parsedPatterns = components["minecraft:banner_patterns"];
            if (parsedPatterns) {
              console.log(parsedPatterns);
              for (const pattern of parsedPatterns) {
                console.log(JSON.stringify(pattern.get("pattern")));
                patterns.push({
                  pattern: pattern.get("pattern").getAsString(),
                  color: pattern.get("color").getAsString(),
                });
              }
            }
          }

          console.log(patterns);
          console.log(JSON.stringify(patterns));

          guild.banner = {
            id: heldItem.id,
            count: 1,
            components: {
              "minecraft:hide_additional_tooltip": {},
              "minecraft:banner_patterns": patterns,
            },
          };

          saveGuildData(guild);

          player.tell(
            "Banner has been saved to your Guild! You can now grant it to yourself with /banner get <amount>"
          );

          return 1;
        })
      )
      .then(
        Commands.literal("get")
          .then(
            Commands.argument(
              "amount",
              Arguments.INTEGER.create(event)
            ).executes((c) =>
              giveBanner(
                c.source.getPlayer(),
                Arguments.INTEGER.getResult(c, "amount")
              )
            )
          )
          .executes((c) => giveBanner(c.source.getPlayer(), 16))
      )
      .then(
        Commands.literal("give")
          .then(
            Commands.argument(
              "amount",
              Arguments.INTEGER.create(event)
            ).executes((c) =>
              giveBanner(
                c.source.getPlayer(),
                Arguments.INTEGER.getResult(c, "amount")
              )
            )
          )
          .executes((c) => giveBanner(c.source.getPlayer(), 16))
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

  if (!guild.banner) {
    player.tell(
      "A banner hasnt been set for your Guild yet. Urge your Guild Owner to run /banner save whilst holding a banner."
    );
    return 1;
  }

  console.log(guild.banner);

  // Honestly, this is bad but I cba

  let patternsJavaUtil = guild.banner.components
    ? guild.banner.components["minecraft:banner_patterns"]
    : null;
  let patterns = [];
  if (patternsJavaUtil) {
    for (const p of patternsJavaUtil) {
      patterns.push(p);
    }
  }
  let item = `${guild.banner.id}[banner_patterns=${JSON.stringify(patterns)}]`;

  console.log(item);

  let banner = Item.of(item);

  if (amount > 16) amount = 16;
  if (amount <= 0) amount = 1;

  banner.count = amount;

  player.give(banner);
  return 1;
}
