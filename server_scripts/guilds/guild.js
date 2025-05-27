// ServerEvents.commandRegistry(event => {
//   const { commands: Commands, arguments: Arguments } = event

//   event.register(Commands.literal('claim')
//     .executes(c => {
//       ChunkClaim.OpenMenu(c.source.player, "main");
//       return 1;
//     })
//   )
// })