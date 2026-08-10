import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import styles from './ContactSupport.styles';
import homeStyles from './ConsumerHome.styles';

export default function ContactSupport({ navigation }) {
  const offices = [
    {
      name: "CSFWD Main Office (Sto. Rosario)",
      address: "2MMQ+68 San Fernando, Pampanga, Philippines",
      phone: "(045) 961-3546",
      hours: "8:00 AM - 5:00 PM (Mon-Fri)"
    },
    {
      name: "Saguin Sub-Office",
      address: "Fortune Square Bldg. (in front of Coke), Saguin, City of San Fernando, Pampanga",
      phone: "(045) 961-5804",
      hours: "8:00 AM - 5:00 PM (Mon-Fri)"
    },
    {
      name: "Sindalan Sub-Office",
      address: "Sindalan Payment Center, Brgy. Sindalan, City of San Fernando, Pampanga",
      phone: "0968-854-1343",
      hours: "8:00 AM - 3:00 PM (Mon-Fri)"
    },
    {
      name: "Bulaon Sub-Office",
      address: "Bulaon Payment Center, Brgy. Bulaon, City of San Fernando, Pampanga",
      phone: "0933-814-6585",
      hours: "8:00 AM - 3:00 PM (Mon-Fri)"
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#F2F5FA' }]} contentContainerStyle={styles.scrollContent}>
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
          <Text style={homeStyles.greetingText}>Contact Support</Text>
          <View style={homeStyles.locationPill}>
            <Ionicons name="call-outline" size={13} color="#E0F2FE" />
            <Text style={homeStyles.locationText}>City Water District hotlines & branch directory</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.contentPadding}>
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flash-outline" size={18} color="#2196F3" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Emergency Channels</Text>
          </View>
          
          <View style={styles.contactRow}>
            <View style={styles.contactLabelColumn}>
              <Text style={styles.contactLabel}>Phone</Text>
            </View>
            <View style={styles.contactValueColumn}>
              <Text style={styles.contactValue}>(045) 961-3546</Text>
              <Text style={styles.contactSubtext}>24/7 Operations Hotline</Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactLabelColumn}>
              <Text style={styles.contactLabel}>Email</Text>
            </View>
            <View style={styles.contactValueColumn}>
              <Text style={styles.contactValue}>support@csfwd.gov.ph</Text>
              <Text style={styles.contactSubtext}>Direct support desk email</Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactLabelColumn}>
              <Text style={styles.contactLabel}>Web</Text>
            </View>
            <View style={styles.contactValueColumn}>
              <Text style={styles.contactValue}>csfwd.gov.ph</Text>
              <Text style={styles.contactSubtext}>Official Water District portal</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="business-outline" size={18} color="#2196F3" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>District Branches</Text>
          </View>

          {offices.map((office, idx) => {
            const isLast = idx === offices.length - 1;
            return (
              <View key={idx} style={isLast ? styles.branchItemLast : styles.branchItem}>
                <Text style={styles.branchName}>{office.name}</Text>
                <Text style={styles.branchDetail}>Address: {office.address}</Text>
                <Text style={styles.branchDetail}>Phone: <Text style={styles.branchDetailBold}>{office.phone}</Text></Text>
                <Text style={styles.branchDetail}>Hours: {office.hours}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
