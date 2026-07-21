import { colors } from "@/constants/theme";
import { ProjectSettingsProps } from "@/types/Dashboard";
import { useEffect, useTransition, useState } from "react";
import { Modal, useWindowDimensions, Text, StyleSheet, Pressable, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { runOnJS } from "react-native-worklets";
import Dragger from "./Dragger";
import { GlobeIcon, LockIcon, TrashIcon } from "phosphor-react-native";
import { fetchWithAuth } from "@/lib/lib";
import { toast, Toaster } from "sonner-native";

export default function ProjectSettings({
  isVisible,
  onClose,
  project,
  updateProjectVisibility,
  afterDelete,
}: ProjectSettingsProps) {
  const dimensions = useWindowDimensions();
  const overlayOpacity = useSharedValue(0);
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    height: dimensions.height,
    width: dimensions.width,
  }));
  const insets = useSafeAreaInsets();
  const optionsTranslate = useSharedValue(dimensions.height);
  const optionsStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: optionsTranslate.value,
      },
    ],
    height: dimensions.height * 0.3 + insets.bottom,
    backgroundColor: "black",
    borderWidth: 1,
    borderColor: colors.accent,
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
    padding: 10,
    paddingBottom: insets.bottom,
  }));
  useEffect(() => {
    if (isVisible) {
      overlayOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
      optionsTranslate.value = withTiming(dimensions.height * 0.7 - insets.bottom, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      overlayOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
      optionsTranslate.value = withTiming(dimensions.height, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [isVisible]);
  function handleClose() {
    overlayOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    optionsTranslate.value = withTiming(dimensions.height, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    setTimeout(() => onClose(), 200);
  }
  const [reqPending, startTransition] = useTransition();
  const context = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = optionsTranslate.value;
    })
    .onUpdate(e => {
      const newY = context.value + e.translationY;
      optionsTranslate.value = Math.max(newY, dimensions.height * 0.7 - insets.bottom);
    })
    .onEnd(e => {
      const shouldClose = e.translationY > dimensions.height * 0.15 || e.velocityY > 800;
      if (shouldClose) runOnJS(handleClose)();
      else {
        optionsTranslate.value = withTiming(dimensions.height * 0.7 - insets.bottom, {
          duration: 200,
          easing: Easing.inOut(Easing.ease),
        });
      }
    })
    .enabled(!reqPending);

  function toggleVisibility() {
    startTransition(async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/projects/${project?.id}/visibility`,
          {
            method: "PATCH",
          },
        );
        if (!res.ok) {
          toast.error("Something went wrong.");
          return;
        }
        const data = await res.json();
        toast.success(
          project?.isPublic
            ? "Project made private."
            : `Project made public, slug: ${data.publicSlug}`,
        );
        updateProjectVisibility(project!.id, data.isPublic);
      } catch (e) {
        console.log(e);
        toast.error("Something went wrong.");
      }
    });
  }
  const [showConfirmitation, setShowConfirmation] = useState(false);
  function deleteProject() {
    startTransition(async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/projects/${project?.id}`,
          {
            method: "DELETE",
          },
        );
        if (!res.ok) {
          toast.error("Something went wrong.");
          return;
        }
        setShowConfirmation(false);
        handleClose();
        afterDelete();
      } catch (e) {
        console.log(e);
        toast.error("Something went wrong.");
      }
    });
  }
  return (
    <Modal
      style={[
        {
          height: dimensions.height,
          width: dimensions.width,
          backgroundColor: "rgba(0,0,0,.6)",
        },
      ]}
      visible={isVisible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      {showConfirmitation && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.confirmationModal, { height: dimensions.height, width: dimensions.width }]}
        >
          <View style={styles.confirmationBox}>
            <Text
              style={[
                styles.whiteLabels,
                { fontSize: 17, fontFamily: "Poppins-SemiBold", textAlign: "center" },
              ]}
            >
              Are you sure you want to delete: {project?.name}?
            </Text>
            <View style={styles.modalButtonsWrapper}>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmationButtons,
                  pressed && { backgroundColor: "rgba(255,255,255,.2)" },
                  reqPending && { opacity: 0.5 },
                ]}
                onPress={() => setShowConfirmation(false)}
                disabled={reqPending}
              >
                <Text style={styles.whiteLabels}>No</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmationButtons,
                  { backgroundColor: pressed ? colors.accentHover : colors.accent },
                  reqPending && { opacity: 0.5 },
                ]}
                onPress={deleteProject}
                disabled={reqPending}
              >
                <Text style={styles.whiteLabels}>Yes</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
      <Animated.View style={overlayStyle}>
        <GestureHandlerRootView>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={optionsStyle}>
              <Dragger />
              <Pressable
                style={({ pressed }) => [
                  styles.buttons,
                  { marginTop: 25, borderBottomWidth: 0 },
                  pressed && { backgroundColor: "rgba(255,255,255, .2)" },
                ]}
                disabled={reqPending}
                onPress={toggleVisibility}
              >
                {project && project.isPublic ? (
                  <LockIcon color={colors.textMuted} />
                ) : (
                  <GlobeIcon color={colors.textMuted} />
                )}
                <Text style={styles.labels}>
                  {project && project.isPublic ? "Make Private" : "Make Public"}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.buttons,
                  pressed && { backgroundColor: "rgba(255,255,255,.2)" },
                ]}
                disabled={reqPending}
                onPress={() => setShowConfirmation(true)}
              >
                <TrashIcon color={colors.destructive} />
                <Text style={[styles.labels, { color: colors.destructive }]}>Delete</Text>
              </Pressable>
            </Animated.View>
          </GestureDetector>
          <Toaster theme="dark" />
        </GestureHandlerRootView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  labels: {
    color: colors.textMuted,
    fontFamily: "Poppins-Medium",
  },
  whiteLabels: {
    color: "white",
    fontFamily: "Poppins-Medium",
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.textMuted,
    height: 60,
  },
  confirmationModal: {
    position: "absolute",
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  confirmationBox: {
    backgroundColor: colors.background,
    width: "90%",
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    margin: "auto",
    padding: 10,
  },
  modalButtonsWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 25,
    marginTop: 40,
  },
  confirmationButtons: {
    width: 80,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
});
