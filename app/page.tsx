// Root route — redirects immediately to the Upload page.
// /upload is the true entry point; this exists so "/" doesn't 404.

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/upload");
}
