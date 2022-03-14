import express, { Request } from "express";
import { opendir, readFile } from "fs/promises";
import { parse, RenderFunctionToExec } from "./parser.js";
import chokidar from "chokidar";
import { execFile } from "child_process";

// Here we simply create default parameters for our server.
let defaultConfig = {
	port: 3000,
	directory: ".",
	expressConfig: (app: ReturnType<typeof express>) => {
		// Here we could do anything we want with the express app.
		// By default I like to have this middleware to handle form data.
		app.use(express.urlencoded({ extended: true }));
	},
};

export type Component = RenderFunctionToExec;

async function start({ port, directory, expressConfig }: typeof defaultConfig) {
	// We remove the trailing slash from the directory
	directory = directory.replace(/\/$/, "");

	// First thing we do is create our express app.
	const app = express();

	// We use the user (or default) express config.
	expressConfig(app);

	let componentNb = 0;
	let pageNb = 0;
	let assetNb = 0;

	let components: Record<string, Component> = {};

	await new Promise<void>((resolve) => {
		execFile(
			"find",
			[directory, "-name", "*.*"],
			async (err, stdout, stderr) => {
				let filesList = stdout.split("\n");

				for (let filePath of filesList) {
					let file = filePath.replace(`${directory}/`, "");

					// We don't serve the server.js file
					if (file == "server.js" || file == "") {
						continue;
					}

					// If the file is an html file, we parse and serve it
					if (file.endsWith(".html")) {
						// We get the "route" from the file (basically the same as the file name without the extension)
						// "index" also get routed to "/"
						let routeName = file
							.replace(".html", "")
							.replace("index", "")
							.replace(/\/$/m, "");

						// We read the file content
						let fileBuffer = await readFile(`${directory}/${file}`);
						let fileContent = fileBuffer.toString();

						if (file.includes("$") && file.endsWith(".html")) {
							componentNb++;
							let componentName = routeName.replace("$", "");
							console.debug("Registering Component :", componentName);
							let computeComponent = parse(fileContent, components);
							components[componentName] = computeComponent;
						} else {
							pageNb++;

							console.debug(
								`Registering Page : /${routeName} to ${directory}/${file}`
							);

							// We parse the file content and create a function that can render the page
							// This run only when the server is started, each visit to the route only
							// uses this function to render the page
							let computeTemplate = parse(fileContent, components);

							// We declare every http verb for this route
							app.all(`/${routeName}`, async (req, res) => {
								console.debug("Serving route", routeName);

								// We render the page	and returns it as html
								try {
									let template = await computeTemplate(req);
									res.setHeader("Content-Type", "text/html");
									res.send(template);
								} catch (error) {
									console.error(error);
									res.setHeader("Content-Type", "text/html");
									res.send(error);
								}
							});
						}
					} else {
						assetNb++;

						console.debug("Registering Asset :", file);

						// If the file is not an html file, we just serve it
						app.use(`/${file}`, express.static(`${directory}/${file}`));
					}
				}
				resolve();
			}
		);
	});

	// Now that each pages are declared we can start the server
	return app.listen(port, () => {
		console.log("");
		console.log(
			`Listening on port ${port} with ${pageNb} pages, ${assetNb} assets and ${componentNb} components`
		);
		console.log(`Visit http://localhost:${port}`);
		console.log("--------------------------------------");
	});
}

// This is our server entrypoint
export default async function run({
	port = defaultConfig.port,
	directory = defaultConfig.directory,
	expressConfig = defaultConfig.expressConfig,
} = defaultConfig) {
	// We start once and then we watch the directory for changes
	let server = await start({ port, directory, expressConfig });

	chokidar.watch(directory).on("change", async (file) => {
		console.log(`${file} changed, restarting server`);
		console.log("--------------------------------------");
		server.close().on("close", async () => {
			try {
				server = await start({ port, directory, expressConfig });
			} catch (error) {
				if (isError(error) && error.code != "EADDRINUSE") {
					console.error(error);
				}
			}
		});
	});
}

function isError(error: any): error is NodeJS.ErrnoException {
	return error instanceof Error;
}
