
const { location } = require("@wix/site-location");
async function brandPageOnReady(_$w,brand) {
    const decodedBrand = decodeURIComponent(brand);
    _$w('#seeJobsButton').onClick(() => {
      location.to(`/search?brand=${decodedBrand}`);
    });
  }

module.exports = {
    brandPageOnReady,
  };