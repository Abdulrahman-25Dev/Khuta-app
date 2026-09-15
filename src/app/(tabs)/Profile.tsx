import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { 
  User, 
  Target, 
  Palette, 
  Bell, 
  ChevronLeft, 
  Award, 
  Ruler, 
  Weight, 
  Camera,
  Sun,
  Moon,
  Check
} from 'lucide-react-native';

import { useAppStore, colorPalettes, AccentColor } from '../../../store/useAppStore';
import { EditProfileModal, FieldType } from '../../components/EditProfileModal';

const Profile = () => {
  // جلب البيانات والحالات المباشرة من Zustand
  const { 
    user, 
    updateUser, 
    streakDays, 
    accentColor, 
    setAccentColor, 
    themeMode, 
    toggleTheme 
  } = useAppStore();

  const currentPalette = colorPalettes[accentColor];
  const isDark = themeMode === 'dark';

  // مرجع الـ Bottom Sheet والحقل النشط
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeField, setActiveField] = useState<FieldType>(null);

  // دالة اختيار الصورة
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('الصلاحية مطلوبة', 'يلزم السماح بالوصول للصور لتغيير صورة البروفايل');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      updateUser({ image: result.assets[0].uri });
    }
  };

  // دالة فتح الـ Bottom Sheet وتمرير نوع الحقل
  const openEditModal = (field: FieldType) => {
    setActiveField(field);
    bottomSheetRef.current?.expand();
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'dark bg-appBg-dark' : 'bg-appBg-light'}`}>
      <ScrollView className="flex-1 p-4">
        
        {/* 1. قسم الصورة والاسم والمستوى */}
        <View className="items-center my-5">
          <View className="relative">
            <View 
              style={{ borderColor: currentPalette.primary }} 
              className="w-24 h-24 rounded-full bg-appCard-light dark:bg-appCard-dark border-2 justify-center items-center mb-3 overflow-hidden"
            >
              {user.image ? (
                <Image 
                  source={{ uri: user.image }} 
                  className="w-full h-full" 
                  resizeMode="cover" 
                />
              ) : (
                <User color={currentPalette.primary} size={44} />
              )}
            </View>
            <TouchableOpacity 
              onPress={handlePickImage}
              activeOpacity={0.8}
              style={{ backgroundColor: currentPalette.primary }}
              className="absolute bottom-3 left-0 p-1.5 rounded-full border-2 border-appBg-light dark:border-appBg-dark z-10"
            >
              <Camera color="#FFFFFF" size={14} />
            </TouchableOpacity>
          </View>

          <Text className="text-appText-light dark:text-appText-dark text-xl font-bold">
            {user.name}
          </Text>
          <View className="flex-row-reverse items-center gap-1 mt-1">
            <Award color={currentPalette.secondary} size={14} />
            <Text className="text-appSubText-light dark:text-appSubText-dark text-xs font-semibold">
              المستوى 5 • خطى ذهبية
            </Text>
          </View>
        </View>

        {/* 2. مفتاح الوضع الفاتح / الداكن */}
        <View className="flex-row-reverse items-center justify-between bg-appCard-light dark:bg-appCard-dark p-4 rounded-3xl border border-appBorder-light dark:border-appBorder-dark mb-4">
          <View className="flex-row-reverse items-center gap-3">
            <View className="w-9 h-9 rounded-full bg-appBg-light dark:bg-appBg-dark justify-center items-center">
              {isDark ? (
                <Moon color={currentPalette.primary} size={18} />
              ) : (
                <Sun color={currentPalette.primary} size={18} />
              )}
            </View>
            <View>
              <Text className="text-appText-light dark:text-appText-dark text-sm font-bold text-right">
                الوضع الداكن
              </Text>
              <Text className="text-appSubText-light dark:text-appSubText-dark text-xs text-right">
                {isDark ? 'مُفعّل' : 'مُعطّل'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#CBD5E1', true: currentPalette.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* 3. اختيار ريشة ألوان الهوية */}
        <View className="bg-appCard-light dark:bg-appCard-dark p-4 rounded-3xl border border-appBorder-light dark:border-appBorder-dark mb-6">
          <View className="flex-row-reverse items-center gap-2 mb-3">
            <Palette color={currentPalette.primary} size={18} />
            <Text className="text-appText-light dark:text-appText-dark text-sm font-bold text-right">
              لون الهوية (الريشة)
            </Text>
          </View>
          
          <View className="flex-row justify-around items-center pt-1">
            {(Object.keys(colorPalettes) as AccentColor[]).map((key) => {
              const palette = colorPalettes[key];
              const isSelected = accentColor === key;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setAccentColor(key)}
                  activeOpacity={0.8}
                  style={{ backgroundColor: palette.primary }}
                  className={`w-10 h-10 rounded-full justify-center items-center ${
                    isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-80'
                  }`}
                >
                  {isSelected && <Check color="#FFFFFF" size={16} strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. كارت الإحصائيات الشاملة */}
        <View className="flex-row-reverse bg-appCard-light dark:bg-appCard-dark p-4 rounded-3xl border border-appBorder-light dark:border-appBorder-dark justify-between mb-6">
          <View className="items-center flex-1">
            <Text style={{ color: currentPalette.primary }} className="text-base font-bold">142.5k</Text>
            <Text className="text-appSubText-light dark:text-appSubText-dark text-[10px] mt-1">إجمالي الخطوات</Text>
          </View>
          <View className="w-[1px] bg-appBorder-light dark:bg-appBorder-dark h-full" />
          <View className="items-center flex-1">
            <Text style={{ color: currentPalette.primary }} className="text-base font-bold">{streakDays} يوم</Text>
            <Text className="text-appSubText-light dark:text-appSubText-dark text-[10px] mt-1">أعلى ستريك</Text>
          </View>
          <View className="w-[1px] bg-appBorder-light dark:bg-appBorder-dark h-full" />
          <View className="items-center flex-1">
            <Text style={{ color: currentPalette.primary }} className="text-base font-bold">3,400</Text>
            <Text className="text-appSubText-light dark:text-appSubText-dark text-[10px] mt-1">سعرة حرارية</Text>
          </View>
        </View>

        {/* 5. قسم البيانات الشخصية والبدنية */}
        <Text className="text-appSubText-light dark:text-appSubText-dark text-xs font-bold text-right mb-2 pr-1">
          البيانات الشخصية
        </Text>
        <View className="bg-appCard-light dark:bg-appCard-dark rounded-3xl border border-appBorder-light dark:border-appBorder-dark overflow-hidden mb-6">
          
          {/* تعديل الاسم */}
          <TouchableOpacity 
            onPress={() => openEditModal('name')}
            className="flex-row-reverse justify-between items-center p-4 border-b border-appBorder-light dark:border-appBorder-dark"
          >
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-appBg-light dark:bg-appBg-dark justify-center items-center">
                <User color={currentPalette.primary} size={18} />
              </View>
              <View>
                <Text className="text-appText-light dark:text-appText-dark text-sm font-bold text-right">اسم المستخدم</Text>
                <Text className="text-appSubText-light dark:text-appSubText-dark text-xs text-right">{user.name}</Text>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>

          {/* تعديل الوزن */}
          <TouchableOpacity 
            onPress={() => openEditModal('weight')}
            className="flex-row-reverse justify-between items-center p-4 border-b border-appBorder-light dark:border-appBorder-dark"
          >
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-appBg-light dark:bg-appBg-dark justify-center items-center">
                <Weight color={currentPalette.secondary} size={18} />
              </View>
              <View>
                <Text className="text-appText-light dark:text-appText-dark text-sm font-bold text-right">الوزن</Text>
                <Text className="text-appSubText-light dark:text-appSubText-dark text-xs text-right">{user.weight} كجم</Text>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>

          {/* تعديل الطول */}
          <TouchableOpacity 
            onPress={() => openEditModal('height')}
            className="flex-row-reverse justify-between items-center p-4 border-b border-appBorder-light dark:border-appBorder-dark"
          >
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-appBg-light dark:bg-appBg-dark justify-center items-center">
                <Ruler color={currentPalette.primary} size={18} />
              </View>
              <View>
                <Text className="text-appText-light dark:text-appText-dark text-sm font-bold text-right">الطول</Text>
                <Text className="text-appSubText-light dark:text-appSubText-dark text-xs text-right">{user.height} سم</Text>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>

          {/* تعديل الهدف اليومي */}
          <TouchableOpacity 
            onPress={() => openEditModal('dailyGoal')}
            className="flex-row-reverse justify-between items-center p-4"
          >
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-appBg-light dark:bg-appBg-dark justify-center items-center">
                <Target color={currentPalette.primary} size={18} />
              </View>
              <View>
                <Text className="text-appText-light dark:text-appText-dark text-sm font-bold text-right">الهدف اليومي</Text>
                <Text className="text-appSubText-light dark:text-appSubText-dark text-xs text-right">{user.dailyGoal?.toLocaleString()} خطوة/يوم</Text>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>

        </View>

        {/* 6. قسم التنبيهات وإعدادات أخرى */}
        <Text className="text-appSubText-light dark:text-appSubText-dark text-xs font-bold text-right mb-2 pr-1">
          إعدادات أخرى
        </Text>
        <View className="bg-appCard-light dark:bg-appCard-dark rounded-3xl border border-appBorder-light dark:border-appBorder-dark overflow-hidden mb-10">
          <TouchableOpacity className="flex-row-reverse justify-between items-center p-4">
            <View className="flex-row-reverse items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-appBg-light dark:bg-appBg-dark justify-center items-center">
                <Bell color={currentPalette.primary} size={18} />
              </View>
              <View>
                <Text className="text-appText-light dark:text-appText-dark text-sm font-bold text-right">تنبيهات التذكير</Text>
                <Text className="text-appSubText-light dark:text-appSubText-dark text-xs text-right">مُفعّلة</Text>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* الـ Bottom Sheet الديناميكي للتعديل */}
      <EditProfileModal
        ref={bottomSheetRef}
        activeField={activeField}
        onClose={() => setActiveField(null)}
      />
    </SafeAreaView>
  );
};

export default Profile;