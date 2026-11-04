"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";

/**
 * In the admin's live preview: the page renders anew whenever the document
 * is saved. Outside the admin's frame it does nothing.
 */
export const RefreshOnSave = () => {
  const router = useRouter();
  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={process.env.NEXT_PUBLIC_SERVER_URL ?? ""}
    />
  );
};
