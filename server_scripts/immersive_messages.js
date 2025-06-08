const $ImmersiveAPI = Java.loadClass(
  "toni.immersivemessages.api.ImmersiveMessage"
);
const $Color = Java.loadClass("net.minecraft.ChatFormatting");
const $TextColor = Java.loadClass("net.minecraft.network.chat.TextColor");
const $Style = Java.loadClass("net.minecraft.network.chat.Style");
const $Text = Java.loadClass("net.minecraft.network.chat.Component");
const $TextAnchor = Java.loadClass("toni.immersivemessages.api.TextAnchor");
const $SoundEffect = Java.loadClass("toni.immersivemessages.api.SoundEffect");
const $ImmersiveColor = Java.loadClass(
  "toni.immersivemessages.util.ImmersiveColor"
);
const $ObfuscateMode = Java.loadClass(
  "toni.immersivemessages.api.ObfuscateMode"
);
const $ImmersiveFont = Java.loadClass("toni.immersivemessages.ImmersiveFont");

/**
 * Immersive Message API Helper
 * @param {number} length Duration for the message
 * @param {string | net.minecraft.network.chat.MutableComponent} textOrComponent The text string or a MutableComponent
 */
let ImmersiveMessage = function (length, textOrComponent) {
  if (typeof textOrComponent === "string") {
    this.builder = $ImmersiveAPI["builder(float,java.lang.String)"](
      length,
      textOrComponent
    );
  } else {
    // Assuming textOrComponent is a MutableComponent if not a string
    this.builder = $ImmersiveAPI[
      "builder(float,net.minecraft.network.chat.MutableComponent)"
    ](length, textOrComponent);
  }
};

// --- Static Factory Methods ---
/**
 * Creates a new Immersive Tooltip with the specified text and duration.
 * @param {number} duration how long the animation should play for
 * @param {net.minecraft.network.chat.MutableComponent} component the component to show
 * @return {ImmersiveMessage} the tooltip builder
 */
ImmersiveMessage.builderWithComponent = function (duration, component) {
  let msg = new ImmersiveMessage(0, ""); // Dummy init
  msg.builder = $ImmersiveAPI[
    "builder(float,net.minecraft.network.chat.MutableComponent)"
  ](duration, component);
  return msg;
};

