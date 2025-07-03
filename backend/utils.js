export async function chunkedBulkOperation({ items, chunkSize, processChunk }) {
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await processChunk(chunk, Math.floor(i / chunkSize) + 1);
    }
}