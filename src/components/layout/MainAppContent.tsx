import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  MutableRefObject,
} from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  PlusCircle,
  BarChart3,
  LogOut,
  ChevronDown,
  Settings as SettingsIcon,
  Edit3,
  Camera,
  Sparkles,
  AlertCircle,
  X,
  Bell,
  FileText,
  Shield,
  RefreshCw,
  Users,
  FileBox,
  Calendar,
  Trophy,
  Landmark,
  Film,
  Menu,
  PackageOpen,
  HelpCircle,
  GraduationCap,
  Package,
  FolderOpen,
  ChevronRight,
  Compass,
  ChevronLeft,
  Twitter,
  Instagram,
  Github,
  Lock,
  Clock,
} from "lucide-react";
import { MomentPrismLogo } from "../MomentPrismLogo";
import { CapsuleViewer } from "../CapsuleViewer";
import { Auth } from "../Auth";
import { Dashboard } from "../Dashboard";
import { MemoryFeed } from "../MemoryFeed";
import { UnifiedHome } from "../UnifiedHome";
import { CreateCapsule } from "../CreateCapsule";
import { CapsuleDetailModal } from "../CapsuleDetailModal";
import { MobileRecorder } from "../MobileRecorder";
import { RecordInterface } from "../RecordInterface";
import { LegacyVault } from "../LegacyVault";
import { MediaEnhancementOverlay } from "../MediaEnhancementOverlay";
import { ErrorBoundary } from "../ErrorBoundary";
import { ErasOdyssey } from "../onboarding/ErasOdyssey";
import { OnboardingOrchestrator } from "../onboarding/OnboardingOrchestrator";
import { Settings } from "../Settings";
import { CalendarView } from "../CalendarView";
import { NotificationPreferences } from "../NotificationPreferences";
import { LegacyAccessBeneficiaries } from "../LegacyAccessBeneficiaries";
import { TermsOfService } from "../TermsOfService";
import { PrivacyPolicy } from "../PrivacyPolicy";
import { CleanupHiddenCapsules } from "../CleanupHiddenCapsules";
import { ResetPassword } from "../ResetPassword";
import { VerifyEmail } from "../VerifyEmail";
import { BeneficiaryVerification } from "../BeneficiaryVerification";
import { BeneficiaryVaultAccess } from "../BeneficiaryVaultAccess";
import RequestVerification from "../../pages/RequestVerification";
import { AppLoader } from "../AppLoader";
import { LoadingAnimation } from "../LoadingAnimation";
import { AchievementsDashboard } from "../AchievementsDashboard";
import { AchievementUnlockManager } from "../AchievementUnlockManager";
import { TitleDisplay } from "../TitleDisplay";
import { TitleCarouselModal } from "../TitleCarouselModal";
import { HeaderBackground } from "../HeaderBackground";
import { WelcomeCelebrationManager } from "../WelcomeCelebrationManager";
import { ForgottenMemories } from "../ForgottenMemories";
import { ConnectionHealthIndicator } from "../ConnectionHealthIndicator";
import { EchoNotificationToast } from "../EchoNotificationToast";
import { EchoNotificationCenter } from "../EchoNotificationCenter";
import { NotificationCenter } from "../NotificationCenter";
import { WelcomeNotification } from "../WelcomeNotification";
import { TheatricalStage } from "../icons/TheatricalStage";
import {
  RefinedSparkles,
  RefinedVideoCamera,
} from "../icons/RefinedLuminescence";
import { Avatar } from "../Avatar";
import { ProfilePictureUploadModal } from "../ProfilePictureUploadModal";
import { HelpSupportModal } from "../HelpSupportModal";
import { MetaTags } from "../MetaTags";
import { MediaPreviewModal } from "../MediaPreviewModal";
import { motion, AnimatePresence } from "motion/react";

// Custom Hooks
import { useAuth } from "../../contexts/AuthContext";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useActivityTracking } from "../../hooks/useActivityTracking";
import { useWorkflow } from "../../hooks/useWorkflow";
import { useTabNavigation } from "../../hooks/useTabNavigation";
import { useConnectionHealth } from "../../hooks/useConnectionHealth";
import { useEchoNotifications } from "../../hooks/useEchoNotifications";
import { useNotifications } from "../../hooks/useNotifications";
import { useProfile } from "../../hooks/useProfile";
import { useTitles } from "../../contexts/TitlesContext";
import type { EchoNotification } from "../../hooks/useEchoNotifications";

// Supabase
import { supabase } from "../../utils/supabase/client";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { toast, Toaster } from "sonner";

interface MainAppContentProps {
  onAuthenticationSuccess: (
    userData: any,
    accessToken: string,
    options?: { isFreshLogin?: boolean },
  ) => void;
  pendingAuthData: {
    userData: any;
    accessToken: string;
  } | null;
  gateAuthData: {
    userData: any;
    accessToken: string;
    isFreshLogin: boolean;
  } | null;
  onAuthDataProcessed: () => void;
  isTransitioning: boolean;
  triggerSlideAnimation: boolean;
  triggerSlideAnimationRef: React.MutableRefObject<boolean>;
}

