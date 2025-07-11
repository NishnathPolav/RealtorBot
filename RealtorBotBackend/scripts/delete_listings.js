const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });
const watsonDiscovery = require('../services/watsonDiscovery');

const idsToDelete = [
  "1751150807856",
  "1751296233837",
  "1751297205846",
  "1751330625495"
];

async function deleteListings() {
  for (const id of idsToDelete) {
    try {
      const result = await watsonDiscovery.deleteDocument(
        process.env.PROPERTIES_COLLECTION,
        id
      );
      if (result.success) {
        console.log(`Deleted listing with id: ${id}`);
      } else {
        console.error(`Failed to delete listing with id: ${id}`, result.error);
      }
    } catch (err) {
      console.error(`Error deleting listing with id: ${id}`, err);
    }
  }
}

deleteListings(); 