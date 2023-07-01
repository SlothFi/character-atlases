import path from "path";
import { readdirSync } from "fs";
import * as os from "os";
import { Worker, isMainThread, parentPort } from "node:worker_threads";
import { execSync } from "child_process";

if (isMainThread) {
  const characters = readdirSync("./characters");

  /**
   * Generate atlas for next character using worker
   */
  function generateAtlas(worker: Worker) {
    /** Get next character */
    const characterId = characters.shift();
    if (characterId == undefined) return;
    console.log(`GENERATING ${characterId}`);
    console.time(`GENERATED ${characterId}`);
    /** Trigger atlas generation in worker */
    worker.postMessage(characterId);
  }

  for (let _ = 0; _ < os.cpus().length; _++) {
    const worker = new Worker(__filename).on("message", (characterId) => {
      /** Log that atlas has generated */
      console.timeEnd(`GENERATED ${characterId}`);

      /** Generate Another atlas */
      generateAtlas(worker);
    });
    /** Kick off atlas generation */
    generateAtlas(worker);
  }
} else {
  /**
   * WORKER STUFF
   */

  /**
   * Listen for message and Execute texture packer
   */
  parentPort!.on("message", (characterId: string) => {
    execSync(
      `TexturePacker config.tps --sheet atlases/${characterId}.png --data atlases/${characterId}.json characters/${characterId}`
    );
    parentPort!.postMessage(characterId);
  });
}
