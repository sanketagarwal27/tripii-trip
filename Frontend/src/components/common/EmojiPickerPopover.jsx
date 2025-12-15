// src/components/common/EmojiPickerPopover.jsx
import React from "react";
import EmojiPicker from "emoji-picker-react";

export default function EmojiPickerPopover({ onSelect }) {
  return (
    <div className="absolute z-50 bottom-full mb-2">
      <EmojiPicker
        onEmojiClick={(emoji) => onSelect(emoji.emoji)}
        theme="dark"
        skinTonesDisabled
        searchDisabled
        height={350}
        width={300}
      />
    </div>
  );
}
