import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  Modal, RefreshControl, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useStripe, CardForm } from "@stripe/stripe-react-native";
import {
  ArrowLeft, Calendar, Clock, MapPin,
  FileText, DollarSign, AlertCircle, CheckCircle,
  XCircle, Zap, Info, Star, User, Heart,
  CreditCard, Wallet,
} from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import {
  getBookingById, getHistoryDetail, cancelBooking, rateBooking,
  initiateCardPayment, approveQuote, rejectQuote,
  type ServiceRequest, type BookingStatus, type HistoryDetail,
  type InitiateCardPaymentPayload,
} from "@/services/bookingService";
import { formatEtaFromDistanceKm } from "@/utils/trackingGeo";
import { toggleFavorite } from "@/services/customerService";

const STATUS: Record<BookingStatus, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "#FFFBEB", icon: Clock, desc: "Waiting for a provider to be assigned." },
  assigned: { label: "Assigned", color: "#3B82F6", bg: "#EFF6FF", icon: Info, desc: "A provider has been assigned. Awaiting confirmation." },
  quoted: { label: "Quoted", color: "#8B5CF6", bg: "#F5F3FF", icon: DollarSign, desc: "Provider submitted a quote. Please approve or reject." },
  confirmed: { label: "Confirmed", color: "#8B5CF6", bg: "#F5F3FF", icon: CheckCircle, desc: "Provider confirmed — job is scheduled." },
  in_progress: { label: "In Progress", color: "#06B6D4", bg: "#ECFEFF", icon: Zap, desc: "Your provider is currently working on-site." },
  completed: { label: "Completed", color: "#10B981", bg: "#ECFDF5", icon: CheckCircle, desc: "Job finished successfully." },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2", icon: XCircle, desc: "This booking was cancelled." },
  declined: { label: "Declined", color: "#94A3B8", bg: "#F8FAFC", icon: AlertCircle, desc: "Provider declined. Request returned to pool." },
};

const canCancel: BookingStatus[] = ["pending", "assigned", "quoted", "confirmed", "in_progress"];
const canTrack: BookingStatus[] = ["assigned", "confirmed", "in_progress"];

function getApiError(err: any, fallback = "Something went wrong."): string {
  const tryExtract = (v: any): string => {
    if (!v) return "";
    if (Array.isArray(v) && v.length > 0) return String(v[0]);
    if (typeof v === "string" && v && !v.startsWith("API Error")) return v;
    if (typeof v === "object" && !Array.isArray(v)) {
      if (v.detail) return tryExtract(v.detail);
      if (v.non_field_errors) return tryExtract(v.non_field_errors);
      for (const val of Object.values(v)) {
        const s = tryExtract(val);
        if (s) return s;
      }
    }
    return "";
  };
  return tryExtract(err?.data) || fallback;
}

