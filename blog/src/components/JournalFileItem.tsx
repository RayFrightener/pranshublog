"use client";

import { useState } from "react";
import {
  type JournalFileSystemItem,
  type JournalFile,
  type JournalFolder,
} from "@/lib/journalStorage";

interface JournalFileItemProps {
  item: JournalFileSystemItem;
  isSelected?: boolean;
  isCurrentFile?: boolean;
  onOpen: (item: JournalFileSystemItem) => void;
  onRename: (id: string, newName: string, type: "file" | "folder") => void;
  onDelete: (id: string, type: "file" | "folder") => void;
  onDragStart: (e: React.DragEvent, item: JournalFileSystemItem) => void;
  onDragEnd: () => void;
  projectName?: string;
}

export default function JournalFileItem({
  item,
  isSelected = false,
  isCurrentFile = false,
  onOpen,
  onRename,
  onDelete,
  onDragStart,
  onDragEnd,
  projectName,
}: JournalFileItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [showActions, setShowActions] = useState(false);

  const isFolder = item.type === "folder";
  const file = !isFolder ? (item as JournalFile) : null;

  const handleRename = () => {
    if (editName.trim() && editName !== item.name) {
      onRename(item.id, editName.trim(), isFolder ? "folder" : "file");
    } else {
      setEditName(item.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditName(item.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      onClick={() => !isEditing && onOpen(item)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        group relative p-4 rounded-lg border transition-all cursor-pointer
        ${
          isCurrentFile
            ? "bg-[#867979]/30 border-[#867979]"
            : isSelected
            ? "bg-[#867979]/20 border-[#867979]/50"
            : "bg-[#867979]/10 border-[#867979]/30 hover:bg-[#867979]/20"
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {isFolder ? (
            <svg
              className="w-6 h-6 text-[#867979]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6 text-[#867979]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 bg-[#171717] border border-[#867979] rounded text-[#D0CCCC] focus:outline-none focus:border-[#867979]"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div>
              <h3
                className={`text-white font-medium truncate ${
                  isCurrentFile ? "text-[#867979]" : ""
                }`}
              >
                {item.name}
              </h3>
              {file && (
                <div className="text-sm text-[#867979] space-x-3 mt-1">
                  <span>{file.metadata?.wordCount || 0} words</span>
                  <span>·</span>
                  <span>
                    {new Date(file.updatedAt).toLocaleDateString()}
                  </span>
                  {projectName && (
                    <>
                      <span>·</span>
                      <span>{projectName}</span>
                    </>
                  )}
                </div>
              )}
              {isFolder && (
                <div className="text-sm text-[#867979] mt-1">
                  {new Date((item as JournalFolder).updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && !isEditing && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditName(item.name);
              }}
              className="px-2 py-1 text-xs bg-[#867979]/30 hover:bg-[#867979]/50 rounded text-[#D0CCCC] transition"
              title="Rename"
            >
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${isFolder ? "folder" : "file"} "${item.name}"?`)) {
                  onDelete(item.id, isFolder ? "folder" : "file");
                }
              }}
              className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 transition"
              title="Delete"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

