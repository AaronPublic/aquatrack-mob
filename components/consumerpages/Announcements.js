import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { api } from '../../src/config/api';
import { Ionicons } from '@expo/vector-icons';
import styles from './Announcements.styles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Announcements() {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, WARNINGS, UPDATES
  const [expandedId, setExpandedId] = useState(null);

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

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }) => {
    const isWarning = item.type === 'warning';
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity 
        style={[styles.card, isExpanded && styles.cardExpanded]}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{item.date}</Text>
          <View style={[
            styles.badge,
            isWarning
              ? { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }
              : { backgroundColor: '#eff6ff', borderColor: '#93c5fd' }
          ]}>
            <View style={[
              styles.badgeDot,
              { backgroundColor: isWarning ? '#dc2626' : '#2563eb' }
            ]} />
            <Text style={[
              styles.badgeText,
              isWarning ? { color: '#dc2626' } : { color: '#2563eb' }
            ]}>{item.type || 'info'}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        
        <Text 
          style={styles.cardText}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {item.text}
        </Text>

        {isExpanded ? (
          <View style={styles.expandToggle}>
            <Text style={styles.expandToggleText}>Tap to collapse</Text>
            <Ionicons name="chevron-up" size={14} color="#8E8E93" />
          </View>
        ) : (
          <View style={styles.expandToggleRow}>
            <View style={styles.expandToggle}>
              <Text style={styles.expandToggleText}>Read More</Text>
              <Ionicons name="chevron-down" size={14} color="#8E8E93" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredAdvisories = advisories.filter(item => {
    if (activeTab === 'WARNINGS') {
      return item.type === 'warning';
    }
    if (activeTab === 'UPDATES') {
      return item.type !== 'warning';
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water District Bulletins</Text>
        <Text style={styles.subtitle}>Latest official advisories and service interruption schedules</Text>
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabBar}>
        {['ALL', 'WARNINGS', 'UPDATES'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveTab(tab);
                setExpandedId(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#001e66" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredAdvisories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#001e66" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Bulletins Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'ALL'
                  ? "There are no bulletins broadcasted at this time."
                  : activeTab === 'WARNINGS'
                    ? "There are no critical warning alarms currently active."
                    : "There are no general service updates posted right now."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

