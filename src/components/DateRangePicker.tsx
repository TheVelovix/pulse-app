import { sharedStyles } from "@/constants/commonStyles";
import { colors } from "@/constants/theme";
import { DateRangePickerParams } from "@/types/Analytics";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp } from "react-native-reanimated";

type CustomDate = {
  date: Date | null;
  skipChange: boolean;
};
export default function DateRangePicker({
  isVisible,
  minimumDate,
  maximumDate,
  submitDate,
  close,
}: DateRangePickerParams) {
  const [startDate, setStartDate] = useState<CustomDate>({
    date: null,
    skipChange: true,
  });
  const [endDate, setEndDate] = useState<CustomDate>({
    date: null,
    skipChange: true,
  });
  useEffect(() => {
    if (!isVisible) cancel();
  }, [isVisible]);
  const cancel = useCallback(() => {
    setStartDate({
      date: null,
      skipChange: true,
    });
    setEndDate({
      date: null,
      skipChange: true,
    });
    close();
  }, []);
  const submit = useCallback(() => {
    if (startDate?.date && endDate?.date) {
      submitDate(startDate.date, endDate.date);
    } else {
      // In this case endDate can be null. startDate will always have value
      submitDate(startDate.date!, maximumDate);
    }
  }, [startDate, endDate]);
  return (
    <Modal visible={isVisible} transparent onRequestClose={cancel}>
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,.7)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!startDate.date && (
          <Animated.View
            entering={FadeInDown}
            exiting={FadeOutUp}
            style={[sharedStyles.cards, { width: "90%" }]}
          >
            <Text style={[sharedStyles.title, { textAlign: "center" }]}>Select Start Date</Text>
            <DateTimePicker
              value={minimumDate}
              onValueChange={(event, selectedDate) => {
                if (startDate?.skipChange) {
                  setStartDate(prev => ({ ...prev, skipChange: false }));
                  return;
                }
                setStartDate(prev => ({ ...prev, date: selectedDate }));
              }}
              onDismiss={cancel}
              mode="date"
              presentation="inline"
              accentColor={colors.accent}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              themeVariant="dark"
            />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable
                style={({ pressed }) => [
                  styles.buttons,
                  { backgroundColor: "transparent" },
                  pressed && { backgroundColor: colors.textMuted },
                ]}
                onPress={cancel}
              >
                <Text style={sharedStyles.labels}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.buttons,
                  pressed && { backgroundColor: colors.accentHover },
                ]}
                onPress={() => {
                  setStartDate(prev => ({
                    ...prev,
                    date: minimumDate,
                  }));
                }}
              >
                <Text style={sharedStyles.labels}>Next</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
        {startDate.date && !endDate.date && (
          <Animated.View
            entering={FadeInDown}
            exiting={FadeOutUp}
            style={[sharedStyles.cards, { width: "90%" }]}
          >
            <Text style={[sharedStyles.title, { textAlign: "center" }]}>Select End Date</Text>
            <DateTimePicker
              value={maximumDate}
              onValueChange={(_, selectedDate) => {
                if (endDate.skipChange) {
                  setEndDate(prev => ({ ...prev, skipChange: false }));
                  return;
                }
                setEndDate(prev => ({ ...prev, date: selectedDate }));
              }}
              onDismiss={cancel}
              mode="date"
              presentation="inline"
              accentColor={colors.accent}
              minimumDate={startDate?.date}
              maximumDate={maximumDate}
              style={{ borderRadius: 50 }}
              themeVariant="dark"
            />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable
                style={({ pressed }) => [
                  styles.buttons,
                  { backgroundColor: "transparent" },
                  pressed && { backgroundColor: colors.textMuted },
                ]}
                onPress={cancel}
              >
                <Text style={sharedStyles.labels}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.buttons,
                  pressed && { backgroundColor: colors.accentHover },
                ]}
                onPress={submit}
              >
                <Text style={sharedStyles.labels}>Submit</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  buttons: {
    backgroundColor: colors.accent,
    marginHorizontal: "auto",
    marginTop: 20,
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderRadius: 50,
  },
});
