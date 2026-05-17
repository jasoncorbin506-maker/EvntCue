import { redirect } from "next/navigation";

// /venu defaults to the Discover tab (Tab 1 per Venu_Locked_2026-05-13.md).
export default function VenuRoot() {
  redirect("/venu/discover");
}
