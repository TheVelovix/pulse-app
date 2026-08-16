import BackButton from "@/components/BackButton";
import { sharedStyles } from "@/constants/commonStyles";
import { colors } from "@/constants/theme";
import { fetchWithAuth, useTypedParams } from "@/lib/lib";
import { GaProperty } from "@/types/Dashboard";
import { GaImportParams } from "@/types/NavParams";
import { useRouter } from "expo-router";
import { ChartLineUpIcon, CheckCircleIcon } from "phosphor-react-native";
import { useMemo, useState, useTransition } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { toast } from "sonner-native";

export default function GaImport() {
  const params = useTypedParams<GaImportParams>();
  const router = useRouter();
  const [importing, startTransition] = useTransition();

  const properties = useMemo<GaProperty[]>(() => {
    try {
      const parsed = JSON.parse(params.properties ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.properties]);

  const [selectedId, setSelectedId] = useState(properties[0]?.Id ?? "");

  function runImport() {
    if (!selectedId || !params.accessToken) return;
    startTransition(async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.EXPO_PUBLIC_BACKEND}/api/ga-import/import/${params.projectId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: params.accessToken,
              propertyId: selectedId,
            }),
          },
        );
        if (!res.ok) {
          if (res.status === 400) {
            const text = await res.text();
            if (text === "already-imported") {
              toast.error("Analytics already imported for this project.");
              return;
            }
          }
          toast.error("Import failed. Please try again.");
          return;
        }
        // The backend returns the plain string "no-data", otherwise { imported: number }
        const text = await res.text();
        if (text === "no-data") {
          toast.success("No data found in the selected property.");
        } else {
          const data = JSON.parse(text);
          toast.success(`Imported ${data.imported} page views.`);
        }
        router.back();
      } catch {
        toast.error("Something went wrong.");
      }
    });
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 15 }}>
      <BackButton />
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
        <View style={styles.iconWrapper}>
          <ChartLineUpIcon color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>Import from Google Analytics</Text>
          <Text style={sharedStyles.labelsMuted}>
            Select a GA4 property to import historical data from. This will import up to 2 years of
            page views.
          </Text>
        </View>
      </View>

      {properties.length === 0 ? (
        <View style={sharedStyles.cards}>
          <Text style={sharedStyles.labelsMuted}>
            No GA4 properties were found on this Google account.
          </Text>
        </View>
      ) : (
        properties.map(property => {
          const selected = property.Id === selectedId;
          return (
            <Pressable
              key={property.Id}
              disabled={importing}
              onPress={() => setSelectedId(property.Id)}
              style={({ pressed }) => [
                sharedStyles.cards,
                styles.property,
                selected && {
                  borderColor: colors.accent,
                  backgroundColor: colors.accentTransparent,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={sharedStyles.labels}>{property.DisplayName}</Text>
                <Text style={sharedStyles.labelsMuted}>{property.Id}</Text>
              </View>
              {selected && <CheckCircleIcon color={colors.accent} />}
            </Pressable>
          );
        })
      )}

      <View style={styles.buttonsWrapper}>
        <Pressable
          disabled={importing}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.buttons, (importing || pressed) && { opacity: 0.7 }]}
        >
          <Text style={[sharedStyles.labels, { color: colors.textMuted }]}>Cancel</Text>
        </Pressable>
        <Pressable
          disabled={importing || properties.length === 0}
          onPress={runImport}
          style={({ pressed }) => [
            styles.buttons,
            { backgroundColor: colors.accent },
            (importing || pressed || properties.length === 0) && { opacity: 0.7 },
          ]}
        >
          <Text style={sharedStyles.labels}>{importing ? "Importing..." : "Import"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    backgroundColor: colors.accentTransparent,
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  property: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonsWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 25,
    marginBottom: 40,
  },
  buttons: {
    width: 90,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 50,
  },
});
