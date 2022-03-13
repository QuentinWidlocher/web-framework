import express from "express";
import { readFile } from "fs/promises";
import { parse } from "./parser.js";
import { watch } from "fs";
import { execFile } from "child_process";
let defaultConfig = {
    port: 3000,
    directory: ".",
    expressConfig: (app) => {
        app.use(express.urlencoded({ extended: true }));
    },
};
async function start({ port, directory, expressConfig }) {
    directory = directory.replace(/\/$/, "");
    const app = express();
    expressConfig(app);
    let pages = 0;
    let assets = 0;
    await new Promise((resolve) => {
        execFile("find", [directory], async (err, stdout, stderr) => {
            let filesList = stdout.split("\n");
            for (let filePath of filesList) {
                let file = filePath.replace(`${directory}/`, "");
                if (file == "server.js" || file == "") {
                    continue;
                }
                let splittedDirName = file.split(".");
                if (splittedDirName[splittedDirName.length - 1] == "html") {
                    let routeName = splittedDirName[0].replace("index", "");
                    let fileName = file;
                    let fileBuffer = await readFile(`${directory}/${fileName}`);
                    let fileContent = fileBuffer.toString();
                    let computeTemplate = parse(fileContent);
                    pages++;
                    app.all(`/${routeName}`, async (req, res) => {
                        let template = await computeTemplate(req);
                        res.setHeader("Content-Type", "text/html");
                        res.send(template);
                    });
                }
                else {
                    assets++;
                    app.use(`/${file}`, express.static(`${directory}/${file}`));
                }
            }
            resolve();
        });
    });
    return app.listen(port, () => {
        console.log(`Listening on port ${port} with ${pages} pages and ${assets} assets`);
        console.log(`Visit http://localhost:${port}`);
    });
}
export default async function run({ port = defaultConfig.port, directory = defaultConfig.directory, expressConfig = defaultConfig.expressConfig, } = defaultConfig) {
    let server = await start({ port, directory, expressConfig });
    watch(directory, async (_, file) => {
        console.log(`${file} changed, restarting server`);
        console.log("--------------------------------------");
        server.close().on("close", async () => {
            server = await start({ port, directory, expressConfig });
        });
    });
}
