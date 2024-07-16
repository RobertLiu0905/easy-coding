"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const limitScopeBySyntax_1 = require("./limitScopeBySyntax");
describe("postprocess", () => {
    describe("limitScopeBySyntax javascript", () => {
        it("should limit scope at function_declaration.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function findMax(arr) {║}
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                               ├
          let max = arr[0];
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }
        console.log(findMax([1, 2, 3, 4, 5]));┤
      `;
            const expected = (0, testUtils_1.inline) `
                               ├
          let max = arr[0];
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }┤
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
        it("should limit scope at function_declaration", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function findMax(arr) {
          let max = arr[0];║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                           ├
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }┤
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(completion);
        });
        it("should limit scope at function_declaration", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function findMax(arr) {
          let max = arr[0];
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
           ├
          return max;
        }┤
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(completion);
        });
        it("should limit scope at for_statement.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function findMax(arr) {
          let max = arr[0];
          for║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
             ├ (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }
        console.log(findMax([1, 2, 3, 4, 5]));┤
      `;
            const expected = (0, testUtils_1.inline) `
             ├ (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }┤
        ┴┴
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
        it("should limit scope at current node if no parent scope found.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let a =║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
               ├ 1;
        let b = 2;┤
      `;
            const expected = (0, testUtils_1.inline) `
               ├ 1;┤
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
        it("should handle the bad case of limitScopeByIndentation", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function sortWords(input) {
          const output = input.trim()
            .split("\n")
            .map((line) => line.split(" "))
            ║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
            ├.flat()
            .sort()
            .join(" ");
          console.log(output);
          return output;
        }
        sortWords("world hello");┤
      `;
            const expected = (0, testUtils_1.inline) `
            ├.flat()
            .sort()
            .join(" ");
          console.log(output);
          return output;
        }┤
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
    });
    describe("limitScopeBySyntax python", () => {
        it("should limit scope at function_definition.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def find_min(arr):║
        `,
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
                          ├
          min = arr[0]
          for i in range(1, len(arr)):
            if arr[i] < min:
              min = arr[i]
          return min
        print(find_min([1, 2, 3, 4, 5]))┤
      `;
            const expected = (0, testUtils_1.inline) `
                          ├
          min = arr[0]
          for i in range(1, len(arr)):
            if arr[i] < min:
              min = arr[i]
          return min┤
        ┴┴
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
        it("should limit scope at function_definition.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def find_min(arr):
          min = arr[0]║
        `,
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
                      ├
          for i in range(1, len(arr)):
            if arr[i] < min:
              min = arr[i]
          return min
        print(find_min([1, 2, 3, 4, 5]))┤
      `;
            const expected = (0, testUtils_1.inline) `
                      ├
          for i in range(1, len(arr)):
            if arr[i] < min:
              min = arr[i]
          return min┤
        ┴┴
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
        it("should limit scope at function_definition.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def find_min(arr):
          min = arr[0]
          for i in range(1, len(arr)):
            if arr[i] < min:
              min = arr[i]║
        `,
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
                          ├
          return min┤
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(completion);
        });
        it("should limit scope at for_statement.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def find_min(arr):
          max = arr[0]
          for║
        `,
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
             ├ i in range(1, len(arr)):
            if arr[i] < min:
              min = arr[i]
          return min
        ┤
      `;
            const expected = (0, testUtils_1.inline) `
             ├ i in range(1, len(arr)):
            if arr[i] < min:
              min = arr[i]┤
        ┴┴┴┴
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
        it("should handle the bad case of limitScopeByIndentation", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def findMax(arr):
          ║
        `,
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
          ├max = arr[0]
          for i in range(1, len(arr)):
            if arr[i] > max:
              max = arr[i]
          return max
        findMax([1, 2, 3, 4, 5])┤
      `;
            const expected = (0, testUtils_1.inline) `
          ├max = arr[0]
          for i in range(1, len(arr)):
            if arr[i] > max:
              max = arr[i]
          return max┤
        ┴┴
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
    });
    describe("limitScopeBySyntax go", () => {
        it("should limit scope at function_declaration.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        func findMin(arr []int) int {║}
        `,
                language: "go",
            };
            const completion = (0, testUtils_1.inline) `
                                     ├
          min := math.MaxInt64
          for _, v := range arr {
            if v < min {
              min = v
            }
          }
          return min
        }
        
        func main() {
          arr := []int{5, 2, 9, 8, 1, 3}
          fmt.Println(findMin(arr)) // Output: 1
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
                                     ├
          min := math.MaxInt64
          for _, v := range arr {
            if v < min {
              min = v
            }
          }
          return min
        }┤
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
        it("should limit scope at for_statement.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        func findMin(arr []int) int {
          min := math.MaxInt64
          for║
        `,
                language: "go",
            };
            const completion = (0, testUtils_1.inline) `
             ├ _, v := range arr {
            if v < min {
              min = v
            }
          }
          return min
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
             ├ _, v := range arr {
            if v < min {
              min = v
            }
          }┤
        ┴┴
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
    });
    describe("limitScopeBySyntax rust", () => {
        it("should limit scope at function_item.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        fn find_min(arr: &[i32]) -> i32 {║}
        `,
                language: "rust",
            };
            const completion = (0, testUtils_1.inline) `
                                         ├
          *arr.iter().min().unwrap()
        }
        fn main() {
          let arr = vec![5, 2, 9, 8, 1, 3];
          println!("{}", find_min(&arr)); // Output: 1
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
                                         ├
          *arr.iter().min().unwrap()
        }┤
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
    });
    describe("limitScopeBySyntax ruby", () => {
        it("should limit scope at for.", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def fibonacci(n)║
        `,
                language: "ruby",
            };
            const completion = (0, testUtils_1.inline) `
                        ├
          return n if n <= 1
          fibonacci(n - 1) + fibonacci(n - 2)
        end
        puts fibonacci(10)┤
      `;
            const expected = (0, testUtils_1.inline) `
                        ├
          return n if n <= 1
          fibonacci(n - 1) + fibonacci(n - 2)
        end┤
      `;
            (0, chai_1.expect)(await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(completion, context)).to.eq(expected);
        });
    });
});
//# sourceMappingURL=limitScopeBySyntax.test.js.map