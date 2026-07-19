import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import styles from './ComplaintHistory.styles';

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
    <View style={styles.container}>
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
