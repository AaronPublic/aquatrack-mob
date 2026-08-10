import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import styles from './ComplaintHistory.styles';
import homeStyles from './ConsumerHome.styles';

export default function ComplaintHistory() {
  const [resolvedComplaints, setResolvedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResolvedComplaints = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Fetch complaints from Supabase with status = 'RESOLVED'
      const { data, error } = await supabase
        .from('Complaint')
        .select('*')
        .eq('userId', session.user.id)
        .eq('status', 'RESOLVED')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setResolvedComplaints(data || []);
    } catch (err) {
      console.error("Failed to fetch resolved tickets:", err);
      Alert.alert("Data Sync Failed", "Could not synchronize ticket records with server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResolvedComplaints();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResolvedComplaints();
  };

  const renderItem = ({ item }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>RESOLVED</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>
            {item.summary || item.category?.replace(/_/g, ' ') || 'Water Issue'}
          </Text>
          <Text style={styles.cardDesc}>{item.rawText}</Text>
        </View>

        {item.barangay && (
          <View style={styles.cardFooter}>
            <Ionicons name="location-outline" size={12} color="#525f7f" />
            <Text style={styles.locationText}>Brgy. {item.barangay}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
      {/* Top Blue Gradient Header Component */}
      <LinearGradient 
        colors={['#0C4F8B', '#008CE3']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }} 
        style={[homeStyles.headerCard, { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 20, marginBottom: 12 }]}
      >
        {/* Background Water Ripple Decorations */}
        <View style={homeStyles.decorCircle1} />
        <View style={homeStyles.decorCircle2} />

        {/* Brand Row */}
        <View style={homeStyles.brandRow}>
          {/* Left: AquaTrack Multi-Colored Logo */}
          <View style={homeStyles.logoContainer}>
            <Ionicons name="water" size={26} color="#7DD3FC" />
            <Text style={homeStyles.brandTitleText}>
              <Text style={{ color: '#FFFFFF' }}>AQ</Text>
              <Text style={{ color: '#FBBF24' }}>U</Text>
              <Text style={{ color: '#EF4444' }}>A</Text>
              <Text style={{ color: '#FFFFFF' }}>TRACK</Text>
            </Text>
          </View>
        </View>

        {/* Page Greeting & Subtitle */}
        <View style={homeStyles.greetingContainer}>
          <Text style={homeStyles.greetingText}>Ticket History</Text>
          <View style={homeStyles.locationPill}>
            <Ionicons name="archive-outline" size={13} color="#E0F2FE" />
            <Text style={homeStyles.locationText}>Archived & resolved water report logs</Text>
          </View>
        </View>
      </LinearGradient>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#001e66" size="large" />
        </View>
      ) : (
        <FlatList
          data={resolvedComplaints}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#001e66" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="archive-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Resolved Tickets</Text>
              <Text style={styles.emptySubtitle}>Any tickets filed that are resolved by field staff will be archived here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
