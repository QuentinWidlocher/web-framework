import { parse as htmlParse } from "node-html-parser";
import fetch from "node-fetch";
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
function parseStaticTemplateLiteral(templateLiteral, context) {
    let fn = new Function(...Object.keys(context), "return `" + templateLiteral + "`");
    return fn(...Object.values(context));
}
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
        try {
            return parseStaticTemplateLiteral(root.innerHTML, {
                ...(bag ?? {}),
                req,
                state,
            });
        }
        catch (e) {
            console.error(e);
            return "";
        }
    };
    return computeTemplate;
}
