import { parse as htmlParse } from "node-html-parser";
import { Request } from "express";
import fetch from "node-fetch";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export function parse(template: string) {
	let root = htmlParse(template);
	let serverScriptTag = root.querySelector("script[server]");

	let serverScript = "";
	if (serverScriptTag) {
		serverScript = serverScriptTag.innerHTML;
		serverScriptTag.remove();
	}

	let computeTemplate = async function (req: Request) {
		let scope = {
			req,
			global,
			fetch,
		};

		let serverFunction = new AsyncFunction(Object.keys(scope), serverScript);

		let bag = await serverFunction(...Object.values(scope));

		let template = root.outerHTML.replace(/{{(.*?)}}/gs, (match, token) =>
			parseExpression(bag, req, [...token].join(""))
		);

		return template;
	};

	return computeTemplate;
}

function parseExpression(bag: Object, req: Request, code: string): string {
	let bagKeys = Object.keys(bag);
	let bagValues = Object.values(bag);

	try {
		let inlineExpression = new Function("req", ...bagKeys, "return " + code);

		// We default to an empty string if the expression is not found
		let result = inlineExpression(req, ...bagValues) ?? "";

		// If we get an array, we join it without any commas or anything
		if (Array.isArray(result)) {
			result = result.join("");
		}

		return result;
	} catch (e) {
		console.error("Bad expression :", code);
		console.error(e);
		return "";
	}
}
