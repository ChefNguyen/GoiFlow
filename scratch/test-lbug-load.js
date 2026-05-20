import { initLbug, closeLbug, loadGraphToLbug } from '../node_modules/gitnexus/dist/core/lbug/lbug-adapter.js';

const mockGraph = {
  iterNodes: function* () {
    yield { id: 'File:test.js', label: 'File', properties: { name: 'test.js', filePath: 'test.js' } };
  },
  iterRelationships: function* () {
  }
};

async function test() {
  console.log("Starting Lbug Load test...");
  const dbPath = 'C:/Users/thanh/OneDrive/Documents/Project/GoiFlow/.gitnexus/test_lbug_db';
  const storagePath = 'C:/Users/thanh/OneDrive/Documents/Project/GoiFlow/.gitnexus';
  const repoPath = 'C:/Users/thanh/OneDrive/Documents/Project/GoiFlow';

  try {
    console.log("Initializing Lbug...");
    await initLbug(dbPath);
    console.log("Lbug Initialized! Loading graph...");
    const res = await loadGraphToLbug(mockGraph, repoPath, storagePath, (msg) => {
      console.log(`[LBUG PROGRESS] ${msg}`);
    });
    console.log("Load success! Result:", res);
  } catch (err) {
    console.error("Lbug Load failed:", err);
  } finally {
    console.log("Closing Lbug...");
    await closeLbug();
    console.log("Closed.");
  }
}
test();
