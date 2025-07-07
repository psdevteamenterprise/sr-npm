async function chunkedBulkOperation({ items, chunkSize, processChunk }) {
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await processChunk(chunk, Math.floor(i / chunkSize) + 1);
    }
}

async function delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = {
    chunkedBulkOperation,
    delay,
};