import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image, Modal, ScrollView } from 'react-native';
import { api } from '../../src/config/api';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './Announcements.styles';
import homeStyles from './ConsumerHome.styles';
import { useNotificationStore } from '../../src/store/useNotificationStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Announcements({ route, navigation }) {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, WARNINGS, UPDATES
  const [expandedId, setExpandedId] = useState(null);
  const [userName, setUserName] = useState('Pedro');
  const [metrics, setMetrics] = useState({ total: 25, pending: 9, active: 8, resolved: 8 });
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, dismissNotification } = useNotificationStore();

  const handleOpenNotifications = () => {
    setNotificationsModalVisible(true);
    markAllAsRead();
  };

  const handleNotificationPress = (item) => {
    setNotificationsModalVisible(false);
    dismissNotification(item.id);
    if (item.type === 'advisory') {
      navigation.navigate('Announcements');
    } else if (item.type === 'complaint_status') {
      navigation.navigate('TrackComplaints');
    }
  };

  const fetchAdvisories = async () => {
    try {
      const data = await api.get('/api/advisories');
      if (data?.success) {
        // Filter broadcast/consumer alerts
        const publicAdvisories = data.advisories.filter(
          (ad) => ad.targetRole === 'broadcast' || ad.targetRole === 'consumers' || !ad.targetRole
        );
        setAdvisories(publicAdvisories);
      }
    } catch (err) {
      console.error("Failed to fetch advisories:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProfileAndMetrics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch profile
        const profile = await api.post('/api/auth/profile', { userId: session.user.id });
        if (profile?.name) {
          setUserName(profile.name);
        }

        // Fetch complaint counts
        const { data: userComplaints, error: compError } = await supabase
          .from('Complaint')
          .select('id, status')
          .eq('userId', session.user.id);

        if (!compError && userComplaints) {
          const total = userComplaints.length;
          const pending = userComplaints.filter(c => c.status === 'PENDING').length;
          const active = userComplaints.filter(c => c.status === 'EVALUATING' || c.status === 'DISPATCHED' || c.status === 'ONGOING').length;
          const resolved = userComplaints.filter(c => c.status === 'RESOLVED').length;

          setMetrics({ total, pending, active, resolved });
        }
      }
      // Load notifications update
      fetchNotifications();
    } catch (err) {
      console.warn("Failed to load header profile/metrics:", err);
    }
  };

  useEffect(() => {
    fetchAdvisories();
    fetchProfileAndMetrics();

    // Refresh when focused
    const unsubscribeFocus = navigation?.addListener('focus', () => {
      fetchAdvisories();
      fetchProfileAndMetrics();
    });

    return () => {
      unsubscribeFocus?.();
    };
  }, [navigation]);

  useEffect(() => {
    if (route?.params?.highlightAdvisoryId) {
      // Set the expanded card ID to the warning
      setExpandedId(route.params.highlightAdvisoryId);
      // Automatically switch to ALL tab to make sure it is shown
      setActiveTab('ALL');
    }
  }, [route?.params?.highlightAdvisoryId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdvisories();
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }) => {
    const isWarning = item.type === 'warning';
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity 
        style={[styles.card, isExpanded && styles.cardExpanded]}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{item.date}</Text>
          <View style={[
            styles.badge,
            isWarning
              ? { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }
              : { backgroundColor: '#eff6ff', borderColor: '#93c5fd' }
          ]}>
            <View style={[
              styles.badgeDot,
              { backgroundColor: isWarning ? '#dc2626' : '#2563eb' }
            ]} />
            <Text style={[
              styles.badgeText,
              isWarning ? { color: '#dc2626' } : { color: '#2563eb' }
            ]}>{item.type || 'info'}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        
        <Text 
          style={styles.cardText}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {item.text}
        </Text>

        {isExpanded ? (
          <View style={styles.expandToggle}>
            <Text style={styles.expandToggleText}>Tap to collapse</Text>
            <Ionicons name="chevron-up" size={14} color="#8E8E93" />
          </View>
        ) : (
          <View style={styles.expandToggleRow}>
            <View style={styles.expandToggle}>
              <Text style={styles.expandToggleText}>Read More</Text>
              <Ionicons name="chevron-down" size={14} color="#8E8E93" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredAdvisories = advisories.filter(item => {
    if (activeTab === 'WARNINGS') {
      return item.type === 'warning';
    }
    if (activeTab === 'UPDATES') {
      return item.type !== 'warning';
    }
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
      {/* Shared Header (Static at top for layout uniformity and flicker prevention) */}
      <View style={[homeStyles.headerCard, { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }]}>
        {/* Background Water Ripple Decorations */}
        <View style={homeStyles.decorCircle1} />
        <View style={homeStyles.decorCircle2} />

        {/* Brand Row */}
        <View style={homeStyles.brandRow}>
          {/* Left: Brand Logo */}
          <View style={homeStyles.logoContainer}>
            <Image 
              source={require('../../assets/Logo.png')}
              style={homeStyles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Middle: Subtitle Badge */}
          <View style={homeStyles.brandTextContainer}>
            <Text style={homeStyles.brandSubtitle}>PUBLIC ADVISORIES</Text>
          </View>

          {/* Right: Notification & Profile Section */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Notification Bell */}
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleOpenNotifications}
              style={homeStyles.notificationBell}
            >
              <Ionicons name="notifications-outline" size={18} color="#ffffff" />
              {unreadCount > 0 && <View style={homeStyles.notificationBadge} />}
            </TouchableOpacity>

            {/* User Profile Pill */}
            <TouchableOpacity 
              style={homeStyles.profilePill}
              activeOpacity={0.8}
            >
              <Text style={homeStyles.profileName} numberOfLines={1}>{userName}</Text>
              <View style={homeStyles.avatarContainer}>
                <Ionicons name="person" size={14} color="#ffffff" />
                <View style={homeStyles.activeDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Greeting & Subtitle */}
        <View style={homeStyles.greetingContainer}>
          <Text style={homeStyles.greetingText}>Public Advisories 📢</Text>
          <View style={homeStyles.locationPill}>
            <Ionicons name="megaphone-outline" size={13} color="#E0F2FE" />
            <Text style={homeStyles.locationText}>Water maintenance & municipal notices</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#0B2240" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredAdvisories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View>
              {/* Title & Info */}
              <View className="mb-4">
                <Text className="text-[#0B2240] font-black text-2xl tracking-tight">Water District Bulletins</Text>
                <Text className="text-[#627D98] font-medium text-xs mt-1.5 leading-relaxed">
                  Latest official advisories and service interruption schedules
                </Text>
              </View>

              {/* Segment Tabs */}
              <View style={[styles.tabBar, { marginHorizontal: 0, marginBottom: 16 }]}>
                {['ALL', 'WARNINGS', 'UPDATES'].map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.tabButton, isActive && styles.tabButtonActive]}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setActiveTab(tab);
                        setExpandedId(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0B2240" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Bulletins Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'ALL'
                  ? "There are no bulletins broadcasted at this time."
                  : activeTab === 'WARNINGS'
                    ? "There are no critical warning alarms currently active."
                    : "There are no general service updates posted right now."}
              </Text>
            </View>
          }
        />
      )}

      {/* Notifications Drawer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <TouchableOpacity 
          style={homeStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotificationsModalVisible(false)}
        >
          <TouchableOpacity 
            style={homeStyles.notificationsModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={homeStyles.modalHeader}>
              <Text style={homeStyles.modalTitle}>Notifications & Updates</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <Ionicons name="close" size={20} color="#0B1C3F" />
              </TouchableOpacity>
            </View>

            {/* Notifications Scrollable List */}
            {notifications.length === 0 ? (
              <View style={homeStyles.emptyNotifications}>
                <Ionicons name="notifications-off-outline" size={48} color="#94a3b8" />
                <Text style={homeStyles.emptyNotificationsText}>No updates or notifications yet.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.map((item) => {
                  let iconName = 'notifications-outline';
                  let iconColor = '#009FDE';
                  let iconBg = 'rgba(0, 159, 222, 0.08)';

                  if (item.type === 'advisory') {
                    if (item.category === 'warning') {
                      iconName = 'alert-circle-outline';
                      iconColor = '#EF4444';
                      iconBg = '#FEF2F2';
                    } else {
                      iconName = 'megaphone-outline';
                      iconColor = '#F59E0B';
                      iconBg = '#FEF3C7';
                    }
                  } else if (item.type === 'complaint_status') {
                    if (item.status === 'RESOLVED') {
                      iconName = 'checkmark-circle-outline';
                      iconColor = '#10B981';
                      iconBg = '#ECFDF5';
                    } else if (item.status === 'ONGOING') {
                      iconName = 'build-outline';
                      iconColor = '#6366F1';
                      iconBg = '#EEF2FF';
                    } else {
                      iconName = 'document-text-outline';
                      iconColor = '#3B82F6';
                      iconBg = '#EFF6FF';
                    }
                  }

                  const timeString = item.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      activeOpacity={0.7}
                      onPress={() => handleNotificationPress(item)}
                      style={[
                        homeStyles.notificationItem, 
                        !item.read && homeStyles.notificationItemUnread
                      ]}
                    >
                      <View style={[homeStyles.notificationIconContainer, { backgroundColor: iconBg }]}>
                        <Ionicons name={iconName} size={18} color={iconColor} />
                      </View>
                      <View style={homeStyles.notificationContent}>
                        <Text style={homeStyles.notificationTitle}>{item.title}</Text>
                        <Text style={homeStyles.notificationMessage}>{item.message}</Text>
                        <Text style={homeStyles.notificationTime}>{timeString}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

