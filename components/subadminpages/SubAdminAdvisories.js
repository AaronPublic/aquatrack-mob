import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../../src/config/api';
import AppIcon from '../../components/AppIcon';
import styles from './SubAdminAdvisories.styles';
import TechHeader from './TechHeader';

export default function SubAdminAdvisories({ navigation }) {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdvisories = async () => {
    try {
      const data = await api.get('/api/advisories');
      if (data?.success) {
        // Filter broadcast/technician alerts
        const staffAdvisories = data.advisories.filter(
          (ad) => ad.targetRole === 'broadcast' || ad.targetRole === 'technicians' || !ad.targetRole
        );
        setAdvisories(staffAdvisories);
      }
    } catch (err) {
      console.error("Failed to fetch staff advisories:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdvisories();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdvisories();
  };

  const renderItem = ({ item }) => {
    const isWarning = item.type === 'warning';
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
          <Text style={styles.date}>{item.date}</Text>
          <View style={[
            styles.badge,
            isWarning
              ? { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }
              : { backgroundColor: '#eff6ff', borderColor: '#93c5fd' }
          ]}>
            <Text style={[
              styles.badgeText,
              isWarning ? { color: '#dc2626' } : { color: '#2563eb' }
            ]}>{item.type}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
      <TechHeader
        navigation={navigation}
        pageTitle="Staff Advisories"
        pageDesc="District advisories, pipeline maintenance events, and technician alerts"
        showSwirl={true}
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#0C4F8B" size="large" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, marginTop: 12 }}
          data={advisories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 18, paddingTop: 4 }}>
              {/* Outer Gray Label */}
              <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
                BROADCASTED MUNICIPAL ALERTS
              </Text>
            </View>
          }
          contentContainerStyle={[styles.listContainer, { paddingHorizontal: 18 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#001e66" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active announcements.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
