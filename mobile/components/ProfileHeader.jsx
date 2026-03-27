import { View, Text } from 'react-native'
import { useAuthStore } from '../store/authStore'
import { Image } from 'expo-image'
import styles from '../assets/styles/profile.styles'
import { formatMemberSince } from '../lib/utils'

export default function ProfileHeader() {
    const { user } = useAuthStore()

    if (!user) return null

    return (
        <View style={styles.profileHeader}>
            <Image
                source={{ uri: user.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed' }}
                style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
                <Text style={styles.username}>{user.full_name}</Text>
                <Text style={styles.memberSince}>
                    Joined {formatMemberSince(user.created_at || user.createdAt)}
                </Text>
            </View>
        </View>
    )
}
