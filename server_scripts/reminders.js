const REMINDERS = [
  "You can view your §4Kill History§8 by typing §7/kills§8!",
  "You can view your §4Deaths History§8 by typing §7/deaths§8!",
  "You can view the §4Combat Leaderboard§8 by typing §7/cs§8!",
  "Villages are §aneutral ground!§8 Meaning you cannot base or kill players in them! (You may build defenses and protect them)",
  "If you're Chunk Loading, ensure you're not causing lag to the server!",
  "Server restarts are every day at §a04:00 AM UTC§8!",
  "You can party up using §7/guild§8 and claim chunks usng §7/claim§8!",
  "You can check what items are banned using §7/banneditems§8!",
];

const RULES = [
  "No Griefing!",
  "You cannot break blocks in or near someone's base!",
  "You may enter their base without breakng blocks!",
  "Villages are neutral ground. No fighting!",
  "You are allowed to build in or around villages but you cannot base in them.",
  "You are not allowed to take or kill villagers! All Villager Trading must take place in the village!",
  "Stealing is allowed, under certain conditions: You must be able to break into the base without breaking blocks!",
  "You may not build around someone's base, ei: If someone has built a wall, you cannot tower over it.",
  "You may only raid someone's base if at least one member of the base is online!",
  "You may not Steal Everything from a base, leave some items behind!",
];

let lastReminderIndex = -1;

const REMINDER_TIMER = 1200 * 15; // 1200 ticks = 1 minute

/**
 * Tells the player the rules of the server
 * @param {$Player} player 
 */
function tellPlayerRules(player){
  player.tell("§4Rules§8 of the Server!");
  for (let i = 0; i < RULES.length; i++) {
    player.tell(`§4${i+1})§8 ${RULES[i]}`);
  }
  player.tell("§8Use /rules to view this again.");
}

ServerEvents.tick(event => {
  if(!FEATURE_REMINDERS) return;
  if (event.currentTick % REMINDER_TIMER === 0) {
    let newReminderIndex;
    do {
      newReminderIndex = Math.floor(Math.random() * REMINDERS.length);
    } while (newReminderIndex === lastReminderIndex);

    lastReminderIndex = newReminderIndex;
    let reminder = REMINDERS[newReminderIndex];
    event.server.tell("§bⒾ§8 " + reminder);
  }
});

PlayerEvents.loggedIn(event => {
  if(FEATURE_RULES){
    tellPlayerRules(event.player)
  }
  if(FEATURE_REMINDERS){
    let reminderIndex = Math.floor(Math.random() * REMINDERS.length);
    event.player.tell("§bⒾ§8 " + REMINDERS[reminderIndex]);
  }
});

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event

  if(FEATURE_RULES){
    event.register(Commands.literal('rules')
      .executes(c => {
        /**
         * @type {$Player}
         */
        let player = c.source.player;
        tellPlayerRules(player);
        return 1;
      })
    )
  }

  if(FEATURE_REMINDERS){
    event.register(Commands.literal('tips')
      .executes(c => {
        /**
         * @type {$Player}
         */
        let player = c.source.player;
        player.tell("§8Here are some useful §btips§8:");
        for (const tip of REMINDERS) {
          player.tell("§b*§8 " + tip);
        }
        return 1;
      })
    )
  }
})