const STARTUP_CMDS = [
  "hiddennames blocksHideName true",
  "gamerule disableElytraMovementCheck true"
]


ServerEvents.loaded((e)=>{
  for(const cmd of STARTUP_CMDS){
    e.server.runCommandSilent(cmd)
  }
})