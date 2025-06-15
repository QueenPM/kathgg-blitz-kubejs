// priority: 0

const $AlliesEvents = Java.loadClass(
  "earth.terrarium.odyssey_allies.api.events.AlliesEvents"
);

const $CreateGuildEvent = $AlliesEvents.CreateGuildEvent;
const $RemoveGuildEvent = $AlliesEvents.RemoveGuildEvent;
const $GuildChangedEvent = $AlliesEvents.GuildChangedEvent;
const $ModifyGuildMemberEvent = $AlliesEvents.ModifyGuildMemberEvent;
const $RemoveGuildMemberEvent = $AlliesEvents.RemoveGuildMemberEvent;

// Register the event listeners to Update Guild Data
// WARN: This creates multiple listeners when hopping between singleplayer worlds.
ServerEvents.loaded((event) => {
  if(!Platform.isLoaded("odyssey_allies")) return;
  console.log("KJS: Registering Odyssey Allies Guild event listeners...");
  loadGuilds();

  /**
   * Listener for Guild Creation.
   * @param {$Level_} level - The level where the guild was created.
   * @param {earth.terrarium.odyssey_allies.api.teams.guild.Guild} guild - The guild that was created.
   */
  $CreateGuildEvent.register((level, guild) => {
    try {
      let guildData = getGuildData(guild);
      // TODO: Add new guild to your GUILDS cache
      saveGuildData(guildData);
    } catch (e) {
      console.error(
        `KJS ERROR: CreateGuildEvent - Guild ID ${
          guild ? guild.id() : "unknown"
        }: ${e}`
      );
    }
  });

  /**
   * Listener for Guild Removal.
   * @param {$Level_} level - The level where the guild was removed.
   * @param {earth.terrarium.odyssey_allies.api.teams.guild.Guild} guild - The guild that was removed.
   */
  $RemoveGuildEvent.register((level, guild) => {
    try {
      let guildData = getGuildData(guild);
      console.log(
        `KJS INFO: RemoveGuildEvent - Guild ID: ${guildData.id}, Name: ${guildData.settings.name}}`
      );
      if (guildData) delete GUILDS[guildData.id];
    } catch (e) {
      console.error(
        `KJS ERROR: RemoveGuildEvent - Guild ID ${
          guild ? guild.id() : "unknown"
        }: ${e}`
      );
    }
  });

  /**
   * Listener for Guild Changes (e.g., settings updated).
   * @param {$Level_} level - The level where the guild was changed.
   * @param {earth.terrarium.odyssey_allies.api.teams.guild.Guild} guild - The guild that was changed.
   */
  $GuildChangedEvent.register((level, guild) => {
    try {
      let guildData = getGuildData(guild);
      console.log(
        `KJS INFO: GuildChangedEvent - Guild ID: ${guildData.id}, Name: ${guildData.settings.name}}`
      );
      saveGuildData(guildData);
    } catch (e) {
      console.error(
        `KJS ERROR: GuildChangedEvent - Guild ID ${
          guild ? guild.id() : "unknown"
        }: ${e}`
      );
    }
  });

  /**
   * Listener for Guild Member Modification (added or status changed).
   * @param {$Level_} level - The level where the member was modified.
   * @param {earth.terrarium.odyssey_allies.api.teams.guild.Guild} guild - The guild to which the member belongs.
   * @param {$UUID_} playerUUID - The UUID of the player whose membership was modified.
   * @param {earth.terrarium.odyssey_allies.api.teams.MemberStatus} status - The new status of the member.
   */
  $ModifyGuildMemberEvent.register((level, guild, playerUUID, status) => {
    try {
      let guildData = getGuildData(guild);
      // TODO test this
      console.log(
        `KJS INFO: ModifyGuildMemberEvent - Guild ID: ${guildData.id}, Name: ${
          guildData.settings.name
        }, Player UUID: ${playerUUID.toString()}, New Status: ${status.name()}}`
      );
      console.log(`NEW GUILD DATA FROM EVENT: ${guildData}`);
      saveGuildData(guildData);
      // if (guildData && GUILDS[guildData.id]) {
      //   const updatedMembersGuildData = getGuildData(guild);
      //   GUILDS[guildData.id].members = updatedMembersGuildData.members;
      // }
    } catch (e) {
      console.error(
        `KJS ERROR: ModifyGuildMemberEvent - Guild ID ${
          guild ? guild.id() : "unknown"
        }, Player UUID ${playerUUID ? playerUUID.toString() : "unknown"}: ${e}`
      );
    }
  });

  /**
   * Listener for Guild Member Removal.
   * @param {$Level_} level - The level where the member was removed.
   * @param {earth.terrarium.odyssey_allies.api.teams.guild.Guild} guild - The guild from which the member was removed.
   * @param {$UUID_} playerUUID - The UUID of the player who was removed.
   */
  $RemoveGuildMemberEvent.register((level, guild, playerUUID) => {
    try {
      let guildData = getGuildData(guild);
      // TODO test this
      console.log(
        `KJS INFO: RemoveGuildMemberEvent - Guild ID: ${guildData.id}, Name: ${
          guildData.settings.name
        }, Player UUID: ${playerUUID.toString()}`
      );
      console.log(`NEW GUILD DATA FROM EVENT: ${guildData}`);
      saveGuildData(guildData);
      // e.g., if (guildData && GUILDS[guildData.id]) {
      //   const updatedMembersGuildData = getGuildData(guild); // Re-fetch to get latest members
      //   GUILDS[guildData.id].members = updatedMembersGuildData.members;
      // }
    } catch (e) {
      console.error(
        `KJS ERROR: RemoveGuildMemberEvent - Guild ID ${
          guild ? guild.id() : "unknown"
        }, Player UUID ${playerUUID ? playerUUID.toString() : "unknown"}: ${e}`
      );
    }
  });

  console.log("KJS: Odyssey Allies Guild event listeners registered.");
});
