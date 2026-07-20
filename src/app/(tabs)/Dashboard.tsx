import NewProject from "@/components/NewProject";
import { colors } from "@/constants/theme";
import { SubscriptionPlan, useSession } from "@/context/SessionContext";
import { fetchWithAuth } from "@/lib/lib";
import { Project } from "@/types/Dashboard";
import { useRouter } from "expo-router";
import { PlusIcon } from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

async function fetchProjects() {
  try {
    const res = await fetchWithAuth(
      `${process.env.EXPO_PUBLIC_BACKEND}/api/projects`,
    );
    if (!res.ok) toast.error("Projects request failed");
    const data = await res.json();
    return data as Project[];
  } catch (e) {
    console.log(e);
    toast.error("Failed to fetch projects");
  }
}
export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectButton, setShowProjectButton] = useState(false);
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!session.user) router.replace("/Login");
    fetchProjects().then((projects) => setProjects(projects ?? []));
    if (
      session.user?.subscriptionPlan &&
      session.user?.subscriptionPlan === SubscriptionPlan.FREE &&
      projects.length < 5
    )
      setShowProjectButton(true);
  }, [session]);
  const insets = useSafeAreaInsets();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const hideForm = useCallback(() => setShowNewProjectForm(false), []);
  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={styles.header}>
        <Text
          style={{ color: "white", fontFamily: "Poppins-Bold", fontSize: 22 }}
        >
          Dashboard
        </Text>
        {showProjectButton && (
          <Pressable
            style={styles.createButton}
            onPress={() => setShowNewProjectForm(true)}
          >
            <PlusIcon color="white" />
            <Text
              style={{
                color: "white",
                fontFamily: "Poppins-Regular",
                marginTop: 2,
              }}
            >
              Create Project
            </Text>
          </Pressable>
        )}
      </View>
      <NewProject
        isVisible={showNewProjectForm}
        onClose={hideForm}
        refetchProjects={fetchProjects}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  createButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});
