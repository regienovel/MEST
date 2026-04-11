import { storage } from './storage';

export interface Version {
  versionNumber: number;
  timestamp: string;
  savedBy: string;
  state: unknown;
  diffSummary: string;
}

export async function createSnapshot(
  teamId: string,
  resourceType: 'chain' | 'rag' | 'prompt',
  resourceId: string,
  state: unknown,
  diffSummary?: string
): Promise<Version> {
  const key = `versions:${teamId}:${resourceType}:${resourceId}`;
  const versions = (await storage.get<Version[]>(key)) || [];

  const version: Version = {
    versionNumber: versions.length + 1,
    timestamp: new Date().toISOString(),
    savedBy: teamId,
    state,
    diffSummary: diffSummary || 'Saved',
  };

  versions.push(version);
  await storage.set(key, versions);

  return version;
}

export async function getVersions(
  teamId: string,
  resourceType: string,
  resourceId: string
): Promise<Version[]> {
  const key = `versions:${teamId}:${resourceType}:${resourceId}`;
  const versions = (await storage.get<Version[]>(key)) || [];
  return versions.sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function restoreVersion(
  teamId: string,
  resourceType: string,
  resourceId: string,
  versionNumber: number,
  currentState: unknown
): Promise<{ restored: unknown; newVersionFromCurrent: Version }> {
  const key = `versions:${teamId}:${resourceType}:${resourceId}`;
  const versions = (await storage.get<Version[]>(key)) || [];

  const targetVersion = versions.find(v => v.versionNumber === versionNumber);
  if (!targetVersion) throw new Error('Version not found');

  // Save current state as a new version first (never lose data)
  const newVersion: Version = {
    versionNumber: versions.length + 1,
    timestamp: new Date().toISOString(),
    savedBy: teamId,
    state: currentState,
    diffSummary: `Auto-saved before restoring version ${versionNumber}`,
  };
  versions.push(newVersion);
  await storage.set(key, versions);

  return {
    restored: targetVersion.state,
    newVersionFromCurrent: newVersion,
  };
}

export function computeDiff(oldState: unknown, newState: unknown): string {
  if (!oldState) return 'Initial version';

  const oldStr = JSON.stringify(oldState);
  const newStr = JSON.stringify(newState);

  if (oldStr === newStr) return 'No changes';

  // Simple diff: count differences
  const oldObj = oldState as Record<string, unknown>;
  const newObj = newState as Record<string, unknown>;

  const changes: string[] = [];

  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    const diff = newObj.length - oldObj.length;
    if (diff > 0) changes.push(`Added ${diff} item${diff > 1 ? 's' : ''}`);
    if (diff < 0) changes.push(`Removed ${Math.abs(diff)} item${Math.abs(diff) > 1 ? 's' : ''}`);
    if (diff === 0) changes.push('Modified items');
  } else {
    const oldKeys = Object.keys(oldObj || {});
    const newKeys = Object.keys(newObj || {});
    const added = newKeys.filter(k => !oldKeys.includes(k));
    const removed = oldKeys.filter(k => !newKeys.includes(k));
    if (added.length > 0) changes.push(`Added: ${added.join(', ')}`);
    if (removed.length > 0) changes.push(`Removed: ${removed.join(', ')}`);
    if (changes.length === 0) changes.push('Configuration updated');
  }

  return changes.join('. ') || 'Modified';
}
