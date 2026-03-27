import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f5e9",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  messagesContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: width * 0.78,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: "#4CAF50",
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "#f1f8f2",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextUser: {
    color: "#fff",
  },
  messageTextAssistant: {
    color: "#1b361b",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f1f8f2",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#c8e6c9",
    alignSelf: "flex-start",
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#688f68",
    marginHorizontal: 2,
  },
  errorBubble: {
    backgroundColor: "#ffebee",
    borderColor: "#ffcdd2",
  },
  errorText: {
    color: "#c62828",
  },
  quickChipsScroll: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f8f2",
    borderWidth: 1,
    borderColor: "#c8e6c9",
    marginRight: 8,
    marginBottom: 6,
  },
  quickChipText: {
    fontSize: 13,
    color: "#2e5a2e",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#f1f8f2",
    borderTopWidth: 1,
    borderTopColor: "#c8e6c9",
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 12,
    fontSize: 15,
    lineHeight: 20,
    color: "#1b361b",
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#c8e6c9",
    opacity: 0.8,
  },
  welcomeBlock: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#f1f8f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e5a2e",
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 14,
    color: "#688f68",
    lineHeight: 20,
  },
  langToggle: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    marginBottom: 8,
  },
  langToggleText: {
    fontSize: 12,
    color: "#2e5a2e",
  },
});
