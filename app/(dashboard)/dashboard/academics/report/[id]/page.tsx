"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getReportFull } from "@/lib/api";
import { useSchool } from "@/lib/queries/school";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";

// ── Helpers ───────────────────────────────────────────────────

function gradeFromScore(pct: number): string {
  if (pct >= 70) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  if (pct >= 30) return "E";
  return "F";
}

function remarkFromScore(pct: number): string {
  if (pct >= 70) return "Excellent";
  if (pct >= 60) return "Very Good";
  if (pct >= 50) return "Good";
  if (pct >= 40) return "Pass";
  if (pct >= 30) return "Fair";
  return "Fail";
}

function ordinal(n: number): string {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v-20)%10] ?? s[v] ?? s[0]);
}

function formatDate(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day:"numeric", month:"long", year:"numeric" });
}

function age(dob?: string): string {
  if (!dob) return "—";
  const yrs = Math.floor((Date.now() - new Date(dob).getTime()) / (1000*60*60*24*365.25));
  return `${yrs}yrs`;
}

function termLabel(term: string): string {
  return term.charAt(0).toUpperCase() + term.slice(1) + " Term";
}

function RatingRow({ label, value }: { label: string; value?: number }) {
  return (
    <tr className="border-b border-gray-300">
      <td className="py-0.5 px-1 text-left" style={{fontSize:"8px"}}>{label}</td>
      {[5,4,3,2,1].map((n) => (
        <td key={n} className="py-0.5 text-center border-l border-gray-300" style={{fontSize:"8px",width:"18px"}}>
          {value === n ? "✓" : ""}
        </td>
      ))}
    </tr>
  );
}

// ── Report Card ───────────────────────────────────────────────

