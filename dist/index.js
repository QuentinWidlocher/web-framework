import express from "express";
import { readFile } from "fs/promises";
import { parse } from "./parser.js";
import chokidar from "chokidar";
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
    let componentNb = 0;
    let pageNb = 0;
    let assetNb = 0;
    let components = {};
    await new Promise((resolve) => {
        execFile("find", [directory, "-name", "*.*"], async (err, stdout, stderr) => {
            let filesList = stdout.split("\n");
            for (let filePath of filesList) {
                let file = filePath.replace(`${directory}/`, "");
                if (file == "server.js" || file == "") {
                    continue;
                }
                if (file.endsWith(".html")) {
                    let routeName = file
                        .replace(".html", "")
                        .replace("index", "")
                        .replace(/\/$/m, "");
                    let fileBuffer = await readFile(`${directory}/${file}`);
                    let fileContent = fileBuffer.toString();
                    if (file.includes("$") && file.endsWith(".html")) {
                        componentNb++;
                        let componentName = routeName.replace("$", "");
                        console.debug("Registering Component :", componentName);
                        let computeComponent = parse(fileContent, components);
                        components[componentName] = computeComponent;
                    }
                    else {
                        pageNb++;
                        console.debug(`Registering Page : /${routeName} to ${directory}/${file}`);
                        let computeTemplate = parse(fileContent, components);
                        app.all(`/${routeName}`, async (req, res) => {
                            console.debug("Serving route", routeName);
                            try {
                                let template = await computeTemplate(req);
                                res.setHeader("Content-Type", "text/html");
                                res.send(template);
                            }
                            catch (error) {
                                console.error(error);
                                res.setHeader("Content-Type", "text/html");
                                res.send(error);
                            }
                        });
                    }
                }
                else {
                    assetNb++;
                    console.debug("Registering Asset :", file);
                    app.use(`/${file}`, express.static(`${directory}/${file}`));
                }
            }
            resolve();
        });
    });
    return app.listen(port, () => {
        console.log("");
        console.log(`Listening on port ${port} with ${pageNb} pages, ${assetNb} assets and ${componentNb} components`);
        console.log(`Visit http://localhost:${port}`);
        console.log("--------------------------------------");
    });
}
export default async function run({ port = defaultConfig.port, directory = defaultConfig.directory, expressConfig = defaultConfig.expressConfig, } = defaultConfig) {
    let server = await start({ port, directory, expressConfig });
    chokidar.watch(directory).on("change", async (file) => {
        console.log(`${file} changed, restarting server`);
        console.log("--------------------------------------");
        server.close().on("close", async () => {
            try {
                server = await start({ port, directory, expressConfig });
            }
            catch (error) {
                if (isError(error) && error.code != "EADDRINUSE") {
                    console.error(error);
                }
            }
        });
    });
}
function isError(error) {
    return error instanceof Error;
}
