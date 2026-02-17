import { useStore } from '../../store';

export function TopBar() {
  const projects = useStore(s => s.projects);
  const isChatOpen = useStore(s => s.isChatOpen);
  const building = projects.filter(p => p.status === 'building').length;
  const totalAgents = projects.reduce((s, p) => s + p.agents.length, 0);
  const totalTasks = projects.reduce((s, p) => s + p.tasks.total, 0);

  if (isChatOpen) return null;

  return (
    <div className="hud-top">
      <div className="hud-stats">
        <div className="hud-stat">
          <div className="value">{projects.length}</div>
          <div className="label">Projects</div>
        </div>
        <div className="hud-stat">
          <div className="value">{building}</div>
          <div className="label">Building</div>
        </div>
        <div className="hud-stat">
          <div className="value">{totalAgents}</div>
          <div className="label">Agents</div>
        </div>
        <div className="hud-stat">
          <div className="value">{totalTasks}</div>
          <div className="label">Tasks</div>
        </div>
      </div>
      <div className="hud-connection connected">● LIVE</div>
    </div>
  );
}