function FeedbackModal({ ok, title, msg, onClose }: { ok: boolean; title: string; msg: string; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, overflow: "hidden" }}>
          <View style={{ backgroundColor: ok ? "#10B981" : "#EF4444", paddingVertical: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 40 }}>{ok ? "✅" : "⚠️"}</Text>
          </View>
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#0F172A", marginBottom: 10, textAlign: "center" }}>{title}</Text>
            <View style={{ backgroundColor: ok ? "#ECFDF5" : "#FEF2F2", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: ok ? "#A7F3D0" : "#FECACA", marginBottom: 20, width: "100%" }}>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: ok ? "#065F46" : "#991B1B", textAlign: "center", lineHeight: 22 }}>{msg}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: "100%", paddingVertical: 14, borderRadius: 16, backgroundColor: ok ? "#10B981" : "#0F172A", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmModal({ title, msg, onConfirm, onClose }: { title: string; msg: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, overflow: "hidden" }}>
          <View style={{ backgroundColor: "#F59E0B", paddingVertical: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 40 }}>🤔</Text>
          </View>
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#0F172A", marginBottom: 10, textAlign: "center" }}>{title}</Text>
            <View style={{ backgroundColor: "#FFFBEB", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#FDE68A", marginBottom: 20, width: "100%" }}>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#92400E", textAlign: "center", lineHeight: 22 }}>{msg}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#F1F5F9", alignItems: "center" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 15, color: "#64748B" }}>Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirm} style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#EF4444", alignItems: "center" }}>
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function QuoteApprovalModal({ visible, quotedPrice, onApprove, onReject, onClose, processing }: {
  visible: boolean;
  quotedPrice: string;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
  processing: boolean;
}) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 24 }}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <DollarSign size={48} color="#8B5CF6" />
          </View>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 10, textAlign: "center" }}>
            Provider Quote
          </Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#64748B", marginBottom: 16, textAlign: "center" }}>
            The provider has quoted:
          </Text>
          <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 28, color: "#8B5CF6", textAlign: "center", marginBottom: 20 }}>
            {quotedPrice} EGP
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={onReject} disabled={processing} style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#EF4444" }}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onApprove} disabled={processing} style={{ flex: 2, paddingVertical: 14, borderRadius: 16, backgroundColor: "#8B5CF6", alignItems: "center", opacity: processing ? 0.7 : 1 }}>
              {processing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#fff" }}>Approve Quote</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PaymentSetupModal({ visible, cardAmount, onSetupPayment, onClose, processing }: {
  visible: boolean;
  cardAmount: string;
  onSetupPayment: () => void;
  onClose: () => void;
  processing: boolean;
}) {
  const [cardComplete, setCardComplete] = useState(false);
  
  if (!visible) return null;
  
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ 
          backgroundColor: "#fff", 
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24, 
          padding: 24,
          minHeight: "60%",
        }}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <CreditCard size={48} color="#1E3A8A" />
          </View>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 20, color: "#0F172A", marginBottom: 8, textAlign: "center" }}>
            Add Card
          </Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#64748B", marginBottom: 24, textAlign: "center" }}>
            Enter your card details below. You'll be charged {cardAmount} EGP when the provider completes the job.
          </Text>
          
          <View style={{ marginBottom: 24 }}>
            <CardForm
              style={{ height: 200, width: "100%" }}
              onFormComplete={(cardDetails) => {
                const isComplete = cardDetails.complete ?? false;
                setCardComplete(isComplete);
              }}
              cardStyle={{
                backgroundColor: "#FFFFFF",
                textColor: "#000000",
                borderColor: "#E2E8F0",
                borderWidth: 1,
                borderRadius: 12,
                fontSize: 14,
              }}
            />
          </View>
          
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity 
              onPress={onClose} 
              disabled={processing} 
              style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#F1F5F9", alignItems: "center" }}
            >
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 15, color: "#64748B" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onSetupPayment} 
              disabled={processing || !cardComplete} 
              style={{ 
                flex: 2, 
                paddingVertical: 14, 
                borderRadius: 16, 
                backgroundColor: cardComplete && !processing ? "#1E3A8A" : "#CBD5E1", 
                alignItems: "center" 
              }}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>
                  Pay {cardAmount} EGP
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 16 }}>
            Secure payment powered by Stripe
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ icon: Icon, color = "#1E3A8A", label, value, last = false }: {
  icon: any; color?: string; label: string; value: string; last?: boolean;
}) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: "#F1F5F9" }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: color + "15", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Icon size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#0F172A", lineHeight: 20 }}>{value}</Text>
      </View>
    </View>
  );
}

