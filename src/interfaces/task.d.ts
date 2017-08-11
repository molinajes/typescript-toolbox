interface ArgumentInfo {
    readonly description: string;
    readonly required: boolean;
    readonly defaultValue?: string;
}

interface TsToolBoxTask {
    readonly command: string;
    readonly argumentInfo: ArgumentInfo[];
    readonly execute: (args: string[]) => void;
}