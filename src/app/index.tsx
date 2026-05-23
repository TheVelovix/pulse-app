import { useSession } from "@/context/SessionContext";
import { Redirect } from "expo-router";

export default function index() {
  const session = useSession();
  if (session.user) {
    return <Redirect href="/(tabs)/Dashboard" />;
  }
  return <Redirect href="/Login" />;
}
