import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Course } from "../types";
import {
  Book,
  GraduationCap,
  ArrowRight,
  ArrowUpRight,
  Shield,
  Zap,
  Layout as LayoutIcon,
  Play,
  Users,
  Award,
  BookOpen,
  BarChart2,
  CheckCircle2,
} from "lucide-react";

/* ─── INJECTED GLOBAL CSS ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

  .et-root {
    font-family: 'Poppins', sans-serif;
    --yellow: #F5E642;
    --yellow-dark: #d9cb00;
    --black: #111111;
    --black-soft: #1a1a1a;
    --gray-100: #f5f5f5;
    --gray-200: #e8e8e8;
    --gray-400: #999999;
    --gray-600: #666666;
    --white: #ffffff;
    --radius-card: 18px;
    --radius-icon: 16px;
  }

  /* ── Nav pill active ── */
  .et-nav-pill {
    background: var(--black);
    color: var(--white);
    border-radius: 999px;
    padding: 6px 18px;
    font-size: 13px;
    font-weight: 600;
  }
  .et-nav-link {
    color: var(--black);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }
  .et-nav-link:hover { color: var(--gray-600); }

  /* ── CTA Button ── */
  .et-btn-yellow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--yellow);
    color: var(--black);
    font-weight: 700;
    font-size: 14px;
    padding: 12px 26px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s;
  }
  .et-btn-yellow:hover {
    background: var(--yellow-dark);
    transform: translateY(-1px);
  }
  .et-btn-yellow:active { transform: translateY(0); }

  /* ── Outlined pill button ── */
  .et-btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    color: var(--black);
    font-weight: 600;
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 999px;
    border: 1.5px solid var(--black);
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s, color 0.2s;
  }
  .et-btn-outline:hover {
    background: var(--black);
    color: var(--white);
  }

  /* ── Hero image tiles ── */
  .et-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 16px;
  }
  .et-play-ring {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--white);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 24px rgba(0,0,0,0.12);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .et-play-ring:hover {
    transform: scale(1.08);
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  }

  /* ── Stat number ── */
  .et-stat-num {
    font-family: 'Poppins', sans-serif;
    font-weight: 800;
    font-size: 32px;
    color: var(--black);
    line-height: 1;
  }
  .et-stat-label {
    font-size: 12px;
    color: var(--gray-400);
    font-weight: 500;
    margin-top: 4px;
  }

  /* ── Section label ── */
  .et-section-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--gray-400);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* ── Service icon box ── */
  .et-icon-box {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-icon);
    background: var(--black-soft);
    color: var(--white);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.25s;
  }
  .et-icon-box:hover { background: #333; }

  /* ── Arrow link ── */
  .et-arrow-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid var(--gray-200);
    color: var(--black);
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
    cursor: pointer;
  }
  .et-arrow-link:hover {
    background: var(--black);
    border-color: var(--black);
    color: var(--white);
    transform: translateY(-2px);
  }

  /* ── Course card ── */
  .et-course-card {
    background: var(--white);
    border: 1.5px solid var(--gray-200);
    border-radius: var(--radius-card);
    padding: 24px;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
    cursor: pointer;
  }
  .et-course-card:hover {
    border-color: var(--yellow);
    box-shadow: 0 8px 32px rgba(0,0,0,0.07);
    transform: translateY(-3px);
  }

  /* ── Fade in up ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .et-reveal {
    opacity: 0;
    animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) forwards;
  }
  .et-d0 { animation-delay: 0s; }
  .et-d1 { animation-delay: 0.1s; }
  .et-d2 { animation-delay: 0.2s; }
  .et-d3 { animation-delay: 0.3s; }
  .et-d4 { animation-delay: 0.42s; }
  .et-d5 { animation-delay: 0.54s; }

  /* ── Divider line ── */
  .et-divider {
    width: 40px;
    height: 3px;
    background: var(--black);
    border-radius: 2px;
  }
