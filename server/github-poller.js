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

// Track repos that don't have Actions enabled to avoid repeated 404s
const disabledRepos = new Set();
const RETRY_DISABLED_INTERVAL = 24 * 60 * 60 * 1000; // Retry disabled repos once per day
let lastRetryTime = 0;

async function pollRuns() {
  const now = Date.now();
  const shouldRetryDisabled = now - lastRetryTime > RETRY_DISABLED_INTERVAL;
  
  for (const [slug, repo] of Object.entries(REPOS)) {
    // Skip repos that we know don't have Actions (unless it's retry time)
    if (disabledRepos.has(repo) && !shouldRetryDisabled) {
      continue;
    }

    try {
      const raw = execSync(
        `gh run list --repo ${repo} --json databaseId,conclusion,name,headBranch,createdAt --limit 5`,
        { encoding: 'utf8', timeout: 15000 }
      );
      const runs = JSON.parse(raw);
      
      // If we successfully got runs, remove from disabled list (repo might have enabled Actions)
      if (disabledRepos.has(repo)) {
        disabledRepos.delete(repo);
        console.log(`[gh-poller] ${slug}: GitHub Actions now available`);
      }
      
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
      // Check if this is a 404 (no workflows) or permission error
      if (err.message?.includes('HTTP 404') || err.message?.includes('Not Found')) {
        if (!disabledRepos.has(repo)) {
          disabledRepos.add(repo);
          console.log(`[gh-poller] ${slug}: No GitHub Actions workflows found, will retry in 24h`);
        }
      } else if (!err.message?.includes('TIMEOUT')) {
        // Log other errors (auth, network, etc.)
        console.log(`[gh-poller] ${slug}: ${err.message?.slice(0, 80)}`);
      }
    }
  }
  
  if (shouldRetryDisabled) {
    lastRetryTime = now;
  }
}

export function startGitHubPoller() {
  console.log('🔄 GitHub Actions poller started (every 5m)');
  pollRuns(); // initial poll
  setInterval(pollRuns, POLL_INTERVAL_MS);
}
