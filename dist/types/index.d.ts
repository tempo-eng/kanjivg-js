export interface KanjiData {
    character: string;
    unicode: string;
    variant?: string;
    isVariant: boolean;
    strokes: StrokeData[];
    groups: GroupData[];
    radicalInfo?: RadicalInfo;
    strokeCount: number;
    components?: string[];
}
export interface StrokeData {
    strokeNumber: number;
    path: string;
    strokeType: string;
    numberPosition?: {
        x: number;
        y: number;
    };
    groupId?: string;
    isRadicalStroke?: boolean;
}
export interface GroupData {
    id: string;
    element?: string;
    radical?: string;
    position?: string;
    childStrokes: number[];
    children: GroupData[];
}
export interface RadicalInfo {
    radical: string;
    positions: string[];
    strokeRanges: number[][];
}
export interface AnimationOptions {
    strokeDuration: number;
    strokeDelay: number;
    showNumbers: boolean;
    loop: boolean;
    showTrace: boolean;
    strokeStyling: StrokeStyling;
    radicalStyling?: RadicalStyling;
    traceStyling?: TraceStyling;
    numberStyling?: NumberStyling;
}
export interface StrokeStyling {
    strokeColour: string | string[];
    strokeThickness: number;
    strokeRadius: number;
}
export interface RadicalStyling {
    radicalColour: string | string[];
    radicalThickness: number;
    radicalRadius: number;
}
export interface TraceStyling {
    traceColour: string;
    traceThickness: number;
    traceRadius: number;
}
export interface NumberStyling {
    fontColour: string;
    fontWeight: number;
    fontSize: number;
}
export interface KanjiCardProps {
    kanji: string | KanjiData;
    showInfo?: boolean;
    animationOptions?: Partial<AnimationOptions>;
    onAnimationComplete?: () => void;
    className?: string;
}
export declare class KanjiVGError extends Error {
    code: string;
    constructor(message: string, code: string);
}
export declare const ERROR_CODES: {
    readonly KANJI_NOT_FOUND: "KANJI_NOT_FOUND";
    readonly INVALID_UNICODE: "INVALID_UNICODE";
    readonly SVG_PARSE_ERROR: "SVG_PARSE_ERROR";
    readonly FILE_LOAD_ERROR: "FILE_LOAD_ERROR";
};
//# sourceMappingURL=index.d.ts.map