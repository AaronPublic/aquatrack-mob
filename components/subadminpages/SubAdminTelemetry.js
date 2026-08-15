import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import AppIcon from '../../components/AppIcon';
import styles from './SubAdminTelemetry.styles';
import TechHeader from './TechHeader';

export default function SubAdminTelemetry({ navigation }) {
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'TelemetryNode' }, (payload) => {
        setNodes(prev => {
          if (payload.eventType === 'DELETE') {
            return prev.filter(n => n.id !== payload.old.id);
          }
          const updated = payload.new;
          return prev.map(n => n.id === updated.id ? { ...n, ...updated } : n);
        });
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
    const lastRead = readings[item.id] || null;
    const formattedTime = lastRead
      ? new Date(lastRead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' })
      : '—';

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
          <View>
            <Text style={styles.nodeName}>{item.name}</Text>
            <Text style={{ fontSize: 10, color: '#94a3b8' }}>Type: {item.type}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {lastRead ? (
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Water pH</Text>
              <Text style={styles.metricValue}>{lastRead.ph != null ? lastRead.ph.toFixed(2) : '—'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Turbidity</Text>
              <Text style={styles.metricValue}>{lastRead.turbidity != null ? `${lastRead.turbidity.toFixed(2)} NTU` : '—'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TDS Minerals</Text>
              <Text style={styles.metricValue}>{lastRead.tds != null ? `${lastRead.tds.toFixed(0)} ppm` : '—'}</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Pressure</Text>
              <Text style={[
                styles.metricValue,
                lastRead.pressure != null && lastRead.pressure < 25 && { color: '#ef4444' }
              ]}>
                {lastRead.pressure != null ? `${lastRead.pressure.toFixed(1)} psi` : '—'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noReadingBox}>
            <Text style={styles.noReadingText}>No available readings for this IoT node</Text>
          </View>
        )}

        <Text style={styles.metaFooter}>{lastRead ? `Last report: ${formattedTime}` : 'No reports received yet'}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
      <TechHeader
        navigation={navigation}
        pageTitle="IoT Telemetry Nodes"
        pageDesc="Real-time sensor monitors for pH, turbidity, pressure, and TDS"
        showSwirl={true}
      />

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#001e66" />
        }
        style={{ flex: 1, marginTop: 12 }}
        contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 18, paddingTop: 4 }}
      >
        {/* Outer Gray Label */}
        <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
          REAL-TIME TELEMETRY SENSOR NODES
        </Text>

        {loading ? (
          <View style={{ marginTop: 40, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#0C4F8B" size="large" />
          </View>
        ) : nodes.length > 0 ? (
          <View style={styles.listContainer}>
            {nodes.map((node) => (
              <React.Fragment key={node.id}>
                {renderNodeItem({ item: node })}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No telemetry nodes active.</Text>
        )}
      </ScrollView>
    </View>
  );
}
