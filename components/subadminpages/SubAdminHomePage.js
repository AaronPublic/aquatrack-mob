import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './SubAdminHomePage.styles';

export default function SubAdminHomePage({ navigation }) {
  const [techName, setTechName] = useState('Technician');
  const [loading, setLoading] = useState(true);
  
  // Work Order State
  const [hasActiveJob, setHasActiveJob] = useState(false);
  const [jobStatus, setJobStatus] = useState('ASSIGNED');
  const [jobDetails, setJobDetails] = useState(null);

  // Dashboard Metrics
  const [metrics, setMetrics] = useState({ activeJobs: 0, pendingTriage: 0, telemetryAlerts: 0 });

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const profile = await api.post('/api/auth/profile', { userId: session.user.id });
      if (profile?.name) setTechName(profile.name);

      // 1. Fetch active work order
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
          description: wo.notes || "Investigate telemetry anomalies and reports.",
          instructions: "Verify gauges, check sections, and take photos of repairs.",
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

    // Refresh on screen focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

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
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      Alert.alert("Logout Error", err.message);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator color="#001e66" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dashboard Header Card */}
      <LinearGradient 
        colors={['#02205eff', '#325497ff']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.headerCard}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>Welcome,</Text>
            <Text style={styles.techNameTitle}>FT-{techName.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={16} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Metrics overview */}
        <View style={styles.metricsRow}>
          <View style={styles.metricColumn}>
            <Text style={styles.metricLabel}>My Jobs</Text>
            <Text style={styles.metricNumber}>{metrics.activeJobs}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.metricColumn}>
            <Text style={styles.metricLabel}>Unassigned</Text>
            <Text style={styles.metricNumber}>{metrics.pendingTriage}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.metricColumn}>
            <Text style={styles.metricLabel}>IoT Alerts</Text>
            <Text style={styles.metricNumber}>{metrics.telemetryAlerts}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Active Work Order tracking panel */}
        {hasActiveJob && jobDetails ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionHeader}>Latest Assignment</Text>
            <TouchableOpacity 
              style={styles.trackerCard}
              onPress={() => navigation.navigate('SubAdminHomeDetail')}
              activeOpacity={0.9}
            >
              <View style={styles.trackerHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.trackerLabel}>Location</Text>
                  <Text style={styles.trackerTitle} numberOfLines={1}>{jobDetails.location}</Text>
                </View>
                <View style={[styles.statusBadgeSmall, { backgroundColor: jobStatus === 'ASSIGNED' ? '#fef3c7' : '#eff6ff' }]}>
                  <View style={[styles.statusDotSmall, { backgroundColor: jobStatus === 'ASSIGNED' ? '#f59e0b' : '#3b82f6' }]} />
                  <Text style={[styles.statusTextSmall, { color: jobStatus === 'ASSIGNED' ? '#b45309' : '#1d4ed8' }]}>
                    {jobStatus === 'ASSIGNED' ? 'Assigned' : 'In Progress'}
                  </Text>
                </View>
              </View>

              <Text style={styles.trackerDesc} numberOfLines={2}>
                {jobDetails.description}
              </Text>

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
            </TouchableOpacity>
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
              <Text style={styles.cardDesc}>View assigned citizen complaints & status updates</Text>
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
    </View>
  );
}
