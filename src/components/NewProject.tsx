import { colors } from "@/constants/theme";
import { fetchWithAuth } from "@/lib/lib";
import { NewProjectBody, NewProjectProps } from "@/types/Dashboard";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Modal,
  useWindowDimensions,
  Text,
  View,
  StyleSheet,
  TextInput,
  Pressable,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { runOnJS } from "react-native-worklets";
import { toast } from "sonner-native";
import * as z from "zod";
import Dragger from "./Dragger";

const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63}(?<!-))*\.[A-Za-z]{2,}$/;

const domainSchema = z
  .string()
  .min(1, "Domain is required")
  .max(253, "Domain is too long")
  .regex(domainRegex, "Enter a valid domain (e.g. example.com)");

export default function NewProject({ isVisible, onClose, refetchProjects }: NewProjectProps) {
  const [body, setBody] = useState<NewProjectBody>({
    name: "",
    domain: "",
  });
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(dimensions.height);
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: dimensions.height * 0.9,
    width: dimensions.width,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    backgroundColor: "black",
    borderWidth: 1,
    borderColor: colors.accent,
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
    padding: 10,
  }));
  const overlayOpacity = useSharedValue(0);
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    height: dimensions.height,
    width: dimensions.width,
  }));
  useEffect(() => {
    if (isVisible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(dimensions.height * 0.1, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(dimensions.height, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [isVisible]);

  const handleClose = useCallback(
    (fast?: boolean) => {
      translateY.value = withTiming(dimensions.height, {
        duration: fast ? 100 : 200,
        easing: Easing.inOut(Easing.ease),
      });
      setBody({
        name: "",
        domain: "",
      });
      setTimeout(() => onClose(), 200);
    },
    [isVisible],
  );

  const [reqPending, startTransition] = useTransition();
  const context = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate(e => {
      const newY = context.value + e.translationY;
      translateY.value = Math.max(newY, dimensions.height * 0.1);
    })
    .onEnd(e => {
      const shouldClose = e.translationY > dimensions.height * 0.15 || e.velocityY > 800;
      if (shouldClose) runOnJS(handleClose)(true);
      else {
        translateY.value = withTiming(dimensions.height * 0.1, {
          duration: 200,
          easing: Easing.inOut(Easing.ease),
        });
      }
    })
    .enabled(!reqPending);

  const domainRef = useRef<TextInput>(null);
  const focusDomain = useCallback(() => {
    domainRef?.current?.focus();
  }, [domainRef, domainRef.current]);

  const [error, setError] = useState("");
  const handleInputChange = useCallback(
    (key: string, value: string) => {
      setBody(prev => ({
        ...prev,
        [key]: value,
      }));
      if (error) setError("");
    },
    [error],
  );

  const createProject = useCallback(() => {
    startTransition(async () => {
      if (!body.name || !body.domain) {
        setError("Fill out the form.");
        return;
      }
      try {
        domainSchema.parse(body.domain);
        const res = await fetchWithAuth(`${process.env.EXPO_PUBLIC_BACKEND}/api/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const resText = await res.text();
          if (resText === "project-limit-reached") {
            toast.error("Project limit reached.");
          } else {
            toast.error("Unknown error occurred.");
          }
          return;
        }
        toast.success("Project created successfully.");
        setBody({
          name: "",
          domain: "",
        });
        await refetchProjects();
        handleClose();
      } catch (e) {
        if (e instanceof z.ZodError) {
          setError(e.issues[0].message);
        } else {
          toast.error("Unknown error occurred.");
        }
      }
    });
  }, [body.name, body.domain]);
  return (
    <Modal
      style={[
        {
          height: dimensions.height,
          width: dimensions.width,
          backgroundColor: "rgba(0,0,0,.6)",
        },
      ]}
      onRequestClose={() => handleClose()}
      visible={isVisible}
      animationType="fade"
    >
      <Animated.View style={overlayStyle}>
        <GestureHandlerRootView>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[sliderStyle]}>
              <Dragger />
              <Text style={styles.title}>Create Project</Text>
              {error && (
                <Text
                  style={[
                    styles.labels,
                    {
                      color: colors.destructive,
                      textAlign: "center",
                      marginTop: 10,
                    },
                  ]}
                >
                  {error}
                </Text>
              )}
              <View style={styles.inputsWrapper}>
                <View>
                  <Text style={styles.labels}>Name</Text>
                  <TextInput
                    style={styles.inputs}
                    value={body.name}
                    onChangeText={newVal => handleInputChange("name", newVal)}
                    placeholder="Name here..."
                    returnKeyType="next"
                    onSubmitEditing={focusDomain}
                  />
                </View>
                <View>
                  <Text style={styles.labels}>Domain</Text>
                  <TextInput
                    ref={domainRef}
                    style={styles.inputs}
                    value={body.domain}
                    onChangeText={newVal => handleInputChange("domain", newVal)}
                    placeholder="example.com"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.buttonsWrapper}>
                <Pressable
                  disabled={reqPending}
                  style={({ pressed }) => [
                    styles.buttons,
                    (reqPending || pressed) && { opacity: 0.7 },
                  ]}
                  onPress={() => handleClose()}
                >
                  <Text style={[styles.labels, { color: colors.textMuted }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  disabled={reqPending}
                  onPress={createProject}
                  style={({ pressed }) => [
                    styles.buttons,
                    {
                      backgroundColor: pressed ? colors.accentHover : colors.accent,
                    },
                    reqPending && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.labels]}>Create</Text>
                </Pressable>
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "Poppins-Medium",
    color: "white",
    fontSize: 20,
    marginTop: 25,
    textAlign: "center",
  },
  labels: {
    color: "white",
    fontFamily: "Poppins-Regular",
  },
  inputsWrapper: {
    width: "85%",
    marginHorizontal: "auto",
    marginTop: 20,
    gap: 30,
  },
  inputs: {
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 10,
    fontFamily: "Poppins-Regular",
    color: "white",
  },
  buttonsWrapper: {
    flexDirection: "row",
    marginTop: 50,
    marginHorizontal: "auto",
    gap: 20,
    justifyContent: "flex-end",
    width: "85%",
    paddingHorizontal: 10,
  },
  buttons: {
    width: 90,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 50,
  },
});
