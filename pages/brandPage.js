
const { location } = require("@wix/site-location");
async function brandPageOnReady(_$w,brand) {
    const decodedBrand = decodeURIComponent(brand);
    _$w('#seeJobsButton').onClick(async () => {
       await location.to(`/search?brand=${decodedBrand}`);
    });
  }

module.exports = {
    brandPageOnReady,
  };