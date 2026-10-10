import { AppState } from 'react-native';
import { api } from '../config/api';
import { supabase } from '../config/supabase';

let activeUserId = null;
let heartbeatInterval = null;
let appStateSubscription = null;
let cachedCoords = null;

/**
 * Sends a presence ping for the technician.
 * Uses the Next.js /api/auth/location route with automatic fallback to direct Supabase update.
 */
export async function pingTechnicianPresence(userId, coords = null) {
  const targetId = userId || activeUserId;
  if (!targetId) return;

  if (coords && coords.latitude && coords.longitude) {
    cachedCoords = coords;
  }
  const currentCoords = coords || cachedCoords;

  const payload = {
    userId: targetId,
    isOnline: true,
    ...(currentCoords?.latitude !== undefined && currentCoords?.latitude !== null
      ? { latitude: Number(currentCoords.latitude), longitude: Number(currentCoords.longitude) }
      : {}),
  };

  try {
    await api.post('/api/auth/location', payload);
  } catch (apiErr) {
    console.warn('API /api/auth/location presence ping failed, falling back to direct Supabase:', apiErr.message || apiErr);
    try {
      await supabase
        .from('User')
        .update({
          isOnline: true,
          lastActiveAt: new Date().toISOString(),
          ...(currentCoords?.latitude !== undefined && currentCoords?.latitude !== null
            ? { latitude: Number(currentCoords.latitude), longitude: Number(currentCoords.longitude) }
            : {}),
        })
        .eq('id', targetId);
    } catch (dbErr) {
      console.error('Direct Supabase presence fallback error:', dbErr.message || dbErr);
    }
  }
}

/**
 * Starts presence tracking for the authenticated field technician:
 * 1. Pings presence immediately
 * 2. Runs a 60-second periodic heartbeat while in foreground
 * 3. Resumes/pings immediately whenever AppState becomes 'active'
 */
export async function startTechnicianPresence(userId) {
  if (!userId) return;

  // If already tracking this exact user, send a fresh ping and continue
  if (activeUserId === userId && heartbeatInterval) {
    pingTechnicianPresence(userId);
    return;
  }

  // Teardown previous if user changed
  if (activeUserId && activeUserId !== userId) {
    await stopTechnicianPresence(activeUserId);
  }

  activeUserId = userId;

  // 1. Immediate presence ping upon login / session restore
  await pingTechnicianPresence(userId);

  // 2. Clear any lingering interval/listener
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  // 3. Periodic 60-second heartbeat while active
  heartbeatInterval = setInterval(() => {
    if (AppState.currentState === 'active' && activeUserId) {
      pingTechnicianPresence(activeUserId);
    }
  }, 60000);

  // 4. AppState listener: Ping immediately upon returning to foreground
  appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active' && activeUserId) {
      pingTechnicianPresence(activeUserId);
    }
  });
}

/**
 * Tears down presence tracking on technician sign out:
 * Sets isOnline to false and clears timers/listeners.
 */
export async function stopTechnicianPresence(userId) {
  const targetId = userId || activeUserId;

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  activeUserId = null;
  cachedCoords = null;

  if (targetId) {
    try {
      await api.post('/api/auth/location', { userId: targetId, isOnline: false });
    } catch (err) {
      console.warn('API teardown failed, falling back to direct Supabase:', err.message || err);
      try {
        await supabase
          .from('User')
          .update({ isOnline: false })
          .eq('id', targetId);
      } catch (dbErr) {
        console.error('Direct Supabase teardown fallback error:', dbErr.message || dbErr);
      }
    }
  }
}
