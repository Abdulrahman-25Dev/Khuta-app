import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { storage } from '../../utils/storage';

// Sunset Color Palette
const COLORS = {
  bg: '#0B0F19',
  card: '#1A1A2E',
  border: '#27293D',
  orangeDark: '#EA6113',
  orangeMid: '#F88F22',
  yellowGold: '#FB8931',
  creamLight: '#FFE3B3',
  textSub: '#8A8F9E',
};

export default function Index() {
  const [steps, setSteps] = useState<number>(0);
  const goal = 6000;

  // قراءة البيانات من MMKV عند فتح الصفحة
  useEffect(() => {
    const savedSteps = storage.getNumber('daily_steps') ?? 0;
    setSteps(savedSteps);
  }, []);

  // إضافة خطوات وحفظها فورياً في MMKV
  const addSteps = (amount: number) => {
    const newSteps = steps + amount;
    setSteps(newSteps);
    storage.set('daily_steps', newSteps);
  };

  // إعادة ضبط التعداد
  const resetSteps = () => {
    setSteps(0);
    storage.remove('daily_steps');
  };

  const progress = Math.min((steps / goal) * 100, 100).toFixed(0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>خُطى <Text style={styles.logoDot}>.</Text></Text>
        <Text style={styles.dateText}>اليوم، النشاط الحالي</Text>
      </View>

      {/* Main Counter Card */}
      <View style={styles.mainCard}>
        <Text style={styles.cardTitle}>مجموع الخطوات</Text>
        <Text style={styles.stepsText}>{steps.toLocaleString()}</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill]} />
        </View>
        
        <View style={styles.goalRow}>
          <Text style={styles.goalText}>الهدف: {goal.toLocaleString()} خطوة</Text>
          <Text style={styles.percentText}>{progress}%</Text>
        </View>
      </View>

      {/* Test Controls */}
      <View style={styles.controlsCard}>
        <Text style={styles.controlsTitle}>تفاعل محاكي الحساس (MMKV Test)</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => addSteps(500)}>
          <Text style={styles.primaryBtnText}>+ 500 خطوة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={resetSteps}>
          <Text style={styles.secondaryBtnText}>إعادة ضبط البيانات</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.creamLight,
  },
  logoDot: {
    color: COLORS.orangeDark,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSub,
    marginTop: 4,
  },
  mainCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    color: COLORS.textSub,
    marginBottom: 8,
  },
  stepsText: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.yellowGold,
    marginBottom: 20,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.orangeDark,
    borderRadius: 6,
  },
  goalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  goalText: {
    fontSize: 13,
    color: COLORS.creamLight,
  },
  percentText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.orangeMid,
  },
  controlsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  controlsTitle: {
    fontSize: 14,
    color: COLORS.creamLight,
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: COLORS.orangeDark,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.textSub,
    fontSize: 14,
  },
});