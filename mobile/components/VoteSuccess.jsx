import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import COLORS from '../constants/colors';

export default function VoteSuccessScreen() {
  const { electionId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
      <LottieView
        source={require('../assets/lottie/thumbs-up.json')}
        autoPlay
        loop={false}
        style={{ width: 150, height: 150, marginBottom: 24 }}
      />
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: COLORS.textPrimary }}>
        Success!
      </Text>
      <Text style={{ fontSize: 16, textAlign: 'center', color: COLORS.textSecondary, marginBottom: 32 }}>
        Your vote has been cast. Thank you for participating in the election.{"\n"}Stay tuned for real-time updates on the election progress.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace({
          pathname: '/(tabs)/electionResults',
          params: { electionId },
        })}
        style={{
          backgroundColor: COLORS.primary,
          paddingVertical: 14,
          paddingHorizontal: 32,
          borderRadius: 30,
        }}
      >
        <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 16 }}>View Live Result</Text>
      </TouchableOpacity>
    </View>
  );
}
