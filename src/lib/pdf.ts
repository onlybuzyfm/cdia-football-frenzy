import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StandingRow } from "@/lib/tournament";
import type { Tables } from "@/integrations/supabase/types";

export function exportStandingsPDF(groups: Array<{ title: string; rows: StandingRow[] }>) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Juego CDIA · Segunda Edición", 14, 16);
  doc.setFontSize(11);
  doc.text("Tabla de posiciones", 14, 23);

  let y = 30;
  for (const g of groups) {
    doc.setFontSize(13);
    doc.text(g.title, 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["#", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "PTS"]],
      body: g.rows.map((r, i) => [
        i + 1,
        r.team.name,
        r.pj,
        r.pg,
        r.pe,
        r.pp,
        r.gf,
        r.gc,
        r.dg,
        r.pts,
      ]),
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 },
    });
    // @ts-expect-error lastAutoTable injected by plugin
    y = (doc.lastAutoTable?.finalY ?? y) + 10;
  }
  doc.setFontSize(9);
  doc.text("Desarrollado por PerceptIA", 14, 290);
  doc.save("tabla-posiciones-cdia.pdf");
}

export function exportFixturePDF(
  matches: Tables<"matches">[],
  teams: Tables<"teams">[],
) {
  const byId = new Map(teams.map((t) => [t.id, t.name]));
  const phaseLabel: Record<string, string> = {
    group: "Fase de grupos",
    semifinal: "Semifinales",
    third_place: "Tercer lugar",
    final: "Final",
  };
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Juego CDIA · Segunda Edición", 14, 16);
  doc.setFontSize(11);
  doc.text("Fixture del torneo", 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["Fase", "Grupo", "Fecha", "Hora", "Local", "Visitante", "Resultado"]],
    body: matches.map((m) => [
      phaseLabel[m.phase] ?? m.phase,
      m.group_name ?? "-",
      m.match_date ?? "-",
      m.match_time ?? "-",
      byId.get(m.home_team_id ?? "") ?? "Por definir",
      byId.get(m.away_team_id ?? "") ?? "Por definir",
      m.played ? `${m.home_score} - ${m.away_score}` : "-",
    ]),
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 8 },
  });
  doc.setFontSize(9);
  doc.text("Desarrollado por PerceptIA", 14, 290);
  doc.save("fixture-cdia.pdf");
}