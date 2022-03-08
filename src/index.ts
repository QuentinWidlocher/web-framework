import express from "express";
import { opendir, readFile } from "fs/promises";
import { parse } from "./parser.js";

let defaultConfig = {
	port: 3000,
	directory: "./",
};

export default async function run({
	port = defaultConfig.port,
	directory = defaultConfig.directory,
} = defaultConfig) {
	const app = express();

	// We list the files in the provided directory
	let dir = await opendir(directory);

	let nextDir = await dir.read();
	let pages = 0;
	while (nextDir != null) {
		console.log(nextDir.name);
		let splittedDirName = nextDir.name.split(".");
		if (splittedDirName[splittedDirName.length - 1] != "html") {
			nextDir = await dir.read();
			continue;
		}

		let routeName = splittedDirName[0].replace("index", "");

		let fileBuffer = await readFile(`${directory}/${nextDir.name}`);
		let file = fileBuffer.toString();
		let computeTemplate = parse(file);

		app.get(`/${routeName}`, async (req, res) => {
			let template = await computeTemplate(req);
			res.setHeader("Content-Type", "text/html");
			res.send(template);
		});
		nextDir = await dir.read();

		pages++;
	}

	app.listen(port, () => {
		console.log(
			`Your Web Framework is listening on port ${port} with ${pages} pages ready`
		);
	});
}
