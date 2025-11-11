export interface JournalSession {
  id: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  rawThoughts: string[];
  organizedThoughts: Array<{
    id: string;
    originalText: string;
    type:
      | "action-item"
      | "requirement"
      | "feature"
      | "question"
      | "idea"
      | "note";
    category?: string;
    priority?: "low" | "medium" | "high";
    expanded?: string;
    selected: boolean;
  }>;
  metadata: {
    duration: number;
    wordCount: number;
    lineCount: number;
  };
  name?: string;
  savedAt?: string;
  isTemplate?: boolean;
  currentLine?: string;
  sessionStartTime?: string;
  path?: string;
  parentId?: string;
}

export interface SavedJournalMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  projectId?: string;
  path?: string;
  parentId?: string;
}

export interface JournalFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  type: "folder";
}

export interface JournalFile extends JournalSession {
  type: "file";
  path: string;
  parentId?: string;
}

export type JournalFileSystemItem = JournalFile | JournalFolder;

export function saveJournalToStorage(
  name: string,
  data: JournalSession,
  parentPath?: string,
  projectId?: string
): string {
  if (typeof window === "undefined") return "";
  
  const id = data.id || Date.now().toString();
  const path = parentPath || (projectId ? `/project-${projectId}` : "/general");
  const savedJournal: JournalSession = {
    ...data,
    id,
    name,
    path,
    projectId: projectId || data.projectId,
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`journal-saved-${id}`, JSON.stringify(savedJournal));

  // Update the saved journals list
  const savedList = listSavedJournals();
  const existingIndex = savedList.findIndex((j) => j.id === id);
  const metadata: SavedJournalMetadata = {
    id,
    name,
    createdAt: savedJournal.createdAt,
    updatedAt: savedJournal.updatedAt,
    wordCount: savedJournal.metadata?.wordCount || 0,
    projectId: savedJournal.projectId,
    path: savedJournal.path,
  };

  if (existingIndex >= 0) {
    savedList[existingIndex] = metadata;
  } else {
    savedList.push(metadata);
  }

  localStorage.setItem("journal-saved-list", JSON.stringify(savedList));
  return id;
}

export function loadJournalFromStorage(id: string): JournalSession | null {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem(`journal-saved-${id}`);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error("Error loading journal:", e);
    return null;
  }
}

export function listSavedJournals(): SavedJournalMetadata[] {
  if (typeof window === "undefined") return [];

  const saved = localStorage.getItem("journal-saved-list");
  if (!saved) return [];

  try {
    const list = JSON.parse(saved);
    // Filter out any journals that no longer exist
    return list.filter((j: SavedJournalMetadata) => {
      return localStorage.getItem(`journal-saved-${j.id}`) !== null;
    });
  } catch (e) {
    console.error("Error listing journals:", e);
    return [];
  }
}

export function deleteJournal(id: string): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(`journal-saved-${id}`);

  const savedList = listSavedJournals();
  const filtered = savedList.filter((j) => j.id !== id);
  localStorage.setItem("journal-saved-list", JSON.stringify(filtered));
}

export function exportJournalToJSON(data: JournalSession): string {
  return JSON.stringify(data, null, 2);
}

export function importJournalFromJSON(json: string): JournalSession | null {
  try {
    const parsed = JSON.parse(json);
    // Validate structure
    if (
      !parsed.rawThoughts ||
      !Array.isArray(parsed.rawThoughts) ||
      !parsed.organizedThoughts ||
      !Array.isArray(parsed.organizedThoughts)
    ) {
      throw new Error("Invalid journal format");
    }
    return parsed as JournalSession;
  } catch (e) {
    console.error("Error importing journal:", e);
    return null;
  }
}

// File System Functions

