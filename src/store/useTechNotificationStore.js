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

      // ─── 1. Fetch Advisories targeted at technicians or broadcast ───────────
      try {
        const advisoriesData = await api.get('/api/advisories');
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
      } catch (err) {
        // Fallback: query Supabase directly
        console.warn('Falling back to Supabase for tech advisories:', err);
        const { data } = await supabase
          .from('Advisory')
          .select('*')
          .order('createdAt', { ascending: false });
        if (data) {
          data
            .filter(
              (ad) =>
                ad.targetRole === 'broadcast' ||
                ad.targetRole === 'technicians' ||
                !ad.targetRole
            )
            .forEach((ad) => {
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
      }

      // ─── 2. Fetch Newly Posted / Unassigned Complaints ────────────────────
      const { data: newComplaints } = await supabase
        .from('Complaint')
        .select('id, status, createdAt, summary, category, rawText, barangay, urgency')
        .is('assignedToId', null)
        .order('createdAt', { ascending: false })
        .limit(20);

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

      // ─── 3. Sort & Apply Dismiss / Read Persistence ───────────────────────
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
}));
