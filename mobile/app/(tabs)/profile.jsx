import { View, Text, ScrollView, Modal, TouchableOpacity } from "react-native";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/profile.styles";
import ProfileHeader from "../../components/ProfileHeader";
import LogoutButton from "../../components/LogoutButton";
import Loader from "../../components/Loader";
import { useState } from "react";

export default function Profile() {
  const { user, isLoading, isCheckingAuth, logout } = useAuthStore();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  if (isLoading || isCheckingAuth) {
    return <Loader />;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Not logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProfileHeader />

      <ScrollView contentContainerStyle={styles.profileContent}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Full Name:</Text>
          <Text style={styles.value}>{user.full_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Student ID:</Text>
          <Text style={styles.value}>{user.student_id || "-"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Faculty:</Text>
          <Text style={styles.value}>
            {user.faculty?.name || user.faculty_id?.name || user.faculty || "-"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>
            {user.department?.name || user.department || "-"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Joined:</Text>
          <Text style={styles.value}>
            {new Date(user.created_at).toLocaleDateString()}
          </Text>
        </View>

        <LogoutButton onPress={() => setLogoutModalVisible(true)} />
      </ScrollView>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              width: "80%",
              maxWidth: 340,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}
            >
              Confirm Logout
            </Text>
            <Text
              style={{
                color: "#555",
                fontSize: 15,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              Are you sure you want to logout?
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#eee",
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginRight: 8,
                  alignItems: "center",
                }}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={{ color: "#333", fontWeight: "bold" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#e74c3c",
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginLeft: 8,
                  alignItems: "center",
                }}
                onPress={() => {
                  setLogoutModalVisible(false);
                  logout();
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
