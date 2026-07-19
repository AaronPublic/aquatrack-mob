import React from 'react';
import { View, Text, ScrollView } from 'react-native';

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
    <ScrollView className="flex-1 bg-[#f1f5f9]" contentContainerStyle={{ padding: 16 }}>
      <View className="mb-4">
        <Text className="text-lg font-bold text-[#001e66]">Contact Water District</Text>
        <Text className="text-xs text-slate-500 mt-0.5">Get in touch for billing, emergency operations, or service inquiries</Text>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <Text className="text-[11px] font-black text-[#001e66] uppercase tracking-wider mb-3 border-b border-slate-200 pb-1.5">Emergency Channels</Text>
        
        <View className="flex-row mb-3 items-start gap-3">
          <Text className="text-[10px] font-bold text-slate-400 uppercase w-[60px] mt-0.5">Phone</Text>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-[#001e66]">(045) 961-3546</Text>
            <Text className="text-[11px] text-slate-400 mt-0.5">24/7 Operations Hotline</Text>
          </View>
        </View>

        <View className="flex-row mb-3 items-start gap-3">
          <Text className="text-[10px] font-bold text-slate-400 uppercase w-[60px] mt-0.5">Email</Text>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-[#001e66]">support@csfwd.gov.ph</Text>
            <Text className="text-[11px] text-slate-400 mt-0.5">Direct support desk email</Text>
          </View>
        </View>

        <View className="flex-row mb-3 items-start gap-3">
          <Text className="text-[10px] font-bold text-slate-400 uppercase w-[60px] mt-0.5">Web</Text>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-[#001e66]">csfwd.gov.ph</Text>
            <Text className="text-[11px] text-slate-400 mt-0.5">Official Water District portal</Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <Text className="text-[11px] font-black text-[#001e66] uppercase tracking-wider mb-3 border-b border-slate-200 pb-1.5">District Branches</Text>

        {offices.map((office, idx) => (
          <View key={idx} className={`mb-4 pb-4 border-b border-slate-200 ${idx === offices.length - 1 ? 'border-b-0 mb-0 pb-0' : ''}`}>
            <Text className="text-xs font-bold text-[#001e66]">{office.name}</Text>
            <Text className="text-xs text-slate-500 mt-0.5 leading-4">Address: {office.address}</Text>
            <Text className="text-xs text-slate-500 mt-0.5 leading-4">Phone: {office.phone}</Text>
            <Text className="text-xs text-slate-500 mt-0.5 leading-4">Hours: {office.hours}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
