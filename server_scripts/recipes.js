const RECIPES_TO_REMOVE = [
  // 'tacz:gunpowder',
  'sophisticatedbackpacks:inseption_upgrade',
  'sophisticatedbackpacks:backpack',
  'sophisticatedbackpacks:iron_backpack',
  'sophisticatedbackpacks:gold_backpack',
  'sophisticatedbackpacks:diamond_backpack',
  'sophisticatedbackpacks:iron_backpack_from_copper',
  'sophisticatedbackpacks:copper_backpack',
  'lightmanscurrency:portable_atm_swap',
  'lightmanscurrency:atm'
]

ServerEvents.recipes(event => {
  event.shaped(
    Item.of('sophisticatedbackpacks:backpack', 1),
    [
      'SBS',
      'SCS',
      'LLL'
    ],
    {
      S: 'minecraft:string',
      B: 'ars_nouveau:source_gem_block',
      C: 'minecraft:chest',
      L: 'minecraft:leather'
    }
  )
  event.shaped(
    Item.of('sophisticatedbackpacks:iron_backpack', 1),
    [
      'BBB',
      'BCB',
      'BBB'
    ],
    {
      B: 'minecraft:iron_block',
      C: 'sophisticatedbackpacks:backpack'
    }
  )
  event.shaped(
    Item.of('sophisticatedbackpacks:gold_backpack', 1),
    [
      'BBB',
      'BCB',
      'BBB'
    ],
    {
      B: 'minecraft:gold_block',
      C: 'sophisticatedbackpacks:iron_backpack'
    }
  )
  event.shaped(
    Item.of('sophisticatedbackpacks:diamond_backpack', 1),
    [
      'BBB',
      'BCB',
      'BBB'
    ],
    {
      B: 'minecraft:diamond_block',
      C: 'sophisticatedbackpacks:gold_backpack'
    }
  )

  // Remove recipes
  RECIPES_TO_REMOVE.forEach(recipe => {
    event.remove({ id: recipe })
  })
})