function ReportCard() {
  const params = useParams<{id: string}>();
  const { data: full, isLoading, error } = useQuery({
    queryKey: ["report-full", params.id],
    queryFn:  () => getReportFull(params.id),
    enabled:  !!params.id,
  });
  console.log("fill==", full)
  
  const { data: school } = useSchool();

  if (isLoading) {
    return (
      <div style={{minHeight:"297mm"}} className="flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !full) {
    return (
      <div style={{minHeight:"297mm"}} className="flex items-center justify-center text-red-600 text-sm">
        Failed to load report card. Please go back and try again.
      </div>
    );
  }

  const { report, scores, classSize, classHighest, classLowest, classAverage, totalObtained, totalObtainable } = full;
  const student       = report.student;
  const cls           = report.class;
  const avgPct        = Number(report.average);
  const overallGrade  = gradeFromScore(avgPct);
  const overallRemark = remarkFromScore(avgPct);
  const pctTage       = totalObtainable > 0 ? ((totalObtained / totalObtainable) * 100).toFixed(1) : "0.0";

  const gradeCounts: Record<string,number> = {};
  for (const s of scores) {
    const g = s.grade ?? gradeFromScore(Number(s.totalScore));
    gradeCounts[g] = (gradeCounts[g] ?? 0) + 1;
  }

  const affective = [
    { label: "Attentiveness",            value: report.conduct       },
    { label: "Honesty",                   value: undefined            },
    { label: "Neatness",                  value: report.neatness      },
    { label: "Politeness",                value: undefined            },
    { label: "Punctuality/Assembly",      value: report.punctuality   },
    { label: "Self Control/Calmness",     value: undefined            },
    { label: "Obedience",                 value: undefined            },
    { label: "Reliability",               value: undefined            },
    { label: "Sense Of Responsibility",   value: undefined            },
    { label: "Relationship With Others",  value: undefined            },
  ];

  const psychomotor = [
    { label: "Handling Of Tools", value: undefined },
    { label: "Drawing/Painting",  value: undefined },
    { label: "Handwriting",       value: undefined },
    { label: "Public Speaking",   value: undefined },
    { label: "Speech Fluency",    value: undefined },
    { label: "Sports & Games",    value: undefined },
  ];

  const cellStyle = { border:"1px solid #999", padding:"2px 4px", fontSize:"9px" };
  const headStyle = { ...cellStyle, fontWeight:"bold", backgroundColor:"#f0f0f0", textAlign:"center" as const };

  return (
    <div style={{
      width:"210mm", minHeight:"297mm", margin:"0 auto",
      padding:"10mm 12mm", fontFamily:"serif", fontSize:"10px",
      backgroundColor:"white", color:"black",
    }}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"16px",marginBottom:"6px"}}>
        {school?.logoUrl && (
          <Image
              src={school.logoUrl}
              alt="logo"
              width={50}
              height={50}
              style={{ objectFit: "contain" }}
            />
        )}
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"16px",fontWeight:"bold",textTransform:"uppercase",letterSpacing:"1px"}}>
            {school?.name ?? "School Name"}
          </div>
          {school?.address && <div style={{fontSize:"8px"}}>{school.address}</div>}
          {school?.phone  && <div style={{fontSize:"8px"}}>TEL: {school.phone}</div>}
        </div>
      </div>

      <div style={{textAlign:"center",fontWeight:"bold",fontSize:"11px",textTransform:"uppercase",
        borderTop:"1px solid black",borderBottom:"1px solid black",padding:"3px 0",marginBottom:"6px"}}>
        {termLabel(report.term)} Student's Performance Report — {report.academicYear}
      </div>

      {/* Student info */}
      <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid black",marginBottom:"6px"}}>
        <tbody>
          <tr>
            <td style={{...cellStyle,width:"70px",fontWeight:"bold"}}>NAME:</td>
            <td style={{...cellStyle,fontWeight:"bold",textTransform:"uppercase"}}>
              {student.lastName}, {student.firstName} {student.middleName ?? ""}
            </td>
            <td style={{...cellStyle,width:"60px",fontWeight:"bold"}}>GENDER:</td>
            <td style={{...cellStyle,textTransform:"uppercase"}}>{student.gender ?? "—"}</td>
            <td rowSpan={3} style={{...cellStyle,width:"70px",textAlign:"center",verticalAlign:"middle"}}>
              {student.photoUrl
                ? 
                <Image
                    src={student.photoUrl}
                    alt="student"
                    width={600}
                    height={700}
                    style={{ objectFit: "cover" }}
                  />
                : <div style={{width:"60px",height:"70px",border:"1px dashed #ccc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",color:"#aaa"}}>Photo</div>
              }
            </td>
          </tr>
          <tr>
            <td style={{...cellStyle,fontWeight:"bold"}}>CLASS:</td>
            <td style={cellStyle}>{cls.name}</td>
            <td style={{...cellStyle,fontWeight:"bold"}}>SESSION:</td>
            <td style={cellStyle}>{report.academicYear}</td>
          </tr>
          <tr>
            <td style={{...cellStyle,fontWeight:"bold"}}>ADMISSION NO:</td>
            <td style={cellStyle}>{student.admissionNumber ?? "—"}</td>
            <td style={{...cellStyle,fontWeight:"bold"}}>D.O.B:</td>
            <td style={cellStyle}>{formatDate(student.dateOfBirth)} · Age: {age(student.dateOfBirth)}</td>
          </tr>
        </tbody>
      </table>

      {/* Main 2-column layout */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 170px",gap:"6px"}}>

        {/* LEFT */}
        <div>
          {/* Scores table */}
          <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #999",marginBottom:"4px"}}>
            <thead>
              <tr>
                <th rowSpan={2} style={{...headStyle,textAlign:"left",width:"30%"}}>
                  COGNITIVE DOMAIN<br/>SUBJECTS
                </th>
                <th colSpan={3} style={headStyle}>Marks Obtained</th>
                <th rowSpan={2} style={headStyle}>Grade</th>
                <th rowSpan={2} style={headStyle}>Position</th>
                <th rowSpan={2} style={headStyle}>Remarks</th>
                <th rowSpan={2} style={headStyle}>Class Avg</th>
              </tr>
              <tr>
                <th style={{...headStyle,width:"30px"}}>CA</th>
                <th style={{...headStyle,width:"36px"}}>EXAM</th>
                <th style={{...headStyle,width:"36px"}}>TOTAL</th>
              </tr>
              <tr style={{backgroundColor:"#f8f8f8"}}>
                <td style={{...cellStyle,color:"#888",fontStyle:"italic",fontSize:"8px"}}>
                  Max scores →
                </td>
                <td style={{...cellStyle,textAlign:"center",color:"#888",fontSize:"8px"}}>
                  {scores[0]?.subject?.maxCaScore ?? 40}
                </td>
                <td style={{...cellStyle,textAlign:"center",color:"#888",fontSize:"8px"}}>
                  {scores[0]?.subject?.maxExamScore ?? 60}
                </td>
                <td style={{...cellStyle,textAlign:"center",color:"#888",fontSize:"8px"}}>100</td>
                <td colSpan={4} style={cellStyle}></td>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => {
                const pct   = Number(s.totalScore);
                const grade = s.grade ?? gradeFromScore(pct);
                return (
                  <tr key={s.id} style={{backgroundColor: i%2===0 ? "white" : "#fafafa"}}>
                    <td style={{...cellStyle,textTransform:"uppercase",fontSize:"8px"}}>{s.subject?.name}</td>
                    <td style={{...cellStyle,textAlign:"center"}}>{Number(s.caScore)}</td>
                    <td style={{...cellStyle,textAlign:"center"}}>{Number(s.examScore)}</td>
                    <td style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>{pct}</td>
                    <td style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>{grade}</td>
                    <td style={{...cellStyle,textAlign:"center"}}>—</td>
                    <td style={{...cellStyle,textAlign:"center",fontSize:"8px",textTransform:"uppercase"}}>{remarkFromScore(pct)}</td>
                    <td style={{...cellStyle,textAlign:"center"}}>{classAverage.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Performance summary */}
          <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #999",marginBottom:"4px"}}>
            <thead>
              <tr>
                <th colSpan={4} style={{...headStyle,textAlign:"center",textTransform:"uppercase",fontSize:"8px"}}>
                  Performance Summary
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={cellStyle}>Total Obtained:</td>
                <td style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>{totalObtained}</td>
                <td style={cellStyle}>%TAGE</td>
                <td style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>{pctTage}%</td>
              </tr>
              <tr>
                <td style={cellStyle}>Total Obtainable:</td>
                <td style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>{totalObtainable}</td>
                <td style={cellStyle}>GRADE</td>
                <td style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>{overallGrade}</td>
              </tr>
              <tr>
                <td colSpan={2} style={{...headStyle,textAlign:"center",textTransform:"uppercase",fontSize:"8px"}}>OVERALL REMARK</td>
                <td colSpan={2} style={{...cellStyle,textAlign:"center",fontWeight:"bold",textTransform:"uppercase",fontSize:"10px",color:"#1a3a5c"}}>
                  {overallRemark}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Grade scale */}
          <div style={{border:"1px solid #999",padding:"4px",marginBottom:"4px"}}>
            <div style={{fontWeight:"bold",fontSize:"8px",textTransform:"uppercase",marginBottom:"2px"}}>Grade Scale</div>
            <div style={{fontSize:"8px"}}>
              70-100%=A(EXCELLENT) · 60-69.9%=B(VERY GOOD) · 50-59.9%=C(GOOD) · 40-49.9%=D(PASS) · 30-39.9%=E(FAIR) · 0-29.9%=F(WEAK)
            </div>
          </div>

          {/* Grade analysis */}
          <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #999"}}>
            <thead>
              <tr>
                <th colSpan={7} style={{...headStyle,textTransform:"uppercase",fontSize:"8px"}}>Grade Analysis</th>
              </tr>
              <tr>
                {["GRADE","A","B","C","D","E","F"].map((h) => (
                  <th key={h} style={headStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{...cellStyle,textAlign:"center"}}>No.</td>
                {["A","B","C","D","E","F"].map((g) => (
                  <td key={g} style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>
                    {gradeCounts[g] ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td colSpan={3} style={{...cellStyle,fontSize:"8px"}}>TOTAL SUBJECTS OFFERED</td>
                <td colSpan={4} style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>{scores.length}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RIGHT panels */}
        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>

          {/* Attendance */}
          <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #999"}}>
            <thead>
              <tr>
                <th colSpan={2} style={{...headStyle,textTransform:"uppercase",fontSize:"8px"}}>Attendance Summary</th>
              </tr>
            </thead>
            <tbody>
              {[
                "No. of Times School Opened",
                "No. of Times Present",
                "No. of Times Absent",
              ].map((label) => (
                <tr key={label}>
                  <td style={{...cellStyle,fontSize:"8px"}}>{label}</td>
                  <td style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>—</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Affective */}
          <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #999"}}>
            <thead>
              <tr>
                <th style={{...headStyle,textAlign:"left",textTransform:"uppercase",fontSize:"8px"}}>Affective Domain</th>
                {[5,4,3,2,1].map((n) => <th key={n} style={{...headStyle,width:"16px"}}>{n}</th>)}
              </tr>
            </thead>
            <tbody>
              {affective.map((t) => <RatingRow key={t.label} label={t.label} value={t.value} />)}
            </tbody>
          </table>

          {/* Psychomotor */}
          <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #999"}}>
            <thead>
              <tr>
                <th style={{...headStyle,textAlign:"left",textTransform:"uppercase",fontSize:"8px"}}>Psychomotor Domain</th>
                {[5,4,3,2,1].map((n) => <th key={n} style={{...headStyle,width:"16px"}}>{n}</th>)}
              </tr>
            </thead>
            <tbody>
              {psychomotor.map((t) => <RatingRow key={t.label} label={t.label} value={t.value} />)}
            </tbody>
          </table>

          {/* Rating indices */}
          <div style={{border:"1px solid #999",padding:"4px",fontSize:"7px"}}>
            <div style={{fontWeight:"bold",marginBottom:"2px"}}>Rating Indices</div>
            <div>5 - Excellent degree of Observable traits.</div>
            <div>4 - High level of Observable traits.</div>
            <div>3 - Acceptable level of Observable traits.</div>
            <div>2 - Minimal regard for Observable traits.</div>
            <div>1 - No regard for Observable traits.</div>
          </div>

          {/* Class stats */}
          <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #999"}}>
            <tbody>
              {[
                ["Class Size",    classSize],
                ["Class Highest", `${classHighest}%`],
                ["Class Lowest",  `${classLowest}%`],
                ["Class Average", `${classAverage.toFixed(1)}%`],
                ["Student Position", report.position ? ordinal(report.position) : "—"],
              ].map(([label, val]) => (
                <tr key={label as string}>
                  <td style={{...cellStyle,fontSize:"8px"}}>{label}</td>
                  <td style={{...cellStyle,textAlign:"center",fontWeight:"bold"}}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher remark */}
      <div style={{border:"1px solid #999",padding:"4px",marginTop:"6px",fontSize:"9px"}}>
        <span style={{fontWeight:"bold"}}>Teacher's Remark: </span>
        <span style={{fontStyle:"italic"}}>{report.teacherComment ?? ""}</span>
      </div>

      {/* Principal remark */}
      <div style={{border:"1px solid #999",padding:"4px",marginTop:"3px",fontSize:"9px"}}>
        <span style={{fontWeight:"bold"}}>Principal's Remark: </span>
        <span style={{fontStyle:"italic"}}></span>
      </div>

      {/* Signatures */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginTop:"4px"}}>
        {[["Teacher's Name","Teacher's Sign"],["Principal's Name","Principal's Sign"]].map(([name, sign]) => (
          <div key={name} style={{border:"1px solid #999",padding:"4px",fontSize:"9px"}}>
            <div><span style={{fontWeight:"bold"}}>{name}:</span> _________________________</div>
            <div style={{marginTop:"4px"}}><span style={{fontWeight:"bold"}}>{sign}:</span> _________________________</div>
          </div>
        ))}
      </div>

      {/* Next term */}
      <div style={{border:"1px solid #999",padding:"4px",marginTop:"3px",fontSize:"9px",textAlign:"center"}}>
        <span style={{fontWeight:"bold"}}>Next Term Begins: </span>
        ___________________________________
      </div>

      {/* Footer */}
      <div style={{textAlign:"center",fontSize:"7px",color:"#888",marginTop:"6px"}}>
        Generated by ReportRun · {school?.name} · {new Date().toLocaleDateString("en-NG")}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function ReportCardPage() {
  const router = useRouter();

  return (
    <>
      {/* Controls */}
      <div className="print:hidden flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to academics
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white text-sm font-medium rounded hover:bg-navy-700 transition-colors cursor-pointer"
        >
          <Printer size={15} />
          Print / Save as PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body  { margin: 0 !important; background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="print:bg-white bg-gray-100 min-h-screen py-6 print:py-0">
        <ReportCard />
      </div>
    </>
  );
}