export interface SyncAction {
  id: string;
  type: 'CREATE_TICKET' | 'UPDATE_STATUS' | 'SAVE_EXECUTION' | 'UPDATE_TICKET' | 'SUBMIT_EXECUTION' | 'ADD_PHOTO' | 'ADD_TIMELINE';
  ticketId?: string;
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCING' | 'COMPLETED' | 'ERROR';
}

const STORAGE_KEY = 'mfv_offline_sync_queue';
const CACHE_KEY = 'mfv_offline_data_cache';

export function isNetworkOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function getOfflineQueue(): SyncAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getPendingSyncQueue(): SyncAction[] {
  return getOfflineQueue().filter((item) => item.status === 'PENDING' || item.status === 'ERROR');
}

export function queueOfflineAction(type: SyncAction['type'], payload: any, ticketId?: string): SyncAction {
  const queue = getOfflineQueue();
  const newAction: SyncAction = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    ticketId,
    payload,
    timestamp: new Date().toISOString(),
    status: 'PENDING',
  };
  queue.push(newAction);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('LocalStorage error storing sync action', e);
  }
  return newAction;
}

export function queueSyncAction(action: Omit<SyncAction, 'id' | 'timestamp' | 'status'>) {
  return queueOfflineAction(action.type, action.payload, action.ticketId);
}

export function removeSyncAction(id: string) {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('LocalStorage error removing sync action', e);
  }
}

export async function syncPendingQueueWithBackend(): Promise<number> {
  if (!isNetworkOnline()) return 0;
  const pending = getPendingSyncQueue();
  let processedCount = 0;

  for (const item of pending) {
    try {
      if (item.type === 'CREATE_TICKET') {
        await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
        removeSyncAction(item.id);
        processedCount++;
      } else if (item.type === 'UPDATE_STATUS' && item.payload?.ticketId) {
        await fetch(`/api/tickets/${item.payload.ticketId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: item.payload.status,
            note: item.payload.note,
          }),
        });
        removeSyncAction(item.id);
        processedCount++;
      } else if (item.type === 'SAVE_EXECUTION' && item.payload?.ticketId) {
        await fetch(`/api/tickets/${item.payload.ticketId}/execution`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload.executionData),
        });
        removeSyncAction(item.id);
        processedCount++;
      }
    } catch (err) {
      console.error('Error processing sync action', item, err);
    }
  }

  return processedCount;
}

export function cacheFullData(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage limit reached for offline cache');
  }
}

export function getCachedFullData(): any | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
