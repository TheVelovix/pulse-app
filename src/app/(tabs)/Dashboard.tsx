import NewProject from "@/components/NewProject";
import ProjectSettings from "@/components/ProjectSettings";
import { colors } from "@/constants/theme";
import { SubscriptionPlan, useSession } from "@/context/SessionContext";
import { fetchWithAuth, parseMonth } from "@/lib/lib";
import { Project } from "@/types/Dashboard";
import { useRouter } from "expo-router";
import { GearIcon, PlusIcon } from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const dvw = Dimensions.get("window").width;
async function fetchProjects() {
  try {
    const res = await fetchWithAuth(`${process.env.EXPO_PUBLIC_BACKEND}/api/projects`);
    if (!res.ok) {
      toast.error("Projects request failed");
      return;
    }
    const data = await res.json();
    return data as Project[];
  } catch {
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
    fetchProjects().then(projects => setProjects(projects ?? []));
    if (
      session.user?.subscriptionPlan &&
      session.user?.subscriptionPlan === SubscriptionPlan.FREE &&
      projects.length < 5
    )
      setShowProjectButton(true);
    else setShowProjectButton(false);
  }, [session, projects]);

  const insets = useSafeAreaInsets();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const hideForm = useCallback(() => setShowNewProjectForm(false), []);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const hideOptions = useCallback(() => {
    setShowOptions(false);
    setSelectedProject(null);
  }, []);
  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: "black",
        flex: 1,
      }}
    >
      <View style={styles.header}>
        <Text style={{ color: "white", fontFamily: "Poppins-Bold", fontSize: 22 }}>Dashboard</Text>
        {showProjectButton && (
          <Pressable style={styles.createButton} onPress={() => setShowNewProjectForm(true)}>
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
      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        numColumns={dvw < 640 ? 1 : 2}
        renderItem={({ item, index }) => {
          const createdAt = new Date(item.createdAt);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.projects,
                pressed && { backgroundColor: "rgba(255,255,255,.2)" },
              ]}
              onLongPress={() => {
                setShowOptions(true);
                setSelectedProject(index);
              }}
            >
              <Text style={[styles.labels, { fontSize: 18, marginBottom: 10 }]}>{item.name}</Text>
              <Text style={styles.labelsMuted}>
                Created{" "}
                {`${parseMonth(createdAt.getMonth())} ${createdAt.getDate()}, ${createdAt.getFullYear()}`}
              </Text>
              <Pressable
                onPress={e => {
                  e.stopPropagation();
                  setShowOptions(true);
                  setSelectedProject(index);
                }}
                style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.5 }]}
              >
                <GearIcon color={colors.textMuted} />
              </Pressable>
            </Pressable>
          );
        }}
      />
      <NewProject
        isVisible={showNewProjectForm}
        onClose={hideForm}
        refetchProjects={fetchProjects}
      />
      <ProjectSettings
        isVisible={showOptions}
        onClose={hideOptions}
        project={projects[selectedProject!]}
        updateProjectVisibility={(projectId, isPublic) => {
          setProjects(prev =>
            prev.map(proj => (proj.id === projectId ? { ...proj, isPublic } : proj)),
          );
        }}
        afterDelete={() => {
          toast.success("Project Deleted.");
          fetchProjects();
        }}
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
  labels: {
    color: "white",
    fontFamily: "Poppins-Regular",
  },
  labelsMuted: {
    color: colors.textMuted,
    fontFamily: "Poppins-Regular",
  },
  projects: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    padding: 10,
    marginVertical: 15,
    width: dvw < 640 ? "90%" : "49%",
    marginHorizontal: "auto",
    backgroundColor: colors.background,
  },
  settingsButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});
