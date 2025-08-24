function getRandomPosition(positions) {
    return positions[Math.floor(Math.random() * positions.length)];
}

module.exports = {
    getRandomPosition
}