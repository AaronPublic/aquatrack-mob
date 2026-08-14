import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Animated } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import AppIcon from '../../components/AppIcon';
import styles from './SubAdminHome.styles';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTechNotificationStore } from '../../src/store/useTechNotificationStore';
import TechHeader from './TechHeader';
import * as Location from 'expo-location';

export default function SubAdminHome({ navigation }) {
  const [techName, setTechName] = useState('Technician');
  const [loading, setLoading] = useState(true);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const { fetchNotifications } = useTechNotificationStore();

  const profileSlideAnim = useRef(new Animated.Value(280)).current;
  const profileFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profileModalVisible) {
      profileSlideAnim.setValue(280);
      profileFadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(profileSlideAnim, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(profileFadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [profileModalVisible]);

  const handleProfilePress = () => {
    setProfileModalVisible(true);
  };
  
  // Work Order State
  const [hasActiveJob, setHasActiveJob] = useState(false);
  const [jobStatus, setJobStatus] = useState('ASSIGNED'); // ASSIGNED, IN_PROGRESS, RESOLVED
  const [jobDetails, setJobDetails] = useState(null);

  // Dashboard Metrics
  const [metrics, setMetrics] = useState({ activeJobs: 0, pendingTriage: 0, telemetryAlerts: 0 });

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const profile = await api.post('/api/auth/profile', { userId: session.user.id });
      if (profile?.name) setTechName(profile.name);

      // 1. Fetch active work order OR assigned complaint assigned to this technician
      const { data: workOrders } = await supabase
        .from('WorkOrder')
        .select('*, alert(*)')
        .eq('engineerId', session.user.id)
        .neq('status', 'RESOLVED')
        .limit(1);

      if (workOrders && workOrders.length > 0) {
        const wo = workOrders[0];
        setJobStatus(wo.status);
        setJobDetails({
          id: wo.id,
          sourceType: 'WorkOrder',
          location: wo.alert?.nodeId ? `Telemetry Node ID: ${wo.alert.nodeId}` : "Assigned Field Site",
          description: wo.notes || "Investigate clustered consumer complaints and diagnostic telemetry anomalies.",
          instructions: "Inspect pipeline structures, take photos of repairs, and log notes before resolving.",
          imageUrl: wo.imageUrl || null
        });
        setHasActiveJob(true);
      } else {
        // Fetch active assigned complaint for this technician
        const { data: activeComplaints } = await supabase
          .from('Complaint')
          .select('*')
          .eq('assignedToId', session.user.id)
          .neq('status', 'RESOLVED')
          .order('updatedAt', { ascending: false })
          .limit(1);

        if (activeComplaints && activeComplaints.length > 0) {
          const complaint = activeComplaints[0];
          setJobStatus(complaint.status);
          setJobDetails({
            id: complaint.id,
            sourceType: 'Complaint',
            location: complaint.barangay ? `Brgy. ${complaint.barangay}` : "Municipal Field Site",
            description: complaint.summary || complaint.rawText || "Assigned Resident Water Complaint",
            instructions: complaint.rawText || "Inspect resident report location, perform field maintenance, and update resolution.",
            imageUrl: complaint.photoUrl || complaint.imageUrl || null
          });
          setHasActiveJob(true);
        } else {
          setHasActiveJob(false);
          setJobDetails(null);
        }
      }

      // 2. Fetch metrics
      const { count: totalLogsCount } = await supabase
        .from('Complaint')
        .select('*', { count: 'exact', head: true });

      const { count: unclaimedCount } = await supabase
        .from('Complaint')
        .select('*', { count: 'exact', head: true })
        .is('assignedToId', null)
        .neq('status', 'RESOLVED');

      const { count: assignedCount } = await supabase
        .from('Complaint')
        .select('*', { count: 'exact', head: true })
        .eq('assignedToId', session.user.id)
        .neq('status', 'RESOLVED');

      const { count: resolvedCount } = await supabase
        .from('Complaint')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'RESOLVED');

      const { count: activeWoCount } = await supabase
        .from('WorkOrder')
        .select('*', { count: 'exact', head: true })
        .eq('engineerId', session.user.id)
        .neq('status', 'RESOLVED');

      const nodeRes = await api.get('/api/admin/nodes');
      let activeAlerts = 0;
      if (nodeRes && nodeRes.success && nodeRes.nodes) {
        activeAlerts = nodeRes.nodes.filter(n => n.status !== 'ONLINE').length;
      }

      setMetrics({
        totalLogs: totalLogsCount || 0,
        assigned: (assignedCount || activeWoCount || 0),
        resolved: resolvedCount || 0,
        pendingTriage: unclaimedCount || 0,
        telemetryAlerts: activeAlerts,
      });

    } catch (err) {
      console.error("Failed to load technician dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    fetchNotifications();

    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
      fetchNotifications();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;
    let subscription = null;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        let initialLoc = null;
        try {
          initialLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (locErr) {
          initialLoc = await Location.getLastKnownPositionAsync();
        }

        if (!initialLoc) {
          console.warn('Technician location unavailable — live tracking skipped');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          await api.post('/api/auth/location', {
            userId: session.user.id,
            latitude: initialLoc.coords.latitude,
            longitude: initialLoc.coords.longitude,
          });
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 50,
            timeInterval: 60000,
          },
          async (newLoc) => {
            if (!isMounted) return;
            try {
              const currentSession = await supabase.auth.getSession();
              const uId = currentSession?.data?.session?.user?.id;
              if (uId) {
                await api.post('/api/auth/location', {
                  userId: uId,
                  latitude: newLoc.coords.latitude,
                  longitude: newLoc.coords.longitude,
                });
              }
            } catch (err) {
              console.error('Error updating live technician coordinates:', err);
            }
          }
        );
      } catch (err) {
        console.error('Failed to initialize technician location tracker:', err);
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      if (subscription) subscription.remove();
    };
  }, []);

  const handleUpdateStatus = async (newStatus) => {
    const statusLabel = newStatus === 'ONGOING' ? 'Ongoing Repair' : 'Resolved';
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to mark this job as ${statusLabel}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Confirm", 
          onPress: async () => {
            try {
              if (jobDetails) {
                const targetTable = jobDetails.sourceType === 'Complaint' ? 'Complaint' : 'WorkOrder';
                const updatePayload = {
                  status: newStatus,
                  ...(newStatus === 'RESOLVED' ? { resolvedAt: new Date().toISOString() } : {})
                };

                const { error } = await supabase
                  .from(targetTable)
                  .update(updatePayload)
                  .eq('id', jobDetails.id);

                if (error) throw error;
              }
              setJobStatus(newStatus);
              if (newStatus === 'RESOLVED') {
                setHasActiveJob(false);
              }
              loadDashboardData();
            } catch (err) {
              Alert.alert("Status Update Failed", err.message);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      Alert.alert("Logout Error", err.message);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'ONGOING':
        return { label: 'Ongoing Repair', text: '#d97706', bg: '#fef3c7', border: '#fde68a' };
      case 'EVALUATING':
        return { label: 'Evaluating', text: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' };
      case 'DISPATCHED':
        return { label: 'Dispatched', text: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', text: '#d97706', bg: '#fef3c7', border: '#fde68a' };
      case 'ASSIGNED':
        return { label: 'Assigned', text: '#b45309', bg: '#fef3c7', border: '#fde68a' };
      case 'RESOLVED':
        return { label: 'Resolved', text: '#047857', bg: '#ecfdf5', border: '#a7f3d0' };
      default:
        return { label: status || 'Assigned', text: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' };
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F5FA' }}>
        <ActivityIndicator color="#0C4F8B" size="large" />
      </View>
    );
  }

  const currentStatusCfg = getStatusConfig(jobStatus);

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
      {/* Shared Technician Header */}
      <TechHeader
        navigation={navigation}
        subtitle="TECHNICIAN PORTAL"
        pageTitle={`Hello, ${techName}`}
        pageDesc="City of San Fernando • Field Ops"
        roleDesc="Manage field work orders, dispatch repair crews, monitor real-time IoT telemetry nodes, and triage citizen complaint reports."
        techName={techName}
        metrics={metrics}
        showSwirl={true}
        onProfilePress={handleProfilePress}
      />

      <ScrollView style={[styles.scrollView, { marginTop: 12 }]} contentContainerStyle={styles.scrollContent}>
        {/* Active Work Order tracking panel */}
        {hasActiveJob && jobDetails ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
              LATEST ASSIGNMENT
            </Text>
            <View 
              style={[
                styles.trackerCard,
                {
                  shadowColor: '#0B2240',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.07,
                  shadowRadius: 14,
                  elevation: 4,
                  borderRadius: 24,
                }
              ]}
            >
              <View style={styles.trackerHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.trackerLabel}>Incident ID</Text>
                  <Text style={styles.trackerTitle}>AQ-{jobDetails.id ? jobDetails.id.slice(0, 4).toUpperCase() : 'N/A'}</Text>
                </View>
                <View style={[styles.statusBadgeSmall, { backgroundColor: currentStatusCfg.bg, borderColor: currentStatusCfg.border }]}>
                  <Text style={[styles.statusTextSmall, { color: currentStatusCfg.text }]}>
                    {currentStatusCfg.label}
                  </Text>
                </View>
              </View>

              <View style={styles.woBody}>
                <View style={styles.woDetailItem}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{jobDetails.location}</Text>
                </View>

                <View style={styles.woDetailItem}>
                  <Text style={styles.detailLabel}>Diagnostic Details</Text>
                  <Text style={styles.detailText}>{jobDetails.description}</Text>
                </View>

                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsTitle}>Recommended Instructions</Text>
                  <Text style={styles.instructionsText}>"{jobDetails.instructions}"</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyTrackerBox, { marginBottom: 20, borderRadius: 24 }]}>
            <AppIcon name="construct-outline" size={24} color="#8E8E93" style={{ marginBottom: 6 }} />
            <Text style={styles.emptyTrackerTitle}>No Active Jobs Assigned</Text>
            <Text style={styles.emptyTrackerDesc}>You are currently available for dispatch work orders.</Text>
          </View>
        )}

        {/* Tools Grid */}
        <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
          TECHNICIAN WORKSPACE
        </Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {/* Card 1: Citizen Complaints Triage */}
            <TouchableOpacity 
              style={[
                styles.gridCard,
                {
                  shadowColor: '#0B2240',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.07,
                  shadowRadius: 14,
                  elevation: 4,
                  borderRadius: 24,
                }
              ]}
              onPress={() => navigation.navigate('SubAdminComplaints')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0, 174, 239, 0.1)' }]}>
                  <AppIcon name="chatbubbles" size={18} color="#00aeef" />
                </View>
                {metrics.pendingTriage > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{metrics.pendingTriage}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>Triage Board</Text>
              <Text style={styles.cardDesc}>View assigned citizen complaints & status updates</Text>
            </TouchableOpacity>

            {/* Card 2: IoT Telemetry Node Sensor Network */}
            <TouchableOpacity 
              style={[
                styles.gridCard,
                {
                  shadowColor: '#0B2240',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.07,
                  shadowRadius: 14,
                  elevation: 4,
                  borderRadius: 24,
                }
              ]}
              onPress={() => navigation.navigate('SubAdminTelemetry')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0, 30, 102, 0.1)' }]}>
                  <AppIcon name="pulse" size={18} color="#001e66" />
                </View>
              </View>
              <Text style={styles.cardTitle}>IoT Telemetry</Text>
              <Text style={styles.cardDesc}>Monitor live pressure, pH, NTU sensors</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Card 3: Staff Advisories */}
            <TouchableOpacity 
              style={[
                styles.gridCard,
                {
                  shadowColor: '#0B2240',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.07,
                  shadowRadius: 14,
                  elevation: 4,
                  borderRadius: 24,
                }
              ]}
              onPress={() => navigation.navigate('SubAdminAdvisories')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <AppIcon name="megaphone" size={18} color="#f59e0b" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Advisories</Text>
              <Text style={styles.cardDesc}>Read internal water district notices</Text>
            </TouchableOpacity>

            {/* Card 4: Support */}
            <TouchableOpacity 
              style={[
                styles.gridCard,
                {
                  shadowColor: '#0B2240',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.07,
                  shadowRadius: 14,
                  elevation: 4,
                  borderRadius: 24,
                }
              ]}
              onPress={() => Alert.alert("Operations Hotline", "City water district control room dispatcher: +63 (45) 961-0022")}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <AppIcon name="call" size={18} color="#10b981" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Dispatch Room</Text>
              <Text style={styles.cardDesc}>Call water command center operations</Text>
            </TouchableOpacity>
          </View>
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
          <Animated.View 
            style={{ 
              width: '100%', 
              opacity: profileFadeAnim, 
              transform: [{ translateY: profileSlideAnim }] 
            }}
          >
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Technician Options</Text>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                  <AppIcon name="close" size={20} color="#0B1C3F" />
                </TouchableOpacity>
              </View>

              {/* Profile Info Row */}
              <View style={styles.modalUserSection}>
                <View style={styles.modalAvatarLarge}>
                  <AppIcon name="person" size={20} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalUserName}>{techName}</Text>
                  <Text style={styles.modalUserRole}>Field Technician</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {/* Manage Account */}
                <TouchableOpacity 
                  style={styles.modalBtnPrimary}
                  onPress={() => {
                    setProfileModalVisible(false);
                    navigation.navigate('ManageAccount');
                  }}
                >
                  <AppIcon name="settings-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
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
                  <AppIcon name="log-out-outline" size={15} color="#FF3B30" style={{ marginRight: 6 }} />
                  <Text style={styles.modalBtnDangerText}>Log Out Account</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

