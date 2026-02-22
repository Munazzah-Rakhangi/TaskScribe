import { jsPDF } from "jspdf";

type ActionItem = {
  id: number;
  task: string;
  owner?: string | null;
  deadline?: string | null;
};

type Meeting = {
  title: string;
  transcript: string;
  summary?: string | null;
  created_at: string | null;
  action_items: ActionItem[];
};

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function exportMeetingToPdf(meeting: Meeting): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;
  const lineHeight = 6;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(meeting.title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * lineHeight + 4;

  // Meta
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (meeting.created_at) {
    doc.text(`Created: ${new Date(meeting.created_at).toLocaleString()}`, margin, y);
    y += lineHeight + 6;
  }

  // Meeting notes
  if (meeting.summary) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Meeting Notes", margin, y);
    y += lineHeight + 2;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, meeting.summary, margin, y, maxWidth, lineHeight);
    y += 8;
  }

  // Action items
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Action Items", margin, y);
  y += lineHeight + 2;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (meeting.action_items.length > 0) {
    meeting.action_items.forEach((item, i) => {
      const taskText = `${i + 1}. ${item.task}`;
      const meta = [item.owner && `Owner: ${item.owner}`, item.deadline && `Deadline: ${item.deadline}`]
        .filter(Boolean)
        .join(" • ");
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      y = wrapText(doc, taskText, margin, y, maxWidth, lineHeight);
      if (meta) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        y = wrapText(doc, meta, margin + 5, y, maxWidth - 5, lineHeight - 1);
        doc.setTextColor(0, 0, 0);
        y += 2;
      } else {
        y += 2;
      }
    });
    y += 6;
  } else {
    doc.text("No action items.", margin, y);
    y += lineHeight + 6;
  }

  // Transcript (may span multiple pages)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  if (y > 250) {
    doc.addPage();
    y = margin;
  }
  doc.text("Transcript", margin, y);
  y += lineHeight + 2;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const transcriptLines = doc.splitTextToSize(meeting.transcript, maxWidth);
  transcriptLines.forEach((line: string) => {
    if (y > 280) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight - 1;
  });

  // Save
  const filename = `${meeting.title.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.pdf`;
  doc.save(filename);
}
