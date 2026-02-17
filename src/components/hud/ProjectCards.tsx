import { useStore } from '../../store';
import type { Project, ProjectAgent } from '../../types';

function StatusBadge({ status }: { status: string }) {
  const isOrbiting = status === 'orbiting';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
      isOrbiting ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
    }`}>
      <span className={`w-2 h-2 rounded-full ${isOrbiting ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
      {status}
    </span>
  );
}

function AgentDot({ agent }: { agent: ProjectAgent }) {
  const colors: Record<string, string> = {
    active: 'bg-green-400 shadow-green-400/50',
    idle: 'bg-gray-500',
    warning: 'bg-yellow-400 shadow-yellow-400/50',
    error: 'bg-red-400 shadow-red-400/50',
  };
  return (
    <div className="flex items-center gap-1.5" title={`${agent.name} — ${agent.state}`}>
      <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${colors[agent.state] || 'bg-gray-500'}`} />
      <span className="text-xs text-gray-400 truncate max-w-[80px]">{agent.name}</span>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const focusProject = useStore(s => s.focusProject);
  const openChat = useStore(s => s.openChat);

  const activeCount = project.agents.filter(a => a.state === 'active').length;
  const pct = Math.round(project.progress * 100);

  const handleOpenChat = () => {
    focusProject(project.id);
    openChat();
  };

  return (
    <div
      className="group rounded-xl p-5 transition-all duration-300 ease-out hover:-translate-y-1"
      style={{
        background: '#111827',
        border: `1px solid ${project.color}33`,
        boxShadow: 'none',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${project.color}22, 0 0 0 1px ${project.color}55`;
        (e.currentTarget as HTMLElement).style.borderColor = `${project.color}88`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = `${project.color}33`;
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-lg font-bold text-white truncate" style={{ color: project.color }}>
          {project.name}
        </h3>
        <StatusBadge status={project.status} />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 truncate mb-4">{project.description}</p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${project.color}88, ${project.color})`,
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span className="font-mono">{project.version}</span>
        <span className="text-gray-600">|</span>
        <span>Tasks {project.tasks.done}/{project.tasks.total}</span>
        <span className="text-gray-600">|</span>
        <span className="text-green-400">{activeCount} active</span>
      </div>

      {/* Agents */}
      {project.agents.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4">
          {project.agents.map(a => <AgentDot key={a.id} agent={a} />)}
        </div>
      )}

      {/* Footer: links + action */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="flex gap-2">
          {project.notionUrl && (
            <a href={project.notionUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
              Notion
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
              GitHub
            </a>
          )}
        </div>
        <button
          onClick={handleOpenChat}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            background: `${project.color}22`,
            color: project.color,
            border: `1px solid ${project.color}44`,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = `${project.color}44`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = `${project.color}22`;
          }}
        >
          Open Chat
        </button>
      </div>
    </div>
  );
}

export default function ProjectCards() {
  const projects = useStore(s => s.projects);

  return (
    <div className="w-full h-full overflow-auto p-6">
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {projects.map(p => <ProjectCard key={p.id} project={p} />)}
      </div>
    </div>
  );
}
