import { StyleSheet } from "react-native";
import { colors } from "./theme";
export const authStyles = StyleSheet.create({
  form: {
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 10,
    margin: "auto",
    marginTop: "15%",
    backgroundColor: colors.card,
    width: "90%",
    padding: 15,
  },
  title: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginTop: 5,
    fontFamily: "Poppins-Bold",
  },
  inputsWrapper: {
    marginTop: 50,
    gap: 30,
  },
  labels: {
    color: "white",
    fontFamily: "Poppins-Regular",
  },
  inputs: {
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 10,
    fontFamily: "Poppins-Regular",
    color: "white",
  },
  authButton: {
    backgroundColor: colors.accent,
    marginTop: 25,
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 10,
  },
  br: {
    width: "100%",
    height: 1,
    backgroundColor: "white",
    marginTop: 30,
    marginBottom: 15,
  },
  links: {
    color: colors.accent,
    textDecorationLine: "underline",
  },
  error: {
    color: "red",
    fontFamily: "Poppins-Regular",
    marginTop: 20,
    textAlign: "center",
  },
});
