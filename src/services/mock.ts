import type { Agent, AgentState, Link, SystemEvent } from '../types';

const AGENT_TYPES = ['worker', 'orchestrator', 'gateway', 'monitor'] as const;
const CLUSTERS = ['alpha', 'beta', 'gamma', 'delta'];
const STATES: AgentState[] = ['idle', 'running', 'warning', 'error', 'recovery'];
const STATE_WEIGHTS = [0.15, 0.55, 0.15, 0.08, 0.07]; // probability distribution

function pickState(): AgentState {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < STATES.length; i++) {
    acc += STATE_WEIGHTS[i];
    if (r < acc) return STATES[i];
  }
  return 'running';
}

// Distribute agents in a spherical cluster layout
function generatePosition(index: number, total: number, cluster: string): [number, number, number] {
  const clusterIdx = CLUSTERS.indexOf(cluster);
  const clusterAngle = (clusterIdx / CLUSTERS.length) * Math.PI * 2;
  const clusterRadius = 25;
  const cx = Math.cos(clusterAngle) * clusterRadius;
  const cz = Math.sin(clusterAngle) * clusterRadius;

  // Spiral within cluster
  const phi = Math.acos(1 - 2 * ((index % 100) + 0.5) / 100);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  const r = 8 + Math.random() * 4;

  return [
    cx + r * Math.sin(phi) * Math.cos(theta),
    (r * Math.cos(phi)) * 0.5,
    cz + r * Math.sin(phi) * Math.sin(theta),
  ];
}

export function generateAgents(count: number): Agent[] {
  const agents: Agent[] = [];

  // Create some orchestrators first
  for (let c = 0; c < CLUSTERS.length; c++) {
    const cluster = CLUSTERS[c];
    const clusterAngle = (c / CLUSTERS.length) * Math.PI * 2;
    agents.push({
      id: `orch-${cluster}`,
      name: `Orchestrator-${cluster.toUpperCase()}`,
      type: 'orchestrator',
      cluster,
      state: Math.random() > 0.1 ? 'running' : 'warning',
      load: 0.3 + Math.random() * 0.5,
      latencyMs: 5 + Math.random() * 20,
      throughput: 500 + Math.random() * 2000,
      x: Math.cos(clusterAngle) * 25,
      y: 0,
      z: Math.sin(clusterAngle) * 25,
    });
  }

  // Gateway at center
  agents.push({
    id: 'gateway-main',
    name: 'Main Gateway',
    type: 'gateway',
    cluster: 'core',
    state: 'running',
    load: 0.6,
    latencyMs: 2,
    throughput: 10000,
    x: 0, y: 2, z: 0,
  });

  // Workers
  const workersToCreate = count - agents.length;
  for (let i = 0; i < workersToCreate; i++) {
    const cluster = CLUSTERS[i % CLUSTERS.length];
    const [x, y, z] = generatePosition(i, workersToCreate, cluster);
    agents.push({
      id: `agent-${i.toString().padStart(4, '0')}`,
      name: `Worker-${i.toString().padStart(4, '0')}`,
      type: i % 20 === 0 ? 'monitor' : 'worker',
      cluster,
      state: pickState(),
      load: Math.random(),
      latencyMs: 10 + Math.random() * 200,
      throughput: Math.random() * 500,
      x, y, z,
      parentId: `orch-${cluster}`,
    });
  }

  return agents;
}

export function generateLinks(agents: Agent[]): Link[] {
  const links: Link[] = [];
  const gateway = agents.find(a => a.type === 'gateway');
  const orchestrators = agents.filter(a => a.type === 'orchestrator');

  // Gateway -> Orchestrators
  if (gateway) {
    orchestrators.forEach(o => {
      links.push({
        sourceId: gateway.id,
        targetId: o.id,
        weight: 1,
        status: o.state === 'error' ? 'down' : o.state === 'warning' ? 'degraded' : 'active',
      });
    });
  }

  // Orchestrators -> some workers (sample)
  agents.filter(a => a.parentId).forEach(a => {
    if (Math.random() < 0.15) { // only show 15% of links for performance
      links.push({
        sourceId: a.parentId!,
        targetId: a.id,
        weight: a.load,
        status: a.state === 'error' ? 'down' : a.state === 'warning' ? 'degraded' : 'active',
      });
    }
  });

  return links;
}

export function generateEvent(agents: Agent[]): SystemEvent {
  const agent = agents[Math.floor(Math.random() * agents.length)];
  const severities = ['info', 'info', 'info', 'warning', 'warning', 'error', 'critical'] as const;
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const messages: Record<string, string[]> = {
    info: ['Task completed', 'Heartbeat OK', 'Scaling up', 'Cache refreshed'],
    warning: ['High latency detected', 'Memory pressure', 'Queue backing up', 'Retry threshold'],
    error: ['Connection lost', 'Timeout exceeded', 'OOM killed', 'Auth failure'],
    critical: ['Cluster unreachable', 'Data corruption', 'Cascade failure', 'Circuit breaker open'],
  };

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    severity,
    agentId: agent.id,
    message: messages[severity][Math.floor(Math.random() * messages[severity].length)],
  };
}

// Mutate agents to simulate state changes
export function tickAgents(agents: Agent[]): void {
  agents.forEach(a => {
    // Small chance of state change
    if (Math.random() < 0.02) {
      a.state = pickState();
    }
    // Fluctuate load
    a.load = Math.max(0, Math.min(1, a.load + (Math.random() - 0.5) * 0.1));
    a.latencyMs = Math.max(1, a.latencyMs + (Math.random() - 0.5) * 10);
    a.throughput = Math.max(0, a.throughput + (Math.random() - 0.5) * 50);
  });
}
