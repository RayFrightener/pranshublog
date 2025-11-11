"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/lib/auth";

interface Thought {
  id: string;
  text: string;
  expanded?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  parentFeatureId?: string;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  impact: string;
  expanded?: string;
  status: "idea" | "planning" | "in-progress" | "completed";
  actionItems: string[];
  tasks: Task[];
  priority: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: "milestone" | "feature-complete" | "release";
  featureId?: string;
}

interface ImpactPlan {
  vision: string;
  targetAudience?: string;
  successMetrics?: string;
  features: Feature[];
  requirements?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  moreInfo?: string;
  thoughts: Thought[] | string[];
  impactPlan?: ImpactPlan;
  timeline: TimelineEvent[];
  tasks: Task[];
  lastUpdated: string;
  status: "active" | "paused" | "archived";
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectMoreInfo, setProjectMoreInfo] = useState("");

  // Check authentication on mount
  useEffect(() => {
    if (!checkAuth()) {
      router.push("/journal/auth");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    const savedProjects = localStorage.getItem("dashboard-projects");
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        // Migrate old projects to new structure
        const migrated = parsed.map((p: any) => ({
          ...p,
          timeline: p.timeline || [],
          tasks: p.tasks || [],
          createdAt: p.createdAt || p.lastUpdated,
        }));
        setProjects(migrated);
      } catch (e) {
        console.error("Error loading projects:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem("dashboard-projects", JSON.stringify(projects));
    }
  }, [projects]);

  const createProject = () => {
    if (!projectName.trim()) return;

    const project: Project = {
      id: Date.now().toString(),
      name: projectName,
      description: projectDescription,
      moreInfo: projectMoreInfo,
      thoughts: [],
      timeline: [],
      tasks: [],
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: "active",
    };

    setProjects([...projects, project]);
    setProjectName("");
    setProjectDescription("");
    setProjectMoreInfo("");
    setShowCreateModal(false);
    setSelectedProject(project.id);
  };

  const activeProjects = projects.filter((p) => p.status === "active");
  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-[#D0CCCC]">Loading...</div>
      </div>
    );
  }

  if (selectedProject && selectedProjectData) {
    return (
      <ProjectWorkspace
        project={selectedProjectData}
        onBack={() => setSelectedProject(null)}
        onUpdate={(updatedProject) => {
          setProjects(
            projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            )
          );
        }}
      />
    );
  }

  // Calculate progress for project card - FIXED
  const getProjectProgress = (project: Project) => {
    const allTasks = [
      ...(project.tasks || []),
      ...(project.impactPlan?.features?.flatMap((f) => f.tasks || []) || []),
    ];
    if (allTasks.length === 0) return 0;
    const completed = allTasks.filter((t) => t.status === "done").length;
    return Math.round((completed / allTasks.length) * 100);
  };

  const getProjectStats = (project: Project) => {
    const allTasks = [
      ...(project.tasks || []),
      ...(project.impactPlan?.features?.flatMap((f) => f.tasks || []) || []),
    ];
    const completedTasks = allTasks.filter((t) => t.status === "done").length;
    const inProgressTasks = allTasks.filter(
      (t) => t.status === "in-progress"
    ).length;
    const todoTasks = allTasks.filter((t) => t.status === "todo").length;
    const features = project.impactPlan?.features || [];
    const completedFeatures = features.filter(
      (f) => f.status === "completed"
    ).length;
    const inProgressFeatures = features.filter(
      (f) => f.status === "in-progress"
    ).length;
    const nextFeature = features.find(
      (f) => f.status === "idea" || f.status === "planning"
    );
    const currentFeature = features.find((f) => f.status === "in-progress");

    // Calculate days since last update
    const lastUpdate = new Date(project.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = Math.floor(
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      totalTasks: allTasks.length,
      completedTasks,
      inProgressTasks,
      todoTasks,
      totalFeatures: features.length,
      completedFeatures,
      inProgressFeatures,
      nextFeature: nextFeature?.name,
      currentFeature: currentFeature?.name,
      daysSinceUpdate,
      hasActivity: daysSinceUpdate < 7, // Active if updated in last week
    };
  };

  return (
    <div className="min-h-screen bg-[#C7BEBE] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-light text-[#171717] mb-2">
              Welcome Back
            </h1>
            <p className="text-[#171717]/80 text-lg">
              Your projects and thoughts, all in one place
            </p>
          </div>
          <button
            onClick={() => router.push("/journal")}
            className="bg-[#867979] text-white px-6 py-3 rounded-full hover:bg-[#756868] transition-all shadow-sm hover:shadow-md font-medium"
          >
            Start Journaling
          </button>
        </div>

        <div className="mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#867979] text-white px-8 py-4 rounded-2xl hover:bg-[#756868] transition-all shadow-lg hover:shadow-xl font-semibold text-lg flex items-center gap-2"
          >
            <span className="text-2xl">+</span>
            Create New Project
          </button>
        </div>

        {activeProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-light text-[#171717] mb-2">
              No projects yet
            </h2>
            <p className="text-[#171717]/70 mb-6">
              Create your first project to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#867979] text-white px-6 py-3 rounded-full hover:bg-[#756868] transition-all shadow-sm"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project, index) => {
              const stats = getProjectStats(project);
              const progress = getProjectProgress(project);
              return (
                <div
                  key={project.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", project.id);
                    e.currentTarget.style.opacity = "0.5";
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData("text/plain");
                    if (draggedId !== project.id) {
                      const draggedIndex = projects.findIndex(
                        (p) => p.id === draggedId
                      );
                      const dropIndex = projects.findIndex(
                        (p) => p.id === project.id
                      );
                      if (draggedIndex !== -1 && dropIndex !== -1) {
                        const newProjects = [...projects];
                        const [removed] = newProjects.splice(draggedIndex, 1);
                        newProjects.splice(dropIndex, 0, removed);
                        setProjects(newProjects);
                      }
                    }
                  }}
                  className="cursor-move"
                >
                  <button
                    onClick={() => setSelectedProject(project.id)}
                    className="w-full bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all shadow-md hover:shadow-xl text-left border border-[#867979] group"
                  >
                    {/* Header with Status */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-[#171717] group-hover:text-[#171717] transition flex-1">
                        {project.name}
                      </h3>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs px-2 py-1 bg-[#867979] text-white rounded-full capitalize">
                          {project.status}
                        </span>
                        {stats.hasActivity && (
                          <span className="text-xs px-2 py-0.5 bg-[#867979]/20 text-[#171717] rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-[#171717]/80 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Progress Section */}
                    <div className="mb-4 space-y-3">
                      {/* Overall Progress */}
                      <div>
                        <div className="flex justify-between text-xs text-[#171717] mb-1">
                          <span className="font-medium">Overall Progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full bg-[#867979]/20 rounded-full h-2.5">
                          <div
                            className="bg-[#867979] h-2.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Tasks Breakdown */}
                      {stats.totalTasks > 0 && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-[#867979]/20 rounded-lg p-2 text-center">
                            <div className="font-semibold text-[#171717]">
                              {stats.completedTasks}
                            </div>
                            <div className="text-[#171717]/80">Done</div>
                          </div>
                          <div className="bg-[#867979]/20 rounded-lg p-2 text-center">
                            <div className="font-semibold text-[#171717]">
                              {stats.inProgressTasks}
                            </div>
                            <div className="text-[#171717]/80">Active</div>
                          </div>
                          <div className="bg-[#867979]/20 rounded-lg p-2 text-center">
                            <div className="font-semibold text-[#171717]">
                              {stats.todoTasks}
                            </div>
                            <div className="text-[#171717]/80">Todo</div>
                          </div>
                        </div>
                      )}

                      {/* Features Summary */}
                      {stats.totalFeatures > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[#171717]">Features:</span>
                            <span className="font-semibold text-[#171717]">
                              {stats.completedFeatures}/{stats.totalFeatures}{" "}
                              completed
                            </span>
                          </div>
                          {stats.inProgressFeatures > 0 && (
                            <span className="px-2 py-1 bg-[#867979]/20 text-[#171717] rounded-full">
                              {stats.inProgressFeatures} in progress
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Current Focus / Next Steps */}
                    {(stats.currentFeature || stats.nextFeature) && (
                      <div className="mb-4 pt-4 border-t border-[#867979]">
                        {stats.currentFeature && (
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-[#756868] text-xs mt-0.5">
                              ⚡
                            </span>
                            <div className="flex-1">
                              <div className="text-xs text-[#171717] font-medium mb-0.5">
                                Currently Working On:
                              </div>
                              <div className="text-sm text-[#171717] font-medium">
                                {stats.currentFeature}
                              </div>
                            </div>
                          </div>
                        )}
                        {stats.nextFeature && !stats.currentFeature && (
                          <div className="flex items-start gap-2">
                            <span className="text-[#756868] text-xs mt-0.5">
                              📋
                            </span>
                            <div className="flex-1">
                              <div className="text-xs text-[#171717] font-medium mb-0.5">
                                Next Up:
                              </div>
                              <div className="text-sm text-[#171717] font-medium">
                                {stats.nextFeature}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer with Metadata */}
                    <div className="flex items-center justify-between text-xs text-[#171717] pt-3 border-t border-[#867979]">
                      <div className="flex gap-3">
                        {stats.totalTasks > 0 && (
                          <span>{stats.totalTasks} tasks</span>
                        )}
                        {stats.totalFeatures > 0 && (
                          <span>{stats.totalFeatures} features</span>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span>
                          {stats.daysSinceUpdate === 0
                            ? "Updated today"
                            : stats.daysSinceUpdate === 1
                            ? "Updated yesterday"
                            : `Updated ${stats.daysSinceUpdate}d ago`}
                        </span>
                        {stats.daysSinceUpdate > 7 && (
                          <span className="text-[#756868] text-[10px] mt-0.5">
                            Needs attention
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-light text-[#171717]">
                  Create New Project
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setProjectName("");
                    setProjectDescription("");
                    setProjectMoreInfo("");
                  }}
                  className="text-[#867979] hover:text-[#756868] text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#756868] transition"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[#171717] font-medium mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 text-base"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && createProject()}
                  />
                </div>

                <div>
                  <label className="block text-[#171717] font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="What is this project about?"
                    rows={3}
                    className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 resize-none text-base"
                  />
                </div>

                <div>
                  <label className="block text-[#171717] font-medium mb-2">
                    More Info
                  </label>
                  <textarea
                    value={projectMoreInfo}
                    onChange={(e) => setProjectMoreInfo(e.target.value)}
                    placeholder="Additional details, goals, or context..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 resize-none text-base"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setProjectName("");
                      setProjectDescription("");
                      setProjectMoreInfo("");
                    }}
                    className="flex-1 px-6 py-3 border-2 border-[#867979] text-[#171717] rounded-xl hover:bg-[#756868] transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createProject}
                    disabled={!projectName.trim()}
                    className="flex-1 px-6 py-3 bg-[#867979] text-white rounded-xl hover:bg-[#756868] transition shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Project Workspace Component
function ProjectWorkspace({
  project,
  onBack,
  onUpdate,
}: {
  project: Project;
  onBack: () => void;
  onUpdate: (project: Project) => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "planning" | "tracking" | "thoughts" | "journal"
  >("tracking"); // Changed default to "tracking"

  return (
    <div className="min-h-screen bg-[#C7BEBE]">
      <div className="bg-[#867979]/30 backdrop-blur-sm border-b border-[#867979] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-[#171717] hover:text-[#171717] hover:bg-[#867979]/20 px-4 py-2 rounded-lg transition font-medium"
            >
              ← Back to Projects
            </button>
            <div>
              <h1 className="text-3xl font-light text-[#171717]">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-[#171717]/70 text-sm mt-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push(`/journal?projectId=${project.id}`)}
            className="bg-[#867979] text-white px-6 py-2 rounded-full hover:bg-[#756868] transition-all shadow-sm font-medium"
          >
            Start Journaling
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-2 border-b border-[#867979] overflow-x-auto">
          {[
            { id: "tracking", label: "Tracking" }, // First
            { id: "planning", label: "Planning" }, // Second
            { id: "thoughts", label: "Thoughts" },
            { id: "journal", label: "Journal" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-[#171717] border-b-2 border-[#867979]"
                  : "text-[#171717]/70 hover:text-[#171717]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "tracking" && (
          <TrackingTab project={project} onUpdate={onUpdate} />
        )}
        {activeTab === "planning" && (
          <PlanningTab project={project} onUpdate={onUpdate} />
        )}
        {activeTab === "thoughts" && (
          <ThoughtsTab project={project} onUpdate={onUpdate} />
        )}
        {activeTab === "journal" && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
            <h2 className="text-2xl font-light text-[#171717] mb-4">Journal</h2>
            <p className="text-[#171717]/80 mb-4">
              Use the &quot;Start Journaling&quot; button in the header to begin
              stream-of-consciousness writing.
            </p>
            <button
              onClick={() => router.push("/journal")}
              className="bg-[#867979] text-white px-6 py-3 rounded-xl hover:bg-[#756868] transition font-medium"
            >
              Open Journal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Planning Tab Component
function PlanningTab({
  project,
  onUpdate,
}: {
  project: Project;
  onUpdate: (project: Project) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<
    "features" | "tasks" | "requirements"
  >("features");
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(
    null
  );
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

  // Feature form state
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureDescription, setNewFeatureDescription] = useState("");
  const [newFeatureImpact, setNewFeatureImpact] = useState("");
  const [newFeatureExpanded, setNewFeatureExpanded] = useState("");

  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [newTaskFeatureId, setNewTaskFeatureId] = useState<string>("");

  // Requirements state
  const [requirements, setRequirements] = useState(
    project.impactPlan?.requirements || ""
  );

  const features = project.impactPlan?.features || [];

  const initializeImpactPlan = () => {
    if (!project.impactPlan) {
      const updated = {
        ...project,
        impactPlan: {
          vision: "",
          features: [],
          requirements: "",
        },
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    }
  };

  useEffect(() => {
    initializeImpactPlan();
  }, []);

  useEffect(() => {
    if (project.impactPlan?.requirements !== requirements) {
      const updated = {
        ...project,
        impactPlan: {
          ...project.impactPlan!,
          requirements,
        },
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    }
  }, [requirements]);

  const addFeature = () => {
    if (!newFeatureName.trim()) return;
    initializeImpactPlan();

    const feature: Feature = {
      id: Date.now().toString(),
      name: newFeatureName,
      description: newFeatureDescription,
      impact: newFeatureImpact,
      status: "idea",
      actionItems: [],
      tasks: [],
      priority: features.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...project,
      impactPlan: {
        ...project.impactPlan!,
        features: [...features, feature],
      },
      lastUpdated: new Date().toISOString(),
    };
    onUpdate(updated);
    setNewFeatureName("");
    setNewFeatureDescription("");
    setNewFeatureImpact("");
  };

  const deleteFeature = (featureId: string) => {
    const updated = {
      ...project,
      impactPlan: {
        ...project.impactPlan!,
        features: features.filter((f) => f.id !== featureId),
      },
      lastUpdated: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  const updateFeature = (featureId: string, updates: Partial<Feature>) => {
    const updatedFeatures = features.map((f) =>
      f.id === featureId
        ? { ...f, ...updates, updatedAt: new Date().toISOString() }
        : f
    );
    const updated = {
      ...project,
      impactPlan: {
        ...project.impactPlan!,
        features: updatedFeatures,
      },
      lastUpdated: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      status: "todo",
      priority: newTaskPriority,
      createdAt: new Date().toISOString(),
      parentFeatureId: newTaskFeatureId || undefined,
    };

    if (newTaskFeatureId) {
      // Add to feature
      const updatedFeatures = features.map((f) =>
        f.id === newTaskFeatureId
          ? {
              ...f,
              tasks: [...f.tasks, task],
              updatedAt: new Date().toISOString(),
            }
          : f
      );
      const updated = {
        ...project,
        impactPlan: {
          ...project.impactPlan!,
          features: updatedFeatures,
        },
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    } else {
      // Add as standalone task
      const updated = {
        ...project,
        tasks: [...project.tasks, task],
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    }

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskFeatureId("");
  };

  const updateTask = (
    taskId: string,
    updates: Partial<Task>,
    isStandalone: boolean
  ) => {
    if (isStandalone) {
      const updatedTasks = project.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      );
      const updated = {
        ...project,
        tasks: updatedTasks,
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    } else {
      const updatedFeatures = features.map((f) => ({
        ...f,
        tasks: f.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
        updatedAt: new Date().toISOString(),
      }));
      const updated = {
        ...project,
        impactPlan: {
          ...project.impactPlan!,
          features: updatedFeatures,
        },
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    }
  };

  const deleteTask = (taskId: string, isStandalone: boolean) => {
    if (isStandalone) {
      const updated = {
        ...project,
        tasks: project.tasks.filter((t) => t.id !== taskId),
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    } else {
      const updatedFeatures = features.map((f) => ({
        ...f,
        tasks: f.tasks.filter((t) => t.id !== taskId),
        updatedAt: new Date().toISOString(),
      }));
      const updated = {
        ...project,
        impactPlan: {
          ...project.impactPlan!,
          features: updatedFeatures,
        },
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-[#867979]">
        {[
          { id: "features", label: "Features" },
          { id: "tasks", label: "To-Do Lists" },
          { id: "requirements", label: "Requirements" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition ${
              activeSubTab === tab.id
                ? "text-[#171717] border-b-2 border-[#867979]"
                : "text-[#171717]/70 hover:text-[#171717]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Features Sub-tab */}
      {activeSubTab === "features" && (
        <div className="space-y-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
            <h2 className="text-2xl font-light text-[#171717] mb-4">
              Add New Feature
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newFeatureName}
                onChange={(e) => setNewFeatureName(e.target.value)}
                placeholder="Feature name..."
                className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 text-base"
                onKeyDown={(e) => e.key === "Enter" && addFeature()}
              />
              <textarea
                value={newFeatureDescription}
                onChange={(e) => setNewFeatureDescription(e.target.value)}
                placeholder="Description..."
                rows={2}
                className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 resize-none text-base"
              />
              <textarea
                value={newFeatureImpact}
                onChange={(e) => setNewFeatureImpact(e.target.value)}
                placeholder="How does this create impact?"
                rows={2}
                className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 resize-none text-base"
              />
              <button
                onClick={addFeature}
                className="px-6 py-3 bg-[#867979] text-white rounded-xl hover:bg-[#756868] transition font-medium"
              >
                Add Feature
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {features.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-[#867979] text-center">
                <p className="text-[#171717]/70">
                  No features yet. Add one above.
                </p>
              </div>
            ) : (
              features
                .sort((a, b) => a.priority - b.priority)
                .map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    isExpanded={expandedFeatureId === feature.id}
                    isEditing={editingFeatureId === feature.id}
                    onExpand={() =>
                      setExpandedFeatureId(
                        expandedFeatureId === feature.id ? null : feature.id
                      )
                    }
                    onEdit={() => setEditingFeatureId(feature.id)}
                    onCancelEdit={() => setEditingFeatureId(null)}
                    onUpdate={(updates) => updateFeature(feature.id, updates)}
                    onDelete={() => deleteFeature(feature.id)}
                    onStatusChange={(status) =>
                      updateFeature(feature.id, { status })
                    }
                  />
                ))
            )}
          </div>
        </div>
      )}

      {/* Tasks Sub-tab */}
      {activeSubTab === "tasks" && (
        <div className="space-y-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
            <h2 className="text-2xl font-light text-[#171717] mb-4">
              Add New Task
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 text-base"
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Description (optional)..."
                rows={2}
                className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 resize-none text-base"
              />
              <div className="flex gap-4">
                {/* Priority Selection - MCQ Style */}
                <div>
                  <label className="block text-[#171717] font-medium mb-2 text-sm">
                    Priority
                  </label>
                  <div className="flex gap-4">
                    {[
                      {
                        value: "low",
                        label: "Low",
                        color: "bg-blue-100 text-blue-700",
                      },
                      {
                        value: "medium",
                        label: "Medium",
                        color: "bg-yellow-100 text-yellow-700",
                      },
                      {
                        value: "high",
                        label: "High",
                        color: "bg-red-100 text-red-700",
                      },
                    ].map((priority) => (
                      <label
                        key={priority.value}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition ${
                          newTaskPriority === priority.value
                            ? `border-[#867979] ${priority.color}`
                            : "border-[#867979] hover:border-[#756868] bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={priority.value}
                          checked={newTaskPriority === priority.value}
                          onChange={(e) =>
                            setNewTaskPriority(
                              e.target.value as "low" | "medium" | "high"
                            )
                          }
                          className="sr-only"
                        />
                        <span className="font-medium">{priority.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Feature Selection - MCQ Style */}
                <div>
                  <label className="block text-[#171717] font-medium mb-2 text-sm">
                    Assign to Feature
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <label
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition ${
                        newTaskFeatureId === ""
                          ? "border-[#867979] bg-[#867979]/20"
                          : "border-[#867979] hover:border-[#756868] bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="feature"
                        value=""
                        checked={newTaskFeatureId === ""}
                        onChange={(e) => setNewTaskFeatureId(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          newTaskFeatureId === ""
                            ? "border-[#867979] bg-[#867979]"
                            : "border-[#867979] bg-white"
                        }`}
                      >
                        {newTaskFeatureId === "" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="font-medium text-[#171717]">
                        Standalone Task
                      </span>
                    </label>
                    {features.map((f) => (
                      <label
                        key={f.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition ${
                          newTaskFeatureId === f.id
                            ? "border-[#867979] bg-[#867979]/20"
                            : "border-[#867979] hover:border-[#756868] bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="feature"
                          value={f.id}
                          checked={newTaskFeatureId === f.id}
                          onChange={(e) => setNewTaskFeatureId(e.target.value)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            newTaskFeatureId === f.id
                              ? "border-[#867979] bg-[#867979]"
                              : "border-[#867979] bg-white"
                          }`}
                        >
                          {newTaskFeatureId === f.id && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="font-medium text-[#171717]">
                          {f.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={addTask}
                className="px-6 py-3 bg-[#867979] text-white rounded-xl hover:bg-[#756868] transition font-medium"
              >
                Add Task
              </button>
            </div>
          </div>

          {/* Standalone Tasks */}
          {project.tasks.length > 0 && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
              <h3 className="text-xl font-light text-[#171717] mb-4">
                Standalone Tasks
              </h3>
              <div className="space-y-2">
                {project.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={(updates) => updateTask(task.id, updates, true)}
                    onDelete={() => deleteTask(task.id, true)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feature Tasks */}
          {features.map((feature) =>
            feature.tasks.length > 0 ? (
              <div
                key={feature.id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]"
              >
                <h3 className="text-xl font-light text-[#171717] mb-4">
                  {feature.name} Tasks
                </h3>
                <div className="space-y-2">
                  {feature.tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={(updates) =>
                        updateTask(task.id, updates, false)
                      }
                      onDelete={() => deleteTask(task.id, false)}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}

          {project.tasks.length === 0 &&
            features.every((f) => f.tasks.length === 0) && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-[#867979] text-center">
                <p className="text-[#171717]/70">
                  No tasks yet. Add one above.
                </p>
              </div>
            )}
        </div>
      )}

      {/* Requirements Sub-tab */}
      {activeSubTab === "requirements" && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
          <h2 className="text-2xl font-light text-[#171717] mb-4">
            Project Requirements
          </h2>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Define your project requirements, goals, and specifications here..."
            rows={20}
            className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 resize-none font-mono text-base"
          />
        </div>
      )}
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  feature,
  isExpanded,
  isEditing,
  onExpand,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onStatusChange,
}: {
  feature: Feature;
  isExpanded: boolean;
  isEditing: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (updates: Partial<Feature>) => void;
  onDelete: () => void;
  onStatusChange: (status: Feature["status"]) => void;
}) {
  const [editName, setEditName] = useState(feature.name);
  const [editDescription, setEditDescription] = useState(feature.description);
  const [editImpact, setEditImpact] = useState(feature.impact);
  const [editExpanded, setEditExpanded] = useState(feature.expanded || "");

  useEffect(() => {
    if (isEditing) {
      setEditName(feature.name);
      setEditDescription(feature.description);
      setEditImpact(feature.impact);
      setEditExpanded(feature.expanded || "");
    }
  }, [isEditing, feature]);

  const handleSave = () => {
    onUpdate({
      name: editName,
      description: editDescription,
      impact: editImpact,
      expanded: editExpanded.trim() || undefined,
    });
    onCancelEdit();
  };

  const statusColors = {
    idea: "bg-[#867979]/20 text-[#171717]",
    planning: "bg-[#867979]/30 text-[#171717]",
    "in-progress": "bg-[#867979]/20 text-[#171717]",
    completed: "bg-[#867979]/20 text-[#171717]",
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#867979] overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#867979] rounded-lg focus:outline-none focus:border-[#867979] text-[#171717] font-semibold text-lg mb-2"
                autoFocus
              />
            ) : (
              <h3 className="text-xl font-semibold text-[#171717] mb-2">
                {feature.name}
              </h3>
            )}
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#867979] rounded-lg focus:outline-none focus:border-[#867979] text-[#171717] text-base mb-2 resize-none"
                rows={2}
              />
            ) : (
              feature.description && (
                <p className="text-[#171717] text-sm mb-2">
                  {feature.description}
                </p>
              )
            )}
            {isEditing ? (
              <textarea
                value={editImpact}
                onChange={(e) => setEditImpact(e.target.value)}
                placeholder="How does this create impact?"
                className="w-full px-3 py-2 bg-white border-2 border-[#867979] rounded-lg focus:outline-none focus:border-[#867979] text-[#171717] text-base mb-2 resize-none"
                rows={2}
              />
            ) : (
              feature.impact && (
                <p className="text-[#171717] text-sm italic mb-2">
                  Impact: {feature.impact}
                </p>
              )
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <select
              value={feature.status}
              onChange={(e) =>
                onStatusChange(e.target.value as Feature["status"])
              }
              className={`px-3 py-1 rounded-lg text-xs font-medium border-2 border-transparent focus:outline-none focus:border-[#867979] bg-white ${
                statusColors[feature.status]
              }`}
            >
              <option value="idea">Idea</option>
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            {!isEditing && (
              <>
                <button
                  onClick={onEdit}
                  className="text-[#171717] hover:text-[#867979] px-2 py-1 rounded hover:bg-white/50 transition text-sm"
                >
                  ✎
                </button>
                <button
                  onClick={onDelete}
                  className="text-[#171717] hover:text-[#867979] px-2 py-1 rounded hover:bg-white/50 transition"
                >
                  ×
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mb-4">
            <label className="block text-[#171717] font-medium mb-2 text-sm">
              Detailed Breakdown:
            </label>
            <textarea
              value={editExpanded}
              onChange={(e) => setEditExpanded(e.target.value)}
              placeholder="Add detailed requirements, system design, or breakdown..."
              className="w-full px-3 py-2 bg-white border-2 border-[#867979] rounded-lg focus:outline-none focus:border-[#867979] text-[#171717] text-base resize-none"
              rows={6}
            />
          </div>
        )}

        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#867979] text-white rounded-lg hover:bg-[#756868] transition font-medium text-sm"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 border border-[#867979] text-[#171717] rounded-lg hover:bg-white/50 transition font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {feature.expanded && (
              <div className="mb-4 pt-4 border-t border-[#867979]">
                <p className="text-[#171717] text-sm whitespace-pre-wrap">
                  {feature.expanded}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-[#171717]">
              <span>{feature.tasks.length} tasks</span>
              <button
                onClick={onExpand}
                className="text-[#171717] hover:text-[#867979] font-medium"
              >
                {isExpanded ? "Collapse" : "Expand"} Details
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  onUpdate,
  onDelete,
}: {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description || ""
  );

  const priorityColors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  const handleToggle = () => {
    const newStatus = task.status === "done" ? "todo" : "done";
    onUpdate({
      status: newStatus,
      completedAt: newStatus === "done" ? new Date().toISOString() : undefined,
    });
  };

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      description: editDescription.trim() || undefined,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-[#867979] hover:border-[#756868] transition group">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.status === "done"}
          onChange={handleToggle}
          style={{ colorScheme: "light" }}
          className="mt-1 w-5 h-5 accent-[#867979] border-2 border-[#867979] rounded focus:ring-[#867979] bg-white cursor-pointer"
        />
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#867979] rounded-lg focus:outline-none focus:border-[#867979] text-[#171717] font-medium text-base"
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description..."
                className="w-full px-3 py-2 bg-white border-2 border-[#867979] rounded-lg focus:outline-none focus:border-[#867979] text-[#171717] text-base resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-[#867979] text-white rounded-lg hover:bg-[#756868] transition text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 border border-[#867979] text-[#171717] rounded-lg hover:bg-white/50 transition text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`font-medium ${
                  task.status === "done"
                    ? "line-through text-[#756868]"
                    : "text-[#171717]"
                }`}
              >
                {task.title}
              </div>
              {task.description && (
                <div className="text-[#171717] text-sm mt-1">
                  {task.description}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    priorityColors[task.priority]
                  }`}
                >
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-[#756868] text-xs">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {!isEditing && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => setIsEditing(true)}
              className="text-[#171717] hover:text-[#867979] px-2 py-1 rounded hover:bg-white/50 transition text-sm"
            >
              ✎
            </button>
            <button
              onClick={onDelete}
              className="text-[#171717] hover:text-[#867979] px-2 py-1 rounded hover:bg-white/50 transition"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Tracking Tab Component
function TrackingTab({
  project,
  onUpdate,
}: {
  project: Project;
  onUpdate: (project: Project) => void;
}) {
  const [activeView, setActiveView] = useState<
    "overview" | "timeline" | "kanban" | "tasks"
  >("overview");
  const [draggedItem, setDraggedItem] = useState<{
    type: "feature" | "task";
    id: string;
  } | null>(null);

  // Recalculate these values based on current project state
  const allTasks = [
    ...project.tasks,
    ...(project.impactPlan?.features?.flatMap((f) => f.tasks) || []),
  ];
  const features = project.impactPlan?.features || [];

  const completedTasks = allTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allTasks.filter(
    (t) => t.status === "in-progress"
  ).length;
  const todoTasks = allTasks.filter((t) => t.status === "todo").length;

  const completedFeatures = features.filter((f) => f.status === "completed");
  const inProgressFeatures = features.filter((f) => f.status === "in-progress");
  const futureFeatures = features.filter(
    (f) => f.status === "idea" || f.status === "planning"
  );

  // Improved progress calculation
  const progress = (() => {
    const taskProgress =
      allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : null;

    const featureProgress =
      features.length > 0
        ? (completedFeatures.length / features.length) * 100
        : null;

    if (taskProgress !== null && featureProgress !== null) {
      return Math.round(taskProgress * 0.6 + featureProgress * 0.4);
    }

    if (taskProgress !== null) {
      return Math.round(taskProgress);
    }

    if (featureProgress !== null) {
      return Math.round(featureProgress);
    }

    return 0;
  })();

  // Workflow insights helper function
  const getWorkflowInsights = (project: Project) => {
    const features = project.impactPlan?.features || [];
    const allTasks = [
      ...project.tasks,
      ...features.flatMap((f) => f.tasks || []),
    ];

    // Stuck features (no activity for 7+ days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stuckFeatures = features.filter((f) => {
      if (!f.updatedAt) return false;
      const lastUpdate = new Date(f.updatedAt);
      return lastUpdate < sevenDaysAgo && f.status !== "completed";
    });

    // Ready to start features (all dependencies done or no dependencies)
    const readyToStart = features.filter((f) => {
      if (f.status !== "idea" && f.status !== "planning") return false;
      const featureTasks = f.tasks || [];
      if (featureTasks.length === 0) return true; // No tasks = ready
      const allDone = featureTasks.every((t) => t.status === "done");
      return allDone;
    });

    // What to work on next (prioritized)
    const nextTasks = allTasks
      .filter((t) => t.status === "todo")
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);

    // This week's progress
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const tasksThisWeek = allTasks.filter(
      (t) =>
        t.status === "done" &&
        t.completedAt &&
        new Date(t.completedAt) >= oneWeekAgo
    ).length;

    // Momentum (comparing last 7 days to previous 7 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const tasksLastWeek = allTasks.filter(
      (t) =>
        t.status === "done" &&
        t.completedAt &&
        new Date(t.completedAt) >= twoWeeksAgo &&
        new Date(t.completedAt) < oneWeekAgo
    ).length;

    const momentum =
      tasksThisWeek > tasksLastWeek
        ? "accelerating"
        : tasksThisWeek < tasksLastWeek
        ? "slowing"
        : "steady";

    return {
      stuckFeatures,
      readyToStart,
      nextTasks,
      tasksThisWeek,
      momentum,
      previousWeekTasks: tasksLastWeek,
    };
  };

  const addTimelineEvent = (
    title: string,
    type: TimelineEvent["type"],
    featureId?: string
  ) => {
    const event: TimelineEvent = {
      id: Date.now().toString(),
      title,
      date: new Date().toISOString(),
      type,
      featureId,
    };
    const updated = {
      ...project,
      timeline: [...project.timeline, event],
      lastUpdated: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  const updateFeatureStatus = (
    featureId: string,
    status: Feature["status"]
  ) => {
    const updatedFeatures = features.map((f) => {
      if (f.id === featureId) {
        if (status === "completed" && f.status !== "completed") {
          addTimelineEvent(`Completed: ${f.name}`, "feature-complete", f.id);
        }
        return {
          ...f,
          status,
          updatedAt: new Date().toISOString(),
          completedAt:
            status === "completed" ? new Date().toISOString() : f.completedAt,
        };
      }
      return f;
    });
    const updated = {
      ...project,
      impactPlan: {
        ...project.impactPlan!,
        features: updatedFeatures,
      },
      lastUpdated: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  const updateTaskStatus = (
    taskId: string,
    status: Task["status"],
    isStandalone: boolean
  ) => {
    if (isStandalone) {
      const updatedTasks = project.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completedAt:
                status === "done" ? new Date().toISOString() : undefined,
            }
          : t
      );
      const updated = {
        ...project,
        tasks: updatedTasks,
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    } else {
      const updatedFeatures = features.map((f) => ({
        ...f,
        tasks: f.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status,
                completedAt:
                  status === "done" ? new Date().toISOString() : undefined,
              }
            : t
        ),
        updatedAt: new Date().toISOString(),
      }));
      const updated = {
        ...project,
        impactPlan: {
          ...project.impactPlan!,
          features: updatedFeatures,
        },
        lastUpdated: new Date().toISOString(),
      };
      onUpdate(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex gap-2 border-b border-[#867979]">
        {[
          { id: "overview", label: "Overview" },
          { id: "timeline", label: "Timeline" },
          { id: "kanban", label: "Kanban" },
          { id: "tasks", label: "Tasks" },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as any)}
            className={`px-6 py-3 font-medium transition ${
              activeView === view.id
                ? "text-[#171717] border-b-2 border-[#867979]"
                : "text-[#171717]/70 hover:text-[#171717]"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Overview View */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* Progress Stats Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
            <h2 className="text-2xl font-light text-[#171717] mb-6">
              Progress Overview
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm text-[#171717] mb-2">
                  <span>Overall Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-[#867979]/20 rounded-full h-4">
                  <div
                    className="bg-[#867979] h-4 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#867979]/20 rounded-xl p-4">
                  <div className="text-3xl font-light text-[#171717]">
                    {allTasks.length}
                  </div>
                  <div className="text-[#171717]/80 text-sm">Total Tasks</div>
                </div>
                <div className="bg-[#867979]/20 rounded-xl p-4">
                  <div className="text-3xl font-light text-[#171717]">
                    {completedTasks}
                  </div>
                  <div className="text-[#171717]/80 text-sm">Completed</div>
                </div>
                <div className="bg-[#867979]/20 rounded-xl p-4">
                  <div className="text-3xl font-light text-[#171717]">
                    {inProgressTasks}
                  </div>
                  <div className="text-[#171717]/80 text-sm">In Progress</div>
                </div>
                <div className="bg-[#867979]/20 rounded-xl p-4">
                  <div className="text-3xl font-light text-[#171717]">
                    {todoTasks}
                  </div>
                  <div className="text-[#171717]/80 text-sm">To Do</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-[#867979]/20 rounded-xl p-4">
                  <div className="text-2xl font-light text-[#171717]">
                    {features.length}
                  </div>
                  <div className="text-[#171717]/80 text-sm">
                    Total Features
                  </div>
                </div>
                <div className="bg-[#867979]/20 rounded-xl p-4">
                  <div className="text-2xl font-light text-[#171717]">
                    {completedFeatures.length}
                  </div>
                  <div className="text-[#171717]/80 text-sm">Completed</div>
                </div>
                <div className="bg-[#867979]/20 rounded-xl p-4">
                  <div className="text-2xl font-light text-[#171717]">
                    {inProgressFeatures.length}
                  </div>
                  <div className="text-[#171717]/80 text-sm">In Progress</div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Insights & Focus */}
          {(() => {
            const insights = getWorkflowInsights(project);
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* What Should I Work On Next? */}
                {insights.nextTasks.length > 0 && (
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
                    <h2 className="text-xl font-light text-[#171717] mb-4 flex items-center gap-2">
                      <span>🎯</span>
                      What Should I Work On Next?
                    </h2>
                    <div className="space-y-2">
                      {insights.nextTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-[#867979]/10 rounded-lg p-3 border border-[#867979]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#171717]">
                              {task.title}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-700"
                                  : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* This Week's Progress */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
                  <h2 className="text-xl font-light text-[#171717] mb-4">
                    This Week&apos;s Progress
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-light text-[#171717]">
                        {insights.tasksThisWeek}
                      </div>
                      <div className="text-[#171717]/80 text-sm">
                        Tasks completed
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#171717]">Momentum:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          insights.momentum === "accelerating"
                            ? "bg-green-100 text-green-700"
                            : insights.momentum === "slowing"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {insights.momentum === "accelerating" &&
                          "🚀 Accelerating"}
                        {insights.momentum === "slowing" && "⚠️ Slowing"}
                        {insights.momentum === "steady" && "➡️ Steady"}
                      </span>
                    </div>
                    {insights.previousWeekTasks > 0 && (
                      <div className="text-xs text-[#171717]/60">
                        Previous week: {insights.previousWeekTasks} tasks
                      </div>
                    )}
                  </div>
                </div>

                {/* Stuck Features */}
                {insights.stuckFeatures.length > 0 && (
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-300">
                    <h2 className="text-xl font-light text-[#171717] mb-4 flex items-center gap-2">
                      <span>⚠️</span>
                      Needs Attention ({insights.stuckFeatures.length})
                    </h2>
                    <div className="space-y-2">
                      {insights.stuckFeatures.map((feature) => (
                        <div
                          key={feature.id}
                          className="bg-yellow-50 rounded-lg p-3 border border-yellow-200"
                        >
                          <div className="text-sm font-medium text-[#171717]">
                            {feature.name}
                          </div>
                          <div className="text-xs text-[#171717]/60 mt-1">
                            No activity for 7+ days
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ready to Start */}
                {insights.readyToStart.length > 0 && (
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-green-300">
                    <h2 className="text-xl font-light text-[#171717] mb-4 flex items-center gap-2">
                      <span>✅</span>
                      Ready to Start ({insights.readyToStart.length})
                    </h2>
                    <div className="space-y-2">
                      {insights.readyToStart.map((feature) => (
                        <div
                          key={feature.id}
                          className="bg-green-50 rounded-lg p-3 border border-green-200"
                        >
                          <div className="text-sm font-medium text-[#171717]">
                            {feature.name}
                          </div>
                          <div className="text-xs text-[#171717]/60 mt-1">
                            All dependencies complete
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Recent Activity Timeline */}
          {project.timeline.length > 0 && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-light text-[#171717]">
                  Recent Activity
                </h2>
                <button
                  onClick={() => setActiveView("timeline")}
                  className="text-sm text-[#867979] hover:text-[#756868] font-medium"
                >
                  View Full Timeline →
                </button>
              </div>
              <div className="space-y-3">
                {[...project.timeline]
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 bg-[#867979]/10 rounded-lg border border-[#867979]"
                    >
                      <div className="w-2 h-2 bg-[#867979] rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#171717]">
                          {event.title}
                        </div>
                        {event.description && (
                          <div className="text-xs text-[#171717]/60 mt-1">
                            {event.description}
                          </div>
                        )}
                        <div className="text-xs text-[#171717]/50 mt-1">
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-[#867979]/20 text-[#171717] text-xs rounded">
                        {event.type}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline View */}
      {activeView === "timeline" && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-light text-[#171717]">Timeline</h2>
            <button
              onClick={() => {
                const title = prompt("Milestone title:");
                if (title) {
                  addTimelineEvent(title, "milestone");
                }
              }}
              className="px-4 py-2 bg-[#867979] text-white rounded-lg hover:bg-[#756868] transition font-medium text-sm"
            >
              + Add Milestone
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#867979]" />
            <div className="space-y-6 pl-12">
              {project.timeline.length === 0 ? (
                <div className="text-[#171717] text-center py-8">
                  No timeline events yet. Complete features or add milestones.
                </div>
              ) : (
                [...project.timeline]
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-16 top-2 w-3 h-3 bg-[#867979] rounded-full border-4 border-white" />
                      <div className="bg-[#867979]/10 rounded-lg p-4 border border-[#867979]">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-[#171717]">
                            {event.title}
                          </h3>
                          <span className="text-xs text-[#171717]/70">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-[#171717] text-sm">
                            {event.description}
                          </p>
                        )}
                        <span className="inline-block mt-2 px-2 py-1 bg-[#867979]/20 text-[#171717] text-xs rounded">
                          {event.type}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {activeView === "kanban" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Delivered Column */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#867979]">
              <h3 className="text-xl font-semibold text-[#171717] mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-[#756868] rounded-full" />
                Delivered ({completedFeatures.length + completedTasks})
              </h3>
              <div
                className="space-y-3 min-h-[400px]"
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedItem) {
                    if (draggedItem.type === "feature") {
                      updateFeatureStatus(draggedItem.id, "completed");
                    } else {
                      // Find and update task
                      const task = allTasks.find(
                        (t) => t.id === draggedItem.id
                      );
                      if (task) {
                        const isStandalone = project.tasks.some(
                          (t) => t.id === draggedItem.id
                        );
                        updateTaskStatus(draggedItem.id, "done", isStandalone);
                      }
                    }
                    setDraggedItem(null);
                  }
                }}
              >
                {completedFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    draggable
                    onDragStart={() =>
                      setDraggedItem({ type: "feature", id: feature.id })
                    }
                    className="bg-[#867979]/10 border border-[#867979] rounded-lg p-4 cursor-move hover:shadow-md transition"
                  >
                    <div className="font-semibold text-[#171717]">
                      {feature.name}
                    </div>
                    <div className="text-[#171717]/80 text-sm mt-1">
                      {feature.description}
                    </div>
                    <div className="text-[#171717]/60 text-xs mt-2">
                      {feature.tasks.length} tasks
                    </div>
                  </div>
                ))}
                {allTasks
                  .filter((t) => t.status === "done")
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() =>
                        setDraggedItem({ type: "task", id: task.id })
                      }
                      className="bg-[#867979]/10 border border-[#867979] rounded-lg p-3 cursor-move hover:shadow-md transition"
                    >
                      <div className="font-medium text-[#171717]/60 line-through">
                        {task.title}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Currently Delivering Column */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#756868]">
              <h3 className="text-xl font-semibold text-[#756868] mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-[#756868] rounded-full" />
                In Progress ({inProgressFeatures.length + inProgressTasks})
              </h3>
              <div
                className="space-y-3 min-h-[400px]"
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedItem) {
                    if (draggedItem.type === "feature") {
                      updateFeatureStatus(draggedItem.id, "in-progress");
                    } else {
                      const task = allTasks.find(
                        (t) => t.id === draggedItem.id
                      );
                      if (task) {
                        const isStandalone = project.tasks.some(
                          (t) => t.id === draggedItem.id
                        );
                        updateTaskStatus(
                          draggedItem.id,
                          "in-progress",
                          isStandalone
                        );
                      }
                    }
                    setDraggedItem(null);
                  }
                }}
              >
                {inProgressFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    draggable
                    onDragStart={() =>
                      setDraggedItem({ type: "feature", id: feature.id })
                    }
                    className="bg-[#867979]/10 border border-[#867979] rounded-lg p-4 cursor-move hover:shadow-md transition"
                  >
                    <div className="font-semibold text-[#171717]">
                      {feature.name}
                    </div>
                    <div className="text-[#171717]/80 text-sm mt-1">
                      {feature.description}
                    </div>
                    <div className="text-[#171717]/60 text-xs mt-2">
                      {feature.tasks.length} tasks
                    </div>
                  </div>
                ))}
                {allTasks
                  .filter((t) => t.status === "in-progress")
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() =>
                        setDraggedItem({ type: "task", id: task.id })
                      }
                      className="bg-[#867979]/10 border border-[#867979] rounded-lg p-3 cursor-move hover:shadow-md transition"
                    >
                      <div className="font-medium text-[#171717]">
                        {task.title}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Future Features Column */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#756868]">
              <h3 className="text-xl font-semibold text-[#756868] mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-[#756868] rounded-full" />
                Future ({futureFeatures.length + todoTasks})
              </h3>
              <div
                className="space-y-3 min-h-[400px]"
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedItem) {
                    if (draggedItem.type === "feature") {
                      updateFeatureStatus(draggedItem.id, "idea");
                    } else {
                      const task = allTasks.find(
                        (t) => t.id === draggedItem.id
                      );
                      if (task) {
                        const isStandalone = project.tasks.some(
                          (t) => t.id === draggedItem.id
                        );
                        updateTaskStatus(draggedItem.id, "todo", isStandalone);
                      }
                    }
                    setDraggedItem(null);
                  }
                }}
              >
                {futureFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    draggable
                    onDragStart={() =>
                      setDraggedItem({ type: "feature", id: feature.id })
                    }
                    className="bg-[#867979]/10 border border-[#867979] rounded-lg p-4 cursor-move hover:shadow-md transition"
                  >
                    <div className="font-semibold text-[#171717]">
                      {feature.name}
                    </div>
                    <div className="text-[#171717]/80 text-sm mt-1">
                      {feature.description}
                    </div>
                    <div className="text-[#171717]/60 text-xs mt-2">
                      {feature.tasks.length} tasks
                    </div>
                  </div>
                ))}
                {allTasks
                  .filter((t) => t.status === "todo")
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() =>
                        setDraggedItem({ type: "task", id: task.id })
                      }
                      className="bg-[#867979]/10 border border-[#867979] rounded-lg p-3 cursor-move hover:shadow-md transition"
                    >
                      <div className="font-medium text-[#171717]">
                        {task.title}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks View */}
      {activeView === "tasks" && (
        <div className="space-y-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#756868]">
            <h2 className="text-2xl font-light text-[#756868] mb-4">
              All Tasks
            </h2>
            <div className="space-y-2">
              {allTasks.length === 0 ? (
                <div className="text-[#756868] text-center py-8">
                  No tasks yet. Add tasks in the Planning tab.
                </div>
              ) : (
                allTasks.map((task) => {
                  const isStandalone = project.tasks.some(
                    (t) => t.id === task.id
                  );
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={(updates) =>
                        updateTaskStatus(
                          task.id,
                          updates.status || task.status,
                          isStandalone
                        )
                      }
                      onDelete={() => {
                        // Delete logic would go here
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Thoughts Tab Component
function ThoughtsTab({
  project,
  onUpdate,
}: {
  project: Project;
  onUpdate: (project: Project) => void;
}) {
  const [newThought, setNewThought] = useState("");
  const [expandingThoughtIndex, setExpandingThoughtIndex] = useState<
    number | null
  >(null);
  const [expandedText, setExpandedText] = useState("");

  const normalizeThoughts = (thoughts: Thought[] | string[]): Thought[] => {
    return thoughts.map((thought, index) => {
      if (typeof thought === "string") {
        return { id: `thought-${index}`, text: thought };
      }
      return thought;
    });
  };

  const thoughts = normalizeThoughts(project.thoughts);

  const addThought = () => {
    if (!newThought.trim()) return;
    const newThoughtObj: Thought = {
      id: Date.now().toString(),
      text: newThought,
    };
    const updated = {
      ...project,
      thoughts: [...thoughts, newThoughtObj],
      lastUpdated: new Date().toISOString(),
    };
    onUpdate(updated);
    setNewThought("");
  };

  const deleteThought = (index: number) => {
    const updated = {
      ...project,
      thoughts: thoughts.filter((_, i) => i !== index),
      lastUpdated: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  const startExpanding = (index: number) => {
    setExpandingThoughtIndex(index);
    setExpandedText(thoughts[index].expanded || "");
  };

  const saveExpanded = (index: number) => {
    const updatedThoughts = [...thoughts];
    updatedThoughts[index] = {
      ...updatedThoughts[index],
      expanded: expandedText.trim() || undefined,
    };
    const updated = {
      ...project,
      thoughts: updatedThoughts,
      lastUpdated: new Date().toISOString(),
    };
    onUpdate(updated);
    setExpandingThoughtIndex(null);
    setExpandedText("");
  };

  const cancelExpanding = () => {
    setExpandingThoughtIndex(null);
    setExpandedText("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#756868]">
        <h2 className="text-2xl font-light text-[#756868] mb-4">Add Thought</h2>
        <div className="flex gap-2">
          <textarea
            value={newThought}
            onChange={(e) => setNewThought(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addThought()}
            placeholder="Jot down a thought, idea, or feature..."
            className="flex-1 px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 resize-none text-base"
            rows={3}
          />
          <button
            onClick={addThought}
            className="px-6 py-3 bg-[#867979] text-white rounded-xl hover:bg-[#756868] transition font-medium self-end"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {thoughts.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-[#756868] text-center">
            <p className="text-[#756868]">
              No thoughts yet. Start adding ideas above.
            </p>
          </div>
        ) : (
          thoughts.map((thought, index) => (
            <div
              key={thought.id || index}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-[#756868] group hover:bg-white/90 transition"
            >
              <div className="flex justify-between items-start">
                <p className="text-[#171717] flex-1">{thought.text}</p>
                <div className="flex gap-2 ml-3 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => startExpanding(index)}
                    className="text-[#756868] hover:text-[#756868] px-2 py-1 rounded hover:bg-white/50 transition text-sm font-medium"
                    title="Expand on this thought"
                  >
                    ✎ Expand
                  </button>
                  <button
                    onClick={() => deleteThought(index)}
                    className="text-[#756868] hover:text-[#756868] px-2 py-1 rounded hover:bg-white/50 transition"
                    title="Delete thought"
                  >
                    ×
                  </button>
                </div>
              </div>

              {thought.expanded && (
                <div className="mt-3 pt-3 border-t border-[#756868]">
                  <p className="text-[#756868] text-sm whitespace-pre-wrap">
                    {thought.expanded}
                  </p>
                  <button
                    onClick={() => startExpanding(index)}
                    className="mt-2 text-[#756868] hover:text-[#756868] text-xs font-medium"
                  >
                    Edit expansion
                  </button>
                </div>
              )}

              {expandingThoughtIndex === index && (
                <div className="mt-4 pt-4 border-t border-[#756868]">
                  <label className="block text-[#756868] font-medium mb-2 text-sm">
                    Expand on this thought:
                  </label>
                  <textarea
                    value={expandedText}
                    onChange={(e) => setExpandedText(e.target.value)}
                    placeholder="Add more details, break it down, explore ideas..."
                    className="w-full px-4 py-3 bg-white border-2 border-[#867979] rounded-xl focus:outline-none focus:border-[#867979] transition text-[#171717] placeholder-[#867979]/50 resize-none text-base"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveExpanded(index)}
                      className="px-4 py-2 bg-[#867979] text-white rounded-lg hover:bg-[#756868] transition font-medium text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelExpanding}
                      className="px-4 py-2 border border-[#867979] text-[#171717] rounded-lg hover:bg-white/50 transition font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
