import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { api } from '../config/api';
import { theme } from '../config/theme';

// Auth Screens
import Login from '../../components/authpages/Login';
import Register from '../../components/authpages/Register';

// Consumer Screens
import ConsumerHome from '../../components/consumerpages/ConsumerHome';
import FileComplaint from '../../components/consumerpages/FileComplaint';
import TrackComplaints from '../../components/consumerpages/TrackComplaints';
import Announcements from '../../components/consumerpages/Announcements';
import ContactSupport from '../../components/consumerpages/ContactSupport';
import ManageAccount from '../../components/consumerpages/ManageAccount';
import ComplaintHistory from '../../components/consumerpages/ComplaintHistory';

// Sub-Admin Screens
import SubAdminHome from '../../components/subadminpages/SubAdminHome';
import SubAdminComplaints from '../../components/subadminpages/SubAdminComplaints';
import SubAdminTelemetry from '../../components/subadminpages/SubAdminTelemetry';
import SubAdminAdvisories from '../../components/subadminpages/SubAdminAdvisories';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Muted Tab styles (Premium floating visual bar matching web platform upgrades)
const getTabBarOptions = () => ({
  tabBarActiveTintColor: theme.colors.accent,
  tabBarInactiveTintColor: theme.colors.textMuted,
  tabBarShowLabel: false, // Sleek modern icon-only aesthetic
  tabBarStyle: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 64,
    borderRadius: 24,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingBottom: 0,
    shadowColor: '#0B1C3F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  headerStyle: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontSize: 12,
    fontWeight: 'black',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

function ConsumerTabNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        ...getTabBarOptions(),
        tabBarActiveTintColor: theme.colors.accent, // Dynamic Brand Azure Blue active highlight
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'ConsumerHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'FileComplaint') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'TrackComplaints') {
            iconName = focused ? 'ticket' : 'ticket-outline';
          } else if (route.name === 'Announcements') {
            iconName = focused ? 'megaphone' : 'megaphone-outline';
          }
          
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 4 }}>
              <Ionicons name={iconName} size={20} color={color} />
              {focused && (
                <View 
                  style={{ 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    backgroundColor: color, 
                    marginTop: 4 
                  }} 
                />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="ConsumerHome" 
        component={ConsumerHome} 
        options={{ title: 'Home', headerShown: false }} 
      />
      <Tab.Screen 
        name="FileComplaint" 
        component={FileComplaint} 
        options={{ title: 'Report', headerTitle: 'File Ticket' }} 
      />
      <Tab.Screen 
        name="TrackComplaints" 
        component={TrackComplaints} 
        options={{ title: 'Tickets', headerTitle: 'Triage History' }} 
      />
      <Tab.Screen 
        name="Announcements" 
        component={Announcements} 
        options={{ title: 'Advisories', headerTitle: 'Bulletins' }} 
      />
    </Tab.Navigator>
  );
}

function SubAdminTabNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        ...getTabBarOptions(),
        tabBarActiveTintColor: theme.colors.accent,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'SubAdminHome') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'SubAdminComplaints') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'SubAdminTelemetry') {
            iconName = focused ? 'pulse' : 'pulse-outline';
          } else if (route.name === 'SubAdminAdvisories') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          }
          
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 4 }}>
              <Ionicons name={iconName} size={20} color={color} />
              {focused && (
                <View 
                  style={{ 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    backgroundColor: color, 
                    marginTop: 4 
                  }} 
                />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="SubAdminHome" 
        component={SubAdminHome} 
        options={{ title: 'My Job', headerTitle: 'Technician Command' }} 
      />
      <Tab.Screen 
        name="SubAdminComplaints" 
        component={SubAdminComplaints} 
        options={{ title: 'Triage', headerTitle: 'Citizen Complaints' }} 
      />
      <Tab.Screen 
        name="SubAdminTelemetry" 
        component={SubAdminTelemetry} 
        options={{ title: 'Telemetry', headerTitle: 'Sensor Network' }} 
      />
      <Tab.Screen 
        name="SubAdminAdvisories" 
        component={SubAdminAdvisories} 
        options={{ title: 'Advisories', headerTitle: 'Staff Notices' }} 
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Verify user role
          const profile = await api.post('/api/auth/profile', { userId: session.user.id });
          if (profile?.role === 'ADMIN') {
            await supabase.auth.signOut();
            setInitialRoute('Login');
          } else if (profile?.role === 'FIELD_ENGINEER_TECHNICIAN') {
            setInitialRoute('SubAdminTab');
          } else {
            setInitialRoute('ConsumerTab');
          }
        }
      } catch (err) {
        console.error("Session auto-route error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
        <ActivityIndicator color="#001e66" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="ConsumerTab" component={ConsumerTabNavigator} />
      <Stack.Screen name="SubAdminTab" component={SubAdminTabNavigator} />
      <Stack.Screen 
        name="ContactSupport" 
        component={ContactSupport} 
        options={{ 
          headerShown: true, 
          headerTitle: 'CONTACT SUPPORT',
          headerTintColor: theme.colors.primary,
          headerTitleStyle: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
          headerStyle: { backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border }
        }} 
      />
      <Stack.Screen 
        name="ManageAccount" 
        component={ManageAccount} 
        options={{ 
          headerShown: true, 
          headerTitle: 'Account Settings',
          headerTintColor: theme.colors.primary,
          headerTitleStyle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
          headerStyle: { backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border }
        }} 
      />
      <Stack.Screen 
        name="ComplaintHistory" 
        component={ComplaintHistory} 
        options={{ 
          headerShown: true, 
          headerTitle: 'Archived Tickets',
          headerTintColor: theme.colors.primary,
          headerTitleStyle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
          headerStyle: { backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border }
        }} 
      />
    </Stack.Navigator>
  );
}
