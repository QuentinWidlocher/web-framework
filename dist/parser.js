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
    let computeTemplate = async function (req) {
        let scope = {
            req,
            global,
            fetch,
        };
        let serverFunction = new AsyncFunction(Object.keys(scope), serverScript);
        let bag = await serverFunction(...Object.values(scope));
        let bagKeys = Object.keys(bag);
        let bagValues = Object.values(bag);
        let template = root.outerHTML.replace(/\$\{(.*)\}/g, function (match, token) {
            let inlineExpression = new Function("req", ...bagKeys, "return " + token);
            return inlineExpression(req, ...bagValues);
        });
        return template;
    };
    return computeTemplate;
}
