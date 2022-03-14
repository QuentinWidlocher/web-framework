import { RenderFunctionToExec } from "./parser.js";
export declare type Component = RenderFunctionToExec;
export default function run({ port, directory, expressConfig, }?: {
    port: number;
    directory: string;
    expressConfig: (app: import("express-serve-static-core").Express) => void;
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map