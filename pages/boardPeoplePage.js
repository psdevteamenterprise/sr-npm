
const { location } = require("@wix/site-location");

async function boardPeoplePageOnReady(_$w,) {
    console.log("boardPeoplePageOnReady");
    await bindBoardPeopleRepeaters(_$w);
}

async function bindBoardPeopleRepeaters(_$w) {
    console.log("bindBoardPeopleRepeaters");
    _$w('#directorsRepeaterItem').onClick((event) => {
        const $item = _$w.at(event.context);
        const clickedItemData = $item('#dynamicDataset').getCurrentItem();
        console.log("clickedItemData directors: ",clickedItemData);
        location.to(`/${clickedItemData['link-board-people-title_fld']}`);

    });

    _$w('#executivesRepeaterItem').onClick((event) => {
        const $item = _$w.at(event.context);
        const clickedItemData = $item('#dataset1').getCurrentItem();
        console.log("clickedItemData executives: ",clickedItemData);
        location.to(`/${clickedItemData['link-board-people-title_fld']}`);

    });
}
module.exports = {
    boardPeoplePageOnReady,
  };