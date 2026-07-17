import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

// Sub-Admin Screens
import SubAdminHome from '../../components/subadminpages/SubAdminHome';
import SubAdminComplaints from '../../components/subadminpages/SubAdminComplaints';
import SubAdminTelemetry from '../../components/subadminpages/SubAdminTelemetry';
import SubAdminAdvisories from '../../components/subadminpages/SubAdminAdvisories';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Muted Tab styles (Text-only segmented buttons matching web platform upgrades)
const getTabBarOptions = () => ({
  tabBarActiveTintColor: theme.colors.accent,
  tabBarInactiveTintColor: theme.colors.textMuted,
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tabBarStyle: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  headerStyle: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontSize: 14,
    fontWeight: 'black',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

function ConsumerTabNavigator() {
  return (
    <Tab.Navigator screenOptions={getTabBarOptions()}>
      <Tab.Screen 
        name="ConsumerHome" 
        component={ConsumerHome} 
        options={{ title: 'Home', tabBarLabel: 'Home', headerTitle: 'AquaTrack Home' }} 
      />
      <Tab.Screen 
        name="FileComplaint" 
        component={FileComplaint} 
        options={{ title: 'Report', tabBarLabel: 'Report', headerTitle: 'File Ticket' }} 
      />
      <Tab.Screen 
        name="TrackComplaints" 
        component={TrackComplaints} 
        options={{ title: 'Tickets', tabBarLabel: 'Tickets', headerTitle: 'Triage History' }} 
      />
      <Tab.Screen 
        name="Announcements" 
        component={Announcements} 
        options={{ title: 'Advisories', tabBarLabel: 'Advisories', headerTitle: 'Bulletins' }} 
      />
      <Tab.Screen 
        name="ContactSupport" 
        component={ContactSupport} 
        options={{ title: 'Support', tabBarLabel: 'Support', headerTitle: 'CSFWD support' }} 
      />
    </Tab.Navigator>
  );
}

function SubAdminTabNavigator() {
  return (
    <Tab.Navigator screenOptions={getTabBarOptions()}>
      <Tab.Screen 
        name="SubAdminHome" 
        component={SubAdminHome} 
        options={{ title: 'My Job', tabBarLabel: 'My Job', headerTitle: 'Technician Command' }} 
      />
      <Tab.Screen 
        name="SubAdminComplaints" 
        component={SubAdminComplaints} 
        options={{ title: 'Triage', tabBarLabel: 'Triage', headerTitle: 'Citizen Complaints' }} 
      />
      <Tab.Screen 
        name="SubAdminTelemetry" 
        component={SubAdminTelemetry} 
        options={{ title: 'Telemetry', tabBarLabel: 'Telemetry', headerTitle: 'Sensor Network' }} 
      />
      <Tab.Screen 
        name="SubAdminAdvisories" 
        component={SubAdminAdvisories} 
        options={{ title: 'Advisories', tabBarLabel: 'Advisories', headerTitle: 'Staff Notices' }} 
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
    </Stack.Navigator>
  );
}