export function createFolder(
  name: string,
  parentPath: string,
  projectId?: string
): JournalFolder {
  if (typeof window === "undefined") {
    throw new Error("Cannot create folder on server");
  }

  if (!name || !name.trim()) {
    throw new Error("Folder name cannot be empty");
  }

  const trimmedName = name.trim();
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  
  // Determine the path based on parentPath and projectId
  let path: string;
  let parentId: string | undefined;
  
  if (parentPath === "/") {
    // When creating at root, create it directly at root, not in /general
    // The user can organize into /general later if needed
    path = `/${trimmedName}`;
    parentId = undefined; // No parent = root level
  } else {
    // Creating in a subfolder
    path = `${parentPath}/${trimmedName}`;
    parentId = parentPath;
  }

  const folder: JournalFolder = {
    id,
    name: trimmedName,
    path,
    parentId,
    projectId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: "folder",
  };

  // Save folder to localStorage
  localStorage.setItem(`journal-folder-${id}`, JSON.stringify(folder));
  
  // Update folder tree storage
  const treeDataStr = localStorage.getItem("journal-filesystem-tree");
  let treeData: { folders: JournalFolder[]; files: JournalFile[] } = { folders: [], files: [] };
  if (treeDataStr) {
    try {
      treeData = JSON.parse(treeDataStr);
    } catch (e) {
      console.error("Error parsing folder tree:", e);
      treeData = { folders: [], files: [] };
    }
  }
  
  // Check if folder already exists
  if (!treeData.folders.find((f) => f.id === folder.id)) {
    if (!treeData.folders) {
      treeData.folders = [];
    }
    treeData.folders.push(folder);
    localStorage.setItem("journal-filesystem-tree", JSON.stringify(treeData));
  }

  return folder;
}

export function createJournalFile(
  name: string,
  parentPath: string,
  data: JournalSession,
  projectId?: string
): JournalFile {
  if (typeof window === "undefined") {
    throw new Error("Cannot create file on server");
  }

  const id = data.id || Date.now().toString();
  const path = parentPath === "/"
    ? (projectId ? `/project-${projectId}/${name}` : `/general/${name}`)
    : `${parentPath}/${name}`;

  const file: JournalFile = {
    ...data,
    id,
    name,
    path,
    parentId: parentPath === "/" ? undefined : parentPath,
    projectId: projectId || data.projectId,
    type: "file",
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`journal-saved-${id}`, JSON.stringify(file));
  
  // Update saved list
  const savedList = listSavedJournals();
  const metadata: SavedJournalMetadata = {
    id,
    name,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    wordCount: file.metadata?.wordCount || 0,
    projectId: file.projectId,
    path: file.path,
    parentId: file.parentId,
  };
  
  const existingIndex = savedList.findIndex((j) => j.id === id);
  if (existingIndex >= 0) {
    savedList[existingIndex] = metadata;
  } else {
    savedList.push(metadata);
  }
  localStorage.setItem("journal-saved-list", JSON.stringify(savedList));

  return file;
}

export function getFileSystemTree(projectId?: string): JournalFileSystemItem[] {
  if (typeof window === "undefined") return [];

  const treeData = localStorage.getItem("journal-filesystem-tree");
  const savedList = listSavedJournals();
  
  const folders: JournalFolder[] = [];
  const files: JournalFile[] = [];

  // Load folders
  if (treeData) {
    try {
      const parsed = JSON.parse(treeData);
      folders.push(...(parsed.folders || []));
    } catch (e) {
      console.error("Error parsing folder tree:", e);
    }
  }

  // Load files from saved journals
  savedList.forEach((meta) => {
    const fileData = loadJournalFromStorage(meta.id);
    if (fileData) {
      files.push({
        ...fileData,
        type: "file",
        path: fileData.path || (fileData.projectId ? `/project-${fileData.projectId}` : "/general"),
      } as JournalFile);
    }
  });

  // Filter by project if specified
  let items: JournalFileSystemItem[] = [...folders, ...files];
  
  if (projectId === "general" || projectId === "") {
    items = items.filter((item) => !item.projectId);
  } else if (projectId && projectId !== "all") {
    items = items.filter((item) => item.projectId === projectId);
  }

  return items;
}

export function getItemsByPath(path: string, projectId?: string): JournalFileSystemItem[] {
  const allItems = getFileSystemTree(projectId);
  return allItems.filter((item) => {
    if (path === "/") {
      // Root: show items with no parentId (directly at root)
      // This includes folders created at root and files with no parent
      return !item.parentId;
    }
    // Direct children only: parentId matches the path
    return item.parentId === path;
  });
}

