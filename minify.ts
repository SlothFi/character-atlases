import * as fs from "fs";
import * as path from "path";
import { Worker, isMainThread, parentPort } from "worker_threads";
const minify = require("jsonminify");

const folderPath = "./atlases"; // Path to the folder containing the JSON files

if (isMainThread) {
  const files = fs.readdirSync(folderPath).filter((file) => file.endsWith(".json"));

  const numberOfWorkers = require("os").cpus().length - 1;
  let numberOfActiveWorkers = 0;

  function minifyJSON(worker: Worker) {
    const file = files.shift();
    if (file == undefined) {
      if (numberOfActiveWorkers === 0) {
        console.log("All JSON files minified.");
        process.exit(0);
      } else return;
    }

    const filePath = path.join(folderPath, file);
    console.log(`Minifying ${file} on thread #${worker.threadId}`);
    console.time(`Minified ${file}`);

    worker.postMessage(filePath);
    numberOfActiveWorkers++;
  }

  console.log("Minifying JSON files...");

  for (let i = 0; i < numberOfWorkers; i++) {
    const worker = new Worker(__filename);
    worker.on("message", (filePath: string) => {
      console.timeEnd(`Minified ${path.basename(filePath)}`);
      numberOfActiveWorkers--;

      minifyJSON(worker);
    });

    minifyJSON(worker);
  }
} else {
  parentPort?.on("message", (filePath: string) => {
    const jsonData = fs.readFileSync(filePath, "utf8");
    const minifiedData = minify(jsonData);

    fs.writeFileSync(filePath, minifiedData);
    parentPort?.postMessage(filePath);
  });
}
