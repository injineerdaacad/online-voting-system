import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Image,
} from "react-native";
import styles from "../../assets/styles/create.styles";
import COLORS from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import moment from "moment";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Modal } from "react-native";
import LottieView from "lottie-react-native";

import { FlatList } from "react-native";

export default function VoteScreen() {
  const { token, user } = useAuthStore();
  const { electionId: routeElectionId, openAt } = useLocalSearchParams();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("ongoing");
  const [candidates, setCandidates] = useState([]);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [votingCandidateId, setVotingCandidateId] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const router = useRouter();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [votedElectionId, setVotedElectionId] = useState(null);
  const [selectedByPosition, setSelectedByPosition] = useState({});
  const [currentElectionId, setCurrentElectionId] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const handledOpenTokenRef = useRef(null);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const studentId = user?.id;
      if (!studentId) throw new Error("No student ID found");
      
      const data = await apiService.getEligibleElections(token, studentId);
      if (!Array.isArray(data)) throw new Error("Invalid API format");
      setElections(data);

      const votes = {};
      data.forEach((election) => {
        if (election.hasVoted) {
          votes[election._id] = true;
        }
      });
      setUserVotes(votes);
    } catch (error) {
      console.log("Error fetching elections:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const fetchCandidates = async (electionId) => {
    try {
      const data = await apiService.getCandidatesByElection(token, electionId);
      if (!Array.isArray(data)) {
        throw new Error("Invalid API format: candidates should be an array");
      }
      setCandidates(data);
    } catch (error) {
      console.log("Error fetching candidates:", error.message);
      setCandidates([]);
    }
  };

  const openModal = async (electionId) => {
    const electionObj = elections.find((e) => e._id === electionId);
    await fetchCandidates(electionId);
    setCurrentElectionId(electionId);
    setCandidates((prev) =>
      prev.map((c) => ({
        ...c,
        electionTitle: electionObj?.title || "",
        election_id: electionId,
      }))
    );
    setSelectedByPosition({});
    setIsBottomSheetVisible(true);
  };
  const closeModal = () => {
    setIsBottomSheetVisible(false);
    setCandidates([]);
    setSelectedByPosition({});
    setCurrentElectionId(null);
  };
  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    const openToken = Array.isArray(openAt) ? openAt[0] : openAt;
    const targetElectionId = Array.isArray(routeElectionId)
      ? routeElectionId[0]
      : routeElectionId;

    if (!openToken || !targetElectionId) return;
    if (handledOpenTokenRef.current === openToken) return;
    if (loading || elections.length === 0) return;

    handledOpenTokenRef.current = openToken;

    const targetElection = elections.find(
      (e) => String(e._id) === String(targetElectionId)
    );

    if (!targetElection) {
      setErrorModalMessage("Election not found");
      setErrorModalVisible(true);
      return;
    }

    if (String(targetElection.status || "").toLowerCase() !== "active") {
      setErrorModalMessage(
        "Voting is not active yet. You can only view candidates for this election."
      );
      setErrorModalVisible(true);
      return;
    }

    if (targetElection.hasVoted || userVotes[targetElection._id]) {
      setErrorModalMessage("You already voted in this election.");
      setErrorModalVisible(true);
      return;
    }

    openModal(targetElection._id);
  }, [routeElectionId, openAt, loading, elections, userVotes]);
  const onRefresh = () => {
    setRefreshing(true);
    fetchElections();
  };
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return COLORS.success;
      case "upcoming":
        return COLORS.warning;
      case "closed":
        return COLORS.textSecondary;
      default:
        return COLORS.textSecondary;
    }
  };
  const formatStatus = (status) => {
    if (status.toLowerCase() === "closed") return "Ended";
    if (status.toLowerCase() === "active") return "Live";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  const getCountdownText = (election) => {
    const parseDate = (dateString) => moment.utc(dateString);
    if (election.status === "Active") {
      return `Voting ends in ${parseDate(election.end_time).fromNow(true)}`;
    } else if (election.status === "Upcoming") {
      return `Voting starts in ${parseDate(election.start_time).fromNow(true)}`;
    }
    return "";
  };

  const filteredElections = elections.filter((e) =>
    selectedTab === "ongoing" ? e.status === "Active" : e.status === "Closed"
  );
  const checkVoteStatus = (candidate) => {
    const electionId = candidate.election?._id;

    if (userVotes[electionId]) {
      Alert.alert("Already Voted", "You have already voted in this election.", [
        { text: "OK" },
      ]);
      return;
    }

    Alert.alert(
      "Confirm Your Vote",
      `Are you sure you want to vote for ${
        candidate.student?.full_name || "this candidate"
      }?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Vote",
          onPress: () => handleVote(candidate),
        },
      ]
    );
  };

  const selectCandidate = (candidate) => {
    setSelectedByPosition((prev) => ({
      ...prev,
      [candidate.position]: candidate.candidate_id,
    }));
  };

  const handleVote = async () => {
    const candidate_ids = Object.values(selectedByPosition);
    
    if (candidate_ids.length !== 2) {
      setErrorModalMessage("You must vote for exactly two candidates (one per position).");
      setErrorModalVisible(true);
      return;
    }
    
    const electionId = currentElectionId;
    if (!electionId) {
      setErrorModalMessage("Election ID is missing. Please try again.");
      setErrorModalVisible(true);
      return;
    }

    const uniqueIds = new Set(candidate_ids);
    if (uniqueIds.size !== candidate_ids.length) {
      setErrorModalMessage("You cannot vote for the same candidate twice.");
      setErrorModalVisible(true);
      return;
    }
    
    try {
      setVotingCandidateId("multi");

      const data = await apiService.voteForCandidate(token, candidate_ids, electionId);
      
      if (data && (data.message || data.success !== false)) {
        setVotedElectionId(electionId);
        setShowSuccessModal(true);
        setUserVotes((prev) => ({
          ...prev,
          [electionId]: true,
        }));
        closeModal();
        fetchElections();
      } else {
        throw new Error(data?.message || data?.error || "Failed to cast vote");
      }
    } catch (error) {
      let errorMessage = "Failed to cast vote";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error("❌ Vote API Error:", {
        message: error.message,
        response: error.response?.data,
        candidate_ids: candidate_ids,
        electionId: electionId,
        payload: {
          candidate_ids,
          election_id: electionId,
        },
      });
      
      setErrorModalMessage(errorMessage);
      setErrorModalVisible(true);
      
      if (errorMessage?.toLowerCase().includes("already voted")) {
        setUserVotes((prev) => ({
          ...prev,
          [electionId]: true,
        }));
        fetchElections();
      }
    } finally {
      setVotingCandidateId(null);
    }
  };

  const renderCandidate = ({ item }) => {
    const isSelected = selectedByPosition[item.position] === item.candidate_id;
    const isDisabled = selectedByPosition[item.position] && selectedByPosition[item.position] !== item.candidate_id;
    return (
      <TouchableOpacity
        onPress={() => selectCandidate(item)}
        disabled={isDisabled}
        style={{
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <View
          style={{
            padding: 16,
            marginBottom: 16,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? COLORS.primary : COLORS.border,
            borderRadius: 12,
            backgroundColor: isSelected ? "#e6f0ff" : COLORS.white,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: item.photo_url }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: COLORS.border,
                marginRight: 16,
              }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: COLORS.textPrimary,
                  fontWeight: "bold",
                  fontSize: 16,
                  marginBottom: 4,
                }}
              >
                {item.name || "Unknown Student"}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 14,
                  marginBottom: 6,
                }}
              >
                {(() => {
                  const pos = item.position?.toLowerCase() || "";
                  if (item.position === "2" || pos === "kuxigeen" || pos === "gudoomiye ku xigeen" || pos.includes("kuxigeen") || pos.includes("ku xigeen")) {
                    return "Kuxigeen (Deputy Chairman)";
                  }
                  if (item.position === "1" || pos === "gudoomiye" || (pos.includes("gudoomiye") && !pos.includes("kuxigeen") && !pos.includes("ku xigeen"))) {
                    return "Gudoomiye (Chairman)";
                  }
                  return item.position;
                })()}
              </Text>
              <Text
                style={{
                  color: COLORS.textPrimary,
                  fontSize: 14,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.manifesto}
              </Text>
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                Election: {item.electionTitle || "Unknown Election"}
              </Text>
            </View>
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={28}
              color={isSelected ? COLORS.primary : COLORS.border}
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderElectionCard = (election) => {
    const hasVoted = userVotes[election._id];
    const isActive = election.status === "Active";
    const isEnded = election.status === "Closed";

    return (
      <View key={election._id} style={styles.voteCard}>
        <View style={styles.voteCardHeader}>
          <Ionicons
            name="archive-outline"
            size={24}
            color={COLORS.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.voteCardTitle}>{election.title}</Text>
        </View>
        <Text style={styles.voteCardDescription}>{election.description}</Text>
        <Text style={styles.voteCardType}>Type: {election.type}</Text>
        <Text style={styles.voteCardTime}>
          Start Date:{" "}
          {moment
            .utc(election.start_time)
            .utcOffset(3)
            .format("MMM D, YYYY h:mm A")}
        </Text>
        <Text style={styles.voteCardTime}>
          End:{" "}
          {moment
            .utc(election.end_time)
            .utcOffset(3)
            .format("MMM D, YYYY h:mm A")}
        </Text>
        <View style={styles.voteCardStatusContainer}>
          <Ionicons
            name="ellipse"
            size={12}
            style={{ marginRight: 6 }}
            color={
              isActive
                ? "#27ae60"
                : isEnded
                ? "#e74c3c"
                : COLORS.textSecondary
            }
          />
          <Text style={styles.voteCardStatusText}>
            {formatStatus(election.status)}
          </Text>
        </View>
        <Text style={styles.voteCardCountdown}>
          {getCountdownText(election)}
        </Text>
        {isActive && !hasVoted && (
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              marginTop: 12,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={() => {
              openModal(election._id);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: COLORS.white, fontWeight: "bold" }}>
              Cast Your Vote
            </Text>
          </TouchableOpacity>
        )}
        {hasVoted && isActive && (
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              marginTop: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/electionResults",
                params: { electionId: election._id },
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: COLORS.white, fontWeight: "bold" }}>
              View Live Results
            </Text>
          </TouchableOpacity>
        )}
        {isEnded && (
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              marginTop: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/results",
                params: { electionId: election._id },
              });
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{ color: COLORS.white, fontWeight: "bold", fontSize: 16 }}
            >
              View Result
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { flex: 1 }]}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "ongoing" && styles.tabButtonActive,
            ]}
            onPress={() => setSelectedTab("ongoing")}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === "ongoing" && styles.tabButtonTextActive,
              ]}
            >
              Ongoing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "ended" && styles.tabButtonActive,
            ]}
            onPress={() => setSelectedTab("ended")}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === "ended" && styles.tabButtonTextActive,
              ]}
            >
              Ended
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollViewStyle}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          {filteredElections.length > 0 ? (
            filteredElections.map(renderElectionCard)
          ) : (
            <View style={styles.formGroup}>
              <Text style={styles.emptyText}>No elections found.</Text>
            </View>
          )}
        </ScrollView>
        <Modal
          visible={isBottomSheetVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeModal}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: COLORS.white,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: "90%",
                paddingTop: 16,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 4,
                  backgroundColor: COLORS.border,
                  borderRadius: 2,
                  alignSelf: "center",
                  marginBottom: 16,
                }}
              />
              <Text style={[styles.modalTitle, { padding: 16, paddingBottom: 8 }]}>
                Candidates
              </Text>
              {candidates.length > 0 ? (
                <>
                  <FlatList
                    data={candidates}
                    renderItem={renderCandidate}
                    keyExtractor={(item) => item.candidate_id}
                    contentContainerStyle={{
                      paddingHorizontal: 16,
                      paddingBottom: 16,
                    }}
                    showsVerticalScrollIndicator={true}
                    style={{ maxHeight: "70%" }}
                  />
                  <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                    <Text
                      style={{
                        color: COLORS.textSecondary,
                        fontSize: 12,
                        textAlign: "center",
                        marginBottom: 8,
                      }}
                    >
                      {Object.keys(selectedByPosition).length === 0
                        ? "Select 2 candidates to vote (Gudoomiye and Kuxigeen)"
                        : Object.keys(selectedByPosition).length === 1
                        ? "Select 1 more candidate for the other position"
                        : "Ready to vote"}
                    </Text>
                    {Object.keys(selectedByPosition).length === 2 && (
                      <Text
                        style={{
                          color: COLORS.primary,
                          fontSize: 11,
                          textAlign: "center",
                          marginTop: 4,
                          fontStyle: "italic",
                        }}
                      >
                        You are voting for both positions in this election
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.primary,
                      margin: 16,
                      paddingVertical: 12,
                      borderRadius: 24,
                      alignItems: "center",
                      opacity: Object.keys(selectedByPosition).length !== 2 ? 0.5 : 1,
                    }}
                    onPress={handleVote}
                    disabled={
                      Object.keys(selectedByPosition).length !== 2 ||
                      votingCandidateId === "multi"
                    }
                  >
                    {votingCandidateId === "multi" ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={{ color: COLORS.white, fontWeight: "bold" }}>
                        Cast Now {Object.keys(selectedByPosition).length === 2 ? `(2)` : `(${Object.keys(selectedByPosition).length}/2)`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ alignItems: "center", marginTop: 32, paddingBottom: 32 }}>
                  <Ionicons
                    name="sad-outline"
                    size={48}
                    color={COLORS.textSecondary}
                  />
                  <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>
                    No candidates found.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.closeButton, { margin: 16, marginTop: 8 }]}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
                width: "100%",
                maxWidth: 360,
              }}
            >
              <LottieView
                source={require("../../assets/lottie/thumbs-up.json")}
                autoPlay
                loop={false}
                style={{ width: 150, height: 150, marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: COLORS.textPrimary,
                  marginBottom: 8,
                }}
              >
                Success!
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Your vote has been cast successfully. Thank you for
                participating.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push({
                    pathname: "/(tabs)/electionResults",
                    params: { electionId: votedElectionId },
                  });
                }}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 24,
                }}
              >
                <Text style={{ color: COLORS.white, fontWeight: "bold" }}>
                  View Live Results
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={errorModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setErrorModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
                width: "100%",
                maxWidth: 360,
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
                Voting Error
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
  );
}
