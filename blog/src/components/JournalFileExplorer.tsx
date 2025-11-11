"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type JournalFileSystemItem,
  type JournalFolder,
  type JournalFile,
  getFileSystemTree,
  getItemsByPath,
  createFolder,
  moveItem,
} from "@/lib/journalStorage";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "archived";
}
import JournalFileItem from "./JournalFileItem";

interface JournalFileExplorerProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  onOpenFile: (file: JournalFile) => void;
  onRename: (id: string, newName: string, type: "file" | "folder") => void;
  onDelete: (id: string, type: "file" | "folder") => void;
  selectedProjectFilter: string | null;
  projects: Project[];
  currentFileId?: string | null;
}

export default function JournalFileExplorer({
  currentPath,
  onPathChange,
  onOpenFile,
  onRename,
  onDelete,
  selectedProjectFilter,
  projects,
  currentFileId,
}: JournalFileExplorerProps) {
  const [items, setItems] = useState<JournalFileSystemItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["/"])
  );
  const [draggedItem, setDraggedItem] = useState<JournalFileSystemItem | null>(
    null
  );
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const loadItems = useCallback(() => {
    const projectFilter =
      selectedProjectFilter === "all" || !selectedProjectFilter
        ? undefined
        : selectedProjectFilter === "general"
        ? "general"
        : selectedProjectFilter;
    const allItems = getFileSystemTree(projectFilter);
    const pathItems = getItemsByPath(currentPath, projectFilter);
    setItems(pathItems);
  }, [currentPath, selectedProjectFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleOpen = (item: JournalFileSystemItem) => {
    if (item.type === "folder") {
      const folder = item as JournalFolder;
      const newPath = folder.path;
      onPathChange(newPath);
      setExpandedFolders((prev) => new Set([...prev, newPath]));
    } else {
      onOpenFile(item as JournalFile);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: JournalFileSystemItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverPath(null);
  };

  const handleDragOver = (e: React.DragEvent, path: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverPath(path);
  };

  const handleDrop = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Prevent dropping on itself or into its own children
    if (draggedItem.type === "folder") {
      const folder = draggedItem as JournalFolder;
      if (
        targetPath === folder.path ||
        targetPath.startsWith(folder.path + "/")
      ) {
        setDragOverPath(null);
        return;
      }
    }

    moveItem(draggedItem.id, targetPath, draggedItem.type);
    loadItems();
    setDragOverPath(null);
    setDraggedItem(null);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      alert("Please enter a folder name");
      return;
    }

    try {
      const projectId =
        selectedProjectFilter &&
        selectedProjectFilter !== "all" &&
        selectedProjectFilter !== "general"
          ? selectedProjectFilter
          : undefined;

      createFolder(newFolderName.trim(), currentPath, projectId);
      setNewFolderName("");
      setShowCreateFolderModal(false);

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Refresh the items list
      loadItems();
      setTimeout(() => loadItems(), 50);
    } catch (error) {
      alert(
        `Failed to create folder: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const getBreadcrumbs = () => {
    if (currentPath === "/") return ["/"];
    return currentPath.split("/").filter(Boolean);
  };

  const navigateToPath = (pathParts: string[]) => {
    if (
      pathParts.length === 0 ||
      (pathParts.length === 1 && pathParts[0] === "/")
    ) {
      onPathChange("/");
    } else {
      onPathChange("/" + pathParts.join("/"));
    }
  };

  const folders = items.filter((i) => i.type === "folder") as JournalFolder[];
  const files = items.filter((i) => i.type === "file") as JournalFile[];

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#867979]/30">
        <button
          onClick={() => onPathChange("/")}
          className="text-[#867979] hover:text-white transition text-sm"
        >
          Root
        </button>
        {getBreadcrumbs().map((part, index) => {
          if (part === "/") return null;
          const pathParts = getBreadcrumbs().slice(0, index + 1);
          return (
            <span key={index} className="flex items-center gap-2">
              <span className="text-[#867979]">/</span>
              <button
                onClick={() => navigateToPath(pathParts)}
                className="text-[#867979] hover:text-white transition text-sm"
              >
                {part}
              </button>
            </span>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="px-4 py-2 bg-[#867979] hover:bg-[#756868] rounded-lg text-white transition text-sm"
          >
            New Folder
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
          ✅ Folder created successfully!
        </div>
      )}

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-12 text-[#867979]">
            <p>This folder is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Folders */}
            {folders.map((folder) => {
              const project = projects.find((p) => p.id === folder.projectId);
              return (
                <div
                  key={folder.id}
                  onDragOver={(e) => handleDragOver(e, folder.path)}
                  onDrop={(e) => handleDrop(e, folder.path)}
                  className={`
                    transition-all
                    ${
                      dragOverPath === folder.path
                        ? "ring-2 ring-[#867979]"
                        : ""
                    }
                  `}
                >
                  <JournalFileItem
                    item={folder}
                    isCurrentFile={false}
                    onOpen={handleOpen}
                    onRename={(id, name, type) => {
                      onRename(id, name, type);
                      loadItems();
                    }}
                    onDelete={(id, type) => {
                      onDelete(id, type);
                      loadItems();
                    }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    projectName={project?.name}
                  />
                </div>
              );
            })}

            {/* Files */}
            {files.map((file) => {
              const project = projects.find((p) => p.id === file.projectId);
              return (
                <JournalFileItem
                  key={file.id}
                  item={file}
                  isCurrentFile={currentFileId === file.id}
                  onOpen={handleOpen}
                  onRename={(id, name, type) => {
                    onRename(id, name, type);
                    loadItems();
                  }}
                  onDelete={(id, type) => {
                    onDelete(id, type);
                    loadItems();
                  }}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  projectName={project?.name}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#867979] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Create Folder
            </h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="w-full px-4 py-3 bg-[#171717] border border-[#867979] rounded-lg text-[#D0CCCC] focus:outline-none focus:border-[#867979] mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (newFolderName.trim()) {
                    handleCreateFolder();
                  }
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                }
              }}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateFolder();
                }}
                disabled={!newFolderName.trim()}
                className="flex-1 px-4 py-2 bg-[#867979] hover:bg-[#756868] rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                }}
                className="flex-1 px-4 py-2 border border-[#867979] rounded hover:bg-[#867979]/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
