const battle_blitz_advancements = [];

/**
 * @param {Menu} menu
 * @param {any} data
 */
function advancementMenu(menu, data) {
  if (!data.target) return;

  const player = menu.gui.player;
  const advancementProgress = player.getAdvancements();
  const allAdvancements = player.server.getAdvancements().getAllAdvancements();
  const completedAdvancements = [];

  for (const advancement of allAdvancements) {
    let progress = advancementProgress.getOrStartProgress(advancement);
    if (progress.isDone()) {
      completedAdvancements.push({
        id: advancement.id(),
        title: advancement.value(),
        advancement: advancement,
      });
    }
  }

  let max_rows = 4;
  let currentPage = data?.page || 0;
  let adsPerPage = MAX_COLUMNS * max_rows;

  let pages = Math.ceil(completedAdvancements.length / adsPerPage);

  completedAdvancements.sort((a, b) => b.timestamp - a.timestamp);
  let advancementsToShow = completedAdvancements;
  // TODO improve pagination
  if (advancementsToShow && advancementsToShow.length != 0) {
    for (let i = 0; i < advancementsToShow.length; i++) {
      // Skip entries from previous pages
      if (i < currentPage * adsPerPage) {
        continue;
      }
      // Break if the entry belongs to a page after the current page
      if (i >= (currentPage + 1) * adsPerPage) {
        break;
      }
      let advancement = advancementsToShow[i];
      let row = Math.floor((i % adsPerPage) / MAX_COLUMNS);
      let column = (i % adsPerPage) % MAX_COLUMNS;

      if (row >= max_rows) {
        break;
      }

      menu.gui.slot(column, row, (slot) => {
        slot.item = createMenuButton({
          title: `${advancement.id}`,
          description: [
            [ { text: "Test" } ]
          ],
          itemID: "minecraft:stick"
        })
      });
    }
  }
}
