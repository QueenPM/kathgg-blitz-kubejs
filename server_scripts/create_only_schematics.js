// Removes all recipes but not Schematic ones

// REMEMBER TO REMOVE WORLD GEN IN create-common.toml

ServerEvents.recipes((event) => {
  event.remove({
    mod: "create",
    not: [
      { id: "create:crafting/schematics/empty_schematic" },
      { id: "create:crafting/schematics/schematic_and_quill" },
      { id: "create:crafting/schematics/schematic_table" },
      { id: "create:crafting/schematics/schematicannon" },
    ],
  });
});
