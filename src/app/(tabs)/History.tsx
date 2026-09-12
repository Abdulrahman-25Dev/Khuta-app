import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { Footprints, ChevronDown } from 'lucide-react-native';

const History = () => {
  // بيانات الرسم البياني للخطوات الأسبوعية
  const barData = [
    { value: 1500, label: 'سبت', frontColor: '#EA6113' },
    { value: 3200, label: 'أحد', frontColor: '#FB8931' },
    { value: 1800, label: 'إثنين', frontColor: '#EA6113' },
    { value: 2200, label: 'ثلاثاء', frontColor: '#EA6113' },
    { value: 1400, label: 'أربعاء', frontColor: '#EA6113' },
    { value: 2800, label: 'خميس', frontColor: '#FB8931' },
    { value: 1000, label: 'جمعة', frontColor: '#EA6113' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F19] py-6">
      <ScrollView className="flex-1 p-4">
        
        {/* 1. كروت الإحصائيات العلوية */}
        <View className="flex-row-reverse justify-between mb-5 gap-2">
          <View className="flex-1 bg-[#1A1A2E] p-3 rounded-2xl items-center border border-[#27293D]">
            <Text className="text-[#8A8F9E] text-xs">اليوم</Text>
            <Text className="text-[#FFE3B3] text-lg font-bold my-1">12.5k</Text>
            <Text className="text-[#8A8F9E] text-[10px]">خطوة</Text>
          </View>

          <View className="flex-1 bg-[#1A1A2E] p-3 rounded-2xl items-center border border-[#27293D]">
            <Text className="text-[#8A8F9E] text-xs">المتوسط</Text>
            <Text className="text-[#FFE3B3] text-lg font-bold my-1">8,300</Text>
            <Text className="text-[#8A8F9E] text-[10px]">خطوة/يوم</Text>
          </View>

          <View className="flex-1 bg-[#1A1A2E] p-3 rounded-2xl items-center border border-[#27293D]">
            <Text className="text-[#8A8F9E] text-xs">المجموع</Text>
            <Text className="text-[#FFE3B3] text-lg font-bold my-1">58.1k</Text>
            <Text className="text-[#8A8F9E] text-[10px]">الأسبوع</Text>
          </View>
        </View>

        {/* 2. كارت الرسم البياني */}
        <View className="bg-[#1A1A2E] p-4 rounded-3xl border border-[#27293D] mb-5">
          <Text className="text-[#FFE3B3] text-base font-bold mb-5 text-right">
            الخطوات الأسبوعية
          </Text>

          <View className="items-center overflow-hidden">
            <BarChart
              data={barData}
              barWidth={18}
              spacing={18}
              initialSpacing={10}
              barBorderRadius={6}
              showGradient={false}
              yAxisTextStyle={{ color: '#8A8F9E', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#FFE3B3', fontSize: 11, fontWeight: '600' }}
              yAxisColor="transparent"
              xAxisColor="#27293D"
              noOfSections={4}
              maxValue={4000}
              height={180}
              rulesType="dashed"
              rulesColor="#27293D"
            />
          </View>
        </View>

        {/* 3. قسم الستريك (الجديد والمطلوب) */}
        <View className="bg-[#1A1A2E] p-5 rounded-3xl border border-[#27293D] mb-10">
          
          <View className="flex-row-reverse justify-between items-center mb-4">
            <Text className="text-[#8A8F9E] text-sm font-bold">سلسلة</Text>
            
            <TouchableOpacity className="flex-row-reverse items-center bg-[#27293D] px-3 py-1.5 rounded-full gap-1">
              <Text className="text-white text-xs font-semibold">الخطوات</Text>
              <ChevronDown color="#8A8F9E" size={14} />
            </TouchableOpacity>
          </View>

          <View className="flex-row-reverse justify-between items-center my-2">
            <View className="items-end">
              <Text className="text-[#8A8F9E] text-xs font-bold mb-1">السلسلة الحالية</Text>
              <View className="flex-row-reverse items-baseline gap-1">
                <Text className="text-white text-4xl font-extrabold">0</Text>
                <Text className="text-white text-xl font-bold">أيام</Text>
              </View>
            </View>

            <View className="w-16 h-16 rounded-full bg-[#27293D] justify-center items-center border border-[#30334e]">
              <Footprints color="#EA6113" size={28} />
            </View>
          </View>

          <Text className="text-[#8A8F9E] text-xs text-center leading-5 px-2">
            لقد حققت هدفك لمدة 0 أيام متتالية. أطول سلسلة قمت بها كانت لمدة 0 أيام.
          </Text>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default History;