function Timeline({ booking }: { booking: ServiceRequest }) {
  const steps = [
    { key: "created_at", label: "Request Created" },
    { key: "assigned_at", label: "Provider Assigned" },
    { key: "confirmed_at", label: "Job Confirmed" },
    { key: "started_at", label: "Work Started" },
    { key: "completed_at", label: "Job Completed" },
    { key: "cancelled_at", label: "Cancelled" },
    { key: "declined_at", label: "Declined" },
  ] as const;
  
  const filled = steps.filter(step => booking[step.key as keyof ServiceRequest]);
  
  return (
    <View>
      {filled.map((step, i) => (
        <View key={step.key} style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ alignItems: "center", width: 28 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i === filled.length - 1 ? "#1E3A8A" : "#06B6D4", marginTop: 4 }} />
            {i < filled.length - 1 && <View style={{ width: 2, height: 32, backgroundColor: "#E2E8F0" }} />}
          </View>
          <View style={{ flex: 1, paddingBottom: 20 }}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#0F172A" }}>{step.label}</Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
              {new Date(booking[step.key as keyof ServiceRequest] as string).toLocaleString("en-EG")}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const { createPaymentMethod } = useStripe();

  const [booking, setBooking] = useState<ServiceRequest | null>(null);
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; title: string; msg: string } | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [rateLoading, setRateLoading] = useState(false);

  const fetch = async (isRefresh = false) => {
    if (!token || !id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [b, d] = await Promise.all([
        getBookingById(id, token),
        getHistoryDetail(id, token).catch(() => null),
      ]);
      let merged: ServiceRequest = {
        ...b,
        provider: b.provider ?? d?.provider ?? null,
      };
      setBooking(merged);
      if (d) {
        setDetail(d);
        setIsFav(d.is_favorite_provider ?? false);
        if (d.review) setRating(d.review.rating);
      }
    } catch (err: any) {
      setError(getApiError(err, "Failed to load booking."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [id, token]);

  const doCancel = async () => {
    if (!token || !id) return;
    setShowConfirm(false);
    setCancelling(true);
    try {
      const updated = await cancelBooking(id, token, "Cancelled by customer");
      setBooking(updated);
      setFeedback({ ok: true, title: "Booking Cancelled ✓", msg: "Your booking has been successfully cancelled." });
    } catch (err: any) {
      setFeedback({ ok: false, title: "Cannot Cancel", msg: getApiError(err, "Could not cancel.") });
    } finally {
      setCancelling(false);
    }
  };

  const doRate = async () => {
    if (!token || !id || rating === 0) {
      setFeedback({ ok: false, title: "Select a Rating", msg: "Please tap a star to rate this service." });
      return;
    }
    setRateLoading(true);
    try {
      await rateBooking(id, token, rating);
      setFeedback({ ok: true, title: "✓ Rating Submitted!", msg: "Thank you for your feedback!" });
      fetch(true);
    } catch (err: any) {
      setFeedback({ ok: false, title: "Cannot Rate", msg: getApiError(err, "Could not submit rating.") });
    } finally {
      setRateLoading(false);
    }
  };

  const doToggleFav = async () => {
    if (!token || !detail?.provider) return;
    setFavLoading(true);
    try {
      const res = await toggleFavorite(detail.provider.id, token);
      setIsFav(res.is_favorite);
      setFeedback({
        ok: true,
        title: res.is_favorite ? "Added to Favorites ❤️" : "Removed from Favorites",
        msg: res.is_favorite ? "Provider saved to favorites." : "Provider removed from favorites."
      });
    } catch (err: any) {
      setFeedback({ ok: false, title: "Error", msg: getApiError(err, "Could not update favorites.") });
    } finally {
      setFavLoading(false);
    }
  };

  const handleApproveQuote = async () => {
    if (!token || !id || !booking) return;
    setShowQuoteModal(false);
    setPaymentProcessing(true);
    try {
      const updated = await approveQuote(id, token, {
        payment_method: booking.payment_method,
        wallet_amount: booking.wallet_amount,
      });
      setBooking(updated);
      
      if (booking.payment_method === "card" && parseFloat(booking.card_amount || "0") > 0) {
        setShowPaymentModal(true);
      } else {
        setFeedback({ ok: true, title: "Quote Approved!", msg: "Your job has been confirmed." });
        await fetch(true);
      }
    } catch (err: any) {
      const errorMsg = getApiError(err, "Could not approve quote.");
      setFeedback({ ok: false, title: "Approval Failed", msg: errorMsg });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!token || !id) return;
    setShowQuoteModal(false);
    setPaymentProcessing(true);
    try {
      const updated = await rejectQuote(id, token);
      setBooking(updated);
      setFeedback({ ok: true, title: "Quote Rejected", msg: "The provider has been notified. Your request is back in the open pool." });
    } catch (err: any) {
      setFeedback({ ok: false, title: "Error", msg: getApiError(err, "Could not reject quote.") });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSetupCardPayment = async () => {
    if (!token || !id || !booking) return;
    
    setPaymentProcessing(true);
    try {
      const { error: paymentMethodError, paymentMethod } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });
      
      if (paymentMethodError) {
        Alert.alert("Card Error", paymentMethodError.message);
        return;
      }
      
      if (!paymentMethod) {
        Alert.alert("Error", "Failed to create payment method");
        return;
      }
      
      const payload: InitiateCardPaymentPayload = {
        stripe_payment_method_id: paymentMethod.id,
        return_url: "snapfix://payment-return"
      };
      
      const response = await initiateCardPayment(id, token, payload);
      
      if (response.stripe_client_secret) {
        setFeedback({ 
          ok: true, 
          title: "✓ Card Added Successfully!", 
          msg: `Your card is now ready. You'll be charged ${booking.card_amount} EGP when the provider completes the job.` 
        });
        setShowPaymentModal(false);
        await fetch(true);
      }
    } catch (err: any) {
      let errorMessage = "Failed to setup payment";
      if (err?.data?.return_url) {
        errorMessage = `Return URL error: ${err.data.return_url[0]}`;
      } else if (err?.data?.detail) {
        errorMessage = err.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      Alert.alert("Payment Error", errorMessage);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#94A3B8", marginTop: 12 }}>Loading…</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#0F172A", marginBottom: 8 }}>Not Found</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 24 }}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1E3A8A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}>
          <ArrowLeft size={16} color="#fff" />
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#fff" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const s = STATUS[booking.status] ?? STATUS.pending;
  const StatusIcon = s.icon;
  const review = detail?.review ?? booking.review;
  
  const needsQuoteApproval = booking.status === "quoted" && booking.quoted_price;
  const needsCardPayment = booking.payment_method === "card" && 
                           booking.payment_status === "pending" && 
                           (booking.status === "confirmed" || booking.status === "in_progress") &&
                           parseFloat(booking.card_amount || "0") > 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      {feedback && <FeedbackModal ok={feedback.ok} title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}
      {showConfirm && (
        <ConfirmModal
          title="Cancel Booking?"
          msg={`Cancel "${booking.title}"? This cannot be undone.`}
          onConfirm={doCancel}
          onClose={() => setShowConfirm(false)}
        />
      )}
      
      <QuoteApprovalModal
        visible={showQuoteModal}
        quotedPrice={booking.quoted_price || "0"}
        onApprove={handleApproveQuote}
        onReject={handleRejectQuote}
        onClose={() => setShowQuoteModal(false)}
        processing={paymentProcessing}
      />
      
      <PaymentSetupModal
        visible={showPaymentModal}
        cardAmount={booking.card_amount || "0"}
        onSetupPayment={handleSetupCardPayment}
        onClose={() => setShowPaymentModal(false)}
        processing={paymentProcessing}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} tintColor="#1E3A8A" colors={["#1E3A8A"]} />}
      >
        <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 32, paddingHorizontal: 20, overflow: "hidden" }}>
          <View style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(6,182,212,0.08)" }} />
          <TouchableOpacity onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, alignSelf: "flex-start", marginBottom: 14 }}>
            <StatusIcon size={14} color={s.color} />
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#fff" }}>{s.label}</Text>
          </View>
          {booking.is_urgent && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <AlertCircle size={14} color="#FCA5A5" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#FCA5A5" }}>URGENT REQUEST</Text>
            </View>
          )}
          <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 22, color: "#fff", marginBottom: 6, lineHeight: 30 }}>{booking.title}</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            {booking.category?.name} · {booking.region?.name}
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: s.bg, borderRadius: 16, padding: 14, marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <StatusIcon size={16} color={s.color} />
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: s.color, flex: 1 }}>{s.desc}</Text>
          </View>

          {needsQuoteApproval && (
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setShowQuoteModal(true)}
                style={{ backgroundColor: "#8B5CF6", borderRadius: 14, padding: 16, alignItems: "center" }}
              >
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>
                  Review Quote: {booking.quoted_price} EGP
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {needsCardPayment && (
            <View style={{ marginTop: 12, backgroundColor: "#EFF6FF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#BFDBFE" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <CreditCard size={20} color="#1E3A8A" />
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#1E3A8A" }}>
                  Card Payment Required
                </Text>
              </View>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#64748B", marginBottom: 16 }}>
                Please add your card details. You'll be charged {booking.card_amount} EGP when the provider completes the job.
              </Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(true)}
                style={{
                  backgroundColor: "#1E3A8A",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>
                  Add Card & Pay {booking.card_amount} EGP
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {booking.payment_status === "paid" && (
            <View style={{ marginTop: 12, backgroundColor: "#ECFDF5", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#A7F3D0" }}>
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#065F46", textAlign: "center" }}>
                ✓ Payment completed
              </Text>
            </View>
          )}

          {canTrack.includes(booking.status) && booking.provider_distance_km != null && Number(booking.provider_distance_km) > 0 && (
            <View style={{ backgroundColor: "#EFF6FF", borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "#BFDBFE", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#1E40AF", marginBottom: 4 }}>Provider en route</Text>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#64748B" }}>Refreshes with your booking; provider GPS every ~30s.</Text>
              </View>
              <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
                <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 18, color: "#1E3A8A" }}>
                  {Number(booking.provider_distance_km) < 100
                    ? Number(booking.provider_distance_km).toFixed(2)
                    : Number(booking.provider_distance_km).toFixed(1)} km
                </Text>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#3B82F6", marginTop: 2, textAlign: "right" }}>
                  {formatEtaFromDistanceKm(Number(booking.provider_distance_km))}
                </Text>
              </View>
            </View>
          )}

          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginTop: 22, marginBottom: 10 }}>SERVICE DETAILS</Text>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <DetailRow icon={FileText} color="#1E3A8A" label="Description" value={booking.description} />
            <DetailRow icon={MapPin} color="#EF4444" label="Region" value={booking.region?.name} />
            <DetailRow icon={MapPin} color="#EF4444" label="Address" value={booking.address} />
            <DetailRow icon={Calendar} color="#3B82F6" label="Date" value={booking.preferred_date} />
            <DetailRow icon={Clock} color="#3B82F6" label="Time" value={booking.preferred_time?.slice(0, 5)} />
            <DetailRow icon={DollarSign} color="#F59E0B" label="Estimated Price" value={booking.estimated_price ? `${booking.estimated_price} EGP` : ""} />
            {booking.quoted_price && <DetailRow icon={DollarSign} color="#8B5CF6" label="Quoted Price" value={`${booking.quoted_price} EGP`} />}
            <DetailRow icon={DollarSign} color="#10B981" label="Final Price" value={booking.final_price ? `${booking.final_price} EGP` : ""} last />
          </View>

          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginTop: 22, marginBottom: 10 }}>PAYMENT INFO</Text>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <DetailRow 
              icon={booking.payment_method === "cash" ? DollarSign : booking.payment_method === "card" ? CreditCard : Wallet}
              color={booking.payment_method === "cash" ? "#F59E0B" : booking.payment_method === "card" ? "#3B82F6" : "#10B981"}
              label="Payment Method" 
              value={`${booking.payment_method_display} • ${booking.payment_status_display}`} 
            />
            {booking.wallet_amount && parseFloat(booking.wallet_amount) > 0 && (
              <DetailRow icon={Wallet} color="#10B981" label="Wallet Deduction" value={`${booking.wallet_amount} EGP`} />
            )}
            {booking.card_amount && parseFloat(booking.card_amount) > 0 && (
              <DetailRow icon={CreditCard} color="#3B82F6" label="Card Charge" value={`${booking.card_amount} EGP`} />
            )}
          </View>

          {detail?.provider && (
            <>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginTop: 22, marginBottom: 10 }}>PROVIDER</Text>
              <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                    <User size={24} color="#1E3A8A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#0F172A" }}>
                      {detail.provider.first_name} {detail.provider.last_name}
                    </Text>
                    {detail.provider.business_name && (
                      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#64748B", marginTop: 2 }}>{detail.provider.business_name}</Text>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                      <Star size={13} color="#F59E0B" fill="#F59E0B" />
                      <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#0F172A" }}>
                        {detail.provider.rating?.toFixed(1) ?? "—"} ({detail.provider.total_reviews} reviews)
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={doToggleFav} disabled={favLoading} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isFav ? "#FEF2F2" : "#F8FAFC", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: isFav ? "#FECACA" : "#E2E8F0" }}>
                    {favLoading ? <ActivityIndicator size="small" color="#EF4444" /> : <Heart size={18} color={isFav ? "#EF4444" : "#94A3B8"} fill={isFav ? "#EF4444" : "transparent"} />}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {booking.status === "completed" && (
            <>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginTop: 22, marginBottom: 10 }}>
                {review ? "YOUR RATING" : "RATE THIS SERVICE"}
              </Text>
              <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: review ? 12 : 16 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity key={n} onPress={() => !review && setRating(n)} disabled={!!review}>
                      <Star size={36} color="#F59E0B" fill={n <= rating ? "#F59E0B" : "transparent"} />
                    </TouchableOpacity>
                  ))}
                </View>
                {review?.comment && (
                  <View style={{ backgroundColor: "#FFFBEB", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FDE68A", marginBottom: 8 }}>
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#92400E", lineHeight: 20 }}>"{review.comment}"</Text>
                  </View>
                )}
                {!review && (
                  <TouchableOpacity onPress={doRate} disabled={rateLoading || rating === 0} activeOpacity={0.88} style={{ borderRadius: 14, overflow: "hidden", opacity: rateLoading || rating === 0 ? 0.6 : 1 }}>
                    <LinearGradient colors={["#F59E0B", "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                      {rateLoading ? <ActivityIndicator size="small" color="#fff" /> : <><Star size={16} color="#fff" fill="#fff" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#fff" }}>Submit Rating</Text></>}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginTop: 22, marginBottom: 10 }}>TIMELINE</Text>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Timeline booking={booking} />
          </View>

          {canTrack.includes(booking.status) && (
            <View style={{ marginTop: 24 }}>
              <TouchableOpacity onPress={() => router.push(`/(customer)/booking/track?bookingId=${id}`)} activeOpacity={0.85} style={{ borderRadius: 18 }}>
                <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, borderRadius: 18 }}>
                  <MapPin size={18} color="#fff" />
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>Track Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {canCancel.includes(booking.status) && (
            <View style={{ marginTop: canTrack.includes(booking.status) ? 12 : 24 }}>
              <TouchableOpacity onPress={() => setShowConfirm(true)} disabled={cancelling} activeOpacity={0.85} style={{ borderRadius: 18, opacity: cancelling ? 0.7 : 1 }}>
                <View style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA", borderRadius: 18 }}>
                  {cancelling ? <ActivityIndicator size="small" color="#EF4444" /> : <><XCircle size={18} color="#EF4444" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#EF4444" }}>Cancel Booking</Text></>}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}