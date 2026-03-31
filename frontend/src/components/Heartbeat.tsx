"use client";

import { useEffect } from "react";

export default function Heartbeat() {
  useEffect(() => {
    const ping = () => fetch("http://localhost:8000/api/heartbeat", { method: "POST" }).catch(() => {});
    ping();
    const id = setInterval(ping, 10_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
