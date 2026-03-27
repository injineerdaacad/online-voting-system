import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import COLORS from "../../constants/colors";
import apiService from "../../services/api";
import Loader from "../../components/Loader";
import moment from "moment";

const getTimeRemaining = (startTime) => {
  const now = moment.utc();
  
  let start;
  if (!startTime) {
    start = moment.utc();
  } else if (typeof startTime === 'string' && startTime.includes('Date')) {
    const match = startTime.match(/(\d{2})-(\d{2})-(\d{4}) time (\d{1,2}):(\d{2}) (AM|PM)/);
    if (match) {
      const [, day, month, year, hour, minute, ampm] = match;
      const hour24 = ampm === 'PM' && parseInt(hour) !== 12 
        ? parseInt(hour) + 12 
        : ampm === 'AM' && parseInt(hour) === 12 
        ? 0 
        : parseInt(hour);
      start = moment.utc(`${year}-${month}-${day} ${hour24}:${minute}`, 'YYYY-MM-DD HH:mm');
    } else {
      start = moment.utc(startTime);
    }
  } else {
    start = moment.utc(startTime);
  }
  
  const diff = start.diff(now);
  const duration = moment.duration(diff > 0 ? diff : 0);

  const total = diff;
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  return { total, hours, minutes, seconds };
};

