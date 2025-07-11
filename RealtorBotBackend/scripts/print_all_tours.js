// print_all_tours.js
const watsonDiscovery = require('../services/watsonDiscovery');
require('dotenv').config({ path: '../config.env' });

async function printAllTours() {
  try {
    const result = await watsonDiscovery.getAllDocuments(
      process.env.TOURS_COLLECTION,
      1,
      1000 // Fetch up to 1000 tours
    );
    if (!result.success) {
      console.error('Failed to fetch tours:', result.error);
      process.exit(1);
    }
    const tours = result.data.hits.hits.map(hit => hit._source);
    if (tours.length === 0) {
      console.log('No tours found.');
      return;
    }
    tours.forEach((tour, idx) => {
      console.log(`--- Tour #${idx + 1} ---`);
      console.log(JSON.stringify(tour, null, 2));
    });
    console.log(`\nTotal tours: ${tours.length}`);
  } catch (err) {
    console.error('Error printing tours:', err);
  }
}

printAllTours(); 