/**
 * Creates a popup style message.
 * @param {number} duration
 * @param {string} title
 * @param {string} subtitle
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.popup = function (duration, title, subtitle) {
  let msg = new ImmersiveMessage(0, ""); // Dummy init
  msg.builder = $ImmersiveAPI["popup(float,java.lang.String,java.lang.String)"](
    duration,
    title,
    subtitle
  );
  return msg;
};

/**
 * Creates a toast style message.
 * @param {number} duration
 * @param {string} title
 * @param {string} subtitle
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.toast = function (duration, title, subtitle) {
  let msg = new ImmersiveMessage(0, ""); // Dummy init
  msg.builder = $ImmersiveAPI["toast(float,java.lang.String,java.lang.String)"](
    duration,
    title,
    subtitle
  );
  return msg;
};

// --- Instance Methods (Chaining) ---

/**
 * Enables a character-by-character animation
 * @param {number} speed
 * @param {boolean} centerAligned
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.typewriter = function (speed, centerAligned) {
  this.builder["typewriter(float,boolean)"](speed, centerAligned);
  return this;
};

/**
 * Enables a background.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.background = function () {
  this.builder["background()"]();
  return this;
};

/**
 * Changes the border color to a rainbow effect.
 * @param {number} [speed=2.0] Optional speed for the rainbow effect.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.rainbow = function (speed) {
  if (speed === undefined) {
    this.builder["rainbow()"]();
  } else {
    this.builder["rainbow(float)"](speed);
  }
  return this;
};

/**
 * Sets background color.
 * @param {number | toni.immersivemessages.util.ImmersiveColor} colorOrInt Integer RGB or ImmersiveColor object.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.backgroundColor = function (colorOrInt) {
  if (typeof colorOrInt === "number") {
    this.builder["backgroundColor(int)"](colorOrInt);
  } else {
    this.builder["backgroundColor(toni.immersivemessages.util.ImmersiveColor)"](
      colorOrInt
    );
  }
  return this;
};

/**
 * Sets top border color.
 * @param {number | toni.immersivemessages.util.ImmersiveColor} colorOrInt Integer RGB or ImmersiveColor object.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.borderTopColor = function (colorOrInt) {
  if (typeof colorOrInt === "number") {
    this.builder["borderTopColor(int)"](colorOrInt);
  } else {
    this.builder["borderTopColor(toni.immersivemessages.util.ImmersiveColor)"](
      colorOrInt
    );
  }
  return this;
};

/**
 * Sets bottom border color.
 * @param {number | toni.immersivemessages.util.ImmersiveColor} colorOrInt Integer RGB or ImmersiveColor object.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.borderBottomColor = function (colorOrInt) {
  if (typeof colorOrInt === "number") {
    this.builder["borderBottomColor(int)"](colorOrInt);
  } else {
    this.builder[
      "borderBottomColor(toni.immersivemessages.util.ImmersiveColor)"
    ](colorOrInt);
  }
  return this;
};

/**
 * Sets a max width for text, beyond which will be wrapped, or enables default wrapping.
 * @param {number} [maxWidth] Optional maximum width. If not provided, enables default wrapping.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.wrap = function (maxWidth) {
  if (maxWidth === undefined) {
    this.builder["wrap()"]();
  } else {
    this.builder["wrap(int)"](maxWidth);
  }
  return this;
};

/**
 * Changes the location on screen to which the text is anchored.
 * @param {toni.immersivemessages.api.TextAnchor} anchorEnum
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.anchor = function (anchorEnum) {
  this.builder["anchor(toni.immersivemessages.api.TextAnchor)"](anchorEnum);
  return this;
};

/**
 * Changes the local offset of the text bounding box (text alignment within its box).
 * @param {toni.immersivemessages.api.TextAnchor} alignEnum
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.align = function (alignEnum) {
  this.builder["align(toni.immersivemessages.api.TextAnchor)"](alignEnum);
  return this;
};

/**
 * Enables a sound effect.
 * @param {toni.immersivemessages.api.SoundEffect} effectEnum
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.sound = function (effectEnum) {
  this.builder["sound(toni.immersivemessages.api.SoundEffect)"](effectEnum);
  return this;
};

/**
 * Allows for custom consumer configuration methods.
 * @param {function(toni.immersivemessages.api.ImmersiveMessage):void} consumer A JS function that takes the Java ImmersiveMessage builder.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.apply = function (consumer) {
  this.builder["apply(java.util.function.Consumer)"](consumer);
  return this;
};

/**
 * Adds a subtext.
 * @param {number} delay The starting delay.
 * @param {string} subtextString The text to display.
 * @param {number | function(toni.immersivemessages.api.ImmersiveMessage):void} offsetOrBuilder Y offset or builder function.
 * @param {function(toni.immersivemessages.api.ImmersiveMessage):void} [builderIfOffset] Builder function if offset was provided.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.subtext = function (
  delay,
  subtextString,
  offsetOrBuilder,
  builderIfOffset
) {
  if (
    typeof offsetOrBuilder === "number" &&
    typeof builderIfOffset === "function"
  ) {
    this.builder[
      "subtext(float,java.lang.String,float,java.util.function.Consumer)"
    ](delay, subtextString, offsetOrBuilder, builderIfOffset);
  } else if (typeof offsetOrBuilder === "function") {
    this.builder["subtext(float,java.lang.String,java.util.function.Consumer)"](
      delay,
      subtextString,
      offsetOrBuilder
    );
  }
  return this;
};

/**
 * Sets the initial Y level.
 * @param {number} ylevel
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.y = function (ylevel) {
  this.builder["y(float)"](ylevel);
  return this;
};

/**
 * Sets the initial X level.
 * @param {number} xlevel
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.x = function (xlevel) {
  this.builder["x(float)"](xlevel);
  return this;
};

/**
 * Makes the text bold.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.bold = function () {
  this.builder["bold()"]();
  return this;
};

/**
 * Makes the text italic.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.italic = function () {
  this.builder["italic()"]();
  return this;
};

/**
 * Sets the starting scale of the font.
 * @param {number} size Scale, default 1f.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.size = function (size) {
  this.builder["size(float)"](size);
  return this;
};

/**
 * Sets the Fade In length.
 * @param {number} [duration=1.0]
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.fadeIn = function (duration) {
  if (duration === undefined) {
    this.builder["fadeIn()"]();
  } else {
    this.builder["fadeIn(float)"](duration);
  }
  return this;
};

/**
 * Sets the Fade Out length.
 * @param {number} [duration=1.0]
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.fadeOut = function (duration) {
  if (duration === undefined) {
    this.builder["fadeOut()"]();
  } else {
    this.builder["fadeOut(float)"](duration);
  }
  return this;
};

/**
 * Violently shakes the text.
 * @param {number} [speed=100.0]
 * @param {number} [intensity=0.75]
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.shake = function (speed, intensity) {
  if (speed === undefined && intensity === undefined) {
    this.builder["shake()"]();
  } else {
    this.builder["shake(float,float)"](speed, intensity);
  }
  return this;
};

/**
 * Mild sine waving effect on the Z rotation.
 * @param {number} [speed=5.0]
 * @param {number} [intensity=2.5]
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.wave = function (speed, intensity) {
  if (speed === undefined && intensity === undefined) {
    this.builder["wave()"]();
  } else {
    this.builder["wave(float,float)"](speed, intensity);
  }
  return this;
};

// Slide methods
ImmersiveMessage.prototype.slideUp = function (duration) {
  if (duration === undefined) this.builder["slideUp()"]();
  else this.builder["slideUp(float)"](duration);
  return this;
};
ImmersiveMessage.prototype.slideDown = function (duration) {
  if (duration === undefined) this.builder["slideDown()"]();
  else this.builder["slideDown(float)"](duration);
  return this;
};
ImmersiveMessage.prototype.slideLeft = function (duration) {
  if (duration === undefined) this.builder["slideLeft()"]();
  else this.builder["slideLeft(float)"](duration);
  return this;
};
ImmersiveMessage.prototype.slideRight = function (duration) {
  if (duration === undefined) this.builder["slideRight()"]();
  else this.builder["slideRight(float)"](duration);
  return this;
};
ImmersiveMessage.prototype.slideOutUp = function (duration) {
  if (duration === undefined) this.builder["slideOutUp()"]();
  else this.builder["slideOutUp(float)"](duration);
  return this;
};
ImmersiveMessage.prototype.slideOutDown = function (duration) {
  if (duration === undefined) this.builder["slideOutDown()"]();
  else this.builder["slideOutDown(float)"](duration);
  return this;
};
ImmersiveMessage.prototype.slideOutLeft = function (duration) {
  if (duration === undefined) this.builder["slideOutLeft()"]();
  else this.builder["slideOutLeft(float)"](duration);
  return this;
};
ImmersiveMessage.prototype.slideOutRight = function (duration) {
  if (duration === undefined) this.builder["slideOutRight()"]();
  else this.builder["slideOutRight(float)"](duration);
  return this;
};

/**
 * Sets a custom font.
 * @param {string | toni.immersivemessages.ImmersiveFont} fontNameOrObject Font name as string or ImmersiveFont object.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.font = function (fontNameOrObject) {
  if (typeof fontNameOrObject === "string") {
    this.builder["font(java.lang.String)"](fontNameOrObject);
  } else {
    this.builder["font(toni.immersivemessages.ImmersiveFont)"](
      fontNameOrObject
    );
  }
  return this;
};

/**
 * Applies or modifies the style.
 * @param {net.minecraft.network.chat.Style | function(net.minecraft.network.chat.Style):net.minecraft.network.chat.Style} styleOrFunction A Style object or a function that modifies a Style.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.style = function (styleOrFunction) {
  if (typeof styleOrFunction === "function") {
    this.builder["style(java.util.function.Function)"](styleOrFunction);
  } else {
    this.builder["style(net.minecraft.network.chat.Style)"](styleOrFunction);
  }
  return this;
};

/**
 * Sets whether the text has a shadow.
 * @param {boolean} hasShadow
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.shadow = function (hasShadow) {
  this.builder["shadow(boolean)"](hasShadow);
  return this;
};

/**
 * Provides access to the AnimationTimeline for custom animations.
 * @param {function(toni.lib.animation.AnimationTimeline):void} animationBuilderConsumer A JS function that takes the Java AnimationTimeline.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.animation = function (animationBuilderConsumer) {
  this.builder["animation(java.util.function.Consumer)"](
    animationBuilderConsumer
  );
  return this;
};

/**
 * Fades in the text with obfuscation.
 * @param {toni.immersivemessages.api.ObfuscateMode | number} [modeOrSpeed] ObfuscateMode, or speed if mode is omitted (RANDOM default).
 * @param {number} [speedIfMode] Speed if mode was provided.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.obfuscate = function (modeOrSpeed, speedIfMode) {
  if (modeOrSpeed === undefined) {
    this.builder["obfuscate()"]();
  } else if (typeof modeOrSpeed === "number" && speedIfMode === undefined) {
    this.builder["obfuscate(float)"](modeOrSpeed);
  } else if (speedIfMode === undefined) {
    // modeOrSpeed is ObfuscateMode
    this.builder["obfuscate(toni.immersivemessages.api.ObfuscateMode)"](
      modeOrSpeed
    );
  } else {
    // modeOrSpeed is ObfuscateMode, speedIfMode is float
    this.builder["obfuscate(toni.immersivemessages.api.ObfuscateMode,float)"](
      modeOrSpeed,
      speedIfMode
    );
  }
  return this;
};

/**
 * Sets the text color.
 * @param {net.minecraft.network.chat.TextColor | net.minecraft.ChatFormatting | number} colorArg TextColor, ChatFormatting, or integer RGB.
 * @return {ImmersiveMessage}
 */
