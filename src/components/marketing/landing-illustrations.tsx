type IllustrationProps = {
  className?: string;
};

/** Inline SVG so illustrations render without relying on /public static files at deploy time. */
export function HeroPlatformIllustration({ className }: IllustrationProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 520"
      role="img"
      aria-label="Mobile app and website connected to Feedback Hub admin dashboard"
      className={className}
    >
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        <linearGradient id="hero-accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="800" height="520" rx="24" fill="url(#hero-bg)" />
      <rect x="48" y="56" width="200" height="140" rx="16" fill="#fff" stroke="#dbeafe" strokeWidth="2" />
      <rect x="68" y="76" width="160" height="24" rx="6" fill="#e0e7ff" />
      <rect x="68" y="112" width="120" height="12" rx="4" fill="#e5e7eb" />
      <rect x="68" y="132" width="140" height="12" rx="4" fill="#e5e7eb" />
      <rect x="68" y="160" width="72" height="24" rx="8" fill="#2563eb" />
      <text x="104" y="176" fontFamily="system-ui,sans-serif" fontSize="11" fill="#fff" textAnchor="middle">
        Submit
      </text>
      <text
        x="148"
        y="218"
        fontFamily="system-ui,sans-serif"
        fontSize="13"
        fontWeight="600"
        fill="#1e293b"
        textAnchor="middle"
      >
        Mobile app
      </text>
      <rect x="552" y="56" width="200" height="140" rx="16" fill="#fff" stroke="#dbeafe" strokeWidth="2" />
      <rect x="572" y="76" width="160" height="24" rx="6" fill="#e0e7ff" />
      <rect x="572" y="112" width="130" height="12" rx="4" fill="#e5e7eb" />
      <rect x="572" y="132" width="150" height="12" rx="4" fill="#e5e7eb" />
      <rect x="572" y="160" width="88" height="24" rx="8" fill="#2563eb" />
      <text x="616" y="176" fontFamily="system-ui,sans-serif" fontSize="11" fill="#fff" textAnchor="middle">
        Register
      </text>
      <text
        x="652"
        y="218"
        fontFamily="system-ui,sans-serif"
        fontSize="13"
        fontWeight="600"
        fill="#1e293b"
        textAnchor="middle"
      >
        Website
      </text>
      <rect x="276" y="168" width="248" height="88" rx="20" fill="url(#hero-accent)" />
      <text
        x="400"
        y="204"
        fontFamily="system-ui,sans-serif"
        fontSize="18"
        fontWeight="700"
        fill="#fff"
        textAnchor="middle"
      >
        Feedback Hub
      </text>
      <text x="400" y="228" fontFamily="system-ui,sans-serif" fontSize="12" fill="#dbeafe" textAnchor="middle">
        Sync / Answers / Inbox API
      </text>
      <path d="M248 126 L276 200" stroke="#93c5fd" strokeWidth="3" fill="none" />
      <path d="M552 126 L524 200" stroke="#93c5fd" strokeWidth="3" fill="none" />
      <rect x="120" y="320" width="560" height="160" rx="16" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
      <text x="148" y="352" fontFamily="system-ui,sans-serif" fontSize="14" fontWeight="600" fill="#0f172a">
        Admin dashboard
      </text>
      <rect x="148" y="368" width="500" height="12" rx="4" fill="#f1f5f9" />
      <rect x="148" y="392" width="420" height="12" rx="4" fill="#f1f5f9" />
      <rect x="148" y="416" width="360" height="12" rx="4" fill="#f1f5f9" />
      <rect x="148" y="448" width="96" height="20" rx="6" fill="#dcfce7" />
      <text x="196" y="462" fontFamily="system-ui,sans-serif" fontSize="10" fill="#166534" textAnchor="middle">
        Reply sent
      </text>
      <path d="M400 256 L400 320" stroke="#6366f1" strokeWidth="3" strokeDasharray="6 4" />
    </svg>
  );
}

