function handleOnLocationClick(event, repeaterId, mapId, _$w) {
    const FOCUS_ZOOM = 13;
    const { itemId } = event.context;
    const itemData = _$w(repeaterId).data.find(item => item._id === itemId);

    const location = itemData.locationAddress.location;
  
    //@ts-ignore
    _$w(mapId).setCenter(location);
    //@ts-ignore
    _$w(mapId).setZoom(FOCUS_ZOOM);
}

module.exports = {
    handleOnLocationClick
  };