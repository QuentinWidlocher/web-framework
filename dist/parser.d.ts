import { Request } from "express";
import { Component } from "./index";
export declare type RenderFunction = (req: Request, state: Object, components: Record<string, Component>, html: string, serverScript: string, props?: Object, children?: string) => Promise<string>;
export declare type RenderFunctionToExec = (req: Request, props?: Object, children?: string) => Promise<string>;
export declare function parse(template: string, components: Record<string, Component>): RenderFunctionToExec;
//# sourceMappingURL=parser.d.ts.map