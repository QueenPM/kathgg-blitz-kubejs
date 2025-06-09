# Kath.gg Battle Blitz Addon
These are a series of utility and fun addons written with KubeJS intended for use on the Kath.gg Battle Blitz PvP Servers. The community is private but if you have found this and wish to use it for yourself, feel free to.

The addon has several features that you can enable/disable in `server_scripts/main.js` and further configure in their respective files.
## Features
- ⚔️ [Stats](#stats)
- 📦 [Kits](#kits)
- 🪙 [Credits](#credits)
- 🧭 [Player Tracker](#player-tracker)
- ❌ [Banned Items](#banned-items)
- ℹ️ [Reminders/Tips](#reminders-tips)
- 📋 [Rules](#rules)
### Stats
The Stats module provides comprehensive player-versus-player (PvP) performance tracking. It records various metrics related to kills and deaths, offering players insights into their combat history. A key feature is the leaderboard GUI, which allows players to view and sort server-wide statistics.

**Tracked Statistics:**
*   **Kills:** Total number of players eliminated.
*   **Deaths:** Total number of times the player has been eliminated.
*   **Killstreak:**
    *   Current: Number of consecutive kills without dying.
    *   Highest: The player's best recorded killstreak.
*   **Nemesis:** The player who has eliminated this player the most.
*   **Victim:** The player whom this player has eliminated the most.
*   **Favourite Weapon:** The weapon most frequently used to secure kills.
*   **Furthest Kill:** The longest distance from which a kill was achieved.

**Mod Integration:**
*   **Ars Nouveau:** If [Ars Nouveau](https://modrinth.com/mod/ars-nouveau) is present, an additional statistic is tracked:
    *   **Favourite Spell:** The spell most frequently used for kills, including a display of its constituent glyphs.

**Commands:**
The leaderboard GUI can be accessed using the following commands. Detailed kill and death information is available within the GUI, presented in a paginated format.
*   `/cs`
*   `/combatstats`
*   `/stats`
    *   **Description (all aliases):** Opens the combat statistics leaderboard GUI.

### Kits
The Kits module allows players to save their current inventory and armor as a named "kit" and later load it on demand. This feature includes a chest GUI for easy kit selection.
#### Commands
The following commands are available for managing kits:
*   `/kits`
    *   **Description:** Opens the Kits GUI, allowing players to browse and select from their saved kits.
*   `/kits save <name>`
    *   **Description:** Saves the player's current inventory and equipped armor as a new kit.
    *   **Arguments:**
        *   `<name>`: The desired name for the new kit.
*   `/kits delete <name>`
    *   **Description:** Deletes a previously saved kit.
    *   **Arguments:**
        *   `<name>`: The name of the kit to be deleted.
### Credits
**Dependency:** This feature requires [Lightman's Currency Mod](https://modrinth.com/mod/lightmans-currency) ([CurseForge Link](https://www.curseforge.com/minecraft/mc-mods/lightmans-currency)).

The Credits addon integrates a player wealth tracking system and provides configurable rewards (coins) for player kills. Configuration options for this module can be found in `server_scripts/credits.js`.
### Player Tracker
wip
### Banned Items
wip
### Reminders/Tips
wip
### Rules
wip
## KubeJS Information
Find out more info on the website: https://kubejs.com/

Directory information:

assets - Acts as a resource pack, you can put any client resources in here, like textures, models, etc. Example: assets/kubejs/textures/item/test_item.png
data - Acts as a datapack, you can put any server resources in here, like loot tables, functions, etc. Example: data/kubejs/loot_tables/blocks/test_block.json

startup_scripts - Scripts that get loaded once during game startup - Used for adding items and other things that can only happen while the game is loading (Can be reloaded with /kubejs reload_startup_scripts, but it may not work!)
server_scripts - Scripts that get loaded every time server resources reload - Used for modifying recipes, tags, loot tables, and handling server events (Can be reloaded with /reload)
client_scripts - Scripts that get loaded every time client resources reload - Used for JEI events, tooltips and other client side things (Can be reloaded with F3+T)

config - KubeJS config storage. This is also the only directory that scripts can access other than world directory
exported - Data dumps like texture atlases end up here

You can find type-specific logs in logs/kubejs/ directory