export function FlowSyncIllustration({ className }: IllustrationProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 720 400"
      role="img"
      aria-label="Diagram of register, sync, submit answer, and admin reply steps"
      className={className}
    >
      <rect width="720" height="400" rx="20" fill="#f8fafc" />
      <g fontFamily="system-ui,sans-serif">
        <g transform="translate(40,48)">
          <circle cx="32" cy="32" r="32" fill="#2563eb" />
          <text x="32" y="38" fontSize="18" fontWeight="700" fill="#fff" textAnchor="middle">
            1
          </text>
          <text x="80" y="28" fontSize="15" fontWeight="600" fill="#0f172a">
            Register
          </text>
          <text x="80" y="48" fontSize="12" fill="#64748b">
            POST /api/v1/installations/register
          </text>
          <text x="80" y="66" fontSize="12" fill="#64748b">
            Store installation token securely
          </text>
        </g>
        <g transform="translate(40,128)">
          <circle cx="32" cy="32" r="32" fill="#2563eb" />
          <text x="32" y="38" fontSize="18" fontWeight="700" fill="#fff" textAnchor="middle">
            2
          </text>
          <text x="80" y="28" fontSize="15" fontWeight="600" fill="#0f172a">
            Sync questions
          </text>
          <text x="80" y="48" fontSize="12" fill="#64748b">
            GET /api/v1/sync - show surveys in-app
          </text>
          <text x="80" y="66" fontSize="12" fill="#64748b">
            Ratings, choices, yes/no, and more
          </text>
        </g>
        <g transform="translate(40,208)">
          <circle cx="32" cy="32" r="32" fill="#2563eb" />
          <text x="32" y="38" fontSize="18" fontWeight="700" fill="#fff" textAnchor="middle">
            3
          </text>
          <text x="80" y="28" fontSize="15" fontWeight="600" fill="#0f172a">
            Submit answers
          </text>
          <text x="80" y="48" fontSize="12" fill="#64748b">
            POST /api/v1/answers with validation
          </text>
          <text x="80" y="66" fontSize="12" fill="#64748b">
            Opens a conversation for follow-up
          </text>
        </g>
        <g transform="translate(40,288)">
          <circle cx="32" cy="32" r="32" fill="#2563eb" />
          <text x="32" y="38" fontSize="18" fontWeight="700" fill="#fff" textAnchor="middle">
            4
          </text>
          <text x="80" y="28" fontSize="15" fontWeight="600" fill="#0f172a">
            Two-way feedback
          </text>
          <text x="80" y="48" fontSize="12" fill="#64748b">
            Admin replies sync back to the client
          </text>
          <text x="80" y="66" fontSize="12" fill="#64748b">
            General feedback conversations too
          </text>
        </g>
      </g>
      <rect x="400" y="48" width="280" height="304" rx="16" fill="#fff" stroke="#e2e8f0" />
      <text x="424" y="80" fontSize="13" fontWeight="600" fill="#334155" fontFamily="system-ui,sans-serif">
        Active question
      </text>
      <rect x="424" y="96" width="232" height="56" rx="10" fill="#eff6ff" stroke="#bfdbfe" />
      <text x="440" y="120" fontSize="12" fill="#1e40af" fontFamily="system-ui,sans-serif">
        How satisfied are you today?
      </text>
      <text x="440" y="138" fontSize="11" fill="#64748b" fontFamily="system-ui,sans-serif">
        Rating (optional)
      </text>
      <text x="424" y="188" fontSize="13" fontWeight="600" fill="#334155" fontFamily="system-ui,sans-serif">
        User answer
      </text>
      <rect x="424" y="204" width="120" height="36" rx="8" fill="#2563eb" />
      <text
        x="484"
        y="227"
        fontSize="14"
        fontWeight="600"
        fill="#fff"
        textAnchor="middle"
        fontFamily="system-ui,sans-serif"
      >
        4 / 5
      </text>
      <text x="424" y="276" fontSize="13" fontWeight="600" fill="#334155" fontFamily="system-ui,sans-serif">
        Admin reply
      </text>
      <rect x="424" y="292" width="232" height="44" rx="10" fill="#f0fdf4" stroke="#bbf7d0" />
      <text x="440" y="318" fontSize="12" fill="#166534" fontFamily="system-ui,sans-serif">
        Thanks - we are looking into this.
      </text>
    </svg>
  );
}

