import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './SubAdminTelemetry.styles';

export default function SubAdminTelemetry() {
  const [nodes, setNodes] = useState([]);
  const [readings, setReadings] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTelemetryData = async () => {
    try {
      // 1. Fetch nodes via API
      const nodeRes = await api.get('/api/admin/nodes');
      if (nodeRes && nodeRes.success) {
        setNodes(nodeRes.nodes);

        // 2. Fetch the latest reading for each node from DB
        const { data: latestReadings, error: readError } = await supabase
          .from('TelemetryReading')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!readError && latestReadings) {
          const latestMap = {};
          latestReadings.forEach(r => {
            if (!latestMap[r.nodeId]) {
              latestMap[r.nodeId] = r;
            }
          });
          setReadings(latestMap);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Sync Error", "Could not load telemetry nodes from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetryData();

    // Listen to realtime telemetry readings to update stats immediately!
    const channel = supabase
      .channel('tech-telemetry-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'TelemetryReading' }, (payload) => {
        const newReading = payload.new;
        setReadings(prev => ({
          ...prev,
          [newReading.nodeId]: newReading
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTelemetryData();
  };

  const getNodeStatusCfg = (status) => {
    switch (status) {
      case 'ONLINE':
        return { label: 'Online', text: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
      case 'OFFLINE':
        return { label: 'Offline', text: '#dc2626', bg: '#fef2f2', border: '#fca5a5' };
      default:
        return { label: 'Maintenance', text: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    }
  };

  const renderNodeItem = ({ item }) => {
    const statusCfg = getNodeStatusCfg(item.status);
    const lastRead = readings[item.id] || { ph: 7.2, turbidity: 1.5, tds: 180, pressure: 38.5, timestamp: new Date() };
    const formattedTime = new Date(lastRead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.nodeName}>{item.name}</Text>
            <Text style={{ fontSize: 10, color: '#94a3b8' }}>Type: {item.type}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Water pH</Text>
            <Text style={styles.metricValue}>{lastRead.ph?.toFixed(2) || '7.0'}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Turbidity</Text>
            <Text style={styles.metricValue}>{lastRead.turbidity?.toFixed(2) || '1.0'} NTU</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>TDS Minerals</Text>
            <Text style={styles.metricValue}>{lastRead.tds?.toFixed(0) || '150'} ppm</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pressure</Text>
            <Text style={[
              styles.metricValue, 
              lastRead.pressure < 25 && { color: '#ef4444' } // Low pressure highlighted in red
            ]}>
              {lastRead.pressure?.toFixed(1) || '40.0'} psi
            </Text>
          </View>
        </View>

        <Text style={styles.metaFooter}>Last report: {formattedTime}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>IoT Telemetry Nodes</Text>
        <Text style={styles.subtitle}>Real-time sensor monitors for ph, turbidity, pressure, and TDS</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#001e66" size="large" />
        </View>
      ) : (
        <FlatList
          data={nodes}
          keyExtractor={(item) => item.id}
          renderItem={renderNodeItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#001e66" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No telemetry nodes active.</Text>
          }
        />
      )}
    </View>
  );
}
