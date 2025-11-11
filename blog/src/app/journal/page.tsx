"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkAuth } from "@/lib/auth";
import {
  saveJournalToStorage,
  loadJournalFromStorage,
  listSavedJournals,
  deleteJournal,
  exportJournalToJSON,
  importJournalFromJSON,
  type SavedJournalMetadata,
  getFileSystemTree,
  getItemMetadata,
  renameItem,
  deleteItem,
  moveItem,
  createJournalFile,
  migrateFlatStructureToFileSystem,
  type JournalFile,
  type JournalFileSystemItem,
} from "@/lib/journalStorage";
import JournalFileExplorer from "@/components/JournalFileExplorer";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "archived";
}

interface OrganizedThought {
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
}

interface JournalSession {
  id: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  rawThoughts: string[];
  organizedThoughts: OrganizedThought[];
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
}

type ViewMode = "stream" | "organize" | "export" | "files";

function JournalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    searchParams.get("projectId") || null
  );
  const [viewMode, setViewMode] = useState<ViewMode>("stream");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Stream of consciousness state
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [isFocused, setIsFocused] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [wordCount, setWordCount] = useState(0);
  const [sessionDuration, setSessionDuration] = useState("0:00");

  // Organize state
  const [organizedThoughts, setOrganizedThoughts] = useState<
    OrganizedThought[]
  >([]);
  const [selectedText, setSelectedText] = useState<string>("");
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractType, setExtractType] =
    useState<OrganizedThought["type"]>("note");
  const [featureDescription, setFeatureDescription] = useState<string>("");
  const [featureImpact, setFeatureImpact] = useState<string>("");

  // Export state
  const [exportItems, setExportItems] = useState<{
    tasks: Array<{ text: string; priority: "low" | "medium" | "high" }>;
    requirements: string[];
    features: Array<{ name: string; description: string; impact: string }>;
  }>({
    tasks: [],
    requirements: [],
    features: [],
  });

  // Saved journals state
  const [savedJournals, setSavedJournals] = useState<SavedJournalMetadata[]>(
    []
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveJournalName, setSaveJournalName] = useState("");
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<JournalSession | null>(
    null
  );

  // File system state
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [currentFileMetadata, setCurrentFileMetadata] =
    useState<JournalFileSystemItem | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("/");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<
    string | null
  >(null);

  // Update save journal name when current file changes
  useEffect(() => {
    if (currentFileMetadata && currentFileMetadata.name) {
      setSaveJournalName(currentFileMetadata.name);
    }
  }, [currentFileMetadata]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamAreaRef = useRef<HTMLDivElement>(null);

  // Load projects
  useEffect(() => {
    const savedProjects = localStorage.getItem("dashboard-projects");
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed.filter((p: Project) => p.status === "active"));
      } catch (e) {
        console.error("Error loading projects:", e);
      }
    }
  }, []);

  // Load saved journals list
  useEffect(() => {
    setSavedJournals(listSavedJournals());
  }, []);

  // Migrate flat structure to file system on first load
  useEffect(() => {
    migrateFlatStructureToFileSystem();
  }, []);

  // Load current file metadata when currentFileId changes
  useEffect(() => {
    if (currentFileId) {
      const metadata = getItemMetadata(currentFileId);
      setCurrentFileMetadata(metadata);
      if (metadata && metadata.path) {
        const pathParts = metadata.path.split("/");
        pathParts.pop();
        setCurrentFolderPath(pathParts.join("/") || "/");
      }
    } else {
      setCurrentFileMetadata(null);
    }
  }, [currentFileId]);

  // Load saved journal session
  useEffect(() => {
    const saved = localStorage.getItem(
      `journal-session-${selectedProjectId || "general"}`
    );
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLines(parsed.rawThoughts || []);
        setOrganizedThoughts(parsed.organizedThoughts || []);
        setCurrentLine(parsed.currentLine || "");
        if (parsed.sessionStartTime) {
          setSessionStartTime(new Date(parsed.sessionStartTime));
        }
      } catch (e) {
        console.error("Error loading journal session:", e);
      }
    }
  }, [selectedProjectId]);

  // Auto-save
  useEffect(() => {
    const data = {
      rawThoughts: lines,
      organizedThoughts,
      currentLine,
      sessionStartTime: sessionStartTime.toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(
      `journal-session-${selectedProjectId || "general"}`,
      JSON.stringify(data)
    );
  }, [
    lines,
    organizedThoughts,
    currentLine,
    selectedProjectId,
    sessionStartTime,
  ]);

  // Calculate word count
  useEffect(() => {
    const allText = [...lines, currentLine].join(" ");
    const words = allText
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    setWordCount(words.length);
  }, [lines, currentLine]);

  // Update session duration timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - sessionStartTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setSessionDuration(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Keep focus on input
  useEffect(() => {
    if (isFocused && inputRef.current && viewMode === "stream") {
      inputRef.current.focus();
    }
  }, [isFocused, lines, viewMode]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current && viewMode === "stream") {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, currentLine, viewMode]);

  // Store selection range to preserve highlight
  const [storedSelectionRange, setStoredSelectionRange] =
    useState<Range | null>(null);

  // Handle text selection in stream view
  useEffect(() => {
    if (viewMode === "stream" && streamAreaRef.current) {
      const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          setSelectedText(selection.toString().trim());
          // Store the selection range to preserve highlight
          if (selection.rangeCount > 0) {
            setStoredSelectionRange(selection.getRangeAt(0).cloneRange());
          }
        } else {
          // Only clear if selection is actually empty (not just clicking buttons)
          if (!selection || selection.toString().trim().length === 0) {
            setSelectedText("");
            setStoredSelectionRange(null);
          }
        }
      };

      const element = streamAreaRef.current;
      element.addEventListener("mouseup", handleSelection);
      element.addEventListener("keyup", handleSelection);

      return () => {
        element.removeEventListener("mouseup", handleSelection);
        element.removeEventListener("keyup", handleSelection);
      };
    }
  }, [viewMode]);

  // Restore selection highlight when selectedText changes
  useEffect(() => {
    if (selectedText && storedSelectionRange && streamAreaRef.current) {
      try {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(storedSelectionRange);
        }
      } catch (e) {
        // Selection might be invalid, ignore
      }
    }
  }, [selectedText, storedSelectionRange]);

  // Check authentication on mount
  useEffect(() => {
    if (!checkAuth()) {
      router.push("/journal/auth");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentLine.trim()) {
        setLines([...lines, currentLine]);
        setCurrentLine("");
      }
    } else if (e.key === "Escape") {
      if (viewMode === "stream") {
        router.push("/dashboard");
      } else {
        setViewMode("stream");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentLine(e.target.value);
  };

  const extractThought = (text: string, type: OrganizedThought["type"]) => {
    const newThought: OrganizedThought = {
      id: Date.now().toString() + Math.random(),
      originalText: text,
      type,
      selected: false,
      priority: type === "action-item" ? "medium" : undefined,
      // For features, use description and impact fields
      expanded: type === "feature" ? featureDescription : undefined,
      category: type === "feature" ? featureImpact : undefined,
    };
    setOrganizedThoughts([...organizedThoughts, newThought]);
    setSelectedText("");
    setStoredSelectionRange(null);
    setFeatureDescription("");
    setFeatureImpact("");
    // Clear the selection highlight
    window.getSelection()?.removeAllRanges();
    setShowExtractModal(false);
  };

  const updateOrganizedThought = (
    id: string,
    updates: Partial<OrganizedThought>
  ) => {
    setOrganizedThoughts(
      organizedThoughts.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteOrganizedThought = (id: string) => {
    setOrganizedThoughts(organizedThoughts.filter((t) => t.id !== id));
  };

  const prepareExport = () => {
    const tasks = organizedThoughts
      .filter((t) => t.type === "action-item")
      .map((t) => ({
        text: t.originalText,
        priority: t.priority || "medium",
      }));

    const requirements = organizedThoughts
      .filter((t) => t.type === "requirement")
      .map((t) => t.originalText + (t.expanded ? `\n${t.expanded}` : ""));

    const features = organizedThoughts
      .filter((t) => t.type === "feature")
      .map((t) => ({
        name: t.originalText,
        description: t.expanded || "",
        impact: t.category || "",
      }));

    setExportItems({ tasks, requirements, features });
    setViewMode("export");
  };

  const exportToProject = () => {
    if (!selectedProjectId) return;

    const savedProjects = localStorage.getItem("dashboard-projects");
    if (!savedProjects) return;

    try {
      const projects = JSON.parse(savedProjects);
      const projectIndex = projects.findIndex(
        (p: any) => p.id === selectedProjectId
      );

      if (projectIndex === -1) return;

      const project = projects[projectIndex];

      // Add tasks
      if (exportItems.tasks.length > 0) {
        const newTasks = exportItems.tasks.map((task) => ({
          id: Date.now().toString() + Math.random(),
          title: task.text,
          status: "todo",
          priority: task.priority,
          createdAt: new Date().toISOString(),
        }));
        project.tasks = [...(project.tasks || []), ...newTasks];
      }

      // Add requirements
      if (exportItems.requirements.length > 0) {
        if (!project.impactPlan) {
          project.impactPlan = {
            vision: "",
            features: [],
            requirements: "",
          };
        }
        const existingRequirements = project.impactPlan.requirements || "";
        const newRequirements = exportItems.requirements.join("\n\n");
        project.impactPlan.requirements = existingRequirements
          ? `${existingRequirements}\n\n---\n\n${newRequirements}`
          : newRequirements;
      }

      // Add features
      if (exportItems.features.length > 0) {
        if (!project.impactPlan) {
          project.impactPlan = {
            vision: "",
            features: [],
            requirements: "",
          };
        }
        const newFeatures = exportItems.features.map((feature) => ({
          id: Date.now().toString() + Math.random(),
          name: feature.name,
          description: feature.description,
          impact: feature.impact,
          status: "idea",
          actionItems: [],
          tasks: [],
          priority: (project.impactPlan.features || []).length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        project.impactPlan.features = [
          ...(project.impactPlan.features || []),
          ...newFeatures,
        ];
      }

      project.lastUpdated = new Date().toISOString();
      projects[projectIndex] = project;
      localStorage.setItem("dashboard-projects", JSON.stringify(projects));

      // Clear journal session
      localStorage.removeItem(`journal-session-${selectedProjectId}`);
      setLines([]);
      setOrganizedThoughts([]);
      setCurrentLine("");

      router.push(`/dashboard`);
    } catch (e) {
      console.error("Error exporting to project:", e);
    }
  };

  const handleSaveJournal = () => {
    if (!saveJournalName.trim()) return;

    const sessionData: JournalSession = {
      id: currentFileId || Date.now().toString(),
      projectId: selectedProjectId || undefined,
      createdAt: currentFileId
        ? (currentFileMetadata as JournalFile)?.createdAt ||
          sessionStartTime.toISOString()
        : sessionStartTime.toISOString(),
      updatedAt: new Date().toISOString(),
      rawThoughts: lines,
      organizedThoughts,
      metadata: {
        duration: new Date().getTime() - sessionStartTime.getTime(),
        wordCount,
        lineCount: lines.length,
      },
      currentLine,
      sessionStartTime: sessionStartTime.toISOString(),
    };

    const fileId = saveJournalToStorage(
      saveJournalName,
      sessionData,
      currentFolderPath,
      selectedProjectId || undefined
    );
    setCurrentFileId(fileId);
    setSavedJournals(listSavedJournals());
    setShowSaveModal(false);
    setSaveJournalName("");
  };

  const handleLoadJournal = (id: string, asTemplate: boolean = false) => {
    const journal = loadJournalFromStorage(id);
    if (!journal) return;

    if (asTemplate) {
      // Load as template - reset session time and create new ID
      setLines(journal.rawThoughts || []);
      setOrganizedThoughts(journal.organizedThoughts || []);
      setCurrentLine(journal.currentLine || "");
      setSessionStartTime(new Date());
      setCurrentFileId(null);
    } else {
      // Continue editing - load exact state
      setLines(journal.rawThoughts || []);
      setOrganizedThoughts(journal.organizedThoughts || []);
      setCurrentLine(journal.currentLine || "");
      if (journal.sessionStartTime) {
        setSessionStartTime(new Date(journal.sessionStartTime));
      }
      setCurrentFileId(id);
    }
    setViewMode("stream");
  };

  const handleOpenFile = (file: JournalFile) => {
    handleLoadJournal(file.id, false);
  };

  const handleDeleteJournal = (id: string) => {
    if (confirm("Are you sure you want to delete this journal?")) {
      deleteJournal(id);
      setSavedJournals(listSavedJournals());
    }
  };

  const handleExportJournal = () => {
    const sessionData: JournalSession = {
      id: Date.now().toString(),
      projectId: selectedProjectId || undefined,
      createdAt: sessionStartTime.toISOString(),
      updatedAt: new Date().toISOString(),
      rawThoughts: lines,
      organizedThoughts,
      metadata: {
        duration: new Date().getTime() - sessionStartTime.getTime(),
        wordCount,
        lineCount: lines.length,
      },
      currentLine,
      sessionStartTime: sessionStartTime.toISOString(),
    };

    const json = exportJournalToJSON(sessionData);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJournal = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const journal = importJournalFromJSON(text);
      if (journal) {
        setPendingImport(journal);
        setShowImportConfirm(true);
      } else {
        alert("Failed to import journal. Invalid format.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const confirmImport = () => {
    if (!pendingImport) return;

    if (
      confirm("This will overwrite your current journal session. Continue?")
    ) {
      setLines(pendingImport.rawThoughts || []);
      setOrganizedThoughts(pendingImport.organizedThoughts || []);
      setCurrentLine(pendingImport.currentLine || "");
      if (pendingImport.sessionStartTime) {
        setSessionStartTime(new Date(pendingImport.sessionStartTime));
      } else {
        setSessionStartTime(new Date());
      }
      setViewMode("stream");
    }

    setShowImportConfirm(false);
    setPendingImport(null);
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-[#D0CCCC]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] text-[#D0CCCC] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#867979]/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[#D0CCCC] hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
          <div className="h-6 w-px bg-[#867979]/30" />
          {viewMode !== "files" && (
            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className="bg-[#171717] border border-[#867979]/30 rounded-lg px-4 py-2 text-[#D0CCCC] focus:outline-none focus:border-[#867979]"
            >
              <option value="">General Journal</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
          {viewMode === "files" && (
            <select
              value={selectedProjectFilter || "all"}
              onChange={(e) => setSelectedProjectFilter(e.target.value || null)}
              className="bg-[#171717] border border-[#867979]/30 rounded-lg px-4 py-2 text-[#D0CCCC] focus:outline-none focus:border-[#867979]"
            >
              <option value="all">All Projects</option>
              <option value="general">General</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
          {currentFileMetadata && viewMode !== "files" && (
            <>
              <div className="h-6 w-px bg-[#867979]/30" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#867979]">
                  {currentFileMetadata.name}
                </span>
                {currentFileMetadata.path && (
                  <span className="text-xs text-[#867979]/70">
                    {currentFileMetadata.path}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="text-sm text-[#867979]">
            {wordCount} words · {lines.length} lines · {sessionDuration}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("stream")}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === "stream"
                  ? "bg-[#867979] text-white"
                  : "text-[#D0CCCC] hover:bg-[#867979]/20"
              }`}
            >
              Stream
            </button>
            <button
              onClick={() => setViewMode("organize")}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === "organize"
                  ? "bg-[#867979] text-white"
                  : "text-[#D0CCCC] hover:bg-[#867979]/20"
              }`}
            >
              Organize
            </button>
            <button
              onClick={prepareExport}
              disabled={organizedThoughts.length === 0}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === "export"
                  ? "bg-[#867979] text-white"
                  : "text-[#D0CCCC] hover:bg-[#867979]/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Export
            </button>
            <button
              onClick={() => setViewMode("files")}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === "files"
                  ? "bg-[#867979] text-white"
                  : "text-[#D0CCCC] hover:bg-[#867979]/20"
              }`}
            >
              Files
            </button>
            {viewMode !== "files" && currentFileId && (
              <button
                onClick={() => setViewMode("files")}
                className="px-4 py-2 rounded-lg bg-[#867979]/30 hover:bg-[#867979]/40 text-[#D0CCCC] transition text-sm"
              >
                Back to Files
              </button>
            )}
            {(viewMode === "stream" || viewMode === "organize") && (
              <>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="px-4 py-2 rounded-lg bg-[#867979]/30 hover:bg-[#867979]/40 text-[#D0CCCC] transition"
                >
                  Save
                </button>
                <button
                  onClick={handleExportJournal}
                  className="px-4 py-2 rounded-lg bg-[#867979]/30 hover:bg-[#867979]/40 text-[#D0CCCC] transition"
                >
                  Export JSON
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stream of Consciousness View */}
      {viewMode === "stream" && (
        <div className="flex-1 flex flex-col relative">
          {/* Quick extract button when text is selected */}
          {selectedText && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-[#867979] rounded-lg p-2 flex gap-2 shadow-lg">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExtractType("action-item");
                  setShowExtractModal(true);
                }}
                onMouseDown={(e) => e.preventDefault()}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition"
              >
                Extract as Action
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExtractType("requirement");
                  setShowExtractModal(true);
                }}
                onMouseDown={(e) => e.preventDefault()}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition"
              >
                Extract as Requirement
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExtractType("feature");
                  setShowExtractModal(true);
                }}
                onMouseDown={(e) => e.preventDefault()} // Prevent selection loss
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition"
              >
                Extract as Feature
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedText("");
                  setStoredSelectionRange(null);
                  window.getSelection()?.removeAllRanges();
                }}
                onMouseDown={(e) => e.preventDefault()}
                className="px-2 py-1 text-[#867979] hover:text-white"
              >
                ×
              </button>
            </div>
          )}

          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-8 py-12 flex flex-col justify-end"
            onClick={() => setIsFocused(true)}
          >
            <div
              ref={streamAreaRef}
              className="max-w-4xl mx-auto w-full space-y-1"
            >
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="text-[#D0CCCC] text-xl font-mono leading-relaxed select-text"
                >
                  {line}
                </div>
              ))}

              <div className="flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentLine}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setIsFocused(false)}
                  onFocus={() => setIsFocused(true)}
                  className="bg-transparent text-[#D0CCCC] text-xl font-mono leading-relaxed w-full outline-none border-none focus:outline-none"
                  placeholder=""
                  autoFocus
                />
                {isFocused && (
                  <span className="inline-block w-2 h-6 bg-[#D0CCCC] ml-1 animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* Bottom hint */}
          <div className="px-8 py-4 border-t border-[#867979]/30 text-sm text-[#867979] text-center">
            Press Enter to add a line · ESC to go back · Select text to extract
          </div>
        </div>
      )}

      {/* Organize View */}
      {viewMode === "organize" && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Original stream */}
          <div className="w-1/2 border-r border-[#867979]/30 overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Original Thoughts
            </h2>
            <div className="space-y-2 font-mono text-sm">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="p-3 bg-[#867979]/10 rounded-lg border border-[#867979]/20"
                >
                  {line}
                </div>
              ))}
              {lines.length === 0 && (
                <div className="text-[#867979] text-center py-12">
                  No thoughts yet. Start writing in Stream mode.
                </div>
              )}
            </div>
          </div>

          {/* Right: Organized thoughts */}
          <div className="w-1/2 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Organized Thoughts
              </h2>
              <button
                onClick={() => {
                  const allText = lines.join(" ");
                  if (allText.trim()) {
                    extractThought(allText, "note");
                  }
                }}
                className="px-3 py-1 bg-[#867979] hover:bg-[#756868] rounded text-sm transition"
              >
                Extract All as Note
              </button>
            </div>

            <div className="space-y-3">
              {organizedThoughts.map((thought) => (
                <div
                  key={thought.id}
                  className="p-4 bg-[#867979]/10 rounded-lg border border-[#867979]/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          thought.type === "action-item"
                            ? "bg-blue-500/20 text-blue-300"
                            : thought.type === "requirement"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : thought.type === "feature"
                            ? "bg-green-500/20 text-green-300"
                            : thought.type === "question"
                            ? "bg-purple-500/20 text-purple-300"
                            : thought.type === "idea"
                            ? "bg-pink-500/20 text-pink-300"
                            : "bg-[#867979]/20 text-[#D0CCCC]"
                        }`}
                      >
                        {thought.type.replace("-", " ")}
                      </span>
                      {thought.priority && (
                        <span className="px-2 py-1 rounded text-xs bg-[#867979]/20">
                          {thought.priority}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteOrganizedThought(thought.id)}
                      className="text-[#867979] hover:text-white transition"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-[#D0CCCC] mb-2">{thought.originalText}</p>
                  {thought.expanded && (
                    <p className="text-sm text-[#867979] mt-2">
                      {thought.expanded}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <select
                      value={thought.type}
                      onChange={(e) =>
                        updateOrganizedThought(thought.id, {
                          type: e.target.value as OrganizedThought["type"],
                        })
                      }
                      className="bg-[#171717] border border-[#867979]/30 rounded px-2 py-1 text-xs text-[#D0CCCC]"
                    >
                      <option value="action-item">Action Item</option>
                      <option value="requirement">Requirement</option>
                      <option value="feature">Feature</option>
                      <option value="question">Question</option>
                      <option value="idea">Idea</option>
                      <option value="note">Note</option>
                    </select>
                    {thought.type === "action-item" && (
                      <select
                        value={thought.priority || "medium"}
                        onChange={(e) =>
                          updateOrganizedThought(thought.id, {
                            priority: e.target.value as
                              | "low"
                              | "medium"
                              | "high",
                          })
                        }
                        className="bg-[#171717] border border-[#867979]/30 rounded px-2 py-1 text-xs text-[#D0CCCC]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    )}
                    <button
                      onClick={() => {
                        const expanded = prompt(
                          "Add more details:",
                          thought.expanded || ""
                        );
                        if (expanded !== null) {
                          updateOrganizedThought(thought.id, { expanded });
                        }
                      }}
                      className="px-2 py-1 bg-[#867979]/20 hover:bg-[#867979]/30 rounded text-xs transition"
                    >
                      Expand
                    </button>
                  </div>
                </div>
              ))}
              {organizedThoughts.length === 0 && (
                <div className="text-[#867979] text-center py-12">
                  No organized thoughts yet. Select text in Stream mode or
                  extract thoughts here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export View */}
      {viewMode === "export" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Export to Project
            </h2>

            {!selectedProjectId && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
                <p className="text-yellow-300">
                  Please select a project to export to.
                </p>
              </div>
            )}

            {/* Tasks */}
            {exportItems.tasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Tasks ({exportItems.tasks.length})
                </h3>
                <div className="space-y-2">
                  {exportItems.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="p-3 bg-[#867979]/10 rounded-lg border border-[#867979]/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[#D0CCCC]">{task.text}</span>
                        <span className="px-2 py-1 bg-[#867979]/20 rounded text-xs">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {exportItems.requirements.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Requirements ({exportItems.requirements.length})
                </h3>
                <div className="space-y-2">
                  {exportItems.requirements.map((req, index) => (
                    <div
                      key={index}
                      className="p-3 bg-[#867979]/10 rounded-lg border border-[#867979]/20"
                    >
                      <pre className="text-[#D0CCCC] text-sm whitespace-pre-wrap font-mono">
                        {req}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {exportItems.features.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-white">
                  Features ({exportItems.features.length})
                </h3>
                <div className="space-y-3">
                  {exportItems.features.map((feature, index) => (
                    <div
                      key={index}
                      className="p-4 bg-[#867979]/10 rounded-lg border border-[#867979]/20"
                    >
                      <h4 className="font-semibold text-white mb-2">
                        {feature.name}
                      </h4>
                      {feature.description && (
                        <p className="text-[#D0CCCC] text-sm mb-2">
                          {feature.description}
                        </p>
                      )}
                      {feature.impact && (
                        <p className="text-[#867979] text-sm">
                          Impact: {feature.impact}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exportItems.tasks.length === 0 &&
              exportItems.requirements.length === 0 &&
              exportItems.features.length === 0 && (
                <div className="text-center py-12 text-[#867979]">
                  No items to export. Organize your thoughts first.
                </div>
              )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setViewMode("organize")}
                className="px-6 py-3 border border-[#867979] rounded-lg hover:bg-[#867979]/20 transition"
              >
                Back to Organize
              </button>
              <button
                onClick={exportToProject}
                disabled={!selectedProjectId}
                className="px-6 py-3 bg-[#867979] hover:bg-[#756868] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export to {selectedProject?.name || "Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files View */}
      {viewMode === "files" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">
                Journal Files
              </h2>
              <div className="flex gap-2">
                <label className="px-4 py-2 bg-[#867979] hover:bg-[#756868] rounded-lg cursor-pointer transition">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJournal}
                    className="hidden"
                  />
                  Import JSON
                </label>
                <button
                  onClick={() => {
                    setLines([]);
                    setOrganizedThoughts([]);
                    setCurrentLine("");
                    setCurrentFileId(null);
                    setSessionStartTime(new Date());
                    setViewMode("stream");
                    // Set selected project based on filter if in files view
                    if (
                      selectedProjectFilter &&
                      selectedProjectFilter !== "all" &&
                      selectedProjectFilter !== "general"
                    ) {
                      setSelectedProjectId(selectedProjectFilter);
                    } else if (selectedProjectFilter === "general") {
                      setSelectedProjectId(null);
                    }
                  }}
                  className="px-4 py-2 bg-[#867979] hover:bg-[#756868] rounded-lg transition"
                >
                  New Journal
                </button>
              </div>
            </div>

            <JournalFileExplorer
              currentPath={currentFolderPath}
              onPathChange={setCurrentFolderPath}
              onOpenFile={handleOpenFile}
              onRename={(id, name, type) => {
                renameItem(id, name, type);
                setSavedJournals(listSavedJournals());
                if (id === currentFileId) {
                  const metadata = getItemMetadata(id);
                  setCurrentFileMetadata(metadata);
                }
              }}
              onDelete={(id, type) => {
                if (id === currentFileId) {
                  setCurrentFileId(null);
                  setCurrentFileMetadata(null);
                }
                deleteItem(id, type);
                setSavedJournals(listSavedJournals());
              }}
              selectedProjectFilter={selectedProjectFilter}
              projects={projects}
              currentFileId={currentFileId}
            />
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#867979] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-white">
              {currentFileId ? "Save Journal" : "Save New Journal"}
            </h3>
            {currentFileMetadata && (
              <p className="text-sm text-[#867979] mb-2">
                Current file: {currentFileMetadata.name}
              </p>
            )}
            <p className="text-sm text-[#867979] mb-4">
              Saving to:{" "}
              {currentFolderPath === "/" ? "Root" : currentFolderPath}
            </p>
            <input
              type="text"
              value={saveJournalName}
              onChange={(e) => setSaveJournalName(e.target.value)}
              placeholder={currentFileMetadata?.name || "Journal name..."}
              className="w-full px-4 py-3 bg-[#171717] border border-[#867979] rounded-lg text-[#D0CCCC] focus:outline-none focus:border-[#867979] mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveJournal();
                } else if (e.key === "Escape") {
                  setShowSaveModal(false);
                  setSaveJournalName("");
                }
              }}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveJournal}
                disabled={!saveJournalName.trim()}
                className="flex-1 px-4 py-2 bg-[#867979] hover:bg-[#756868] rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentFileId ? "Update" : "Save"}
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveJournalName("");
                }}
                className="flex-1 px-4 py-2 border border-[#867979] rounded hover:bg-[#867979]/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {showImportConfirm && pendingImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#867979] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Import Journal
            </h3>
            <p className="text-[#D0CCCC] mb-4">
              This will overwrite your current journal session. Are you sure you
              want to continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmImport}
                className="flex-1 px-4 py-2 bg-[#867979] hover:bg-[#756868] rounded transition"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportConfirm(false);
                  setPendingImport(null);
                }}
                className="flex-1 px-4 py-2 border border-[#867979] rounded hover:bg-[#867979]/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extract Modal */}
      {showExtractModal && selectedText && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#867979] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Extract as {extractType.replace("-", " ")}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#D0CCCC] mb-2">
                {extractType === "feature"
                  ? "Feature Name"
                  : extractType === "requirement"
                  ? "Requirement"
                  : extractType === "action-item"
                  ? "Action Item"
                  : "Text"}
              </label>
              <p className="text-[#D0CCCC] p-3 bg-[#867979]/10 rounded">
                {selectedText}
              </p>
            </div>

            {extractType === "feature" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#D0CCCC] mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                    placeholder="Add more details about this feature..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#171717] border border-[#867979] rounded-lg text-[#D0CCCC] focus:outline-none focus:border-[#867979] resize-none"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#D0CCCC] mb-2">
                    Impact (optional)
                  </label>
                  <textarea
                    value={featureImpact}
                    onChange={(e) => setFeatureImpact(e.target.value)}
                    placeholder="How does this create impact?"
                    rows={2}
                    className="w-full px-4 py-3 bg-[#171717] border border-[#867979] rounded-lg text-[#D0CCCC] focus:outline-none focus:border-[#867979] resize-none"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => extractThought(selectedText, extractType)}
                className="flex-1 px-4 py-2 bg-[#867979] hover:bg-[#756868] rounded transition"
              >
                Extract
              </button>
              <button
                onClick={() => {
                  setShowExtractModal(false);
                  setSelectedText("");
                  setFeatureDescription("");
                  setFeatureImpact("");
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

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#171717] flex items-center justify-center">
          <div className="text-[#D0CCCC]">Loading...</div>
        </div>
      }
    >
      <JournalPageContent />
    </Suspense>
  );
}
