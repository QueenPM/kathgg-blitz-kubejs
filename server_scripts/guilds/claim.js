// let ChunkClaim = new Menu({
//   title: "Chunk Claim",
//   rows: 6,
// }, [{
//   name: "main",
//   load: function (menu, data) {

//   }
// }
// ]);

// /**
//  * @typedef {Object} ClaimedChunks
//  * @property {number} x
//  */

// /**
//  * @typedef {Object} AreaSelect
//  * @property {$BlockPos_} pos1
//  * @property {$BlockPos_} pos2
//  */

// /** @type {AreaSelect} */
// let areaSelect = {
//   pos1:null,
//   pos2:null,
// }

// BlockEvents.rightClicked(e=> {
//   let item = e.getItem();
//   if(!item || item.id != "minecraft:stick") return;
//   areaSelect.pos1 = e.block.getPos();
//   e.server.runCommandSilent(`title ${e.player.username} actionbar {"text":"Position 1 set to ${areaSelect.pos1.x} ${areaSelect.pos1.y} ${areaSelect.pos1.z}", "color":"green"}`);

//   e.cancel();
// })

// BlockEvents.leftClicked(e=> {
//   let item = e.getItem();
//   if(!item || item.id != "minecraft:stick") return;
//   areaSelect.pos2 = e.block.getPos();
//   e.server.runCommandSilent(`title ${e.player.username} actionbar {"text":"Position 2 set to ${areaSelect.pos1.x} ${areaSelect.pos1.y} ${areaSelect.pos1.z}", "color":"orange"}`);
//   e.cancel();
// })

// ServerEvents.tick(e => {
//   if (e.server.tickCount % 20 != 0) return;

//   if (areaSelect.pos1 && areaSelect.pos2) {
//     // Get the positions
//     let pos1 = areaSelect.pos1;
//     let pos2 = areaSelect.pos2;

//     // Determine the min and max coordinates
//     let minX = Math.min(pos1.x, pos2.x);
//     let maxX = Math.max(pos1.x, pos2.x);
//     let minY = Math.min(pos1.y, pos2.y);
//     let maxY = Math.max(pos1.y, pos2.y);
//     let minZ = Math.min(pos1.z, pos2.z);
//     let maxZ = Math.max(pos1.z, pos2.z);

//     // Iterate through all the positions and play a particle
//     for (let x = minX; x <= maxX; x++) {
//       for (let y = minY; y <= maxY; y++) {
//         for (let z = minZ; z <= maxZ; z++) {
//           e.server.runCommandSilent(`particle minecraft:wax_on ${x} ${y+0.5} ${z} 0 0 0 0 1 normal QueenPM`);
//         }
//       }
//     }
//   }
// });


// let CadmusJava = Java.loadClass("terrarium.")