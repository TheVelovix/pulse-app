import { ScrollView, View, Text } from "react-native";
import { policyStyles } from "@/constants/commonStyles";
import { refundPolicy } from "@/constants/policies";
import { Pressable } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { ArrowLeftIcon } from "phosphor-react-native";

export default function RefundPolicy() {
  const router = useRouter();
  return (
    <ScrollView style={{ flex: 1, paddingHorizontal: 10 }}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          policyStyles.smallBackButton,
          pressed && { backgroundColor: "rgb(150, 150, 150)" },
        ]}
      >
        <ArrowLeftIcon color="white" />
        <Text style={policyStyles.smallButtonLabel}>Back</Text>
      </Pressable>
      <Text style={policyStyles.title}>Refund Policy</Text>
      <Text style={policyStyles.subTitle}>Last updated: April 20, 2026</Text>

      <View style={policyStyles.policyWrapper}>
        {refundPolicy.map((section, index) => {
          return (
            <View key={index} style={index < refundPolicy.length ? policyStyles.sectionBorder : {}}>
              <Text style={policyStyles.sectionTitles}>
                {index + 1} {section.title}
              </Text>
              <Text style={policyStyles.sectionText}>{section.content}</Text>
            </View>
          );
        })}
      </View>
      <Pressable style={policyStyles.backButton} onPress={() => router.back()}>
        <Text style={policyStyles.buttonLabel}>Go Back</Text>
      </Pressable>
    </ScrollView>
  );
}
