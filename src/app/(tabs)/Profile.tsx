import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Target, 
  Palette, 
  Bell, 
  ChevronLeft, 
  Award, 
  Ruler, 
  Weight, 
  Edit3, 
  Camera
} from 'lucide-react-native';

const Profile = () => {
  return (
    <SafeAreaView className="flex-1 bg-[#0B0F19]">
      <ScrollView className="flex-1 p-4">
        
        {/* 1. قسم الصورة الاسم والمستوى */}
        <View className="items-center my-5">
          <View className="relative">
            <View className="w-24 h-24 rounded-full bg-[#1A1A2E] border-2 border-[#EA6113] justify-center items-center mb-3">
              <User color="#EA6113" size={44} />
            </View>
            <TouchableOpacity className="absolute bottom-3 left-0 bg-[#EA6113] p-1.5 rounded-full border-2 border-[#0B0F19]">
              <Camera color="#FFFFFF" size={14} />
            </TouchableOpacity>
          </View>
          <Text className="text-white text-xl font-bold">عبدالله محمد</Text>
          <View className="flex-row-reverse items-center gap-1 mt-1">
            <Award color="#FB8931" size={14} />
            <Text className="text-[#8A8F9E] text-xs font-semibold">المستوى 5 • عداء شروق</Text>
          </View>
        </View>

        {/* 2. كارت الإحصائيات الشاملة */}
        <View className="flex-row-reverse bg-[#1A1A2E] p-4 rounded-3xl border border-[#27293D] justify-between mb-6">
          <View className="items-center flex-1">
            <Text className="text-[#FFE3B3] text-base font-bold">142.5k</Text>
            <Text className="text-[#8A8F9E] text-[10px] mt-1">إجمالي الخطوات</Text>
          </View>
          <View className="w-[1px] bg-[#27293D] h-full" />
          <View className="items-center flex-1">
            <Text className="text-[#EA6113] text-base font-bold">12 يوم</Text>
            <Text className="text-[#8A8F9E] text-[10px] mt-1">أعلى ستريك</Text>
          </View>
          <View className="w-[1px] bg-[#27293D] h-full" />
          <View className="items-center flex-1">
            <Text className="text-[#FFE3B3] text-base font-bold">3,400</Text>
            <Text className="text-[#8A8F9E] text-[10px] mt-1">سعرة حرارية</Text>
          </View>
        </View>

        {/* 3. قسم البيانات الشخصية والبدنية */}
        <Text className="text-[#8A8F9E] text-xs font-bold text-right mb-2 pr-1">البيانات الشخصية</Text>
        <View className="bg-[#1A1A2E] rounded-3xl border border-[#27293D] overflow-hidden mb-6">
          
          {/* تعديل الاسم */}
          <TouchableOpacity className="flex-row-reverse justify-between items-center p-4 border-b border-[#27293D] active:bg-[#27293D]">
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#27293D] justify-center items-center">
                <User color="#EA6113" size={18} />
              </View>
              <View>
                <Text className="text-white text-sm font-bold text-right">اسم المستخدم</Text>
                <Text className="text-[#8A8F9E] text-xs text-right">عبدالله محمد</Text>
              </View>
            </View>
            <ChevronLeft color="#8A8F9E" size={18} />
          </TouchableOpacity>

          {/* تعديل الوزن */}
          <TouchableOpacity className="flex-row-reverse justify-between items-center p-4 border-b border-[#27293D] active:bg-[#27293D]">
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#27293D] justify-center items-center">
                <Weight color="#FB8931" size={18} />
              </View>
              <View>
                <Text className="text-white text-sm font-bold text-right">الوزن</Text>
                <Text className="text-[#8A8F9E] text-xs text-right">75 كجم</Text>
              </View>
            </View>
            <ChevronLeft color="#8A8F9E" size={18} />
          </TouchableOpacity>

          {/* تعديل الطول */}
          <TouchableOpacity className="flex-row-reverse justify-between items-center p-4 active:bg-[#27293D]">
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#27293D] justify-center items-center">
                <Ruler color="#EA6113" size={18} />
              </View>
              <View>
                <Text className="text-white text-sm font-bold text-right">الطول</Text>
                <Text className="text-[#8A8F9E] text-xs text-right">178 سم</Text>
              </View>
            </View>
            <ChevronLeft color="#8A8F9E" size={18} />
          </TouchableOpacity>

        </View>

        {/* 4. قسم إعدادات التطبيق والأهداف */}
        <Text className="text-[#8A8F9E] text-xs font-bold text-right mb-2 pr-1">تفضيلات النشاط والتطبيق</Text>
        <View className="bg-[#1A1A2E] rounded-3xl border border-[#27293D] overflow-hidden mb-10">
          
          {/* الهدف اليومي */}
          <TouchableOpacity className="flex-row-reverse justify-between items-center p-4 border-b border-[#27293D] active:bg-[#27293D]">
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#27293D] justify-center items-center">
                <Target color="#EA6113" size={18} />
              </View>
              <View>
                <Text className="text-white text-sm font-bold text-right">الهدف اليومي</Text>
                <Text className="text-[#8A8F9E] text-xs text-right">6,000 خطوة/يوم</Text>
              </View>
            </View>
            <ChevronLeft color="#8A8F9E" size={18} />
          </TouchableOpacity>

          {/* مظهر التطبيق */}
          <TouchableOpacity className="flex-row-reverse justify-between items-center p-4 border-b border-[#27293D] active:bg-[#27293D]">
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#27293D] justify-center items-center">
                <Palette color="#FB8931" size={18} />
              </View>
              <View>
                <Text className="text-white text-sm font-bold text-right">مظهر التطبيق</Text>
                <Text className="text-[#8A8F9E] text-xs text-right">ثيم الغروب (Sunset)</Text>
              </View>
            </View>
            <ChevronLeft color="#8A8F9E" size={18} />
          </TouchableOpacity>

          {/* التنبيهات */}
          <TouchableOpacity className="flex-row-reverse justify-between items-center p-4 active:bg-[#27293D]">
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#27293D] justify-center items-center">
                <Bell color="#EA6113" size={18} />
              </View>
              <View>
                <Text className="text-white text-sm font-bold text-right">تنبيهات التذكير</Text>
                <Text className="text-[#8A8F9E] text-xs text-right">مُفعّلة</Text>
              </View>
            </View>
            <ChevronLeft color="#8A8F9E" size={18} />
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;