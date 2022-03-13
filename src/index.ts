import express from "express";
import { opendir, readFile } from "fs/promises";
import { parse } from "./parser.js";
import { watch } from "fs";
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

async function start({ port, directory, expressConfig }: typeof defaultConfig) {
	// We remove the trailing slash from the directory
	directory = directory.replace(/\/$/, "");

	// First thing we do is create our express app.
	const app = express();

	// We use the user (or default) express config.
	expressConfig(app);

	let pages = 0;
	let assets = 0;

	await new Promise<void>((resolve) => {
		execFile("find", [directory], async (err, stdout, stderr) => {
			let filesList = stdout.split("\n");

			for (let filePath of filesList) {
				let file = filePath.replace(`${directory}/`, "");

				// We don't serve the server.js file
				if (file == "server.js" || file == "") {
					continue;
				}

				let splittedDirName = file.split(".");

				// If the file is an html file, we parse and serve it
				if (splittedDirName[splittedDirName.length - 1] == "html") {
					// We get the "route" from the file (basically the same as the file name without the extension)
					// "index" also get routed to "/"
					let routeName = splittedDirName[0].replace("index", "");
					let fileName = file;

					// We read the file content
					let fileBuffer = await readFile(`${directory}/${fileName}`);
					let fileContent = fileBuffer.toString();

					// We parse the file content and create a function that can render the page
					// This run only when the server is started, each visit to the route only
					// uses this function to render the page
					let computeTemplate = parse(fileContent);

					pages++;

					// We declare every http verb for this route
					app.all(`/${routeName}`, async (req, res) => {
						// We render the page	and returns it as html
						let template = await computeTemplate(req);
						res.setHeader("Content-Type", "text/html");
						res.send(template);
					});
				} else {
					assets++;

					// If the file is not an html file, we just serve it
					app.use(`/${file}`, express.static(`${directory}/${file}`));
				}
			}
			resolve();
		});
	});

	// Now that each pages are declared we can start the server
	return app.listen(port, () => {
		console.log(
			`Listening on port ${port} with ${pages} pages and ${assets} assets`
		);
		console.log(`Visit http://localhost:${port}`);
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

	watch(directory, async (_, file) => {
		console.log(`${file} changed, restarting server`);
		console.log("--------------------------------------");
		server.close().on("close", async () => {
			server = await start({ port, directory, expressConfig });
		});
	});
}
