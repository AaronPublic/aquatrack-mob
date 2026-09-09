import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { api } from '../config/api';

export const useTechNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ notifications: [], unreadCount: 0, loading: false });
        return;
      }

      const list = [];

      // ─── 1, 2 & 3. Fetch Advisories, Assigned Tasks, and Unassigned Complaints concurrently ───
      const [advisoriesData, { data: assignedComplaints }, { data: newComplaints }] = await Promise.all([
        api.get('/api/advisories').catch(async (err) => {
          console.warn('Falling back to Supabase for tech advisories:', err);
          const { data } = await supabase
            .from('Advisory')
            .select('*')
            .order('createdAt', { ascending: false });
          return { success: true, advisories: data || [] };
        }),
        supabase
          .from('Complaint')
          .select('id, status, createdAt, summary, category, rawText, barangay, urgency')
          .eq('assignedToId', session.user.id)
          .neq('status', 'RESOLVED')
          .order('createdAt', { ascending: false })
          .limit(20),
        supabase
          .from('Complaint')
          .select('id, status, createdAt, summary, category, rawText, barangay, urgency')
          .is('assignedToId', null)
          .neq('status', 'RESOLVED')
          .order('createdAt', { ascending: false })
          .limit(20)
      ]);

      if (advisoriesData?.success && advisoriesData.advisories) {
        const techAdvisories = advisoriesData.advisories.filter(
          (ad) =>
            ad.targetRole === 'broadcast' ||
            ad.targetRole === 'technicians' ||
            !ad.targetRole
        );
        techAdvisories.forEach((ad) => {
          list.push({
            id: `tech-ad-${ad.id}`,
            type: 'advisory',
            title: ad.title || 'Staff Advisory',
            message: ad.content || ad.text || '',
            date: new Date(ad.createdAt || ad.date || Date.now()),
            category: ad.type || 'info',
          });
        });
      }

      if (assignedComplaints) {
        assignedComplaints.forEach((comp) => {
          const shortId = `AQ-${comp.id.slice(0, 8).toUpperCase()}`;
          const urgencyLabel =
            comp.urgency === 'CRITICAL'
              ? '🔴 Critical'
              : comp.urgency === 'HIGH'
              ? '🟠 High Priority'
              : comp.urgency === 'MEDIUM'
              ? '🔵 Medium Priority'
              : '🟢 Standard';

          list.push({
            id: `tech-assigned-${comp.id}`,
            type: 'assigned_task',
            title: `📋 Task Assigned (${shortId})`,
            message: `${urgencyLabel} · ${comp.summary || comp.rawText || 'Water Utility Issue'} ${comp.barangay ? `— Brgy. ${comp.barangay}` : ''}`,
            date: new Date(comp.createdAt || Date.now()),
            urgency: comp.urgency,
            complaintId: comp.id,
          });
        });
      }

      if (newComplaints) {
        newComplaints.forEach((comp) => {
          const urgencyLabel =
            comp.urgency === 'CRITICAL'
              ? '🔴 Critical'
              : comp.urgency === 'HIGH'
              ? '🟠 High Priority'
              : comp.urgency === 'MEDIUM'
              ? '🔵 Medium Priority'
              : '🟢 Standard';

          list.push({
            id: `tech-comp-${comp.id}`,
            type: 'new_complaint',
            title: `New Unassigned Complaint`,
            message: `${urgencyLabel} · ${comp.summary || comp.rawText || 'Water Utility Issue'} ${comp.barangay ? `— Brgy. ${comp.barangay}` : ''}`,
            date: new Date(comp.createdAt || Date.now()),
            urgency: comp.urgency,
            complaintId: comp.id,
          });
        });
      }

      // ─── 4. Sort & Apply Dismiss / Read Persistence ───────────────────────
      list.sort((a, b) => b.date - a.date);

      const [readIdsStr, dismissedIdsStr] = await Promise.all([
        AsyncStorage.getItem('tech_read_notifications'),
        AsyncStorage.getItem('tech_dismissed_notifications'),
      ]);

      const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
      const dismissedIds = dismissedIdsStr ? JSON.parse(dismissedIdsStr) : [];

      const activeList = list.filter((item) => !dismissedIds.includes(item.id));

      let unread = 0;
      const processed = activeList.map((item) => {
        const isRead = readIds.includes(item.id);
        if (!isRead) unread++;
        return { ...item, read: isRead };
      });

      set({ notifications: processed, unreadCount: unread, loading: false });
    } catch (error) {
      console.error('useTechNotificationStore fetchNotifications error:', error);
      set({ loading: false });
    }
  },

  dismissNotification: async (id) => {
    const { notifications, unreadCount } = get();
    try {
      const dismissedIdsStr = await AsyncStorage.getItem('tech_dismissed_notifications');
      const dismissedIds = dismissedIdsStr ? JSON.parse(dismissedIdsStr) : [];

      if (!dismissedIds.includes(id)) {
        dismissedIds.push(id);
        await AsyncStorage.setItem(
          'tech_dismissed_notifications',
          JSON.stringify(dismissedIds)
        );
      }

      const target = notifications.find((n) => n.id === id);
      const wasUnread = target && !target.read;

      set({
        notifications: notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount,
      });
    } catch (err) {
      console.error('Failed to dismiss tech notification:', err);
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    try {
      const readIds = notifications.map((n) => n.id);
      await AsyncStorage.setItem('tech_read_notifications', JSON.stringify(readIds));
      set({
        unreadCount: 0,
        notifications: notifications.map((n) => ({ ...n, read: true })),
      });
    } catch (err) {
      console.error('Failed to mark tech notifications as read:', err);
    }
  },

  subscribeRealtime: () => {
    if (get()._realtimeChannel) return;
    try {
      const channel = supabase
        .channel(`tech-global-notifications-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Complaint' }, () => {
          get().fetchNotifications();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Advisory' }, () => {
          get().fetchNotifications();
        })
        .subscribe();
      set({ _realtimeChannel: channel });
    } catch (err) {
      console.warn("Failed to subscribe realtime in useTechNotificationStore:", err);
    }
  },

  unsubscribeRealtime: () => {
    const channel = get()._realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ _realtimeChannel: null });
    }
  },
}));
