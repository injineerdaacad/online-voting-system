import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Keyboard,
} from "react-native";
import styles from "../../assets/styles/login.styles";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Login() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { isLoading, login, isCheckingAuth } = useAuthStore();
  const insets = useSafeAreaInsets();
  const passwordInputRef = useRef(null);

  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const shouldUseKeyboardCompactMode = Platform.OS === "ios" && isKeyboardVisible;

  useEffect(() => {
    if (Platform.OS !== "ios") {
      return;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleStudentIdChange = (text) => {
    const normalized = text.replace(/[^a-zA-Z0-9]/g, "");
    setStudentId(normalized);
  };

  const normalizeStudentIdForDisplay = () => {
    setStudentId((current) => current.toUpperCase());
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const trimmedStudentId = studentId.trim();
    const trimmedPassword = password.trim();

    if (!trimmedStudentId) {
      setErrorModalMessage("Please enter your Student ID");
      setErrorModalVisible(true);
      return;
    }

    if (!trimmedPassword) {
      setErrorModalMessage("Please enter your password");
      setErrorModalVisible(true);
      return;
    }

    if (trimmedPassword.length !== 6) {
      setErrorModalMessage("Password must be exactly 6 characters");
      setErrorModalVisible(true);
      return;
    }

    const normalizedStudentId = trimmedStudentId.toUpperCase();
    
    const result = await login(normalizedStudentId, trimmedPassword);
    
    if (!result.success) {
      let errorMessage = result.error || "Something went wrong!";
      
      if (errorMessage.toLowerCase().includes('not found')) {
        errorMessage = "Student not found. Please check:\n\n• Verify your Student ID is correct\n• Ensure you are registered in the system\n• Contact admin if issue persists";
      } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('password')) {
        errorMessage = "Invalid credentials. Please check:\n\n• Student ID is correct\n• Password is correct (6 characters)\n• Account is not locked";
      } else if (errorMessage.toLowerCase().includes('locked')) {
        errorMessage = "Account locked due to multiple failed login attempts.\n\nPlease contact your administrator to unlock your account.";
      }
      
      setErrorModalMessage(errorMessage);
      setErrorModalVisible(true);
    }
  };

  if (isCheckingAuth) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      enabled={Platform.OS === "ios"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ScrollView
        style={styles.scrollViewStyle}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 16), paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <View style={styles.container}>
          <View
            style={[
              styles.topIllustration,
              shouldUseKeyboardCompactMode && styles.topIllustrationCompact,
            ]}
          >
            <Image
              source={require("../../assets/images/Voting.png")}
              style={[
                styles.illustrationImage,
                shouldUseKeyboardCompactMode && styles.illustrationImageCompact,
              ]}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.card, shouldUseKeyboardCompactMode && styles.cardCompact]}>
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Student ID</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. B3SC..."
                    placeholderTextColor={COLORS.placeholderText}
                    value={studentId}
                    onChangeText={handleStudentIdChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    keyboardType={Platform.OS === "android" ? "visible-password" : "default"}
                    maxLength={20}
                    returnKeyType="next"
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                    blurOnSubmit={false}
                    onBlur={normalizeStudentIdForDisplay}
                    onSubmitEditing={() => {
                      normalizeStudentIdForDisplay();
                      passwordInputRef.current?.focus();
                    }}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder="Enter 6-character password"
                    placeholderTextColor={COLORS.placeholderText}
                    value={password}
                    onChangeText={(text) => setPassword(text.slice(0, 6))}
                    secureTextEntry={!showPassword}
                    maxLength={6}
                    returnKeyType="done"
                    autoComplete="password"
                    textContentType="password"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <Modal
            visible={errorModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setErrorModalVisible(false)}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
                padding: 24,
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 24,
                  alignItems: "center",
                  width: "90%",
                  maxWidth: 340,
                }}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color={COLORS.danger || "#e74c3c"}
                  style={{ marginBottom: 12 }}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: COLORS.textPrimary,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  Login Error
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: COLORS.textSecondary,
                    textAlign: "center",
                    marginBottom: 24,
                  }}
                >
                  {errorModalMessage}
                </Text>
                <TouchableOpacity
                  onPress={() => setErrorModalVisible(false)}
                  style={{
                    backgroundColor: COLORS.primary,
                    paddingVertical: 10,
                    paddingHorizontal: 24,
                    borderRadius: 24,
                  }}
                >
                  <Text style={{ color: COLORS.white, fontWeight: "bold" }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
