"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(11, 26, 51, 0.75)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0F2340",
          border: "1px solid #1E3358",
          borderRadius: 20,
          padding: "26px 24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          transform: "scale(1)",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
            {title}
          </h3>
          <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.55, margin: 0 }}>
            {message}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 500,
              color: "#94A3B8",
              background: "#0B1A33",
              border: "1px solid #1E3358",
              cursor: "pointer",
              transition: "background 140ms",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1E3358")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0B1A33")}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 500,
              color: "#FFFFFF",
              background: isDestructive ? "#DC2626" : "#FFFFFF",
              border: "none",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: isDestructive
                ? "0 4px 12px rgba(220, 38, 38, 0.25)"
                : "0 4px 12px rgba(255,255,255,0.1)",
              transition: "transform 140ms, background 140ms",
              fontFamily: "inherit",
              ...(isDestructive ? {} : { color: "#0B1A33" }),
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget.style.transform = "translateY(-1px)");
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.currentTarget.style.transform = "translateY(0)");
            }}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