export function renameItem(id: string, newName: string, type: "file" | "folder"): void {
  if (typeof window === "undefined") return;

  if (type === "folder") {
    const folderData = localStorage.getItem(`journal-folder-${id}`);
    if (!folderData) return;

    const folder: JournalFolder = JSON.parse(folderData);
    const oldPath = folder.path;
    const pathParts = oldPath.split("/");
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join("/");

    folder.name = newName;
    folder.path = newPath;
    folder.updatedAt = new Date().toISOString();

    localStorage.setItem(`journal-folder-${id}`, JSON.stringify(folder));

    // Update all children paths
    const allItems = getFileSystemTree();
    allItems.forEach((item) => {
      if (item.path?.startsWith(oldPath + "/")) {
        const newItemPath = item.path.replace(oldPath, newPath);
        if (item.type === "folder") {
          const childFolder = { ...item, path: newItemPath } as JournalFolder;
          localStorage.setItem(`journal-folder-${item.id}`, JSON.stringify(childFolder));
        } else {
          const childFile = { ...item, path: newItemPath } as JournalFile;
          localStorage.setItem(`journal-saved-${item.id}`, JSON.stringify(childFile));
        }
      }
    });
  } else {
    const file = loadJournalFromStorage(id);
    if (!file) return;

    file.name = newName;
    file.updatedAt = new Date().toISOString();
    
    const pathParts = file.path?.split("/") || [];
    pathParts[pathParts.length - 1] = newName;
    file.path = pathParts.join("/");

    localStorage.setItem(`journal-saved-${id}`, JSON.stringify(file));

    // Update metadata list
    const savedList = listSavedJournals();
    const index = savedList.findIndex((j) => j.id === id);
    if (index >= 0) {
      savedList[index].name = newName;
      savedList[index].path = file.path;
      localStorage.setItem("journal-saved-list", JSON.stringify(savedList));
    }
  }
}

export function deleteItem(id: string, type: "file" | "folder"): void {
  if (typeof window === "undefined") return;

  if (type === "folder") {
    const folderData = localStorage.getItem(`journal-folder-${id}`);
    if (!folderData) return;

    const folder: JournalFolder = JSON.parse(folderData);
    
    // Delete all children
    const allItems = getFileSystemTree();
    allItems.forEach((item) => {
      if (item.path?.startsWith(folder.path + "/")) {
        if (item.type === "folder") {
          localStorage.removeItem(`journal-folder-${item.id}`);
        } else {
          deleteJournal(item.id);
        }
      }
    });

    localStorage.removeItem(`journal-folder-${id}`);
  } else {
    deleteJournal(id);
  }
}

export function moveItem(id: string, newParentPath: string, type: "file" | "folder"): void {
  if (typeof window === "undefined") return;

  if (type === "folder") {
    const folderData = localStorage.getItem(`journal-folder-${id}`);
    if (!folderData) return;

    const folder: JournalFolder = JSON.parse(folderData);
    const oldPath = folder.path;
    const folderName = folder.name;
    const newPath = newParentPath === "/" 
      ? (folder.projectId ? `/project-${folder.projectId}/${folderName}` : `/general/${folderName}`)
      : `${newParentPath}/${folderName}`;

    folder.path = newPath;
    folder.parentId = newParentPath === "/" ? undefined : newParentPath;
    folder.updatedAt = new Date().toISOString();

    localStorage.setItem(`journal-folder-${id}`, JSON.stringify(folder));

    // Update all children paths
    const allItems = getFileSystemTree();
    allItems.forEach((item) => {
      if (item.path?.startsWith(oldPath + "/")) {
        const newItemPath = item.path.replace(oldPath, newPath);
        if (item.type === "folder") {
          const childFolder = { ...item, path: newItemPath, parentId: newPath } as JournalFolder;
          localStorage.setItem(`journal-folder-${item.id}`, JSON.stringify(childFolder));
        } else {
          const childFile = { ...item, path: newItemPath, parentId: newPath } as JournalFile;
          localStorage.setItem(`journal-saved-${item.id}`, JSON.stringify(childFile));
        }
      }
    });
  } else {
    const file = loadJournalFromStorage(id);
    if (!file) return;

    const fileName = file.name || "journal";
    const newPath = newParentPath === "/"
      ? (file.projectId ? `/project-${file.projectId}/${fileName}` : `/general/${fileName}`)
      : `${newParentPath}/${fileName}`;

    file.path = newPath;
    file.parentId = newParentPath === "/" ? undefined : newParentPath;
    file.updatedAt = new Date().toISOString();

    localStorage.setItem(`journal-saved-${id}`, JSON.stringify(file));

    // Update metadata list
    const savedList = listSavedJournals();
    const index = savedList.findIndex((j) => j.id === id);
    if (index >= 0) {
      savedList[index].path = newPath;
      savedList[index].parentId = file.parentId;
      localStorage.setItem("journal-saved-list", JSON.stringify(savedList));
    }
  }
}

