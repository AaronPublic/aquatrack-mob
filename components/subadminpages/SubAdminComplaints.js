import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ScrollView } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import AppIcon from '../../components/AppIcon';
import styles from './SubAdminComplaints.styles';
import TechHeader from './TechHeader';

export default function SubAdminComplaints({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [techProfiles, setTechProfiles] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  
  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST');
  
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

  // Change Ticket Status (Sub-Admin / Technician can assign ONGOING or RESOLVED)
  const handleUpdateStatus = async (ticket, newStatus) => {
    if (!currentUser) return;
    setUpdatingId(ticket.id);
    try {
      const updatePayload = { status: newStatus };

      if (newStatus === 'RESOLVED') {
        updatePayload.resolvedAt = new Date().toISOString();
      }

      // If ticket is unassigned, automatically assign to current technician upon status action
      if (!ticket.assignedToId) {
        updatePayload.assignedToId = currentUser.id;
      }

      // Update via Supabase
      const { error } = await supabase
        .from('Complaint')
        .update(updatePayload)
        .eq('id', ticket.id);

      if (error) {
        // Fallback via API
        const res = await api.put('/api/admin/complaints', {
          id: ticket.id,
          ...updatePayload,
        });
        if (!res || !res.success) {
          throw new Error(res?.error || "Failed to update status");
        }
      }

      fetchComplaintsData();
    } catch (err) {
      console.error("Status update error:", err);
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
    if (item.__sectionHeader) {
      return (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderText}>{item.__sectionHeader}</Text>
          <View style={styles.sectionCountBadge}>
            <Text style={styles.sectionCountText}>
              {item.__sectionCount} {item.__sectionCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
      );
    }

    const urgencyCfg = getUrgencyStyle(item.urgency) || getUrgencyStyle('MEDIUM');
    const isAssignedToMe = currentUser && item.assignedToId === currentUser.id;
    const assigneeName = item.assignedToId ? (techProfiles[item.assignedToId] || "Assigned Tech") : null;

    return (
      <View 
        style={[
          styles.card,
          {
            shadowColor: '#0B2240',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.07,
            shadowRadius: 14,
            elevation: 4,
            borderRadius: 24,
            marginBottom: 14,
          }
        ]}
      >
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
            ID: AQ-{item.id ? item.id.slice(0, 4).toUpperCase() : 'N/A'} | Date: {new Date(item.createdAt).toLocaleDateString(undefined, { timeZone: 'Asia/Manila' })}
          </Text>
        </View>

        {/* Status Action Row (ONGOING / RESOLVED) */}
        <View style={styles.statusControl}>
          <Text style={styles.statusLabel}>Status</Text>
          
          {updatingId === item.id ? (
            <ActivityIndicator size="small" color="#001e66" />
          ) : (
            <View style={styles.statusBtnRow}>
              {['ONGOING', 'RESOLVED'].map((st) => {
                const isActive = item.status === st;
                const activeColor = st === 'RESOLVED' ? '#10B981' : '#D97706'; // Mustard Yellow for ONGOING
                return (
                  <TouchableOpacity 
                    key={st}
                    style={[
                      styles.statusBtn, 
                      isActive && { backgroundColor: activeColor, borderColor: activeColor }
                    ]}
                    onPress={() => handleUpdateStatus(item, st)}
                  >
                    <Text style={[styles.statusTextSmall, isActive && styles.statusTextSmallActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Technician Assignment Info */}
        <View style={styles.assignmentRow}>
          <Text style={styles.assignedText}>
            Assigned: <Text style={styles.assignedName}>{assigneeName ? (isAssignedToMe ? "You" : assigneeName) : "Unassigned"}</Text>
          </Text>
        </View>

        {/* Claim unassigned ticket */}
        {!item.assignedToId && currentUser && (
          <TouchableOpacity
            style={styles.claimBtn}
            activeOpacity={0.8}
            disabled={updatingId === item.id}
            onPress={() => handleAssignToMe(item.id)}
          >
            {updatingId === item.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.claimBtnText}>Claim This Ticket</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Filter & Sort complaints (Newest, Oldest, Urgency)
  const filteredComplaints = complaints
    .filter((c) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        c.rawText?.toLowerCase().includes(query) ||
        (c.summary && c.summary.toLowerCase().includes(query)) ||
        (c.barangay && c.barangay.toLowerCase().includes(query)) ||
        (c.id && c.id.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'OLDEST') {
        const dateA = new Date(a.createdAt || Date.now());
        const dateB = new Date(b.createdAt || Date.now());
        return dateA - dateB;
      }

      if (sortBy === 'URGENCY') {
        const urgencyWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const wA = urgencyWeight[a.urgency] || 0;
        const wB = urgencyWeight[b.urgency] || 0;
        return wB - wA;
      }

      // Default: NEWEST
      const dateA = new Date(a.createdAt || Date.now());
      const dateB = new Date(b.createdAt || Date.now());
      return dateB - dateA;
    });

  // Group into sections: My Active -> Other Active/Unassigned -> Complaint Audit (my resolved)
  const currentUserId = currentUser ? currentUser.id : null;
  const activeTickets = filteredComplaints.filter((c) => c.status !== 'RESOLVED');
  const resolvedTickets = filteredComplaints.filter((c) => c.status === 'RESOLVED');

  const myActive = activeTickets.filter((c) => c.assignedToId === currentUserId);
  const otherActive = activeTickets.filter((c) => c.assignedToId !== currentUserId);
  const myResolved = resolvedTickets.filter((c) => c.assignedToId === currentUserId);

  const groupedSections = [];
  if (myActive.length > 0) groupedSections.push({ label: 'My Active Tickets', items: myActive });
  if (otherActive.length > 0) groupedSections.push({ label: 'Other Active / Unassigned', items: otherActive });
  if (myResolved.length > 0) groupedSections.push({ label: 'Complaint Audit', items: myResolved });

  const listData = [];
  groupedSections.forEach((section) => {
    listData.push({ __sectionHeader: section.label, __sectionCount: section.items.length });
    section.items.forEach((item) => listData.push(item));
  });

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
      <TechHeader
        navigation={navigation}
        pageTitle="Complaints Triage"
        pageDesc="Review municipal alerts and dispatch status"
        showSwirl={true}
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#0C4F8B" size="large" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, marginTop: 12 }}
          data={listData}
          keyExtractor={(item, index) => (item.__sectionHeader ? `section-${item.__sectionHeader}-${index}` : item.id)}
          renderItem={renderTicketItem}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 18, paddingTop: 4 }}>
              {/* Outer Gray Label */}
              <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
                FIELD TRIAGE & INCIDENT QUEUE
              </Text>
              
              {/* Improved Search Bar & Sort Options */}
              <View style={{ marginBottom: 14 }}>
                {/* Modern Full-Width Search Bar */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 14,
                    height: 48,
                    marginBottom: 12,
                    shadowColor: '#0B2240',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  <AppIcon name="search" size={18} color="#0C4F8B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: '#0F172A',
                    }}
                    placeholder="Search by keyword, barangay, or ID..."
                    placeholderTextColor="#94A3B8"
                    value={search}
                    onChangeText={setSearch}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7} style={{ padding: 2 }}>
                      <AppIcon name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Centered Sorting Options Bar */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  {[
                    { id: 'NEWEST', label: 'Newest' },
                    { id: 'OLDEST', label: 'Oldest' },
                    { id: 'URGENCY', label: 'Urgency' }
                  ].map((opt) => {
                    const isSelected = sortBy === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setSortBy(opt.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isSelected ? '#0C4F8B' : '#FFFFFF',
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: isSelected ? '#0C4F8B' : '#E2E8F0',
                          shadowColor: isSelected ? '#0C4F8B' : '#000000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isSelected ? 0.2 : 0.04,
                          shadowRadius: 4,
                          elevation: isSelected ? 3 : 1,
                        }}
                      >
                        <Text style={{ fontSize: 11.5, color: isSelected ? '#FFFFFF' : '#475569', fontWeight: isSelected ? '700' : '600' }}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          }
          contentContainerStyle={[styles.listContainer, { paddingHorizontal: 18 }]}
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