ImmersiveMessage.prototype.color = function (colorArg) {
  if (typeof colorArg === "number") {
    this.builder["color(int)"](colorArg);
  } else if (colorArg instanceof $Color) {
    // Assuming $Color is ChatFormatting
    this.builder["color(net.minecraft.ChatFormatting)"](colorArg);
  } else {
    // Assuming TextColor
    this.builder["color(net.minecraft.network.chat.TextColor)"](colorArg);
  }
  return this;
};

// --- Instance Methods (Non-Chaining / Finalizers) ---

/**
 * Gets the processed text (e.g., with typewriter effect applied).
 * @return {net.minecraft.network.chat.MutableComponent}
 */
ImmersiveMessage.prototype.getText = function () {
  return this.builder["getText()"]();
};

/**
 * Gets the raw, original text.
 * @return {net.minecraft.network.chat.MutableComponent}
 */
ImmersiveMessage.prototype.getRawText = function () {
  return this.builder["getRawText()"]();
};

/**
 * Sends the text to a specific server player.
 * @param {$ServerPlayerKJS_} player
 */
ImmersiveMessage.prototype.sendServer = function (player) {
  this.builder["sendServer(net.minecraft.server.level.ServerPlayer)"](player);
};

/**
 * Sends the text to a collection of server players.
 * @param {$ServerPlayerKJS_[]} players A JS array of ServerPlayerKJS objects.
 */
