const STARTUP_CMDS = [
  "hiddennames blocksHideName true",
  "gamerule disableElytraMovementCheck true",
  "gamerule playersSleepingPercentage 50",
  "gamerule doInsomnia false"
]


ServerEvents.loaded((e)=>{
  for(const cmd of STARTUP_CMDS){
    e.server.runCommandSilent(cmd)
  }
})