import VoteSuccess from '../../components/VoteSuccess';
import { useLocalSearchParams } from 'expo-router';

export default function VoteSuccessScreen() {
  const { electionId } = useLocalSearchParams();

  return <VoteSuccess electionId={electionId} />;
}