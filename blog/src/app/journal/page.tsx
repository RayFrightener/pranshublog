"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkAuth } from "@/lib/auth";

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
}

type ViewMode = "stream" | "organize" | "export";

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

  // Organize state
  const [organizedThoughts, setOrganizedThoughts] = useState<
    OrganizedThought[]
  >([]);
  const [selectedText, setSelectedText] = useState<string>("");
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractType, setExtractType] =
    useState<OrganizedThought["type"]>("note");

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

  // Handle text selection in stream view
  useEffect(() => {
    if (viewMode === "stream" && streamAreaRef.current) {
      const handleSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          setSelectedText(selection.toString().trim());
        } else {
          setSelectedText("");
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
    };
    setOrganizedThoughts([...organizedThoughts, newThought]);
    setSelectedText("");
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

  const getSessionDuration = () => {
    const now = new Date();
    const diff = now.getTime() - sessionStartTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
          {selectedProject && (
            <span className="text-sm text-[#867979]">
              {selectedProject.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="text-sm text-[#867979]">
            {wordCount} words · {lines.length} lines · {getSessionDuration()}
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
                onClick={() => {
                  setExtractType("action-item");
                  setShowExtractModal(true);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition"
              >
                Extract as Action
              </button>
              <button
                onClick={() => {
                  setExtractType("requirement");
                  setShowExtractModal(true);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition"
              >
                Extract as Requirement
              </button>
              <button
                onClick={() => {
                  setExtractType("feature");
                  setShowExtractModal(true);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition"
              >
                Extract as Feature
              </button>
              <button
                onClick={() => setSelectedText("")}
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

      {/* Extract Modal */}
      {showExtractModal && selectedText && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#171717] border border-[#867979] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Extract as {extractType.replace("-", " ")}
            </h3>
            <p className="text-[#D0CCCC] mb-4 p-3 bg-[#867979]/10 rounded">
              {selectedText}
            </p>
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
