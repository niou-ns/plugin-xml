"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const languages_js_1 = __importDefault(require("./languages.js"));
const parser_js_1 = __importDefault(require("./parser.js"));
const printer_js_1 = __importDefault(require("./printer.js"));
const plugin = {
    languages: languages_js_1.default,
    parsers: {
        xml: parser_js_1.default
    },
    printers: {
        xml: printer_js_1.default
    },
    options: {
        xmlSelfClosingSpace: {
            type: "boolean",
            category: "XML",
            default: true,
            description: "Adds a space before self-closing tags.",
            since: "1.1.0"
        },
        xmlAllowEmptyTags: {
            type: "boolean",
            category: "XML",
            default: true,
            description: "Allow empty tag - bypass self-closing formatting.",
            since: "2.2.2"
        },
        xmlWhitespaceSensitivity: {
            type: "choice",
            category: "XML",
            default: "strict",
            description: "How to handle whitespaces in XML.",
            choices: [
                {
                    value: "strict",
                    description: "Whitespaces are considered sensitive in all elements."
                },
                {
                    value: "ignore",
                    description: "Whitespaces are considered insensitive in all elements."
                }
            ],
            since: "0.6.0"
        }
    },
    defaultOptions: {
        printWidth: 80,
        tabWidth: 2
    }
};
exports.default = plugin;
