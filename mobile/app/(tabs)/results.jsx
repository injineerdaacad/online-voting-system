import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import COLORS from "../../constants/colors";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";

export default function ElectionResultTabScreen() {
  const { token } = useAuthStore();
  const { electionId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [election, setElection] = useState(null);
  const [expandedManifestos, setExpandedManifestos] = useState({});

  useEffect(() => {
    const fetchResults = async () => {
      if (!electionId) {
        setLoading(false);
        setElection(null);
        setResults([]);
        return;
      }
      try {
        const data = await apiService.getElectionResults(token, electionId);
        setElection(data.election);
        setResults(
          Array.isArray(data.results)
            ? [...data.results].sort((a, b) => b.vote_count - a.vote_count)
            : []
        );
      } catch (error) {
        setElection(null);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [electionId, token]);

  const groupedByPosition = useMemo(() => {
    const groups = {};
    results.forEach((item) => {
      const position = item.position?.trim() || "Unknown";
      if (!groups[position]) {
        groups[position] = [];
      }
      groups[position].push(item);
    });
    
    Object.keys(groups).forEach((position) => {
      groups[position].sort((a, b) => b.vote_count - a.vote_count);
    });
    
    return groups;
  }, [results]);

  const getWinnerForPosition = (positionResults) => {
    if (positionResults.length === 0) return null;
    const maxVotes = Math.max(...positionResults.map((c) => c.vote_count));
    return maxVotes > 0 ? maxVotes : null;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!electionId) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={{ color: COLORS.danger, marginTop: 8 }}>
          No election selected. Please select an election to view results.
        </Text>
      </View>
    );
  }

  if (!election) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={{ color: COLORS.danger, marginTop: 8 }}>
          Unable to load election result.
        </Text>
      </View>
    );
  }

  const getPositionOrder = (position) => {
    const pos = (position || "").trim().toLowerCase();
    if (pos === "gudoomiye" || pos === "1" || pos.includes("gudoomiye")) return 1;
    if (pos.includes("xigeen") || pos === "2" || pos === "kuxigeen") return 2;
    return 3;
  };

  const positionKeys = Object.keys(groupedByPosition).sort((a, b) => {
    const orderA = getPositionOrder(a);
    const orderB = getPositionOrder(b);
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.trim().toLowerCase().localeCompare(b.trim().toLowerCase());
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 20 }}>
        <Text style={styles.title}>{election.title}</Text>
        <Text style={styles.type}>Type: {election.type}</Text>
        <Text style={styles.status}>Status: {election.status}</Text>
        <Text style={styles.date}>
          Start:{" "}
          {election.start_time}
        </Text>
        <Text style={styles.date}>
          End:{" "}
          {election.end_time}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {positionKeys.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons
              name="sad-outline"
              size={48}
              color={COLORS.textSecondary}
            />
            <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>
              No candidates found.
            </Text>
          </View>
        ) : (
          positionKeys.map((positionKey) => {
            const positionResults = groupedByPosition[positionKey];
            const maxVotesForPosition = getWinnerForPosition(positionResults);
            const displayPosition = positionKey || "Unknown Position";

            return (
              <View key={positionKey} style={styles.positionSection}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionTitle}>{displayPosition}</Text>
                  <Text style={styles.positionCount}>
                    {positionResults.length} Candidate{positionResults.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                {positionResults.map((item) => {
                  const manifesto = item.manifesto || "";
                  const isExpanded = expandedManifestos[item.candidate_id];
                  const shouldShowSeeMore = manifesto.length > 120;
                  const displayText = isExpanded
                    ? manifesto
                    : manifesto.slice(0, 120) + (shouldShowSeeMore ? "..." : "");
                  const isWinner = item.vote_count === maxVotesForPosition && maxVotesForPosition > 0;

                  return (
                    <View key={item.candidate_id} style={styles.candidateCard}>
                      <Image
                        source={{ uri: item.photo_url }}
                        style={styles.candidateImage}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                          <Text style={styles.candidateName}>
                            {item.student?.full_name || "Unknown Student"}
                          </Text>
                          {isWinner && (
                            <View style={styles.winnerBadge}>
                              <Text style={styles.winnerBadgeText}>Winner</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.candidateManifesto}>
                          <Text style={styles.prefix}>Manifesto: </Text>
                          {displayText}
                          {shouldShowSeeMore && (
                            <Text
                              style={{
                                color: COLORS.primary,
                                fontWeight: "bold",
                                fontSize: 12,
                              }}
                              onPress={() =>
                                setExpandedManifestos((prev) => ({
                                  ...prev,
                                  [item.candidate_id]: !isExpanded,
                                }))
                              }
                            >
                              {isExpanded ? " See less" : " See more"}
                            </Text>
                          )}
                        </Text>
                        <Text style={styles.candidateVotes}>
                          Votes: {item.vote_count}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  type: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  status: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  candidateCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  candidateImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: COLORS.border,
  },
  candidateName: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  candidatePosition: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 2,
    fontWeight: "bold",
  },
  candidateManifesto: {
    color: COLORS.textPrimary,
    fontSize: 13,
    marginBottom: 4,
  },
  candidateVotes: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: "bold",
  },
  prefix: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "bold",
  },
  winnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eafaf1",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  winnerBadgeText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  positionSection: {
    marginBottom: 24,
  },
  positionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  positionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  positionCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