export const MainAppContent = React.memo(
  function MainAppContent({
    onAuthenticationSuccess,
    pendingAuthData,
    gateAuthData,
    onAuthDataProcessed,
    isTransitioning,
    triggerSlideAnimation,
    triggerSlideAnimationRef,
  }: MainAppContentProps) {
    // Diagnostic: Detect unexpected remounts and log all relevant state
    const mountIdRef = useRef(Math.random().toString(36).substring(7));
    const lastLoggedTab = useRef<string | null>(null);

    // Track authentication state to prevent issues
    const isAuthenticatedRef = useRef(false);
    const isProcessingAuthRef = useRef(false);

    // Custom Hooks (MUST be declared BEFORE useEffects that depend on them)
    const auth = useAuth();
    const network = useNetworkStatus();
    const {
      activeTab,
      lastActiveTab,
      handleTabChange: originalHandleTabChange,
      setActiveTab,
    } = useTabNavigation();
    const workflow = useWorkflow();
    const { titleProfile, availableTitles } = useTitles();
    const { profile, refetchProfile } = useProfile();

    // Force re-render key for title display - increments when titleProfile changes
    const titleRenderKey = useMemo(() => {
      // Create a unique key based on equipped title to trigger animations
      return `${titleProfile?.equipped_achievement_id || "none"}-${Date.now()}`;
    }, [titleProfile?.equipped_achievement_id]);

    // Check if this is an OAuth callback (for auth screen logic)
    const isOAuthCallback = useMemo(() => {
      try {
        const hash = window.location.hash;
        const hasOAuthHash =
          hash && hash.includes("access_token") && !hash.includes("type=");

        // CRITICAL: Also check for OAuth expectation flag set when user clicked "Sign in with Google"
        // This ensures Auth component renders even if Supabase has already processed the hash
        const oauthExpected =
          sessionStorage.getItem("eras-oauth-expects-gate") === "true";

        const result = hasOAuthHash || oauthExpected;

        if (result) {
          console.log("🚪 [OAUTH DETECTION] OAuth callback detected!", {
            hasOAuthHash,
            oauthExpected,
            hash: hash || "(no hash)",
          });
        }

        return result;
      } catch {
        return false;
      }
    }, []);

    // Safety: Clear OAuth expectation flag after 10 seconds if it hasn't been cleared
    // This prevents the Auth screen from showing forever if something goes wrong
    useEffect(() => {
      if (
        isOAuthCallback &&
        sessionStorage.getItem("eras-oauth-expects-gate") === "true"
      ) {
        const timeout = setTimeout(() => {
          console.warn(
            "⚠️ [OAUTH TIMEOUT] Clearing stale OAuth expectation flag after 10s",
          );
          sessionStorage.removeItem("eras-oauth-expects-gate");
          sessionStorage.removeItem("eras-oauth-flow");
          sessionStorage.removeItem("eras-oauth-timestamp");
          sessionStorage.removeItem("eras-oauth-callback-ready");
        }, 10000);

        return () => clearTimeout(timeout);
      }
    }, [isOAuthCallback]);

    // Local State (MUST be declared before useEffects that depend on them)
    const [editingCapsule, setEditingCapsule] = useState<any>(null);
    const [viewingCapsule, setViewingCapsule] = useState<any>(null); // NEW: For viewing received capsules in Portal overlay
    const [quickAddDate, setQuickAddDate] = useState<Date | null>(null); // NEW: Pre-filled date for Quick Add from Calendar
    const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
    const [createCapsuleKey, setCreateCapsuleKey] = useState(0); // Force reset CreateCapsule
    const [showQuickRecorder, setShowQuickRecorder] = useState(false);

    // Echo Notification System - NEW: Using unified Notification Center only
    const [showNotificationCenter, setShowNotificationCenter] = useState(false);
    const [activeToasts, setActiveToasts] = useState<EchoNotification[]>([]);
    const [viewingCapsuleFromNotification, setViewingCapsuleFromNotification] =
      useState<{
        capsuleId: string;
        notificationType?: "received" | "delivered" | "echo";
      } | null>(null);

    // 📚 Onboarding Orchestrator state
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingModule, setOnboardingModule] = useState<
      string | undefined
    >(undefined);

    // 👑 Listen for Title Modal Close Event to trigger First Capsule onboarding
    useEffect(() => {
      const handleTitleModalClosed = (event: CustomEvent) => {
        const { title } = event.detail;

        console.log("👑 [Title Modal Event] Received titleModalClosed event", {
          title,
        });

        // Only trigger for Time Novice title
        if (title === "Time Novice") {
          console.log("👑 [Title Modal Event] Time Novice modal closed");

          // Check if First Capsule onboarding has been completed
          const firstCapsuleCompleted = localStorage.getItem(
            "eras_onboarding_first_capsule_completed",
          );

          if (firstCapsuleCompleted) {
            console.log(
              "👑 [Title Modal Event] First Capsule already completed, skipping trigger",
            );
            return;
          }

          console.log(
            "👑 [Title Modal Event] Triggering First Capsule onboarding in 1 second...",
          );

          setTimeout(() => {
            console.log(
              "📚 [Onboarding Trigger] Showing First Capsule onboarding",
            );
            setShowOnboarding(true);
            setOnboardingModule("first_capsule");
          }, 1000); // 1 second delay
        }
      };

      window.addEventListener(
        "titleModalClosed",
        handleTitleModalClosed as EventListener,
      );

      return () => {
        window.removeEventListener(
          "titleModalClosed",
          handleTitleModalClosed as EventListener,
        );
      };
    }, []);

    // 🔥 Store removeMedia function from CreateCapsule
    const removeMediaByVaultIdRef = useRef<((vaultId: string) => void) | null>(
      null,
    );

    // Profile Picture Upload
    const [showProfilePictureUpload, setShowProfilePictureUpload] =
      useState(false);
    const {
      notifications,
      unreadCount,
      markAsRead,
      markAsSeen,
      markAllAsRead,
      dismissNotification,
      clearAll,
    } = useEchoNotifications(
      auth.user?.id || null,
      auth.session?.access_token || null,
    );

    // New Unified Notification System
    const {
      notifications: unifiedNotifications,
      unreadCount: unifiedUnreadCount,
      addNotification,
      markAsRead: markUnifiedAsRead,
      markAllAsRead: markAllUnifiedAsRead,
    } = useNotifications();

    // Migrate existing echo notifications to unified system (one-time migration on mount)
    // Track which notification IDs have been migrated to prevent duplicates
    const migratedNotificationIds = useRef(new Set<string>());
    useEffect(() => {
      if (!auth.user?.id) return;

      // Only migrate unread/unseen notifications that haven't been migrated yet
      const unseenEchoNotifications = notifications.filter(
        (n) =>
          (!n.seen || !n.read) && !migratedNotificationIds.current.has(n.id),
      );

      if (unseenEchoNotifications.length > 0) {
        console.log(
          `🔄 [Migration] Migrating ${unseenEchoNotifications.length} echo notifications to unified system`,
        );

        unseenEchoNotifications.forEach((oldNotif) => {
          const echoType = oldNotif.echoType;
          const senderName = oldNotif.senderName || "Someone";
          const capsuleTitle = oldNotif.capsuleTitle || "your capsule";
          const echoContent = oldNotif.echoContent;
          const capsuleId = oldNotif.capsuleId;

          let title = "";
          let content = "";
          let metadata: any = {};

          if (echoType === "emoji") {
            title = `${senderName} reacted to your capsule`;
            content = `${senderName} reacted to your capsule`;
            metadata = {
              emoji: echoContent,
              senderName,
              capsuleName: capsuleTitle,
              capsuleId,
              echoId: oldNotif.echoId || oldNotif.id,
            };
          } else {
            title = `${senderName} commented on your capsule`;
            content = `${senderName} commented on \"${capsuleTitle}\"`;
            metadata = {
              senderName,
              capsuleName: capsuleTitle,
              capsuleId,
              echoText: echoContent,
              echoId: oldNotif.echoId || oldNotif.id,
            };
          }

          // Preserve original timestamp from echo notification
          const originalTimestamp = oldNotif.createdAt || oldNotif.timestamp;
          const timestampMs =
            typeof originalTimestamp === "string"
              ? new Date(originalTimestamp).getTime()
              : originalTimestamp;

          // Add to unified notification center with original timestamp
          const notifId = addNotification({
            type: "echo",
            title,
            content,
            metadata,
            timestamp: timestampMs, // Preserve original timestamp
          });

          // Track that we've migrated this notification
          if (notifId) {
            migratedNotificationIds.current.add(oldNotif.id);
            console.log(`✅ [Migration] Migrated notification ${oldNotif.id}`);
          } else {
            // If addNotification returned null (duplicate), still mark as migrated
            migratedNotificationIds.current.add(oldNotif.id);
            console.log(
              `⏭️ [Migration] Skipped duplicate notification ${oldNotif.id}`,
            );
          }
        });
      }
    }, [auth.user?.id, notifications, addNotification]);

    // Enhanced mark all as read - marks both unified and old system notifications
    const handleMarkAllAsRead = useCallback(() => {
      // Mark unified notifications as read
      markAllUnifiedAsRead();

      // Also mark old echo notifications as read to keep systems in sync
      if (notifications.length > 0) {
        notifications.forEach((notif) => {
          if (!notif.read) {
            markAsRead(notif.id);
          }
        });
        console.log(
          "✅ [Mark All] Marked all notifications as read (unified + old system)",
        );
      }
    }, [markAllUnifiedAsRead, notifications, markAsRead]);

    // Audio notification ref
    const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

    // Listen for echo notifications from server broadcasts
    useEffect(() => {
      if (!auth.user?.id || !auth.session?.access_token) return;

      const userId = auth.user.id;
      console.log(
        `🔔 [Echo Notifications] Setting up broadcast listener for user: ${userId}`,
      );

      const channel = supabase.channel(`echo_notifications:${userId}`);

      channel.on("broadcast", { event: "new_echo" }, async (payload: any) => {
        console.log("🔔 [Echo Notifications] Received broadcast:", payload);
        const notification = payload.payload;

        if (!notification) {
          console.warn(
            "🔔 [Echo Notifications] Invalid payload - missing notification data",
          );
          return;
        }

        // Convert old echo notification format to new unified format
        const senderName = notification.senderName || "Someone";
        const capsuleTitle = notification.capsuleTitle || "your capsule";
        const echoType = notification.echoType;
        const echoContent = notification.echoContent;
        const capsuleId = notification.capsuleId;

        let title = "";
        let content = "";
        let metadata: any = {};

        if (echoType === "emoji") {
          title = `${senderName} reacted to your capsule`;
          content = `${senderName} reacted to your capsule`;
          metadata = {
            emoji: echoContent,
            senderName,
            capsuleName: capsuleTitle,
            capsuleId,
            echoId: notification.echoId || notification.id,
          };
        } else {
          title = `${senderName} commented on your capsule`;
          content = `${senderName} commented on "${capsuleTitle}"`;
          metadata = {
            senderName,
            capsuleName: capsuleTitle,
            capsuleId,
            echoText: echoContent,
            echoId: notification.echoId || notification.id,
          };
        }

        // Preserve original timestamp from broadcast notification
        const originalTimestamp =
          notification.createdAt || notification.timestamp;
        const timestampMs =
          typeof originalTimestamp === "string"
            ? new Date(originalTimestamp).getTime()
            : originalTimestamp;

        console.log("🔔 [Echo Notifications] Adding notification:", {
          title,
          content,
          metadata,
          timestamp: new Date(timestampMs).toISOString(),
        });

        // Check user's notification preferences before adding notification
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        const notifPrefs = currentUser?.user_metadata?.notificationPreferences;

        // Check if echo notifications are enabled (default: true)
        const echoNotificationsEnabled =
          notifPrefs?.echoNotifications !== false;
        const echoSoundEnabled = notifPrefs?.echoSound !== false;
        const echoHapticEnabled = notifPrefs?.echoHaptic !== false;

        if (!echoNotificationsEnabled) {
          console.log(
            "🔇 Echo notifications disabled by user preference, skipping notification",
          );
          return;
        }

        // Play notification sound only if enabled
        if (echoSoundEnabled && notificationSoundRef.current) {
          notificationSoundRef.current.play().catch((err) => {
            console.log("Could not play notification sound:", err);
          });
        }

        // Trigger haptic feedback only if enabled
        // Note: triggerHapticFeedback is defined below
        if (echoHapticEnabled && "vibrate" in navigator) {
          navigator.vibrate([30, 50, 30]);
        }
      });

      channel.subscribe((status) => {
        console.log(`🔔 [Echo Notifications] Channel status: ${status}`);
      });

      return () => {
        console.log(`🔔 [Echo Notifications] Cleaning up broadcast listener`);
        supabase.removeChannel(channel);
      };
    }, [auth.user?.id, auth.session?.access_token, addNotification]);

    useEffect(() => {
      // Use sessionStorage to track last mount timestamp across remounts
      let lastMountTime = 0;
      try {
        const stored = sessionStorage.getItem("eras-last-mount-time");
        if (stored) {
          lastMountTime = parseInt(stored);
        }
      } catch (e) {
        // Ignore storage errors
      }

      const now = Date.now();
      const currentId = mountIdRef.current;
      const timeSinceLastMount = lastMountTime > 0 ? now - lastMountTime : 0;

      // Also track mount ID to distinguish between remounts and re-renders
      let lastMountId = "";
      try {
        lastMountId = sessionStorage.getItem("eras-last-mount-id") || "";
      } catch (e) {
        // Ignore
      }

      // CRITICAL: Detect unexpected remounts (remount within 5 seconds is suspicious)
      // Only flag if this is a DIFFERENT component instance (different ID)
      const isRemount =
        timeSinceLastMount > 0 &&
        timeSinceLastMount < 5000 &&
        timeSinceLastMount > 100 &&
        lastMountId !== currentId;

      if (isRemount) {
        // HMR remount detected - silently restore scroll position
        // No need to log this expected development behavior

        // CRITICAL: Restore scroll position after HMR remount
        // Wait for next frame to ensure DOM is ready
        requestAnimationFrame(() => {
          try {
            const savedScrollPosition = sessionStorage.getItem(
              "eras-scroll-position",
            );
            const savedScrollTab = sessionStorage.getItem("eras-scroll-tab");

            if (savedScrollPosition && savedScrollTab === activeTab) {
              const scrollY = parseInt(savedScrollPosition);
              // Silently restore scroll position
              window.scrollTo(0, scrollY);

              // Double-check after a short delay (sometimes DOM needs more time)
              setTimeout(() => {
                if (window.scrollY !== scrollY) {
                  window.scrollTo(0, scrollY);
                }
              }, 100);
            }
          } catch (error) {
            console.warn("Failed to restore scroll position:", error);
          }
        });
      }

      // Store current mount timestamp and ID for next mount detection
      try {
        sessionStorage.setItem("eras-last-mount-time", now.toString());
        sessionStorage.setItem("eras-last-mount-id", currentId);
      } catch (e) {
        // Ignore storage errors
      }

      // Save scroll position continuously during this component's lifetime
      const saveScrollPosition = () => {
        try {
          sessionStorage.setItem(
            "eras-scroll-position",
            window.scrollY.toString(),
          );
          sessionStorage.setItem("eras-scroll-tab", activeTab);
        } catch (e) {
          // Ignore storage errors
        }
      };

      // Save scroll position on scroll events (debounced)
      let scrollTimeout: number;
      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(saveScrollPosition, 150);
      };

      window.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        console.log(`🎬 MainAppContent unmounting (ID: ${mountIdRef.current})`);
        clearTimeout(scrollTimeout);
        window.removeEventListener("scroll", handleScroll);
        saveScrollPosition(); // Save one last time before unmount
      };
    }, [activeTab]); // Include activeTab so we track the correct tab

    // Monitor isTransitioning to catch rapid changes that could cause issues
    useEffect(() => {
      if (isTransitioning) {
        console.log(
          "🔄 Component is transitioning (hidden with opacity, not unmounted)",
        );
      } else {
        console.log("✅ Component transition complete (visible)");
      }
    }, [isTransitioning]);

    // State variables
    const [unexpectedReset, setUnexpectedReset] = useState<string | null>(null);
    const [recorderFullscreen, setRecorderFullscreen] = useState(false);
    const [hasUnsavedWork, setHasUnsavedWork] = useState(false);
    const [showSessionWarning, setShowSessionWarning] = useState(false);
    const [sessionWarningCallback, setSessionWarningCallback] = useState<
      (() => void) | null
    >(null);
    const [showEnhancementOverlay, setShowEnhancementOverlay] = useState(false);
    const [enhancementMedia, setEnhancementMedia] = useState<any>(null);
    const [pendingRecordMedia, setPendingRecordMedia] = useState<any>(null); // Store media while in enhancement from Record tab
    const [vaultRefreshKey, setVaultRefreshKey] = useState(0);
    const [recordResetKey, setRecordResetKey] = useState(0); // Force RecordInterface remount for clean state
    const [settingsSection, setSettingsSection] = useState<
      | "profile"
      | "titles"
      | "password"
      | "security"
      | "storage"
      | "notifications"
      | "account"
      | undefined
    >(undefined);
    const [showTitleCarousel, setShowTitleCarousel] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false); // For Archive modal in gear menu
    const [showHelpModal, setShowHelpModal] = useState(false); // For Help & Support modal
    const [previewMedia, setPreviewMedia] = useState<any>(null); // For media preview from received capsules

    // Track when user is actively working on Create tab to prevent unexpected resets
    const userActiveOnCreateRef = useRef(false);
    const createTabOpenedAt = useRef<number | null>(null);

    // Track tab before navigating to vault (for back navigation)
    const tabBeforeVault = useRef<string | null>(null);

    // CRITICAL: Preserve scroll position across potential remounts
    // Save scroll position to sessionStorage periodically
    useEffect(() => {
      const saveScrollPosition = () => {
        try {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          if (scrollY > 0) {
            sessionStorage.setItem("eras-scroll-position", scrollY.toString());
            sessionStorage.setItem("eras-scroll-tab", activeTab);
          }
        } catch (e) {
          // Ignore storage errors
        }
      };

      // Save on scroll (throttled)
      let scrollTimeout: NodeJS.Timeout;
      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(saveScrollPosition, 200);
      };

      window.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      // Also save when tab changes
      saveScrollPosition();

      return () => {
        window.removeEventListener("scroll", handleScroll);
        clearTimeout(scrollTimeout);
      };
    }, [activeTab]);

    // CRITICAL: Restore scroll position on mount
    useEffect(() => {
      try {
        const savedPosition = sessionStorage.getItem("eras-scroll-position");
        const savedTab = sessionStorage.getItem("eras-scroll-tab");

        if (savedPosition && savedTab === activeTab) {
          const scrollY = parseInt(savedPosition);
          if (scrollY > 0) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
              window.scrollTo(0, scrollY);
              console.log("📜 Restored scroll position:", scrollY);
            });
          }
        }
      } catch (e) {
        // Ignore storage errors
      }
    }, []); // Only run once on mount

    // Process pending auth data after animation completes
    // CRITICAL: Store stable references to prevent dependency issues
    const handleAuthenticatedRef = useRef(auth.handleAuthenticated);
    const setActiveTabRef = useRef(setActiveTab);
    const onAuthDataProcessedRef = useRef(onAuthDataProcessed);

    // Update refs when callbacks change
    useEffect(() => {
      handleAuthenticatedRef.current = auth.handleAuthenticated;
      setActiveTabRef.current = setActiveTab;
      onAuthDataProcessedRef.current = onAuthDataProcessed;
    }, [auth.handleAuthenticated, setActiveTab, onAuthDataProcessed]);

    const pendingAuthProcessedRef = useRef(false);
    useEffect(() => {
      const isAuthenticated = auth.isAuthenticated;

      if (
        pendingAuthData &&
        !isAuthenticated &&
        !pendingAuthProcessedRef.current
      ) {
        pendingAuthProcessedRef.current = true;
        console.log(
          "🎬 [AUTH EFFECT] Animation completed, processing authentication data",
        );

        handleAuthenticatedRef.current(
          pendingAuthData.userData,
          pendingAuthData.accessToken,
        );

        // Mark as authenticated
        isAuthenticatedRef.current = true;
        isProcessingAuthRef.current = false;

        onAuthDataProcessedRef.current();

        // ALWAYS navigate to dashboard/home after successful sign-in
        setActiveTabRef.current("home");

        // 📚 Check if user needs onboarding (after Eras Gate has completed)
        const fetchOnboarding = async (err: any) => {
          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/onboarding/state`,
              {
                headers: {
                  Authorization: `Bearer ${publicAnonKey}`,
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  userId: pendingAuthData.userData.id,
                }),
              },
            );

            if (response.ok) {
              const data = await response.json();
              const completionState = data.completionState || {};

              // Check if core onboarding is needed
              if (!completionState.first_capsule) {
                setShowOnboarding(true);
                setOnboardingModule(undefined); // undefined = auto-select first needed module
              }
            }
          } catch (error) {
            console.error(
              "❌ [ONBOARDING] Failed to check onboarding state:",
              error,
            );
          }
        };

        // Delay onboarding check slightly to ensure smooth transition after Eras Gate
        setTimeout(checkOnboarding, 500);
      }

      // Update authenticated state when auth.isAuthenticated changes
      if (isAuthenticated) {
        isAuthenticatedRef.current = true;
        isProcessingAuthRef.current = false;
      } else {
        isAuthenticatedRef.current = false;
        isProcessingAuthRef.current = false;
      }

      // Reset ref when pendingAuthData is cleared
      if (!pendingAuthData) {
        pendingAuthProcessedRef.current = false;
      }
    }, [pendingAuthData, auth.isAuthenticated]);

    // Enhanced tab navigation with guard for unsaved work
    const handleTabChange = useCallback(
      (tab: string, force: boolean = false) => {
        // Prevent clicking the same tab (except for special cases)
        if (tab === activeTab && !force) return;

        console.log(`🧭 [TAB] Requesting tab change: ${activeTab} → ${tab}`);

        // Handle Vault special case - store current tab for back navigation
        if (tab === "vault") {
          tabBeforeVault.current = activeTab;
        }

        // Handle Settings sub-sections
        if (tab.startsWith("settings-")) {
          const section = tab.replace("settings-", "") as any;
          setSettingsSection(section);
          originalHandleTabChange("settings");
          return;
        } else if (tab === "settings") {
          setSettingsSection(undefined);
        }

        // GUARD: Warn about unsaved work when leaving Create or Record tab
        if (
          hasUnsavedWork &&
          (activeTab === "create" || activeTab === "record") &&
          !force
        ) {
          console.warn("⚠️ [TAB] Guard triggered: Unsaved work detected");
          const confirmed = window.confirm(
            "You have unsaved changes. Are you sure you want to leave?",
          );
          if (!confirmed) return;
          setHasUnsavedWork(false); // Reset after confirmation
        }

        // Special handling for Create tab
        if (tab === "create") {
          console.log("📝 [TAB] Entering Create tab");
          userActiveOnCreateRef.current = true;
          createTabOpenedAt.current = Date.now();
        } else if (activeTab === "create") {
          console.log("🚪 [TAB] Leaving Create tab");
          userActiveOnCreateRef.current = false;
        }

        // Special handling for Record tab
        if (tab === "record") {
          console.log("🎥 [TAB] Entering Record tab");
          setRecordResetKey((prev: number) => prev + 1); // Clean slate for recorder
        }

        // Perform the navigation
        originalHandleTabChange(tab);

        // Auto-scroll to top when switching tabs
        if (tab !== activeTab) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
      [activeTab, hasUnsavedWork, originalHandleTabChange],
    );

    // Event Handlers
    const handleCapsuleCreated = useCallback(() => {
      console.log("✨ Capsule created successfully!");
      setDashboardRefreshKey((prev: number) => prev + 1);
      setEditingCapsule(null);
      setHasUnsavedWork(false);
      handleTabChange("home");
      toast.success("Memory sealed successfully!");
    }, [handleTabChange]);

    const handleEditCapsule = useCallback(
      (capsule: any) => {
        console.log("✏️ Editing capsule:", capsule);
        setEditingCapsule(capsule);
        handleTabChange("create");
      },
      [handleTabChange],
    );

    const handleEditCapsuleDetails = useCallback(
      (capsule: any) => {
        console.log("✏️ Editing capsule details:", capsule);
        setEditingCapsule(capsule);
        handleTabChange("create");
      },
      [handleTabChange],
    );

    const handleOpenVault = useCallback(() => {
      handleTabChange("vault");
    }, [handleTabChange]);

    const handleRecordMediaCaptured = useCallback(
      (media: any) => {
        console.log("🎥 [RECORD] Media captured:", media);
        if (Array.isArray(media)) {
          workflow.addMedia(media);
        } else {
          workflow.addMedia([media]);
        }
        handleTabChange("create");
      },
      [workflow, handleTabChange],
    );

    const handleRecordOpenVault = useCallback(() => {
      handleTabChange("vault");
    }, [handleTabChange]);

    const handleRecordEnhance = useCallback((media: any) => {
      console.log("🎥 [RECORD] Enhancing media:", media);
      setPendingRecordMedia(media);
      setEnhancementMedia(media);
      setShowEnhancementOverlay(true);
    }, []);

    const handleRecordClose = useCallback(
      (destination: string = "create") => {
        console.log(`🎥 [RECORD] Closing recorder, going to ${destination}`);
        handleTabChange(destination);
      },
      [handleTabChange],
    );

    const recordRestoreMediaRef = useRef<(() => void) | null>(null);

    const handleVaultUseMedia = useCallback(
      (media: any) => {
        console.log("🏛️ [VAULT] Using media from vault:", media);
        if (Array.isArray(media)) {
          workflow.addMedia(media);
        } else {
          workflow.addMedia([media]);
        }
        // Navigate back to where we came from, or Create by default
        const target = tabBeforeVault.current || "create";
        handleTabChange(target);
      },
      [workflow, handleTabChange],
    );

    const handleVaultEdit = useCallback((media: any) => {
      console.log("🏛️ [VAULT] Editing media from vault:", media);
      setEnhancementMedia(media);
      setShowEnhancementOverlay(true);
    }, []);

    const handleVaultClose = useCallback(() => {
      const target = tabBeforeVault.current || "home";
      handleTabChange(target);
    }, [handleTabChange]);

    const handleVaultNavigateToSettings = useCallback(() => {
      handleTabChange("settings-storage");
    }, [handleTabChange]);

    const handleRemoveFromCapsule = useCallback(
      (vaultId: string) => {
        workflow.removeMediaByVaultId?.(vaultId);
      },
      [workflow],
    );

    const handleEnhanceFromCapsule = useCallback((media: any) => {
      setEnhancementMedia(media);
      setShowEnhancementOverlay(true);
    }, []);

    const handleEnhancementSave = useCallback(
      async (enhancedBlob: Blob, metadata: any) => {
        console.log("✨ [ENHANCE] Media saved with metadata:", metadata);
        setShowEnhancementOverlay(false);
        setEnhancementMedia(null);
        setPendingRecordMedia(null);
        toast.success("Enhancements saved!");
      },
      [],
    );

    const handleEnhancementReplaceSave = useCallback(
      async (originalMediaId: string, enhancedBlob: Blob, metadata: any) => {
        console.log("✨ [ENHANCE] Media replaced:", originalMediaId);
        setShowEnhancementOverlay(false);
        setEnhancementMedia(null);
        setPendingRecordMedia(null);
        toast.success("Media updated!");
      },
      [],
    );

    const handleEnhancementUseInCapsule = useCallback(
      (media: any) => {
        console.log("✨ [ENHANCE] Using media in capsule:", media);
        if (Array.isArray(media)) {
          workflow.addMedia(media);
        } else {
          workflow.addMedia([media]);
        }
        setShowEnhancementOverlay(false);
        setEnhancementMedia(null);
        setPendingRecordMedia(null);
        handleTabChange("create");
      },
      [workflow, handleTabChange],
    );

    const handleEnhancementDiscard = useCallback(() => {
      setShowEnhancementOverlay(false);
      setEnhancementMedia(null);
      setPendingRecordMedia(null);
    }, []);

    const handleMediaRemoved = useCallback((mediaId: string) => {
      console.log("🗑️ Media removed from capsule:", mediaId);
    }, []);

    const handleVaultMediaIdsLoaded = useCallback(
      (ids: string[]) => {
        workflow.setImportedVaultMediaIds(ids);
      },
      [workflow],
    );

    const handleRegisterRemoveMedia = useCallback(
      (removeFn: (vaultId: string) => void) => {
        removeMediaByVaultIdRef.current = removeFn;
      },
      [],
    );

    const handleOnboardingComplete = useCallback(() => {
      setShowOnboarding(false);
      setOnboardingModule(undefined);
    }, []);

    // Session recovery and cleanup
    useEffect(() => {
      // Cleanup stale OAuth flags on mount
      const oauthTimestamp = sessionStorage.getItem("eras-oauth-timestamp");
      if (oauthTimestamp) {
        const age = Date.now() - parseInt(oauthTimestamp);
        if (age > 300000) {
          // 5 minutes
          sessionStorage.removeItem("eras-oauth-expects-gate");
          sessionStorage.removeItem("eras-oauth-flow");
          sessionStorage.removeItem("eras-oauth-timestamp");
        }
      }
    }, []);

    const handleRecordCloseCallback = useCallback(
      (destination: string) => {
        console.log(
          `🔙 Closing RecordInterface - navigating to ${destination} (came from: ${lastActiveTab})`,
        );
        handleTabChange(destination);
      },
      [lastActiveTab, handleTabChange],
    );

    // Loading State
    if (auth.isCheckingAuth) {
      return (
        <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="text-center px-4 max-w-md w-full">
            <MomentPrismLogo size={120} showSubtitle={true} />
            <div className="mt-8 space-y-3">
              <div className="text-lg text-muted-foreground font-medium animate-pulse">
                Loading Eras...
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-shimmer w-1/3"
                  style={{
                    animation: "shimmer 2s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
            {network.networkError && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium">Connection Issue</p>
                </div>
                <p className="mb-3 whitespace-pre-wrap">
                  {network.networkError}
                </p>
                {network.networkError.includes("server") && (
                  <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                    <p className="font-medium mb-1">Common Solutions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Check your internet connection</li>
                      <li>Verify Supabase Edge Function is deployed</li>
                      <li>Ensure environment variables are configured</li>
                      <li>Try refreshing the page</li>
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={network.clearNetworkError}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Continue Anyway
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 📚 Onboarding Orchestrator - Show if user needs onboarding (after Eras Gate)
    if (showOnboarding && auth.user?.id) {
      console.log("📚 [ONBOARDING] Rendering OnboardingOrchestrator");

      const handleOnboardingCompleteInternal = async () => {
        console.log("📚 [ONBOARDING] Onboarding completed");

        // Check completion status and award achievements accordingly
        try {
          const completionData = localStorage.getItem(
            "eras_onboarding_completion",
          );
          const exitData = localStorage.getItem("eras_onboarding_exit");

          if (completionData) {
            const { firstCapsuleCompleted, vaultMasteryCompleted } =
              JSON.parse(completionData);
            console.log("📚 [ONBOARDING] Completion status:", {
              firstCapsuleCompleted,
              vaultMasteryCompleted,
            });

            const achievementsToAward = [];

            if (firstCapsuleCompleted) {
              achievementsToAward.push("A001"); // First Step → Time Novice
              achievementsToAward.push("time_keeper"); // Time Keeper → Chrono Apprentice

              if (vaultMasteryCompleted) {
                achievementsToAward.push("vault_guardian"); // Vault Guardian → Legacy Architect
              }
            }

            if (achievementsToAward.length > 0) {
              console.log(
                "🏆 [ONBOARDING] Awarding achievements:",
                achievementsToAward,
              );

              for (const achievementId of achievementsToAward) {
                try {
                  // Award achievement based on ID
                  const actionMap: Record<string, string> = {
                    A001: "signup", // First Step is awarded on signup
                    time_keeper: "onboarding_first_capsule_complete",
                    vault_guardian: "onboarding_vault_mastery_complete",
                  };

                  const action =
                    actionMap[achievementId] || "onboarding_module_complete";

                  await fetch(
                    `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/track`,
                    {
                      headers: {
                        Authorization: `Bearer ${auth.session?.access_token}`,
                        "Content-Type": "application/json",
                      },
                      method: "POST",
                      body: JSON.stringify({
                        action,
                        metadata: {},
                      }),
                    },
                  );
                } catch (err) {
                  console.error(
                    "❌ Failed to award achievement:",
                    achievementId,
                    err,
                  );
                }
              }
            }

            localStorage.removeItem("eras_onboarding_completion");
          } else if (exitData) {
            const { moduleId } = JSON.parse(exitData);
            console.log("📚 [ONBOARDING] User exited module early:", moduleId);

            if (moduleId === "first_capsule") {
              console.log(
                "🏆 [ONBOARDING] Awarding partial achievements (First Step only)",
              );

              try {
                await fetch(
                  `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/track`,
                  {
                    headers: {
                      Authorization: `Bearer ${auth.session?.access_token}`,
                      "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                      action: "signup", // First Step is awarded via signup action
                      metadata: {},
                    }),
                  },
                );
              } catch (err) {
                console.error(
                  "❌ Failed to award First Step achievement:",
                  err,
                );
              }
            }

            localStorage.removeItem("eras_onboarding_exit");
          }
        } catch (err) {
          console.error(
            "❌ [ONBOARDING] Failed to process achievement awards:",
            err,
          );
        }

        setShowOnboarding(false);
        setOnboardingModule(undefined);
      };

      return (
        <OnboardingOrchestrator
          userId={auth.user.id}
          forceModule={onboardingModule}
          onComplete={handleOnboardingCompleteInternal}
          onDismiss={handleOnboardingCompleteInternal}
        />
      );
    }

    // Authentication Screen
    // IMPORTANT: Keep Auth visible if we're in the middle of authentication process
    // CRITICAL: Don't show Auth if pendingAuthData or gateAuthData exists (user is already being authenticated)
    // CRITICAL: ALWAYS show Auth during OAuth callback to ensure it processes the tokens
    const shouldShowAuth =
      (!auth.isAuthenticated && !pendingAuthData && !gateAuthData) ||
      auth.isLoggingOut ||
      isOAuthCallback;

    console.log("🔐 [AUTH CHECK] Auth screen decision:", {
      isAuthenticated: auth.isAuthenticated,
      isLoggingOut: auth.isLoggingOut,
      hasPendingAuthData: !!pendingAuthData,
      hasGateAuthData: !!gateAuthData,
      isOAuthCallback: isOAuthCallback,
      isAuthenticatedRef: isAuthenticatedRef.current,
      isProcessingAuthRef: isProcessingAuthRef.current,
      shouldShowAuth: shouldShowAuth,
    });

    // Main Application UI
    // CRITICAL: Hide content during transition instead of unmounting to prevent remount cycles
    return (
      <>
        <MetaTags />
        <div
          className={`min-h-screen flex flex-col transition-colors duration-500 ${
            activeTab === "home"
              ? "bg-gradient-to-br from-purple-50/60 via-blue-50/50 to-pink-50/60 dark:from-purple-950/30 dark:via-blue-950/25 dark:to-pink-950/30"
              : "bg-gradient-to-br from-slate-50 to-slate-100"
          }`}
          style={{
            opacity: isTransitioning ? 0 : 1,
            pointerEvents: isTransitioning ? "none" : "auto",
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          {/* Header Background - Customizable gradient based on equipped title with transition animations */}
          {activeTab !== "record" && (
            <AnimatePresence mode="wait">
              {titleProfile?.equipped_title && (
                <HeaderBackground
                  key={titleProfile.equipped_title}
                  titleName={titleProfile.equipped_title}
                  titleRarity={titleProfile.equipped_rarity || "common"}
                />
              )}
            </AnimatePresence>
          )}

          {/* Network Status Banner */}
          {(!network.isOnline || network.networkError) && (
            <div className="bg-orange-600 text-white px-4 py-2.5 text-center text-sm border-b border-orange-700 shadow-sm">
              <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
                <div className="flex-shrink-0">
                  {!network.isOnline ? (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>
                <span className="flex-1 text-left sm:text-center">
                  {network.networkError ||
                    "No internet connection. Some features may not work."}
                </span>
                <div className="flex gap-2">
                  {network.networkError && (
                    <button
                      onClick={network.clearNetworkError}
                      className="px-3 py-1 bg-orange-700 hover:bg-orange-800 rounded text-xs font-medium transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                  {!navigator.onLine && (
                    <button
                      onClick={() => window.location.reload()}
                      className="px-3 py-1 bg-orange-700 hover:bg-orange-800 rounded text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reload
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            className={`flex-1 flex flex-col ${
              activeTab === "record"
                ? "overflow-hidden"
                : "container mx-auto px-4 sm:px-6 py-2 sm:py-3 overflow-y-auto"
            }`}
          >
            {/* Unexpected Reset Recovery Notification */}
            {unexpectedReset && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      Session Interrupted
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      {unexpectedReset === "create" &&
                        "Your work has been auto-saved. Go back to continue editing your capsule."}
                      {unexpectedReset === "editor" &&
                        "Your enhancements have been saved. Go back to continue editing."}
                      {unexpectedReset !== "create" &&
                        unexpectedReset !== "editor" &&
                        `You were moved from the ${unexpectedReset} tab. This can happen due to network issues.`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleTabChange(unexpectedReset);
                        setUnexpectedReset(null);
                      }}
                      className="bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300 min-h-[36px] px-3"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      <span className="text-xs font-medium">Go Back</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUnexpectedReset(null)}
                      className="text-orange-600 hover:text-orange-700 min-h-[36px] px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Header - Hidden when Record tab is active */}
            {activeTab !== "record" && (
              <div className="mb-3 sm:mb-4">
                <div className="relative flex items-start justify-start min-h-[80px] sm:min-h-[100px] pl-0 sm:pl-6">
                  {/* Logo - Left aligned - Clickable to open title selector */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 z-[100] -ml-9 sm:ml-0 relative">
                    <MomentPrismLogo
                      size={window.innerWidth < 640 ? 80 : 120}
                      showSubtitle={true}
                      onClick={() => setShowTitleCarousel(true)}
                    />
                  </div>

                  {/* DESKTOP ONLY: Welcome + Title - CENTERED ABOVE TITLE */}
                  <div className="hidden sm:flex absolute top-0 right-14 z-20">
                    <div className="flex flex-col items-center gap-1">
                      {/* Welcome text with Avatar - Always centered, bell positioned absolutely */}
                      <div className="relative flex items-center gap-1">
                        <motion.div
                          key={`desktop-name-${!!titleProfile?.equipped_title}-${titleRenderKey}`}
                          initial={{
                            y: titleProfile?.equipped_title ? -10 : 10,
                            opacity: 0,
                          }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            duration: 0.5,
                          }}
                          className="text-base font-bold whitespace-nowrap inline-flex items-baseline gap-0 text-black dark:text-white"
                        >
                          <span>Welcome,&nbsp;</span>
                          <button
                            onClick={() => setShowTitleCarousel(true)}
                            className="cursor-pointer inline"
                            style={{
                              display: "inline",
                              padding: 0,
                              margin: 0,
                              border: "none",
                              background: "none",
                            }}
                          >
                            {auth.user?.firstName || "User"}
                          </button>
                        </motion.div>
                        {/* Profile Avatar - Click to change picture */}
                        <button
                          onClick={() => setShowProfilePictureUpload(true)}
                          className="cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity"
                          aria-label="Change profile picture"
                        >
                          <Avatar
                            src={profile?.avatar_url}
                            name={auth.user?.firstName}
                            email={auth.user?.email}
                            size="sm"
                            alt="Your profile"
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MOBILE ONLY: Single Row - Welcome + Avatar + Bell on Row 1, Gear centered beneath Bell on Row 2 */}
                  <div className="sm:hidden">
                    {/* Row 1: Welcome, User! + Avatar - Positioned right, left of Bell */}
                    <div className="absolute top-1 right-16 z-20 flex flex-row flex-nowrap items-center gap-1 whitespace-nowrap">
                      <span className="text-xs font-bold text-black dark:text-white">
                        Welcome,&nbsp;
                      </span>
                      <button
                        onClick={() => setShowTitleCarousel(true)}
                        className="cursor-pointer font-bold text-black dark:text-white text-xs flex-shrink-0 whitespace-nowrap"
                        style={{
                          padding: 0,
                          margin: 0,
                          border: "none",
                          background: "none",
                        }}
                      >
                        {auth.user?.firstName || "User"}
                      </button>
                      {/* Profile Avatar - Click to change picture */}
                      <button
                        onClick={() => setShowProfilePictureUpload(true)}
                        className="cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity flex-shrink-0"
                        aria-label="Change profile picture"
                      >
                        <Avatar
                          src={profile?.avatar_url}
                          name={auth.user?.firstName}
                          email={auth.user?.email}
                          size="xs"
                          alt="Your profile"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fixed Controls Overlay - Bell and Settings follow user down the page */}
            {activeTab !== "record" &&
              (() => {
                // Determine bell color based on equipped title
                // Use black for Sevenfold Sage or when no title is equipped (default)
                const shouldUseBlackBell =
                  !titleProfile?.equipped_title ||
                  titleProfile?.equipped_title === "Sevenfold Sage";
                const bellColor = shouldUseBlackBell
                  ? "text-black"
                  : "text-white";
                const bellBorderColor = shouldUseBlackBell
                  ? "border-black/40"
                  : "border-white/40";
                const bellBgColor = shouldUseBlackBell
                  ? "bg-black/10"
                  : "bg-white/10";

                return (
                  <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
                    <div className="relative flex items-start justify-end h-0 px-2 container mx-auto">
                      {/* Bell & Settings - Right */}
                      <div className="pointer-events-auto mt-1 sm:mt-3 flex flex-row items-center gap-3">
                        {/* Bell Icon & Settings Gear - Stacked Vertically */}
                        <div className="flex flex-col items-center gap-0 sm:gap-4">
                          {/* Bell Icon */}
                          <button
                            onClick={() => {
                              console.log(
                                "🔔 [BELL CLICK] unifiedUnreadCount:",
                                unifiedUnreadCount,
                              );
                              console.log(
                                "🔔 [BELL CLICK] unifiedNotifications.length:",
                                unifiedNotifications.length,
                              );
                              setShowNotificationCenter(true);
                            }}
                            className="cursor-pointer hover:opacity-70 active:opacity-50 transition-opacity"
                            aria-label="Notifications"
                          >
                            <div className="relative">
                              {/* Glow background for prominence */}
                              <div
                                className={`relative ${bellBgColor} p-2 rounded-full border-2 ${bellBorderColor}`}
                              >
                                <Bell className={`w-6 h-6 ${bellColor}`} />
                              </div>
                              {unifiedUnreadCount > 0 && (
                                <div
                                  className="absolute animate-pulse"
                                  style={{
                                    top: "-2px",
                                    left: "-2px",
                                    width:
                                      window.innerWidth < 640 ? "16px" : "18px",
                                    height:
                                      window.innerWidth < 640 ? "16px" : "18px",
                                    background: "#ec4899",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 9999,
                                    border: "1px solid white",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize:
                                        window.innerWidth < 640
                                          ? "10px"
                                          : "11px",
                                      lineHeight: "1",
                                      color: "white",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {unifiedUnreadCount > 9
                                      ? "9+"
                                      : unifiedUnreadCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>

                          {/* Settings Gear */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="cursor-pointer relative group -mt-3 sm:mt-0">
                                {/* Added -mt-3 on mobile to lift gear */}
                                {/* Glowing halo background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-md opacity-60 group-hover:opacity-80 animate-pulse"></div>

                                {/* Solid background with gear icon */}
                                <div className="relative bg-slate-900 p-3 rounded-full border-2 border-yellow-400 transition-transform group-hover:scale-110">
                                  <SettingsIcon
                                    className="w-6 h-6 text-yellow-400"
                                    style={{
                                      strokeWidth: "2.5px",
                                    }}
                                  />
                                </div>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56 bg-slate-900 border-slate-700 z-[9999]"
                              sideOffset={8}
                            >
                              <DropdownMenuItem
                                onClick={() => handleTabChange("settings")}
                                className="text-white focus:bg-slate-800 focus:text-white cursor-pointer"
                              >
                                <SettingsIcon className="w-4 h-4 mr-2 text-slate-400" />
                                Settings
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem
                                onClick={() => handleTabChange("legacy-access")}
                                className="text-white focus:bg-slate-800 focus:text-white cursor-pointer"
                              >
                                <Users className="w-4 h-4 mr-2 text-cyan-400" />
                                Legacy Access
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem
                                onClick={() => setShowArchiveModal(true)}
                                className="text-white focus:bg-slate-800 focus:text-white cursor-pointer"
                              >
                                <PackageOpen className="w-4 h-4 mr-2 text-violet-400" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem
                                onClick={() => handleTabChange("achievements")}
                                className="text-white focus:bg-slate-800 focus:text-white cursor-pointer"
                              >
                                <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
                                Achievements
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-white focus:bg-slate-800 focus:text-white cursor-pointer">
                                  <GraduationCap className="w-4 h-4 mr-2 text-amber-400" />
                                  Tutorials
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent
                                  className="bg-slate-900 border-slate-700 z-[10000]"
                                  sideOffset={8}
                                  alignOffset={0}
                                >
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log(
                                        "🌌 [TUTORIALS] Starting Eras Odyssey",
                                      );
                                      auth.setShowOnboarding(true);
                                    }}
                                    className="text-white focus:bg-slate-800 focus:text-white cursor-pointer"
                                  >
                                    <Compass className="w-4 h-4 mr-2 text-purple-400" />
                                    Eras Odyssey
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log(
                                        "📦 [TUTORIALS] Starting First Capsule",
                                      );
                                      setOnboardingModule("first_capsule");
                                      setShowOnboarding(true);
                                    }}
                                    className="text-white focus:bg-slate-800 focus:text-white cursor-pointer"
                                  >
                                    <Package className="w-4 h-4 mr-2 text-blue-400" />
                                    First Capsule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log(
                                        "🏛️ [TUTORIALS] Starting Vault Mastery",
                                      );
                                      setOnboardingModule("vault_mastery");
                                      setShowOnboarding(true);
                                    }}
                                    className="text-white focus:bg-slate-800 focus:text-white cursor-pointer"
                                  >
                                    <FolderOpen className="w-4 h-4 mr-2 text-emerald-400" />
                                    Vault Mastery
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem
                                onClick={() => handleTabChange("terms")}
                                className="text-white focus:bg-slate-800 focus:text-white cursor-pointer"
                              >
                                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                Terms & Privacy
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem
                                onClick={() => setShowHelpModal(true)}
                                className="text-white focus:bg-slate-800 focus:text-white cursor-pointer"
                              >
                                <HelpCircle className="w-4 h-4 mr-2 text-blue-400" />
                                Help & Support
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              <DropdownMenuItem
                                onClick={auth.handleLogout}
                                className="text-red-400 focus:bg-red-900/30 focus:text-red-400 cursor-pointer"
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Content Area - Eras Style with slide transitions */}
            <div
              className={`flex-1 ${activeTab === "record" ? "" : "pb-24 sm:pb-32"}`}
            >
              <AnimatePresence mode="wait">
                {/* Home Tab */}
                {activeTab === "home" && (
                  <motion.div
                    key="home-tab"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full"
                  >
                    <UnifiedHome
                      user={auth.user}
                      onEditCapsule={handleEditCapsule}
                      onEditCapsuleDetails={handleEditCapsuleDetails}
                      onCreateCapsule={() => handleTabChange("create")}
                      onOpenVault={handleOpenVault}
                    />
                  </motion.div>
                )}

                {/* Create Tab */}
                {activeTab === "create" && (
                  <motion.div
                    key="create-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <CreateCapsule
                      user={auth.user}
                      onCapsuleCreated={handleCapsuleCreated}
                      onOpenVault={handleOpenVault}
                      onOpenRecord={() => handleTabChange("record")}
                      editingCapsule={editingCapsule}
                      onCancelEdit={() => {
                        setEditingCapsule(null);
                        handleTabChange("home");
                      }}
                      onWorkInProgressChange={setHasUnsavedWork}
                      workflow={workflow}
                    />
                  </motion.div>
                )}

                {/* Legacy Access Tab */}
                {activeTab === "legacy-access" && (
                  <motion.div
                    key="legacy-access-tab"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <LegacyAccessBeneficiaries />
                  </motion.div>
                )}

                {/* Vault Tab */}
                {activeTab === "vault" && (
                  <motion.div
                    key="vault-tab"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full"
                  >
                    <LegacyVault
                      onUseMedia={handleVaultUseMedia}
                      onEdit={handleVaultEdit}
                      onClose={handleVaultClose}
                      onNavigateToGlobalSettings={handleVaultNavigateToSettings}
                    />
                  </motion.div>
                )}

                {/* Record Tab - Full Screen Experience */}
                {activeTab === "record" && (
                  <motion.div
                    key={`record-tab-${recordResetKey}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-black"
                  >
                    <RecordInterface
                      onMediaCaptured={handleRecordMediaCaptured}
                      onOpenVault={handleRecordOpenVault}
                      onEnhance={handleRecordEnhance}
                      onClose={handleRecordClose}
                      onRegisterRestoreCallback={(fn: any) => {
                        recordRestoreMediaRef.current = fn;
                      }}
                    />
                  </motion.div>
                )}

                {/* Settings Tabs */}
                {activeTab === "settings" && (
                  <motion.div
                    key="settings-tab"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <Settings
                      user={auth.user}
                      initialSection={settingsSection}
                    />
                  </motion.div>
                )}

                {/* Achievements Tab */}
                {activeTab === "achievements" && (
                  <motion.div
                    key="achievements-tab"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                  >
                    <div className="max-w-4xl mx-auto">
                      <div className="flex items-center justify-between mb-6">
                        <button
                          onClick={() => handleTabChange("home")}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">
                          Your Achievements
                        </h1>
                        <div className="w-10"></div>
                      </div>
                      <AchievementsDashboard
                        userId={auth.user?.id || ""}
                        onAwarded={(id) => {
                          console.log("🏆 Achievement awarded:", id);
                          toast.success("New achievement unlocked!");
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Terms Tab */}
                {activeTab === "terms" && (
                  <motion.div
                    key="terms-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <button
                        onClick={() => handleTabChange("home")}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Terms of Service & Privacy
                      </h1>
                    </div>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                        Eras is a digital time capsule service designed to
                        preserve your memories for the long term. We take your
                        privacy and data security seriously.
                      </p>
                      {/* Placeholder for actual terms content */}
                      <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold mb-4">
                          Privacy Commitment
                        </h3>
                        <ul className="space-y-3">
                          <li className="flex gap-3">
                            <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <span>
                              Your memories are end-to-end encrypted and visible
                              only to you and your designated legacy contacts.
                            </span>
                          </li>
                          <li className="flex gap-3">
                            <Lock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <span>
                              We never sell your data to third parties. Our
                              business model is based on storage and premium
                              features.
                            </span>
                          </li>
                          <li className="flex gap-3">
                            <Clock className="w-5 h-5 text-purple-500 flex-shrink-0" />
                            <span>
                              You have the "Right to be Forgotten" - deleting
                              your account permanently removes all stored media.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation - Clean Eras Style - Hidden when Record tab is active */}
            {activeTab !== "record" && (
              <div className="-mt-3 mb-3 sm:mt-0 sm:mb-5">
                <div className="flex items-end justify-center gap-1 sm:gap-8 md:gap-16 max-w-4xl mx-auto px-2">
                  <button
                    onClick={() => handleTabChange("home")}
                    className={`group relative flex flex-col items-center justify-end gap-0.5 sm:gap-2 flex-1 sm:flex-none py-1 px-2 sm:py-3 sm:px-6 transition-all duration-300 ${
                      activeTab === "home"
                        ? "scale-105"
                        : "hover:scale-105 active:scale-95"
                    }`}
                  >
                    {activeTab === "home" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/60 to-gray-100/60 dark:from-slate-800/30 dark:to-gray-800/30 rounded-2xl blur-xl -z-10"></div>
                    )}
                    <span
                      className={`transition-all duration-300 ${
                        activeTab === "home"
                          ? "scale-110"
                          : "group-hover:scale-105"
                      }`}
                      style={{
                        fontSize: window.innerWidth < 640 ? "44px" : "58px",
                        lineHeight: 1,
                        filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))",
                        textShadow:
                          "0 0 8px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 255, 255, 0.7), 0 0 16px rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      🏡
                    </span>
                    <span
                      className={`font-bold transition-all duration-300 block text-xs sm:text-base ${
                        activeTab === "home"
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                      }`}
                    >
                      Home
                    </span>
                    {activeTab === "home" && (
                      <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                        <div className="w-16 sm:w-24 h-1.5 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full shadow-lg shadow-slate-500/50"></div>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleTabChange("create")}
                    className={`group relative flex flex-col items-center justify-end gap-0.5 sm:gap-2 flex-1 sm:flex-none py-1 px-2 sm:py-3 sm:px-6 transition-all duration-300 ${
                      activeTab === "create"
                        ? "scale-105"
                        : "hover:scale-105 active:scale-95"
                    }`}
                  >
                    {activeTab === "create" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 to-teal-100/60 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl blur-xl -z-10"></div>
                    )}
                    <div
                      className={`transition-all duration-300 ${
                        activeTab === "create"
                          ? "scale-110"
                          : "group-hover:scale-105"
                      }`}
                    >
                      <RefinedSparkles
                        size={window.innerWidth < 640 ? 44 : 58}
                      />
                    </div>
                    <span
                      className={`font-bold transition-all duration-300 block text-xs sm:text-base ${
                        activeTab === "create"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-emerald-500 dark:text-emerald-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                      }`}
                    >
                      Compose
                    </span>
                    {activeTab === "create" && (
                      <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                        <div className="w-16 sm:w-24 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-lg shadow-emerald-500/50"></div>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleTabChange("record")}
                    className={`group relative flex flex-col items-center justify-end gap-0.5 sm:gap-2 flex-1 sm:flex-none py-1 px-2 sm:py-3 sm:px-6 transition-all duration-300 ${
                      activeTab === "record"
                        ? "scale-105"
                        : "hover:scale-105 active:scale-95"
                    }`}
                  >
                    {activeTab === "record" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/60 to-orange-100/60 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl blur-xl -z-10"></div>
                    )}
                    <div
                      className={`transition-all duration-300 ${
                        activeTab === "record"
                          ? "scale-110"
                          : "group-hover:scale-105"
                      }`}
                    >
                      <RefinedVideoCamera
                        size={window.innerWidth < 640 ? 44 : 58}
                      />
                    </div>
                    <span
                      className={`font-bold transition-all duration-300 block text-xs sm:text-base ${
                        activeTab === "record"
                          ? "text-amber-600 dark:text-amber-500"
                          : "text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-500"
                      }`}
                    >
                      Capture
                    </span>
                    {activeTab === "record" && (
                      <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                        <div className="w-16 sm:w-24 h-1.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full shadow-lg shadow-amber-500/50"></div>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleTabChange("vault")}
                    className={`group relative flex flex-col items-center justify-end gap-0.5 sm:gap-2 flex-1 sm:flex-none py-1 px-2 sm:py-3 sm:px-6 transition-all duration-300 ${
                      activeTab === "vault"
                        ? "scale-105"
                        : "hover:scale-105 active:scale-95"
                    }`}
                  >
                    {activeTab === "vault" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/60 to-indigo-100/60 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl blur-xl -z-10"></div>
                    )}
                    <span
                      className={`transition-all duration-300 ${
                        activeTab === "vault"
                          ? "scale-110"
                          : "group-hover:scale-105"
                      }`}
                      style={{
                        fontSize: window.innerWidth < 640 ? "44px" : "58px",
                        lineHeight: 1,
                        filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))",
                        textShadow:
                          "0 0 8px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 255, 255, 0.7), 0 0 16px rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      🏛️
                    </span>
                    <span
                      className={`font-bold transition-all duration-300 block text-xs sm:text-base ${
                        activeTab === "vault"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-purple-500 dark:text-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                      }`}
                    >
                      Vault
                    </span>
                    {activeTab === "vault" && (
                      <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                        <div className="w-16 sm:w-24 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-lg shadow-purple-500/50"></div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Only visible when not in Record mode */}
          {activeTab !== "record" && (
            <footer className="mt-auto py-8 sm:py-12 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
              <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white dark:text-slate-900 font-bold text-xl">
                        E
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase text-sm">
                        Eras
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">
                        Digital Time Capsule v1.2.4
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <button
                      onClick={() => handleTabChange("home")}
                      className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setShowArchiveModal(true)}
                      className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => handleTabChange("vault")}
                      className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Vault
                    </button>
                    <button
                      onClick={() => setShowHelpModal(true)}
                      className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Support
                    </button>
                    <button
                      onClick={() => handleTabChange("terms")}
                      className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Legal
                    </button>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                      <a
                        href="#"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                      <a
                        href="#"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                      <a
                        href="#"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">
                        System Status
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          All Systems Operational
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200/30 dark:border-slate-800/30 text-center">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-[0.2em] uppercase">
                    &copy; {new Date().getFullYear()} Eras Technologies Inc.
                    Preserving human legacy across dimensions.
                  </p>
                </div>
              </div>
            </footer>
          )}
        </div>
      </>
    );
  },
  (prev, next) => {
    // Custom memoization for performance
    return (
      prev.isTransitioning === next.isTransitioning &&
      prev.triggerSlideAnimation === next.triggerSlideAnimation
    );
  },
);
