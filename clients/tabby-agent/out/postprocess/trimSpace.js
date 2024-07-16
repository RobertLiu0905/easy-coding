import { isBlank } from "../utils";
export function trimSpace() {
    return (input, context) => {
        const { currentLinePrefix, currentLineSuffix } = context;
        let trimmedInput = input;
        if (!isBlank(currentLinePrefix) && currentLinePrefix.match(/\s$/)) {
            trimmedInput = trimmedInput.trimStart();
        }
        if (isBlank(currentLineSuffix) || (!isBlank(currentLineSuffix) && currentLineSuffix.match(/^\s/))) {
            trimmedInput = trimmedInput.trimEnd();
        }
        return trimmedInput;
    };
}
//# sourceMappingURL=trimSpace.js.map