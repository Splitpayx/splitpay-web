"use client";

type Status =
  | "ACTIVE" | "COMPLETED" | "ARCHIVED" | "DRAFT"
  | "PENDING" | "SUCCESS" | "FAILED" | "PROCESSING"
  | "INVITED" | "CONFIRMED" | "REMOVED"
  | "ACCEPTED" | "DECLINED";

const LABEL: Record<Status, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  DRAFT: "Draft",
  PENDING: "Pending",
  SUCCESS: "Paid",
  FAILED: "Failed",
  PROCESSING: "Processing",
  INVITED: "Invited",
  CONFIRMED: "Confirmed",
  REMOVED: "Removed",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

// Settled/success states → teal #14B8A6
const DOT_COLOR: Record<Status, string> = {
  ACTIVE: "#14B8A6",
  COMPLETED: "#14B8A6",
  SUCCESS: "#14B8A6",
  ACCEPTED: "#14B8A6",
  CONFIRMED: "#14B8A6",
  PENDING: "#CA8A04",
  INVITED: "#CA8A04",
  PROCESSING: "#60A5FA",
  FAILED: "#F87171",
  DECLINED: "#F87171",
  REMOVED: "#F87171",
  ARCHIVED: "#64748B",
  DRAFT: "#64748B",
};

const BG: Record<Status, string> = {
  ACTIVE: "rgba(20,184,166,0.12)",
  COMPLETED: "rgba(20,184,166,0.12)",
  SUCCESS: "rgba(20,184,166,0.12)",
  ACCEPTED: "rgba(20,184,166,0.12)",
  CONFIRMED: "rgba(20,184,166,0.12)",
  PENDING: "rgba(202,138,4,0.10)",
  INVITED: "rgba(202,138,4,0.10)",
  PROCESSING: "rgba(96,165,250,0.10)",
  FAILED: "rgba(248,113,113,0.10)",
  DECLINED: "rgba(248,113,113,0.10)",
  REMOVED: "rgba(248,113,113,0.10)",
  ARCHIVED: "rgba(100,116,139,0.10)",
  DRAFT: "rgba(100,116,139,0.10)",
};

const TEXT_COLOR: Record<Status, string> = {
  ACTIVE: "#14B8A6",
  COMPLETED: "#14B8A6",
  SUCCESS: "#14B8A6",
  ACCEPTED: "#14B8A6",
  CONFIRMED: "#14B8A6",
  PENDING: "#CA8A04",
  INVITED: "#CA8A04",
  PROCESSING: "#60A5FA",
  FAILED: "#F87171",
  DECLINED: "#F87171",
  REMOVED: "#F87171",
  ARCHIVED: "#64748B",
  DRAFT: "#64748B",
};

interface Props {
  status: Status | string;
}

export default function StatusBadge({ status }: Props) {
  const s = (status as Status) in LABEL ? (status as Status) : "DRAFT";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 500,
        background: BG[s],
        color: TEXT_COLOR[s],
      }}
    >
      <span
        aria-hidden
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: DOT_COLOR[s],
          flexShrink: 0,
        }}
      />
      {LABEL[s]}
    </span>
  );
}