export default function ElectionScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [elections, setElections] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [currentElection, setCurrentElection] = useState(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidatesError, setCandidatesError] = useState("");
  const [isCandidatesModalVisible, setIsCandidatesModalVisible] = useState(false);

  const fetchElections = async () => {
    setLoading(true);
    try {
      const studentId = user?.id || user?._id;
      
      if (!studentId) {
        setElections([]);
        setLoading(false);
        return;
      }
      
      const data = await apiService.getEligibleElections(token, studentId);
      
      if (!Array.isArray(data)) {
        setElections([]);
        return;
      }
      
      const filteredElections = data.filter((e) => {
        const status = String(e.status || "").trim();
        const statusLower = status.toLowerCase();
        const isVisible = 
          statusLower === "upcoming" || 
          statusLower === "active" ||
          status === "Upcoming" ||
          status === "Active";
        return isVisible;
      });
      
      setElections(filteredElections.length === 0 && data.length > 0 ? data : filteredElections);
    } catch (err) {
      console.log("❌ Failed to fetch eligible elections:", err.message);
      setElections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const studentId = user?.id || user?._id;
    
    if (user && studentId && token) {
      fetchElections();
    } else {
      if (!user || !studentId || !token) {
        setLoading(false);
      }
    }
  }, [user, token]);

  const onRefresh = () => {
    if (!user || !user.id) return;
    setRefreshing(true);
    fetchElections().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns = {};
      elections.forEach((election) => {
        const countdown = getTimeRemaining(election.start_time);
        newCountdowns[election._id] = countdown;
      });
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [elections]);

  const fetchCandidates = async (electionId) => {
    setLoadingCandidates(true);
    setCandidatesError("");

    if (!electionId) {
      setCandidates([]);
      setCandidatesError("Missing election id");
      setLoadingCandidates(false);
      return;
    }

    try {
      const response = await apiService.getCandidatesByElection(token, electionId);
      let candidatesData = response;
      
      if (response && response.data && Array.isArray(response.data)) {
        candidatesData = response.data;
      }
      else if (Array.isArray(response)) {
        candidatesData = response;
      }
      else if (response && Array.isArray(response.candidates)) {
        candidatesData = response.candidates;
      }
      else {
        candidatesData = [];
      }
      
      setCandidates(candidatesData);
    } catch (err) {
      setCandidates([]);
      setCandidatesError(err?.message || "Failed to load candidates");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const resetCandidatesModal = () => {
    setCandidates([]);
    setCurrentElection(null);
    setLoadingCandidates(false);
    setCandidatesError("");
    setIsCandidatesModalVisible(false);
  };

  const openCandidatesModal = (election) => {
    const electionId = election?._id || election?.id || election?.election_id;
    setCurrentElection(election);
    setCandidates([]);
    setCandidatesError("");
    setIsCandidatesModalVisible(true);
    fetchCandidates(electionId);
  };

  const closeCandidatesModal = () => {
    resetCandidatesModal();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader size="large" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome, {user?.full_name || "User"}
          </Text>
          <Text style={styles.subText}>Your Voice Matters!</Text>
        </View>

        {elections.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={styles.noElections}>
              No upcoming elections at the moment.
            </Text>
          </View>
        ) : (
          elections.map((election) => {
            const countdown = countdowns[election._id] || {};
            return (
              <View key={election._id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={COLORS.white}
                  />
                  <Text style={styles.status}>Election Type: </Text>
                  <Text style={styles.title}>{election.type}</Text>
                </View>

                <Text style={styles.title}>{election.title}</Text>
                <Text style={styles.date}>
                  Start Date:{" "}
                  {(() => {
                    try {
                      let date;
                      if (election.start_time && typeof election.start_time === 'string' && election.start_time.includes('Date')) {
                        const match = election.start_time.match(/(\d{2})-(\d{2})-(\d{4}) time (\d{1,2}):(\d{2}) (AM|PM)/);
                        if (match) {
                          const [, day, month, year, hour, minute, ampm] = match;
                          const hour24 = ampm === 'PM' && parseInt(hour) !== 12 
                            ? parseInt(hour) + 12 
                            : ampm === 'AM' && parseInt(hour) === 12 
                            ? 0 
                            : parseInt(hour);
                          date = moment.utc(`${year}-${month}-${day} ${hour24}:${minute}`, 'YYYY-MM-DD HH:mm');
                        } else {
                          date = moment.utc(election.start_time);
                        }
                      } else {
                        date = moment.utc(election.start_time);
                      }
                      return date.utcOffset(3).format("MMM D, YYYY h:mm A");
                    } catch (err) {
                      return election.start_time || "Invalid date";
                    }
                  })()}
                </Text>
                <Text style={styles.date}>
                  End Date:{" "}
                  {(() => {
                    try {
                      let date;
                      if (election.end_time && typeof election.end_time === 'string' && election.end_time.includes('Date')) {
                        const match = election.end_time.match(/(\d{2})-(\d{2})-(\d{4}) time (\d{1,2}):(\d{2}) (AM|PM)/);
                        if (match) {
                          const [, day, month, year, hour, minute, ampm] = match;
                          const hour24 = ampm === 'PM' && parseInt(hour) !== 12 
                            ? parseInt(hour) + 12 
                            : ampm === 'AM' && parseInt(hour) === 12 
                            ? 0 
                            : parseInt(hour);
                          date = moment.utc(`${year}-${month}-${day} ${hour24}:${minute}`, 'YYYY-MM-DD HH:mm');
                        } else {
                          date = moment.utc(election.end_time);
                        }
                      } else {
                        date = moment.utc(election.end_time);
                      }
                      return date.utcOffset(3).format("MMM D, YYYY h:mm A");
                    } catch (err) {
                      return election.end_time || "Invalid date";
                    }
                  })()}
                </Text>
                <Text style={styles.countdown}>
                  Countdown:{" "}
                  {(() => {
                    const h = String(
                      Math.max(0, countdown.hours || 0)
                    ).padStart(2, "0");
                    const m = String(
                      Math.max(0, countdown.minutes || 0)
                    ).padStart(2, "0");
                    const s = String(
                      Math.max(0, countdown.seconds || 0)
                    ).padStart(2, "0");
                    return `${h}:${m}:${s}`;
                  })()}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.white,
                    marginTop: 12,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                  onPress={() => openCandidatesModal(election)}
                >
                  <Text style={{ color: COLORS.primary, fontWeight: "bold" }}>
                    View Candidates
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
      <Modal
        visible={isCandidatesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCandidatesModal}
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
              {currentElection?.title || "Candidates"}
            </Text>
            {loadingCandidates ? (
              <View style={{ alignItems: "center", marginTop: 32, paddingBottom: 32 }}>
                <Loader size="large" />
                <Text style={{ color: COLORS.textSecondary, marginTop: 16 }}>
                  Loading candidates...
                </Text>
              </View>
            ) : candidatesError ? (
              <View style={{ alignItems: "center", marginTop: 32, paddingBottom: 32 }}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color={COLORS.textSecondary}
                />
                <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>
                  {candidatesError}
                </Text>
              </View>
            ) : candidates.length > 0 ? (
              <FlatList
                data={candidates}
                renderItem={({ item }) => (
                  <View
                    style={{
                      padding: 16,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 12,
                      backgroundColor: COLORS.white,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      {item.photo_url ? (
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
                          onError={() => {}}
                        />
                      ) : (
                        <View
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: COLORS.border,
                            marginRight: 16,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons
                            name="person"
                            size={40}
                            color={COLORS.textSecondary}
                          />
                        </View>
                      )}
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
                          {item.position || "Candidate"}
                        </Text>
                        {item.manifesto && (
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
                        )}
                      </View>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.candidate_id || item._id || Math.random().toString()}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 16,
                }}
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: "68%" }}
              />
            ) : (
              <View style={{ alignItems: "center", marginTop: 32, paddingBottom: 32 }}>
                <Ionicons
                  name="sad-outline"
                  size={48}
                  color={COLORS.textSecondary}
                />
                <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>
                  No candidates found for this election.
                </Text>
              </View>
            )}

            {currentElection && (
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                {String(currentElection.status || "").toLowerCase() === "active" ? (
                  currentElection.hasVoted ? (
                    <Text
                      style={{
                        color: COLORS.textSecondary,
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      You have already voted in this election.
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={{
                        backgroundColor: COLORS.primary,
                        paddingVertical: 12,
                        borderRadius: 24,
                        alignItems: "center",
                      }}
                      onPress={() => {
                        const electionId = currentElection?._id || currentElection?.id;
                        closeCandidatesModal();
                        router.push({
                          pathname: "/(tabs)/vote",
                          params: { electionId, openAt: String(Date.now()) },
                        });
                      }}
                    >
                      <Text style={{ color: COLORS.white, fontWeight: "bold" }}>
                        Cast Your Vote
                      </Text>
                    </TouchableOpacity>
                  )
                ) : (
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    Voting is not active yet. You can only view candidates now.
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.closeButton, { margin: 16, marginTop: 8 }]}
              onPress={closeCandidatesModal}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 10,
  },
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  status: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  date: {
    color: COLORS.white,
    fontSize: 13,
    marginBottom: 2,
  },
  countdown: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "right",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  noElections: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: "center",
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});
