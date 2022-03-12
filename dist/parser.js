import { parse as htmlParse } from "node-html-parser";
import fetch from "node-fetch";
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
export function parse(template) {
    let root = htmlParse(template);
    let serverScriptTag = root.querySelector("script[server]");
    let serverScript = "";
    if (serverScriptTag) {
        serverScript = serverScriptTag.innerHTML;
        serverScriptTag.remove();
    }
    let state = {};
    let computeTemplate = async function (req) {
        let scope = {
            req,
            global,
            fetch,
            state,
        };
        let serverFunction = new AsyncFunction(Object.keys(scope), serverScript);
        let bag = await serverFunction(...Object.values(scope));
        let template = root.outerHTML.replace(/{{(.*?)}}/gs, (_, token) => parseExpression(bag ?? {}, req, state, [...token].join("")));
        return template;
    };
    return computeTemplate;
}
function parseExpression(bag, req, state, code) {
    let bagKeys = Object.keys(bag);
    let bagValues = Object.values(bag);
    try {
        let inlineExpression = new Function("req", "state", ...bagKeys, "return " + code);
        let result = inlineExpression(req, state, ...bagValues) ?? "";
        if (Array.isArray(result)) {
            result = result.join("");
        }
        return result;
    }
    catch (e) {
        console.error("Bad expression :", code);
        console.error(e);
        return "";
    }
}
