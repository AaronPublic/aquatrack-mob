import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import { MapPin, Clock, Play, CheckCircle2, ChevronRight, Wrench } from 'lucide-react-native';
import AppIcon from '../../components/AppIcon';
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
            <AppIcon name="log-out-outline" size={16} color="#FF3B30" />
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
          <View className="mb-6">
            <Text className="text-[#8E8E93] font-black text-[10px] uppercase tracking-[2px] mb-3 px-1">Latest Assignment</Text>
            <TouchableOpacity
              className="bg-white border border-[#E2E8F5] rounded-3xl p-5 shadow-sm active:scale-[0.99]"
              onPress={() => navigation.navigate('SubAdminHomeDetail')}
              activeOpacity={0.9}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] items-center justify-center mr-3">
                      <MapPin size={18} color="#0C4F8B" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#8E8E93] font-bold text-[9px] uppercase tracking-wider">Location</Text>
                      <Text className="text-[#0B2240] font-extrabold text-sm mt-0.5" numberOfLines={1}>{jobDetails.location}</Text>
                    </View>
                  </View>
                </View>

                <View
                  className={[
                    'flex-row items-center rounded-full px-2.5 py-1 border ml-2',
                    jobStatus === 'ASSIGNED' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200',
                  ].join(' ')}
                >
                  {jobStatus === 'ASSIGNED' ? (
                    <Clock size={11} color="#B45309" style={{ marginRight: 4 }} />
                  ) : (
                    <Play size={11} color="#1D4ED8" style={{ marginRight: 4 }} />
                  )}
                  <Text
                    className={[
                      'text-[9px] font-black uppercase tracking-wider',
                      jobStatus === 'ASSIGNED' ? 'text-[#B45309]' : 'text-[#1D4ED8]',
                    ].join(' ')}
                  >
                    {jobStatus === 'ASSIGNED' ? 'Assigned' : 'In Progress'}
                  </Text>
                </View>
              </View>

              <Text className="text-[#525F7F] text-xs leading-[16px] font-medium mt-4" numberOfLines={2}>
                {jobDetails.description}
              </Text>

              <View className="border-t border-[#F1F5F9] pt-3 mt-4 flex-row items-center">
                {jobStatus === 'ASSIGNED' ? (
                  <TouchableOpacity
                    className="bg-[#0C4F8B] h-[38px] rounded-xl flex-1 items-center justify-center flex-row"
                    onPress={() => handleUpdateStatus('IN_PROGRESS')}
                    activeOpacity={0.8}
                  >
                    <Play size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text className="text-white font-bold text-[11px] uppercase tracking-wider">Start Assignment</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    className="bg-[#10B981] h-[38px] rounded-xl flex-1 items-center justify-center flex-row"
                    onPress={() => handleUpdateStatus('RESOLVED')}
                    activeOpacity={0.8}
                  >
                    <CheckCircle2 size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text className="text-white font-bold text-[11px] uppercase tracking-wider">Mark as Resolved</Text>
                  </TouchableOpacity>
                )}
                <View className="w-9 h-9 ml-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F5] items-center justify-center">
                  <ChevronRight size={18} color="#94A3B8" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-white border border-[#E2E8F5] rounded-3xl p-6 items-center shadow-sm mb-6">
            <View className="w-12 h-12 rounded-2xl bg-[#F1F5F9] items-center justify-center mb-3">
              <Wrench size={22} color="#8E8E93" />
            </View>
            <Text className="text-[#0B1C3F] font-bold text-sm">No Active Jobs Assigned</Text>
            <Text className="text-[#8E8E93] text-xs text-center mt-1">You are currently available for dispatch work orders.</Text>
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
              style={styles.gridCard}
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
              style={styles.gridCard}
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
              style={styles.gridCard}
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
    </View>
  );
}