`;

function useGlobalStyle() {
  useEffect(() => {
    if (document.getElementById("et-css")) return;
    const t = document.createElement("style");
    t.id = "et-css";
    t.textContent = GLOBAL_CSS;
    document.head.appendChild(t);
  }, []);
}

/* ─── SVG placeholder images (generated inline shapes) ─── */
const PlaceholderImage = ({
  seed,
  style,
}: {
  seed: number;
  style?: React.CSSProperties;
}) => {
  const colors = [
    ["#e8d5a0", "#c4a44a", "#8b6914"],
    ["#a8d5ba", "#5aaa7e", "#2d6b4a"],
    ["#d4c5e9", "#9b7ec8", "#6a4ca0"],
    ["#f0c8a0", "#d4854a", "#a05520"],
  ];
  const c = colors[seed % colors.length];
  return (
    <svg
      viewBox="0 0 400 300"
      style={{ ...style, display: "block" }}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="300" fill={c[0]} />
      <ellipse
        cx={80 + seed * 40}
        cy={120}
        rx={90}
        ry={70}
        fill={c[1]}
        opacity={0.6}
      />
      <ellipse
        cx={300 - seed * 20}
        cy={200}
        rx={70}
        ry={50}
        fill={c[2]}
        opacity={0.5}
      />
      <rect
        x={seed * 30}
        y={40}
        width={60}
        height={60}
        rx={12}
        fill={c[1]}
        opacity={0.4}
      />
    </svg>
  );
};

/* ─────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────── */
const PublicHome: React.FC = () => {
  useGlobalStyle();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("courses").select("*").limit(6);
      if (data) setCourses(data);
    };
    fetchData();
  }, []);

  const services = [
    {
      icon: <BookOpen size={22} />,
      title: "Manajemen Tugas",
      desc: "Kelola seluruh penugasan kuliah dengan sistem yang terorganisir dan mudah diakses kapan saja.",
    },
    {
      icon: <LayoutIcon size={22} />,
      title: "UI/UX Akademik",
      desc: "Antarmuka yang dirancang untuk pengalaman belajar yang intuitif dan nyaman bagi mahasiswa.",
    },
    {
      icon: <Zap size={22} />,
      title: "Penilaian Otomatis",
      desc: "Sistem grading instan untuk kuis dan ujian yang memberikan feedback real-time kepada mahasiswa.",
    },
    {
      icon: <BarChart2 size={22} />,
      title: "Analitik Akademik",
      desc: "Pantau perkembangan nilai dan tugas secara mendalam melalui dashboard yang informatif.",
    },
  ];

  return (
    <div
      className="et-root"
      style={{
        background: "var(--white)",
        color: "var(--black)",
        minHeight: "100vh",
      }}
    >
      {/* ────────── NAVBAR ────────── */}
      <header
        style={{
          padding: "18px 0",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--white)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "var(--black)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap size={18} color="var(--yellow)" />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-0.02em",
              }}
            >
              SIM TUGAS
            </span>
          </div>

          {/* CTA */}
          <Link
            to="/login"
            className="et-btn-yellow"
            style={{ padding: "10px 22px", fontSize: 13 }}
          >
            Masuk Sistem
          </Link>
        </div>
      </header>

      {/* ────────── HERO ────────── */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 60px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: 48,
            alignItems: "start",
          }}
        >
          {/* LEFT — text */}
          <div style={{ paddingTop: 16 }}>
            <h1
              className="et-reveal et-d0"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.4rem, 5vw, 3.2rem)",
                lineHeight: 1.12,
                letterSpacing: "-0.03em",
                color: "var(--black)",
                margin: 0,
              }}
            >
              SISTEM INFORMASI
              <br />
              MANAJEMEN TUGAS
              <br />
            </h1>
            <p
              className="et-reveal et-d1"
              style={{
                fontSize: 13,
                color: "var(--gray-600)",
                lineHeight: 1.6,
                marginTop: 20,
                maxWidth: 340,
                fontWeight: 400,
              }}
            >
              Platform akademik modern untuk Kelola tugas, ujian, dan nilai
              dengan sistem yang cerdas dan efisien.
            </p>

            {/* CTA button */}
            <div className="et-reveal et-d2" style={{ marginTop: 28 }}>
              <Link to="/login" className="et-btn-yellow">
                Get Started <ArrowRight size={15} />
              </Link>
            </div>

            {/* Bottom-left: play row */}
            <div
              className="et-reveal et-d3"
              style={{
                marginTop: 48,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div className="et-play-ring">
                <Play
                  size={18}
                  fill="var(--black)"
                  color="var(--black)"
                  style={{ marginLeft: 2 }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--gray-600)",
                  fontWeight: 500,
                }}
              >
                Our working process
              </span>
            </div>
          </div>

          {/* RIGHT — image collage + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Top row: large left + small right stack */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gridTemplateRows: "160px 100px",
                gap: 12,
              }}
            >
              {/* Big image spanning 2 rows */}
              <div
                style={{
                  gridRow: "1 / 3",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <PlaceholderImage
                  seed={0}
                  style={{ width: "100%", height: "100%", borderRadius: 16 }}
                />
              </div>
              {/* Top-right */}
              <div style={{ borderRadius: 16, overflow: "hidden" }}>
                <PlaceholderImage
                  seed={1}
                  style={{ width: "100%", height: "100%", borderRadius: 16 }}
                />
              </div>
              {/* Bottom-right */}
              <div style={{ borderRadius: 16, overflow: "hidden" }}>
                <PlaceholderImage
                  seed={2}
                  style={{ width: "100%", height: "100%", borderRadius: 16 }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div
              style={{
                display: "flex",
                gap: 40,
                paddingTop: 12,
                paddingLeft: 4,
              }}
            >
              {[
                { num: "10+", label: "Tahun Pengalaman" },
                { num: "600+", label: "Mahasiswa Aktif" },
                { num: "800+", label: "Tugas Diselesaikan" },
              ].map((s, i) => (
                <div key={i} className={`et-reveal et-d${i + 3}`}>
                  <div className="et-stat-num">{s.num}</div>
                  <div className="et-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────────── DIVIDER ────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ borderTop: "1px solid var(--gray-200)" }} />
      </div>

      {/* ────────── SERVICES ────────── */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 90px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "start",
          }}
        >
          {/* LEFT — heading block */}
          <div>
            <p className="et-section-label" style={{ marginBottom: 16 }}>
              Our Services
            </p>
            <h2
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "var(--black)",
                margin: 0,
              }}
            >
              Elevate Your Brand
              <br />
              Ignite Your Success
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--gray-600)",
                lineHeight: 1.7,
                marginTop: 18,
                maxWidth: 360,
              }}
            >
              Sistem pendidikan terpadu yang dirancang untuk mendorong
              keberhasilan akademik mahasiswa.
            </p>
            <div style={{ marginTop: 24 }}>
              <a
                href="#courses"
                className="et-btn-yellow"
                style={{ display: "inline-flex" }}
              >
                Lihat Lengkap
              </a>
            </div>
          </div>

          {/* RIGHT — 2x2 service grid */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}
          >
            {services.map((s, i) => (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* icon row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <div className="et-icon-box">{s.icon}</div>
                  <a href="#" className="et-arrow-link">
                    <ArrowUpRight size={16} />
                  </a>
                </div>
                {/* text */}
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: "var(--black)",
                      margin: 0,
                    }}
                  >
                    {s.title}
                  </p>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: "var(--gray-600)",
                      lineHeight: 1.6,
                      marginTop: 6,
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── COURSES (Bonus section) ────────── */}
      <div style={{ background: "var(--gray-100)" }}>
        <section
          id="courses"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "80px 24px 90px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 40,
            }}
          >
            <div>
              <p className="et-section-label" style={{ marginBottom: 10 }}>
                Katalog
              </p>
              <h2
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                  lineHeight: 1.25,
                  letterSpacing: "-0.02em",
                  color: "var(--black)",
                  margin: 0,
                }}
              >
                Mata Kuliah Aktif
              </h2>
            </div>
            <a href="#" className="et-btn-outline">
              Lihat Semua <ArrowRight size={14} />
            </a>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {courses.map((course, idx) => (
              <div key={course.id} className="et-course-card">
                {/* top row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      background: "var(--yellow)",
                      color: "var(--black)",
                      padding: "4px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {course.code}
                  </span>
                  <a
                    href="#"
                    className="et-arrow-link"
                    style={{ width: 32, height: 32 }}
                  >
                    <ArrowUpRight size={14} />
                  </a>
                </div>
                {/* name */}
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: "var(--black)",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {course.name}
                </p>
                {/* footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid var(--gray-200)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: "var(--gray-400)",
                      fontWeight: 500,
                    }}
                  >
                    <Book size={13} /> Materi Terintegrasi
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#16a34a",
                    }}
                  >
                    <CheckCircle2 size={12} /> Aktif
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ────────── FOOTER ────────── */}
      <footer
        style={{
          background: "var(--black)",
          color: "var(--white)",
          padding: "56px 24px 36px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 40,
              flexWrap: "wrap",
            }}
          >
            {/* Brand */}
            <div style={{ maxWidth: 260 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "var(--yellow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GraduationCap size={18} color="var(--black)" />
                </div>
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  SIM TUGAS
                </span>
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--gray-400)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Smart solution for modern academic management. Built for Teknik
                Informatika students.
              </p>
            </div>

            {/* Link columns */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 120px)",
                gap: 32,
              }}
            >
              {[
                { heading: "Platform", links: ["Fitur", "Mata Kuliah", "FAQ"] },
                {
                  heading: "Akun",
                  links: ["Login", "Daftar", "Reset Password"],
                },
                {
                  heading: "Info",
                  links: ["Tentang Kami", "Privasi", "Syarat"],
                },
              ].map((col, i) => (
                <div key={i}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--gray-400)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 14,
                      margin: "0 0 14px",
                    }}
                  >
                    {col.heading}
                  </p>
                  {col.links.map((l, j) => (
                    <a
                      key={j}
                      href="#"
                      style={{
                        display: "block",
                        fontSize: 13,
                        color: "#888",
                        textDecoration: "none",
                        marginBottom: 10,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLElement).style.color = "var(--white)")
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.color = "#888")
                      }
                    >
                      {l}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              marginTop: 48,
              paddingTop: 20,
              borderTop: "1px solid #222",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: 12, color: "#555", margin: 0 }}>
              © 2026 Sistem Informasi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicHome;
