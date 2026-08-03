import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import { Ionicons } from '@expo/vector-icons';
import styles from './SubAdminComplaints.styles';
import TechHeader from './TechHeader';

export default function SubAdminComplaints({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [techProfiles, setTechProfiles] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [filterAssignedOnly, setFilterAssignedOnly] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchComplaintsData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }

      // Fetch all complaints from API
      const result = await api.get('/api/admin/complaints');
      if (result && result.success) {
        setComplaints(result.complaints);
      }

      // Fetch tech profiles for display mappings
      const { data: users, error: userError } = await supabase
        .from('User')
        .select('id, name')
        .in('role', ['FIELD_ENGINEER_TECHNICIAN', 'ADMIN']);

      if (!userError && users) {
        const mapping = {};
        users.forEach(u => {
          mapping[u.id] = u.name;
        });
        setTechProfiles(mapping);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Sync Error", "Could not fetch complaints from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaintsData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('tech-complaints-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Complaint' }, () => {
        fetchComplaintsData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComplaintsData();
  };

  // Assign a ticket to self
  const handleAssignToMe = async (ticketId) => {
    if (!currentUser) return;
    setUpdatingId(ticketId);
    try {
      const { error } = await supabase
        .from('Complaint')
        .update({ assignedToId: currentUser.id, status: 'EVALUATING' })
        .eq('id', ticketId);

      if (error) throw error;
      
      Alert.alert("Ticket Assigned", "You are now assigned to this complaint ticket.");
      fetchComplaintsData();
    } catch (err) {
      Alert.alert("Assignment Failed", err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Change Ticket Status
  const handleUpdateStatus = async (ticket, newStatus) => {
    // Dispatched Safety Guard
    if (newStatus === 'DISPATCHED' && !ticket.assignedToId) {
      Alert.alert(
        "Assignment Required",
        "A field technician must be assigned to this ticket before changing status to DISPATCHED.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Assign to Me & Dispatch", 
            onPress: async () => {
              setUpdatingId(ticket.id);
              try {
                const { error } = await supabase
                  .from('Complaint')
                  .update({ assignedToId: currentUser.id, status: 'DISPATCHED' })
                  .eq('id', ticket.id);

                if (error) throw error;
                fetchComplaintsData();
              } catch (err) {
                Alert.alert("Update Failed", err.message);
              } finally {
                setUpdatingId(null);
              }
            } 
          }
        ]
      );
      return;
    }

    setUpdatingId(ticket.id);
    try {
      const res = await api.put('/api/admin/complaints', {
        id: ticket.id,
        status: newStatus
      });

      if (res && res.success) {
        fetchComplaintsData();
      } else {
        throw new Error(res.error || "Failed to update status");
      }
    } catch (err) {
      Alert.alert("Update Error", err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case 'CRITICAL':
        return { bg: '#fef2f2', text: '#ef4444', border: '#fca5a5' };
      case 'HIGH':
        return { bg: '#fff7ed', text: '#f97316', border: '#fed7aa' };
      case 'MEDIUM':
        return { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe' };
      default:
        return { bg: '#f0fdf4', text: '#10b981', border: '#bbf7d0' };
    }
  };

  const renderTicketItem = ({ item }) => {
    const urgencyCfg = getUrgencyStyle(item.urgency) || getUrgencyStyle('MEDIUM');
    const isAssignedToMe = currentUser && item.assignedToId === currentUser.id;
    const assigneeName = item.assignedToId ? (techProfiles[item.assignedToId] || "Assigned Tech") : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.barangayBadge}>
            <Text style={styles.barangayText}>Brgy. {item.barangay || 'Out of Boundary'}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyCfg.bg, borderColor: urgencyCfg.border }]}>
            <Text style={[styles.urgencyText, { color: urgencyCfg.text }]}>{item.urgency}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardSummary}>{item.summary || "Resident Complaint"}</Text>
          <Text style={styles.cardDesc}>{item.rawText}</Text>
          <Text style={styles.metaText}>
            ID: {item.id.substring(0, 8)}... | Date: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Status Action Row */}
        <View style={styles.statusControl}>
          <Text style={styles.statusLabel}>Status</Text>
          
          {updatingId === item.id ? (
            <ActivityIndicator size="small" color="#001e66" />
          ) : (
            <View style={styles.statusBtnRow}>
              {['EVALUATING', 'DISPATCHED', 'RESOLVED'].map((st) => {
                const isActive = item.status === st;
                return (
                  <TouchableOpacity 
                    key={st}
                    style={[styles.statusBtn, isActive && styles.statusBtnActive]}
                    onPress={() => handleUpdateStatus(item, st)}
                  >
                    <Text style={[styles.statusTextSmall, isActive && styles.statusTextSmallActive]}>
                      {st.substring(0, 4)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Technician Assignment Info */}
        <View style={styles.assignmentRow}>
          {assigneeName ? (
            <Text style={styles.assignedText}>
              Assigned: <Text style={styles.assignedName}>{isAssignedToMe ? "You" : assigneeName}</Text>
            </Text>
          ) : (
            <Text style={styles.assignedText}>Unassigned</Text>
          )}

          {!item.assignedToId && (
            <TouchableOpacity style={styles.assignBtn} onPress={() => handleAssignToMe(item.id)}>
              <Text style={styles.assignBtnText}>Claim Ticket</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Filter complaints based on Search & Assigned Only toggle
  const filteredComplaints = complaints.filter((c) => {
    const textMatches = c.rawText.toLowerCase().includes(search.toLowerCase()) || 
                       (c.summary && c.summary.toLowerCase().includes(search.toLowerCase()));
    
    if (filterAssignedOnly) {
      return textMatches && currentUser && c.assignedToId === currentUser.id;
    }
    return textMatches;
  });

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
      <TechHeader
        navigation={navigation}
        subtitle="TECHNICIAN TRIAGE"
        pageTitle="Complaints Triage"
        pageDesc="Review municipal alerts and dispatch status"
      />

      <View style={[styles.filterRow, { marginTop: 16 }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by keyword..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        
        <TouchableOpacity 
          style={[styles.filterBtn, filterAssignedOnly && styles.filterBtnActive]}
          onPress={() => setFilterAssignedOnly(!filterAssignedOnly)}
        >
          <Text style={[styles.filterBtnText, filterAssignedOnly && styles.filterBtnTextActive]}>
            {filterAssignedOnly ? "Show All" : "My Assigned"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#001e66" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item.id}
          renderItem={renderTicketItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#001e66" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No complaints found matching the criteria.</Text>
          }
        />
      )}
    </View>
  );
}
