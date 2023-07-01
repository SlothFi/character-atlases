import path from "path";
import { readdirSync } from "fs";
import * as os from "os";
import { Worker, isMainThread, parentPort } from "node:worker_threads";
import { execSync } from "child_process";

if (isMainThread) {
  const characters = readdirSync("./characters");
  const numberOfWorkers = os.cpus().length - 1;
  /** keep track of number of active workers to know when all of them finished */
  let numberOfActiveWorkers = 0;

  /**
   * Generate atlas for next character using worker
   */
  function generateAtlas(worker: Worker) {
    /** Get next character */
    const characterId = characters.shift();
    /** Check if we've ran out of characters */
    if (characterId == undefined)
      if (numberOfActiveWorkers == 0) {
        /** Check if all other workers are inactive, meaning that whole process is finished */
        console.timeEnd("GENERATED CHARACTER ATLASES");
        process.exit(1);
      } else return;

    console.log(`GENERATING ${characterId} on thread #${worker.threadId}`);
    console.time(`GENERATED ${characterId}`);
    /** Trigger atlas generation in worker */
    worker.postMessage(characterId);
    numberOfActiveWorkers++;
  }

  console.time("GENERATED CHARACTER ATLASES");

  for (let _ = 0; _ < numberOfWorkers; _++) {
    const worker = new Worker(__filename).on("message", (characterId) => {
      /** Log that atlas has generated */
      console.timeEnd(`GENERATED ${characterId}`);
      numberOfActiveWorkers--;

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
      /**
       * Execute Texture packer with all the configuration stored in `config.tps` file
       */
      `TexturePacker config.tps --sheet atlases/${characterId}.png --data atlases/${characterId}.json characters/${characterId}`
    );
    parentPort!.postMessage(characterId);
  });
}
