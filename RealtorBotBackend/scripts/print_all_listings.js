const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });
const watsonDiscovery = require('../services/watsonDiscovery');

async function printAllListings() {
  try {
    const result = await watsonDiscovery.getAllDocuments(
      process.env.PROPERTIES_COLLECTION,
      1,
      100 // Fetch up to 100 listings
    );
    if (!result.success) {
      console.error('Failed to fetch listings:', result.error);
      process.exit(1);
    }
    const hits = result.data.hits.hits;
    if (!hits || hits.length === 0) {
      console.log('No listings found.');
      return;
    }
    hits.forEach((hit, idx) => {
      console.log(`Listing #${idx + 1}:`);
      console.log(JSON.stringify(hit._source, null, 2));
      console.log('-----------------------------');
    });
  } catch (err) {
    console.error('Error fetching listings:', err);
  }
}

printAllListings(); 