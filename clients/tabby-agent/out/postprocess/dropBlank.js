import { isBlank } from "../utils";
export function dropBlank() {
    return (input) => {
        return isBlank(input) ? null : input;
    };
}
//# sourceMappingURL=dropBlank.js.map