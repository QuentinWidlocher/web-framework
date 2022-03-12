import express from "express";
import { opendir, readFile } from "fs/promises";
import { parse } from "./parser.js";
import { watch } from "fs";
let defaultConfig = {
    port: 3000,
    directory: "./",
    expressConfig: (app) => {
        app.use(express.urlencoded({ extended: true }));
    },
};
async function start({ port, directory, expressConfig }) {
    const app = express();
    expressConfig(app);
    let dir = await opendir(directory);
    let nextDir = await dir.read();
    let pages = 0;
    while (nextDir != null) {
        let splittedDirName = nextDir.name.split(".");
        if (nextDir.name == "server.js") {
            nextDir = await dir.read();
            continue;
        }
        if (splittedDirName[splittedDirName.length - 1] == "html") {
            let routeName = splittedDirName[0].replace("index", "");
            let fileName = nextDir.name;
            let fileBuffer = await readFile(`${directory}/${fileName}`);
            let file = fileBuffer.toString();
            let computeTemplate = parse(file);
            app.all(`/${routeName}`, async (req, res) => {
                let template = await computeTemplate(req);
                res.setHeader("Content-Type", "text/html");
                res.send(template);
            });
        }
        else {
            app.use(`/${nextDir.name}`, express.static(`${directory}/${nextDir.name}`));
        }
        nextDir = await dir.read();
        pages++;
    }
    return app.listen(port, () => {
        console.log(`Your Web Framework is listening on port ${port} with ${pages} pages ready`);
    });
}
export default async function run({ port = defaultConfig.port, directory = defaultConfig.directory, expressConfig = defaultConfig.expressConfig, } = defaultConfig) {
    let server = await start({ port, directory, expressConfig });
    watch(directory, async () => {
        server.close();
        server = await start({ port, directory, expressConfig });
    });
}
