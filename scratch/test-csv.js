import { streamAllCSVsToDisk } from '../node_modules/gitnexus/dist/core/lbug/csv-generator.js';
import path from 'path';

const mockGraph = {
  iterNodes: function* () {
    yield { id: 'file:test.js', label: 'File', properties: { name: 'test.js', filePath: 'test.js' } };
  },
  iterRelationships: function* () {
  }
};

async function test() {
  console.log("Starting CSV streaming test...");
  try {
    const csvDir = 'C:/Users/thanh/OneDrive/Documents/Project/GoiFlow/.gitnexus/test_csv';
    const repoPath = 'C:/Users/thanh/OneDrive/Documents/Project/GoiFlow';
    const res = await streamAllCSVsToDisk(mockGraph, repoPath, csvDir);
    console.log("CSV streaming test finished successfully!", res);
  } catch (err) {
    console.error("CSV streaming failed:", err);
  }
}
test();
