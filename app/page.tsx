import { redirect } from "next/navigation"

export default function Home() {
  // Automatically redirect the root URL ("/") to the user dashboard
  redirect("/user/dashboard")
}