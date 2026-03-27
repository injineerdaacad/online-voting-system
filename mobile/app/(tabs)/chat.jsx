import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useAuthStore } from "../../store/authStore";
import apiService from "../../services/api";
import styles from "../../assets/styles/chat.styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QUICK_CHIPS_SO = [
  "Doorashooyinka Active",
  "Jadwalka Doorashada",
  "Musharraxiinta (position…)",
  "Natiijooyinka",
  "Sidee loo codeeyaa?",
];
const QUICK_CHIPS_EN = [
  "Active elections",
  "Election schedule",
  "Candidates (by position…)",
  "Results",
  "How do I vote?",
];

const WELCOME_SO = "Waxaan kaaga caawin karaa xogta doorashooyinka, jadwalka, musharraxiinta, iyo natiijooyinka. Weydii waxaad u baahan tahay.";
const WELCOME_EN = "I can help with election info, schedule, candidates, and results. Ask anything you need.";

export default function ChatScreen() {
  const { token, user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("so");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const quickChips = language === "en" ? QUICK_CHIPS_EN : QUICK_CHIPS_SO;
  const welcomeText = language === "en" ? WELCOME_EN : WELCOME_SO;
  const warmingMessage =
    language === "en"
      ? "Server is warming up… try again in a moment."
      : "Server-ku wuu diyaar noqonayaa… isku day daqiiqad ka dib.";
  const errorMessage =
    language === "en"
      ? "Something went wrong. Try again."
      : "Wax khaldameeyay. Isku day mar kale.";

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  };

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || !token) return;
    setInput("");

    const userMsg = { id: Date.now().toString(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    try {
      const data = await apiService.chatWithAssistant(token, {
        message: trimmed,
        language,
        electionId: undefined,
        facultyId: user?.faculty_id || undefined,
      });
      const reply = data?.reply ?? (language === "en" ? "No response." : "Jawaab ma jiro.");
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", text: reply },
      ]);
    } catch (err) {
      const msg = err?.message || "";
      const isWarming = msg.toLowerCase().includes("warming") || msg.includes("503") || msg.includes("502");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: isWarming ? warmingMessage : errorMessage,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, loading]);

  useEffect(() => {
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

  const listBottomPadding = 16;

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
            item.isError && styles.errorBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.messageTextUser : styles.messageTextAssistant,
              item.isError && styles.errorText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight : 0}
    >
      <View style={styles.messagesContainer}>
        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => setLanguage((l) => (l === "so" ? "en" : "so"))}
        >
          <Text style={styles.langToggleText}>
            {language === "so" ? "English" : "Soomaali"}
          </Text>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          ListHeaderComponent={
            messages.length === 0 ? (
              <>
                <View style={styles.welcomeBlock}>
                  <Text style={styles.welcomeTitle}>
                    {language === "so" ? "AI Assistant" : "AI Assistant"}
                  </Text>
                  <Text style={styles.welcomeText}>{welcomeText}</Text>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4, marginBottom: 8 }}>
                  {quickChips.map((label, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.quickChip}
                      onPress={() => sendMessage(label)}
                    >
                      <Text style={styles.quickChipText}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null
          }
          ListFooterComponent={
            loading ? (
              <View style={[styles.messageRow, styles.messageRowAssistant]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#688f68" />
                  <Text style={[styles.messageText, styles.messageTextAssistant, { marginLeft: 8 }]}>
                    {language === "en" ? "Thinking…" : "Fikirka…"}
                  </Text>
                </View>
              </View>
            ) : null
          }
          onContentSizeChange={() => {
            if (messages.length > 0) {
              scrollToBottom(false);
            }
          }}
          contentContainerStyle={[
            styles.messagesContent,
            {
              paddingBottom: listBottomPadding,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.inputRow,
          {
            paddingBottom: Math.max(insets.bottom, 8),
            marginBottom: isKeyboardVisible ? 0 : tabBarHeight,
          },
        ]}
      >
        <TextInput
          style={styles.textInput}
          placeholder={language === "en" ? "Type a message…" : "Qor fariin…"}
          placeholderTextColor="#767676"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!loading}
          scrollEnabled
          textAlignVertical="top"
          returnKeyType="send"
          blurOnSubmit={false}
          onFocus={() => {
            setTimeout(() => {
              scrollToBottom();
            }, 120);
          }}
          onSubmitEditing={() => sendMessage(input)}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
