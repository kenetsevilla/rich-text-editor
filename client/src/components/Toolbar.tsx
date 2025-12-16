import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  type LexicalEditor,
  type ElementFormatType
} from "lexical";
import { 
  $setBlocksType,
  $patchStyleText,
  $getSelectionStyleValueForProperty
} from "@lexical/selection";
import {
  $createHeadingNode,
  $isHeadingNode,
  type HeadingTagType
} from "@lexical/rich-text";
import "./Toolbar.css";

const blockTypeToBlockName = {
  paragraph: "Normal",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
};

export default function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>("paragraph");
  
  // Dropdown States
  const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] = useState(false);
  const [showAlignDropDown, setShowAlignDropDown] = useState(false);

  // Formatting State
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  // Color State
  const [fontColor, setFontColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isHeadingNode(element)) {
          const tag = element.getTag();
          setBlockType(tag as keyof typeof blockTypeToBlockName);
        } else {
          const type = element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          } else {
            setBlockType("paragraph");
          }
        }
      }
      
      // Update Button States
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      // Update Color Pickers to match selection
      setFontColor($getSelectionStyleValueForProperty(selection, "color", "#000000"));
      setBgColor($getSelectionStyleValueForProperty(selection, "background-color", "#ffffff"));
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatAlign = (alignType: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignType);
    setShowAlignDropDown(false);
  };

  // Color Handlers
  const onFontColorSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color: e.target.value });
      }
    });
  };

  const onBgColorSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { "background-color": e.target.value });
      }
    });
  };

  return (
    <div className="lexical-toolbar">
      {/* Undo/Redo */}
      <div className="undo-redo-bar">
         <button onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} className="toolbar-btn">Undo</button>
         <button onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} className="toolbar-btn">Redo</button>
      </div>

      {/* Headings Dropdown */}
      <div className="headings-bar">
        <button
          className="heading-btn"
          onClick={() => setShowBlockOptionsDropDown(!showBlockOptionsDropDown)}
        >
          {blockTypeToBlockName[blockType]} ▼
        </button>
        {showBlockOptionsDropDown && (
          <div className="heading-dropdown">
             <button className="item" onClick={formatParagraph}>Normal {blockType === "paragraph" && "✓"}</button>
             <button className="item" onClick={() => formatHeading("h1")}>Heading 1 {blockType === "h1" && "✓"}</button>
             <button className="item" onClick={() => formatHeading("h2")}>Heading 2 {blockType === "h2" && "✓"}</button>
             <button className="item" onClick={() => formatHeading("h3")}>Heading 3 {blockType === "h3" && "✓"}</button>
          </div>
        )}
      </div>

      {/* Alignment Dropdown */}
      <div className="align-bar">
        <button
          className="heading-btn"
          onClick={() => setShowAlignDropDown(!showAlignDropDown)}
        >
          Align ▼
        </button>
        {showAlignDropDown && (
          <div className="heading-dropdown">
             <button className="item" onClick={() => formatAlign("left")}>Left Align</button>
             <button className="item" onClick={() => formatAlign("center")}>Center Align</button>
             <button className="item" onClick={() => formatAlign("right")}>Right Align</button>
             <button className="item" onClick={() => formatAlign("justify")}>Justify Align</button>
             <div className="divider" style={{ borderTop: "1px solid #eee", margin: "4px 0" }}></div>
             <button className="item" onClick={() => { editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined); setShowAlignDropDown(false); }}>Outdent</button>
             <button className="item" onClick={() => { editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined); setShowAlignDropDown(false); }}>Indent</button>
          </div>
        )}
      </div>

      {/* Text Formatting Tools */}
      <div className="tools-bar">
        <button className={`toolbar-btn bold ${isBold ? "active" : ""}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>B</button>
        <button className={`toolbar-btn italic ${isItalic ? "active" : ""}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>I</button>
        <button className={`toolbar-btn underline ${isUnderline ? "active" : ""}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>U</button>
        <button className={`toolbar-btn strike ${isStrikethrough ? "active" : ""}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}>S</button>
        <button className={`toolbar-btn code ${isCode ? "active" : ""}`} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}>&lt;/&gt;</button>
      </div>

      {/* Color Pickers (Text & Background) */}
      <div className="color-bar">
        {/* Text Color */}
        <div className="color-picker-wrapper">
           <label htmlFor="font-color-picker" className="color-picker-label" title="Text Color">
              <span className="icon">A</span>
              <span className="color-line" style={{ backgroundColor: fontColor }}></span>
           </label>
           <input 
              id="font-color-picker" 
              type="color" 
              className="hidden-color-input" 
              onChange={onFontColorSelect} 
              value={fontColor} 
           />
        </div>
        {/* Reset Text Color */}
        <button 
           className="reset-color-btn" 
           title="Reset Text Color"
           onClick={() => {
             editor.update(() => {
               const selection = $getSelection();
               if ($isRangeSelection(selection)) {
                 $patchStyleText(selection, { color: null }); 
               }
             });
           }}
        >
          ✕
        </button>

        <div className="divider"></div>

        {/* Background Color */}
        <div className="color-picker-wrapper">
           <label htmlFor="bg-color-picker" className="color-picker-label" title="Highlight Color">
              <span className="icon">🖊️</span>
              <span className="color-line" style={{ backgroundColor: bgColor }}></span>
           </label>
           <input 
              id="bg-color-picker" 
              type="color" 
              className="hidden-color-input" 
              onChange={onBgColorSelect} 
              value={bgColor} 
           />
        </div>
        {/* Reset Background Color */}
        <button 
           className="reset-color-btn" 
           title="Reset Highlight"
           onClick={() => {
             editor.update(() => {
               const selection = $getSelection();
               if ($isRangeSelection(selection)) {
                 $patchStyleText(selection, { "background-color": null });
               }
             });
           }}
        >
          ✕
        </button>
      </div>

    </div>
  );
}