import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image } from 'react-native';
import { api } from '../../src/config/api';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './Announcements.styles';
import homeStyles from './ConsumerHome.styles';

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
      <LinearGradient 
        colors={['#02205eff', '#325497ff']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={homeStyles.headerCard}
      >
        {/* Brand Row */}
        <View style={homeStyles.brandRow}>
          {/* Left: Brand Logo */}
          <View style={homeStyles.logoContainer}>
            <Image 
              source={require('../../assets/LOGO3.png')}
              style={homeStyles.logoImage}
            />
          </View>

          {/* Middle: Brand Text */}
          <View style={homeStyles.brandTextContainer}>
            <View style={homeStyles.brandTitleRow}>
              <Text style={homeStyles.brandAqua}>AQ</Text>
              <Text style={[homeStyles.brandAqua, { color: '#ffd800' }]}>U</Text>
              <Text style={[homeStyles.brandAqua, { color: '#970006' }]}>A</Text>
              <Text style={homeStyles.brandRack}>T</Text>
              <Text style={homeStyles.brandRack}>RACK</Text>
            </View>
            <Text style={homeStyles.brandSubtitle}>CONSUMER PORTAL</Text>
          </View>

          {/* Right: User Profile Pill */}
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

        {/* Metrics Counter Banner */}
        <View style={homeStyles.metricsBanner}>
          <View style={homeStyles.metricColumn}>
            <Text style={homeStyles.metricLabel}>TOTAL LOGS</Text>
            <Text style={homeStyles.metricNumber}>{metrics.total}</Text>
          </View>
          <View style={homeStyles.divider} />
          
          <View style={homeStyles.metricColumn}>
            <Text style={[homeStyles.metricLabel, { color: '#FFCC00' }]}>PENDING</Text>
            <Text style={[homeStyles.metricNumber, { color: '#FFCC00' }]}>{metrics.pending}</Text>
          </View>
          <View style={homeStyles.divider} />

          <View style={homeStyles.metricColumn}>
            <Text style={[homeStyles.metricLabel, { color: '#00D1FF' }]}>ACTIVE</Text>
            <Text style={[homeStyles.metricNumber, { color: '#00D1FF' }]}>{metrics.active}</Text>
          </View>
          <View style={homeStyles.divider} />

          <View style={homeStyles.metricColumn}>
            <Text style={[homeStyles.metricLabel, { color: '#4CD964' }]}>RESOLVED</Text>
            <Text style={[homeStyles.metricNumber, { color: '#4CD964' }]}>{metrics.resolved}</Text>
          </View>
        </View>
      </LinearGradient>

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
    </View>
  );
}

