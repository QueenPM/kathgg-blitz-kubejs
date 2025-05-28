const REMINDERS = [
  "View your kill history with §7/kills§8.",
  "View your death history with §7/deaths§8.",
  "Check the combat leaderboard with §7/cs§8.",
  "Villages are neutral zones. No bases or combat allowed.",
  "Avoid causing server lag when chunk loading.",
  "Server restarts daily at §a04:00 AM UTC§8.",
  "Form parties with §7/guild§8 and claim land with §7/claim§8.",
  "See banned items with §7/banneditems§8.",
];

const RULES = [
  "Griefing is strictly prohibited.",
  "Do not break blocks in or near another player's base.",
  "Entering other bases is allowed, but block breaking is not.",
  "Villages are neutral zones; combat is not permitted.",
  "Building in or around villages is allowed, but establishing a base is not.",
  "Do not harm or remove villagers. All trading must occur within villages.",
  "Stealing is permitted only if you can access the base without breaking blocks.",
  "Do not build around or over another player's structures (e.g., walls).",
  "Raiding is allowed only if at least one base member is online.",
  "Do not completely loot a base; leave some items behind.",
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