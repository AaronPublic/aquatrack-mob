import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ScrollView, Platform, Modal, StyleSheet, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import AppIcon from '../../components/AppIcon';
import styles from './SubAdminComplaints.styles';
import TechHeader from './TechHeader';
import * as Location from 'expo-location';
import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from '../../src/config/mapbox';

if (Platform.OS !== 'web') {
  try {
    MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
  } catch (err) {
    console.warn('[Mapbox] setAccessToken failed:', err?.message);
  }
}

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [confirmingTicket, setConfirmingTicket] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  
  // Tracking & Routing States
  const [selectedRouteComplaint, setSelectedRouteComplaint] = useState(null);
  const [techLocation, setTechLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeStats, setRouteStats] = useState({ distance: '0.0 km', duration: '0 mins' });

  const fetchComplaintsData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }

      // Fetch all complaints and tech profiles in parallel
      const [result, { data: users, error: userError }] = await Promise.all([
        api.get('/api/admin/complaints'),
        supabase
          .from('User')
          .select('id, name')
          .in('role', ['FIELD_ENGINEER_TECHNICIAN', 'ADMIN'])
      ]);

      if (result && result.success) {
        setComplaints(result.complaints);
      }

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

  const handleStartJob = async (complaint) => {
    setUpdatingId(complaint.id);
    try {
      const res = await api.put('/api/admin/complaints', {
        id: complaint.id,
        status: 'ONGOING',
        isEnRoute: true
      });
      if (!res || !res.success) {
        throw new Error(res?.error || "Failed to update status via API");
      }
      
      Alert.alert("Job Started", "Incident status is now In Progress. Opening route tracking...");
      fetchComplaintsData();
      
      // Open route tracking overlay
      setSelectedRouteComplaint(complaint);
    } catch (err) {
      Alert.alert("Start Job Failed", err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignToMe = async (complaintId) => {
    if (!currentUser?.id) return;
    setUpdatingId(complaintId);
    try {
      const res = await api.put('/api/admin/complaints', {
        id: complaintId,
        assignedToId: currentUser.id,
        status: 'DISPATCHED'
      });
      if (!res || !res.success) {
        throw new Error(res?.error || "Failed to claim ticket");
      }
      Alert.alert("Ticket Claimed", "You have successfully claimed this complaint ticket.");
      fetchComplaintsData();
    } catch (err) {
      Alert.alert("Claim Failed", err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchDirections = async (techCoords, complaint) => {
    try {
      const start = [techCoords.longitude, techCoords.latitude];
      const end = [complaint.longitude || 120.6955, complaint.latitude || 15.0298];
      
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteCoordinates(route.geometry.coordinates);
        
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        setRouteStats({
          distance: `${distanceKm} km`,
          duration: `${durationMin} mins`
        });
      }
    } catch (err) {
      console.warn("Failed to fetch Mapbox directions:", err.message);
    }
  };

  // Route tracking position watcher
  useEffect(() => {
    let timerId = null;
    let isMounted = true;

    if (selectedRouteComplaint) {
      const updateLocation = async (showLoader = false) => {
        try {
          if (showLoader && isMounted) setRouteLoading(true);
          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (isMounted) {
            let coords = current.coords;
            const endLng = selectedRouteComplaint.longitude || 120.6955;
            const endLat = selectedRouteComplaint.latitude || 15.0298;

            // Check if coordinates are in different regions (more than ~5 degrees difference)
            // e.g. emulator is in California, USA, while complaint is in Pampanga, Philippines
            if (Math.abs(coords.latitude - endLat) > 5 || Math.abs(coords.longitude - endLng) > 5) {
              coords = {
                ...coords,
                longitude: endLng - 0.012, // Offset roughly 1.5 km west
                latitude: endLat - 0.006 // Offset roughly 1 km south
              };
            }

            setTechLocation(coords);
            await fetchDirections(coords, selectedRouteComplaint);
          }
        } catch (err) {
          console.warn("Location tracking fetch failed:", err.message);
        } finally {
          if (showLoader && isMounted) setRouteLoading(false);
        }
      };

      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permission Denied", "GPS location access is required to track the route.");
          return;
        }

        // Get initial location immediately
        await updateLocation(true);

        // Poll every 15 seconds
        timerId = setInterval(() => {
          updateLocation(false);
        }, 15000);
      })();
    } else {
      setTechLocation(null);
      setRouteCoordinates(null);
    }

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
    };
  }, [selectedRouteComplaint]);

  const handleOpenScanner = async () => {
    setScanned(false);
    setScanInput('');
    setTorchOn(false);
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }
    setIsScannerOpen(true);
  };

  const handleLaunchGoogleScanner = async () => {
    if (Platform.OS === 'android' && CameraView.isModernBarcodeScannerAvailable) {
      try {
        setIsScannerOpen(false);
        await CameraView.launchScanner({ barcodeTypes: ['qr'] });
      } catch (err) {
        console.log("Google scanner dismissed:", err?.message);
      }
    }
  };

  const handleBarcodeScanned = (result) => {
    if (scanned) return;
    const rawData = typeof result === 'string' ? result : (result?.data || result?.raw || '');
    if (!rawData) return;
    setScanned(true);
    handleConfirmScan(rawData);
  };

  const handleConfirmScan = async (scannedId) => {
    if (!scannedId) {
      Alert.alert("Error", "Please scan or enter a Ticket ID.");
      setScanned(false);
      return;
    }
    
    // Normalize in case QR code is a URL, query parameter, or prefixed
    let cleanId = String(scannedId).trim();
    if (cleanId.includes('data=')) {
      const match = cleanId.match(/data=([^&]+)/);
      if (match) cleanId = decodeURIComponent(match[1]);
    } else if (cleanId.includes('/')) {
      cleanId = cleanId.split('/').pop().split('?')[0];
    }

    const normalizedScanned = cleanId.replace(/^AQ-/i, '').trim().toLowerCase();
    let found = complaints.find(c => {
      const cId = c.id.toLowerCase();
      const shortId = c.id.slice(0, 8).toLowerCase();
      return (
        cId === normalizedScanned ||
        shortId === normalizedScanned ||
        cId.startsWith(normalizedScanned) ||
        normalizedScanned.includes(cId) ||
        normalizedScanned.includes(shortId)
      );
    });

    // DB fallback if not found in current local state
    if (!found) {
      try {
        const { data: dbComplaints } = await supabase
          .from('Complaint')
          .select('*')
          .or(`id.eq.${cleanId},id.ilike.${normalizedScanned}%`)
          .limit(1);

        if (dbComplaints && dbComplaints.length > 0) {
          found = dbComplaints[0];
        }
      } catch (dbErr) {
        console.warn("DB complaint search error:", dbErr);
      }
    }
    
    if (found) {
      if (found.status === 'RESOLVED') {
        Alert.alert("Already Resolved", `Complaint ticket AQ-${found.id.slice(0, 8).toUpperCase()} is already marked as resolved.`, [
          { text: "OK", onPress: () => setScanned(false) }
        ]);
        return;
      }
      
      setIsScannerOpen(false);
      setScanned(false);
      setConfirmingTicket({
        id: found.id,
        sourceType: 'Complaint',
        barangay: found.barangay ? `Brgy. ${found.barangay}` : 'San Fernando Field Site',
        summary: found.summary || found.category || found.rawText || 'Water Quality / Infrastructure Incident',
        status: found.status || 'PENDING',
        photoUrl: found.photoUrl || found.imageUrl || null,
        urgency: found.urgency || 'MEDIUM',
        residentName: found.residentName || found.userName || (found.assignedToId ? techProfiles[found.assignedToId] : null) || 'Resident',
        createdAt: found.createdAt || null
      });
      return;
    } else {
      Alert.alert(
        "Invalid QR Code", 
        `No active complaint matches code: ${cleanId}. Please try again.`,
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    }
  };

  const handleExecuteResolution = async () => {
    if (!confirmingTicket) return;
    setIsResolving(true);
    try {
      const res = await api.put('/api/admin/complaints', {
        id: confirmingTicket.id,
        status: 'RESOLVED'
      });
      if (!res || !res.success) {
        throw new Error(res?.error || "Failed to update status via API");
      }
      
      const ticketCode = `AQ-${confirmingTicket.id.slice(0, 8).toUpperCase()}`;
      setConfirmingTicket(null);
      Alert.alert("Resolution Verified", `Complaint ticket ${ticketCode} has been successfully resolved.`);
      fetchComplaintsData();
    } catch (err) {
      Alert.alert("Resolution Failed", err.message);
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    let sub = null;
    try {
      if (CameraView.isModernBarcodeScannerAvailable) {
        sub = CameraView.onModernBarcodeScanned((result) => {
          const raw = typeof result === 'string' ? result : (result?.data || '');
          if (raw) {
            handleConfirmScan(raw);
          }
        });
      }
    } catch (e) {
      console.warn("Modern scanner subscription error:", e);
    }
    return () => {
      sub?.remove?.();
    };
  }, [complaints]);

  useEffect(() => {
    fetchComplaintsData();

    // Subscribe to realtime updates with unique channel ID
    const channelName = `subadmin-complaints-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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

        {/* Technician Workorder Actions (Start Job / Track Route) */}
        {isAssignedToMe && item.status !== 'RESOLVED' && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, marginTop: 12 }}>
            {item.status !== 'ONGOING' ? (
              <TouchableOpacity
                style={{
                  backgroundColor: '#001e66',
                  height: 38,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6
                }}
                disabled={updatingId === item.id}
                onPress={() => handleStartJob(item)}
                activeOpacity={0.8}
              >
                {updatingId === item.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <AppIcon name="arrow-forward" size={14} color="#FFFFFF" />
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Start Job Assignment</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: '#00aeef',
                  height: 38,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6
                }}
                onPress={() => {
                  // Re-trigger en-route alerts
                  api.put('/api/admin/complaints', {
                    id: item.id,
                    status: 'ONGOING',
                    isEnRoute: true
                  }).catch(err => console.warn("Failed to re-trigger enroute status:", err));
                  setSelectedRouteComplaint(item);
                }}
                activeOpacity={0.8}
              >
                <AppIcon name="scan-outline" size={14} color="#FFFFFF" />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Track Route</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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

  // Memoize filtered and grouped listData to eliminate re-allocation overhead during scrolling
  const listData = useMemo(() => {
    const filtered = complaints
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

    const currentUserId = currentUser ? currentUser.id : null;
    const activeTickets = filtered.filter((c) => c.status !== 'RESOLVED');
    const resolvedTickets = filtered.filter((c) => c.status === 'RESOLVED');

    const myActive = activeTickets.filter((c) => c.assignedToId === currentUserId);
    const otherActive = activeTickets.filter((c) => c.assignedToId !== currentUserId);
    const myResolved = resolvedTickets.filter((c) => c.assignedToId === currentUserId);

    const sections = [];
    if (myActive.length > 0) sections.push({ label: 'My Active Tickets', items: myActive });
    if (otherActive.length > 0) sections.push({ label: 'Other Active / Unassigned', items: otherActive });
    if (myResolved.length > 0) sections.push({ label: 'Complaint Audit', items: myResolved });

    const result = [];
    sections.forEach((section) => {
      result.push({ __sectionHeader: section.label, __sectionCount: section.items.length });
      section.items.forEach((item) => result.push(item));
    });
    return result;
  }, [complaints, search, sortBy, currentUser]);

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
          keyExtractor={(item, index) => (item.__sectionHeader ? `section-${item.__sectionHeader}-${index}` : (item.id ? `${item.id}-${index}` : `item-${index}`))}
          renderItem={renderTicketItem}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={false}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 18, paddingTop: 4 }}>
              {/* Outer Gray Label */}
              <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
                FIELD TRIAGE & INCIDENT QUEUE
              </Text>
              
              {/* Improved Search Bar & Sort Options */}
              <View style={{ marginBottom: 14 }}>
                {/* Modern Row with Search Bar & Scan QR Button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      paddingHorizontal: 14,
                      height: 48,
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

                  <TouchableOpacity
                    onPress={handleOpenScanner}
                    style={{
                      backgroundColor: '#10B981',
                      height: 48,
                      width: 48,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#10B981',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 10,
                      elevation: 2,
                    }}
                  >
                    <AppIcon name="scan-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
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

      {/* Real Camera QR Code Scanner Overlay */}
      <Modal
        visible={isScannerOpen}
        animationType="slide"
        onRequestClose={() => {
          setIsScannerOpen(false);
          setScanned(false);
          setTorchOn(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#090d16' }}>
          {/* Camera View */}
          {cameraPermission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torchOn}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
          ) : (
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#090d16', justifyContent: 'center', alignItems: 'center', padding: 30 }}>
              <AppIcon name="camera-outline" size={54} color="#94a3b8" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
                Camera Access Needed
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
                Camera permission is required to scan resident QR codes in the field.
              </Text>
              <TouchableOpacity
                onPress={requestCameraPermission}
                style={{
                  backgroundColor: '#00aeef',
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  marginTop: 20
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Translucent HUD Overlay */}
          <View style={{ flex: 1, justifyContent: 'space-between', padding: 24 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 44 : 24 }}>
              <View style={{ backgroundColor: 'rgba(9, 13, 22, 0.75)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Scan QR Code</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Torch Toggle */}
                <TouchableOpacity
                  onPress={() => setTorchOn(!torchOn)}
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: torchOn ? '#00aeef' : 'rgba(9, 13, 22, 0.75)',
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)'
                  }}
                >
                  <AppIcon name={torchOn ? "flash" : "flash-outline"} size={18} color={torchOn ? "#090d16" : "#fff"} />
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity 
                  onPress={() => {
                    setIsScannerOpen(false);
                    setScanned(false);
                    setTorchOn(false);
                  }}
                  style={{ width: 40, height: 40, backgroundColor: 'rgba(9, 13, 22, 0.75)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                >
                  <AppIcon name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Viewfinder Target */}
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <View style={{
                width: 260,
                height: 260,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: '#00aeef',
                backgroundColor: 'rgba(0, 174, 239, 0.04)',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Corner brackets */}
                <View style={{ position: 'absolute', top: -2, left: -2, width: 28, height: 28, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#00aeef', borderTopLeftRadius: 16 }} />
                <View style={{ position: 'absolute', top: -2, right: -2, width: 28, height: 28, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#00aeef', borderTopRightRadius: 16 }} />
                <View style={{ position: 'absolute', bottom: -2, left: -2, width: 28, height: 28, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#00aeef', borderBottomLeftRadius: 16 }} />
                <View style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#00aeef', borderBottomRightRadius: 16 }} />
                
                {scanned && (
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Verifying Code...</Text>
                  </View>
                )}
              </View>
              <View style={{ backgroundColor: 'rgba(9, 13, 22, 0.75)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginTop: 14 }}>
                <Text style={{ color: '#e2e8f0', fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
                  Point camera directly at the resident's ticket QR code
                </Text>
              </View>

              {/* Option to switch to Google Scanner on Android */}
              {Platform.OS === 'android' && CameraView.isModernBarcodeScannerAvailable && (
                <TouchableOpacity
                  onPress={handleLaunchGoogleScanner}
                  style={{
                    backgroundColor: 'rgba(9, 13, 22, 0.85)',
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 16,
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(0,174,239,0.3)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <AppIcon name="scan-outline" size={13} color="#00aeef" />
                  <Text style={{ color: '#00aeef', fontSize: 11, fontWeight: '700' }}>Switch to Google Scanner</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Manual Entry Fallback */}
            <View style={{ backgroundColor: 'rgba(9, 13, 22, 0.85)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20 }}>
              <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Manual Ticket ID / Fallback Entry
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    height: 46,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 'bold'
                  }}
                  value={scanInput}
                  onChangeText={setScanInput}
                  placeholder="e.g. AQ-XXXXXX or UUID"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  onPress={() => handleConfirmScan(scanInput)}
                  style={{
                    backgroundColor: '#00aeef',
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ticket Preview & Resolution Confirmation Modal */}
      <Modal
        visible={!!confirmingTicket}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isResolving) setConfirmingTicket(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(9, 13, 22, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon name="checkmark-circle" size={20} color="#10B981" />
                </View>
                <View>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 }}>Confirm Resolution</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>Verify Scanned Ticket</Text>
                </View>
              </View>
              <TouchableOpacity
                disabled={isResolving}
                onPress={() => setConfirmingTicket(null)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
              >
                <AppIcon name="close" size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Ticket Card Details */}
            {confirmingTicket && (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* ID & Badges */}
                <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: '#00aeef', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>
                      AQ-{confirmingTicket.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <View style={{ backgroundColor: 'rgba(2, 132, 199, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(2, 132, 199, 0.3)' }}>
                      <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                        {confirmingTicket.status || 'ACTIVE'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AppIcon name="location-outline" size={14} color="#94a3b8" />
                    <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>
                      {confirmingTicket.barangay || 'San Fernando'}
                    </Text>
                  </View>

                  {confirmingTicket.residentName && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <AppIcon name="person-outline" size={14} color="#94a3b8" />
                      <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '500' }}>
                        Reported by {confirmingTicket.residentName}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Summary / Description */}
                <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                    Issue Summary
                  </Text>
                  <Text style={{ color: '#f8fafc', fontSize: 13, lineHeight: 18, fontWeight: '500' }}>
                    {confirmingTicket.summary || confirmingTicket.description || 'Assigned Resident Complaint'}
                  </Text>
                </View>

                {/* Photo Preview if attached */}
                {confirmingTicket.photoUrl && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      Resident Attachment
                    </Text>
                    <Image
                      source={{ uri: confirmingTicket.photoUrl }}
                      style={{ width: '100%', height: 160, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', marginVertical: 8 }}>
                  Marking this ticket as resolved will notify the resident and update system records.
                </Text>
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                disabled={isResolving}
                onPress={() => setConfirmingTicket(null)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isResolving}
                onPress={handleExecuteResolution}
                style={{ flex: 1.4, paddingVertical: 13, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
              >
                {isResolving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <AppIcon name="checkmark" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' }}>Mark Resolved</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Route Tracking Map Overlay */}
      {selectedRouteComplaint && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#090d16', zIndex: 3000 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 75, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Technician Route</Text>
              <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>
                Incident: AQ-{selectedRouteComplaint.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setSelectedRouteComplaint(null)}
              style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
            >
              <AppIcon name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Est. Distance</Text>
              <Text style={{ color: '#00aeef', fontSize: 15, fontWeight: 'bold', marginTop: 4 }}>{routeStats.distance}</Text>
            </View>
            <View style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Est. Duration</Text>
              <Text style={{ color: '#00aeef', fontSize: 15, fontWeight: 'bold', marginTop: 4 }}>{routeStats.duration}</Text>
            </View>
          </View>

          {/* Route Map Content */}
          <View style={{ flex: 1 }}>
            {routeLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#00aeef" />
                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 10, fontWeight: '600' }}>Locating and building route...</Text>
              </View>
            ) : techLocation ? (
              Platform.OS === 'web' ? (
                /* Web fallback using OpenStreetMap embed / standard view */
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
                    Web Routing Simulation Mode
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
                    Route from your location ({techLocation.latitude.toFixed(4)}, {techLocation.longitude.toFixed(4)}) to ticket location ({selectedRouteComplaint.latitude?.toFixed(4)}, {selectedRouteComplaint.longitude?.toFixed(4)}) is established.
                  </Text>
                </View>
              ) : (
                /* Native Mapbox Map */
                <MapboxGL.MapView 
                  style={{ flex: 1 }} 
                  styleURL={MapboxGL.StyleURL.Street} 
                  logoEnabled={false} 
                  attributionEnabled={false}
                >
                  <MapboxGL.Camera
                    zoomLevel={14}
                    centerCoordinate={[techLocation.longitude, techLocation.latitude]}
                    animationMode="flyTo"
                    animationDuration={1000}
                  />

                  {/* Pulsing blue technician position indicator */}
                  <MapboxGL.PointAnnotation id="techMarker" coordinate={[techLocation.longitude, techLocation.latitude]}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,174,239,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#00aeef', borderWidth: 1.5, borderColor: '#fff' }} />
                    </View>
                  </MapboxGL.PointAnnotation>

                  {/* Complaint destination red locator marker */}
                  <MapboxGL.PointAnnotation id="destMarker" coordinate={[selectedRouteComplaint.longitude || 120.6955, selectedRouteComplaint.latitude || 15.0298]}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(239,68,68,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="location" size={16} color="#ef4444" />
                    </View>
                  </MapboxGL.PointAnnotation>

                  {/* Cyan route line shape */}
                  {routeCoordinates && (
                    <MapboxGL.ShapeSource
                      id="routeLineSource"
                      shape={{
                        type: "Feature",
                        geometry: {
                          type: "LineString",
                          coordinates: routeCoordinates
                        }}
                      }
                    >
                      <MapboxGL.LineLayer
                        id="routeLineLayer"
                        style={{
                          lineColor: "#00aeef",
                          lineWidth: 4.5,
                          lineCap: "round",
                          lineJoin: "round",
                          lineOpacity: 0.85
                        }}
                      />
                    </MapboxGL.ShapeSource>
                  )}
                </MapboxGL.MapView>
              )
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <AppIcon name="alert-circle" size={32} color="#ef4444" style={{ marginBottom: 12 }} />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Waiting for GPS signal...</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, textAlign: 'center', maxWidth: 220 }}>
                  Make sure your location permissions are allowed.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
