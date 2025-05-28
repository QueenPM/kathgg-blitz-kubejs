const CuriosAPI = Java.loadClass('top.theillusivec4.curios.api.CuriosApi')

const WALLET_IDS = [
  "lightmanscurrency:wallet_leather",
  "lightmanscurrency:wallet_copper",
  "lightmanscurrency:wallet_iron",
  "lightmanscurrency:wallet_gold",
  "lightmanscurrency:wallet_emerald",
  "lightmanscurrency:wallet_diamond",
  "lightmanscurrency:wallet_netherite",
  "lightmanscurrency:wallet_nether_star",
  "lightmanscurrency:wallet_ender_dragon"
]

const COIN_VALUES = [
  { id: "lightmanscurrency:coin_copper", value: 1 },
  { id: "lightmanscurrency:coin_iron", value: 10 },
  { id: "lightmanscurrency:coin_gold", value: 100 },
  { id: "lightmanscurrency:coin_emerald", value: 1000 },
  { id: "lightmanscurrency:coin_diamond", value: 10000 },
  { id: "lightmanscurrency:coin_netherite", value: 100000 }
]

/**
 * 
 * @param {$ServerPlayer_} player 
 */
function getPlayerWallet(player){
  const inventory = player.inventory.allItems;
  let total = 0;
  let curiosWallet;
  // can probably error but w/e
  try{
    let walletStack = CuriosAPI.getCuriosInventory(player).get().getCurios().get("wallet").getStacks()
    let slots = walletStack.getSlots()

    /** @type {$ItemStack_} */
    curiosWallet = walletStack.getStackInSlot(0);
  }catch(e){
    console.log(e)
  }

  /** @type {Array<$ItemStack_>} */
  const wallets = [];

  if(curiosWallet.id !== "minecraft:air"){
    wallets.push(curiosWallet)
  }
  for(const item of inventory){
    if(item.id === "minecraft:air") continue;
    if(WALLET_IDS.some(id => id === item.id)){
      wallets.push(item)
      continue;
    }
    
    let coin = COIN_VALUES.find(v => v.id === item.id);
    if(coin){
      total += coin.value * item.count
    }
  }

  for(const wallet of wallets){
    /** @type {$ItemStack_[]} */
    let coins = wallet.toNBT()["components"]["lightmanscurrency:wallet_data"]["Items"]
    for(const coin of coins){
      let value = COIN_VALUES.find(v=>v.id === coin.id)
      if(!value) continue;
      total += value.value * coin.count;
    }
  }

  console.log(total)
}