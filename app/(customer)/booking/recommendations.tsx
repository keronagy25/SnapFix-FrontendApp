import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  Alert, RefreshControl, Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, Star, MapPin, Heart, CheckCircle,
  Award, Clock, TrendingUp, Briefcase, DollarSign,
  AlertCircle,
} from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import {
  type RecommendedProvider,
  type ServiceRequestWithRecommendations,
  type CreateBookingPayload,
  type Step2ErrorResponse,
  type RecommendedBookingCacheEntry,
  bookRecommendedProvider,
  extractErrorMessage,
  getRecommendedBookingCache,
  clearRecommendedBookingCache,
} from "@/services/bookingService";

const formatAcceptance = (rate: number | null): string | null => {
  if (rate === null) return null;
  return `${Math.round(rate * 100)}% acceptance`;
};

const formatRating = (rating: string): string => {
  const num = parseFloat(rating);
  return num.toFixed(1);
};

function Step2ErrorModal({ 
  visible, 
  errorData, 
  onClose, 
  onRetryWithBroadcast,
}: { 
  visible: boolean; 
  errorData: Step2ErrorResponse | null; 
  onClose: () => void;
  onRetryWithBroadcast: () => void;
  providerName: string;
}) {
  if (!visible || !errorData) return null;
  
  const providerError = extractErrorMessage(errorData, 'provider_id');
  const photosError = extractErrorMessage(errorData, 'photos');
  
  let errorTitle = "Booking Failed";
  let errorMessage = "";
  let showBroadcastOption = false;
  
  if (providerError) {
    errorTitle = "Provider Unavailable";
    errorMessage = providerError;
    showBroadcastOption = true;
  } else if (photosError) {
    errorTitle = "Photo Error";
    errorMessage = photosError;
  } else {
    errorMessage = "Could not complete booking. Please try again.";
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, overflow: "hidden" }}>
          <View style={{ backgroundColor: "#EF4444", paddingVertical: 20, alignItems: "center" }}>
            <AlertCircle size={48} color="#fff" />
          </View>
          <View style={{ padding: 24 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#0F172A", marginBottom: 10, textAlign: "center" }}>
              {errorTitle}
            </Text>
            <View style={{ backgroundColor: "#FEF2F2", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#FECACA", marginBottom: 20 }}>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#991B1B", textAlign: "center", lineHeight: 22 }}>
                {errorMessage}
              </Text>
            </View>
            
            {showBroadcastOption && (
              <TouchableOpacity
                onPress={onRetryWithBroadcast}
                style={{
                  backgroundColor: "#1E3A8A",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>
                  Create Broadcast Request Instead
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: "#F1F5F9",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 15, color: "#64748B" }}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ProviderCard({ 
  provider, 
  onSelect, 
  index,
}: { 
  provider: RecommendedProvider; 
  onSelect: () => void;
  index: number;
}) {
  const displayName = provider.business_name || provider.full_name;
  const acceptanceText = formatAcceptance(provider.acceptance_rate);
  
  const getRankBadge = () => {
    if (index === 0) return { emoji: "🥇", color: "#F59E0B", label: "Best Match" };
    if (index === 1) return { emoji: "🥈", color: "#94A3B8", label: "Great Choice" };
    return { emoji: "🥉", color: "#CD7F32", label: "Good Option" };
  };
  
  const rank = getRankBadge();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onSelect}
      style={{
        backgroundColor: "#fff",
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: index === 0 ? "#FEF3C7" : "#F1F5F9",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: "hidden",
      }}
    >
      <View style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 10,
        backgroundColor: rank.color + "20",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}>
        <Text style={{ fontSize: 12 }}>{rank.emoji}</Text>
        <Text style={{
          fontFamily: Typography.fonts.semibold,
          fontSize: 10,
          color: rank.color,
        }}>
          {rank.label}
        </Text>
      </View>

      {provider.is_favorite && (
        <View style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 10,
          backgroundColor: "#FEE2E2",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}>
          <Heart size={10} color="#EF4444" fill="#EF4444" />
          <Text style={{
            fontFamily: Typography.fonts.semibold,
            fontSize: 9,
            color: "#EF4444",
          }}>
            Favorite
          </Text>
        </View>
      )}

      <View style={{ padding: 16, paddingTop: 50 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: Typography.fonts.bold,
              fontSize: 18,
              color: "#0F172A",
              marginBottom: 2,
            }}>
              {displayName}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#0F172A" }}>
                  {formatRating(provider.average_rating)}
                </Text>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#94A3B8" }}>
                  ({provider.total_reviews} reviews)
                </Text>
              </View>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1" }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Briefcase size={12} color="#64748B" />
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#64748B" }}>
                  {provider.completed_jobs} jobs
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 14,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#F1F5F9",
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MapPin size={14} color="#3B82F6" />
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#1E40AF" }}>
              {provider.distance_km.toFixed(1)} km away
            </Text>
          </View>
          
          {provider.hourly_rate && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <DollarSign size={14} color="#10B981" />
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#065F46" }}>
                {provider.hourly_rate} EGP/hr
              </Text>
            </View>
          )}

          {provider.years_of_experience > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Award size={14} color="#8B5CF6" />
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#6D28D9" }}>
                {provider.years_of_experience} yrs exp
              </Text>
            </View>
          )}

          {acceptanceText && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TrendingUp size={14} color="#F59E0B" />
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#B45309" }}>
                {acceptanceText}
              </Text>
            </View>
          )}
        </View>

        <View style={{
          backgroundColor: "#EFF6FF",
          borderRadius: 14,
          padding: 12,
          marginBottom: 14,
          borderLeftWidth: 3,
          borderLeftColor: "#3B82F6",
        }}>
          <Text style={{
            fontFamily: Typography.fonts.italic,
            fontSize: 12,
            color: "#1E40AF",
            lineHeight: 18,
          }}>
            “{provider.reason}”
          </Text>
        </View>

        <TouchableOpacity
          onPress={onSelect}
          style={{
            backgroundColor: "#1E3A8A",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <CheckCircle size={16} color="#06B6D4" />
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>
            Book {displayName.split(" ")[0]}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>🔍</Text>
      <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#0F172A", marginBottom: 8, textAlign: "center" }}>
        No Providers Available
      </Text>
      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 24, lineHeight: 22 }}>
        We couldn't find any providers matching your request right now. Would you like to create a broadcast request instead?
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          onPress={onBack}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor: "#F1F5F9",
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#64748B" }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRetry}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor: "#1E3A8A",
          }}
        >
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#fff" }}>Create Broadcast</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RecommendationsScreen() {
  const token = useAuthStore((s) => s.token);
  const params = useLocalSearchParams<{ data?: string; formData?: string; cacheId?: string }>();
  
  const [pendingRequest, setPendingRequest] = useState<ServiceRequestWithRecommendations | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step2Error, setStep2Error] = useState<Step2ErrorResponse | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [currentProviderName, setCurrentProviderName] = useState("");
  const [savedFormData, setSavedFormData] = useState<RecommendedBookingCacheEntry | null>(null);

  const parsedData = React.useMemo(() => {
    try {
      const requestData = params.data ? JSON.parse(params.data as string) : null;
      const formData = params.formData ? JSON.parse(params.formData as string) : null;
      return { requestData, formData };
    } catch (err) {
      console.error("Failed to parse params:", err);
      return { requestData: null, formData: null };
    }
  }, [params.data, params.formData]);

  useEffect(() => {
    return () => {
      const cacheId = params.cacheId as string | undefined;
      if (cacheId) {
        clearRecommendedBookingCache(cacheId);
      }
    };
  }, [params.cacheId]);

  useEffect(() => {
    const loadData = async () => {
      const { requestData, formData } = parsedData;
      const cacheId = params.cacheId as string | undefined;
      
      if (requestData && requestData.recommendations) {
        setPendingRequest(requestData);
        setRecommendations(requestData.recommendations);
      }

      if (cacheId) {
        const cached = getRecommendedBookingCache(cacheId);
        if (cached) {
          setSavedFormData(cached);
        } else if (formData) {
          setSavedFormData(formData);
        }
      } else if (formData) {
        setSavedFormData(formData);
      }
      
      if (!requestData?.recommendations?.length) {
        setError("No recommendations found.");
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [parsedData, params.cacheId]);

  const handleSelectProvider = useCallback(async (provider: RecommendedProvider) => {
    if (isSubmitting) {
      console.log('Already submitting, ignoring click');
      return;
    }
    
    if (!savedFormData) {
      Alert.alert("Error", "Missing booking data. Please go back and try again.");
      return;
    }
    
    const currentToken = useAuthStore.getState().token;
    
    if (!currentToken) {
      Alert.alert("Session Expired", "Please log in again.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") }
      ]);
      return;
    }
    
    setIsSubmitting(true);
    setCurrentProviderName(provider.business_name || provider.full_name);
    
    try {
      // Use the CORRECT recommended endpoint
      const booking = await bookRecommendedProvider(
        provider.id,
        savedFormData.payload,
        currentToken,
        savedFormData.photos
      );
      
      console.log('STEP 2: Booking successful:', booking.id);
      const cacheId = params.cacheId as string | undefined;
      if (cacheId) {
        clearRecommendedBookingCache(cacheId);
      }
      router.replace(`/(customer)/booking/${booking.id}`);
      
    } catch (err: any) {
      console.error("Failed to book provider:", err);
      
      const status = err?.status;
      const errorData = err?.data;
      
      if (status === 400 && errorData) {
        setStep2Error(errorData as Step2ErrorResponse);
        setShowErrorModal(true);
        return;
      }
      
      if (status === 403) {
        Alert.alert(
          "Access Denied",
          "This endpoint is for customers only. Please log in as a customer.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
        return;
      }
      
      Alert.alert(
        "Booking Failed",
        errorData?.detail || "Could not complete booking. Please try again.",
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [savedFormData, isSubmitting]);

  const handleRetryWithBroadcast = useCallback(() => {
    setShowErrorModal(false);
    setStep2Error(null);
    const cacheId = params.cacheId as string | undefined;
    if (cacheId) {
      clearRecommendedBookingCache(cacheId);
    }
    
    if (!savedFormData) {
      router.back();
      return;
    }
    
    router.push({
      pathname: "/(customer)/booking/create",
      params: {
        useBroadcast: "true",
        formData: JSON.stringify(savedFormData.payload),
      },
    });
  }, [savedFormData, params.cacheId]);

  const handleCreateBroadcast = useCallback(() => {
    const cacheId = params.cacheId as string | undefined;
    if (cacheId) {
      clearRecommendedBookingCache(cacheId);
    }

    if (!savedFormData) {
      router.back();
      return;
    }
    
    router.push({
      pathname: "/(customer)/booking/create",
      params: {
        useBroadcast: "true",
        formData: JSON.stringify(savedFormData.payload),
      },
    });
  }, [savedFormData, params.cacheId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#94A3B8", marginTop: 12 }}>
          Finding best providers...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <Step2ErrorModal
        visible={showErrorModal}
        errorData={step2Error}
        onClose={() => {
          setShowErrorModal(false);
          setStep2Error(null);
        }}
        onRetryWithBroadcast={handleRetryWithBroadcast}
        providerName={currentProviderName}
      />

      <LinearGradient
        colors={["#1E3A8A", "#1E40AF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: Platform.OS === "android" ? 48 : 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
            backgroundColor: "rgba(255,255,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        
        <View>
          <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 24, color: "#fff" }}>
            Top Matches
          </Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
            {recommendations.length} provider{recommendations.length !== 1 ? "s" : ""} available
          </Text>
        </View>
      </LinearGradient>

      {error && !recommendations.length ? (
        <EmptyState onRetry={handleCreateBroadcast} onBack={() => router.back()} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#1E3A8A"
              colors={["#1E3A8A"]}
            />
          }
        >
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#64748B", marginBottom: 4 }}>
              {pendingRequest?.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <MapPin size={12} color="#94A3B8" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#94A3B8" }}>
                {pendingRequest?.region?.name}
              </Text>
              <Clock size={12} color="#94A3B8" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#94A3B8" }}>
                {pendingRequest?.preferred_date}
              </Text>
            </View>
          </View>

          {recommendations.map((provider, index) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              index={index}
              onSelect={() => handleSelectProvider(provider)}
            />
          ))}

          <TouchableOpacity
            onPress={handleCreateBroadcast}
            disabled={isSubmitting}
            style={{
              marginTop: 8,
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: "#E2E8F0",
              backgroundColor: "#fff",
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 14, color: "#64748B" }}>
              Not satisfied? Create broadcast request instead
            </Text>
          </TouchableOpacity>
          
          {isSubmitting && (
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#1E3A8A" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#94A3B8", marginTop: 8 }}>
                Booking your provider...
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}