"use client";

export async function exportForecastPDF({ input, result }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210, M = 20;
  let y = 20;

  // Header
  doc.setFillColor(45, 106, 79);
  doc.rect(0, 0, W, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("AgriMart", M, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Crop Validation Report — Botswana Horticulture Intelligence", M + 28, 12);

  y = 30;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${input.crop} — Viability Report`, M, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date(result.generatedAt).toLocaleString("en-BW")}`, M, y);

  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(M, y, W - M, y);
  y += 8;

  // Score
  doc.setTextColor(45, 106, 79);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text(`${result.viabilityScore}/100`, M, y + 8);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(result.revenueBand + " outlook", M + 42, y + 8);

  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const splitSummary = doc.splitTextToSize(result.summary, W - M * 2);
  doc.text(splitSummary, M, y);
  y += splitSummary.length * 5 + 6;

  // Farm inputs
  doc.setFillColor(245, 247, 245);
  doc.rect(M, y, W - M * 2, 50, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(45, 106, 79);
  doc.text("Farm Parameters", M + 4, y + 7);

  const params = [
    ["Crop", input.crop],
    ["Farm size", `${input.hectares} ha`],
    ["Water source", input.waterSource],
    ["Investment level", input.investment],
    ["Labour type", input.labor],
    ["Soil health", input.soilHealth],
    ["Market target", input.marketTarget],
    ["Planning horizon", `${input.horizonMonths} months`],
  ];

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const colW = (W - M * 2 - 8) / 2;
  params.forEach(([k, v], i) => {
    const col = i % 2 === 0 ? M + 4 : M + 4 + colW;
    const row = y + 14 + Math.floor(i / 2) * 8;
    doc.setFont("helvetica", "bold");
    doc.text(k + ":", col, row);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), col + 28, row);
  });
  y += 56;

  // Risk scores
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Risk Indicators", M, y);
  y += 6;

  const risks = [
    ["Market volatility", result.marketVolatility],
    ["Climate stress", result.climateStress],
    ["Logistics risk", result.logisticsRisk],
  ];
  risks.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(label, M, y + 3);
    doc.setFillColor(230, 230, 230);
    doc.rect(M + 42, y - 2, 80, 6, "F");
    const col = val < 40 ? [82, 183, 136] : val < 65 ? [233, 196, 106] : [230, 57, 70];
    doc.setFillColor(...col);
    doc.rect(M + 42, y - 2, 80 * (val / 100), 6, "F");
    doc.setTextColor(30, 30, 30);
    doc.text(String(val), M + 126, y + 3);
    y += 9;
  });

  y += 4;
  doc.line(M, y, W - M, y);
  y += 8;

  // Watchpoints
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Watchpoints", M, y);
  y += 6;
  result.riskBullets.forEach((b) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(`• ${b}`, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 5 + 2;
  });

  // Footer
  doc.setFillColor(240, 245, 240);
  doc.rect(0, 280, W, 17, "F");
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "italic");
  doc.text(
    "AgriMart pre-season intelligence — indicative only. Validate with a local extension officer before committing inputs. Not financial advice.",
    M, 290
  );

  doc.save(`AgriMart_${input.crop}_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}
