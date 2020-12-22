declare const sourceMappingURL: any;
interface InlineChunkArg {
    name: string;
    test: RegExp | Array<RegExp>;
    priority?: number;
}
declare class InlineChunk {
    chunkName: InlineChunkArg['name'];
    test: InlineChunkArg['test'];
    priority: number;
    chunkNameReg: RegExp;
    constructor(options: InlineChunkArg);
    matchTargetChunk(str: string): boolean;
    apply(compiler: any): void;
    addChunkConfig(compiler: any): void;
    removeThemeAssetsBeforeEmit(compiler: any): void;
    addThemeAssetsIntoHtml(compiler: any): void;
}
