"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const doc = __importStar(require("prettier/doc"));
const { dedentToRoot, group, hardline, indent, join, line, literalline, softline } = doc.builders;
// Get the start and end element tags from the current node on the tree
function getElementTags(path, opts, print) {
    const node = path.getValue();
    const { OPEN, Name, attribute, START_CLOSE, SLASH_OPEN, END_NAME, END } = node.children;
    const parts = [OPEN[0].image, Name[0].image];
    if (attribute) {
        parts.push(indent([line, join(line, path.map(print, "children", "attribute"))]));
    }
    if (!opts.bracketSameLine) {
        parts.push(softline);
    }
    return {
        openTag: group([...parts, START_CLOSE[0].image]),
        closeTag: group([SLASH_OPEN[0].image, END_NAME[0].image, END[0].image])
    };
}
// Get the name of the parser that is represented by the given element node,
// return null if a matching parser cannot be found
function getParser(node, opts) {
    const { Name, attribute } = node.children;
    let parser = Name[0].image.toLowerCase();
    // We don't want to deal with some weird recursive parser situation, so we
    // need to explicitly call out the XML parser here and just return null
    if (parser === "xml") {
        return null;
    }
    // If somehow there is a "flow" node in XML file (Salesforce files for ex.)
    // we should stick to xml parser.
    // Flow is written as JS anyway, annotated by @flow in the code.
    if (parser === "flow") {
        return null;
    }
    // If this is a style tag with a text/xxx type then we will use xxx as the
    // name of the parser
    if (parser === "style" && attribute) {
        const typeAttr = attribute.find((attr) => attr.children.Name[0].image === "type");
        const typeValue = typeAttr && typeAttr.children.STRING[0].image;
        if (typeValue.startsWith('"text/') && typeValue.endsWith('"')) {
            parser = typeValue.slice(6, -1);
        }
    }
    // If this is a script tag with text/xxx then we will use xxx as the name of
    // the parser
    if (parser === "script" && attribute) {
        const typeAttr = attribute.find((attr) => attr.children.Name[0].image === "type");
        const typeValue = typeAttr && typeAttr.children.STRING[0].image;
        if (typeValue.startsWith('"text/') && typeValue.endsWith('"')) {
            parser = typeValue.slice(6, -1);
        }
    }
    // If the name of the parser is "javascript", then we're going to switch over
    // to the babel parser.
    if (parser === "javascript") {
        parser = "babel";
    }
    // If there is a plugin that has a parser that matches the name of this
    // element, then we're going to assume that's correct for embedding and go
    // ahead and switch to that parser
    if (opts.plugins.some((plugin) => typeof plugin !== "string" &&
        plugin.parsers &&
        Object.prototype.hasOwnProperty.call(plugin.parsers, parser))) {
        return parser;
    }
    return null;
}
// Get the source string that will be passed into the embedded parser from the
// content of the inside of the element node
function getSource(content) {
    return content.chardata
        .map((node) => {
        const { SEA_WS, TEXT } = node.children;
        const [{ image }] = SEA_WS || TEXT;
        return {
            offset: node.location.startOffset,
            printed: image
        };
    })
        .sort(({ offset }) => offset)
        .map(({ printed }) => printed)
        .join("");
}
function embed(path, opts) {
    const node = path.getValue();
    // If the node isn't an element node, then skip
    if (node.name !== "element") {
        return;
    }
    // If the name of the node does not correspond to the name of a parser that
    // prettier knows about, then skip
    const parser = getParser(node, opts);
    if (!parser) {
        return;
    }
    // If the node does not actually contain content, or it contains any content
    // that is not just plain text, then skip
    const content = node.children.content[0].children;
    if (Object.keys(content).length !== 1 || !content.chardata) {
        return;
    }
    return async function (textToDoc, print) {
        // Get the open and close tags of this element, then return the properly
        // formatted content enclosed within them
        const { openTag, closeTag } = getElementTags(path, opts, print);
        const docNode = await textToDoc(getSource(content), { parser });
        return group([
            openTag,
            literalline,
            dedentToRoot(doc.utils.replaceEndOfLine(docNode)),
            hardline,
            closeTag
        ]);
    };
}
exports.default = embed;
