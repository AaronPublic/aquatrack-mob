import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { api } from '../config/api';

const statusLabels = {
  PENDING: "Pending Review",
  EVALUATING: "Evaluating",
  DISPATCHED: "Crew Dispatched",
  ONGOING: "Ongoing Repair",
  RESOLVED: "Resolved",
};

export const useNotificationStore = create((set, get) => ({
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
      const userId = session.user.id;

      // 1. Fetch advisories
      let advisories = [];
      try {
        const advisoriesData = await api.get('/api/advisories');
        if (advisoriesData?.success && advisoriesData.advisories) {
          advisories = advisoriesData.advisories.filter(
            (ad) => ad.targetRole === 'broadcast' || ad.targetRole === 'consumers' || !ad.targetRole
          );
        }
      } catch (err) {
        console.warn("Failed to fetch advisories via API, falling back to Supabase directly:", err);
        const { data } = await supabase
          .from('Advisory')
          .select('*')
          .order('createdAt', { ascending: false });
        if (data) {
          advisories = data.filter(
            (ad) => ad.targetRole === 'broadcast' || ad.targetRole === 'consumers' || !ad.targetRole
          );
        }
      }

      // 2. Fetch complaints
      let userComplaints = [];
      const { data: complaintsData } = await supabase
        .from('Complaint')
        .select('id, status, createdAt, updatedAt, summary, category, rawText')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      if (complaintsData) {
        userComplaints = complaintsData;
      }

      // 3. Compile list
      const list = [];

      // Add advisories
      advisories.forEach(ad => {
        list.push({
          id: `ad-${ad.id}`,
          type: 'advisory',
          title: ad.title || 'Community Advisory',
          message: ad.content || '',
          date: new Date(ad.createdAt || ad.date || Date.now()),
          category: ad.type || 'info',
        });
      });

      // Add complaint status updates
      userComplaints.forEach(comp => {
        if (comp.status && comp.status !== 'PENDING') {
          list.push({
            id: `comp-${comp.id}-${comp.status}`,
            type: 'complaint_status',
            title: 'Ticket Status Update',
            message: `Your report regarding "${comp.summary || comp.rawText || 'Water Anomaly'}" is now: ${statusLabels[comp.status] || comp.status}.`,
            date: new Date(comp.updatedAt || comp.createdAt || Date.now()),
            status: comp.status,
          });
        }
      });

      // Sort by date descending
      list.sort((a, b) => b.date - a.date);

      // Load read and dismissed IDs from AsyncStorage
      const [readIdsStr, dismissedIdsStr] = await Promise.all([
        AsyncStorage.getItem('read_notifications'),
        AsyncStorage.getItem('dismissed_notifications')
      ]);

      const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
      const dismissedIds = dismissedIdsStr ? JSON.parse(dismissedIdsStr) : [];

      // Filter out dismissed notifications
      const activeList = list.filter(item => !dismissedIds.includes(item.id));
      
      let unread = 0;
      const processed = activeList.map(item => {
        const isRead = readIds.includes(item.id);
        if (!isRead) unread++;
        return { ...item, read: isRead };
      });

      set({ notifications: processed, unreadCount: unread, loading: false });
    } catch (error) {
      console.error("fetchNotifications store error:", error);
      set({ loading: false });
    }
  },

  dismissNotification: async (id) => {
    const { notifications, unreadCount } = get();
    try {
      const dismissedIdsStr = await AsyncStorage.getItem('dismissed_notifications');
      const dismissedIds = dismissedIdsStr ? JSON.parse(dismissedIdsStr) : [];
      
      if (!dismissedIds.includes(id)) {
        dismissedIds.push(id);
        await AsyncStorage.setItem('dismissed_notifications', JSON.stringify(dismissedIds));
      }

      const target = notifications.find(n => n.id === id);
      const wasUnread = target && !target.read;

      set({
        notifications: notifications.filter(n => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount
      });
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    try {
      const readIds = notifications.map(n => n.id);
      await AsyncStorage.setItem('read_notifications', JSON.stringify(readIds));
      set({
        unreadCount: 0,
        notifications: notifications.map(n => ({ ...n, read: true }))
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }
}));
