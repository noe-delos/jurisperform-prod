/* eslint-disable @typescript-eslint/no-unused-vars */
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./actions";

export default function Home() {
  redirect("/dashboard");
}