ImmersiveMessage.prototype.sendPlayers = function (players) {
  // KubeJS will usually convert a JS array to a Java Collection if the method expects it.
  this.builder["sendServer(java.util.Collection)"](players);
};

/**
 * Sends the text to all players on the server.
 * @param {$MinecraftServer_} server The MinecraftServer instance.
 */
ImmersiveMessage.prototype.sendServerToAll = function (server) {
  this.builder["sendServerToAll(net.minecraft.server.MinecraftServer)"](server);
};

/**
 * Sends an Immersive Title for the Player
 * @param {$ServerPlayer_} player
 * @param {string} text
 * @param {string} subtext?
 */
function sendPlayerWarning(player, text, subtext) {
  let message = new ImmersiveMessage(3, text)
    .fadeIn(0.25)
    .fadeOut(0.25)
    .anchor($TextAnchor.CENTER_CENTER)
    .shake(20, 1)
    .size(1.2)
    .color($Color.DARK_RED);

  if (subtext) {
    message.subtext(0, subtext, (st) => {
      st.size(0.75)
        ["color(net.minecraft.ChatFormatting)"]($Color.GRAY)
        .fadeIn(0.25)
        .fadeOut(0.25)
        .wrap()
        .shake(20, 1);
    });
  }

  message.sendServer(player);
}
