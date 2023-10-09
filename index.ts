import path from "path";
import { readdirSync } from "fs";
import * as os from "os";
import * as fs from "fs";
import { Worker, isMainThread, parentPort } from "node:worker_threads";
import { execSync } from "child_process";
const minify = require("jsonminify");

if (isMainThread) {
  const characters = readdirSync("./characters");
  const numberOfWorkers = os.cpus().length - 1;
  let numberOfActiveWorkers = 0;

  function generateAtlas(worker: Worker) {
    const characterId = characters.shift();
    if (characterId === undefined) {
      if (numberOfActiveWorkers === 0) {
        console.timeEnd("GENERATED CHARACTER ATLASES");
        process.exit(1);
      } else return;
    }

    console.log(`GENERATING ${characterId} on thread #${worker.threadId}`);
    console.time(`GENERATED ${characterId}`);

    worker.postMessage(characterId);
    numberOfActiveWorkers++;
  }

  console.time("GENERATED CHARACTER ATLASES");

  for (let _ = 0; _ < numberOfWorkers; _++) {
    const worker = new Worker(__filename).on("message", (characterId) => {
      console.timeEnd(`GENERATED ${characterId}`);
      numberOfActiveWorkers--;

      // Modify JSON file after TexturePacker completes
      const atlasJsonPath = path.join("atlases", `${characterId}.json`);
      const jsonData = fs.readFileSync(atlasJsonPath, "utf8");
      const atlasData = JSON.parse(jsonData);

      atlasData.textures.forEach((texture: any) => {
        texture.frames.forEach((frame: any) => {
          const filename = frame.filename;
          const anchor = calculateAnchor(filename);
          frame.anchor = anchor;
        });
      });

      fs.writeFileSync(atlasJsonPath, JSON.stringify(atlasData));

      // Minify JSON after modifying
      const minifiedData = minify(JSON.stringify(atlasData));
      fs.writeFileSync(atlasJsonPath, minifiedData);

      generateAtlas(worker);
    });

    generateAtlas(worker);
  }
} else {
  parentPort!.on("message", (characterId: string) => {
    execSync(
      `TexturePacker config.tps --sheet atlases/${characterId}.png --data atlases/${characterId}.json characters/${characterId}`
    );

    // Minify JSON after TexturePacker completes
    const atlasJsonPath = path.join("atlases", `${characterId}.json`);
    const jsonData = fs.readFileSync(atlasJsonPath, "utf8");
    const minifiedData = minify(jsonData);
    fs.writeFileSync(atlasJsonPath, minifiedData);

    parentPort!.postMessage(characterId);
  });
}

function calculateAnchor(filename: any) {
  const anchors: any = {
    "idle": { x: 0.5, y: 0.76 },
    "run-down": { x: 0.5, y: 0.83 },
    "run-right": { x: 0.5, y: 0.84 },
    "run-up": { x: 0.5, y: 0.84 },
    "run-left": { x: 0.5, y: 0.84 },
    "skate-down": { x: 0.5, y: 0.78 },
    "skate-up": { x: 0.5, y: 0.78 },
    "skate-left": { x: 0.5, y: 0.79 },
    "skate-right": { x: 0.5, y: 0.79 },
  };

  const key = Object.keys(anchors).find((key) => filename.includes(key));
  return key ? anchors[key] : { x: 0.5, y: 0.78 };
}
