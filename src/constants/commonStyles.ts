import { StyleSheet } from "react-native";
import { colors } from "./theme";
import { isHeaderBarButtonsAvailableForCurrentPlatform } from "react-native-screens/lib/typescript/utils";

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
    marginBottom:5
  },
  buttonLabels:{
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

export const policyStyles = StyleSheet.create({
  title:{
    color:"white",
    fontFamily:"Poppins-SemiBold",
    marginTop:20,
    fontSize:20
  },
  subTitle:{
    color:'rgb(120, 120, 120)',
    fontFamily:"Poppins-Regular",
    marginBottom:10
  },
  policyWrapper:{
    borderWidth:1,
    borderColor:'rgb(150, 150, 150)',
    borderRadius:10,
    padding:20,
    gap:20
  },
  sectionTitles:{
    color:"white",
    fontFamily:"Poppins-Medium"
  },
  sectionText:{
    color:"rgb(170, 170, 170)",
    fontFamily:"Poppins-Regular"
  },
  sectionBorder:{
    borderBottomColor:"rgb(150, 150, 150)",
    borderBottomWidth:1
  },
  backButton:{
    marginVertical:15,
    marginHorizontal:"auto",
    backgroundColor:colors.accent,
    width:"90%",
    borderRadius:50,
    paddingVertical:10
  },
  buttonLabel:{
    color:"white",
    fontSize:18,
    textAlign:"center",
    fontFamily:"Poppins-Regular"
  },
  smallBackButton:{
    marginRight:"auto",
    flexDirection:"row",
    gap: 4,
    padding:10,
    borderRadius:50
  },
  smallButtonLabel:{
    color:"white",
    fontSize:14,
    textAlign:"center",
    fontFamily:"Poppins-Regular",
    marginTop:2
  }
})
