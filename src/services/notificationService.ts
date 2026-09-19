import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { storage } from '../utils/storage';

// قناة Android عالية الأولوية لجميع تنبيهات الهدف اليومي
export const GOAL_CHANNEL_ID = 'khuta-daily-goal';
// معرّف تذكير المساء: جدولة يومية متكررة تُستبدل بإشعار لمرة واحدة عند إنجاز الهدف
export const EVENING_REMINDER_ID = 'khuta-evening-reminder';
export const EVENING_REMINDER_HOUR = 20;
export const EVENING_REMINDER_MINUTE = 0;
// مفتاح MMKV لتخزين تاريخ آخر يوم أُرسِل فيه إشعار إنجاز الهدف (مرة واحدة يومياً)
export const GOAL_COMPLETE_DATE_KEY = 'khuta_goal_complete_date';

// يعرض التنبيه فوراً (شعار + قائمة + صوت + بادج) حتى عند إغلاق الشاشة
// أو بقاء التطبيق في الخلفية/المقدمة
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 'default' يعمل على iOS فقط؛ على Android يُفسَّر خطأً كملف صوتي مخصص غير موجود.
// على Android تولّد القناة نفسها (sound: 'default') الصوت الافتراضي للنظام.
const DEFAULT_SOUND = Platform.OS === 'ios' ? { sound: 'default' as const } : {};

function makeDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return makeDateKey(new Date(y, m - 1, d + days));
}

// إنشاء القناة عالية الأولوية (Android): صوت + اهتزاز + ظهور على شاشة القفل
export async function createNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(GOAL_CHANNEL_ID, {
    name: 'تنبيهات الهدف اليومي',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    // بدون مفتاح sound: القناة تشغّل تلقائياً صوت التنبيه الافتراضي للنظام،
    // فتمرير 'default' صراحةً يولّد خطأ "Custom sound not found" من المكتبة.
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  if (
    Platform.OS === 'ios' &&
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// تهيئة إشعارات الخُطى: القناة عالية الأولوية ثم طلب صلاحية النظام
export async function initializeNotifications(): Promise<void> {
  await createNotificationChannel();
  await requestNotificationPermissions();
}

// Trigger 1: إشعار فوري عالي الأولوية عند إتمام الهدف اليومي (مرة واحدة في اليوم)
export async function sendDailyGoalCompleteNotification(): Promise<void> {
  if (Platform.OS === 'web') return;

  const todayKey = makeDateKey();
  // ضمان الإرسال مرة واحدة فقط في اليوم عبر MMKV
  if (storage.getString(GOAL_COMPLETE_DATE_KEY) === todayKey) return;
  storage.set(GOAL_COMPLETE_DATE_KEY, todayKey);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'مبروك! 🪙',
      body: 'أكملت هدفك اليومي بنجاح وحصلت على العملات!',
      ...DEFAULT_SOUND,
    },
    trigger: { channelId: GOAL_CHANNEL_ID },
  });
}

// جدولة تذكير المساء المتكرر يومياً عند الساعة 8 مساءً
async function scheduleRecurringEveningReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_REMINDER_ID,
    content: {
      title: 'باقي القليل! 🏃‍♂️',
      body: 'أكمل خطواتك اليومية الآن لتحصل على المكافأة وتحافظ على الستريك!',
      data: { kind: 'evening-reminder' },
      ...DEFAULT_SOUND,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: EVENING_REMINDER_HOUR,
      minute: EVENING_REMINDER_MINUTE,
      channelId: GOAL_CHANNEL_ID,
    },
  });
}

// جدولة تذكير لمرة واحدة في مساء يوم محدد (إزاحة من اليوم الحالي)
async function scheduleOneOffEveningReminder(fromDateKey: string, daysFromToday: number): Promise<void> {
  const targetKey = shiftDateKey(fromDateKey, daysFromToday);
  const triggerDate = new Date(`${targetKey}T${EVENING_REMINDER_HOUR}:00:00`);
  if (triggerDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_REMINDER_ID,
    content: {
      title: 'باقي القليل! 🏃‍♂️',
      body: 'أكمل خطواتك اليومية الآن لتحصل على المكافأة وتحافظ على الستريك!',
      data: { kind: 'evening-reminder' },
      ...DEFAULT_SOUND,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: GOAL_CHANNEL_ID,
    },
  });
}

// Trigger 2 + التحكم: يضبط جدولة تذكير المساء وفق حالة هدف اليوم.
// - إذا لم يكتمل الهدف بعد: تذكير يومي متكرر عند 20:00.
// - إذا اكتمل الهدف اليوم: يُلغى تذكير المساء الحالي ويُؤجل لليوم التالي (إشعار لمرة واحدة)
//   حتى لا يُذكَّر المستخدم في مساء يومٍ أتمّ هدفه أصلاً.
export async function syncEveningReminder(options: {
  goalMetToday: boolean;
  notificationsEnabled: boolean;
  todayKey: string;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelEveningReminder();

  if (!options.notificationsEnabled) return;

  if (options.goalMetToday) {
    await scheduleOneOffEveningReminder(options.todayKey, 1);
  } else {
    await scheduleRecurringEveningReminder();
  }
}

// تُستدعى عند انتقال تقدم اليوم إلى 100%: إشعار فوري + إلغاء تذكير نفس المساء
export async function handleDailyGoalReached(options: {
  notificationsEnabled: boolean;
  todayKey: string;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  await sendDailyGoalCompleteNotification();
  await syncEveningReminder({
    goalMetToday: true,
    notificationsEnabled: options.notificationsEnabled,
    todayKey: options.todayKey,
  });
}

export async function cancelEveningReminder(): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID);
}