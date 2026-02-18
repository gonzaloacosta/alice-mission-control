/**
 * GitHub Actions Poller
 * Polls gh run list for configured projects and inserts new build events.
 */
import { createEvent } from './db.js';
import { execSync } from 'child_process';

// Map project slugs to GitHub repos
const REPOS = {
  cid: 'gonzaloacosta/cid',
  vpn: 'gonzaloacosta/vpn-project',
  mctl: 'gonzaloacosta/alice-mission-control',
};

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const seenRunIds = new Set();

async function pollRuns() {
  for (const [slug, repo] of Object.entries(REPOS)) {
    try {
      const raw = execSync(
        `gh run list --repo ${repo} --json databaseId,conclusion,name,headBranch,createdAt --limit 5`,
        { encoding: 'utf8', timeout: 15000 }
      );
      const runs = JSON.parse(raw);
      for (const run of runs) {
        const runId = String(run.databaseId);
        if (seenRunIds.has(runId) || !run.conclusion) continue;
        seenRunIds.add(runId);

        const eventType = run.conclusion === 'success' ? 'build_pass' : 'build_fail';
        const summary = `${run.name} on ${run.headBranch}: ${run.conclusion}`;
        await createEvent(slug, 'github-actions', null, eventType, summary, {
          run_id: runId, conclusion: run.conclusion, branch: run.headBranch,
        });
        console.log(`[gh-poller] ${slug}: ${summary}`);
      }
    } catch (err) {
      // gh CLI not available or repo not accessible — skip silently
      if (!err.message?.includes('TIMEOUT')) {
        console.log(`[gh-poller] Skip ${slug}: ${err.message?.slice(0, 80)}`);
      }
    }
  }
}

export function startGitHubPoller() {
  console.log('🔄 GitHub Actions poller started (every 5m)');
  pollRuns(); // initial poll
  setInterval(pollRuns, POLL_INTERVAL_MS);
}