export function AdminInboxIllustration({ className }: IllustrationProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 720 400"
      role="img"
      aria-label="Feedback Hub admin dashboard with inbox and team access"
      className={className}
    >
      <rect width="720" height="400" rx="20" fill="#0f172a" />
      <rect x="24" y="24" width="672" height="352" rx="12" fill="#fff" />
      <rect x="24" y="24" width="160" height="352" rx="12" fill="#f8fafc" />
      <text x="48" y="56" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="700" fill="#0f172a">
        Feedback Hub
      </text>
      <rect x="40" y="72" width="128" height="28" rx="6" fill="#dbeafe" />
      <rect x="40" y="108" width="128" height="28" rx="6" fill="#f1f5f9" />
      <rect x="40" y="144" width="128" height="28" rx="6" fill="#f1f5f9" />
      <rect x="40" y="180" width="128" height="28" rx="6" fill="#f1f5f9" />
      <text x="104" y="90" fontFamily="system-ui,sans-serif" fontSize="11" fill="#1d4ed8" textAnchor="middle">
        Inbox
      </text>
      <text x="104" y="126" fontFamily="system-ui,sans-serif" fontSize="11" fill="#64748b" textAnchor="middle">
        Questions
      </text>
      <text x="104" y="162" fontFamily="system-ui,sans-serif" fontSize="11" fill="#64748b" textAnchor="middle">
        Answers
      </text>
      <text x="104" y="198" fontFamily="system-ui,sans-serif" fontSize="11" fill="#64748b" textAnchor="middle">
        Apps
      </text>
      <rect x="200" y="48" width="480" height="48" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="220" y="78" fontFamily="system-ui,sans-serif" fontSize="14" fontWeight="600" fill="#0f172a">
        Inbox - checkout feedback
      </text>
      <rect x="200" y="112" width="320" height="72" rx="10" fill="#eff6ff" />
      <text x="220" y="140" fontFamily="system-ui,sans-serif" fontSize="12" fill="#1e293b">
        User: Payment failed on iOS
      </text>
      <text x="220" y="160" fontFamily="system-ui,sans-serif" fontSize="11" fill="#64748b">
        2 min ago - App: Storefront
      </text>
      <rect x="536" y="112" width="144" height="72" rx="10" fill="#f0fdf4" />
      <text
        x="608"
        y="148"
        fontFamily="system-ui,sans-serif"
        fontSize="11"
        fill="#166534"
        textAnchor="middle"
      >
        Reply sent
      </text>
      <rect x="200" y="200" width="480" height="140" rx="10" fill="#fafafa" stroke="#e5e7eb" />
      <text x="220" y="228" fontFamily="system-ui,sans-serif" fontSize="12" fontWeight="600" fill="#334155">
        Team access
      </text>
      <text x="220" y="252" fontFamily="system-ui,sans-serif" fontSize="11" fill="#64748b">
        Assign admins &amp; viewers per app
      </text>
      <rect x="220" y="268" width="100" height="24" rx="6" fill="#e0e7ff" />
      <rect x="332" y="268" width="100" height="24" rx="6" fill="#e0e7ff" />
      <text x="270" y="284" fontFamily="system-ui,sans-serif" fontSize="10" fill="#3730a3" textAnchor="middle">
        dev@co.com
      </text>
      <text x="382" y="284" fontFamily="system-ui,sans-serif" fontSize="10" fill="#3730a3" textAnchor="middle">
        pm@co.com
      </text>
    </svg>
  );
}
