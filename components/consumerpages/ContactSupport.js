import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import styles from './ContactSupport.styles';

export default function ContactSupport() {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Contact Water District</Text>
        <Text style={styles.subtitle}>Get in touch for billing, emergency operations, or service inquiries</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Emergency Channels</Text>
        
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Phone</Text>
          <View>
            <Text style={styles.contactValue}>(045) 961-3546</Text>
            <Text style={styles.subText}>24/7 Operations Hotline</Text>
          </View>
        </View>

        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Email</Text>
          <View>
            <Text style={styles.contactValue}>support@csfwd.gov.ph</Text>
            <Text style={styles.subText}>Direct support desk email</Text>
          </View>
        </View>

        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Web</Text>
          <View>
            <Text style={styles.contactValue}>csfwd.gov.ph</Text>
            <Text style={styles.subText}>Official Water District portal</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>District Branches</Text>

        {offices.map((office, idx) => (
          <View key={idx} style={[styles.officeItem, idx === offices.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.officeName}>{office.name}</Text>
            <Text style={styles.officeDetail}>Address: {office.address}</Text>
            <Text style={styles.officeDetail}>Phone: {office.phone}</Text>
            <Text style={styles.officeDetail}>Hours: {office.hours}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
