interface ArgumentInfo {
    readonly description: string;
    readonly required: boolean;
    readonly defaultValue?: string;
}

interface TsToolboxTask {
    readonly command: string;
    readonly argumentInfo: ArgumentInfo[];
    readonly execute: (args: string[], readFile: (path: string) => string, writeFile: (path: string, content: string) => void) => void;
}