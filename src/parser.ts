import { parse as htmlParse } from "node-html-parser";
import { Request } from "express";
import fetch from "node-fetch";
import { Component } from "./index";

export type RenderFunction = (
	req: Request,
	state: Object,
	components: Record<string, Component>,
	html: string,
	serverScript: string,
	props?: Object,
	children?: string
) => Promise<string>;

export type RenderFunctionToExec = (
	req: Request,
	props?: Object,
	children?: string
) => Promise<string>;

// "new Function()" is a valid constructor in JS but AsyncFunction is not.
// With this, we can create async functions from a string
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

async function parseStaticTemplateLiteral(
	templateLiteral: string,
	context: Object
): Promise<string> {
	let fn = new AsyncFunction(
		...Object.keys(context),
		"return `" + templateLiteral + "`"
	);
	return fn(...Object.values(context));
}

function parseHtml(template: string): [html: string, serverScript: string] {
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

	return [root.innerHTML, serverScript];
}

// This takes a plain html string and returns a function that can render the page
export function parse(
	template: string,
	components: Record<string, Component>
): RenderFunctionToExec {
	let [html, serverScript] = parseHtml(template);

	// We create a state in this closure, so the server code can store data
	let state = {};

	// Now we can create a function that can render the page
	return (req: Request, props?: Object, children?: string) =>
		render(req, state, components, html, serverScript, props, children);
}

async function getComponent(
	name: string,
	parentReq: Request,
	components: Record<string, Component>
) {
	return async function (props: Object = {}, children: string) {
		return components[name](parentReq, props, children);
	};
}

async function render(
	req: Request,
	state: Object,
	components: Record<string, Component>,
	html: string,
	serverScript: string,
	props?: Object,
	children?: string
): Promise<string> {
	// The "scope" is all the available variables in the template
	let scope = {
		req, // The request (because it's full of useful information)
		props, // The props passed to the component
		global, // The global variable (because it could be useful)
		fetch, // The fetch function (to allow other sites to be fetched)
		state, // The state variable (to store data)
		getComponent: (name: string) => getComponent(name, req, components),
	};

	// We create a function from the server script, and we provide the scope arguments
	let serverFunction = new AsyncFunction(Object.keys(scope), serverScript);

	// The "bag" is eveything that the server script gives to the template
	// It's the user role to return an object in the server script (the bag)
	// We call the server script and pass our scope values to get the bag back
	let bag = await serverFunction(...Object.values(scope));

	if (children != null) {
		html = html.replace("<outlet></outlet>", children);
	}

	try {
		return parseStaticTemplateLiteral(html, {
			...(bag ?? {}),
			req,
			props,
			state,
		});
	} catch (e) {
		// If the function fails, we log it and return an empty string
		// so it doesn't break the template
		console.error(e);
		console.error(html);
		return "";
	}
}
