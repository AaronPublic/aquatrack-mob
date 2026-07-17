import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../../src/config/api';
import styles from './Announcements.styles';

export default function Announcements() {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdvisories = async () => {
    try {
      const data = await api.get('/api/advisories');
      if (data?.success) {
        // Filter broadcast/consumer alerts
        const publicAdvisories = data.advisories.filter(
          (ad) => ad.targetRole === 'broadcast' || ad.targetRole === 'consumers' || !ad.targetRole
        );
        setAdvisories(publicAdvisories);
      }
    } catch (err) {
      console.error("Failed to fetch advisories:", err);
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
      <View style={styles.card}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water District Bulletins</Text>
        <Text style={styles.subtitle}>Latest official advisories and service interruption schedules</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#001e66" size="large" />
        </View>
      ) : (
        <FlatList
          data={advisories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#001e66" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active advisories broadcasted.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
