import { parse as htmlParse } from "node-html-parser";
import { Request } from "express";
import fetch from "node-fetch";

// "new Function()" is a valid constructor in JS but AsyncFunction is not.
// With this, we can create async functions from a string
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// This takes a plain html string and returns a function that can render the page
export function parse(template: string) {
	// We use the node-html-parser to parse the html and get a dom tree
	let root = htmlParse(template);

	// We get the server script inside the html
	let serverScriptTag = root.querySelector("script[server]");

	// We extract the script and delete the tag (it should never get sent to the client)
	let serverScript = "";
	if (serverScriptTag) {
		serverScript = serverScriptTag.innerHTML;
		serverScriptTag.remove();
	}

	// Now we can create a function that can render the page
	let computeTemplate = async function (req: Request) {
		// The "scope" is all the available variables in the template
		let scope = {
			req, // The request (because it's full of useful information)
			global, // The global variable (because it could be useful)
			fetch, // The fetch function (to allow other sites to be fetched)
		};

		// We create a function from the server script, and we provide the scope arguments
		let serverFunction = new AsyncFunction(Object.keys(scope), serverScript);

		// The "bag" is eveything that the server script gives to the template
		// It's the user role to return an object in the server script (the bag)
		// We call the server script and pass our scope values to get the bag back
		let bag = await serverFunction(...Object.values(scope));

		// Here we parse the html and replace all the mustache with their expressions
		// Every mustache has access to the bag and the request
		let template = root.outerHTML.replace(/{{(.*?)}}/gs, (_, token) =>
			parseExpression(bag, req, [...token].join(""))
		);

		// We return the template as a string, it's completely
		return template;
	};

	return computeTemplate;
}

// The is use to parse every mustache and replace it with the expression it declares
function parseExpression(bag: Object, req: Request, code: string): string {
	// We'll need our bag keys and values to create a function and then execute it
	let bagKeys = Object.keys(bag);
	let bagValues = Object.values(bag);

	try {
		// We try to create a function and we FORCE a return because
		// mustaches must be expression, not imperative code
		let inlineExpression = new Function("req", ...bagKeys, "return " + code);

		// We execute the function and return the result
		// We default to an empty string if the result is empty
		let result = inlineExpression(req, ...bagValues) ?? "";

		// If we get an array, we join it without any commas or anything
		// so that we can easily map over values and return arrays of tags
		if (Array.isArray(result)) {
			result = result.join("");
		}

		return result;
	} catch (e) {
		// If the function fails, we log it and return an empty string
		// so it doesn't break the template
		console.error("Bad expression :", code);
		console.error(e);
		return "";
	}
}