export function getItemPath(id: string): string | null {
  if (typeof window === "undefined") return null;

  // Check if it's a folder
  const folderData = localStorage.getItem(`journal-folder-${id}`);
  if (folderData) {
    const folder: JournalFolder = JSON.parse(folderData);
    return folder.path;
  }

  // Check if it's a file
  const file = loadJournalFromStorage(id);
  return file?.path || null;
}

export function getItemMetadata(id: string): JournalFileSystemItem | null {
  if (typeof window === "undefined") return null;

  // Check if it's a folder
  const folderData = localStorage.getItem(`journal-folder-${id}`);
  if (folderData) {
    return JSON.parse(folderData) as JournalFolder;
  }

  // Check if it's a file
  const file = loadJournalFromStorage(id);
  if (file) {
    return {
      ...file,
      type: "file",
      path: file.path || (file.projectId ? `/project-${file.projectId}` : "/general"),
    } as JournalFile;
  }

  return null;
}

export function filterByProject(
  items: JournalFileSystemItem[],
  projectId?: string
): JournalFileSystemItem[] {
  if (!projectId || projectId === "all") return items;
  
  if (projectId === "general" || projectId === "") {
    return items.filter((item) => !item.projectId);
  }
  
  return items.filter((item) => item.projectId === projectId);
}

// Migration function
export function migrateFlatStructureToFileSystem(): void {
  if (typeof window === "undefined") return;

  const hasMigrated = localStorage.getItem("journal-filesystem-migrated");
  if (hasMigrated) return;

  const savedList = listSavedJournals();
  if (savedList.length === 0) {
    // No journals to migrate, just mark as migrated
    localStorage.setItem("journal-filesystem-migrated", "true");
    return;
  }

  const folders: JournalFolder[] = [];
  const generalFolder: JournalFolder = {
    id: "general-root",
    name: "General",
    path: "/general",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: "folder",
  };
  folders.push(generalFolder);

  // Group by project and create folders
  const projectFolders: { [key: string]: JournalFolder } = {};

  savedList.forEach((meta) => {
    const file = loadJournalFromStorage(meta.id);
    if (!file) return;

    if (file.projectId) {
      if (!projectFolders[file.projectId]) {
        const projectFolder: JournalFolder = {
          id: `project-${file.projectId}`,
          name: `Project ${file.projectId}`,
          path: `/project-${file.projectId}`,
          projectId: file.projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: "folder",
        };
        projectFolders[file.projectId] = projectFolder;
        folders.push(projectFolder);
      }

      if (!file.path) {
        file.path = `/project-${file.projectId}/${file.name || "journal"}`;
        file.parentId = `/project-${file.projectId}`;
      }
    } else {
      if (!file.path) {
        file.path = `/general/${file.name || "journal"}`;
        file.parentId = "/general";
      }
    }

    localStorage.setItem(`journal-saved-${file.id}`, JSON.stringify(file));
  });

  // Save folder structure
  localStorage.setItem("journal-filesystem-tree", JSON.stringify({ folders, files: [] }));
  
  // Mark as migrated
  localStorage.setItem("journal-filesystem-migrated", "true");
}

