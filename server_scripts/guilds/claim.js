// const $ClaimsManager = Java.loadClass(
//   "earth.terrarium.cadmus.api.claims.ClaimApi"
// ).API;

// const $ChunkPos = Java.loadClass('net.minecraft.world.level.ChunkPos');

// BlockEvents.broken( event => {
//   if(!Platform.isLoaded("cadmus")) return;
//   const blockPos = event.block.pos;
//   const chunkPos = new $ChunkPos(blockPos);
//   const claimedOptional = $ClaimsManager.getClaim(server.getAllLevels().iterator().next(), chunkPos);
//   const claimed = claimedOptional.isPresent() ? claimedOptional.get() : null;

//   if(claimed && event.entity.player) { 
//     // Get the Team Provider (Individual / Guild)
//     const provider = claimed.team().provider()
    
//     // Check for Individual
//     if(provider.toString() == "cadmus:individual"){
//       if(event.entity.uuid.toString() != claimed.team().id().toString()){
//         event.cancel();
//       }
//     }
//   }else{
//     console.log("nope")
//   }
// })