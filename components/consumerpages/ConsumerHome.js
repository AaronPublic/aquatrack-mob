import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './ConsumerHome.styles';

export default function ConsumerHome({ navigation }) {
  const [userName, setUserName] = useState('Resident');
  const [advisories, setAdvisories] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchProfileAndAdvisories = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await api.post('/api/auth/profile', { userId: session.user.id });
          if (profile?.name) {
            setUserName(profile.name);
          }
        }

        // Fetch advisories from API
        const advisoriesData = await api.get('/api/advisories');
        if (advisoriesData?.success) {
          const publicAdvisories = advisoriesData.advisories.filter(
            (ad) => ad.targetRole === 'broadcast' || !ad.targetRole
          );
          setAdvisories(publicAdvisories);

          const criticalAlerts = publicAdvisories.filter(ad => ad.type === 'warning');
          setAlerts(criticalAlerts);
        }
      } catch (err) {
        console.error("Failed to load home content:", err);
      }
    };
    fetchProfileAndAdvisories();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      Alert.alert("Logout Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBanner}>
        <Text style={styles.greeting}>Hello, {userName}!</Text>
        <Text style={styles.subgreeting}>City of San Fernando Water District</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Critical Advisory alert banner if any */}
        {alerts.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>CRITICAL SYSTEM ALARM</Text>
              <Text style={styles.alertText}>{alerts[0].title}: {alerts[0].text}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.shortcutsGrid}>
          <TouchableOpacity 
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('FileComplaint')}
          >
            <View>
              <Text style={styles.shortcutTitle}>File Complaint</Text>
              <Text style={styles.shortcutDesc}>Report leak, water color, or low pressure</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('TrackComplaints')}
          >
            <View>
              <Text style={styles.shortcutTitle}>Track Tickets</Text>
              <Text style={styles.shortcutDesc}>Monitor repair and triage status</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.shortcutsGrid}>
          <TouchableOpacity 
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Announcements')}
          >
            <View>
              <Text style={styles.shortcutTitle}>Announcements</Text>
              <Text style={styles.shortcutDesc}>View water district bulletins</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <View>
              <Text style={styles.shortcutTitle}>Contact support</Text>
              <Text style={styles.shortcutDesc}>Hotlines, office hours, and locations</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Latest Bulletins</Text>
        {advisories.slice(0, 3).map((ad) => (
          <View key={ad.id} style={styles.advisoryCard}>
            <View style={styles.advisoryTextContainer}>
              <View style={styles.advisoryMeta}>
                <Text style={styles.advisoryDate}>{ad.date}</Text>
                <View style={[
                  styles.advisoryTypeBadge, 
                  ad.type === 'warning' 
                    ? { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }
                    : { backgroundColor: '#eff6ff', borderColor: '#93c5fd' }
                ]}>
                  <Text style={[
                    styles.advisoryType,
                    ad.type === 'warning' ? { color: '#dc2626' } : { color: '#2563eb' }
                  ]}>{ad.type}</Text>
                </View>
              </View>
              <Text style={styles.advisoryTitle}>{ad.title}</Text>
              <Text style={styles.advisoryDesc} numberOfLines={2}>{ad.text}</Text>
            </View>
          </View>
        ))}

        {advisories.length === 0 && (
          <Text style={styles.emptyText}>No active announcements.</Text>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
