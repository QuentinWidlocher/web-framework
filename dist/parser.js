import { parse as htmlParse } from "node-html-parser";
import fetch from "node-fetch";
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
async function parseStaticTemplateLiteral(templateLiteral, context) {
    let fn = new AsyncFunction(...Object.keys(context), "return `" + templateLiteral + "`");
    return fn(...Object.values(context));
}
function parseHtml(template) {
    let root = htmlParse(template);
    let serverScriptTag = root.querySelector("script[server]");
    let serverScript = "";
    if (serverScriptTag) {
        serverScript = serverScriptTag.innerHTML;
        serverScriptTag.remove();
    }
    return [root.innerHTML, serverScript];
}
export function parse(template, components) {
    let [html, serverScript] = parseHtml(template);
    let state = {};
    return (req, props, children) => render(req, state, components, html, serverScript, props, children);
}
async function render(req, state, components, html, serverScript, props, children) {
    async function getComponent(name, parentReq) {
        return async function (props = {}, children) {
            return components[name](parentReq, props, children);
        };
    }
    let scope = {
        req,
        props,
        global,
        fetch,
        state,
        getComponent: (name) => getComponent(name, req),
    };
    let serverFunction = new AsyncFunction(Object.keys(scope), serverScript);
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
    }
    catch (e) {
        console.error(e);
        console.error(html);
        return "";
    }
}
