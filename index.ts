import { execSync } from "child_process";
import { readdirSync } from "fs";
import path from "path";

const assetsDirectory = path.join(__dirname, "assets");

for (const characterId of readdirSync(assetsDirectory)) {
  console.log(`GENERATING ${characterId}`);
  console.time(`GENERATED ${characterId}`);
  execSync(
    `TexturePacker config.tps --sheet atlases/${characterId}.png --data atlases/${characterId}.json assets/${characterId}`,
    { stdio: "inherit" }
  );
  console.timeEnd(`GENERATED ${characterId}`);
}
