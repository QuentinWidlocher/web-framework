import express from "express";
import { opendir, readFile } from "fs/promises";
import { parse } from "./parser.js";
import { watch } from "fs";

// Here we simply create default parameters for our server.
let defaultConfig = {
	port: 3000,
	directory: "./",
	expressConfig: (app: ReturnType<typeof express>) => {
		// Here we could do anything we want with the express app.
		// By default I like to have this middleware to handle form data.
		app.use(express.urlencoded({ extended: true }));
	},
};

async function start({ port, directory, expressConfig }: typeof defaultConfig) {
	// First thing we do is create our express app.
	const app = express();

	// We use the user (or default) express config.
	expressConfig(app);

	// We list the files in the provided directory
	let dir = await opendir(directory);

	// We loop over all the files in the directory
	let nextDir = await dir.read();
	let pages = 0;
	while (nextDir != null) {
		let splittedDirName = nextDir.name.split(".");

		// We don't serve the server.js file
		if (nextDir.name == "server.js") {
			nextDir = await dir.read();
			continue;
		}

		// If the file is an html file, we parse and serve it
		if (splittedDirName[splittedDirName.length - 1] == "html") {
			// We get the "route" from the file (basically the same as the file name without the extension)
			// "index" also get routed to "/"
			let routeName = splittedDirName[0].replace("index", "");
			let fileName = nextDir.name;

			// We read the file content
			let fileBuffer = await readFile(`${directory}/${fileName}`);
			let file = fileBuffer.toString();

			// We parse the file content and create a function that can render the page
			// This run only when the server is started, each visit to the route only
			// uses this function to render the page
			let computeTemplate = parse(file);

			// We declare every http verb for this route
			app.all(`/${routeName}`, async (req, res) => {
				// We render the page	and returns it as html
				let template = await computeTemplate(req);
				res.setHeader("Content-Type", "text/html");
				res.send(template);
			});
		} else {
			// If the file is not an html file, we just serve it
			app.use(
				`/${nextDir.name}`,
				express.static(`${directory}/${nextDir.name}`)
			);
		}

		// We increment the number of pages for information purposes
		nextDir = await dir.read();
		pages++;
	}

	// Now that each pages are declared we can start the server
	return app.listen(port, () => {
		console.log(
			`Your Web Framework is listening on port ${port} with ${pages} pages ready`
		);
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

	watch(directory, async () => {
		server.close();
		server = await start({ port, directory, expressConfig });
	});
}
