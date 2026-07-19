import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './ConsumerHome.styles';

const statusConfigs = {
  PENDING: { label: "Pending Review", text: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  EVALUATING: { label: "Evaluating", text: "#1d4ed8", bg: "#eff6ff", dot: "#3b82f6" },
  DISPATCHED: { label: "Crew Dispatched", text: "#c2410c", bg: "#fff7ed", dot: "#f97316" },
  ONGOING: { label: "Ongoing Repair", text: "#4338ca", bg: "#eef2ff", dot: "#6366f1" },
  RESOLVED: { label: "Resolved", text: "#047857", bg: "#ecfdf5", dot: "#10b981" },
};

export default function ConsumerHome({ navigation }) {
  const [userName, setUserName] = useState('Pedro'); // Default fallback to "Pedro" per spec
  const [advisories, setAdvisories] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  
  // Metrics banner state (defaults to spec layout metrics, synced dynamically on mount)
  const [metrics, setMetrics] = useState({ total: 25, pending: 9, active: 8, resolved: 8 });

  useEffect(() => {
    const fetchProfileAndAdvisories = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await api.post('/api/auth/profile', { userId: session.user.id });
          if (profile?.name) {
            setUserName(profile.name);
          }

          // Fetch dynamic complaints for active user
          const { data: userComplaints, error: compError } = await supabase
            .from('Complaint')
            .select('id, status, createdAt, summary, category, rawText')
            .eq('userId', session.user.id)
            .order('createdAt', { ascending: false });

          if (!compError && userComplaints) {
            const total = userComplaints.length;
            const pending = userComplaints.filter(c => c.status === 'PENDING').length;
            const active = userComplaints.filter(c => c.status === 'EVALUATING' || c.status === 'DISPATCHED' || c.status === 'ONGOING').length;
            const resolved = userComplaints.filter(c => c.status === 'RESOLVED').length;
            
            // Sync with dynamic numbers only if user has logged complaints, preserving spec defaults otherwise
            if (total > 0) {
              setMetrics({ total, pending, active, resolved });
            }
            setRecentComplaints(userComplaints.slice(0, 3));
          }
        }

        // Fetch advisories from API
        const advisoriesData = await api.get('/api/advisories');
        if (advisoriesData?.success) {
          const publicAdvisories = advisoriesData.advisories.filter(
            (ad) => ad.targetRole === 'broadcast' || !ad.targetRole
          );
          setAdvisories(publicAdvisories);

          const criticalAlerts = publicAdvisories.filter(ad => ad.type === 'warning');
          setAlerts(criticalAlerts);
        }
      } catch (err) {
        console.error("Failed to load home content:", err);
      }
    };
    
    fetchProfileAndAdvisories();
    
    // Refresh data when screen receives focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfileAndAdvisories();
    });
    
    return unsubscribe;
  }, [navigation]);

  const renderStepper = (currentStatus) => {
    const steps = [
      { key: 'SUBMITTED', label: 'Reported', active: true },
      { key: 'EVALUATING', label: 'Evaluating', active: ['EVALUATING', 'DISPATCHED', 'ONGOING', 'RESOLVED'].includes(currentStatus) },
      { key: 'IN_PROGRESS', label: 'In Progress', active: ['DISPATCHED', 'ONGOING', 'RESOLVED'].includes(currentStatus) },
      { key: 'RESOLVED', label: 'Resolved', active: currentStatus === 'RESOLVED' }
    ];

    return (
      <View style={styles.stepperContainer}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.key}>
            <View style={styles.stepWrapper}>
              <View style={[
                styles.stepDot,
                step.active ? styles.stepDotActive : styles.stepDotInactive
              ]}>
                {step.key === 'RESOLVED' && currentStatus === 'RESOLVED' ? (
                  <Ionicons name="checkmark" size={8} color="#fff" />
                ) : step.active ? (
                  <View style={styles.stepDotInner} />
                ) : null}
              </View>
              <Text style={[
                styles.stepLabel,
                step.active ? styles.stepLabelActive : styles.stepLabelInactive
              ]}>
                {step.label}
              </Text>
            </View>
            {idx < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                steps[idx + 1].active ? styles.stepLineActive : steps[idx + 1].active ? styles.stepLineActive : styles.stepLineInactive
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const handleProfilePress = () => {
    setProfileModalVisible(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      Alert.alert("Logout Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* A. Header Card Component */}
      <LinearGradient 
        colors={['#02205eff', '#325497ff']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.headerCard}
      >
        {/* Brand Row */}
        <View style={styles.brandRow}>
          {/* Left: Brand Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/Logo.png')}
              style={styles.logoImage}
            />
          </View>

          {/* Middle: Brand Text */}
          <View style={styles.brandTextContainer}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandAqua}>AQUA</Text>
              <Text style={styles.brandT}>T</Text>
              <Text style={styles.brandRack}>RACK</Text>
            </View>
            <Text style={styles.brandSubtitle}>BF CITIZEN PORTAL</Text>
          </View>

          {/* Right: User Profile Pill */}
          <TouchableOpacity 
            style={styles.profilePill}
            onPress={handleProfilePress}
            activeOpacity={0.8}
          >
            <Text style={styles.profileName} numberOfLines={1}>{userName}</Text>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={14} color="#ffffff" />
              <View style={styles.activeDot} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Metrics Counter Banner */}
        <View style={styles.metricsBanner}>
          <View style={styles.metricColumn}>
            <Text style={styles.metricLabel}>TOTAL LOGS</Text>
            <Text style={styles.metricNumber}>{metrics.total}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: '#FFCC00' }]}>PENDING</Text>
            <Text style={[styles.metricNumber, { color: '#FFCC00' }]}>{metrics.pending}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: '#00D1FF' }]}>ACTIVE</Text>
            <Text style={[styles.metricNumber, { color: '#00D1FF' }]}>{metrics.active}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: '#4CD964' }]}>RESOLVED</Text>
            <Text style={[styles.metricNumber, { color: '#4CD964' }]}>{metrics.resolved}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Scroll Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Critical System Alert Banner (conditional based on warnings) */}
        {alerts.length > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={18} color="#FFCC00" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>CRITICAL SYSTEM ALARM</Text>
              <Text style={styles.alertText}>{alerts[0].title}: {alerts[0].text}</Text>
            </View>
          </View>
        )}

        {/* Latest Ticket Tracker Card */}
        {recentComplaints.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionHeader}>LATEST TICKET TRACKER</Text>
            <TouchableOpacity 
              style={styles.trackerCard}
              onPress={() => navigation.navigate('TrackComplaints')}
              activeOpacity={0.9}
            >
              <Text style={styles.trackerTitle} numberOfLines={1}>
                {recentComplaints[0].summary || recentComplaints[0].category?.replace(/_/g, ' ') || 'Utility Issue'}
              </Text>
              <View style={{ marginTop: 12 }}>
                {renderStepper(recentComplaints[0].status)}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* B. Quick Services Grid */}
        <Text style={styles.sectionHeader}>QUICK SERVICES</Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {/* Card 1: File Report */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('FileComplaint')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0, 209, 255, 0.1)' }]}>
                  <Ionicons name="document-text" size={18} color="#007AFF" />
                </View>
              </View>
              <Text style={styles.cardTitle}>File Report</Text>
              <Text style={styles.cardDesc}>Submit live water quality or pressure issues</Text>
            </TouchableOpacity>

            {/* Card 2: Track Tickets */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('TrackComplaints')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 153, 0, 0.1)' }]}>
                  <Ionicons name="ticket" size={18} color="#FF9500" />
                </View>
                {/* Special feature: Floating badge */}
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{metrics.total || 17}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Track Tickets</Text>
              <Text style={styles.cardDesc}>Monitor your filed reports & live technician progress</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Card 3: Advisories */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('Announcements')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(76, 217, 100, 0.1)' }]}>
                  <Ionicons name="megaphone" size={18} color="#4CD964" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Advisories</Text>
              <Text style={styles.cardDesc}>Official water service advisories & updates</Text>
            </TouchableOpacity>

            {/* Card 4: Support */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('ContactSupport')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(142, 142, 147, 0.1)' }]}>
                  <Ionicons name="help-circle" size={18} color="#8E8E93" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Support</Text>
              <Text style={styles.cardDesc}>Direct customer support line open 24/7</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* C. Water Health Consumer Index Card */}
        <View style={styles.indexCard}>
          {/* Card Header */}
          <View style={styles.indexCardHeader}>
            <View style={styles.indexHeaderLeft}>
              <Ionicons name="shield-checkmark" size={18} color="#007AFF" style={{ marginRight: 6 }} />
              <Text style={styles.indexHeaderTitle}>WATER HEALTH CONSUMER INDEX</Text>
            </View>
            <View style={styles.indexHeaderRight}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>DOLORES NODE LIVE</Text>
            </View>
          </View>

          {/* Card Inner Panel */}
          <View style={styles.indexInnerPanel}>
            {/* Left: Circular progress ring graphic */}
            <View style={styles.progressRing}>
              <Text style={styles.progressNumber}>84</Text>
              <Text style={styles.progressUnit}>WQI</Text>
            </View>

            {/* Right: Status Pill & Description */}
            <View style={styles.indexInfoBlock}>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>STABLE STATE</Text>
              </View>
              <Text style={styles.indexDescription}>
                Satisfactory pressure and quality. Safe for daily household tasks and normal usage.
              </Text>
            </View>
          </View>
        </View>

        {/* D. Recent Activity Section */}
        <Text style={styles.sectionHeader}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          {recentComplaints.length > 0 ? (
            recentComplaints.map((item) => {
              const statusCfg = statusConfigs[item.status] || { label: item.status, text: '#525f7f', bg: '#f1f5f9', dot: '#525f7f' };
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              return (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.activityCard}
                  onPress={() => navigation.navigate('TrackComplaints')}
                  activeOpacity={0.85}
                >
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityDate}>{formattedDate}</Text>
                    <View style={[styles.statusBadgeSmall, { backgroundColor: statusCfg.bg }]}>
                      <View style={[styles.statusDotSmall, { backgroundColor: statusCfg.dot }]} />
                      <Text style={[styles.statusTextSmall, { color: statusCfg.text }]}>{statusCfg.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.activityTitle}>{item.summary || item.category?.replace(/_/g, ' ') || 'Water Utility Report'}</Text>
                  <Text style={styles.activityDesc} numberOfLines={2}>{item.rawText}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyActivityCard}>
              <Ionicons name="clipboard-outline" size={24} color="#8E8E93" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyActivityTitle}>No Recent Reports</Text>
              <Text style={styles.emptyActivityDesc}>Any reports you file will show up here as live status logs.</Text>
            </View>
          )}
        </View>


      </ScrollView>

      {/* Profile actions Modal overlay */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()} // Prevent close action from backdrop triggers
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resident Options</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={20} color="#0B1C3F" />
              </TouchableOpacity>
            </View>

            {/* Profile Info Row */}
            <View style={styles.modalUserSection}>
              <View style={styles.modalAvatarLarge}>
                <Ionicons name="person" size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalUserName}>{userName}</Text>
                <Text style={styles.modalUserRole}>Registered Resident</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              {/* Complaint History */}
              <TouchableOpacity 
                style={styles.modalBtnSecondary}
                onPress={() => {
                  setProfileModalVisible(false);
                  navigation.navigate('ComplaintHistory');
                }}
              >
                <Ionicons name="archive-outline" size={15} color="#001e66" style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnSecondaryText}>Resolved Tickets History</Text>
              </TouchableOpacity>

              {/* Manage Account */}
              <TouchableOpacity 
                style={styles.modalBtnPrimary}
                onPress={() => {
                  setProfileModalVisible(false);
                  navigation.navigate('ManageAccount');
                }}
              >
                <Ionicons name="settings-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnPrimaryText}>Manage Account</Text>
              </TouchableOpacity>

              {/* Log Out */}
              <TouchableOpacity 
                style={styles.modalBtnDanger}
                onPress={async () => {
                  setProfileModalVisible(false);
                  await handleLogout();
                }}
              >
                <Ionicons name="log-out-outline" size={15} color="#FF3B30" style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnDangerText}>Log Out Account</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
