import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import { Ionicons } from '@expo/vector-icons';
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

      // 1. Fetch active work order assigned to this engineer
      const { data: workOrders, error: woError } = await supabase
        .from('WorkOrder')
        .select('*, alert(*)')
        .eq('engineerId', session.user.id)
        .neq('status', 'RESOLVED')
        .limit(1);

      if (!woError && workOrders && workOrders.length > 0) {
        const wo = workOrders[0];
        setJobStatus(wo.status);
        setJobDetails({
          id: wo.id,
          location: wo.alert?.nodeId ? `Telemetry Node ID: ${wo.alert.nodeId}` : "Assigned Field Site",
          description: wo.notes || "Investigate clustered consumer complaints and diagnostic telemetry anomalies.",
          instructions: "Inspect pipeline structures, take photos of repairs, and log notes before resolving.",
          imageUrl: null // Supabase storage image would map here if available
        });
        setHasActiveJob(true);
      } else {
        setHasActiveJob(false);
        setJobDetails(null);
      }

      // 2. Fetch metrics
      // Count unclaimed complaints
      const { count: unclaimedCount, error: compErr } = await supabase
        .from('Complaint')
        .select('*', { count: 'exact', head: true })
        .is('assignedToId', null)
        .neq('status', 'RESOLVED');

      // Count active work orders for this tech
      const { count: activeWoCount, error: activeErr } = await supabase
        .from('WorkOrder')
        .select('*', { count: 'exact', head: true })
        .eq('engineerId', session.user.id)
        .neq('status', 'RESOLVED');

      // Count active telemetry warnings/anomalies (non-ONLINE nodes)
      const nodeRes = await api.get('/api/admin/nodes');
      let activeAlerts = 0;
      if (nodeRes && nodeRes.success && nodeRes.nodes) {
        activeAlerts = nodeRes.nodes.filter(n => n.status !== 'ONLINE').length;
      }

      setMetrics({
        activeJobs: activeWoCount || 0,
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

    // Refresh on screen focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
      fetchNotifications();
    });

    return unsubscribe;
  }, [navigation]);

  // Real-time location tracking for Technician Proximity Dispatcher
  useEffect(() => {
    let isMounted = true;
    let subscription = null;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Foreground location permission denied');
          return;
        }

        // 1. Get initial position and send to database
        const initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          await api.post('/api/auth/location', {
            userId: session.user.id,
            latitude: initialLoc.coords.latitude,
            longitude: initialLoc.coords.longitude,
          });
        }

        // 2. Watch for moves of 50m or more and update DB
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 50, // 50 meters
            timeInterval: 60000,   // or 60 seconds
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
                console.log('Technician location updated dynamically:', newLoc.coords.latitude, newLoc.coords.longitude);
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
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const handleUpdateStatus = async (newStatus) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to mark this job as ${newStatus === 'IN_PROGRESS' ? 'In Progress' : 'Resolved'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Confirm", 
          onPress: async () => {
            try {
              if (jobDetails) {
                const { error } = await supabase
                  .from('WorkOrder')
                  .update({ status: newStatus, resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : null })
                  .eq('id', jobDetails.id);

                if (error) throw error;
              }
              setJobStatus(newStatus);
              if (newStatus === 'RESOLVED') {
                setHasActiveJob(false);
              }
              loadDashboardData(); // Refresh metrics
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
      case 'ASSIGNED':
        return { label: 'Assigned', text: '#b45309', bg: '#fef3c7', border: '#fde68a' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', text: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' };
      case 'RESOLVED':
        return { label: 'Resolved', text: '#047857', bg: '#ecfdf5', border: '#a7f3d0' };
      default:
        return { label: 'Unknown', text: '#525f7f', bg: '#f1f5f9', border: '#e2e8f0' };
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator color="#001e66" size="large" />
      </View>
    );
  }

  const currentStatusCfg = getStatusConfig(jobStatus);

  return (
    <View style={styles.container}>
      {/* Shared Technician Header */}
      <TechHeader
        navigation={navigation}
        subtitle="TECHNICIAN PORTAL"
        pageTitle={`FT-${techName.split(' ')[0]}`}
        pageDesc="Welcome, Field Technician"
        techName={techName}
        metrics={metrics}
        onProfilePress={handleProfilePress}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Active Work Order tracking panel */}
        {hasActiveJob && jobDetails ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionHeader}>Latest Assignment</Text>
            <View style={styles.trackerCard}>
              <View style={styles.trackerHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.trackerLabel}>Incident ID</Text>
                  <Text style={styles.trackerTitle}>{jobDetails.id}</Text>
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

                {jobDetails.imageUrl && (
                  <View style={styles.woDetailItem}>
                    <Text style={styles.detailLabel}>Incident Photo</Text>
                    <Image source={{ uri: jobDetails.imageUrl }} style={styles.woImage} />
                  </View>
                )}

                <View style={styles.woDetailItem}>
                  <Text style={styles.detailLabel}>Diagnostic Details</Text>
                  <Text style={styles.detailText}>{jobDetails.description}</Text>
                </View>

                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsTitle}>Recommended Instructions</Text>
                  <Text style={styles.instructionsText}>"{jobDetails.instructions}"</Text>
                </View>
              </View>

              <View style={styles.trackerActions}>
                {jobStatus === 'ASSIGNED' ? (
                  <TouchableOpacity style={styles.btnAction} onPress={() => handleUpdateStatus('IN_PROGRESS')} activeOpacity={0.8}>
                    <Text style={styles.btnActionText}>Start Assignment</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#10b981' }]} onPress={() => handleUpdateStatus('RESOLVED')} activeOpacity={0.8}>
                    <Text style={styles.btnActionText}>Mark as Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyTrackerBox}>
            <Ionicons name="construct-outline" size={24} color="#8E8E93" style={{ marginBottom: 6 }} />
            <Text style={styles.emptyTrackerTitle}>No Active Jobs Assigned</Text>
            <Text style={styles.emptyTrackerDesc}>You are currently available for dispatch work orders.</Text>
          </View>
        )}

        {/* Tools Grid */}
        <Text style={styles.sectionHeader}>Technician Workspace</Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {/* Card 1: Citizen Complaints Triage */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('SubAdminComplaints')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0, 174, 239, 0.1)' }]}>
                  <Ionicons name="chatbubbles" size={18} color="#00aeef" />
                </View>
                {metrics.pendingTriage > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{metrics.pendingTriage}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>Triage Board</Text>
              <Text style={styles.cardDesc}>Claim unassigned citizen complaints & alerts</Text>
            </TouchableOpacity>

            {/* Card 2: IoT Telemetry Node Sensor Network */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('SubAdminTelemetry')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0, 30, 102, 0.1)' }]}>
                  <Ionicons name="pulse" size={18} color="#001e66" />
                </View>
              </View>
              <Text style={styles.cardTitle}>IoT Telemetry</Text>
              <Text style={styles.cardDesc}>Monitor live pressure, pH, NTU sensors</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Card 3: Staff Advisories */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('SubAdminAdvisories')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="megaphone" size={18} color="#f59e0b" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Advisories</Text>
              <Text style={styles.cardDesc}>Read internal water district notices</Text>
            </TouchableOpacity>

            {/* Card 4: Support */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => Alert.alert("Operations Hotline", "City water district control room dispatcher: +63 (45) 961-0022")}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="call" size={18} color="#10b981" />
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
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()} // Prevent close action from backdrop triggers
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Technician Options</Text>
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

