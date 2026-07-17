import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './TrackComplaints.styles';

const statusConfigs = {
  PENDING: { label: "Pending Review", text: "#b45309", bg: "#fef3c7", border: "#fde68a", dot: "#f59e0b" },
  EVALUATING: { label: "Evaluating", text: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
  DISPATCHED: { label: "Crew Dispatched", text: "#c2410c", bg: "#fff7ed", border: "#ffedd5", dot: "#f97316" },
  ONGOING: { label: "Ongoing Repair", text: "#4338ca", bg: "#eef2ff", border: "#e0e7ff", dot: "#6366f1" },
  RESOLVED: { label: "Resolved", text: "#047857", bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981" },
};

export default function TrackComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [techProfiles, setTechProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Query from Supabase directly for this resident's tickets
      const { data, error } = await supabase
        .from('Complaint')
        .select('*')
        .eq('userId', session.user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      setComplaints(data || []);

      // Proactively fetch profiles of technicians assigned to these complaints
      const uniqueTechIds = [...new Set(data.map(c => c.assignedToId).filter(Boolean))];
      if (uniqueTechIds.length > 0) {
        const { data: profiles, error: profileErr } = await supabase
          .from('User')
          .select('id, name')
          .in('id', uniqueTechIds);

        if (!profileErr && profiles) {
          const mapping = {};
          profiles.forEach(p => {
            mapping[p.id] = p.name;
          });
          setTechProfiles(prev => ({ ...prev, ...mapping }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      Alert.alert("Data Sync Failed", "Could not synchronize ticket records with server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    // Setup realtime subscription to update ticket status instantly on status updates!
    let channel;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel(`resident-complaints-${session.user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'Complaint', filter: `userId=eq.${session.user.id}` },
          (payload) => {
            console.log("Realtime ticket update:", payload);
            fetchComplaints(); // Refresh list immediately!
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const renderTicketItem = ({ item }) => {
    const statusCfg = statusConfigs[item.status] || statusConfigs.PENDING;
    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const techName = item.assignedToId ? (techProfiles[item.assignedToId] || "Assigned Technician") : null;

    return (
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketDate}>{formattedDate}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }
          ]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
            <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <Text style={styles.ticketSummary}>
          {item.summary || "Resident Reported Complaint"}
        </Text>
        <Text style={styles.ticketDescription} numberOfLines={3}>
          {item.rawText}
        </Text>

        <View style={styles.ticketLocation}>
          <Text style={styles.ticketLocationText}>Brgy. {item.barangay || 'Resolved Area'}</Text>
        </View>

        {/* Technician dispatch notice if assigned */}
        {techName && (
          <View style={styles.assignmentBlock}>
            <View style={styles.assignmentAvatar}>
              <Text style={styles.assignmentAvatarText}>
                {techName.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.assignmentInfo}>
              <Text style={styles.assignmentLabel}>Assigned Dispatcher</Text>
              <Text style={styles.assignmentName}>{techName}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Track My Tickets</Text>
        <Text style={styles.subtitle}>Check real-time evaluation logs and engineer dispatches</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#001e66" size="large" />
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id}
          renderItem={renderTicketItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#001e66" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't submitted any complaints yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
