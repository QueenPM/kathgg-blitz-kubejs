const $ImmersiveAPI = Java.loadClass("toni.immersivemessages.api.ImmersiveMessage");
const $Float = Java.loadClass('java.lang.Float');

/**
 * Sends an Immersive Title for the Player
 * @param {$ServerPlayer_} player
 */
function sendPlayerTitle(player){
  $ImmersiveAPI.builder(0.2, "Test").sendServer(player); // The choice of Java method toni.immersivemessages.api.ImmersiveMessage.builder matching JavaScript argument types (number,string) is ambiguous; candidate methods are:

  // Kinda silly cos this is a Class, but was worth a shot.
  $ImmersiveAPI.builder($Float.valueOf(0.2), "Test").sendServer(player); // The choice of Java method toni.immersivemessages.api.ImmersiveMessage.builder matching JavaScript argument types (java.lang.Float,net.minecraft.network.chat.MutableComponent) is ambiguous; candidate methods are:
}