import express from "express";
import { opendir, readFile } from "fs/promises";
import { parse } from "./parser.js";

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

// This is our server entrypoint
export default async function run({
	port = defaultConfig.port,
	directory = defaultConfig.directory,
	expressConfig = defaultConfig.expressConfig,
} = defaultConfig) {
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

			// We declare every http verb for this route
			app.all(`/${routeName}`, async (req, res) => {
				// We read the file content
				let fileBuffer = await readFile(`${directory}/${fileName}`);
				let file = fileBuffer.toString();

				// We parse the file content and create a function that can render the page
				// This could be above the app.all() to prevent parsing the file on each visit
				// It would enhance performance but also disable the ability to edit the page
				// while the server is running.
				let computeTemplate = parse(file);

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
	app.listen(port, () => {
		console.log(
			`Your Web Framework is listening on port ${port} with ${pages} pages ready`
		);
	});
}
