import { runFullAnalysis } from '../node_modules/gitnexus/dist/core/run-analyze.js';

async function test() {
  const repoPath = 'C:/Users/thanh/OneDrive/Documents/Project/GoiFlow';
  try {
    const res = await runFullAnalysis(repoPath, { force: true }, {
      onProgress: (phase, pct, msg) => console.log(`[PROGRESS] ${pct}%: ${msg}`),
      onLog: (msg) => console.log(`[LOG] ${msg}`)
    });
    console.log("Analysis Res:", res);
    process.exit(0);
  } catch (err) {
    console.error("ANALYSIS FAILED:", err);
    console.error(err.stack);
    process.exit(1);
  }
}
test();
