const CuriosAPI = Java.loadClass('top.theillusivec4.curios.api.CuriosApi')

const $MoneyAPI = Java.loadClass('io.github.lightman314.lightmanscurrency.api.money.MoneyAPI')
const $BankAPI = Java.loadClass('io.github.lightman314.lightmanscurrency.api.money.bank.BankAPI')
const $MoneyValue = Java.loadClass('io.github.lightman314.lightmanscurrency.api.money.value.MoneyValue')
const $CoinValue = Java.loadClass('io.github.lightman314.lightmanscurrency.api.money.value.builtin.CoinValue')

const IBankAccount = Java.loadClass('io.github.lightman314.lightmanscurrency.api.money.bank.IBankAccount')



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
 * @typedef {Money}
 * @property {number} value
 * @property {string} text
 */

/**
 * @typedef {PlayerMoney}
 * @property {Money} wallet
 * @property {Money} bank
 * @property {Money} inventory
 */

/**
 * Gets the Player's Money
 * @param {$ServerPlayer_} player 
 */
function getPlayerMoney(player) {
  /** @type {PlayerMoney} */
  let playerMoney = {

  }
  let MoneyAPI = $MoneyAPI.API;
  let BankAPI = $BankAPI.API;

  // Wallet

  let wallet = MoneyAPI.GetPlayersMoneyHandler(player).getStoredMoney();

  // Cannot use a reduce for some reason. Weird
  let walletTotal = 0;
  for(const value of wallet.allValues()){
    walletTotal += value.getCoreValue()
  }

  playerMoney.wallet = {
    value: walletTotal,
    text: wallet.getString()
  }

  // Inventory

  let inventoryTotal = 0;
  for(const item of player.inventory.items){
    if(item.id === "minecraft:air") continue;
    
    let coin = COIN_VALUES.find(v => v.id === item.id);
    if(coin){
      inventoryTotal += coin.value * item.count
    }
  }

  if(inventoryTotal){
    let inventoryValue = $CoinValue.fromNumber("main", inventoryTotal);
  
    playerMoney.inventory = {
      value: inventoryValue.getCoreValue(),
      text: inventoryValue.getString()
    }
  }else{
    playerMoney.inventory = {
      value: 0,
      text: ""
    }
  }

  // Bank

  /** @type {$IBankAccount_[]} */
  let banks = BankAPI.GetAllBankAccounts(false)
  for(const bank of banks){
    let accountName = bank.getName().getString();
    if(!accountName.startsWith(player.username)) continue;

    let bankStorage = bank.getMoneyStorage();
    let totalBankValue = 0;
    for (const moneyValue of bankStorage.allValues()) {
      totalBankValue += moneyValue.getCoreValue();
    }

    playerMoney.bank = {
      value: totalBankValue,
      text: bank.getBalanceText().getString() 
    };
    break;
  }

  return playerMoney;
}

/**
 * Gives the Player money
 * @param {$ServerPlayer_} player 
 * @param {number} value
 */
function givePlayerMoney(player, value){
  let MoneyAPI = $MoneyAPI.API;

  let moneyToInsert = $CoinValue.fromNumber("main", value);
  MoneyAPI.GetPlayersMoneyHandler(player).insertMoney(moneyToInsert, false)
}

/**
 * Takes the Player money
 * @param {$ServerPlayer_} player 
 * @param {number} value
 */
function takePlayerMoney(player, value){
  let MoneyAPI = $MoneyAPI.API;

  let moneyToInsert = $CoinValue.fromNumber("main", value);
  MoneyAPI.GetPlayersMoneyHandler(player).extractMoney(moneyToInsert, false)
}

/**
 * Syncs all online player's lightman currency with their credits
 * @param {$MinecraftServer_} server
 */
function syncCreditsWithLightman(server){
  let players = server.playerList.getPlayers()
  for(const player of players){
    let value = getPlayerMoney(player);
    let data = getPlayerData(player.uuid);
    if(!data || !value) continue;

    data.credits = value.wallet.value
    // console.log(`Synced ${player.username}'s credits to ${data.credits}`)
  }
}