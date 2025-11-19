
const { location } = require("@wix/site-location");
async function boardPeoplePageOnReady(_$w,) {

    await bindBoardPeopleRepeaters(_$w);


  }

async function bindBoardPeopleRepeaters(_$w) {

    _$w('#directorsRepeaterItem').onClick((event) => {
        const $item = _$w.at(event.context);
        const clickedItemData = $item('#dynamicDataset').getCurrentItem();
        location.to(`/${clickedItemData['link-board-people-title_fld']}`);

    });

    _$w('#executivesRepeaterItem').onClick((event) => {
        const $item = _$w.at(event.context);
        const clickedItemData = $item('#dataset1').getCurrentItem();
        location.to(`/${clickedItemData['link-board-people-title_fld']}`);

    });
}
module.exports = {
    boardPeoplePageOnReady,
  };