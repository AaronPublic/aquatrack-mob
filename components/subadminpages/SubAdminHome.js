import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './SubAdminHome.styles';

export default function SubAdminHome({ navigation }) {
  const [techName, setTechName] = useState('Technician');
  const [loading, setLoading] = useState(true);
  
  // Work Order State
  const [hasActiveJob, setHasActiveJob] = useState(true);
  const [jobStatus, setJobStatus] = useState('ASSIGNED'); // ASSIGNED, IN_PROGRESS, RESOLVED
  const [jobDetails, setJobDetails] = useState({
    id: "job-101",
    location: "Main Street Valve #45",
    description: "Pressure drop reported nearby. Suspected line breach at section B-12. Multiple consumer complaints received in surrounding barangay.",
    instructions: "Verify pressure gauges, inspect gaskets on section B-12, document all findings with photos before proceeding with repairs.",
    imageUrl: "https://images.unsplash.com/photo-1584267385494-9fdf97b090f5?auto=format&fit=crop&w=600&q=80"
  });

  const [advisories, setAdvisories] = useState([]);

  useEffect(() => {
    const loadTechPortal = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await api.post('/api/auth/profile', { userId: session.user.id });
          if (profile?.name) setTechName(profile.name);

          // Fetch work orders assigned to this engineer from DB
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
              imageUrl: null
            });
            setHasActiveJob(true);
          }
        }

        // Fetch advisories broadcast to technicians
        const data = await api.get('/api/advisories');
        if (data?.success) {
          const staffAdvisories = data.advisories.filter(
            (ad) => ad.targetRole === 'broadcast' || ad.targetRole === 'technicians'
          );
          setAdvisories(staffAdvisories);
        }
      } catch (err) {
        console.error("Failed to load tech profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTechPortal();
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
              if (jobDetails.id !== "job-101") {
                // Update in Supabase database
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
      <View style={styles.headerBanner}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>FT-{techName.split(' ')[0]}</Text>
          <Text style={styles.subgreeting}>Field Technician Workspace</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionHeader}>Active Work Assignment</Text>
        
        {hasActiveJob ? (
          <View style={styles.woCard}>
            <View style={styles.woHeader}>
              <View>
                <Text style={styles.woLabel}>Incident ID</Text>
                <Text style={styles.woId}>{jobDetails.id}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: currentStatusCfg.bg, borderColor: currentStatusCfg.border }]}>
                <Text style={[styles.statusText, { color: currentStatusCfg.text }]}>{currentStatusCfg.label}</Text>
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

            <View style={styles.actionRow}>
              {jobStatus === 'ASSIGNED' && (
                <TouchableOpacity style={styles.btnPrimary} onPress={() => handleUpdateStatus('IN_PROGRESS')}>
                  <Text style={styles.btnText}>Start Job</Text>
                </TouchableOpacity>
              )}
              {jobStatus === 'IN_PROGRESS' && (
                <TouchableOpacity style={styles.btnSuccess} onPress={() => handleUpdateStatus('RESOLVED')}>
                  <Text style={styles.btnText}>Mark as Resolved</Text>
                </TouchableOpacity>
              )}
              {jobStatus === 'RESOLVED' && (
                <View style={styles.completeBanner}>
                  <Text style={styles.completeText}>Job Completed</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>You have no active work orders assigned today.</Text>
          </View>
        )}

        <Text style={styles.sectionHeader}>Staff Advisories & Bulletins</Text>
        {advisories.map((ad) => (
          <View key={ad.id} style={styles.advisoryCard}>
            <View style={styles.advisoryMeta}>
              <Text style={styles.advisoryDate}>{ad.date}</Text>
              <View style={[
                styles.statusBadge, 
                ad.type === 'warning' 
                  ? { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }
                  : { backgroundColor: '#eff6ff', borderColor: '#93c5fd' }
              ]}>
                <Text style={[
                  styles.statusText,
                  ad.type === 'warning' ? { color: '#dc2626' } : { color: '#2563eb' }
                ]}>{ad.type}</Text>
              </View>
            </View>
            <Text style={styles.advisoryTitle}>{ad.title}</Text>
            <Text style={styles.advisoryDesc}>{ad.text}</Text>
          </View>
        ))}

        {advisories.length === 0 && (
          <Text style={styles.emptyText}>No active staff advisories.</Text>
        )}
      </ScrollView>
    </View>
  );
}
